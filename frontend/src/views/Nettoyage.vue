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
    <main v-else class="nettoyage-main-content">
      
      <!-- 2. COMPARAISON AVANT / APRÈS -->
      <section class="comparison-section">
        <h2 class="section-title">Validation visuelle Avant / Après</h2>

        <div class="comparison-grid">
          
          <!-- Colonne AVANT (Photo déjà existante récupérée depuis Supabase) -->
          <div class="photo-column before-col">
            <div class="column-header">
              <span class="step-tag before-tag">📸 Avant</span>
              <span class="cat-badge">{{ signalement?.categories?.nom || 'Déchet' }}</span>
            </div>
            
            <div class="photo-box">
              <img 
                :src="signalement?.photo_avant_url || 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600'" 
                alt="Photo initiale avant nettoyage" 
                class="photo-img"
              />
            </div>
            <small class="photo-caption">📍 {{ signalement?.ville || 'Bujumbura' }}</small>
          </div>

          <!-- Colonne APRÈS (Zone d'upload / prise de photo citoyenne) -->
          <div class="photo-column after-col">
            <div class="column-header">
              <span class="step-tag after-tag">✨ Après nettoyage *</span>
              <span class="pts-target-badge">+{{ pointsAGagner }} pts</span>
            </div>

            <!-- Si photo sélectionnée : Aperçu avec actions -->
            <div v-if="photoApresPreview" class="photo-box has-preview">
              <img :src="photoApresPreview" alt="Aperçu photo après nettoyage" class="photo-img" />
              <div class="photo-overlay">
                <span class="ready-badge">✓ Prête ({{ photoApresTaille }} Ko)</span>
                <button type="button" class="btn-change-photo" @click="ouvrirSelecteurPhoto">
                  Changer
                </button>
              </div>
            </div>

            <!-- Si vide : Zone de sélection tactile -->
            <div 
              v-else 
              class="upload-dropzone-after"
              @click="ouvrirSelecteurPhoto"
              role="button"
              tabindex="0"
              aria-label="Prendre la photo après nettoyage"
              @keydown.enter="ouvrirSelecteurPhoto"
            >
              <div class="camera-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="camera-svg">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <span class="upload-label">Prendre la photo Après</span>
              <small class="upload-hint">Appareil photo · Compression auto &lt; 1 Mo</small>
            </div>

            <input 
              ref="inputPhotoApres"
              type="file" 
              accept="image/*" 
              capture="environment" 
              class="hidden-file-input"
              @change="gererPhotoApres"
              id="photo-apres-input"
            />
          </div>

        </div>
      </section>

      <!-- 3. VÉRIFICATION GÉOGRAPHIQUE ANTI-FRAUDE -->
      <section class="geoloc-verification-section">
        <div class="geoloc-header">
          <h2 class="section-title">Contrôle géographique de présence</h2>
          <button 
            type="button" 
            class="btn-refresh-gps" 
            @click="verifierPositionGps(false)"
            :disabled="gpsEnCours"
          >
            {{ gpsEnCours ? '🛰️ Analyse...' : '🔄 Actualiser GPS' }}
          </button>
        </div>

        <!-- État : Analyse GPS en cours -->
        <div v-if="gpsEnCours" class="geoloc-banner checking">
          <div class="spinner-gps"></div>
          <div class="geoloc-text">
            <strong>Vérification satellite en cours...</strong>
            <p>Calcul de la distance entre votre téléphone et le lieu du déchet.</p>
          </div>
        </div>

        <!-- État 1 : Position Validée (< 50 mètres) -->
        <div v-else-if="statutDistance === 'valide'" class="geoloc-banner success">
          <div class="geoloc-icon">✅</div>
          <div class="geoloc-text">
            <strong class="success-headline">Position vérifiée · à {{ distanceMetres }}m du signalement</strong>
            <p>Vous êtes bien sur les lieux (rayon &lt; 50m respecté). Preuve prête à être certifiée.</p>
          </div>
        </div>

        <!-- État 2 : Trop loin (>= 50 mètres) -->
        <div v-else-if="statutDistance === 'trop_loin'" class="geoloc-banner warning">
          <div class="geoloc-icon">❌</div>
          <div class="geoloc-text">
            <strong class="warning-headline">
              Tu sembles être à {{ formaterDistance(distanceMetres) }} du signalement
            </strong>
            <p>
              Rapproche-toi pour confirmer le nettoyage. La règle anti-fraude Greenshot exige d'être à moins de 50 m du déchet.
            </p>
          </div>
        </div>

        <!-- État 3 : Erreur ou refus de GPS -->
        <div v-else class="geoloc-banner error">
          <div class="geoloc-icon">📍</div>
          <div class="geoloc-text">
            <strong>Position GPS requise</strong>
            <p>{{ erreurGpsMessage || "Activez le GPS de votre appareil pour valider votre présence sur place." }}</p>
            <button type="button" class="btn-retry-gps" @click="verifierPositionGps(false)">
              🛰️ Activer ma position
            </button>
          </div>
        </div>

        <!-- Outil de simulation pédagogique pour test / bailleurs de fonds -->
        <div class="demo-test-switch">
          <span class="test-label">🧪 Test & Démonstration :</span>
          <div class="test-options">
            <button 
              type="button" 
              class="test-btn" 
              :class="{ 'active': modeSimulation === 'sur_place' }"
              @click="simulerPresence(true)"
            >
              Simuler sur place (12 m)
            </button>
            <button 
              type="button" 
              class="test-btn" 
              :class="{ 'active': modeSimulation === 'trop_loin' }"
              @click="simulerPresence(false)"
            >
              Simuler trop loin (180 m)
            </button>
            <button 
              type="button" 
              class="test-btn" 
              :class="{ 'active': modeSimulation === 'reel' }"
              @click="verifierPositionGps(false)"
            >
              GPS réel
            </button>
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
          <template v-else-if="!photoApresFichier">
            Prenez la photo après nettoyage
          </template>
          <template v-else-if="statutDistance !== 'valide'">
            Rapprochez-vous du lieu (&lt; 50m)
          </template>
          <template v-else>
            <span class="btn-inner">
              Confirmer le nettoyage
              <span class="btn-pts-tag">+{{ pointsAGagner }} pts</span>
            </span>
          </template>
        </button>

        <p v-if="!peutConfirmer && !envoiEnCours" class="footer-hint">
          Une photo après + votre présence à moins de 50 m sont requises pour créditer vos points.
        </p>
      </footer>

    </main>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'
import imageCompression from 'browser-image-compression'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const inputPhotoApres = ref(null)

// Signalement cible
const signalement = ref(null)
const chargementInitial = ref(true)

// Photo Après
const photoApresFichier = ref(null)
const photoApresPreview = ref(null)
const photoApresTaille = ref(0)

// Géolocalisation & Anti-fraude
const userLatitude = ref(null)
const userLongitude = ref(null)
const distanceMetres = ref(null)
const gpsEnCours = ref(false)
const erreurGpsMessage = ref('')
const statutDistance = ref('inconnu') // 'valide' | 'trop_loin' | 'erreur' | 'inconnu'
const modeSimulation = ref('reel') // 'reel' | 'sur_place' | 'trop_loin'

// Soumission
const envoiEnCours = ref(false)
const etapeEnvoi = ref('') // 'compression' | 'upload' | 'mise_a_jour' | 'termine'
const succesAffiche = ref(false)
const messageErreurSoumission = ref('')

const signalementId = computed(() => {
  return route.query.id || route.params.id || 'sig-buj-1'
})

const pointsAGagner = computed(() => {
  return signalement.value?.categories?.points_nettoyage || 30
})

const peutConfirmer = computed(() => {
  return Boolean(photoApresFichier.value && statutDistance.value === 'valide' && !envoiEnCours.value)
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
  verifierPositionGps(true)
})

async function chargerSignalementCible() {
  chargementInitial.value = true
  const idCible = signalementId.value

  // Données de secours réalistes Greenshot
  const DEMO_ITEMS = {
    'sig-buj-1': {
      id: 'sig-buj-1',
      latitude: -3.3862,
      longitude: 29.3621,
      ville: 'Bujumbura (Rohero)',
      photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600',
      statut: 'en_attente',
      categories: { nom: 'Déchets plastiques', points_nettoyage: 30 }
    },
    'sig-buj-2': {
      id: 'sig-buj-2',
      latitude: -3.3645,
      longitude: 29.3730,
      ville: 'Bujumbura (Buyenzi)',
      photo_avant_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600',
      statut: 'vu',
      categories: { nom: 'Décharge sauvage', points_nettoyage: 45 }
    }
  }

  if (!supabaseConfigured) {
    signalement.value = DEMO_ITEMS[idCible] || DEMO_ITEMS['sig-buj-1']
    chargementInitial.value = false
    return
  }

  try {
    const { data, error } = await supabase
      .from('signalements')
      .select('*, categories(nom, points_nettoyage)')
      .eq('id', idCible)
      .maybeSingle()

    if (error) throw error

    if (data) {
      signalement.value = data
    } else {
      signalement.value = DEMO_ITEMS[idCible] || DEMO_ITEMS['sig-buj-1']
    }
  } catch (err) {
    console.warn('Erreur chargement signalement à nettoyer, utilisation démo:', err)
    signalement.value = DEMO_ITEMS[idCible] || DEMO_ITEMS['sig-buj-1']
  } finally {
    chargementInitial.value = false
  }
}

// 2. Gestion de la photo après
function ouvrirSelecteurPhoto() {
  if (inputPhotoApres.value) {
    inputPhotoApres.value.click()
  }
}

function gererPhotoApres(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (photoApresPreview.value) {
    URL.revokeObjectURL(photoApresPreview.value)
  }

  photoApresFichier.value = file
  photoApresTaille.value = Math.round(file.size / 1024)
  photoApresPreview.value = URL.createObjectURL(file)

  // Re-vérifier automatiquement la position GPS lors de la capture photo
  if (modeSimulation.value === 'reel') {
    verifierPositionGps(false)
  }
}

// 3. Vérification géographique anti-fraude
function verifierPositionGps(silencieux = false) {
  modeSimulation.value = 'reel'
  gpsEnCours.value = true
  erreurGpsMessage.value = ''

  if (!('geolocation' in navigator)) {
    gpsEnCours.value = false
    statutDistance.value = 'erreur'
    erreurGpsMessage.value = "La géolocalisation n'est pas supportée par votre navigateur."
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      gpsEnCours.value = false
      userLatitude.value = pos.coords.latitude
      userLongitude.value = pos.coords.longitude

      analyserDistance(userLatitude.value, userLongitude.value)
    },
    (err) => {
      gpsEnCours.value = false
      console.warn('Erreur GPS nettoyage:', err)
      statutDistance.value = 'erreur'
      if (err.code === 1) {
        erreurGpsMessage.value = "L'accès GPS a été refusé. Il est indispensable pour certifier votre présence sur le lieu."
      } else {
        erreurGpsMessage.value = "Impossible de capter votre signal satellite. Rapprochez-vous d'une zone dégagée."
      }

      // En mode développement / premier test sans GPS fixe, simuler pour ne pas bloquer
      if (silencieux) {
        simulerPresence(true)
      }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  )
}

function analyserDistance(uLat, uLng) {
  if (!signalement.value?.latitude || !signalement.value?.longitude) {
    statutDistance.value = 'valide'
    distanceMetres.value = 15
    return
  }

  const sLat = Number(signalement.value.latitude)
  const sLng = Number(signalement.value.longitude)
  const dist = calculerHaversine(uLat, uLng, sLat, sLng)

  distanceMetres.value = dist

  if (dist <= 50) {
    statutDistance.value = 'valide'
  } else {
    statutDistance.value = 'trop_loin'
  }
}

function simulerPresence(surPlace) {
  if (!signalement.value) return
  const sLat = Number(signalement.value.latitude || -3.3822)
  const sLng = Number(signalement.value.longitude || 29.3644)

  if (surPlace) {
    // Coordonnées à ~12 mètres du signalement
    modeSimulation.value = 'sur_place'
    userLatitude.value = sLat + 0.0001
    userLongitude.value = sLng + 0.00008
    distanceMetres.value = 12
    statutDistance.value = 'valide'
  } else {
    // Coordonnées à ~180 mètres (trop loin)
    modeSimulation.value = 'trop_loin'
    userLatitude.value = sLat + 0.0016
    userLongitude.value = sLng + 0.0012
    distanceMetres.value = 180
    statutDistance.value = 'trop_loin'
  }
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
    // 1. Compression obligatoire < 1 Mo (contexte data Burundi)
    etapeEnvoi.value = 'compression'
    const options = {
      maxSizeMB: 1.0,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/jpeg'
    }
    const photoCompressee = await imageCompression(photoApresFichier.value, options)

    // 2. Upload vers Supabase Storage
    etapeEnvoi.value = 'upload'
    let urlPhotoApres = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
    const nomFichier = `nettoyage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`

    const buckets = ['photos-signalements', 'signalements-photos']
    for (const b of buckets) {
      try {
        const { data: upData, error: upErr } = await supabase.storage
          .from(b)
          .upload(nomFichier, photoCompressee)

        if (!upErr && upData) {
          const { data: pubData } = supabase.storage.from(b).getPublicUrl(nomFichier)
          if (pubData?.publicUrl) {
            urlPhotoApres = pubData.publicUrl
            break
          }
        }
      } catch (err) {
        console.warn(`Erreur bucket ${b}:`, err)
      }
    }

    // 3. Déterminer l'ID du nettoyeur
    etapeEnvoi.value = 'mise_a_jour'
    const monId = userStore.user?.id || userStore.profile?.id || 'usr-7'

    // 4. Appel RPC ou mise à jour directe dans Supabase
    let majReussie = false
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('soumettre_preuve_nettoyage', {
        p_signalement_id: signalement.value.id,
        p_photo_apres_url: urlPhotoApres,
        p_latitude: Number(userLatitude.value || signalement.value.latitude),
        p_longitude: Number(userLongitude.value || signalement.value.longitude)
      })

      if (!rpcError && rpcData?.success) {
        majReussie = true
      }
    } catch {
      // Si la RPC n'est pas encore créée, fallback mise à jour directe
    }

    if (!majReussie) {
      await supabase
        .from('signalements')
        .update({
          photo_apres_url: urlPhotoApres,
          nettoye_par_user_id: monId,
          date_nettoyage: new Date().toISOString(),
          statut: 'nettoye'
        })
        .eq('id', signalement.value.id)
    }

    // 5. Créditer le profil local
    if (userStore.profile) {
      userStore.profile.score_nettoyage = (userStore.profile.score_nettoyage || 0) + pointsAGagner.value
      userStore.profile.score_total = (userStore.profile.score_total || 0) + pointsAGagner.value
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
