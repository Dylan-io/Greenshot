<template>
  <div class="carte-interactive-wrapper">
    <!-- Conteneur Carte Leaflet -->
    <div id="leaflet-map" ref="mapContainer" class="map-container"></div>

    <!-- Légende Flottante Interactive -->
    <div class="map-legend">
      <div class="legend-header">
        <span class="legend-title">Statuts Greenshot</span>
        <button class="legend-toggle" @click="legendCollapsed = !legendCollapsed">
          {{ legendCollapsed ? '+' : '−' }}
        </button>
      </div>

      <div v-show="!legendCollapsed" class="legend-items">
        <div 
          v-for="(config, statusKey) in MAP_CONFIG.statusConfig" 
          :key="statusKey"
          class="legend-item"
        >
          <img :src="config.iconUrl" alt="Pin" class="legend-pin-img" />
          <div class="legend-text">
            <span class="legend-label">{{ config.label }}</span>
            <small class="legend-desc">{{ config.description }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import { MAP_CONFIG, normaliserStatut } from '../config/mapConfig'

const props = defineProps({
  signalements: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select-signalement', 'nettoyer-signalement'])

const mapContainer = ref(null)
let mapInstance = null
let markersLayer = null
const legendCollapsed = ref(false)

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

function initialiserCarte() {
  if (!mapContainer.value) return

  // 1. Initialiser Leaflet avec le centre par défaut (Bujumbura)
  mapInstance = L.map(mapContainer.value, {
    center: MAP_CONFIG.defaultCenter,
    zoom: MAP_CONFIG.defaultZoom,
    minZoom: MAP_CONFIG.minZoom,
    maxZoom: MAP_CONFIG.maxZoom,
    zoomControl: false
  })

  L.control.zoom({ position: 'topright' }).addTo(mapInstance)

  // 2. Fond de tuiles CARTO Dark Matter (Gratuit, sans clé payante)
  const cartoLayer = MAP_CONFIG.tileLayers.darkMatter
  L.tileLayer(cartoLayer.url, {
    attribution: cartoLayer.attribution,
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance)

  // 3. Groupe de calques pour les marqueurs
  markersLayer = L.layerGroup().addTo(mapInstance)

  // 4. Positionner les épingles
  mettreAJourMarqueurs(props.signalements)
}

function creerIconeStatut(statut) {
  const statutClean = normaliserStatut(statut)
  const config = MAP_CONFIG.statusConfig[statutClean] || MAP_CONFIG.statusConfig.en_attente

  return L.icon({
    iconUrl: config.iconUrl,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38]
  })
}

function mettreAJourMarqueurs(liste) {
  if (!markersLayer) return
  markersLayer.clearLayers()

  if (!liste || liste.length === 0) return

  liste.forEach((sig) => {
    if (!sig.latitude || !sig.longitude) return

    const customIcon = creerIconeStatut(sig.statut)
    const marker = L.marker([Number(sig.latitude), Number(sig.longitude)], { icon: customIcon })
    const statutClean = normaliserStatut(sig.statut)
    const conf = MAP_CONFIG.statusConfig[statutClean]

    const popupHtml = `
      <div class="custom-map-popup">
        ${sig.photo_avant_url ? `<img src="${sig.photo_avant_url}" alt="Photo" class="popup-thumb" />` : ''}
        <h4 style="margin: 0.35rem 0 0.15rem; font-size: 0.95rem; font-weight: 700;">${sig.categories?.nom || 'Signalement'}</h4>
        <p style="margin: 0 0 0.35rem; font-size: 0.8rem; color: #64748b;">📍 ${sig.ville || 'Bujumbura'}</p>
        <div style="margin-bottom: 0.5rem;">
          <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 7px; border-radius: 9999px; background: ${conf.bgLight}; color: ${conf.color}">
            ${conf.label}
          </span>
        </div>
        <div style="display: flex; gap: 0.35rem;">
          <button id="btn-detail-${sig.id}" style="flex: 1; padding: 5px; font-size: 0.8rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Détails
          </button>
          ${statutClean === 'en_attente' || statutClean === 'vu' ? `
            <button id="btn-nettoyer-${sig.id}" style="flex: 1; padding: 5px; font-size: 0.8rem; background: #E8A33D; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Nettoyer 🧹
            </button>
          ` : ''}
        </div>
      </div>
    `

    marker.bindPopup(popupHtml)

    marker.on('popupopen', () => {
      const btnDetail = document.getElementById(`btn-detail-${sig.id}`)
      if (btnDetail) {
        btnDetail.onclick = () => emit('select-signalement', sig)
      }
      const btnNettoyer = document.getElementById(`btn-nettoyer-${sig.id}`)
      if (btnNettoyer) {
        btnNettoyer.onclick = () => emit('nettoyer-signalement', sig)
      }
    })

    markersLayer.addLayer(marker)
  })
}
</script>

<style scoped>
.carte-interactive-wrapper {
  position: relative;
  width: 100%;
  height: 540px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.map-container {
  width: 100%;
  height: 100%;
  background-color: #0f172a;
}

/* Légende Flottante */
.map-legend {
  position: absolute;
  bottom: 1.25rem;
  right: 1.25rem;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  z-index: 1000;
  max-width: 290px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.35);
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #94a3b8;
}

.legend-toggle {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.65rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.legend-pin-img {
  width: 20px;
  height: 26px;
  flex-shrink: 0;
}

.legend-text {
  display: flex;
  flex-direction: column;
}

.legend-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.2;
}

.legend-desc {
  font-size: 0.7rem;
  color: #94a3b8;
  line-height: 1.15;
}
</style>

<style>
.custom-map-popup .popup-thumb {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 0.25rem;
}
</style>
