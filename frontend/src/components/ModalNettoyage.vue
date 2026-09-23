<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="fermer">
    <div class="modal-card">
      <header class="modal-header">
        <h3>✨ Apporter une preuve de nettoyage</h3>
        <button class="btn-close" @click="fermer">✕</button>
      </header>

      <!-- Étape 1 : Avertissement de sécurité OBLIGATOIRE -->
      <section class="security-warning">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <strong>Règle de sécurité essentielle :</strong>
          <p>
            Ne manipulez <strong>jamais</strong> d'objets dangereux (déchets hospitaliers, seringues, verre brisé coupant, solvants ou produits chimiques).
            Dans ces situations critiques, faites seulement un signalement et n'intervenez pas vous-même.
          </p>
        </div>
      </section>

      <!-- Étape 2 : Formulaire photo & vérification GPS -->
      <div class="cleanup-form">
        <label class="form-label">Photo après nettoyage :</label>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          @change="gererSelectionPhoto"
          class="file-input"
        />

        <div v-if="photoPreview" class="preview-box">
          <img :src="photoPreview" alt="Aperçu photo après" class="preview-img" />
        </div>

        <!-- Alerte anti-fraude GPS -->
        <div v-if="erreurDistance" class="alert-error">
          📍 <strong>Position trop éloignée ({{ distanceCalculee }} m) :</strong>
          Vous devez vous trouver à moins de 50 mètres de la zone signalée pour prouver le nettoyage.
        </div>

        <div v-else-if="distanceCalculee !== null" class="alert-success">
          ✅ <strong>Localisation validée :</strong> Vous êtes à {{ distanceCalculee }} m du lieu initial.
        </div>
      </div>

      <footer class="modal-footer">
        <button class="btn-secondary" @click="fermer">Annuler</button>
        <button 
          class="btn-primary" 
          :disabled="!peutValider"
          @click="soumettrePreuve"
        >
          Valider et gagner les points bonus
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  signalementLatitude: {
    type: Number,
    required: true
  },
  signalementLongitude: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const photoFichier = ref(null)
const photoPreview = ref(null)
const distanceCalculee = ref(null)
const erreurDistance = ref(false)

// Calcul de la distance géographique (Formule de Haversine en mètres)
function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Rayon de la Terre en mètres
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function gererSelectionPhoto(event) {
  const file = event.target.files[0]
  if (!file) return

  photoFichier.value = file
  photoPreview.value = URL.createObjectURL(file)

  // Vérification de la géolocalisation de l'appareil
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = calculerDistance(
          props.signalementLatitude,
          props.signalementLongitude,
          pos.coords.latitude,
          pos.coords.longitude
        )
        distanceCalculee.value = dist
        erreurDistance.value = dist > 50 // Anti-fraude : rayon max 50m
      },
      (err) => {
        console.warn('Erreur GPS lors du nettoyage:', err)
        // En cas d'impossibilité de fixer le GPS, laisser une information claire
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
}

const peutValider = computed(() => {
  return photoFichier.value && !erreurDistance.value
})

function fermer() {
  emit('close')
}

function soumettrePreuve() {
  if (!peutValider.value) return
  emit('submit', {
    photo: photoFichier.value,
    distance: distanceCalculee.value
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  max-width: 520px;
  width: 100%;
  padding: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  font-size: 1.2rem;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
}

.security-warning {
  display: flex;
  gap: 0.75rem;
  background-color: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: 8px;
  padding: 0.85rem;
  margin-bottom: 1.25rem;
}

.warning-icon {
  font-size: 1.5rem;
}

.warning-text strong {
  color: #991B1B;
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.warning-text p {
  color: #7F1D1D;
  font-size: 0.85rem;
  line-height: 1.35;
}

.cleanup-form {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #334155;
}

.file-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
}

.preview-box {
  margin-top: 0.75rem;
  text-align: center;
}

.preview-img {
  max-height: 180px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.alert-error {
  margin-top: 0.75rem;
  padding: 0.65rem;
  border-radius: 6px;
  background-color: #FEF2F2;
  color: #991B1B;
  font-size: 0.85rem;
  border: 1px solid #F87171;
}

.alert-success {
  margin-top: 0.75rem;
  padding: 0.65rem;
  border-radius: 6px;
  background-color: #F0FDF4;
  color: #166534;
  font-size: 0.85rem;
  border: 1px solid #86EFAC;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #E8A33D;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
