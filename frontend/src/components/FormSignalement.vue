<template>
  <form novalidate @submit.prevent="soumettreSignalement">
    <section class="card step">
      <p class="eyebrow">Étape 1</p>
      <h2 class="step__title">Photo du déchet</h2>
      <p class="step__hint">
        Une photo nette accélère la validation. Elle est compressée automatiquement
        avant l'envoi pour économiser votre data.
      </p>

      <label class="dropzone" :class="{ 'has-preview': photoPreview }">
        <input
          type="file"
          class="dropzone__input"
          accept="image/*"
          capture="environment"
          required
          @change="gererSelectionPhoto"
        />
        <img v-if="photoPreview" :src="photoPreview" alt="Aperçu du déchet photographié" class="dropzone__preview" />
        <span v-else class="dropzone__cta">
          <svg class="ic ic--lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M4 8h3l2-2h6l2 2h3v11H4z" stroke-linejoin="round" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
          <span class="dropzone__label">Prendre une photo</span>
        </span>
      </label>
      <span class="sr-only">
        La photo du déchet est obligatoire. Ouvrez l'appareil photo ou choisissez un fichier.
      </span>
    </section>

    <section class="card step">
      <p class="eyebrow">Étape 2</p>
      <h2 class="step__title">Type de déchet</h2>

      <div class="choices" role="radiogroup" aria-label="Type de déchet">
        <button
          v-for="cat in categoriesDisponibles"
          :key="cat.id"
          type="button"
          role="radio"
          class="choice"
          :class="{ 'is-on': categorieChoisie === cat.id }"
          :aria-checked="categorieChoisie === cat.id"
          @click="categorieChoisie = cat.id"
        >
          {{ cat.nom }}
        </button>
      </div>

      <p v-if="categoriesSecours" class="alert alert--warn" role="status">
        Connexion à la base impossible. Les catégories affichées ne sont pas soumissibles.
      </p>
    </section>

    <section class="card step">
      <p class="eyebrow">Étape 3</p>
      <h2 class="step__title">Emplacement</h2>

      <p v-if="gpsEnCours" class="alert" role="status">
        Recherche du signal GPS…
      </p>

      <template v-else-if="gpsCoordonnees">
        <p class="alert alert--ok" role="status">
          Position détectée · précision {{ precisionGps ?? '—' }} m
        </p>
        <p class="step__hint">Sous un toit ou dans une ruelle, corrigez à la main :</p>
        <div class="coords">
          <label class="field">
            <span class="field__label">Latitude</span>
            <input
              v-model.number="gpsCoordonnees.lat"
              type="number"
              step="0.0000001"
              min="-5"
              max="-2"
              class="field__control"
              required
            />
          </label>
          <label class="field">
            <span class="field__label">Longitude</span>
            <input
              v-model.number="gpsCoordonnees.lng"
              type="number"
              step="0.0000001"
              min="28"
              max="32"
              class="field__control"
              required
            />
          </label>
        </div>
        <button type="button" class="btn btn--secondary btn--sm" @click="capturerGps">
          Recapturer
        </button>
        <p v-if="gpsModifie" class="step__hint">Position corrigée manuellement.</p>
      </template>

      <template v-else>
        <p class="alert alert--warn" role="status">
          {{ erreurGps || 'Position GPS introuvable.' }}
        </p>
        <button type="button" class="btn btn--secondary btn--sm" @click="capturerGps">
          Réessayer
        </button>
      </template>

      <label class="field">
        <span class="field__label">Ville</span>
        <select v-model="ville" class="field__control">
          <option value="Bujumbura">Bujumbura</option>
          <option value="Gitega">Gitega</option>
          <option value="Ngozi">Ngozi</option>
        </select>
      </label>
    </section>

    <section class="card step">
      <label class="field">
        <span class="field__label">Description (facultatif)</span>
        <textarea v-model="description" rows="3" class="field__control" placeholder="Précisez si nécessaire." />
      </label>
    </section>

    <p v-if="raisonBloquant" class="alert alert--warn" role="status">{{ raisonBloquant }}</p>
    <p v-if="messageErreur" class="alert alert--err" role="alert">{{ messageErreur }}</p>
    <p v-if="messageSucces" class="alert alert--ok" role="status">{{ messageSucces }}</p>

    <button type="submit" class="btn btn--primary btn--block" :disabled="!peutEnvoyer || envoiEnCours">
      {{ envoiEnCours ? 'Envoi en cours…' : 'Publier le signalement' }}
    </button>
  </form>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
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
const precisionGps = ref(null)
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
      precisionGps.value = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null
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
    erreurGps.value = 'Ces coordonnées sont hors du Burundi. Vérifiez la saisie, ou utilisez Recapturer.'
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

    messageSucces.value = 'Votre signalement a été enregistré. Vos points ont été crédités.'
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
.step {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.step__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.step__hint {
  margin: 0;
  font-size: 13px;
  color: var(--fern);
  line-height: 1.5;
}

.dropzone {
  display: grid;
  place-items: center;
  min-height: 168px;
  padding: 16px;
  border: 1px dashed var(--line-2);
  border-radius: var(--r-sm);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.dropzone:hover {
  border-color: var(--sprout);
}

.dropzone__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.dropzone__cta {
  display: grid;
  justify-items: center;
  gap: 8px;
  color: var(--sprout);
}

.dropzone__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--white);
}

.dropzone__preview {
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  border-radius: var(--r-xs);
}

.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.choice {
  min-height: 44px;
  padding: 0 15px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--fern);
  font-size: 13.5px;
  font-weight: 600;
  transition:
    background var(--dur-1) var(--ease-out),
    color var(--dur-1) var(--ease-out),
    border-color var(--dur-1) var(--ease-out);
}

.choice:hover {
  color: var(--white);
  border-color: var(--line-2);
}

.choice.is-on {
  background: var(--sprout);
  border-color: var(--sprout);
  color: var(--onyx);
}

.coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field {
  display: grid;
  gap: 5px;
}

.field__label {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--lichen);
}

.field__control {
  width: 100%;
  min-height: 46px;
  padding: 11px 13px;
  border-radius: var(--r-sm);
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--white);
  font: inherit;
  font-size: 15px;
  resize: vertical;
}

.field__control::placeholder {
  color: var(--lichen);
}

.field__control:hover {
  border-color: var(--line-2);
}

.alert {
  margin: 0;
  padding: 11px 13px;
  border-radius: var(--r-xs);
  font-size: 13px;
  line-height: 1.5;
  background: rgba(255, 255, 255, 0.05);
  color: var(--fern);
  border: 1px solid var(--line);
}

.alert--ok {
  background: rgba(104, 239, 63, 0.12);
  color: var(--sprout);
  border-color: rgba(104, 239, 63, 0.3);
}

.alert--warn {
  background: rgba(242, 193, 78, 0.12);
  color: var(--amber);
  border-color: rgba(242, 193, 78, 0.3);
}

.alert--err {
  background: rgba(255, 116, 82, 0.12);
  color: var(--danger);
  border-color: rgba(255, 116, 82, 0.3);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>