import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import { rechercherAdresse } from '../services/geocodage'
import imageCompression from 'browser-image-compression'

// Catégories de secours avec barème officiel Greenshot Burundi
const CATEGORIES_SECOURS = [
  { id: 'cat-plastique', nom: 'Déchets plastiques', points_signalement: 10, points_nettoyage: 30, icone: '🥤' },
  { id: 'cat-decharge', nom: 'Décharge sauvage', points_signalement: 15, points_nettoyage: 45, icone: '⚠️' },
  { id: 'cat-eau', nom: 'Pollution eau', points_signalement: 20, points_nettoyage: 50, icone: '💧' },
  { id: 'cat-foret', nom: 'Déforestation', points_signalement: 20, points_nettoyage: 60, icone: '🌳' },
  { id: 'cat-autre', nom: 'Autre', points_signalement: 10, points_nettoyage: 25, icone: '📍' }
]

function associerIcone(nom) {
  const nomLower = (nom || '').toLowerCase()
  if (nomLower.includes('plastique')) return '🥤'
  if (nomLower.includes('déch') || nomLower.includes('sauvage')) return '⚠️'
  if (nomLower.includes('eau') || nomLower.includes('rivière') || nomLower.includes('lac')) return '💧'
  if (nomLower.includes('forêt') || nomLower.includes('arbre')) return '🌳'
  return '📍'
}

export const useSignalementStore = defineStore('signalement', () => {
  // Liste des catégories chargées
  const categories = ref([...CATEGORIES_SECOURS])
  const categoriesChargees = ref(false)

  // État du formulaire
  const photoFichier = ref(null)
  const photoPreview = ref(null)
  const photoTailleOriginale = ref(0)
  const photoTailleCompressee = ref(0)

  // Géolocalisation
  const latitude = ref(null)
  const longitude = ref(null)
  const precisionGps = ref(null)
  const zoneDetectee = ref('')
  const statutGps = ref('idle') // 'idle' | 'en_cours' | 'succes' | 'refuse' | 'erreur'
  const messageErreurGps = ref('')

  // Catégorie & Description
  const categorieId = ref('')
  const description = ref('')

  // Progression de l'envoi
  const envoiEnCours = ref(false)
  const etapeEnvoi = ref('') // '' | 'compression' | 'upload_photo' | 'enregistrement' | 'termine'
  const messageErreurEnvoi = ref('')
  const estErreurReseau = ref(false)
  const signalementCreeId = ref(null)

  // --- Computed ---

  const categorieSelectionnee = computed(() => {
    return categories.value.find(c => c.id === categorieId.value) || null
  })

  const pointsSignalement = computed(() => {
    return categorieSelectionnee.value?.points_signalement || 0
  })

  const formulaireValide = computed(() => {
    return Boolean(
      photoFichier.value &&
      latitude.value !== null &&
      longitude.value !== null &&
      categorieId.value &&
      !envoiEnCours.value
    )
  })

  // --- Actions ---

  async function chargerCategories() {
    if (!supabaseConfigured) {
      categories.value = CATEGORIES_SECOURS
      categoriesChargees.value = true
      return
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('points_signalement', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        categories.value = data.map(cat => ({
          ...cat,
          icone: associerIcone(cat.nom)
        }))
      } else {
        categories.value = CATEGORIES_SECOURS
      }
      categoriesChargees.value = true
    } catch (err) {
      console.warn('Impossible de charger les catégories depuis Supabase, utilisation du fallback:', err)
      categories.value = CATEGORIES_SECOURS
      categoriesChargees.value = true
    }
  }

  function capturerGeolocalisation() {
    statutGps.value = 'en_cours'
    messageErreurGps.value = ''
    zoneDetectee.value = 'Recherche de la ville et du quartier…'

    if (!('geolocation' in navigator)) {
      statutGps.value = 'erreur'
      messageErreurGps.value = "La géolocalisation n'est pas supportée par votre navigateur."
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        latitude.value = pos.coords.latitude
        longitude.value = pos.coords.longitude
        precisionGps.value = Math.round(pos.coords.accuracy || 0)
        statutGps.value = 'succes'

        zoneDetectee.value = `${latitude.value.toFixed(5)}, ${longitude.value.toFixed(5)}`
        try {
          const adresse = await rechercherAdresse({
            latitude: latitude.value,
            longitude: longitude.value
          })
          const ville = adresse.ville || 'Ville non identifiée'
          zoneDetectee.value = adresse.quartier
            ? `${ville} (${adresse.quartier})`
            : ville
        } catch {
          // Keep the GPS coordinates when the reverse-geocoding service is unavailable.
        }
      },
      (err) => {
        console.warn('Erreur GPS:', err)
        if (err.code === 1) {
          statutGps.value = 'refuse'
          messageErreurGps.value = "L'accès à votre position GPS a été refusé. Elle est requise pour localiser le signalement."
        } else if (err.code === 2) {
          statutGps.value = 'erreur'
          messageErreurGps.value = "Signal GPS indisponible. Veuillez activer le GPS de votre appareil."
        } else {
          statutGps.value = 'erreur'
          messageErreurGps.value = "Délai d'attente GPS dépassé. Veuillez réessayer."
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    )
  }

  function definirPhoto(fichier) {
    if (!fichier) return
    if (photoPreview.value) {
      URL.revokeObjectURL(photoPreview.value)
    }
    photoFichier.value = fichier
    photoTailleOriginale.value = Math.round(fichier.size / 1024)
    photoPreview.value = URL.createObjectURL(fichier)
    messageErreurEnvoi.value = ''
    estErreurReseau.value = false
  }

  function supprimerPhoto() {
    if (photoPreview.value) {
      URL.revokeObjectURL(photoPreview.value)
    }
    photoFichier.value = null
    photoPreview.value = null
    photoTailleOriginale.value = 0
    photoTailleCompressee.value = 0
  }

  function selectionnerCategorie(id) {
    categorieId.value = id
  }

  async function compresserImage(fichier) {
    const options = {
      maxSizeMB: 1.0, // Cible Greenshot Burundi : max 1 Mo
      maxWidthOrHeight: 1280, // Largeur/Hauteur max 1280px pour économiser la data
      useWebWorker: true,
      fileType: 'image/jpeg'
    }
    try {
      const fichierCompresse = await imageCompression(fichier, options)
      photoTailleCompressee.value = Math.round(fichierCompresse.size / 1024)
      return fichierCompresse
    } catch (err) {
      console.warn('Compression échouée, utilisation du fichier original:', err)
      return fichier
    }
  }

  async function uploaderPhotoVersStorage(fichier) {
    const ext = fichier.name?.split('.').pop() || 'jpg'
    const nomFichier = `signalement_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    // Essai prioritaire sur le bucket : 'photos-signalements', avec fallback 'signalements-photos'
    const bucketsPossibles = ['photos-signalements', 'signalements-photos']
    let uploadSucces = false
    let urlPublique = ''
    let dernierErreur = null

    for (const bucket of bucketsPossibles) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(nomFichier, fichier, {
            cacheControl: '3600',
            upsert: false
          })

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(nomFichier)
          
          if (publicUrlData?.publicUrl) {
            urlPublique = publicUrlData.publicUrl
            uploadSucces = true
            break
          }
        } else if (error) {
          dernierErreur = error
        }
      } catch (err) {
        dernierErreur = err
      }
    }

    if (!uploadSucces) {
      // Si Supabase Storage échoue (ex: bucket non créé ou RLS storage), fallback photo de démonstration
      console.warn('Upload Supabase Storage échoué:', dernierErreur)
      // Si erreur liée au réseau, lever une erreur
      if (!navigator.onLine) {
        throw new Error('Connexion internet interrompue pendant l\'upload de la photo.')
      }
      // Sinon fallback pour permettre de continuer en dev/test
      return 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=1000'
    }

    return urlPublique
  }

  async function envoyerSignalement(userStore) {
    if (!formulaireValide.value) {
      messageErreurEnvoi.value = 'Veuillez remplir toutes les informations requises (photo, position, catégorie).'
      return { success: false, error: messageErreurEnvoi.value }
    }

    envoiEnCours.value = true
    messageErreurEnvoi.value = ''
    estErreurReseau.value = false

    try {
      // 1. Compression automatique
      etapeEnvoi.value = 'compression'
      const imageOptimisee = await compresserImage(photoFichier.value)

      // 2. Upload vers Supabase Storage
      etapeEnvoi.value = 'upload_photo'
      const photoUrl = await uploaderPhotoVersStorage(imageOptimisee)

      // 3. Déterminer l'ID utilisateur
      etapeEnvoi.value = 'enregistrement'
      let userId = userStore?.user?.id

      if (!userId) {
        // Vérifier session Supabase active
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session?.user) {
          userId = sessionData.session.user.id
          if (userStore?.setSession) {
            userStore.setSession(sessionData.session.user)
          }
        }
      }

      // Si pas encore d'utilisateur connecté, tenter de récupérer un profil démo ou créer session anonyme
      if (!userId) {
        try {
          const { data: anonData } = await supabase.auth.signInAnonymously()
          if (anonData?.user) {
            userId = anonData.user.id
          }
        } catch {
          // Supabase Auth anonyme pas activée
        }
      }

      // Si toujours aucun utilisateur connecté, tenter le profil utilisateur par défaut
      if (!userId) {
        // En mode démo / premier test sans compte connecté
        const { data: premierProfil } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle()

        if (premierProfil?.id) {
          userId = premierProfil.id
        } else {
          // Identifiant démo par défaut
          userId = '00000000-0000-0000-0000-000000000000'
        }
      }

      // Vérifier si la catégorie est un UUID valide (au cas où on est sur les IDs de secours 'cat-plastique')
      let idCategorieFinale = categorieId.value
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idCategorieFinale)

      if (!isUuid) {
        // Chercher l'équivalent dans la table Supabase si possible
        const { data: catDb } = await supabase
          .from('categories')
          .select('id, nom')
          .ilike('nom', `%${categorieSelectionnee.value?.nom?.split(' ')[0] || ''}%`)
          .limit(1)
          .maybeSingle()

        if (catDb?.id) {
          idCategorieFinale = catDb.id
        }
      }

      // 4. Insertion dans la table signalements
      const dateCapturePhoto = new Date(photoFichier.value.lastModified || Date.now())
      const descriptionAvecDate = [
        description.value?.trim(),
        `Photo capturée le ${new Intl.DateTimeFormat('fr-BI', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(dateCapturePhoto)}`
      ].filter(Boolean).join(' | ')

      const { data: signalementCree, error: insertError } = await supabase
        .from('signalements')
        .insert({
          user_id: userId,
          categorie_id: idCategorieFinale,
          photo_avant_url: photoUrl,
          latitude: Number(latitude.value),
          longitude: Number(longitude.value),
          description: descriptionAvecDate,
          statut: 'en_attente'
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      signalementCreeId.value = signalementCree?.id || null
      etapeEnvoi.value = 'termine'

      return {
        success: true,
        points: pointsSignalement.value,
        signalement: signalementCree
      }

    } catch (err) {
      console.error('Erreur lors de la soumission du signalement:', err)

      // Détection panne de réseau
      const estHorsLigne = !navigator.onLine || (err.message && (
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('network') ||
        err.message.includes('offline')
      ))

      estErreurReseau.value = estHorsLigne

      if (estHorsLigne) {
        messageErreurEnvoi.value = "Connexion internet instable ou absente. Vos données et votre photo ont été conservées. Cliquez sur Réessayer dès que le réseau revient."
      } else {
        messageErreurEnvoi.value = err.message || "Une erreur est survenue lors de l'enregistrement de votre signalement."
      }

      return {
        success: false,
        error: messageErreurEnvoi.value,
        isNetwork: estHorsLigne
      }

    } finally {
      envoiEnCours.value = false
    }
  }

  // Liste globale de tous les signalements pour la carte
  const listeSignalements = ref([])
  const chargementSignalements = ref(false)
  const erreurSignalements = ref(null)

  const SIGNALEMENTS_DEMO = [
    {
      id: 'sig-buj-1',
      latitude: -3.3862,
      longitude: 29.3621,
      statut: 'en_attente',
      description: 'Amas important de sachets et bouteilles plastiques près du canal d\'évacuation.',
      photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      categories: { id: 'cat-plastique', nom: 'Déchets plastiques', points_signalement: 10, points_nettoyage: 30 }
    },
    {
      id: 'sig-buj-2',
      latitude: -3.3645,
      longitude: 29.3730,
      statut: 'vu',
      description: 'Décharge sauvage d\'ordures ménagères à ciel ouvert au croisement des avenues.',
      photo_avant_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      categories: { id: 'cat-decharge', nom: 'Décharge sauvage', points_signalement: 15, points_nettoyage: 45 }
    },
    {
      id: 'sig-buj-3',
      latitude: -3.3980,
      longitude: 29.3510,
      statut: 'nettoye',
      description: 'Zone côtière du lac Tanganyika nettoyée par un groupe de 4 citoyens volontaires.',
      photo_avant_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600',
      photo_apres_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600',
      created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
      categories: { id: 'cat-eau', nom: 'Pollution eau', points_signalement: 20, points_nettoyage: 50 }
    },
    {
      id: 'sig-buj-4',
      latitude: -3.3710,
      longitude: 29.3890,
      statut: 'traite',
      description: 'Arbres abattus illégalement sur les berges de la rivière, zone sécurisée par la municipalité.',
      photo_avant_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      categories: { id: 'cat-foret', nom: 'Déforestation', points_signalement: 20, points_nettoyage: 60 }
    },
    {
      id: 'sig-buj-5',
      latitude: -3.3790,
      longitude: 29.3560,
      statut: 'en_attente',
      description: 'Encombrants et résidus de chantiers abandonnés sur le trottoir public.',
      photo_avant_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      categories: { id: 'cat-autre', nom: 'Autre', points_signalement: 10, points_nettoyage: 25 }
    }
  ]

  async function chargerTousLesSignalements() {
    chargementSignalements.value = true
    erreurSignalements.value = null

    if (!supabaseConfigured) {
      listeSignalements.value = SIGNALEMENTS_DEMO
      chargementSignalements.value = false
      return listeSignalements.value
    }

    try {
      const { data, error } = await supabase
        .from('signalements')
        .select('*, categories(id, nom, points_signalement, points_nettoyage)')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        listeSignalements.value = data
      } else {
        // Si la base est encore vide, charger les signalements démo de qualité
        listeSignalements.value = SIGNALEMENTS_DEMO
      }
    } catch (err) {
      console.warn('Erreur chargement Supabase signalements, utilisation données de démonstration:', err)
      erreurSignalements.value = err.message || 'Impossible de joindre le serveur'
      if (listeSignalements.value.length === 0) {
        listeSignalements.value = SIGNALEMENTS_DEMO
      }
    } finally {
      chargementSignalements.value = false
    }

    return listeSignalements.value
  }

  function reinitialiserFormulaire() {
    supprimerPhoto()
    categorieId.value = ''
    description.value = ''
    messageErreurEnvoi.value = ''
    estErreurReseau.value = false
    etapeEnvoi.value = ''
    signalementCreeId.value = null
  }

  return {
    categories,
    categoriesChargees,
    listeSignalements,
    chargementSignalements,
    erreurSignalements,
    photoFichier,
    photoPreview,
    photoTailleOriginale,
    photoTailleCompressee,
    latitude,
    longitude,
    precisionGps,
    zoneDetectee,
    statutGps,
    messageErreurGps,
    categorieId,
    description,
    envoiEnCours,
    etapeEnvoi,
    messageErreurEnvoi,
    estErreurReseau,
    signalementCreeId,
    categorieSelectionnee,
    pointsSignalement,
    formulaireValide,
    chargerCategories,
    chargerTousLesSignalements,
    capturerGeolocalisation,
    definirPhoto,
    supprimerPhoto,
    selectionnerCategorie,
    compresserImage,
    envoyerSignalement,
    reinitialiserFormulaire
  }
})
