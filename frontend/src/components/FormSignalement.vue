<template>
  <div class="form-signalement-root">
    
    <!-- Toast / Notification de succès -->
    <transition name="fade">
      <div v-if="succesAffiche" class="succes-banner" role="alert">
        <div class="succes-icon">🎉</div>
        <div class="succes-content">
          <h3 class="succes-title">Signalement envoyé avec succès !</h3>
          <p class="succes-desc">
            Vous avez remporté 
            <span class="badge-points-succes">+{{ dernierScoreGagne }} pts</span> !
            Redirection vers l'accueil...
          </p>
        </div>
      </div>
    </transition>

    <!-- Bannière d'erreur réseau / soumission -->
    <transition name="fade">
      <div v-if="store.messageErreurEnvoi" class="erreur-banner" role="alert">
        <div class="erreur-icon">{{ store.estErreurReseau ? '📡' : '⚠️' }}</div>
        <div class="erreur-content">
          <h4 class="erreur-title">
            {{ store.estErreurReseau ? 'Connexion réseau instable' : 'Erreur lors de l\'envoi' }}
          </h4>
          <p class="erreur-desc">{{ store.messageErreurEnvoi }}</p>
          <button 
            type="button" 
            class="btn-reessayer" 
            @click="declencherEnvoi"
            :disabled="store.envoiEnCours"
          >
            🔄 Réessayer l'envoi
          </button>
        </div>
      </div>
    </transition>

    <form @submit.prevent="declencherEnvoi" class="signalement-form" novalidate>
      
      <!-- ÉTAPE 1 : Upload Photo -->
      <section class="section-card">
        <div class="section-header">
          <span class="step-badge">1</span>
          <label class="section-title">Photo du problème environnemental <span class="required">*</span></label>
        </div>

        <input 
          ref="inputFichier"
          type="file" 
          accept="image/*" 
          capture="environment" 
          class="file-input-hidden"
          @change="gererChangementPhoto"
          id="photo-input"
        />

        <!-- Zone d'aperçu de photo si présente -->
        <div v-if="store.photoPreview" class="photo-preview-box">
          <img :src="store.photoPreview" alt="Aperçu du signalement" class="preview-img" />
          
          <div class="photo-overlay">
            <span class="photo-info-badge">
              ✓ Photo prête <span v-if="store.photoTailleOriginale">({{ store.photoTailleOriginale }} Ko)</span>
            </span>
            <div class="photo-actions">
              <button type="button" class="btn-photo-action" @click="ouvrirSelecteurFichier">
                📸 Changer
              </button>
              <button type="button" class="btn-photo-action btn-danger" @click="store.supprimerPhoto">
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- Zone d'upload vide si pas de photo -->
        <div 
          v-else 
          class="upload-dropzone" 
          @click="ouvrirSelecteurFichier"
          tabindex="0"
          role="button"
          aria-label="Prendre ou sélectionner une photo"
          @keydown.enter="ouvrirSelecteurFichier"
          @keydown.space.prevent="ouvrirSelecteurFichier"
        >
          <div class="dropzone-icon-circle">
            <svg class="camera-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <p class="dropzone-label">Prendre une photo ou importer</p>
          <span class="dropzone-hint">
            Appareil photo sur mobile · Compression auto &lt; 1 Mo (éco data)
          </span>
        </div>
      </section>

      <!-- ÉTAPE 2 : Géolocalisation -->
      <section class="section-card">
        <div class="section-header">
          <span class="step-badge">2</span>
          <label class="section-title">Localisation GPS <span class="required">*</span></label>
        </div>

        <!-- État : Recherche GPS en cours -->
        <div v-if="store.statutGps === 'en_cours'" class="gps-card gps-loading">
          <div class="spinner-pulse"></div>
          <div class="gps-text">
            <strong>Recherche du signal satellite GPS...</strong>
            <small>Veuillez autoriser l'accès si votre navigateur le demande</small>
          </div>
        </div>

        <!-- État : GPS capturé avec succès -->
        <div v-else-if="store.statutGps === 'succes'" class="gps-card gps-success">
          <div class="gps-icon-circle">📍</div>
          <div class="gps-text">
            <div class="gps-headline">
              <strong>{{ store.zoneDetectee }}</strong>
              <span class="badge-gps-valid">Position validée</span>
            </div>
            <div class="gps-coords">
              <span>Lat: {{ store.latitude?.toFixed(5) }}</span>
              <span>Long: {{ store.longitude?.toFixed(5) }}</span>
              <span v-if="store.precisionGps" class="gps-precision">±{{ store.precisionGps }}m</span>
            </div>
          </div>
          <button 
            type="button" 
            class="btn-gps-refresh" 
            @click="store.capturerGeolocalisation" 
            title="Rafraîchir les coordonnées"
          >
            🔄
          </button>
        </div>

        <!-- État : GPS refusé ou erreur -->
        <div v-else class="gps-card gps-warning">
          <div class="gps-icon-circle-warning">⚠️</div>
          <div class="gps-text">
            <strong>Position GPS requise</strong>
            <p class="gps-warning-desc">
              {{ store.messageErreurGps || "La localisation est obligatoire pour situer le déchet sur la carte du Burundi." }}
            </p>
            <button 
              type="button" 
              class="btn-activer-gps" 
              @click="store.capturerGeolocalisation"
            >
              🛰️ Activer ma position GPS
            </button>
          </div>
        </div>

        <!-- Saisie / correction manuelle GPS si nécessaire -->
        <div v-if="store.latitude !== null && store.longitude !== null" class="gps-edit-box">
          <button 
            type="button" 
            class="btn-toggle-gps-edit"
            @click="editionGpsManuelle = !editionGpsManuelle"
          >
            {{ editionGpsManuelle ? '▲ Masquer l\'ajustement manuel' : '✏️ Ajuster manuellement les coordonnées' }}
          </button>
          
          <div v-if="editionGpsManuelle" class="gps-inputs-row">
            <label class="gps-field">
              Latitude
              <input v-model.number="store.latitude" type="number" step="0.000001" min="-5" max="-2" class="gps-num-input" />
            </label>
            <label class="gps-field">
              Longitude
              <input v-model.number="store.longitude" type="number" step="0.000001" min="28" max="32" class="gps-num-input" />
            </label>
          </div>
          <small v-if="erreurGpsBurundi" class="gps-burundi-warning">
            ⚠️ {{ erreurGpsBurundi }}
          </small>
        </div>
      </section>

      <!-- ÉTAPE 3 : Choix de la Catégorie en Chips -->
      <section class="section-card">
        <div class="section-header">
          <span class="step-badge">3</span>
          <label class="section-title">Catégorie du problème <span class="required">*</span></label>
        </div>
        <p class="section-subtitle">Sélectionnez le type d'impact environnemental constaté :</p>

        <div class="chips-container" role="radiogroup" aria-label="Catégories environnementales">
          <button
            v-for="cat in store.categories"
            :key="cat.id"
            type="button"
            role="radio"
            :aria-checked="store.categorieId === cat.id"
            class="chip-item"
            :class="{ 'chip-selected': store.categorieId === cat.id }"
            @click="store.selectionnerCategorie(cat.id)"
          >
            <span class="chip-icone">{{ cat.icone }}</span>
            <span class="chip-nom">{{ cat.nom }}</span>
            <span class="chip-points">+{{ cat.points_signalement || 10 }} pts</span>
          </button>
        </div>
      </section>

      <!-- ÉTAPE 4 : Description optionnelle -->
      <section class="section-card">
        <div class="section-header">
          <span class="step-badge optional">4</span>
          <label class="section-title">Description & repères <span class="badge-optionnel">Optionnel</span></label>
        </div>

        <textarea 
          v-model="store.description"
          rows="3" 
          placeholder="Ex: Tas de bouteilles plastiques près du canal de Nyabagere, proche du pont..."
          class="description-textarea"
          maxlength="500"
        ></textarea>
        <div class="textarea-footer">
          <small class="help-text">Ne bloque jamais l'envoi</small>
          <small class="char-count">{{ store.description.length }}/500</small>
        </div>
      </section>

      <!-- Message bloquant si non authentifié ou email non vérifié -->
      <div v-if="raisonBloquant" class="bloquant-banner" role="alert">
        <span class="bloquant-icon">⚠️</span>
        <div class="bloquant-content">
          <span>{{ raisonBloquant }}</span>
          <router-link v-if="!userStore.isAuthenticated" to="/connexion" class="bloquant-link">
            Se connecter
          </router-link>
        </div>
      </div>

      <!-- ÉTAPE 5 : Bouton d'envoi ergonomique mobile -->
      <div class="actions-container">
        
        <!-- Indicateur de progression lors de l'envoi -->
        <div v-if="store.envoiEnCours" class="progression-box">
          <div class="loading-spinner"></div>
          <span class="progression-text">{{ libelleProgression }}</span>
        </div>

        <!-- Bouton d'action principal Greenshot -->
        <button 
          type="submit" 
          class="btn-submit-signalement" 
          :disabled="!store.formulaireValide || store.envoiEnCours || !!raisonBloquant || !!erreurGpsBurundi"
        >
          <template v-if="store.envoiEnCours">
            <span class="spinner-inline"></span>
            Envoi en cours...
          </template>
          <template v-else-if="!userStore.isAuthenticated">
            Connectez-vous pour signaler
          </template>
          <template v-else-if="!userStore.peutSignaler()">
            Vérifiez votre email pour signaler
          </template>
          <template v-else-if="!store.photoFichier">
            Prenez une photo pour continuer
          </template>
          <template v-else-if="store.latitude === null">
            Activez la position GPS
          </template>
          <template v-else-if="!store.categorieId">
            Choisissez une catégorie
          </template>
          <template v-else>
            <span class="btn-text-content">
              Envoyer le signalement
              <span class="btn-points-tag">+{{ store.pointsSignalement }} pts</span>
            </span>
          </template>
        </button>

        <p v-if="!store.formulaireValide && !store.envoiEnCours && !raisonBloquant" class="validation-hint">
          Complétez les 3 premières étapes pour valider votre signalement.
        </p>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSignalementStore } from '../stores/signalementStore'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const store = useSignalementStore()
const userStore = useUserStore()

const inputFichier = ref(null)
const succesAffiche = ref(false)
const dernierScoreGagne = ref(10)
const editionGpsManuelle = ref(false)

const raisonBloquant = computed(() => {
  if (!userStore.isAuthenticated) {
    return "Connectez-vous pour déposer un signalement citoyen."
  }
  if (!userStore.peutSignaler()) {
    return "Vérifiez votre adresse email avant de signaler un problème."
  }
  return ''
})

const erreurGpsBurundi = computed(() => {
  if (store.latitude === null || store.longitude === null) return ''
  const lat = Number(store.latitude)
  const lng = Number(store.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Coordonnées GPS invalides.'
  if (lat < -5 || lat > -2 || lng < 28 || lng > 32) {
    return "Ces coordonnées sont en dehors du Burundi (lat: -5..-2, lng: 28..32)."
  }
  return ''
})

onMounted(async () => {
  // 1. Initialiser le store et les catégories Supabase
  await store.chargerCategories()
  
  // 2. Déclencher automatiquement la demande de position GPS au chargement
  store.capturerGeolocalisation()
})

const libelleProgression = computed(() => {
  switch (store.etapeEnvoi) {
    case 'compression':
      return 'Compression optimisée de la photo (< 1 Mo)...'
    case 'upload_photo':
      return 'Téléversement sécurisé de la photo...'
    case 'enregistrement':
      return 'Enregistrement du signalement sur Supabase...'
    case 'termine':
      return 'Terminé !'
    default:
      return 'Préparation de l\'envoi...'
  }
})

function ouvrirSelecteurFichier() {
  if (inputFichier.value) {
    inputFichier.value.click()
  }
}

function gererChangementPhoto(e) {
  const file = e.target.files?.[0]
  if (file) {
    store.definirPhoto(file)
  }
}

async function declencherEnvoi() {
  if (raisonBloquant.value) {
    store.messageErreurEnvoi = raisonBloquant.value
    return
  }
  if (erreurGpsBurundi.value) {
    store.messageErreurEnvoi = erreurGpsBurundi.value
    return
  }
  if (!store.formulaireValide || store.envoiEnCours) return

  const resultat = await store.envoyerSignalement(userStore)

  if (resultat?.success) {
    dernierScoreGagne.value = resultat.points || 10
    succesAffiche.value = true

    // Réinitialiser les champs tout en conservant le feedback
    store.reinitialiserFormulaire()

    // Redirection fluide vers l'écran Accueil après 1.8 seconde
    setTimeout(() => {
      succesAffiche.value = false
      router.push('/')
    }, 1800)
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

/* Cartes de sections */
.section-card {
  background: var(--color-card, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 16px);
  padding: 1.15rem;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  transition: border-color 0.2s ease;
}

.section-card:focus-within {
  border-color: #A7F3D0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: var(--color-primary, #1F4D3A);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: var(--font-title);
  flex-shrink: 0;
}

.step-badge.optional {
  background-color: var(--color-text-muted, #64748B);
}

.section-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
}

.required {
  color: #DC2626;
  font-weight: bold;
}

.badge-optionnel {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted, #64748b);
  background-color: #f1f5f9;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  margin-left: 0.4rem;
}

.section-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 0.85rem;
}

/* Zone d'Upload Photo */
.file-input-hidden {
  display: none;
}

.upload-dropzone {
  border: 2px dashed #CBD5E1;
  border-radius: var(--radius-md, 12px);
  background-color: #F8FAF9;
  padding: 1.75rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 160px;
}

.upload-dropzone:hover,
.upload-dropzone:focus-visible {
  border-color: var(--color-primary, #1F4D3A);
  background-color: #EBF3EF;
  outline: none;
}

.dropzone-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: #EBF3EF;
  color: var(--color-primary, #1F4D3A);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.65rem;
  transition: transform 0.2s ease;
}

.upload-dropzone:hover .dropzone-icon-circle {
  transform: scale(1.08);
}

.camera-svg {
  width: 26px;
  height: 26px;
}

.dropzone-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text, #0f172a);
  margin-bottom: 0.25rem;
}

.dropzone-hint {
  font-size: 0.78rem;
  color: var(--color-text-muted, #64748b);
  max-width: 320px;
}

/* Photo Preview */
.photo-preview-box {
  position: relative;
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
  max-height: 280px;
  background-color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  display: block;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
  padding: 1.25rem 0.85rem 0.65rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.photo-info-badge {
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(31, 77, 58, 0.85);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full, 9999px);
  backdrop-filter: blur(4px);
}

.photo-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-photo-action {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: var(--radius-sm, 8px);
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-photo-action:hover {
  background: #ffffff;
}

.btn-photo-action.btn-danger {
  color: #DC2626;
}

/* Indicateur GPS */
.gps-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md, 12px);
  font-size: 0.88rem;
}

.gps-loading {
  background-color: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: var(--color-text-muted, #64748B);
}

.spinner-pulse {
  width: 24px;
  height: 24px;
  border: 3px solid #CBD5E1;
  border-top-color: var(--color-primary, #1F4D3A);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.gps-success {
  background-color: #EBF3EF;
  border: 1px solid #A7F3D0;
  color: #14532D;
}

.gps-icon-circle {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.gps-headline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge-gps-valid {
  font-size: 0.72rem;
  font-weight: 700;
  background-color: #1F4D3A;
  color: #ffffff;
  padding: 0.12rem 0.45rem;
  border-radius: var(--radius-full, 9999px);
}

.gps-coords {
  display: flex;
  gap: 0.65rem;
  font-size: 0.78rem;
  color: #1F4D3A;
  margin-top: 0.15rem;
  font-family: monospace;
}

.gps-precision {
  background: rgba(31, 77, 58, 0.1);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
}

.btn-gps-refresh {
  margin-left: auto;
  background: transparent;
  border: 1px solid rgba(31, 77, 58, 0.25);
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #1F4D3A;
  transition: background 0.15s ease;
}

.btn-gps-refresh:hover {
  background: rgba(31, 77, 58, 0.1);
}

.gps-warning {
  background-color: var(--color-terracotta-light, #FDF0EC);
  border: 1px solid #F5C6BA;
  color: var(--color-terracotta, #B5502F);
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.gps-icon-circle-warning {
  font-size: 1.25rem;
}

.gps-warning-desc {
  font-size: 0.82rem;
  margin-top: 0.2rem;
  color: #8C3B1E;
}

.btn-activer-gps {
  margin-top: 0.4rem;
  background: var(--color-terracotta, #B5502F);
  color: #ffffff;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-sm, 8px);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-activer-gps:hover {
  background: #9A4124;
}

/* Ajustement manuel GPS */
.gps-edit-box {
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px dashed var(--color-border, #E2E8F0);
}

.btn-toggle-gps-edit {
  background: none;
  border: none;
  color: var(--color-text-muted, #64748B);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}

.btn-toggle-gps-edit:hover {
  color: var(--color-primary, #1F4D3A);
}

.gps-inputs-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.gps-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748B);
  font-weight: 600;
}

.gps-num-input {
  border: 1px solid var(--color-border, #CBD5E1);
  border-radius: var(--radius-sm, 8px);
  padding: 0.35rem 0.55rem;
  font-size: 0.82rem;
  font-family: monospace;
}

.gps-burundi-warning {
  display: block;
  margin-top: 0.35rem;
  color: #B91C1C;
  font-size: 0.75rem;
}

/* Catégories en Chips */
.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.chip-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #ffffff;
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-full, 9999px);
  padding: 0.45rem 0.85rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  cursor: pointer;
  min-height: 42px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
}

.chip-item:hover {
  border-color: #CBD5E1;
  background: #F8FAF9;
}

.chip-item.chip-selected {
  background-color: var(--color-primary, #1F4D3A);
  border-color: var(--color-primary, #1F4D3A);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(31, 77, 58, 0.25);
  transform: translateY(-1px);
}

.chip-icone {
  font-size: 1.05rem;
}

.chip-nom {
  font-size: 0.88rem;
}

.chip-points {
  font-size: 0.75rem;
  font-weight: 700;
  background-color: var(--color-amber-light, #FDF6EB);
  color: #B47318;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  transition: all 0.15s ease;
}

.chip-item.chip-selected .chip-points {
  background-color: var(--color-amber, #E8A33D);
  color: #0f172a;
}

/* Description Textarea */
.description-textarea {
  width: 100%;
  border: 1.5px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 12px);
  padding: 0.75rem;
  font-family: var(--font-body, inherit);
  font-size: 0.9rem;
  color: var(--color-text, #0f172a);
  resize: vertical;
  min-height: 75px;
  transition: border-color 0.2s ease;
}

.description-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #1F4D3A);
  box-shadow: 0 0 0 3px rgba(31, 77, 58, 0.1);
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}

/* Bannière bloquante */
.bloquant-banner {
  background: #FFFBEB;
  border: 1px solid #FCD34D;
  border-radius: var(--radius-md, 12px);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.85rem;
  color: #92400E;
}

.bloquant-link {
  color: #1E40AF;
  font-weight: 700;
  text-decoration: underline;
  margin-left: 0.4rem;
}

/* Actions & Bouton d'envoi */
.actions-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  position: sticky;
  bottom: 0.75rem;
  z-index: 100;
}

.progression-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-md, 12px);
  padding: 0.5rem 0.85rem;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(6px);
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #E2E8F0;
  border-top-color: var(--color-primary, #1F4D3A);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.progression-text {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-primary, #1F4D3A);
}

.btn-submit-signalement {
  width: 100%;
  min-height: 52px;
  background-color: var(--color-primary, #1F4D3A);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md, 12px);
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(31, 77, 58, 0.3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
  padding: 0.75rem 1.25rem;
}

.btn-submit-signalement:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #173c2d);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(31, 77, 58, 0.35);
}

.btn-submit-signalement:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit-signalement:disabled {
  background-color: #94A3B8;
  color: #F1F5F9;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.85;
}

.btn-text-content {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-points-tag {
  background-color: var(--color-amber, #E8A33D);
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.validation-hint {
  text-align: center;
  font-size: 0.78rem;
  color: var(--color-text-muted, #64748b);
  margin-top: 0.25rem;
}

.spinner-inline {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

/* Toast & Bannières */
.succes-banner {
  background: #EBF3EF;
  border: 1.5px solid #10B981;
  border-radius: var(--radius-md, 12px);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.succes-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.succes-title {
  font-size: 1rem;
  font-weight: 800;
  color: #065F46;
  margin-bottom: 0.2rem;
}

.succes-desc {
  font-size: 0.85rem;
  color: #047857;
}

.badge-points-succes {
  background: var(--color-amber, #E8A33D);
  color: #0f172a;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
}

.erreur-banner {
  background: #FEF2F2;
  border: 1.5px solid #F87171;
  border-radius: var(--radius-md, 12px);
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.erreur-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.erreur-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #991B1B;
  margin-bottom: 0.2rem;
}

.erreur-desc {
  font-size: 0.82rem;
  color: #B91C1C;
  line-height: 1.35;
  margin-bottom: 0.6rem;
}

.btn-reessayer {
  background: #DC2626;
  color: #ffffff;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-sm, 8px);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-reessayer:hover {
  background: #B91C1C;
}

/* Animations */
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
  transform: translateY(-8px);
}

/* Mobile specific styling */
@media (max-width: 480px) {
  .section-card {
    padding: 1rem;
    border-radius: 14px;
  }

  .chips-container {
    gap: 0.45rem;
  }

  .chip-item {
    padding: 0.4rem 0.75rem;
    font-size: 0.82rem;
  }

  .btn-submit-signalement {
    font-size: 0.95rem;
    min-height: 50px;
  }
}
</style>
