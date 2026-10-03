/**
 * analyseIA.js
 * Service d'analyse IA des images, partagé par tous les écrans Greenshot.
 *
 * Chaîne de fournisseurs (voir FOURNISSEURS_IA) : Groq / Qwen3.6-27B d'abord,
 * Gemini en secours. Chaque fournisseur est réessayé sur erreur temporaire
 * (429 quota, 5xx, timeout réseau) avant de passer au suivant.
 *
 * Clés attendues dans frontend/.env : VITE_GROQ_API_KEY et VITE_GEMINI_API_KEY.
 * Si aucune n'est présente, iaDisponible() retourne false et l'appelant peut
 * afficher un message clair plutôt qu'une erreur réseau.
 *
 * Exports :
 * 1. analyserImageAvecIA — appel générique prompt + images → objet JSON
 *    (utilisé aussi par FormSignalementIA.vue pour la rédaction de signalement)
 * 2. analyserPhotoAvant  — compare la photo originale du signalement avec
 *    la photo "avant nettoyage" prise par le nettoyeur :
 *      • Même environnement / lieu ?
 *      • Déchets encore visibles ?
 *      • Catégorie de déchets correspondante ?
 *
 * 3. analyserPhotoApres  — compare la photo "avant" avec la photo "après" :
 *      • Même environnement / lieu ?
 *      • Zone réellement nettoyée (déchets disparus) ?
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions'
const MODELE = 'gemini-3.8-flash'

// Quotas partagés entre les écrans et entre les citoyens : on réessaie avec un peu de recul
const TENTATIVES_MAX = 3
const DELAIS_RETRY_MS = [0, 1500, 4000]
const DELAI_PAR_APPEL_MS = 45000

// ---------------------------------------------------------------------------
// Helpers de conversion
// ---------------------------------------------------------------------------

/**
 * Convertit un Blob / File en { base64, mimeType } sans le préfixe data:...
 */
function blobVersBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const [metadata, base64] = dataUrl.split(',', 2)
      const mimeType = metadata.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg'
      resolve({ base64, mimeType })
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Télécharge une image depuis une URL publique et la convertit en { base64, mimeType }.
 * Utilisé pour récupérer la photo originale depuis Supabase Storage.
 */
async function urlVersBase64(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Impossible de charger la photo originale (HTTP ${response.status})`)
  const blob = await response.blob()
  return blobVersBase64(blob)
}

// ---------------------------------------------------------------------------
// Appel REST Gemini via l'API Interactions (même pattern que FormSignalementIA.vue)
// ---------------------------------------------------------------------------

/**
 * Construit une erreur appelable par la chaîne de fournisseurs.
 * @param {string} message
 * @param {boolean} temporaire  true pour 429 / 5xx / timeout réseau
 */
function erreurIA(message, temporaire = false) {
  return Object.assign(new Error(message), { temporaire })
}

/**
 * Lit le message d'erreur renvoyé par un fournisseur (formats GEMini et OpenAI).
 */
async function lireDetailErreur(reponse) {
  try {
    const json = await reponse.json()
    return json?.error?.message || json?.message || ''
  } catch {
    return ''
  }
}

// --- Fournisseur 1 : Groq (Qwen3.6-27B, vision, JSON mode, API OpenAI) ---

const FOURNISSEUR_GROQ = {
  nom: 'Groq',
  modele: 'qwen/qwen3.6-27b',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  cle: () => import.meta.env.VITE_GROQ_API_KEY || '',
  supporteSchema: false,
  async appeler(prompt, images) {
    const contenu = [
      { type: 'text', text: prompt },
      ...images.map((img) => ({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
      }))
    ]

    const reponse = await this.requete({
      model: this.modele,
      messages: [{ role: 'user', content: contenu }],
      // Le mode JSON de Groq exige que le prompt mentionne « JSON » : c'est le cas
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1024
    }, 'Groq')

    const json = await reponse.json()
    const texte = json?.choices?.[0]?.message?.content
    if (!texte) throw erreurIA('Réponse Groq vide.')
    return texte
  },
  async requete(corps, libelle) {
    let reponse
    try {
      reponse = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cle()}`
        },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(DELAI_PAR_APPEL_MS)
      })
    } catch (err) {
      throw erreurIA(`Connexion ${libelle} impossible (${err.name || 'erreur réseau'}).`, true)
    }

    if (!reponse.ok) {
      const detail = await lireDetailErreur(reponse)
      const cause =
        reponse.status === 401 || reponse.status === 403
          ? `Clé ${libelle} refusée.`
          : reponse.status === 404
            ? `Modèle ${this.modele} introuvable pour cette clé ${libelle}.`
            : reponse.status === 429
              ? `Quota ${libelle} dépassé.`
              : `${libelle} a refusé la requête.`
      throw erreurIA(
        `${cause} (HTTP ${reponse.status})${detail ? ` — ${detail.slice(0, 400)}` : ''}`,
        reponse.status === 429 || reponse.status >= 500
      )
    }

    return reponse
  }
}

// --- Fournisseur 2 : Gemini (secours, même API que FormSignalementIA.vue) ---

const FOURNISSEUR_GEMINI = {
  nom: 'Gemini',
  modele: MODELE,
  url: INTERACTIONS_URL,
  cle: () => GEMINI_API_KEY || '',
  supporteSchema: true,
  async appeler(prompt, images, options = {}) {
    const reponse = await this.requete({
      model: this.modele,
      input: [
        { type: 'text', text: prompt },
        ...images.map((img) => ({ type: 'image', data: img.base64, mime_type: img.mimeType }))
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        // Le schéma est facultatif : Gemini le comprend, Groq s'appuie sur son mode JSON
        ...(options.schema ? { schema: options.schema } : {})
      },
      store: false
    }, 'Gemini')

    const json = await reponse.json()

    // Lire la réponse comme FormSignalementIA.vue : output_text en priorité, sinon steps
    const texteEtapes = (json.steps || [])
      .filter((step) => step.type === 'model_output')
      .flatMap((step) => step.content || [])
      .filter((content) => content.type === 'text')
      .map((content) => content.text || '')
      .join('\n')

    const texte = json.output_text || texteEtapes
    if (!texte) throw erreurIA('Réponse Gemini vide.')
    return texte
  },
  async requete(corps, libelle) {
    let reponse
    try {
      reponse = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.cle()
        },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(DELAI_PAR_APPEL_MS)
      })
    } catch (err) {
      throw erreurIA(`Connexion ${libelle} impossible (${err.name || 'erreur réseau'}).`, true)
    }

    if (!reponse.ok) {
      const detail = await lireDetailErreur(reponse)
      const cause =
        reponse.status === 401 || reponse.status === 403
          ? 'Clé API refusée ou accès Gemini non autorisé.'
          : reponse.status === 404
            ? 'Modèle Gemini introuvable pour cette clé.'
            : reponse.status === 429
              ? 'Quota Gemini dépassé.'
              : 'Gemini a refusé la requête.'
      throw erreurIA(
        `${cause} (HTTP ${reponse.status})${detail ? ` — ${detail.slice(0, 400)}` : ''}`,
        reponse.status === 429 || reponse.status >= 500
      )
    }

    return reponse
  }
}

const FOURNISSEURS_IA = [FOURNISSEUR_GROQ, FOURNISSEUR_GEMINI]

// ---------------------------------------------------------------------------
// Interrogation : chaîne de fournisseurs (Groq en principal, Gemini en secours)
// ---------------------------------------------------------------------------

/**
 * Interroge les fournisseurs d'IA dans l'ordre jusqu'à obtenir un JSON exploitable.
 * Chaque fournisseur est réessayé sur erreur temporaire (429 / 5xx / timeout réseau),
 * puis on passe au suivant. Sans quoi l'analyse dégrade vers le seul contrôle GPS.
 * @param {string} prompt
 * @param {Array<{base64: string, mimeType: string}>} images
 * @param {{schema?: Object}} options  Schéma JSON (transmis à Gemini, ignoré par Groq)
 * @returns {Promise<Object>} Objet JSON renvoyé par le modèle
 */
async function interroger(prompt, images, options = {}) {
  const providers = FOURNISSEURS_IA.filter((fournisseur) => fournisseur.cle())
  if (providers.length === 0) {
    throw new Error('Aucune clé API IA configurée (VITE_GROQ_API_KEY ou VITE_GEMINI_API_KEY).')
  }

  let derniereErreur = null

  for (const fournisseur of providers) {
    console.log(`🤖 [IA Greenshot] Analyse via ${fournisseur.nom} (${fournisseur.modele})`)

    // Gemini comprend le schéma JSON nativement. Les autres fournisseurs
    // (Groq) ne voient que le texte : on leur décrit donc le schéma attendu.
    const promptEffectif = fournisseur.supporteSchema || !options.schema
      ? prompt
      : `${prompt}\n\nRéponds uniquement avec un objet JSON respectant EXACTEMENT ce schéma :\n${decrireSchema(options.schema)}`

    for (let tentative = 0; tentative < TENTATIVES_MAX; tentative++) {
      const delai = DELAIS_RETRY_MS[tentative]
      if (delai > 0) {
        console.warn(`⏳ [IA Greenshot] ${fournisseur.nom} indisponible, nouvel essai dans ${delai} ms…`)
        await attendre(delai)
      }

      try {
        const texte = await fournisseur.appeler(promptEffectif, images, options)
        return extraireJSON(texte)
      } catch (err) {
        derniereErreur = err

        // Erreur définitive (clé refusée, modèle inconnu) : inutile de réessayer
        const reessayer = err.temporaire || estErreurDeFormat(err)
        if (!reessayer || tentative === TENTATIVES_MAX - 1) break

        if (estErreurDeFormat(err)) {
          console.warn(`⚠️ [IA Greenshot] ${fournisseur.nom} a renvoyé du texte non structuré, nouvel essai…`)
        }
      }
    }

    console.warn(`⚠️ [IA Greenshot] ${fournisseur.nom} écarté : ${messageErreurCourte(derniereErreur)}`)
  }

  throw derniereErreur
}

/**
 * Indique si au moins un fournisseur d'IA est configuré.
 */
export function iaDisponible() {
  return FOURNISSEURS_IA.some((fournisseur) => Boolean(fournisseur.cle()))
}

/**
 * Point d'entrée générique partagé par tous les écrans qui utilisent l'IA
 * (rédaction de signalement et contrôle anti-fraude du nettoyage).
 * @param {string} prompt
 * @param {Array<{base64: string, mimeType: string}>} images
 * @param {{schema?: Object}} options
 * @returns {Promise<Object>}
 */
export async function analyserImageAvecIA(prompt, images, options = {}) {
  return interroger(prompt, images, options)
}

function estErreurDeFormat(err) {
  return /JSON|non structurée/i.test(String(err?.message || ''))
}

/**
 * Rend un schéma JSON lisible par un modèle qui ne gère pas nativement les schémas.
 * @param {Object} schema
 * @returns {string}
 */
function decrireSchema(schema, profondeur = 0) {
  if (!schema || typeof schema !== 'object') return '{}'
  if (profondeur > 3) return '{ ... }'

  if (schema.enum) return schema.enum.map((valeur) => JSON.stringify(valeur)).join(' | ')

  switch (schema.type) {
    case 'object': {
      const proprietes = Object.entries(schema.properties || {})
      if (proprietes.length === 0) return '{}'
      const lignes = proprietes.map(([cle, sousSchema]) => {
        const obligatoire = (schema.required || []).includes(cle) ? 'obligatoire' : 'facultatif'
        return `  "${cle}" (${sousSchema.type}, ${obligatoire}) : ${decrireSchema(sousSchema, profondeur + 1)}`
      })
      return `{\n${lignes.join(',\n')}\n}`
    }
    case 'array':
      return `[ ${decrireSchema(schema.items, profondeur + 1)} ]`
    case 'integer':
    case 'number':
      return 'nombre'
    case 'boolean':
      return 'true ou false'
    default:
      return 'texte'
  }
}

function messageErreurCourte(err, max = 160) {
  const texte = String(err?.message || err || 'erreur inconnue')
  return texte.length > max ? `${texte.slice(0, max)}…` : texte
}

function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Extrait le premier objet JSON complet d'une réponse textuelle Gemini,
 * en ignorant les accolades situées dans les chaînes.
 */
function extraireJSON(texte) {
  const brut = String(texte || '').trim()

  // Essaie d'abord un parse direct (réponse propre)
  try {
    return JSON.parse(brut)
  } catch { /* continue */ }

  const debut = brut.indexOf('{')
  if (debut === -1) throw new Error('Réponse IA non structurée — JSON introuvable.')

  let profondeur = 0
  let dansChaine = false
  let echappe = false

  for (let i = debut; i < brut.length; i++) {
    const caractere = brut[i]

    if (echappe) {
      echappe = false
      continue
    }
    if (caractere === '\\') {
      echappe = true
      continue
    }
    if (caractere === '"') {
      dansChaine = !dansChaine
      continue
    }
    if (dansChaine) continue

    if (caractere === '{') profondeur++
    else if (caractere === '}') {
      profondeur--
      if (profondeur === 0) {
        return JSON.parse(brut.slice(debut, i + 1))
      }
    }
  }

  throw new Error('Réponse IA non structurée — JSON introuvable.')
}

// ---------------------------------------------------------------------------
// 1. Analyse photo AVANT nettoyage
// ---------------------------------------------------------------------------

/**
 * Compare la photo originale du signalement avec la photo "avant nettoyage"
 * prise par le nettoyeur sur place.
 *
 * Détecte trois types de fraude :
 *  – Lieu différent du signalement
 *  – Aucun déchet visible (déjà nettoyé ou photo truquée)
 *  – Catégorie de déchets différente de celle signalée
 *
 * @param {string} photoOrigUrl    URL publique de la photo du signalement
 * @param {File|Blob} photoAvant   Fichier photo pris par le nettoyeur (avant)
 * @param {string} categorieNom    Nom de la catégorie signalée (ex: "Déchets plastiques")
 * @returns {Promise<Object>}
 */
export async function analyserPhotoAvant(photoOrigUrl, photoAvant, categorieNom) {
  const [origData, avantData] = await Promise.all([
    urlVersBase64(photoOrigUrl),
    blobVersBase64(photoAvant)
  ])

  const prompt = `Tu es le système anti-fraude de l'application Greenshot (Burundi).
Ta mission : vérifier qu'un citoyen est bien sur le lieu d'un signalement environnemental AVANT de le nettoyer.

IMAGE 1 — Photo ORIGINALE du signalement de type "${categorieNom}" (référence officielle).
IMAGE 2 — Photo AVANT NETTOYAGE prise par le citoyen qui veut nettoyer.

Analyse ces deux images et réponds UNIQUEMENT avec ce JSON valide (aucun texte avant ou après) :
{
  "meme_lieu": true|false,
  "dechets_visibles": true|false,
  "categorie_correspondante": true|false,
  "fraude_detectee": true|false,
  "raison": "phrase courte en français (15 mots max)",
  "score_confiance": 0-100
}

Règles d'évaluation :
- "meme_lieu" : l'arrière-plan, la disposition et l'environnement des deux photos sont visuellement cohérents (même endroit)
- "dechets_visibles" : des déchets sont clairement présents et visibles sur IMAGE 2
- "categorie_correspondante" : les déchets de IMAGE 2 correspondent à la catégorie "${categorieNom}"
- "fraude_detectee" : true si AU MOINS UNE des conditions suivantes est vraie :
    • meme_lieu = false
    • dechets_visibles = false
    • categorie_correspondante = false
- "raison" : explication brève (en cas de fraude, précise le problème principal)`

  const r = await interroger(prompt, [origData, avantData])
  console.log('🤖 [IA Greenshot - Résultat Analyse Avant]:', r)

  return {
    valide: !versBooleen(r.fraude_detectee),
    fraude: versBooleen(r.fraude_detectee),
    memeLieu: versBooleen(r.meme_lieu),
    dechetsVisibles: versBooleen(r.dechets_visibles),
    categorieOk: versBooleen(r.categorie_correspondante),
    message: typeof r.raison === 'string' ? r.raison.slice(0, 200) : '',
    score: normaliserScore(r.score_confiance)
  }
}

// ---------------------------------------------------------------------------
// 2. Analyse photo APRÈS nettoyage
// ---------------------------------------------------------------------------

/**
 * Compare la photo "avant nettoyage" avec la photo "après nettoyage".
 *
 * Détecte deux types de fraude :
 *  – Lieu différent de la photo "avant" (photo prise ailleurs)
 *  – Zone pas réellement nettoyée (déchets encore présents)
 *
 * @param {File|Blob} photoAvant   Fichier photo pris par le nettoyeur (avant)
 * @param {File|Blob} photoApres   Fichier photo pris par le nettoyeur (après)
 * @returns {Promise<Object>}
 */
export async function analyserPhotoApres(photoAvant, photoApres) {
  const [avantData, apresData] = await Promise.all([
    blobVersBase64(photoAvant),
    blobVersBase64(photoApres)
  ])

  const prompt = `Tu es le système anti-fraude de l'application Greenshot (Burundi).
Ta mission : vérifier qu'un citoyen a bien nettoyé la zone après avoir pris sa photo "avant".

IMAGE 1 — Photo AVANT NETTOYAGE (déchets présents sur place).
IMAGE 2 — Photo APRÈS NETTOYAGE soumise par le citoyen.

Analyse ces deux images et réponds UNIQUEMENT avec ce JSON valide (aucun texte avant ou après) :
{
  "meme_lieu": true|false,
  "zone_nettoyee": true|false,
  "fraude_detectee": true|false,
  "raison": "phrase courte en français (15 mots max)",
  "score_confiance": 0-100
}

Règles d'évaluation :
- "meme_lieu" : l'arrière-plan et l'environnement des deux photos sont visuellement cohérents (même endroit)
- "zone_nettoyee" : les déchets visibles sur IMAGE 1 ne sont plus présents sur IMAGE 2 (zone propre)
- "fraude_detectee" : true si meme_lieu = false OU zone_nettoyee = false
- "raison" : explication brève (en cas de fraude, précise le problème principal)`

  const r = await interroger(prompt, [avantData, apresData])
  console.log('🤖 [IA Greenshot - Résultat Analyse Après]:', r)

  return {
    valide: !versBooleen(r.fraude_detectee),
    fraude: versBooleen(r.fraude_detectee),
    memeLieu: versBooleen(r.meme_lieu),
    zoneNettoyee: versBooleen(r.zone_nettoyee),
    message: typeof r.raison === 'string' ? r.raison.slice(0, 200) : '',
    score: normaliserScore(r.score_confiance)
  }
}

// ---------------------------------------------------------------------------
// Normalisation des réponses du modèle
// ---------------------------------------------------------------------------

/**
 * Convertit une valeur renvoyée par le modèle en booléen.
 * Le modèle peut renvoyer "false", "non" ou "FAUX" : Boolean() les validerait à tort.
 */
function versBooleen(valeur) {
  if (typeof valeur === 'boolean') return valeur
  if (typeof valeur === 'number') return valeur !== 0
  if (typeof valeur === 'string') {
    const normalisee = valeur.trim().toLowerCase()
    return !['false', 'non', 'faux', 'no', '0', ''].includes(normalisee)
  }
  return Boolean(valeur)
}

function normaliserScore(valeur) {
  const score = Number.parseFloat(valeur)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, Math.round(score)))
}
