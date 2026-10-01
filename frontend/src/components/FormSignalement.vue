<template>
  <div class="form-signalement-container">
    <form @submit.prevent="soumettreSignalement" class="signalement-form">
      
      <!-- 1. Prise de Photo -->
      <div class="form-group">
        <label class="label-title">📸 1. Prenez une photo du problème environnemental :</label>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          required 
          @change="gererSelectionPhoto"
          class="file-input"
        />
        <small class="compress-notice">⚡ Compression automatique appliquée avant envoi pour économiser votre data.</small>

        <div v-if="photoPreview" class="preview-container">
          <img :src="photoPreview" alt="Aperçu photo" class="preview-img" />
        </div>
      </div>

      <!-- 2. Géolocalisation automatique (modifiable) -->
      <div class="form-group">
        <label class="label-title">📍 2. Localisation GPS :</label>
        <div v-if="gpsEnCours" class="gps-status checking">
          🛰️ Recherche du signal satellite GPS en cours...
        </div>
        <div v-else-if="gpsCoordonnees" class="gps-status success">
          ✅ Coordonnées capturées : {{ Number(gpsCoordonnees.lat).toFixed(5) }}, {{ Number(gpsCoordonnees.lng).toFixed(5) }}
        </div>
        <div v-else class="gps-status warning">
          ⚠️ GPS non capturé. <button type="button" @click="capturerGps" class="btn-gps">Réessayer</button>
        </div>

        <!--
          Le GPS est capturé automatiquement à l'ouverture du formulaire.
          Certains endroits (sous un toit, ruelle étroite, GPS erratique)
          donnent une position imprécise : l'utilisateur peut donc corriger
          les coordonnées à la main. La correction manuelle est prioritaire,
          la capture automatique ne s'exécutant qu'une fois au chargement.
        -->
        <div v-if="gpsCoordonnees" class="gps-edit">
          <p class="gps-edit-help">
            Si l'endroit est mal identifié (GPS faible, sous un toit…), corrigez les coordonnées :
          </p>
          <div class="gps-inputs">
            <label class="gps-input-label">
              Latitude
              <input
                v-model.number="gpsCoordonnees.lat"
                type="number"
                step="0.0000001"
                min="-90"
                max="90"
                class="text-input"
              />
            </label>
            <label class="gps-input-label">
              Longitude
              <input
                v-model.number="gpsCoordonnees.lng"
                type="number"
                step="0.0000001"
                min="-180"
                max="180"
                class="text-input"
              />
            </label>
          </div>
          <div class="gps-actions">
            <button type="button" @click="capturerGps" class="btn-gps">
              📡 Recapturer
            </button>
            <span v-if="gpsModifie" class="gps-modified">✏️ Position corrigée manuellement</span>
          </div>
        </div>

        <div v-if="erreurGps" class="gps-status warning">
          {{ erreurGps }}
        </div>
      </div>

      <!-- 3. Choix de la catégorie -->
      <div class="form-group">
        <label class="label-title">🏷️ 3. Catégorie du problème :</label>
        <select v-model="categorieChoisie" required class="select-input">
          <option value="" disabled>Sélectionnez une catégorie</option>
          <option v-for="cat in categoriesDisponibles" :key="cat.id" :value="cat.id">
            {{ cat.nom }} (+{{ cat.points_signalement || 10 }} pts)
          </option>
        </select>
      </div>

      <!-- 4. Ville / Commune -->
      <div class="form-group">
        <label class="label-title">🏙️ 4. Ville / Commune :</label>
        <input 
          type="text" 
          v-model="ville" 
          placeholder="Ex: Bujumbura (Mukaza, Rohero...)" 
          class="text-input"
        />
      </div>

      <!-- 5. Description optionnelle -->
      <div class="form-group">
        <label class="label-title">📝 5. Brève description (optionnelle) :</label>
        <textarea 
          v-model="description" 
          placeholder="Précisez la nature des déchets ou l'accès..." 
          rows="3"
          class="textarea-input"
        ></textarea>
      </div>

      <div v-if="raisonBloquant" class="alert-error">
        ⚠️ {{ raisonBloquant }}
        <RouterLink v-if="!userStore.isAuthenticated" to="/connexion" class="alert-link">
          Se connecter
        </RouterLink>
      </div>

      <div v-if="messageErreur" class="alert-error">
        {{ messageErreur }}
      </div>

      <div v-if="messageSucces" class="alert-success">
        🎉 {{ messageSucces }}
      </div>

      <!-- Bouton Soumission -->
      <button
        type="submit"
        class="btn-submit"
        :disabled="envoiEnCours || !peutEnvoyer"
      >
        <span v-if="envoiEnCours">Compression et téléversement en cours...</span>
        <span v-else>Envoyer mon signalement citoyen</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'
import imageCompression from 'browser-image-compression'

const router = useRouter()
const userStore = useUserStore()

const photoFichier = ref(null)
const photoPreview = ref(null)
const gpsCoordonnees = ref(null)
const gpsEnCours = ref(false)
const gpsModifie = ref(false)
const erreurGps = ref('')
const categoriesDisponibles = ref([])
const categorieChoisie = ref('')
const ville = ref('Bujumbura')
const description = ref('')

const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')

onMounted(async () => {
  capturerGps()
  await chargerCategories()
})

// Capture automatique de la position.
// IMPORTANT : en cas d'échec, on ne substitue PLUS une position par défaut
// (Bujumbura centre-ville). Un signalement géolocalisé au centre-ville alors
// que l'utilisateur est à Rohero polluait la carte et les statistiques
// envoyées aux bailleurs. L'utilisateur doit saisir la position à la main.
function capturerGps() {
  erreurGps.value = ''

  if (!('geolocation' in navigator)) {
    erreurGps.value = "La géolocalisation n'est pas disponible sur cet appareil. Saisissez les coordonnées à la main."
    return
  }

  gpsEnCours.value = true
  gpsModifie.value = false

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      gpsCoordonnees.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
      gpsEnCours.value = false
    },
    (err) => {
      console.warn('GPS indisponible:', err)
      gpsEnCours.value = false
      gpsCoordonnees.value = null
      erreurGps.value =
        err.code === err.PERMISSION_DENIED
          ? "Accès à la localisation refusé. Autorisez-le dans votre navigateur, ou saisissez les coordonnées à la main."
          : 'Position GPS introuvable (signal faible). Saisissez les coordonnées à la main.'
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  )
}

// Validation des coordonnées avant envoi (saisie manuelle ou GPS)
// La colonne est en NUMERIC(10,7) : on refuse en amont les valeurs
// aberrantes que Postgres rejeterait, et le cas du Burundi est signalé
// explicitement pour éviter une erreur de saisie.
function validerGps() {
  if (!gpsCoordonnees.value) {
    erreurGps.value = 'La localisation est obligatoire pour envoyer un signalement.'
    return false
  }

  const lat = Number(gpsCoordonnees.value.lat)
  const lng = Number(gpsCoordonnees.value.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    erreurGps.value = 'Coordonnées invalides. Vérifiez les valeurs saisies.'
    return false
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    erreurGps.value = 'Coordonnées hors de la plage du globe (latitude -90..90, longitude -180..180).'
    return false
  }

  if (lat < -5 || lat > -2 || lng < 28 || lng > 32) {
    erreurGps.value = 'Ces coordonnées sont hors du Burundi. Vérifiez la saisie, ou utilisez 📡 Recapturer.'
    return false
  }

  gpsCoordonnees.value.lat = lat
  gpsCoordonnees.value.lng = lng
  erreurGps.value = ''
  return true
}

// Détecte une correction manuelle pour l'afficher à l'utilisateur
watch(gpsCoordonnees, (nv, old) => {
  if (!nv || !old) return
  if (Number(nv.lat) !== Number(old.lat) || Number(nv.lng) !== Number(old.lng)) {
    gpsModifie.value = true
  }
}, { deep: true })

async function chargerCategories() {
  if (!supabaseConfigured) {
    appliquerCategoriesSecours()
    return
  }

  try {
    const { data } = await supabase.from('categories').select('*').order('points_signalement', { ascending: false })
    if (data && data.length > 0) {
      categoriesDisponibles.value = data
      categorieChoisie.value = data[0].id
    } else {
      appliquerCategoriesSecours()
    }
  } catch (err) {
    console.warn('Erreur chargement categories:', err)
    appliquerCategoriesSecours()
  }
}

// Catégories de secours affichées quand Supabase est injoignable.
// ⚠️ Elles ne sont PAS soumettibles : leurs `id` sont des chaînes ('1'..'5')
// qui ne correspondent à aucun UUID réel et violeraient la clé étrangère
// `categorie_id`. Avant, l'utilisateur remplissait le formulaire pour voir
// ensuite un échec d'insertion incompréhensible.
const categoriesSecours = ref(false)

function appliquerCategoriesSecours() {
  categoriesSecours.value = true
  categoriesDisponibles.value = [
    { id: '1', nom: 'Déchets plastiques', points_signalement: 10 },
    { id: '2', nom: 'Décharge sauvage', points_signalement: 15 },
    { id: '3', nom: 'Pollution eau', points_signalement: 20 },
    { id: '4', nom: 'Déforestation', points_signalement: 20 },
    { id: '5', nom: 'Autre', points_signalement: 10 }
  ]
  categorieChoisie.value = '1'
}

function gererSelectionPhoto(event) {
  const file = event.target.files[0]
  if (!file) return
  photoFichier.value = file
  photoPreview.value = URL.createObjectURL(file)
}

const peutEnvoyer = computed(() => {
  return photoFichier.value
    && gpsCoordonnees.value
    && categorieChoisie.value
    && !categoriesSecours.value
    && !gpsEnCours.value
    && userStore.isAuthenticated
})

const raisonBloquant = computed(() => {
  if (categoriesSecours.value) {
    return "Connexion à la base impossible. Le signalement ne peut pas être envoyé pour le moment."
  }
  if (!userStore.isAuthenticated) {
    return "Connectez-vous pour déposer un signalement."
  }
  if (!userStore.peutSignaler()) {
    return "Vérifiez votre adresse email avant de signaler un problème."
  }
  return ''
})

async function soumettreSignalement() {
  if (!validerGps()) return
  if (raisonBloquant.value) {
    messageErreur.value = raisonBloquant.value
    return
  }
  if (!peutEnvoyer.value) return

  envoiEnCours.value = true
  messageErreur.value = ''
  messageSucces.value = ''

  try {
    // 1. Compression client (obligatoire pour le Burundi)
    const options = {
      maxSizeMB: 0.35,
      maxWidthOrHeight: 1280,
      useWebWorker: true
    }
    const photoCompressee = await imageCompression(photoFichier.value, options)

    // 2. Upload photo vers Supabase Storage
    // Plus de repli sur une photo Unsplash : une fausse image de preuve
    // fausseuse la géolocalisation ET le score de nettoyage du site.
    const fileName = `signalement-${Date.now()}.jpg`
    const { error: uploadErr } = await supabase.storage
      .from('signalements-photos')
      .upload(fileName, photoCompressee)

    if (uploadErr) {
      throw new Error("La photo n'a pas pu être envoyée. Vérifiez votre connexion internet et réessayez.")
    }

    const { data: publicData } = supabase.storage
      .from('signalements-photos')
      .getPublicUrl(fileName)
    const photoUrl = publicData.publicUrl

    // 3. Récupérer l'utilisateur authentifié
    // Plus de repli sur un UUID nul : il violait la clé étrangère user_id
    // et la politique RLS (auth.uid() = user_id), donc l'insert échouait.
    const currentUserId = userStore.user?.id
    if (!currentUserId) {
      throw new Error('Session expirée. Reconnectez-vous pour envoyer votre signalement.')
    }

    // 4. Insertion dans la table signalements
    // Le statut n'est PAS envoyé : il prend sa valeur par défaut 'en_attente'.
    // Les droits d'insertion sont limités aux colonnes ci-dessous, donc
    // un client ne peut pas déclarer un signalement déjà nettoyé.
    const { error: insertErr } = await supabase
      .from('signalements')
      .insert({
        user_id: currentUserId,
        categorie_id: categorieChoisie.value,
        photo_avant_url: photoUrl,
        latitude: gpsCoordonnees.value.lat,
        longitude: gpsCoordonnees.value.lng,
        ville: ville.value,
        description: description.value
      })

    if (insertErr) {
      // 42501 = permission RLS refusée : email non vérifié le plus souvent
      if (insertErr.code === '42501') {
        throw new Error("Signalement refusé : vous devez avoir vérifié votre adresse email. Vérifiez votre boîte de réception.")
      }
      throw insertErr
    }

    messageSucces.value = 'Votre signalement a été enregistré avec succès ! Vos points ont été crédités.'
    setTimeout(() => {
      router.push('/carte')
    }, 1500)

  } catch (err) {
    console.error('Erreur soumission signalement:', err)
    messageErreur.value = err.message || "Erreur lors de l'envoi du signalement."
  } finally {
    envoiEnCours.value = false
  }
}
</script>

<style scoped>
.form-signalement-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
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

.file-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

.compress-notice {
  display: block;
  font-size: 0.75rem;
  color: #059669;
  margin-top: 0.25rem;
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

/* --- Correction manuelle de la position GPS --- */
.gps-edit {
  margin-top: 0.6rem;
  padding: 0.75rem;
  background: #F8FAFC;
  border: 1px dashed #CBD5E1;
  border-radius: 6px;
}

.gps-edit-help {
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  color: #64748B;
  line-height: 1.4;
}

.gps-inputs {
  display: flex;
  gap: 0.75rem;
}

.gps-input-label {
  flex: 1;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 500;
}

.gps-input-label .text-input {
  margin-top: 0.2rem;
  font-size: 0.85rem;
}

.gps-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.gps-actions .btn-gps {
  margin-left: 0;
}

.gps-modified {
  font-size: 0.72rem;
  color: #92400E;
  font-weight: 500;
}

.alert-link {
  color: #1E40AF;
  font-weight: 600;
  text-decoration: underline;
  margin-left: 0.35rem;
}

.select-input, .text-input, .textarea-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
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
  padding: 0.85rem;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-submit:hover {
  background: #059669;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
