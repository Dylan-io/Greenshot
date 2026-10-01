<template>
  <div class="carte-interactive-container">
    
    <!-- Conteneur Carte Leaflet -->
    <div id="leaflet-map" ref="mapContainer" class="map-viewport"></div>

    <!-- Bouton Flottant Recentrer sur ma position (Locate) -->
    <button 
      type="button" 
      class="btn-locate-user" 
      @click="recentrerSurPosition" 
      :title="userPosition ? 'Recentrer sur ma position' : 'Obtenir ma position GPS'"
      :class="{ 'locating': isLocating }"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" class="locate-icon">
        <circle cx="12" cy="12" r="7"/>
        <line x1="12" y1="1" x2="12" y2="5"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="1" y1="12" x2="5" y2="12"/>
        <line x1="19" y1="12" x2="23" y2="12"/>
      </svg>
    </button>

    <!-- Légende Flottante Repliable (Coin inférieur gauche) -->
    <div class="floating-legend" :class="{ 'legend-expanded': !legendCollapsed }">
      <button type="button" class="legend-header-btn" @click="legendCollapsed = !legendCollapsed">
        <span class="legend-badge-dot"></span>
        <span class="legend-title">Légende des statuts</span>
        <span class="legend-chevron">{{ legendCollapsed ? '▲' : '▼' }}</span>
      </button>

      <div v-show="!legendCollapsed" class="legend-body">
        <div 
          v-for="(config, statusKey) in MAP_CONFIG.statusConfig" 
          :key="statusKey"
          class="legend-row"
        >
          <img :src="config.iconUrl" alt="Épingle" class="legend-pin" />
          <div class="legend-info">
            <span class="legend-label" :style="{ color: config.color }">{{ config.label }}</span>
            <small class="legend-desc">{{ config.description }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Fiche Flottante en Bas d'Écran (Bottom Sheet) au clic sur une épingle -->
    <transition name="slide-up">
      <div v-if="selectedSignalement" class="bottom-sheet-card" role="dialog" aria-modal="true">
        <button type="button" class="btn-close-sheet" @click="fermerFiche" aria-label="Fermer">✕</button>

        <div class="sheet-content">
          <!-- Vignette photo -->
          <div class="sheet-thumb-wrapper">
            <img 
              :src="selectedSignalement.photo_avant_url || 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=400'" 
              alt="Photo du problème" 
              class="sheet-thumb"
            />
            <span class="sheet-category-tag">
              {{ selectedSignalement.categories?.nom || 'Signalement' }}
            </span>
          </div>

          <!-- Détails & Statut -->
          <div class="sheet-details">
            <div class="sheet-header-row">
              <span 
                class="sheet-status-pill"
                :style="{ 
                  backgroundColor: getStatusConfig(selectedSignalement.statut).bgLight,
                  color: getStatusConfig(selectedSignalement.statut).color 
                }"
              >
                ● {{ getStatusConfig(selectedSignalement.statut).label }}
              </span>

              <!-- Distance approximative depuis l'utilisateur -->
              <span v-if="distanceUtilisateur" class="sheet-distance">
                📍 À {{ distanceUtilisateur }}
              </span>
            </div>

            <p class="sheet-description">
              {{ selectedSignalement.description || 'Signalement citoyen enregistré avec géolocalisation vérifiée.' }}
            </p>

            <div class="sheet-footer">
              <span class="sheet-date">
                {{ formaterDate(selectedSignalement.created_at) }}
              </span>
              <button 
                type="button" 
                class="btn-voir-detail" 
                @click="allerAuDetail(selectedSignalement.id)"
              >
                Voir le détail →
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { MAP_CONFIG, normaliserStatut, calculerDistance } from '../config/mapConfig'

const props = defineProps({
  signalements: {
    type: Array,
    default: () => []
  },
  userPosition: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select-signalement'])
const router = useRouter()

const mapContainer = ref(null)
let mapInstance = null
let markersLayer = null
let userMarker = null

const legendCollapsed = ref(true) // Replié par défaut sur mobile
const selectedSignalement = ref(null)
const isLocating = ref(false)

onMounted(() => {
  initialiserCarte()
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

watch(() => props.signalements, (nouvelleListe) => {
  mettreAJourMarqueurs(nouvelleListe)
}, { deep: true })

watch(() => props.userPosition, (newPos) => {
  if (newPos && mapInstance) {
    afficherMarqueurUtilisateur(newPos.latitude, newPos.longitude)
  }
}, { deep: true })

const distanceUtilisateur = computed(() => {
  if (!selectedSignalement.value || !props.userPosition) return null
  return calculerDistance(
    props.userPosition.latitude,
    props.userPosition.longitude,
    selectedSignalement.value.latitude,
    selectedSignalement.value.longitude
  )
})

function initialiserCarte() {
  if (!mapContainer.value) return

  // 1. Initialiser Leaflet centré sur Bujumbura (zoom 12)
  mapInstance = L.map(mapContainer.value, {
    center: MAP_CONFIG.defaultCenter,
    zoom: MAP_CONFIG.defaultZoom,
    minZoom: MAP_CONFIG.minZoom,
    maxZoom: MAP_CONFIG.maxZoom,
    zoomControl: false // Nous utilisons les contrôles personnalisés ergonomiques mobile
  })

  // 2. Fond de tuiles CARTO Voyager (Clair, moderne, sans clé API)
  const cartoLayer = MAP_CONFIG.tileLayers.voyager
  L.tileLayer(cartoLayer.url, {
    attribution: cartoLayer.attribution,
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance)

  // 3. Calque de marqueurs
  markersLayer = L.layerGroup().addTo(mapInstance)

  // 4. Positionner les épingles
  mettreAJourMarqueurs(props.signalements)

  // 5. Si la position de l'utilisateur est déjà connue
  if (props.userPosition?.latitude && props.userPosition?.longitude) {
    afficherMarqueurUtilisateur(props.userPosition.latitude, props.userPosition.longitude)
  }
}

function creerIconeStatut(statut) {
  const statutClean = normaliserStatut(statut)
  const config = MAP_CONFIG.statusConfig[statutClean] || MAP_CONFIG.statusConfig.en_attente

  return L.icon({
    iconUrl: config.iconUrl,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36]
  })
}

function mettreAJourMarqueurs(liste) {
  if (!markersLayer) return
  markersLayer.clearLayers()

  if (!liste || liste.length === 0) return

  liste.forEach((sig) => {
    if (!sig.latitude || !sig.longitude) return

    const customIcon = creerIconeStatut(sig.statut)
    const marker = L.marker([Number(sig.latitude), Number(sig.longitude)], { 
      icon: customIcon,
      riseOnHover: true
    })

    // Au clic sur l'épingle : ouvrir la Bottom Sheet (pas de popup moche)
    marker.on('click', () => {
      selectedSignalement.value = sig
      emit('select-signalement', sig)

      // Recentrer doucement la carte pour laisser de la place à la Bottom Sheet
      if (mapInstance) {
        mapInstance.panTo([Number(sig.latitude) + 0.005, Number(sig.longitude)], { animate: true, duration: 0.4 })
      }
    })

    marker.addTo(markersLayer)
  })
}

function afficherMarqueurUtilisateur(lat, lng) {
  if (!mapInstance) return
  if (userMarker) {
    userMarker.setLatLng([lat, lng])
    return
  }

  // Point bleu pulsant pour la position utilisateur
  const userIcon = L.divIcon({
    className: 'user-location-pulse',
    html: '<div class="pulse-ring"></div><div class="pulse-center"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  })

  userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstance)
}

function recentrerSurPosition() {
  if (props.userPosition?.latitude && props.userPosition?.longitude && mapInstance) {
    mapInstance.flyTo([props.userPosition.latitude, props.userPosition.longitude], 15, { duration: 1 })
    return
  }

  // Demander la géolocalisation si non encore obtenue
  if ('geolocation' in navigator) {
    isLocating.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isLocating.value = false
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        afficherMarqueurUtilisateur(lat, lng)
        if (mapInstance) {
          mapInstance.flyTo([lat, lng], 15, { duration: 1 })
        }
      },
      (err) => {
        isLocating.value = false
        console.warn('Erreur geoloc recentrage:', err)
        // Recentrer sur Bujumbura par défaut
        if (mapInstance) {
          mapInstance.flyTo(MAP_CONFIG.defaultCenter, 13, { duration: 0.8 })
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }
}

function getStatusConfig(statut) {
  const s = normaliserStatut(statut)
  return MAP_CONFIG.statusConfig[s] || MAP_CONFIG.statusConfig.en_attente
}

function fermerFiche() {
  selectedSignalement.value = null
}

function allerAuDetail(id) {
  router.push(`/signalement/${id}`)
}

function formaterDate(dateStr) {
  if (!dateStr) return 'Récemment'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return 'Récemment'
  }
}
</script>

<style scoped>
.carte-interactive-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-viewport {
  width: 100%;
  height: 100%;
  z-index: 10;
  background-color: #EBF4F9;
}

/* Bouton Flottant Recentrer (Locate) */
.btn-locate-user {
  position: absolute;
  right: 14px;
  bottom: 24px;
  z-index: 500;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 1.5px solid var(--color-border, #E5E9E2);
  color: var(--color-primary, #1F4D3A);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  -webkit-tap-highlight-color: transparent;
}

.btn-locate-user:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
}

.locate-icon {
  width: 22px;
  height: 22px;
}

.btn-locate-user.locating .locate-icon {
  animation: spin 1s linear infinite;
}

/* Légende Flottante Repliable */
.floating-legend {
  position: absolute;
  left: 14px;
  bottom: 24px;
  z-index: 500;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  max-width: 230px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.legend-header-btn {
  width: 100%;
  background: transparent;
  border: none;
  padding: 0.55rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-title);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text, #0F172A);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.legend-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-primary, #1F4D3A);
  flex-shrink: 0;
}

.legend-chevron {
  margin-left: auto;
  font-size: 0.65rem;
  color: var(--color-text-muted, #64748B);
}

.legend-body {
  padding: 0.4rem 0.75rem 0.65rem;
  border-top: 1px solid #F1F5F9;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-pin {
  width: 16px;
  height: 22px;
  flex-shrink: 0;
}

.legend-info {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.legend-label {
  font-size: 0.75rem;
  font-weight: 700;
}

.legend-desc {
  font-size: 0.65rem;
  color: var(--color-text-muted, #64748B);
}

/* Fiche Flottante (Bottom Sheet) */
.bottom-sheet-card {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 600;
  background: #FFFFFF;
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  padding: 0.85rem;
  max-width: 440px;
  margin: 0 auto;
}

.btn-close-sheet {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #F1F5F9;
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748B);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  z-index: 10;
}

.btn-close-sheet:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.sheet-content {
  display: flex;
  gap: 0.85rem;
}

.sheet-thumb-wrapper {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.sheet-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sheet-category-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #FFFFFF;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 4px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.sheet-header-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.sheet-status-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.sheet-distance {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-primary, #1F4D3A);
  background: var(--color-primary-light, #EBF3EF);
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
}

.sheet-description {
  font-size: 0.8rem;
  color: var(--color-text, #0F172A);
  line-height: 1.3;
  margin-bottom: 0.4rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sheet-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.sheet-date {
  font-size: 0.72rem;
  color: var(--color-text-muted, #64748B);
}

.btn-voir-detail {
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  font-family: var(--font-title);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-voir-detail:hover {
  background-color: var(--color-primary-hover, #163a2c);
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

<style>
/* Style global injecté pour l'épingle utilisateur pulsante Leaflet */
.user-location-pulse {
  position: relative;
}

.pulse-center {
  width: 14px;
  height: 14px;
  background-color: #2563EB;
  border: 2px solid #FFFFFF;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  position: absolute;
  top: 4px;
  left: 4px;
}

.pulse-ring {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgba(37, 99, 235, 0.35);
  animation: userPulse 2s ease-out infinite;
  position: absolute;
  top: 0;
  left: 0;
}

@keyframes userPulse {
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* Attribution Leaflet discrète et élégante */
.leaflet-control-attribution {
  font-size: 9px !important;
  color: #94A3B8 !important;
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(4px);
  padding: 2px 6px !important;
}
.leaflet-control-attribution a {
  color: #64748B !important;
  text-decoration: none;
}
</style>
