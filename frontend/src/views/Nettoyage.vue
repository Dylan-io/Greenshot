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
        <div class="success-icon"><Icone nom="celebration" /></div>
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
        <div class="error-icon"><Icone nom="navigation" /></div>
        <div class="error-content">
          <h4 class="error-title">Échec de transmission</h4>
          <p class="error-desc">{{ messageErreurSoumission }}</p>
          <button type="button" class="btn-reessayer" @click="confirmerNettoyage">
            <Icone nom="rafraichir" /> Réessayer l'envoi
          </button>
        </div>
      </div>
    </transition>

    <!-- 1. AVERTISSEMENT DE SÉCURITÉ PERMANENT EN HAUT -->
    <section class="security-alert-box" aria-label="Avertissement de sécurité essentiel">
      <div class="security-icon-circle"><Icone nom="alerte" /></div>
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
      
      <!-- 0. PHOTO ORIGINALE DU SIGNALEMENT (référence IA) -->
      <section class="original-ref-section">
        <div class="original-ref-header">
          <h2 class="section-title"> Référence — Signalement original</h2>
          
        </div>
        <div class="original-ref-box">
          <img
            v-if="photoOriginalDisponible"
            :src="signalement.photo_avant_url"
            alt="Photo originale du signalement"
            class="original-ref-img"
            @error="photoOriginalIndisponible = true"
          />
          <div v-else class="original-ref-missing">
            <span class="missing-icon"><Icone nom="appareil_photo" /></span>
            <span>Photo originale indisponible : la comparaison IA sera désactivée.</span>
          </div>
          <div class="original-ref-meta">
            <span class="original-cat-pill">{{ signalement?.categories?.nom || 'Déchet' }}</span>
            <span class="original-pts-pill">+{{ pointsAGagner }} pts à gagner</span>
          </div>
        </div>
      </section>

      <!-- 2. COMPARAISON AVANT / APRÈS -->
      <section class="comparison-section">
        <h2 class="section-title">Validation visuelle Avant / Après</h2>

        <div class="comparison-grid">
          
          <!-- Capture AVANT le nettoyage -->
          <div class="photo-column before-col">
            <div class="column-header">
              <span class="step-tag before-tag"> Avant nettoyage *</span>
              <span class="cat-badge">{{ signalement?.categories?.nom || 'Déchet' }}</span>
            </div>

            <div v-if="gpsDemandeEnCours === 'avant'" class="gps-search-pill">
              <span class="spinner-gps"></span>
              <span>Localisation en cours…</span>
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
                <span class="ready-badge"><Icone nom="coherent" /> Avant prête</span>
                <button type="button" class="btn-change-photo" @click="ouvrirCamera('avant')">Reprendre</button>
              </div>
            </div>

            <button v-else type="button" class="upload-dropzone-after" @click="ouvrirCamera('avant')" :disabled="captureBloquee">
              <div class="camera-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="camera-svg">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span class="upload-label">Prendre la photo Avant</span>
              <small class="upload-hint">Position GPS vérifiée puis caméra</small>
            </button>

            <small v-if="photoAvantGps" class="photo-caption">
              <Icone nom="localisation" /> GPS avant : {{ formaterCoordonnees(photoAvantGps) }} · précision {{ photoAvantGps.precision }} m · {{ formaterDateHeure(photoAvantGps.capturedAt) }}
            </small>

            <!-- Badge analyse IA avant -->
            <div v-if="analyseIAAvantEnCours" class="ia-analyzing-badge">
              <span class="spinner-ia"></span>
              <span>Analyse IA en cours (Gemini Vision)…</span>
            </div>
            <div
              v-else-if="analyseIAAvant"
              class="ia-result-badge"
              :class="analyseIAAvant.avertissement ? 'ia-warn' : analyseIAAvant.valide ? 'ia-ok' : 'ia-fraude'"
            >
              <div class="ia-result-top">
                <span class="ia-emoji">
                  <Icone nom="robot" />
                  <Icone v-if="analyseIAAvant.avertissement" nom="alerte" />
                  <Icone v-else-if="analyseIAAvant.valide" nom="succes" />
                  <Icone v-else nom="erreur" />
                </span>
                <span class="ia-message">{{ analyseIAAvant.message }}</span>
                <span v-if="analyseIAAvant.score > 0" class="ia-score-pill">{{ analyseIAAvant.score }}%</span>
              </div>
              <ul v-if="analyseIAAvant.fraude" class="ia-issues-list">
                <li v-if="analyseIAAvant.memeLieu === false"><Icone nom="localisation" /> Lieu différent du signalement</li>
                <li v-if="analyseIAAvant.dechetsVisibles === false"><Icone nom="dechet" /> Aucun déchet visible (zone déjà propre ?)</li>
                <li v-if="analyseIAAvant.categorieOk === false"><Icone nom="question" /> Type de déchets ≠ catégorie signalée</li>
              </ul>
              <div v-else-if="!analyseIAAvant.avertissement" class="ia-success-checks">
                <span><Icone nom="coherent" /> Lieu conforme</span> · <span><Icone nom="coherent" /> Déchets identifiés</span>
              </div>
            </div>
          </div>

          <!-- Colonne APRÈS (Zone d'upload / prise de photo citoyenne) -->
          <div class="photo-column after-col">
            <div class="column-header">
              <span class="step-tag after-tag"> Après nettoyage *</span>
              <span class="pts-target-badge">+{{ pointsAGagner }} pts</span>
            </div>

            <div v-if="gpsDemandeEnCours === 'apres'" class="gps-search-pill">
              <span class="spinner-gps"></span>
              <span>Localisation en cours…</span>
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
                <span class="ready-badge"><Icone nom="coherent" /> Prête ({{ photoApresTaille }} Ko)</span>
                <button type="button" class="btn-change-photo" @click="ouvrirCamera('apres')">
                  Reprendre
                </button>
              </div>
            </div>

            <button v-else type="button" class="upload-dropzone-after" @click="ouvrirCamera('apres')" :disabled="!photoAvantFichier || captureBloquee">
              <div class="camera-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="camera-svg">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <span class="upload-label">Prendre la photo Après</span>
              <small class="upload-hint">Position GPS vérifiée puis caméra</small>
            </button>
            <small v-if="photoApresGps" class="photo-caption">
              <Icone nom="localisation" /> GPS après : {{ formaterCoordonnees(photoApresGps) }} · précision {{ photoApresGps.precision }} m · {{ formaterDateHeure(photoApresGps.capturedAt) }}
            </small>

            <!-- Badge analyse IA après -->
            <div v-if="analyseIAApresEnCours" class="ia-analyzing-badge">
              <span class="spinner-ia"></span>
              <span>Analyse IA en cours (Gemini Vision)…</span>
            </div>
            <div
              v-else-if="analyseIAApres"
              class="ia-result-badge"
              :class="analyseIAApres.avertissement ? 'ia-warn' : analyseIAApres.valide ? 'ia-ok' : 'ia-fraude'"
            >
              <div class="ia-result-top">
                <span class="ia-emoji">
                  <Icone nom="robot" />
                  <Icone v-if="analyseIAApres.avertissement" nom="alerte" />
                  <Icone v-else-if="analyseIAApres.valide" nom="succes" />
                  <Icone v-else nom="erreur" />
                </span>
                <span class="ia-message">{{ analyseIAApres.message }}</span>
                <span v-if="analyseIAApres.score > 0" class="ia-score-pill">{{ analyseIAApres.score }}%</span>
              </div>
              <ul v-if="analyseIAApres.fraude" class="ia-issues-list">
                <li v-if="analyseIAApres.memeLieu === false"><Icone nom="localisation" /> Lieu différent de la photo avant</li>
                <li v-if="analyseIAApres.zoneNettoyee === false"><Icone nom="recyclage" /> Zone pas encore nettoyée (déchets visibles)</li>
              </ul>
              <div v-else-if="!analyseIAApres.avertissement" class="ia-success-checks">
                <span><Icone nom="coherent" /> Même lieu vérifié</span> · <span><Icone nom="coherent" /> Nettoyage confirmé</span>
              </div>
            </div>
          </div>

        </div>
      </section>


      <!-- 3. VÉRIFICATION GÉOGRAPHIQUE ANTI-FRAUDE -->
      <section class="geoloc-verification-section">
        <div class="geoloc-header">
          <h2 class="section-title">Contrôle géographique de présence</h2>
          <span class="gps-radius-label">Rayon requis : {{ RAYON_ANTI_FRAUDE_M }} m</span>
        </div>

        <!-- État : Analyse GPS en cours -->
        <div v-if="gpsEnCours" class="geoloc-banner checking">
          <div class="spinner-gps"></div>
          <div class="geoloc-text">
            <strong>Vérification satellite en cours...</strong>
            <p>Votre position est relevée avant d’ouvrir la caméra : restez sur place.</p>
          </div>
        </div>

        <!-- État 1 : Positions validées (< 20 mètres) -->
        <div v-else-if="photosGpsValides" class="geoloc-banner success">
          <div class="geoloc-icon"><Icone nom="succes" /></div>
          <div class="geoloc-text">
            <strong class="success-headline">Positions des deux photos vérifiées</strong>
            <p>Avant : {{ formaterDistance(distanceAvantMetres) }} · Après : {{ formaterDistance(distanceApresMetres) }} du signalement.</p>
          </div>
        </div>

        <!-- État 2 : Une ou plusieurs positions sont hors du rayon autorisé -->
        <div v-else-if="photosHorsRayon.length" class="geoloc-banner warning">
          <div class="geoloc-icon"><Icone nom="erreur" /></div>
          <div class="geoloc-text">
            <strong class="warning-headline">
              Une position GPS est hors du rayon autorisé
            </strong>
            <p>
              Reprends la photo {{ photosHorsRayon.join(' et ') }} sur place : chaque position
              doit être à moins de {{ RAYON_ANTI_FRAUDE_M }} m du signalement.
            </p>
            <ul class="geoloc-details-list">
              <li v-if="photoAvantFichier"><Icone nom="appareil_photo" /> Avant : {{ formaterDistance(distanceAvantMetres) }} du signalement</li>
              <li v-if="photoApresFichier"><Icone nom="appareil_photo" /> Après : {{ formaterDistance(distanceApresMetres) }} du signalement</li>
            </ul>
          </div>
        </div>

        <!-- État 3 : Trop loin du signalement (la caméra n'a pas pu s'ouvrir) -->
        <div v-else-if="motifGpsCourant === 'trop_loin'" class="geoloc-banner warning">
          <div class="geoloc-icon"><Icone nom="localisation" /></div>
          <div class="geoloc-text">
            <strong class="warning-headline">Vous êtes loin du signalement</strong>
            <p>{{ gpsErreurCourante }}</p>
            <small>
              La caméra reste fermée tant que vous n’êtes pas sur place : approchez-vous du
              lieu du signalement et relancez la photo.
            </small>
          </div>
        </div>

        <!-- État 4 : Autre refus de GPS (permission, position périmée, capture invalide) -->
        <div v-else-if="gpsErreurCourante" class="geoloc-banner error">
          <div class="geoloc-icon"><Icone nom="alerte" /></div>
          <div class="geoloc-text">
            <strong>Position GPS refusée</strong>
            <p>{{ gpsErreurCourante }}</p>
            <small>
              Relancez la photo : un nouveau relevé GPS sera effectué avant l’ouverture de la caméra.
            </small>
          </div>
        </div>

        <!-- État 5 : En attente des captures -->
        <div v-else-if="!photoAvantFichier || !photoApresFichier" class="geoloc-banner info">
          <div class="geoloc-icon"><Icone nom="localisation" /></div>
          <div class="geoloc-text">
            <strong>Contrôle de présence à venir</strong>
            <p>
              Chaque photo est prise avec une vérification GPS à moins de
              {{ RAYON_ANTI_FRAUDE_M }} m du signalement. Restez sur place entre les deux captures.
            </p>
            <small v-if="!photoAvantFichier">Commencez par la photo « Avant nettoyage ».</small>
            <small v-else>Prenez maintenant la photo « Après nettoyage ».</small>
          </div>
        </div>

        <!-- État 6 : Position non encore relevée -->
        <div v-else class="geoloc-banner error">
          <div class="geoloc-icon"><Icone nom="localisation" /></div>
          <div class="geoloc-text">
            <strong>Position GPS requise</strong>
            <p>Activez le GPS de votre appareil pour valider votre présence sur place.</p>
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
          <template v-else-if="analyseIAAvantEnCours || analyseIAApresEnCours">
            <span class="spinner-white"></span>
            Analyse IA en cours…
          </template>
          <template v-else-if="analyseIAAvant?.fraude || analyseIAApres?.fraude">
            <Icone nom="robot" /> Fraude détectée — Reprenez les photos
          </template>
          <template v-else-if="gpsEnCours">
            <span class="spinner-white"></span>
            Localisation en cours…
          </template>
          <template v-else-if="motifGpsCourant === 'trop_loin'">
            <Icone nom="localisation" /> Vous êtes loin du signalement
          </template>
          <template v-else-if="photosHorsRayon.length">
            GPS des deux photos requis (&lt; {{ RAYON_ANTI_FRAUDE_M }} m)
          </template>
          <template v-else-if="gpsErreurCourante">
            Position GPS requise (&lt; {{ RAYON_ANTI_FRAUDE_M }} m)
          </template>
          <template v-else>
            <span class="btn-inner">
              Confirmer le nettoyage
              <span class="btn-pts-tag">+{{ pointsAGagner }} pts</span>
            </span>
          </template>
        </button>

        <p v-if="!peutConfirmer && !envoiEnCours" class="footer-hint">
          Deux photos caméra, leurs positions GPS à moins de {{ RAYON_ANTI_FRAUDE_M }} m et la
          validation IA sont requises pour créditer vos points.
        </p>

        <button
          v-if="(photoAvantFichier || photoApresFichier) && !envoiEnCours && !succesAffiche"
          type="button"
          class="btn-reset-preuves"
          @click="reinitialiserPreuves"
        >
          <Icone nom="rafraichir" /> Recommencer les captures
        </button>
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
import { analyserPhotoAvant, analyserPhotoApres } from '../services/analyseIA'
import Icone from '../components/Icone.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// Règle anti-fraude : rayon maximal autorisé autour du signalement
const RAYON_ANTI_FRAUDE_M = 20
// Durée de validité d'un relevé GPS avant la prise de photo
const DELAI_VALIDITE_POSITION_MS = 2 * 60 * 1000
// Le bucket qui existe est `signalements-photos` (créé par
// backend/policies/storage_policies.sql). `photos-signalements` n'a jamais été
// créé : le tester en premier ne faisait qu'ajouter un upload voué à l'échec
// et un nom de bucket trompant dans les messages d'erreur. On garde le nom en
// repli pour un environnement existant qui l'aurait déjà déployé.
const BUCKETS_PHOTOS = ['signalements-photos', 'photos-signalements']
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const videoElement = ref(null)
const cameraOuverte = ref(false)
const cameraPrete = ref(false)
const captureActive = ref('')
let cameraStream = null

// Signalement cible
const signalement = ref(null)
const chargementInitial = ref(true)
const photoOriginalIndisponible = ref(false)

// Photos avant/après et positions GPS relevées au moment de chaque capture
const photoAvantFichier = ref(null)
const photoAvantPreview = ref(null)
const photoAvantTaille = ref(0)
const photoAvantGps = ref(null)
const photoApresFichier = ref(null)
const photoApresPreview = ref(null)
const photoApresTaille = ref(0)
const photoApresGps = ref(null)

// Géolocalisation & Anti-fraude
const gpsDemandeEnCours = ref('') // '' | 'avant' | 'apres'
const gpsErreur = ref({ avant: '', apres: '' })
const gpsMotif = ref({ avant: '', apres: '' }) // '' | 'trop_loin' | 'permission' | 'indisponible' | 'perime' | 'capture'
const distanceAvantMetres = ref(null)
const distanceApresMetres = ref(null)
const photoGpsCourant = ref(null) // position relevée juste avant l'ouverture caméra
const photoGpsCourantAt = ref(0)   // horodatage du relevé
let gpsJeton = 0

// Soumission
const envoiEnCours = ref(false)
const etapeEnvoi = ref('') // 'compression' | 'upload' | 'mise_a_jour' | 'termine'
const succesAffiche = ref(false)
const messageErreurSoumission = ref('')
let minuteurRedirection = null

// Analyse IA anti-fraude (Gemini Vision)
const analyseIAAvant = ref(null)   // { valide, fraude, memeLieu, dechetsVisibles, categorieOk, message, score }
const analyseIAApres = ref(null)   // { valide, fraude, memeLieu, zoneNettoyee, message, score }
const analyseIAAvantEnCours = ref(false)
const analyseIAApresEnCours = ref(false)

const signalementId = computed(() => {
  return route.query.id || route.params.id || ''
})

const pointsAGagner = computed(() => {
  return signalement.value?.categories?.points_nettoyage || 30
})

const photoOriginalDisponible = computed(() => {
  return Boolean(signalement.value?.photo_avant_url) && !photoOriginalIndisponible.value
})

const gpsEnCours = computed(() => gpsDemandeEnCours.value !== '')

// Bloque toute nouvelle capture pendant l'envoi, l'analyse ou une localisation en cours
const captureBloquee = computed(() => {
  return Boolean(envoiEnCours.value || succesAffiche.value || gpsEnCours.value)
})

const peutConfirmer = computed(() => {
  return Boolean(
    signalement.value?.id &&
    photosGpsValides.value &&
    analyseIAAvant.value?.valide === true &&
    analyseIAApres.value?.valide === true &&
    !analyseIAAvantEnCours.value &&
    !analyseIAApresEnCours.value &&
    !gpsEnCours.value &&
    !envoiEnCours.value
  )
})

const photosGpsValides = computed(() => {
  return Boolean(photoAvantFichier.value && photoApresFichier.value) &&
    estDansRayon(photoAvantGps.value, distanceAvantMetres.value) &&
    estDansRayon(photoApresGps.value, distanceApresMetres.value)
})

// Photos capturées dont la position est refusée par le contrôle géographique
const photosHorsRayon = computed(() => {
  const horsRayon = []
  if (photoAvantFichier.value && !estDansRayon(photoAvantGps.value, distanceAvantMetres.value)) {
    horsRayon.push('« avant »')
  }
  if (photoApresFichier.value && !estDansRayon(photoApresGps.value, distanceApresMetres.value)) {
    horsRayon.push('« après »')
  }
  return horsRayon
})

const gpsErreurCourante = computed(() => {
  return gpsErreur.value.avant || gpsErreur.value.apres || ''
})

const motifGpsCourant = computed(() => {
  return gpsMotif.value.avant || gpsMotif.value.apres || ''
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
  if (minuteurRedirection) clearTimeout(minuteurRedirection)
  if (photoAvantPreview.value) URL.revokeObjectURL(photoAvantPreview.value)
  if (photoApresPreview.value) URL.revokeObjectURL(photoApresPreview.value)
})

const SIGNALEMENTS_DEMO = {
  'sig-buj-1': {
    id: 'sig-buj-1',
    latitude: -3.3862,
    longitude: 29.3621,
    statut: 'en_attente',
    description: 'Amas important de sachets et bouteilles plastiques près du canal d\'évacuation de Rohero.',
    photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800',
    categories: { nom: 'Déchets plastiques', points_signalement: 10, points_nettoyage: 30 }
  },
  'sig-buj-2': {
    id: 'sig-buj-2',
    latitude: -3.3645,
    longitude: 29.3730,
    statut: 'vu',
    description: 'Décharge sauvage d\'ordures ménagères à ciel ouvert constatée au croisement des avenues.',
    photo_avant_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800',
    categories: { nom: 'Décharge sauvage', points_signalement: 15, points_nettoyage: 45 }
  },
  'sig-buj-5': {
    id: 'sig-buj-5',
    latitude: -3.3790,
    longitude: 29.3560,
    statut: 'en_attente',
    description: 'Encombrants et résidus de chantiers abandonnés sur le trottoir public.',
    photo_avant_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
    categories: { nom: 'Autre', points_signalement: 10, points_nettoyage: 25 }
  }
}

async function chargerSignalementCible() {
  chargementInitial.value = true
  const idCible = signalementId.value

  try {
    if (!idCible) throw new Error('Aucun identifiant de signalement fourni.')

    // Vérifier si l'ID est un vrai UUID (PostgreSQL) ou un identifiant de démo (ex: sig-buj-1)
    const isUuid = UUID_REGEX.test(idCible)

    if (!isUuid) {
      const demo = SIGNALEMENTS_DEMO[idCible]
      if (!demo) throw new Error('Ce signalement de démonstration est introuvable.')
      if (['nettoye', 'traite'].includes(demo.statut)) {
        throw new Error('Ce signalement est déjà nettoyé ou traité.')
      }
      signalement.value = demo
      return
    }

    if (!supabaseConfigured) throw new Error('Supabase n’est pas configuré.')

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

// 2. Capture caméra avec relevé GPS préalable (position certifiée au moment de la photo)
async function ouvrirCamera(typeCapture) {
  if (captureBloquee.value) return

  messageErreurSoumission.value = ''

  if (!navigator.mediaDevices?.getUserMedia) {
    gpsMotif.value[typeCapture] = 'indisponible'
    gpsErreur.value[typeCapture] = 'La caméra nécessite un navigateur compatible et une connexion HTTPS (ou localhost).'
    return
  }

  // Le contrôle géographique est bloquant : sans position valide, pas de capture.
  const position = await demanderPosition(typeCapture)
  if (!position) return

  try {
    arreterCamera()

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      })
    } catch {
      // Fallback caméra par défaut (utile sur PC portable / ordinateur sans caméra arrière)
      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
      })
    }

    captureActive.value = typeCapture
    cameraOuverte.value = true
    cameraPrete.value = false
    await nextTick()

    if (videoElement.value) {
      videoElement.value.srcObject = cameraStream
      videoElement.value.onloadedmetadata = () => {
        cameraPrete.value = true
      }
      await videoElement.value.play().catch(() => {})
      cameraPrete.value = true
    }
  } catch (error) {
    arreterCamera()
    cameraOuverte.value = false
    captureActive.value = ''
    gpsMotif.value[typeCapture] = 'permission'
    gpsErreur.value[typeCapture] = error.name === 'NotAllowedError'
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
  photoGpsCourant.value = null
}

function prendrePhoto() {
  const video = videoElement.value
  if (!captureActive.value || !cameraPrete.value) return

  const typeCapture = captureActive.value
  const position = photoGpsCourant.value

  // Position relevée trop tôt : on invalide la capture pour éviter une preuve
  // certifiée par une localisation qui n'est plus la position du photographe
  if (!position || Date.now() - photoGpsCourantAt.value > DELAI_VALIDITE_POSITION_MS) {
    fermerCamera()
    gpsMotif.value[typeCapture] = 'perime'
    gpsErreur.value[typeCapture] = 'La position a été relevée il y a trop longtemps. Reprenez la photo pour un relevé GPS actualisé.'
    return
  }

  // Aucun pixel disponible : on refuse la capture plutôt que de produire
  // une image synthétique qui serait acceptée comme une preuve.
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    fermerCamera()
    gpsMotif.value[typeCapture] = 'capture'
    gpsErreur.value[typeCapture] = 'La caméra n’a pas renvoyé d’image. Vérifiez qu’elle n’est pas obstruée, puis reprenez la photo.'
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  canvas.toBlob((blob) => {
    fermerCamera()

    if (!blob) {
      gpsMotif.value[typeCapture] = 'capture'
      gpsErreur.value[typeCapture] = 'La photo n’a pas pu être capturée. Réessayez.'
      return
    }

    const capturedAt = Date.now()
    const file = new File([blob], `greenshot-${typeCapture}-${capturedAt}.jpg`, {
      type: 'image/jpeg',
      lastModified: capturedAt
    })
    enregistrerCapture(typeCapture, file, position, capturedAt)
  }, 'image/jpeg', 0.92)
}

function enregistrerCapture(typeCapture, file, position, capturedAt) {
  const preview = URL.createObjectURL(file)

  if (typeCapture === 'avant') {
    if (photoAvantPreview.value) URL.revokeObjectURL(photoAvantPreview.value)
    photoAvantFichier.value = file
    photoAvantPreview.value = preview
    photoAvantTaille.value = Math.round(file.size / 1024)
    photoAvantGps.value = { ...position, capturedAt }
    distanceAvantMetres.value = position.distanceMetres
    // Nouvelle référence « avant » : l'analyse « après » doit être refaite
    analyseIAAvant.value = null
  } else {
    if (photoApresPreview.value) URL.revokeObjectURL(photoApresPreview.value)
    photoApresFichier.value = file
    photoApresPreview.value = preview
    photoApresTaille.value = Math.round(file.size / 1024)
    photoApresGps.value = { ...position, capturedAt }
    distanceApresMetres.value = position.distanceMetres
    analyseIAApres.value = null
  }

  lancerAnalyseIA(typeCapture)
}

/**
 * Lance l'analyse Gemini Vision pour détecter les fraudes.
 * - Pour "avant" : compare la photo originale du signalement avec la photo avant du nettoyeur.
 * - Pour "apres" : compare la photo avant avec la photo après.
 * Reprendre la photo « avant » invalide l'analyse « après » et la rejoue.
 */
async function lancerAnalyseIA(typeCapture) {
  if (typeCapture === 'avant') {
    await analyserPhotoAvantDuCitoyen()
    if (photoApresFichier.value) await analyserPhotoApresDuCitoyen()
  } else {
    await analyserPhotoApresDuCitoyen()
  }
}

async function analyserPhotoAvantDuCitoyen() {
  analyseIAAvantEnCours.value = true
  analyseIAAvant.value = null
  try {
    const origUrl = photoOriginalDisponible.value ? signalement.value.photo_avant_url : null
    if (!origUrl) {
      // Pas de photo originale exploitable : on n'empêche pas la validation
      analyseIAAvant.value = {
        valide: true,
        fraude: false,
        memeLieu: null,
        dechetsVisibles: null,
        categorieOk: null,
        message: 'Photo originale indisponible — validation GPS uniquement.',
        score: 0,
        avertissement: true
      }
      return
    }
    const categorieNom = signalement.value?.categories?.nom || 'Déchet'
    analyseIAAvant.value = await analyserPhotoAvant(origUrl, photoAvantFichier.value, categorieNom)
  } catch (err) {
    console.error('❌ [IA Greenshot] Erreur analyse avant:', err)
    // Panne réseau ou quota Gemini : on dégrade vers le contrôle GPS sans bloquer
    analyseIAAvant.value = {
      valide: true,
      fraude: false,
      message: `Analyse IA indisponible (${messageErreurCourt(err)}) — validation GPS uniquement.`,
      score: 0,
      avertissement: true
    }
  } finally {
    analyseIAAvantEnCours.value = false
  }
}

async function analyserPhotoApresDuCitoyen() {
  analyseIAApresEnCours.value = true
  analyseIAApres.value = null
  try {
    if (!photoAvantFichier.value) {
      analyseIAApres.value = {
        valide: false,
        fraude: true,
        message: 'Photo avant requise pour comparer.',
        score: 0
      }
      return
    }
    analyseIAApres.value = await analyserPhotoApres(photoAvantFichier.value, photoApresFichier.value)
  } catch (err) {
    console.error('❌ [IA Greenshot] Erreur analyse après:', err)
    analyseIAApres.value = {
      valide: true,
      fraude: false,
      message: `Analyse IA indisponible (${messageErreurCourt(err)}) — validation GPS uniquement.`,
      score: 0,
      avertissement: true
    }
  } finally {
    analyseIAApresEnCours.value = false
  }
}

function messageErreurCourt(err, max = 120) {
  const texte = String(err?.message || err || 'erreur inconnue')
  return texte.length > max ? `${texte.slice(0, max)}…` : texte
}

function formaterDateHeure(timestamp) {
  if (!timestamp) return '—'
  return new Intl.DateTimeFormat('fr-BI', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(timestamp)
}

function formaterCoordonnees(photoGps) {
  if (!photoGps || !Number.isFinite(photoGps.latitude) || !Number.isFinite(photoGps.longitude)) {
    return 'position inconnue'
  }
  return `${photoGps.latitude.toFixed(5)}, ${photoGps.longitude.toFixed(5)}`
}

// 3. Relevé GPS bloquant avant chaque capture (aucune photo sans position certifiée)
function demanderPosition(typeCapture) {
  const jeton = ++gpsJeton
  gpsDemandeEnCours.value = typeCapture
  gpsErreur.value[typeCapture] = ''
  gpsMotif.value[typeCapture] = ''

  if (!('geolocation' in navigator)) {
    gpsDemandeEnCours.value = ''
    gpsMotif.value[typeCapture] = 'indisponible'
    gpsErreur.value[typeCapture] = "La géolocalisation n'est pas supportée par votre navigateur."
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Requête dépassée par un relevé plus récent : on ignore ce résultat périmé
        if (jeton !== gpsJeton) return resolve(null)

        gpsDemandeEnCours.value = ''

        const position = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          precision: Math.round(pos.coords.accuracy || 0)
        }
        const distance = calculerHaversine(
          position.latitude,
          position.longitude,
          Number(signalement.value?.latitude),
          Number(signalement.value?.longitude)
        )

        if (distance > RAYON_ANTI_FRAUDE_M) {
          gpsMotif.value[typeCapture] = 'trop_loin'
          gpsErreur.value[typeCapture] = `Vous êtes loin du signalement : ${formaterDistance(distance)} alors que la limite est de ${RAYON_ANTI_FRAUDE_M} m. Rapprochez-vous du lieu signalé puis réessayez.`
          return resolve(null)
        }

        // La distance n'est retenue qu'au moment de la photo (cf. enregistrerCapture)
        position.distanceMetres = distance
        photoGpsCourant.value = position
        photoGpsCourantAt.value = Date.now()
        resolve(position)
      },
      (err) => {
        if (jeton !== gpsJeton) return resolve(null)

        gpsDemandeEnCours.value = ''
        console.warn('Erreur GPS nettoyage:', err)
        gpsMotif.value[typeCapture] = err.code === 1 ? 'permission' : 'indisponible'
        gpsErreur.value[typeCapture] = err.code === 1
          ? "L'accès GPS a été refusé. Il est indispensable pour certifier votre présence sur le lieu."
          : err.code === 3
            ? 'Signal GPS indisponible ou délai dépassé. Rapprochez-vous d’une zone dégagée puis réessayez.'
            : 'Impossible de capter votre position. Réessayez à l’extérieur.'
        resolve(null)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  })
}

function estDansRayon(photoGps, distance) {
  return Boolean(
    photoGps &&
    Number.isFinite(photoGps.latitude) &&
    Number.isFinite(photoGps.longitude) &&
    distance !== null &&
    distance <= RAYON_ANTI_FRAUDE_M
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
  if (m === null || m === undefined || !Number.isFinite(m)) return 'position inconnue'
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
    const isRealUuid = UUID_REGEX.test(signalement.value.id)
    // La session n'est nécessaire que pour le parcours réel (RPC serveur)
    const nettoyeur = isRealUuid ? await resoudreNettoyeur() : userStore.user

    etapeEnvoi.value = 'compression'
    const photoCompressee = await compresserPhoto(photoApresFichier.value)

    etapeEnvoi.value = 'upload'
    let urlPubliqueApres = photoApresPreview.value

    if (isRealUuid) {
      const nomFichierApres = `nettoyage-apres-${Date.now()}-${identifiantAleatoire()}.jpg`
      urlPubliqueApres = await uploaderPhotoApres(nomFichierApres, photoCompressee)
    }

    let pointsGagnes = pointsAGagner.value

    if (isRealUuid) {
      // La RPC revalide côté serveur le rayon GPS et crédite les points
      etapeEnvoi.value = 'mise_a_jour'
      const { data: rpcData, error: rpcError } = await supabase.rpc('soumettre_preuve_nettoyage', {
        p_signalement_id: signalement.value.id,
        p_photo_apres_url: urlPubliqueApres,
        p_latitude: photoApresGps.value.latitude,
        p_longitude: photoApresGps.value.longitude
      })

      if (rpcError) throw rpcError
      if (!rpcData?.success) throw new Error(rpcData?.message || 'La validation anti-fraude a refusé cette preuve.')
      pointsGagnes = Number(rpcData.points_gagnes) || pointsAGagner.value
    }

    // Refléter immédiatement les points, puis resynchroniser avec la ligne profiles
    await majProfilNettoyeur(nettoyeur, pointsGagnes)

    etapeEnvoi.value = 'termine'
    succesAffiche.value = true

    // Redirection fluide après 1.8s vers le détail du signalement
    minuteurRedirection = setTimeout(() => {
      succesAffiche.value = false
      router.push(`/signalement/${signalement.value.id}`)
    }, 1800)

  } catch (err) {
    console.error('Erreur soumission nettoyage:', err)
    messageErreurSoumission.value = messageErreurCourt(err, 200) || "Erreur de connexion. Votre photo est conservée, veuillez réessayer."
  } finally {
    envoiEnCours.value = false
  }
}

/**
 * Retrouve la session du nettoyeur et s'assure que le store en est informé.
 * Le RPC soumettre_preuve_nettoyage est SECURITY DEFINER et attribue la preuve
 * via auth.uid() : sans session réelle, la preuve est comptée pour personne.
 * On ne recourt donc plus à l'authentification anonyme (qui créait une session
 * fantôme distincte de celle du citizen) ni à un profil de substitution.
 */
async function resoudreNettoyeur() {
  let utilisateur = userStore.user || null

  if (!utilisateur) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    utilisateur = sessionData.session?.user || null
  }

  if (!utilisateur) {
    throw new Error('Connectez-vous pour soumettre la preuve de nettoyage. Votre photo est conservée : reconnectez-vous puis renvoyez.')
  }

  // Le store peut être en retard sur la session (page ouverte avant la
  // connexion) : on recharge le profil via le RPC plutôt que de l'injecter.
  if (!userStore.profile?.nom) {
    await userStore.chargerProfile()
  }

  return utilisateur
}

async function compresserPhoto(fichier) {
  const options = {
    // Marge sous la limite de 1 Mo du bucket `signalements-photos` (voir
    // backend/policies/storage_policies.sql) : viser 1.0 exactement fait échouer
    // l'upload sur les quelques octets d'en-tête.
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/jpeg'
  }
  try {
    return await imageCompression(fichier, options)
  } catch (err) {
    console.warn('⚠️ [Nettoyage] Compression échouée, envoi du fichier original:', err)
    return fichier
  }
}

async function uploaderPhotoApres(nomFichier, fichier) {
  let derniereErreur = null

  for (const bucket of BUCKETS_PHOTOS) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(nomFichier, fichier, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        })

      if (!error && data) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(nomFichier)
        if (urlData?.publicUrl) return urlData.publicUrl
        derniereErreur = new Error(`URL publique indisponible pour le bucket ${bucket}.`)
      } else {
        derniereErreur = error
      }
    } catch (err) {
      derniereErreur = err
    }
  }

  if (!navigator.onLine) {
    throw new Error('Connexion internet interrompue pendant l’envoi de la photo.')
  }
  throw derniereErreur || new Error('Le téléversement de la photo après a échoué.')
}

async function majProfilNettoyeur(utilisateur, pointsGagnes) {
  if (!supabaseConfigured || !utilisateur?.id) return

  // Le RPC soumettre_preuve_nettoyage a déjà crédité les points côté serveur :
  // on relit le profil via obtenir_mon_profil() pour que Profil et Classement
  // repartent de la valeur autoritaire. On ne relit plus `profiles` en direct
  // (colonnes de score non accordées au rôle client) et on n'écrit plus un
  // score optimiste localement, qui pouvait masquer un refus du RPC.
  try {
    await userStore.chargerProfile()
  } catch (err) {
    console.warn('⚠️ [Nettoyage] Resynchronisation du profil impossible:', err)
  }
}

function identifiantAleatoire() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function reinitialiserPreuves() {
  if (envoiEnCours.value) return

  arreterCamera()
  cameraOuverte.value = false
  captureActive.value = ''

  if (photoAvantPreview.value) URL.revokeObjectURL(photoAvantPreview.value)
  if (photoApresPreview.value) URL.revokeObjectURL(photoApresPreview.value)

  photoAvantFichier.value = null
  photoAvantPreview.value = null
  photoAvantTaille.value = 0
  photoAvantGps.value = null
  photoApresFichier.value = null
  photoApresPreview.value = null
  photoApresTaille.value = 0
  photoApresGps.value = null

  distanceAvantMetres.value = null
  distanceApresMetres.value = null
  photoGpsCourant.value = null
  photoGpsCourantAt.value = 0
  gpsDemandeEnCours.value = ''
  gpsErreur.value = { avant: '', apres: '' }
  gpsMotif.value = { avant: '', apres: '' }
  analyseIAAvant.value = null
  analyseIAApres.value = null
  analyseIAAvantEnCours.value = false
  analyseIAApresEnCours.value = false
  messageErreurSoumission.value = ''
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
  display: flex;
  align-items: center;
  justify-content: center;
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

.gps-search-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #0369A1;
  background: #F0F9FF;
  border: 1px solid #BAE6FD;
  border-radius: 8px;
  padding: 0.35rem 0.55rem;
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

.geoloc-banner.info {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #475569;
}

.geoloc-details-list {
  margin: 0.4rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.72rem;
  line-height: 1.5;
}

.geoloc-text small {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.72rem;
  opacity: 0.85;
}

.geoloc-icon {
  display: flex;
  align-items: center;
  justify-content: center;
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

.btn-reset-preuves {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  align-self: center;
  background: transparent;
  border: none;
  padding: 0.35rem 0.5rem;
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text-muted, #64748B);
  text-decoration: underline;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.btn-reset-preuves:hover {
  color: var(--color-primary, #1F4D3A);
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
  display: flex;
  align-items: center;
  justify-content: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
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
  display: inline-flex;
  gap: 0.35rem;
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

/* ── 0. PHOTO ORIGINALE DU SIGNALEMENT ── */
.original-ref-section {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 18px;
  padding: 1.1rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.original-ref-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.ia-ref-badge {
  font-size: 0.68rem;
  font-weight: 700;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: #FFFFFF;
  padding: 2px 8px;
  border-radius: 9999px;
}

.original-ref-box {
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #E2E8F0;
  position: relative;
}

.original-ref-img {
  width: 100%;
  max-height: 160px;
  object-fit: cover;
  display: block;
}

.original-ref-missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1.25rem 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748B);
  background: #F8FAF9;
}

.original-ref-missing .missing-icon {
  font-size: 1.5rem;
}

.original-ref-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #F8FAF9;
  border-top: 1px solid #E5E9E2;
}

.original-cat-pill {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-primary, #1F4D3A);
  background: var(--color-primary-light, #EBF3EF);
  padding: 2px 8px;
  border-radius: 6px;
}

.original-pts-pill {
  font-size: 0.72rem;
  font-weight: 800;
  color: #B47318;
  background: var(--color-amber-light, #FDF6EB);
  padding: 2px 8px;
  border-radius: 9999px;
}

/* ── BADGES ANALYSE IA ── */
.ia-analyzing-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #6366F1;
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  margin-top: 0.4rem;
}

.spinner-ia {
  width: 12px;
  height: 12px;
  border: 2px solid #C7D2FE;
  border-top-color: #6366F1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.ia-result-badge {
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  margin-top: 0.4rem;
  font-size: 0.72rem;
}

.ia-result-badge.ia-ok {
  background: #F0FDF4;
  border: 1px solid #86EFAC;
  color: #166534;
}

.ia-result-badge.ia-fraude {
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  color: #991B1B;
}

.ia-result-badge.ia-warn {
  background: #FFFBEB;
  border: 1px solid #FCD34D;
  color: #92400E;
}

.ia-result-top {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
}

.ia-emoji {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.85rem;
}

.ia-message {
  font-weight: 600;
  line-height: 1.3;
}

.ia-issues-list {
  margin: 0.35rem 0 0 1.2rem;
  padding: 0;
  font-size: 0.68rem;
  line-height: 1.5;
}

.ia-issues-list li {
  margin-bottom: 1px;
}

.ia-score-pill {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 800;
  background: rgba(0, 0, 0, 0.07);
  padding: 1px 6px;
  border-radius: 9999px;
  white-space: nowrap;
}

.ia-success-checks {
  margin-top: 0.3rem;
  padding-left: 1.3rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: #15803d;
}

</style>
