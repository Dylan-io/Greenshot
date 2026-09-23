<template>
  <div class="page-nettoyage">
    <div class="page-header">
      <h2>🧹 Preuve de Nettoyage</h2>
      <p class="subtitle">
        Agissez concrètement pour votre quartier, prouvez votre action avec une photo et gagnez des points bonus !
      </p>
    </div>

    <!-- 1. AVERTISSEMENT DE SÉCURITÉ OBLIGATOIRE -->
    <div class="security-card">
      <div class="warning-badge">⚠️ SÉCURITÉ CITOYENNE ESSENTIELLE</div>
      <p class="warning-content">
        Ne manipulez <strong>JAMAIS</strong> d'objets dangereux : seringues, déchets hospitaliers, verre brisé coupant, solvants ou produits chimiques toxiques.
        Dans ces cas à risque, <strong>signalez seulement</strong> le problème sur la plateforme et n'intervenez pas vous-même.
      </p>
    </div>

    <!-- 2. SÉLECTION DU SIGNALEMENT OU FORMULAIRE DIRECT -->
    <div v-if="!signalementSelectionne" class="selection-box">
      <h3>Choisissez un signalement à nettoyer</h3>
      <p class="help-text">Sélectionnez une zone signalée près de chez vous ou accédez-y depuis la carte.</p>
      
      <div v-if="chargement" class="loading-state">
        Chargement des zones à nettoyer...
      </div>
      
      <div v-else-if="signalementsDisponibles.length === 0" class="empty-state">
        Aucun signalement en attente de nettoyage pour le moment.
      </div>

      <div v-else class="signalements-grid">
        <div 
          v-for="sig in signalementsDisponibles" 
          :key="sig.id" 
          class="sig-card"
          @click="selectionnerSignalement(sig)"
        >
          <img :src="sig.photo_avant_url" alt="Photo avant" class="sig-thumb" />
          <div class="sig-info">
            <span class="sig-cat">{{ sig.categories?.nom || 'Signalement' }}</span>
            <span class="sig-location">📍 {{ sig.ville || 'Bujumbura' }}</span>
            <p class="sig-desc">{{ sig.description || 'Pas de description' }}</p>
            <button class="btn-action">Je nettoie cet endroit</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. FORMULAIRE DE VALIDATION DE PREUVE DE NETTOYAGE -->
    <div v-else class="proof-form-card">
      <div class="form-header">
        <button class="btn-back" @click="signalementSelectionne = null">← Changer de zone</button>
        <h3>Nettoyage : {{ signalementSelectionne.categories?.nom || 'Zone signalée' }}</h3>
      </div>

      <!-- Comparatif Avant -->
      <div class="before-preview">
        <label>Photo avant signalée :</label>
        <img :src="signalementSelectionne.photo_avant_url" alt="Avant" class="img-before" />
      </div>

      <!-- Upload Photo Après -->
      <div class="form-group">
        <label class="form-label">Prenez une photo APRÈS votre nettoyage :</label>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          @change="gererSelectionPhotoApres"
          class="file-input"
        />
        <small class="compress-notice">⚡ Compression automatique appliquée avant envoi pour préserver votre forfait data.</small>
      </div>

      <div v-if="photoApresPreview" class="after-preview">
        <img :src="photoApresPreview" alt="Aperçu après" class="img-after" />
      </div>

      <!-- Statut de la vérification GPS anti-fraude (50 mètres) -->
      <div v-if="verificationEnCours" class="gps-box checking">
        📡 Vérification de votre position GPS par rapport à la zone...
      </div>

      <div v-else-if="erreurDistance" class="gps-box error">
        ❌ <strong>Position trop éloignée ({{ distanceCalculee }} mètres) :</strong>
        Vous devez être à moins de 50 mètres de la zone signalée pour valider le nettoyage et recevoir vos points.
      </div>

      <div v-else-if="distanceCalculee !== null" class="gps-box success">
        ✅ <strong>Position validée ({{ distanceCalculee }} mètres) :</strong> Vous êtes bien sur les lieux !
      </div>

      <div v-if="messageErreur" class="alert-error">
        {{ messageErreur }}
      </div>

      <div v-if="messageSucces" class="alert-success">
        🎉 {{ messageSucces }}
      </div>

      <button 
        class="btn-submit" 
        :disabled="envoiEnCours || !peutSoumettre"
        @click="validerNettoyage"
      >
        <span v-if="envoiEnCours">Envoi et compression en cours...</span>
        <span v-else>Envoyer la preuve et obtenir les points</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../services/supabaseClient'
import imageCompression from 'browser-image-compression'

const route = useRoute()
const router = useRouter()

const signalementsDisponibles = ref([])
const signalementSelectionne = ref(null)
const chargement = ref(false)

const photoApresFichier = ref(null)
const photoApresPreview = ref(null)
const positionUtilisateur = ref(null)
const distanceCalculee = ref(null)
const erreurDistance = ref(false)
const verificationEnCours = ref(false)

const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')

onMounted(async () => {
  await chargerSignalements()
  // Si un ID est passé en query param
  if (route.query.id) {
    const cible = signalementsDisponibles.value.find(s => s.id === route.query.id)
    if (cible) {
      selectionnerSignalement(cible)
    }
  }
})

async function chargerSignalements() {
  chargement.value = true
  try {
    const { data, error } = await supabase
      .from('signalements')
      .select('*, categories(nom, points_nettoyage)')
      .in('statut', ['en_attente', 'vu'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    signalementsDisponibles.value = data || []
  } catch (err) {
    console.error('Erreur chargement signalements à nettoyer:', err)
  } finally {
    chargement.value = false
  }
}

function selectionnerSignalement(sig) {
  signalementSelectionne.value = sig
  photoApresFichier.value = null
  photoApresPreview.value = null
  distanceCalculee.value = null
  erreurDistance.value = false
  messageErreur.value = ''
  messageSucces.value = ''
}

// Calcul de la distance géodésique Haversine (en mètres)
function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

async function gererSelectionPhotoApres(event) {
  const file = event.target.files[0]
  if (!file) return

  photoApresFichier.value = file
  photoApresPreview.value = URL.createObjectURL(file)

  // Vérification GPS immédiate
  if ('geolocation' in navigator) {
    verificationEnCours.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        positionUtilisateur.value = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
        const dist = calculerDistance(
          signalementSelectionne.value.latitude,
          signalementSelectionne.value.longitude,
          pos.coords.latitude,
          pos.coords.longitude
        )
        distanceCalculee.value = dist
        erreurDistance.value = dist > 50 // Seuil anti-fraude: 50 mètres
        verificationEnCours.value = false
      },
      (err) => {
        console.warn('Erreur GPS:', err)
        verificationEnCours.value = false
        messageErreur.value = 'Impossible de capturer votre position GPS. Veuillez autoriser la géolocalisation.'
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
}

const peutSoumettre = computed(() => {
  return photoApresFichier.value && 
         !erreurDistance.value && 
         distanceCalculee.value !== null &&
         !verificationEnCours.value
})

async function validerNettoyage() {
  if (!peutSoumettre.value) return

  envoiEnCours.value = true
  messageErreur.value = ''
  messageSucces.value = ''

  try {
    // 1. Compression photo côté client (Crucial pour la data burundaise)
    const optionsCompression = {
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1280,
      useWebWorker: true
    }
    const photoCompressee = await imageCompression(photoApresFichier.value, optionsCompression)

    // 2. Upload vers Supabase Storage
    const fileName = `nettoyage-${signalementSelectionne.value.id}-${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signalements-photos')
      .upload(fileName, photoCompressee)

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from('signalements-photos')
      .getPublicUrl(fileName)

    const photoUrl = publicUrlData.publicUrl

    // 3. Appel de la fonction RPC Supabase (avec vérification PostGIS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('soumettre_preuve_nettoyage', {
      p_signalement_id: signalementSelectionne.value.id,
      p_photo_apres_url: photoUrl,
      p_latitude: positionUtilisateur.value.lat,
      p_longitude: positionUtilisateur.value.lng
    })

    if (rpcError) throw rpcError

    if (rpcResult && !rpcResult.success) {
      messageErreur.value = rpcResult.message
      return
    }

    messageSucces.value = 'Preuve validée ! Vos points de nettoyage ont été crédités à votre profil.'
    setTimeout(() => {
      router.push(`/signalement/${signalementSelectionne.value.id}`)
    }, 2000)

  } catch (err) {
    console.error('Erreur soumission nettoyage:', err)
    messageErreur.value = err.message || 'Une erreur est survenue lors de la soumission.'
  } finally {
    envoiEnCours.value = false
  }
}
</script>

<style scoped>
.page-nettoyage {
  max-width: 640px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.25rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

/* Carte de sécurité citoyenne */
.security-card {
  background: #FFFBEB;
  border: 1px solid #FCD34D;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.warning-badge {
  font-weight: 700;
  color: #B45309;
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
}

.warning-content {
  color: #78350F;
  font-size: 0.85rem;
  line-height: 1.4;
}

/* Grille de sélection */
.selection-box h3 {
  font-size: 1.15rem;
  margin-bottom: 0.25rem;
}

.help-text {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.signalements-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.sig-card {
  display: flex;
  gap: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.sig-card:hover {
  transform: translateY(-2px);
  border-color: #E8A33D;
}

.sig-thumb {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
}

.sig-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
}

.sig-cat {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f172a;
}

.sig-location {
  font-size: 0.8rem;
  color: #64748b;
}

.sig-desc {
  font-size: 0.8rem;
  color: #475569;
  margin: 0.25rem 0;
}

.btn-action {
  align-self: flex-start;
  padding: 0.35rem 0.75rem;
  background: #E8A33D;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

/* Formulaire Preuve */
.proof-form-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
}

.form-header {
  margin-bottom: 1rem;
}

.btn-back {
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.85rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.before-preview {
  margin-bottom: 1.25rem;
}

.before-preview label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #475569;
}

.img-before, .img-after {
  max-height: 200px;
  width: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
}

.file-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
}

.compress-notice {
  display: block;
  font-size: 0.75rem;
  color: #059669;
  margin-top: 0.35rem;
}

.after-preview {
  margin-bottom: 1rem;
}

.gps-box {
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.gps-box.checking {
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
}

.gps-box.error {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

.gps-box.success {
  background: #ECFDF5;
  color: #065F46;
  border: 1px solid #A7F3D0;
}

.alert-error {
  padding: 0.75rem;
  background: #FEF2F2;
  color: #991B1B;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.alert-success {
  padding: 0.75rem;
  background: #ECFDF5;
  color: #065F46;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
