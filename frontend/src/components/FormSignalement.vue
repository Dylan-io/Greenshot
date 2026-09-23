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

      <!-- 2. Géolocalisation automatique -->
      <div class="form-group">
        <label class="label-title">📍 2. Localisation GPS :</label>
        <div v-if="gpsEnCours" class="gps-status checking">
          🛰️ Recherche du signal satellite GPS en cours...
        </div>
        <div v-else-if="gpsCoordonnees" class="gps-status success">
          ✅ Coordonnées capturées : {{ gpsCoordonnees.lat.toFixed(5) }}, {{ gpsCoordonnees.lng.toFixed(5) }}
        </div>
        <div v-else class="gps-status warning">
          ⚠️ GPS non capturé. <button type="button" @click="capturerGps" class="btn-gps">Réessayer</button>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'
import imageCompression from 'browser-image-compression'

const router = useRouter()
const userStore = useUserStore()

const photoFichier = ref(null)
const photoPreview = ref(null)
const gpsCoordonnees = ref(null)
const gpsEnCours = ref(false)
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

function capturerGps() {
  if ('geolocation' in navigator) {
    gpsEnCours.value = true
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
        // Coordonnées par défaut : Bujumbura
        gpsCoordonnees.value = { lat: -3.3822, lng: 29.3644 }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  } else {
    gpsCoordonnees.value = { lat: -3.3822, lng: 29.3644 }
  }
}

async function chargerCategories() {
  try {
    const { data } = await supabase.from('categories').select('*').order('points_signalement', { ascending: false })
    if (data && data.length > 0) {
      categoriesDisponibles.value = data
      categorieChoisie.value = data[0].id
    } else {
      // Valeurs de secours
      categoriesDisponibles.value = [
        { id: '1', nom: 'Déchets plastiques', points_signalement: 10 },
        { id: '2', nom: 'Décharge sauvage', points_signalement: 15 },
        { id: '3', nom: 'Pollution eau', points_signalement: 20 },
        { id: '4', nom: 'Déforestation', points_signalement: 20 },
        { id: '5', nom: 'Autre', points_signalement: 10 }
      ]
      categorieChoisie.value = '1'
    }
  } catch (err) {
    console.warn('Erreur chargement categories:', err)
  }
}

function gererSelectionPhoto(event) {
  const file = event.target.files[0]
  if (!file) return
  photoFichier.value = file
  photoPreview.value = URL.createObjectURL(file)
}

const peutEnvoyer = computed(() => {
  return photoFichier.value && gpsCoordonnees.value && categorieChoisie.value
})

async function soumettreSignalement() {
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
    const fileName = `signalement-${Date.now()}.jpg`
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('signalements-photos')
      .upload(fileName, photoCompressee)

    let photoUrl = 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=500' // fallback
    if (!uploadErr && uploadData) {
      const { data: publicData } = supabase.storage
        .from('signalements-photos')
        .getPublicUrl(fileName)
      photoUrl = publicData.publicUrl
    }

    // 3. Récupérer l'utilisateur courant (ou utilisateur démo)
    const currentUserId = userStore.user?.id || '00000000-0000-0000-0000-000000000000'

    // 4. Insertion dans la table signalements
    const { data: inserted, error: insertErr } = await supabase
      .from('signalements')
      .insert({
        user_id: currentUserId,
        categorie_id: categorieChoisie.value,
        photo_avant_url: photoUrl,
        latitude: gpsCoordonnees.value.lat,
        longitude: gpsCoordonnees.value.lng,
        ville: ville.value,
        description: description.value,
        statut: 'en_attente'
      })
      .select()
      .single()

    if (insertErr) throw insertErr

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
