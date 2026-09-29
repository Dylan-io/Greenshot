<template>
  <div class="page-nettoyage">
    
    <!-- Barre supérieure de navigation avec retour -->
    <header class="nettoyage-top-nav">
      <button type="button" class="btn-back" @click="retourAuSignalement" aria-label="Retour">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" class="back-icon">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Retour</span>
      </button>

      <span class="nav-title">Preuve de nettoyage</span>
      <div style="width: 50px;"></div>
    </header>

    <!-- Confirmation de succès en bannière / toast -->
    <transition name="fade">
      <div v-if="succesAffiche" class="success-banner" role="alert">
        <div class="success-icon">🎉</div>
        <div class="success-content">
          <h3 class="success-title">Zone nettoyée avec succès !</h3>
          <p class="success-desc">
            Félicitations, vous avez remporté 
            <span class="badge-pts-clean">+{{ pointsAGagner }} pts</span> citoyen !
            Redirection vers le signalement...
          </p>
        </div>
      </div>
    </transition>

    <!-- Bannière d'erreur de soumission / réseau -->
    <transition name="fade">
      <div v-if="messageErreurSoumission" class="error-banner" role="alert">
        <div class="error-icon">📡</div>
        <div class="error-content">
          <h4 class="error-title">Échec de transmission</h4>
          <p class="error-desc">{{ messageErreurSoumission }}</p>
          <button type="button" class="btn-reessayer" @click="confirmerNettoyage">
            🔄 Réessayer l'envoi
          </button>
        </div>
      </div>
    </transition>

    <!-- 1. AVERTISSEMENT DE SÉCURITÉ PERMANENT EN HAUT -->
    <section class="security-alert-box" aria-label="Avertissement de sécurité essentiel">
      <div class="security-icon-circle">⚠️</div>
      <div class="security-text">
        <strong class="security-title">Avant de commencer — Sécurité citoyenne</strong>
        <p class="security-body">
          Ne touche pas au verre brisé, aux déchets médicaux ou aux produits chimiques. 
          Si la zone semble dangereuse, signale-le seulement, ne nettoie pas toi-même.
        </p>
      </div>
    </section>

    <!-- Chargement initial -->
    <div v-if="chargementInitial" class="loading-box">
      <div class="spinner-forest"></div>
      <span>Récupération des données du signalement...</span>
    </div>

    <!-- Contenu principal du nettoyage -->
    <main v-else-if="signalement" class="nettoyage-main-content">
      
      <!-- 2. COMPARAISON AVANT / APRÈS -->
      <section class="comparison-section">
        <h2 class="section-title">Validation visuelle Avant / Après</h2>

        <div class="comparison-grid">
          
          <!-- Capture AVANT le nettoyage -->
          <div class="photo-column before-col">
            <div class="column-header">
              <span class="step-tag before-tag">📸 Avant nettoyage *</span>
              <span class="cat-badge">{{ signalement?.categories?.nom || 'Déchet' }}</span>
            </div>

            <div v-if="cameraOuverte && captureActive === 'avant'" class="camera-capture-panel">
              <video ref="videoElement" class="camera-video" autoplay playsinline muted></video>
              <div class="camera-actions">
                <button type="button" class="btn-camera-capture" :disabled="!cameraPrete" @click="prendrePhoto">
                  Capturer avant
                </button>
                <button type="button" class="btn-camera-cancel" @click="fermerCamera">Annuler</button>
              </div>
            </div>

            <div v-else-if="photoAvantPreview" class="photo-box has-preview">
              <img :src="photoAvantPreview" alt="Photo capturée avant le nettoyage" class="photo-img" />
              <div class="photo-overlay">
                <span class="ready-badge">✓ Avant prête</span>
                <button type="button" class="btn-change-photo" @click="ouvrirCamera('avant')">Reprendre</button>
              </div>
            </div>

            <button v-else type="button" class="upload-dropzone-after" @click="ouvrirCamera('avant')" :disabled="chargementInitial">
              <div class="camera-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="camera-svg">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span class="upload-label">Prendre la photo Avant</span>
              <small class="upload-hint">Caméra directe · GPS capturé à la prise</small>
            </button>

            <small v-if="photoAvantGps" class="photo-caption">
              📍 GPS avant : {{ photoAvantGps.latitude.toFixed(5) }}, {{ photoAvantGps.longitude.toFixed(5) }} · {{ formaterDateHeure(photoAvantGps.capturedAt) }}
            </small>
          </div>

          <!-- Colonne APRÈS (Zone d'upload / prise de photo citoyenne) -->
          <div class="photo-column after-col">
            <div class="column-header">
              <span class="step-tag after-tag">✨ Après nettoyage *</span>
              <span class="pts-target-badge">+{{ pointsAGagner }} pts</span>
            </div>

            <!-- Si photo sélectionnée : Aperçu avec actions -->
            <div v-if="cameraOuverte && captureActive === 'apres'" class="camera-capture-panel">
              <video ref="videoElement" class="camera-video" autoplay playsinline muted></video>
              <div class="camera-actions">
                <button type="button" class="btn-camera-capture" :disabled="!cameraPrete" @click="prendrePhoto">
                  Capturer après
                </button>
                <button type="button" class="btn-camera-cancel" @click="fermerCamera">Annuler</button>
              </div>
            </div>

            <div v-else-if="photoApresPreview" class="photo-box has-preview">
              <img :src="photoApresPreview" alt="Aperçu photo après nettoyage" class="photo-img" />
              <div class="photo-overlay">
                <span class="ready-badge">✓ Prête ({{ photoApresTaille }} Ko)</span>
                <button type="button" class="btn-change-photo" @click="ouvrirCamera('apres')">
                  Reprendre
                </button>
              </div>
            </div>

            <button v-else type="button" class="upload-dropzone-after" @click="ouvrirCamera('apres')" :disabled="!photoAvantFichier">
              <div class="camera-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="camera-svg">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <span class="upload-label">Prendre la photo Après</span>
              <small class="upload-hint">Caméra directe · GPS capturé à la prise</small>
            </button>
            <small v-if="photoApresGps" class="photo-caption">
              📍 GPS après : {{ photoApresGps.latitude.toFixed(5) }}, {{ photoApresGps.longitude.toFixed(5) }} · {{ formaterDateHeure(photoApresGps.capturedAt) }}
            </small>
          </div>

        </div>
      </section>

      <!-- 3. VÉRIFICATION GÉOGRAPHIQUE ANTI-FRAUDE -->
      <section class="geoloc-verification-section">
        <div class="geoloc-header">
          <h2 class="section-title">Contrôle géographique de présence</h2>
          <span class="gps-radius-label">Rayon requis : 50 m</span>
        </div>

        <!-- État : Analyse GPS en cours -->
        <div v-if="gpsEnCours" class="geoloc-banner checking">
          <div class="spinner-gps"></div>
          <div class="geoloc-text">
            <strong>Vérification satellite en cours...</strong>
            <p>Vérification GPS des deux photos autour du lieu signalé.</p>
          </div>
        </div>

        <!-- État 1 : Position Validée (< 50 mètres) -->
        <div v-else-if="photosGpsValides" class="geoloc-banner success">
          <div class="geoloc-icon">✅</div>
          <div class="geoloc-text">
            <strong class="success-headline">Positions des deux photos vérifiées</strong>
            <p>Avant : {{ formaterDistance(distanceAvantMetres) }} · Après : {{ formaterDistance(distanceApresMetres) }} du signalement.</p>
          </div>
        </div>

        <!-- État 2 : Trop loin (>= 50 mètres) -->
        <div v-else-if="distanceAvantMetres !== null || distanceApresMetres !== null" class="geoloc-banner warning">
          <div class="geoloc-icon">❌</div>
          <div class="geoloc-text">
            <strong class="warning-headline">
              Une position GPS est hors du rayon autorisé
            </strong>
            <p>
              Reprends chaque photo sur place. Les deux positions doivent être à moins de 50 m du signalement.
            </p>
          </div>
        </div>

        <!-- État 3 : Erreur ou refus de GPS -->
        <div v-else class="geoloc-banner error">
          <div class="geoloc-icon">📍</div>
          <div class="geoloc-text">
            <strong>Position GPS requise</strong>
            <p>{{ erreurGpsMessage || "Activez le GPS de votre appareil pour valider votre présence sur place." }}</p>
            <small>Reprenez la photo concernée pour obtenir une nouvelle position GPS liée à cette capture.</small>
          </div>
        </div>

      </section>

      <!-- 4. BOUTON D'ACTION & ENVOI -->
      <footer class="action-footer">
        
        <!-- Progression de l'envoi -->
        <div v-if="envoiEnCours" class="progression-box">
          <div class="spinner-submit"></div>
          <span>{{ libelleEnvoi }}</span>
        </div>

        <button 
          type="button" 
          class="btn-confirmer-nettoyage"
          :disabled="!peutConfirmer || envoiEnCours"
          @click="confirmerNettoyage"
        >
          <template v-if="envoiEnCours">
            <span class="spinner-white"></span>
            Validation en cours...
          </template>
          <template v-else-if="!photoAvantFichier || !photoApresFichier">
            Prenez les photos avant et après
          </template>
          <template v-else-if="!photosGpsValides">
            GPS des deux photos requis (&lt; 50 m)
          </template>
          <template v-else>
            <span class="btn-inner">
              Confirmer le nettoyage
              <span class="btn-pts-tag">+{{ pointsAGagner }} pts</span>
            </span>
          </template>
        </button>

        <p v-if="!peutConfirmer && !envoiEnCours" class="footer-hint">
          Deux photos caméra et leurs positions GPS à moins de 50 m sont requises pour créditer vos points.
        </p>
      </footer>

    </main>

    <section v-else class="loading-box error-state" role="alert">
      <strong>Nettoyage indisponible</strong>
      <span>{{ messageErreurSoumission || 'Le signalement réel n’a pas pu être chargé.' }}</span>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'
import imageCompression from 'browser-image-compression'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const videoElement = ref(null)
const cameraOuverte = ref(false)
const cameraPrete = ref(false)
const captureActive = ref('')
let cameraStream = null

// Signalement cible
const signalement = ref(null)
const chargementInitial = ref(true)

// Photos avant/après et positions GPS capturées au même instant
const photoAvantFichier = ref(null)
const photoAvantPreview = ref(null)
const photoAvantTaille = ref(0)
const photoAvantGps = ref(null)
const photoApresFichier = ref(null)
const photoApresPreview = ref(null)
const photoApresTaille = ref(0)
const photoApresGps = ref(null)

// Géolocalisation & Anti-fraude
const gpsEnCours = ref(false)
const erreurGpsMessage = ref('')
const distanceAvantMetres = ref(null)
const distanceApresMetres = ref(null)

// Soumission
const envoiEnCours = ref(false)
const etapeEnvoi = ref('') // 'compression' | 'upload' | 'mise_a_jour' | 'termine'
const succesAffiche = ref(false)
const messageErreurSoumission = ref('')

const signalementId = computed(() => {
  return route.query.id || route.params.id || ''
})

const pointsAGagner = computed(() => {
  return signalement.value?.categories?.points_nettoyage || 30
})

const peutConfirmer = computed(() => {
  return Boolean(signalement.value?.id && photosGpsValides.value && !envoiEnCours.value)
})

const photosGpsValides = computed(() => {
  return estDansRayon(photoAvantGps.value, distanceAvantMetres.value) &&
    estDansRayon(photoApresGps.value, distanceApresMetres.value)
})

const libelleEnvoi = computed(() => {
  switch (etapeEnvoi.value) {
    case 'compression': return 'Optimisation de la photo après (< 1 Mo)...'
    case 'upload': return 'Téléversement de la preuve sur le stockage sécurisé...'
    case 'mise_a_jour': return 'Validation anti-fraude et attribution des points...'
    default: return 'Traitement de votre preuve...'
  }
})

onMounted(async () => {
  await chargerSignalementCible()
})

onBeforeUnmount(() => {
  arreterCamera()
  if (photoAvantPreview.value) URL.revokeObjectURL(photoAvantPreview.value)
  if (photoApresPreview.value) URL.revokeObjectURL(photoApresPreview.value)
})

async function chargerSignalementCible() {
  chargementInitial.value = true
  const idCible = signalementId.value

  try {
    if (!supabaseConfigured) throw new Error('Supabase n’est pas configuré.')
    if (!idCible) throw new Error('Aucun identifiant de signalement réel n’a été fourni.')

    const { data, error } = await supabase
      .from('signalements')
      .select('*, categories(nom, points_nettoyage)')
      .eq('id', idCible)
      .maybeSingle()

    if (error) throw error

    if (!data) throw new Error('Signalement introuvable dans Supabase.')
    if (['nettoye', 'traite'].includes(data.statut)) throw new Error('Ce signalement est déjà nettoyé ou traité.')
    if (!Number.isFinite(Number(data.latitude)) || !Number.isFinite(Number(data.longitude))) {
      throw new Error('Le signalement ne possède pas de coordonnées GPS valides.')
    }
    signalement.value = data
  } catch (err) {
    console.error('Erreur chargement signalement à nettoyer:', err)
    messageErreurSoumission.value = err.message || 'Impossible de charger ce signalement.'
  } finally {
    chargementInitial.value = false
  }
}

// 2. Capture directe caméra et GPS au moment de chaque photo
async function ouvrirCamera(typeCapture) {
  erreurGpsMessage.value = ''

  if (!navigator.mediaDevices?.getUserMedia) {
    erreurGpsMessage.value = 'La caméra nécessite un navigateur compatible et une connexion HTTPS (ou localhost).'
    return
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' } }
    })
    captureActive.value = typeCapture
    cameraOuverte.value = true
    await nextTick()
    videoElement.value.srcObject = cameraStream
    await videoElement.value.play()
    cameraPrete.value = true
  } catch (error) {
    arreterCamera()
    cameraOuverte.value = false
    erreurGpsMessage.value = error.name === 'NotAllowedError'
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
  captureActive.value = ''
}

function prendrePhoto() {
  const video = videoElement.value
  if (!video?.videoWidth || !video.videoHeight || !captureActive.value) return

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
  const typeCapture = captureActive.value
  const capturedAt = Date.now()

  canvas.toBlob((blob) => {
    if (!blob) {
      erreurGpsMessage.value = 'La photo n’a pas pu être capturée. Réessayez.'
      return
    }

    fermerCamera()
    const file = new File([blob], `greenshot-${typeCapture}-${capturedAt}.jpg`, {
      type: 'image/jpeg',
      lastModified: capturedAt
    })
    enregistrerCapture(typeCapture, file, capturedAt)
  }, 'image/jpeg', 0.92)
}

function enregistrerCapture(typeCapture, file, capturedAt) {
  const preview = URL.createObjectURL(file)
  const photoGps = {
    latitude: null,
    longitude: null,
    precision: null,
    capturedAt
  }

  if (typeCapture === 'avant') {
    if (photoAvantPreview.value) URL.revokeObjectURL(photoAvantPreview.value)
    photoAvantFichier.value = file
    photoAvantPreview.value = preview
    photoAvantTaille.value = Math.round(file.size / 1024)
    photoAvantGps.value = photoGps
  } else {
    if (photoApresPreview.value) URL.revokeObjectURL(photoApresPreview.value)
    photoApresFichier.value = file
    photoApresPreview.value = preview
    photoApresTaille.value = Math.round(file.size / 1024)
    photoApresGps.value = photoGps
  }

  verifierPositionGps(typeCapture, photoGps)
}

function formaterDateHeure(timestamp) {
  return new Intl.DateTimeFormat('fr-BI', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(timestamp)
}

// 3. Vérification anti-fraude pour le GPS de la capture courante
function verifierPositionGps(typeCapture, photoGps) {
  gpsEnCours.value = true
  erreurGpsMessage.value = ''

  if (!('geolocation' in navigator)) {
    gpsEnCours.value = false
    photoGps.error = true
    erreurGpsMessage.value = "La géolocalisation n'est pas supportée par votre navigateur."
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      gpsEnCours.value = false
      photoGps.latitude = pos.coords.latitude
      photoGps.longitude = pos.coords.longitude
      photoGps.precision = Math.round(pos.coords.accuracy || 0)

      const distance = calculerHaversine(
        photoGps.latitude,
        photoGps.longitude,
        Number(signalement.value.latitude),
        Number(signalement.value.longitude)
      )
      if (typeCapture === 'avant') distanceAvantMetres.value = distance
      else distanceApresMetres.value = distance

      if (distance > 50) {
        erreurGpsMessage.value = `La photo ${typeCapture} a été capturée à ${formaterDistance(distance)} du signalement. La limite est de 50 m.`
      }
    },
    (err) => {
      gpsEnCours.value = false
      console.warn('Erreur GPS nettoyage:', err)
      photoGps.error = true
      if (err.code === 1) {
        erreurGpsMessage.value = "L'accès GPS a été refusé. Il est indispensable pour certifier votre présence sur le lieu."
      } else {
        erreurGpsMessage.value = "Impossible de capter votre signal satellite. Rapprochez-vous d'une zone dégagée."
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  )
}

function estDansRayon(photoGps, distance) {
  return Boolean(
    photoGps &&
    Number.isFinite(photoGps.latitude) &&
    Number.isFinite(photoGps.longitude) &&
    !photoGps.error &&
    distance !== null &&
    distance <= 50
  )
}

function calculerHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Rayon de la Terre en mètres
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function formaterDistance(m) {
  if (m === null || m === undefined) return '0 m'
  if (m >= 1000) {
    return `${(m / 1000).toFixed(1)} km`
  }
  return `${m} m`
}

// 4. Soumission et confirmation de la preuve
async function confirmerNettoyage() {
  if (!peutConfirmer.value || envoiEnCours.value) return

  envoiEnCours.value = true
  messageErreurSoumission.value = ''

  try {
    let nettoyeurId = userStore.user?.id
    if (!nettoyeurId) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      nettoyeurId = sessionData.session?.user?.id
    }
    if (!nettoyeurId) {
      const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously()
      if (anonymousError) throw new Error('Connectez-vous ou activez l’authentification anonyme pour soumettre la preuve.')
      nettoyeurId = anonymousData.user?.id
    }
    if (!nettoyeurId) throw new Error('Session Supabase introuvable. Connectez-vous avant de soumettre le nettoyage.')

    etapeEnvoi.value = 'compression'
    const options = {
      maxSizeMB: 1.0,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/jpeg'
    }
    const photoCompressee = await imageCompression(photoApresFichier.value, options)

    etapeEnvoi.value = 'upload'
    const nomFichierApres = `nettoyage-apres-${Date.now()}-${crypto.randomUUID()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signalements-photos')
      .upload(nomFichierApres, photoCompressee)
    if (uploadError || !uploadData) throw uploadError || new Error('Le téléversement de la photo après a échoué.')

    const { data: urlApres } = supabase.storage
      .from('signalements-photos')
      .getPublicUrl(nomFichierApres)
    if (!urlApres?.publicUrl) throw new Error('Impossible de récupérer l’URL de la photo après nettoyage.')

    // La RPC vérifie côté serveur que le GPS après est à moins de 50 m.
    etapeEnvoi.value = 'mise_a_jour'
    const { data: rpcData, error: rpcError } = await supabase.rpc('soumettre_preuve_nettoyage', {
      p_signalement_id: signalement.value.id,
      p_photo_apres_url: urlApres.publicUrl,
      p_latitude: photoApresGps.value.latitude,
      p_longitude: photoApresGps.value.longitude
    })

    if (rpcError) throw rpcError
    if (!rpcData?.success) throw new Error(rpcData?.message || 'La validation anti-fraude a refusé cette preuve.')

    // Le RPC a déjà crédité le profil en base.
    if (userStore.profile) {
      const pointsGagnes = Number(rpcData.points_gagnes) || pointsAGagner.value
      userStore.profile.score_nettoyage = (userStore.profile.score_nettoyage || 0) + pointsGagnes
      userStore.profile.score_total = (userStore.profile.score_total || 0) + pointsGagnes
    }

    etapeEnvoi.value = 'termine'
    succesAffiche.value = true

    // Redirection fluide après 1.8s vers le détail du signalement
    setTimeout(() => {
      succesAffiche.value = false
      router.push(`/signalement/${signalement.value.id}`)
    }, 1800)

  } catch (err) {
    console.error('Erreur soumission nettoyage:', err)
    messageErreurSoumission.value = err.message || "Erreur de connexion. Votre photo est conservée, veuillez réessayer."
  } finally {
    envoiEnCours.value = false
  }
}

function retourAuSignalement() {
  router.push(`/signalement/${signalementId.value}`)
}
</script>

<style scoped>
.page-nettoyage {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 2.5rem;
}

/* Barre de navigation retour */
.nettoyage-top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.btn-back {
  background: #FFFFFF;
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: var(--radius-sm, 8px);
  padding: 0.4rem 0.65rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text, #0F172A);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-back:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
}

.back-icon {
  width: 16px;
  height: 16px;
}

.nav-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
}

/* 1. AVERTISSEMENT DE SÉCURITÉ PERMANENT EN HAUT */
.security-alert-box {
  background-color: var(--color-terracotta-light, #FDF0EC);
  border: 1.5px solid #F5C6BA;
  border-radius: var(--radius-md, 14px);
  padding: 0.85rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 6px rgba(181, 80, 47, 0.08);
}

.security-icon-circle {
  font-size: 1.4rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.security-text {
  flex: 1;
}

.security-title {
  display: block;
  font-family: var(--font-title);
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--color-terracotta, #B5502F);
  margin-bottom: 0.2rem;
}

.security-body {
  font-size: 0.78rem;
  color: #8C3B1E;
  line-height: 1.38;
  margin: 0;
}

/* 2. COMPARAISON AVANT / APRÈS */
.comparison-section {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 18px;
  padding: 1.15rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  margin-bottom: 0.85rem;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 380px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}

.photo-column {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
}

.step-tag {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}

.before-tag {
  background: #F1F5F9;
  color: #475569;
}

.after-tag {
  background: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
}

.cat-badge {
  font-size: 0.65rem;
  color: var(--color-text-muted, #64748B);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.pts-target-badge {
  font-size: 0.68rem;
  font-weight: 800;
  background: var(--color-amber-light, #FDF6EB);
  color: #B47318;
  padding: 1px 6px;
  border-radius: 9999px;
  white-space: nowrap;
}

.photo-box {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  overflow: hidden;
  background-color: #0F172A;
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-caption {
  font-size: 0.72rem;
  color: var(--color-text-muted, #64748B);
}

/* Zone d'upload Après */
.upload-dropzone-after {
  width: 100%;
  aspect-ratio: 4 / 3;
  border: 2px dashed #CBD5E1;
  border-radius: 12px;
  background-color: #F8FAF9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.upload-dropzone-after:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.camera-capture-panel {
  overflow: hidden;
  width: 100%;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: 12px;
  background: #0f172a;
}

.camera-video {
  display: block;
  width: 100%;
  height: calc(100% - 54px);
  object-fit: cover;
}

.camera-actions {
  display: flex;
  gap: 0.5rem;
  height: 54px;
  padding: 0.35rem;
  background: white;
}

.btn-camera-capture,
.btn-camera-cancel {
  min-width: 0;
  padding: 0.4rem 0.6rem;
  border-radius: 7px;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-camera-capture {
  flex: 1;
  border: 0;
  background: var(--color-primary, #1f4d3a);
  color: white;
}

.btn-camera-capture:disabled {
  opacity: 0.55;
  cursor: wait;
}

.btn-camera-cancel {
  border: 1px solid var(--color-border, #cbd5e1);
  background: white;
  color: var(--color-text, #0f172a);
}

.gps-radius-label {
  color: var(--color-text-muted, #64748b);
  font-size: 0.75rem;
  font-weight: 700;
}

.error-state {
  align-items: flex-start;
  flex-direction: column;
  color: var(--color-terracotta, #b5502f);
}

.upload-dropzone-after:hover,
.upload-dropzone-after:focus {
  border-color: var(--color-primary, #1F4D3A);
  background-color: #EBF3EF;
}

.camera-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #EBF3EF;
  color: var(--color-primary, #1F4D3A);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.35rem;
}

.camera-svg {
  width: 20px;
  height: 20px;
}

.upload-label {
  font-family: var(--font-title);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text, #0F172A);
  line-height: 1.2;
}

.upload-hint {
  font-size: 0.65rem;
  color: var(--color-text-muted, #64748B);
  margin-top: 2px;
}

.hidden-file-input {
  display: none;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 100%);
  padding: 0.85rem 0.5rem 0.45rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ready-badge {
  color: #FFFFFF;
  font-size: 0.68rem;
  font-weight: 600;
  background: rgba(31, 77, 58, 0.85);
  padding: 2px 6px;
  border-radius: 9999px;
}

.btn-change-photo {
  background: #FFFFFF;
  border: none;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #0F172A;
  cursor: pointer;
}

/* 3. VÉRIFICATION GÉOGRAPHIQUE */
.geoloc-verification-section {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 18px;
  padding: 1.15rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.geoloc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.btn-refresh-gps {
  background: #F1F5F9;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary, #1F4D3A);
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-refresh-gps:hover {
  background: #E2E8F0;
}

.geoloc-banner {
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.geoloc-banner.checking {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #475569;
}

.geoloc-banner.success {
  background: #EBF3EF;
  border: 1.5px solid #10B981;
  color: #065F46;
}

.success-headline {
  color: #065F46;
  font-size: 0.85rem;
}

.geoloc-banner.warning {
  background: var(--color-terracotta-light, #FDF0EC);
  border: 1.5px solid var(--color-terracotta, #B5502F);
  color: #8C3B1E;
}

.warning-headline {
  color: var(--color-terracotta, #B5502F);
  font-size: 0.85rem;
}

.geoloc-banner.error {
  background: #FEF2F2;
  border: 1.5px solid #F87171;
  color: #991B1B;
}

.geoloc-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.geoloc-text strong {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 2px;
}

.geoloc-text p {
  font-size: 0.78rem;
  line-height: 1.35;
  margin: 0;
}

.btn-retry-gps {
  margin-top: 0.45rem;
  background: #991B1B;
  color: #FFFFFF;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

/* Outil de démonstration pédagogique */
.demo-test-switch {
  background: #F8FAF9;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.test-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-text-muted, #64748B);
}

.test-options {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.test-btn {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.25rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text, #0F172A);
  cursor: pointer;
  transition: all 0.15s ease;
}

.test-btn.active {
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  border-color: var(--color-primary, #1F4D3A);
}

/* 4. BOUTON D'ACTION & ENVOI */
.action-footer {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progression-box {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 0.45rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-primary, #1F4D3A);
  box-shadow: var(--shadow-sm);
}

.spinner-submit {
  width: 14px;
  height: 14px;
  border: 2px solid #E2E8F0;
  border-top-color: var(--color-primary, #1F4D3A);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-confirmer-nettoyage {
  width: 100%;
  min-height: 52px;
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 14px rgba(31, 77, 58, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
}

.btn-confirmer-nettoyage:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #163a2c);
  transform: translateY(-1px);
}

.btn-confirmer-nettoyage:disabled {
  background-color: #94A3B8;
  color: #F1F5F9;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.85;
}

.btn-inner {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-pts-tag {
  background-color: var(--color-amber, #E8A33D);
  color: #0F172A;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.footer-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748B);
}

/* Bannières Toast */
.success-banner {
  background: #EBF3EF;
  border: 1.5px solid #10B981;
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.18);
}

.success-icon {
  font-size: 1.8rem;
}

.success-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  color: #065F46;
  margin-bottom: 2px;
}

.success-desc {
  font-size: 0.82rem;
  color: #047857;
  margin: 0;
}

.badge-pts-clean {
  background: var(--color-amber, #E8A33D);
  color: #0F172A;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
}

.error-banner {
  background: #FEF2F2;
  border: 1.5px solid #F87171;
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 1.4rem;
}

.error-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: #991B1B;
  margin-bottom: 2px;
}

.error-desc {
  font-size: 0.8rem;
  color: #B91C1C;
  margin-bottom: 0.5rem;
}

.btn-reessayer {
  background: #DC2626;
  color: #FFFFFF;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 3rem 1rem;
  color: var(--color-primary, #1F4D3A);
  font-size: 0.85rem;
  font-weight: 600;
}

.spinner-forest {
  width: 22px;
  height: 22px;
  border: 3px solid #CBD5E1;
  border-top-color: var(--color-primary, #1F4D3A);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-gps {
  width: 18px;
  height: 18px;
  border: 2px solid #CBD5E1;
  border-top-color: #0284C7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.spinner-white {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
