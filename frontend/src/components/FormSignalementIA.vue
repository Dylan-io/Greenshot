<template>
  <div class="form-signalement-root">
    <form @submit.prevent="soumettreSignalement" class="signalement-form">
      <section class="section-card">
        <div class="section-header">
          <span class="step-badge">1</span>
          <label class="section-title">Photo du problème environnemental <span class="required">*</span></label>
        </div>
        <div v-if="cameraOuverte" class="camera-view">
          <video ref="videoElement" class="camera-video" autoplay playsinline muted></video>
          <div class="camera-actions">
            <button type="button" class="btn-camera btn-camera-capture" @click="prendrePhoto" :disabled="!cameraPrete">
              <span aria-hidden="true">◉</span>
              Capturer la photo
            </button>
            <button type="button" class="btn-camera-cancel" @click="fermerCamera">Annuler</button>
          </div>
        </div>
        <button v-else type="button" class="upload-dropzone" @click="ouvrirCamera" :disabled="generationEnCours || envoiEnCours">
          <span class="dropzone-icon-circle" aria-hidden="true">
            <svg class="camera-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
          <span class="dropzone-label">{{ photoFichier ? 'Reprendre une photo' : 'Ouvrir la caméra' }}</span>
          <span class="dropzone-hint">Capture directe · Aucun accès à la galerie</span>
        </button>

        <div v-if="photoPreview" class="preview-container">
          <img :src="photoPreview" alt="Aperçu photo" class="preview-img" />
        </div>
        <p v-if="photoMetadata.takenAt" class="photo-timestamp">
          Photo capturée le {{ formatDateTime(photoMetadata.takenAt) }}
        </p>
      </section>

      <section class="section-card">
        <div class="section-header">
          <span class="step-badge">2</span>
          <label class="section-title">Localisation GPS <span class="required">*</span></label>
        </div>
        <div v-if="gpsEnCours || adresseEnCours || generationEnCours" class="analysis-status" aria-live="polite">
          <span class="loading-indicator" aria-hidden="true"></span>
          {{ gpsEnCours ? 'Récupération de la position GPS…' : adresseEnCours ? 'Recherche de la ville et du quartier…' : 'Analyse de la photo et rédaction de la proposition…' }}
        </div>

        <div v-if="gpsCoordonnees" class="gps-card gps-success">
          <div class="gps-icon-circle"><Icone nom="localisation" /></div>
          <div class="gps-text">
            <div class="gps-headline">
              <strong>{{ ville || 'Ville non identifiée' }}<template v-if="quartier"> ({{ quartier }})</template></strong>
              <span class="badge-gps-valid">Position détectée</span>
            </div>
            <div class="gps-coords">
              <span>Lat: {{ gpsCoordonnees.lat.toFixed(5) }}</span>
              <span>Long: {{ gpsCoordonnees.lng.toFixed(5) }}</span>
            </div>
          </div>
        </div>

        <div v-else-if="gpsEnCours" class="gps-card gps-loading">
          <div class="spinner-pulse"></div>
          <div class="gps-text"><strong>Recherche du signal GPS…</strong></div>
        </div>

        <div v-else class="gps-card gps-warning">
          <div class="gps-icon-circle-warning"><Icone nom="alerte" /></div>
          <div class="gps-text">
            <strong>Position GPS requise après la photo</strong>
            <button type="button" class="btn-activer-gps" @click="analyserPhoto" :disabled="!photoFichier || generationEnCours">
              Réessayer GPS et analyse
            </button>
          </div>
        </div>
        <small class="photo-timestamp">Adresse approximative · © OpenStreetMap</small>
      </section>

      <section class="section-card">
        <div class="section-header">
          <span class="step-badge">3</span>
          <label class="section-title">Catégorie du problème <span class="required">*</span></label>
        </div>
        <p class="section-subtitle">L’IA choisit parmi les mêmes catégories que le signalement manuel.</p>
        <div v-if="categorieSelectionnee" class="chips-container detected-category-chips" aria-live="polite">
          <div class="chip-item chip-selected" aria-label="Catégorie sélectionnée par l’analyse IA">
            <span class="chip-icone"><Icone :nom="categorieSelectionnee.icone" /></span>
            <span class="chip-nom">{{ categorieSelectionnee.nom }}</span>
            <span class="chip-points">+{{ categorieSelectionnee.points_signalement || 10 }} pts</span>
          </div>
        </div>
        <div v-else class="location-field pending" aria-live="polite">
          {{ photoFichier ? 'En attente de l’analyse de la photo…' : 'La catégorie sera détectée après la photo.' }}
        </div>
        <div v-if="classificationIA.type" class="classification-box">
          <div class="classification-row">
            <strong>Tri du déchet</strong>
            <span class="classification-badge" :class="classificationIA.type">{{ libelleTypeDechet(classificationIA.type) }}</span>
          </div>
          <p class="classification-reason">{{ classificationIA.reason }}</p>
          <small>Confiance IA : {{ classificationIA.confidence }}%</small>
        </div>
      </section>

      <section v-if="photoFichier" class="section-card">
        <div class="section-header">
          <span class="step-badge optional">4</span>
          <label class="section-title">Description proposée par l’IA <span class="required">*</span></label>
        </div>
        <textarea
          v-model="description"
          :placeholder="generationEnCours ? 'L’IA analyse la photo et prépare une description…' : 'La description proposée apparaîtra ici après l’analyse.'"
          :disabled="generationEnCours || !description"
          @input="descriptionConfirmee = false"
          rows="3"
          class="description-textarea"
        ></textarea>

        <label v-if="description && classificationIA.type" class="confirm-row">
          <input
            type="checkbox"
            :checked="descriptionConfirmee"
            :disabled="envoiEnCours"
            @change="confirmerEtEnvoyer"
          />
          <span>Je confirme et j’autorise l’envoi automatique du signalement avec cette description, cette catégorie et ce tri.</span>
        </label>
        <div v-if="envoiEnCours" class="progression-box" aria-live="polite">
          <div class="loading-spinner"></div>
          <span class="progression-text">Envoi automatique du signalement et de la photo en cours…</span>
        </div>
      </section>

      <div v-if="messageErreur" class="erreur-banner" role="alert">{{ messageErreur }}</div>

      <div v-if="messageSucces" class="succes-banner" role="status">
        <strong>Signalement envoyé avec succès.</strong>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabaseClient'
import { rechercherAdresse } from '../services/geocodage'
import { analyserImageAvecIA, iaDisponible } from '../services/analyseIA'
import { useSignalementStore } from '../stores/signalementStore'
import { useUserStore } from '../stores/userStore'
import imageCompression from 'browser-image-compression'
import Icone from './Icone.vue'

const router = useRouter()
const signalementStore = useSignalementStore()
const userStore = useUserStore()

const photoFichier = ref(null)
const photoPreview = ref(null)
const videoElement = ref(null)
const cameraOuverte = ref(false)
const cameraPrete = ref(false)
const photoMetadata = ref({ takenAt: null })
const gpsCoordonnees = ref(null)
const gpsEnCours = ref(false)
const adresseEnCours = ref(false)
const categoriesDisponibles = computed(() => signalementStore.categories)
const categorieChoisie = ref('')
const categorieDetectee = ref('')
const categorieSelectionnee = computed(() => {
  return categoriesDisponibles.value.find((category) => category.id === categorieChoisie.value) || null
})
const ville = ref('')
const quartier = ref('')
const description = ref('')
const descriptionConfirmee = ref(false)
const generationEnCours = ref(false)
const classificationIA = ref({
  type: '',
  reason: '',
  confidence: 0
})

const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')

const classificationValides = ['recyclable', 'biodegradable', 'non_recyclable']
let cameraStream = null

onMounted(async () => {
  await signalementStore.chargerCategories()
})

onBeforeUnmount(() => {
  arreterCamera()
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
})

async function ouvrirCamera() {
  messageErreur.value = ''

  if (!navigator.mediaDevices?.getUserMedia) {
    messageErreur.value = 'La caméra nécessite un navigateur compatible et une connexion HTTPS (ou localhost).'
    return
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' } }
    })
    cameraOuverte.value = true
    await nextTick()
    videoElement.value.srcObject = cameraStream
    await videoElement.value.play()
    cameraPrete.value = true
  } catch (error) {
    arreterCamera()
    cameraOuverte.value = false
    messageErreur.value = error.name === 'NotAllowedError'
      ? 'Autorisez l’accès à la caméra dans les réglages du navigateur, puis réessayez.'
      : 'Impossible d’ouvrir la caméra. Vérifiez les permissions et réessayez.'
  }
}

function arreterCamera() {
  cameraStream?.getTracks().forEach((track) => track.stop())
  cameraStream = null
  cameraPrete.value = false
}

function fermerCamera() {
  arreterCamera()
  cameraOuverte.value = false
}

function prendrePhoto() {
  const video = videoElement.value
  if (!video?.videoWidth || !video.videoHeight) return

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
  const capturedAt = Date.now()

  canvas.toBlob((blob) => {
    if (!blob) {
      messageErreur.value = 'La photo n’a pas pu être capturée. Réessayez.'
      return
    }

    fermerCamera()
    traiterPhoto(new File([blob], `greenshot-${capturedAt}.jpg`, {
      type: 'image/jpeg',
      lastModified: capturedAt
    }))
  }, 'image/jpeg', 0.92)
}

function formatDateTime(value) {
  if (!value) return 'Date non disponible'

  const date = new Date(value)
  return new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function libelleTypeDechet(type) {
  if (type === 'recyclable') return 'Recyclable'
  if (type === 'biodegradable') return 'Biodégradable'
  if (type === 'non_recyclable') return 'Non recyclable'
  return 'Non classé'
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Impossible de lire la photo pour l’analyse IA.'))
    reader.readAsDataURL(file)
  })
}

function obtenirPositionGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      () => reject(new Error('Position GPS indisponible. Autorisez la géolocalisation puis réessayez.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  })
}

async function trouverAdresse({ lat, lng }) {
  const adresse = await rechercherAdresse({ latitude: lat, longitude: lng })
  if (!adresse.ville) throw new Error('La ville n’a pas pu être identifiée depuis le GPS. Vérifiez la position puis réessayez.')

  ville.value = adresse.ville
  quartier.value = adresse.quartier
}

function traiterPhoto(file) {
  if (!file) return

  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFichier.value = file
  photoPreview.value = URL.createObjectURL(file)
  photoMetadata.value.takenAt = new Date(file.lastModified || Date.now()).toISOString()
  gpsCoordonnees.value = null
  ville.value = ''
  quartier.value = ''
  categorieChoisie.value = ''
  categorieDetectee.value = ''
  classificationIA.value = { type: '', reason: '', confidence: 0 }
  description.value = ''
  descriptionConfirmee.value = false
  messageErreur.value = ''

  analyserPhoto()
}

async function analyserPhoto() {
  if (!photoFichier.value) return

  generationEnCours.value = true
  messageErreur.value = ''
  descriptionConfirmee.value = false
  classificationIA.value = { type: '', reason: '', confidence: 0 }
  description.value = ''

  try {
    gpsEnCours.value = true
    gpsCoordonnees.value = await obtenirPositionGPS()
    gpsEnCours.value = false

    adresseEnCours.value = true
    await trouverAdresse(gpsCoordonnees.value)
    adresseEnCours.value = false

    if (!iaDisponible()) {
      throw new Error('Aucune clé API IA configurée. Ajoutez VITE_GROQ_API_KEY (recommandé) ou VITE_GEMINI_API_KEY dans frontend/.env puis relancez Vite.')
    }

    const photoAnalyse = await imageCompression(photoFichier.value, {
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1280,
      useWebWorker: true
    })
    const imageDataUrl = await fileToDataUrl(photoAnalyse)
    const [metadata, imageBase64] = imageDataUrl.split(',', 2)
    const mimeType = metadata.match(/^data:(.*?);base64$/)?.[1]

    if (!imageBase64 || !mimeType) {
      throw new Error('Format de photo invalide pour l’analyse.')
    }

    if (!categoriesDisponibles.value.length) await signalementStore.chargerCategories()
    if (!categoriesDisponibles.value.length) throw new Error('Les catégories ne sont pas disponibles. Réessayez plus tard.')

    const nomsCategories = categoriesDisponibles.value.map((category) => category.nom)
    const quartierContexte = quartier.value || 'non identifié par les données cartographiques'
    const contexte = `Ville : ${ville.value}. Quartier : ${quartierContexte}. GPS : ${gpsCoordonnees.value.lat}, ${gpsCoordonnees.value.lng}. Date/heure de la photo : ${formatDateTime(photoMetadata.value.takenAt)}. Catégories de problème disponibles : ${nomsCategories.join(', ')}.`
    const prompt = `Tu es l’assistant de rédaction et de tri des déchets de Greenshot, une application citoyenne au Burundi. Analyse l’image jointe et propose un signalement que l’utilisateur pourra modifier puis confirmer.\n${contexte}\n\nConsignes impératives :\n- Choisis exactement une catégorie de problème dans cette liste : ${nomsCategories.join(', ')}. Choisis-la selon les éléments visibles. N’invente ni matière, ni quantité, ni danger, ni cause, ni action déjà réalisée. Si aucune catégorie précise ne correspond, choisis « Autre » si cette option existe.\n- Propose en français une description concise, neutre, de 1 à 3 phrases. Elle doit décrire les éléments visibles sans prétendre à une certitude absolue.\n- Classe le déchet dans une seule catégorie de tri : recyclable (matière identifiable comme papier, verre, métal ou plastique recyclable), biodegradable (déchet organique/compostable), ou non_recyclable (déchet mixte, contaminé, dangereux ou impossible à identifier avec confiance). En cas de doute, choisis non_recyclable, explique l’incertitude dans reason et baisse confidence.\n- Utilise la ville et le quartier fournis par les données GPS, sans les déduire de l’image. Ne les modifie pas et ne prétends pas les vérifier.\n- Retourne uniquement le JSON demandé par le schéma, sans markdown ni texte autour.`

    // Service IA partagé avec l'écran de nettoyage : Groq d'abord, Gemini en secours
    const data = await analyserImageAvecIA(prompt, [{ base64: imageBase64, mimeType }], {
      schema: {
        type: 'object',
        properties: {
          categorie: { type: 'string', enum: nomsCategories },
          description: { type: 'string' },
          type: { type: 'string', enum: classificationValides },
          reason: { type: 'string' },
          confidence: { type: 'integer' }
        },
        required: ['categorie', 'description', 'type', 'reason', 'confidence'],
        additionalProperties: false
      }
    })

    const categorieResultat = categoriesDisponibles.value.find((category) => category.nom === data?.categorie)
    if (!data || !categorieResultat || !classificationValides.includes(data.type) || !data.description?.trim() || !data.reason?.trim()) {
      throw new Error('La réponse IA est incomplète. Réessayez avec une photo plus claire.')
    }

    categorieChoisie.value = categorieResultat.id
    categorieDetectee.value = categorieResultat.nom
    classificationIA.value = {
      type: data.type,
      reason: data.reason,
      confidence: Math.min(100, Math.max(0, Number(data.confidence) || 0))
    }
    description.value = `${data.description.trim()} Type de déchet proposé : ${libelleTypeDechet(data.type)}. Catégorie du problème : ${data.categorie}.`
  } catch (err) {
    console.error('Erreur analyse Gemini:', err)
    messageErreur.value = err.message || 'L’analyse IA est indisponible. Réessayez avant de confirmer le signalement.'
  } finally {
    gpsEnCours.value = false
    adresseEnCours.value = false
    generationEnCours.value = false
  }
}

const peutEnvoyer = computed(() => {
  return (
    photoFichier.value &&
    gpsCoordonnees.value &&
    ville.value &&
    categorieChoisie.value &&
    classificationIA.value.type &&
    description.value.trim() &&
    descriptionConfirmee.value
  )
})

async function confirmerEtEnvoyer(event) {
  descriptionConfirmee.value = event.target.checked
  messageErreur.value = ''

  if (!descriptionConfirmee.value) return

  if (!peutEnvoyer.value) {
    descriptionConfirmee.value = false
    messageErreur.value = 'L’analyse doit être complète avant de confirmer l’envoi.'
    return
  }

  await soumettreSignalement()
}

async function soumettreSignalement() {
  if (envoiEnCours.value) return

  if (!peutEnvoyer.value) {
    messageErreur.value = 'Veuillez vérifier la photo, la géolocalisation, la description IA et la confirmation utilisateur.'
    return
  }

  envoiEnCours.value = true
  messageErreur.value = ''
  messageSucces.value = ''

  try {
    let currentUserId = userStore.user?.id
    if (!currentUserId) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      currentUserId = sessionData.session?.user?.id
    }

    if (!currentUserId) {
      const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously()
      if (anonymousError) {
        throw new Error('Une session Supabase est nécessaire pour envoyer. Activez Authentification anonyme dans Supabase ou connectez-vous.')
      }
      currentUserId = anonymousData.user?.id
    }

    if (!currentUserId) throw new Error('Impossible d’obtenir une session utilisateur Supabase.')

    let categorieIdFinale = categorieChoisie.value
    const categorieEstUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categorieIdFinale)
    if (!categorieEstUuid) {
      const { data: categorieDb, error: categorieError } = await supabase
        .from('categories')
        .select('id')
        .eq('nom', categorieDetectee.value)
        .maybeSingle()

      if (categorieError) throw categorieError
      if (!categorieDb?.id) {
        throw new Error('La catégorie détectée par l’IA doit exister dans Supabase pour envoyer le signalement.')
      }
      categorieIdFinale = categorieDb.id
    }

    const options = {
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1280,
      useWebWorker: true
    }
    const photoCompressee = await imageCompression(photoFichier.value, options)

    const fileName = `signalement-${Date.now()}.jpg`
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('signalements-photos')
      .upload(fileName, photoCompressee)

      if (uploadErr || !uploadData) throw uploadErr || new Error('Le téléversement de la photo a échoué.')

      const { data: publicData } = await supabase.storage
        .from('signalements-photos')
        .getPublicUrl(fileName)
      const photoUrl = publicData.publicUrl

    const descriptionFinale = `${description.value} | Type de déchet détecté: ${libelleTypeDechet(classificationIA.value.type)} | Motif IA: ${classificationIA.value.reason} | Conf. IA: ${classificationIA.value.confidence}% | Photo prise le ${formatDateTime(photoMetadata.value.takenAt || new Date().toISOString())} | GPS ${gpsCoordonnees.value.lat.toFixed(5)}, ${gpsCoordonnees.value.lng.toFixed(5)}`

    const { error: insertErr } = await supabase
      .from('signalements')
      .insert({
        user_id: currentUserId,
        categorie_id: categorieIdFinale,
        photo_avant_url: photoUrl,
        latitude: gpsCoordonnees.value.lat,
        longitude: gpsCoordonnees.value.lng,
        ville: quartier.value ? `${ville.value} (${quartier.value})` : ville.value,
        description: descriptionFinale,
        statut: 'en_attente'
      })

    if (insertErr) throw insertErr

    messageSucces.value = 'Votre signalement a été enregistré avec succès ! Vos points ont été crédités.'
    setTimeout(() => {
      router.push('/carte')
    }, 1500)

  } catch (err) {
    console.error('Erreur soumission signalement:', err)
    messageErreur.value = err.message || "Erreur lors de l'envoi du signalement."
    descriptionConfirmee.value = false
  } finally {
    envoiEnCours.value = false
  }
}
</script>

<style scoped>
.form-signalement-root {
  width: 100%;
}

.signalement-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-card {
  padding: 1.15rem;
  border: 1px solid var(--color-border, #e5e9e2);
  border-radius: var(--radius-lg, 16px);
  background: var(--color-card, #fff);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
}

.section-card:focus-within {
  border-color: #a7d2b9;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-primary, #1f4d3a);
  color: white;
  font-size: 0.82rem;
  font-weight: 700;
}

.step-badge.optional {
  background: var(--color-text-muted, #64748b);
}

.section-title {
  color: var(--color-text, #0f172a);
  font-size: 0.98rem;
  font-weight: 700;
}

.required {
  color: #dc2626;
}

.section-subtitle {
  margin: 0 0 0.85rem;
  color: var(--color-text-muted, #64748b);
  font-size: 0.85rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.label-title {
  display: block;
  font-weight: 700;
  font-size: 0.9rem;
  color: #1e293b;
  margin-bottom: 0.4rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.camera-view {
  overflow: hidden;
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: var(--radius-md, 12px);
  background: #0f172a;
}

.camera-video {
  display: block;
  width: 100%;
  max-height: 60vh;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.camera-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem;
  background: var(--color-card, white);
}

.camera-actions .btn-camera {
  flex: 1;
}

.btn-camera-capture {
  flex: 1;
  border: 0;
  border-radius: var(--radius-sm, 8px);
  background: var(--color-primary, #1f4d3a);
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.btn-camera-cancel {
  min-height: 44px;
  padding: 0.65rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm, 8px);
  background: white;
  color: var(--color-text, #0f172a);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-camera {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: 100%;
  min-height: 52px;
  padding: 0.8rem 1rem;
  border: 0;
  border-radius: var(--radius-md, 12px);
  background: var(--color-primary, #1f4d3a);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-camera:hover {
  background: var(--color-primary-hover, #163a2c);
}

.btn-camera:disabled {
  opacity: 0.6;
  cursor: wait;
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 160px;
  padding: 1.75rem 1rem;
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-md, 12px);
  background: #f8faf9;
  color: inherit;
  font: inherit;
  text-align: center;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease;
}

.upload-dropzone:hover,
.upload-dropzone:focus-visible {
  border-color: var(--color-primary, #1f4d3a);
  background: var(--color-primary-light, #ebf3ef);
  outline: none;
}

.upload-dropzone:disabled {
  opacity: 0.6;
  cursor: wait;
}

.dropzone-icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: 0.65rem;
  border-radius: 50%;
  background: var(--color-primary-light, #ebf3ef);
  color: var(--color-primary, #1f4d3a);
  transition: transform 160ms ease;
}

.upload-dropzone:hover .dropzone-icon-circle {
  transform: scale(1.06);
}

.camera-svg {
  width: 26px;
  height: 26px;
}

.dropzone-label {
  margin-bottom: 0.25rem;
  color: var(--color-text, #0f172a);
  font-size: 0.95rem;
  font-weight: 700;
}

.dropzone-hint {
  max-width: 320px;
  color: var(--color-text-muted, #64748b);
  font-size: 0.78rem;
}

.compress-notice {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
  margin-top: 0.25rem;
}

.ai-panel {
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
}

.ai-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #334155;
  margin-bottom: 0.75rem;
}

.analysis-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-text, #0f172a);
  font-size: 0.88rem;
}

.loading-indicator {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
  border: 2px solid var(--color-primary-light, #ebf3ef);
  border-top-color: var(--color-primary, #1f4d3a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.map-attribution {
  color: #64748b;
  font-size: 0.72rem;
}

.btn-ai {
  width: 100%;
  border: none;
  background: var(--color-primary, #1f4d3a);
  color: white;
  padding: 0.7rem 0.9rem;
  border-radius: var(--radius-sm, 8px);
  font-weight: 700;
  cursor: pointer;
}

.btn-ai:disabled {
  opacity: 0.7;
  cursor: wait;
}

.classification-box {
  margin-top: 0.85rem;
  padding: 0.85rem;
  border: 1px solid #cfe4d7;
  border-radius: var(--radius-md, 12px);
  background: var(--color-primary-light, #ebf3ef);
  color: var(--color-primary, #1f4d3a);
}

.classification-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.classification-row strong {
  color: var(--color-text, #0f172a);
  font-size: 0.88rem;
}

.classification-reason {
  margin: 0.45rem 0;
  color: var(--color-text-muted, #64748b);
  font-size: 0.82rem;
}

.classification-box small {
  color: var(--color-text-muted, #64748b);
  font-size: 0.75rem;
}

.gps-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 12px);
  background: #f8faf9;
}

.gps-card.gps-success {
  border-color: #b9d7c5;
  background: var(--color-primary-light, #ebf3ef);
}

.gps-card.gps-warning {
  align-items: flex-start;
  border-color: #f3d6a4;
  background: var(--color-amber-light, #fdf6eb);
}

.gps-icon-circle,
.gps-icon-circle-warning {
  justify-content: center;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: white;
}

.gps-text {
  min-width: 0;
  flex: 1;
}

.gps-headline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: var(--color-primary, #1f4d3a);
}

.badge-gps-valid {
  color: var(--color-primary, #1f4d3a);
  font-size: 0.72rem;
  font-weight: 700;
}

.gps-coords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.3rem;
  color: var(--color-text-muted, #64748b);
  font-size: 0.75rem;
}

.btn-activer-gps {
  display: block;
  min-height: 38px;
  margin-top: 0.5rem;
  padding: 0.45rem 0.7rem;
  border: 0;
  border-radius: var(--radius-sm, 8px);
  background: var(--color-amber, #e8a33d);
  color: #38240b;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.gps-loading {
  color: var(--color-text-muted, #64748b);
}

.spinner-pulse,
.loading-spinner {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border: 2px solid #d6e6dc;
  border-top-color: var(--color-primary, #1f4d3a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.detected-category-chips {
  margin-top: 0.25rem;
}

.chip-item {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-full, 9999px);
  background: white;
  color: var(--color-text, #0f172a);
  font: inherit;
}

.chip-item.chip-selected {
  border-color: var(--color-primary, #1f4d3a);
  background: var(--color-primary-light, #ebf3ef);
}

.chip-icone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.chip-nom {
  font-size: 0.85rem;
  font-weight: 700;
}

.chip-points {
  color: var(--color-amber, #a76512);
  font-size: 0.73rem;
  font-weight: 700;
}

.description-textarea {
  display: block;
  width: 100%;
  min-height: 104px;
  padding: 0.8rem;
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: var(--radius-md, 12px);
  background: white;
  color: var(--color-text, #0f172a);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
}

.description-textarea:focus {
  border-color: var(--color-primary, #1f4d3a);
  outline: 2px solid var(--color-primary-light, #ebf3ef);
}

.description-textarea:disabled {
  background: #f8faf9;
  color: var(--color-text-muted, #64748b);
}

.erreur-banner,
.succes-banner {
  padding: 0.9rem 1rem;
  border-radius: var(--radius-md, 12px);
  font-size: 0.86rem;
  line-height: 1.45;
}

.erreur-banner {
  border: 1px solid #f3c3bc;
  background: var(--color-terracotta-light, #fdf0ec);
  color: #8f321d;
}

.succes-banner {
  border: 1px solid #b9d7c5;
  background: var(--color-primary-light, #ebf3ef);
  color: var(--color-primary, #1f4d3a);
}

.progression-box {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.75rem;
  padding: 0.8rem;
  border-radius: var(--radius-md, 12px);
  background: var(--color-primary-light, #ebf3ef);
  color: var(--color-primary, #1f4d3a);
}

.progression-text {
  font-size: 0.84rem;
  font-weight: 600;
}

.detected-category {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.4rem;
}

.classification-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: white;
}

.classification-badge.recyclable {
  background: #2563eb;
}

.classification-badge.biodegradable {
  background: #16a34a;
}

.classification-badge.non_recyclable {
  background: #dc2626;
}

.preview-container {
  margin-top: 0.5rem;
  text-align: center;
}

.preview-img {
  max-height: 180px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.gps-status {
  padding: 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

.gps-status.checking {
  background: #EFF6FF;
  color: #1E40AF;
  border: 1px solid #BFDBFE;
}

.gps-status.success {
  background: #ECFDF5;
  color: #065F46;
  border: 1px solid #A7F3D0;
}

.gps-status.warning {
  background: #FFFBEB;
  color: #92400E;
  border: 1px solid #FDE68A;
}

.btn-gps {
  margin-left: 0.5rem;
  padding: 2px 8px;
  font-size: 0.75rem;
  background: #F59E0B;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.select-input, .text-input, .textarea-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
}

.location-field {
  padding: 0.65rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-md, 12px);
  color: var(--color-text, #1e293b);
  font-size: 0.9rem;
}

.location-field.pending {
  color: #64748b;
}

.confirm-row {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-top: 0.85rem;
  padding: 0.8rem;
  border: 1px solid var(--color-border, #dce6df);
  border-radius: var(--radius-md, 12px);
  background: #f8faf9;
  color: var(--color-text, #334155);
  font-size: 0.84rem;
  line-height: 1.4;
}

.submission-status {
  display: block;
  margin-top: 0.6rem;
  color: var(--color-primary, #1f4d3a);
  font-size: 0.82rem;
  font-weight: 600;
}

.confirm-row input {
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 auto;
  margin-top: 0.1rem;
}

.alert-error {
  padding: 0.75rem;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  margin-bottom: 0.9rem;
}

.alert-success {
  padding: 0.75rem;
  border-radius: 8px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  margin-bottom: 0.9rem;
}

.btn-submit {
  display: block;
  width: 100%;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
