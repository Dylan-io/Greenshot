<template>
  <div class="mapwrap">
    <!-- Repli hors ligne : WebGL 2 absent, ou tuiles injoignables.
         Contour du Burundi en SVG + pastilles, pas de moteur. -->
    <div v-if="etat === 'repli'" class="mapwrap__repli" role="img"
         :aria-label="`Vue hors ligne du Burundi, ${signalements.length} signalements`">
      <svg viewBox="0 0 200 200" class="repli__carte" aria-hidden="true">
        <path
          d="M96 22 L128 34 L142 60 L138 84 L150 108 L136 132 L118 142 L112 166 L96 178 L78 168 L72 144 L54 130 L44 104 L52 80 L66 62 L82 44 Z"
          fill="rgba(39,63,43,.55)" stroke="#68ef3f" stroke-width="1.6" stroke-linejoin="round"
        />
      </svg>

      <div class="repli__pins">
        <span
          v-for="(s, i) in positionsDemo"
          :key="i"
          class="repli__pin"
          :style="{ left: s.x + '%', top: s.y + '%', background: COULEUR[s.statut] || COULEUR.en_attente }"
        />
      </div>

      <p class="repli__msg">
        Moteur cartographique indisponible — vue hors ligne du Burundi.
      </p>
    </div>

    <div v-else class="mapwrap__canvas" ref="canvas" />

    <p v-if="etat === 'chargement'" class="mapwrap__msg mapwrap__msg--flottant">Chargement de la carte…</p>

    <!-- Contrôles : zoom, couches, recentrer -->
    <div class="mapctl" role="group" aria-label="Contrôles de la carte">
      <button type="button" class="mapctl__btn" aria-label="Zoom avant" @click="zoomer(1)">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" stroke-linecap="round" /></svg>
      </button>
      <button type="button" class="mapctl__btn" aria-label="Zoom arrière" @click="zoomer(-1)">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14" stroke-linecap="round" /></svg>
      </button>
      <button
        type="button"
        class="mapctl__btn"
        :class="{ 'is-on': relief }"
        :aria-pressed="relief"
        aria-label="Basculer le relief 3D"
        @click="basculerRelief"
      >
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="m12 3 9 5-9 5-9-5z" stroke-linejoin="round" /><path d="m3 13 9 5 9-5M3 17l9 5 9-5" stroke-linejoin="round" />
        </svg>
      </button>
      <button type="button" class="mapctl__btn" aria-label="Recentrer sur ma position" @click="recentrer">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, shallowRef } from 'vue'
import { creerStyle, SOURCE_PINS, COULEUR_STATUT, PALETTE, regrouper, projeter } from '../config/maplibreStyle'

const props = defineProps({
  signalements: { type: Array, default: () => [] },
  position: { type: Object, default: null }
})
const emit = defineEmits(['select-signalement'])

const COULEUR = COULEUR_STATUT
const canvas = ref(null)
const map = shallowRef(null)
const etat = ref('chargement')
const relief = ref(false)

let ml = null

const positionsDemo = [
  { x: 48, y: 44, statut: 'en_attente' },
  { x: 56, y: 52, statut: 'vu' },
  { x: 44, y: 58, statut: 'nettoye' },
  { x: 62, y: 60, statut: 'en_attente' },
  { x: 52, y: 66, statut: 'vu' },
  { x: 66, y: 48, statut: 'traite' }
]

// ── Repli WebGL 2 ────────────────────────────────────────────────────────
function webgl2Dispo() {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

// ── Chargement du moteur ─────────────────────────────────────────────────
// Le bundle UMD est servi depuis /vendor/maplibre-gl.js, pas depuis npm ni un
// CDN. Chargé en <script> injecté : le navigateur le met en cache disque et
// les navigations suivantes ne le retéléchargent pas.
let chargeEnCours = null

function chargerDepuisVendor() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl)
  if (chargeEnCours) return chargeEnCours

  chargeEnCours = new Promise((resolve, reject) => {
    const lien = document.createElement('link')
    lien.rel = 'stylesheet'
    lien.href = '/vendor/maplibre-gl.css'
    document.head.appendChild(lien)

    const script = document.createElement('script')
    script.src = '/vendor/maplibre-gl.js'
    script.async = true
    script.onload = () => {
      if (window.maplibregl) resolve(window.maplibregl)
      else reject(new Error('maplibregl absent après chargement'))
    }
    script.onerror = () => reject(new Error('échec du chargement de /vendor/maplibre-gl.js'))
    document.head.appendChild(script)
  })

  return chargeEnCours
}

async function chargerMoteur() {
  if (!webgl2Dispo()) {
    etat.value = 'repli'
    return
  }

  try {
    // Le moteur est servi localement depuis /vendor, pas depuis npm ni un CDN.
    // 917 Ko ne bloquent pas le premier rendu : le texte et le formulaire
    // sont lisibles avant que la carte arrive.
    ml = await chargerDepuisVendor()
  } catch (err) {
    console.warn('MapLibre indisponible:', err)
    etat.value = 'repli'
    return
  }

  await new Promise((r) => requestAnimationFrame(r))
  initialiser()
}

function initialiser() {
  const maplibregl = ml

  const instance = new maplibregl.Map({
    container: canvas.value,
    style: creerStyle(),
    center: [-3.3822, 29.3644],
    zoom: 6.2,
    minZoom: 4,
    maxZoom: 18,
    attributionControl: false,
    // Sans clé API, sans quota. Rien à configurer côté compte.
    transformRequest: (url) => ({ url })
  })

  map.value = instance

  // Pas de CDN à l'exécution : le CSS est local, mais MapLibre l'injecte
  // lui-même si on ne le fournit pas.
  maplibregl.accessToken = null

  instance.addControl(
    new maplibregl.AttributionControl({
      compact: true,
      customAttribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© contributeurs OpenStreetMap</a> · tuiles OpenFreeMap'
    }),
    'bottom-right'
  )

  // Sources GeoJSON ajoutées sur 'load' : MapLibre refuse addSource avant
  // que le style soit chargé, sinon _checkLoaded lève.
  instance.on('load', () => {
    instance.addSource(SOURCE_PINS, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    instance.addSource('greenshot-you', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    ajouterCouchesPins(instance)
    brancherEcouteurs(instance)

    etat.value = 'ok'
    majPins()
    majPosition()
    try {
      instance.setProjection({ type: 'globe' })
    } catch {
      /* globe non supporté : mercator par défaut, on continue */
    }
    instance.on('zoom', () => {
      if (instance.getZoom() > 9) {
        try { instance.setProjection({ type: 'mercator' }) } catch { /* ignore */ }
      }
    })
  })
}

function ajouterCouchesPins(instance) {

  // Halo puis pastille : le halo donne la lisibilité sur fond chargé
  instance.addLayer({
    id: 'pins-halo',
    type: 'circle',
    source: SOURCE_PINS,
    paint: {
      'circle-radius': ['step', ['get', 'count'], 15, 5, 20, 10, 26],
      'circle-color': [
        'case',
        ['has', 'statut'],
        ['match', ['get', 'statut'], 'en_attente', COULEUR.en_attente, 'vu', COULEUR.vu, 'nettoye', COULEUR.nettoye, COULEUR.traite],
        PALETTE.sprout
      ],
      'circle-opacity': 0.28,
      'circle-blur': 0.4
    }
  })

  instance.addLayer({
    id: 'pins',
    type: 'circle',
    source: SOURCE_PINS,
    paint: {
      'circle-radius': ['step', ['get', 'count'], 8, 5, 11, 10, 14],
      'circle-color': [
        'case',
        ['has', 'statut'],
        ['match', ['get', 'statut'], 'en_attente', COULEUR.en_attente, 'vu', COULEUR.vu, 'nettoye', COULEUR.nettoye, COULEUR.traite],
        PALETTE.sprout
      ],
      'circle-stroke-color': 'rgba(10,21,9,.75)',
      'circle-stroke-width': 1.5
    }
  })

  // Grappes : nombre affiché quand plusieurs épingles se chevauchent
  instance.addLayer({
    id: 'pins-count',
    type: 'symbol',
    source: SOURCE_PINS,
    filter: ['>', ['get', 'count'], 1],
    layout: {
      'text-field': ['get', 'count_abbr'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11
    },
    paint: { 'text-color': '#0a1509' }
  })

  instance.addLayer({
    id: 'you',
    type: 'circle',
    source: 'greenshot-you',
    paint: {
      'circle-radius': 9,
      'circle-color': PALETTE.sprout,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2.5
    }
  })
}

function brancherEcouteurs(instance) {
  instance.on('error', (e) => {
    // Tuiles injoignables : on bascule sur le repli SVG plutôt que d'afficher
    // une carte vide sans explication.
    if (/tiles\.openfreemap\.org/.test(String(e?.error?.message || ''))) {
      console.warn('Tuiles OpenFreeMap injoignables:', e.error)
      etat.value = 'repli'
    }
  })

  instance.on('click', 'pins', (e) => {
    const f = e.features?.[0]
    if (f?.properties?.ids?.length) emit('select-signalement', f.properties.ids[0])
  })

  instance.on('mouseenter', 'pins', () => { instance.getCanvas().style.cursor = 'pointer' })
  instance.on('mouseleave', 'pins', () => { instance.getCanvas().style.cursor = '' })
}

function majPins() {
  if (!map.value) return

  const feats = props.signalements
    .filter((s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)))
    .map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(s.longitude), Number(s.latitude)] },
      properties: { id: s.id, statut: s.statut || 'en_attente' }
    }))

  // Regroupement en pixels écran : recalculé à chaque fin de déplacement.
  const grappes = () => {
    if (!map.value) return []
    const projetes = feats.map((f) => {
      const pt = projeter(map.value, f.geometry.coordinates)
      return { ...f, x: pt.x, y: pt.y }
    })
    return regrouper(projetes).map((g) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: g.membres[0].geometry.coordinates },
      properties: {
        count: g.membres.length,
        count_abbr: g.membres.length > 9 ? '9+' : String(g.membres.length),
        ids: g.membres.map((m) => m.properties.id),
        statut: g.membres[0].properties.statut
      }
    }))
  }

  const majSource = () => {
    const src = map.value.getSource(SOURCE_PINS)
    if (src) src.setData({ type: 'FeatureCollection', features: grappes() })
  }

  majSource()
  map.value.on('moveend', majSource)
}

function majPosition() {
  if (!map.value) return
  const src = map.value.getSource('greenshot-you')
  if (!src) return

  const p = props.position
  src.setData({
    type: 'FeatureCollection',
    features: p
      ? [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(p.lng), Number(p.lat)] },
          properties: {}
        }]
      : []
  })
}

function zoomer(sens) {
  if (!map.value) return
  map.value.zoomTo(map.value.getZoom() + sens, { duration: 300 })
}

function basculerRelief() {
  if (!map.value) return
  relief.value = !relief.value
  map.value.setPitch(relief.value ? 58 : 0)
  if (relief.value) {
    map.value.flyTo({ center: [-3.3822, 29.3644], zoom: 14.4, pitch: 58, duration: 900 })
  }
}

function recentrer() {
  if (!map.value) return
  const p = props.position
  if (p) map.value.flyTo({ center: [Number(p.lng), Number(p.lat)], zoom: 15, duration: 800 })
  else map.value.flyTo({ center: [-3.3822, 29.3644], zoom: 12, duration: 800 })
}

watch(() => props.signalements, majPins, { deep: true })
watch(() => props.position, majPosition, { deep: true })

onMounted(chargerMoteur)

onBeforeUnmount(() => {
  if (map.value) map.value.remove()
  map.value = null
})

defineExpose({ recentrer, basculerRelief })
</script>

<style scoped>
.mapwrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  border-radius: var(--r-sm);
  overflow: hidden;
  background: var(--forest-3);
  border: 1px solid var(--line);
}

.mapwrap__canvas {
  position: absolute;
  inset: 0;
}

.mapwrap__repli {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.repli__carte {
  width: min(58%, 240px);
  height: auto;
  opacity: 0.9;
}

.repli__pins {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.repli__pin {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1.5px solid rgba(10, 21, 9, 0.75);
}

.mapwrap__msg {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 11px 14px;
  border-radius: var(--r-xs);
  background: rgba(10, 21, 9, 0.88);
  border: 1px solid var(--line-2);
  color: var(--fern);
  font-size: 12.5px;
  line-height: 1.45;
  text-align: center;
}

.mapwrap__msg--flottant {
  top: 12px;
  transform: none;
}

.mapctl {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  gap: 8px;
  z-index: 2;
}

.mapctl__btn {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--r-pill);
  background: rgba(23, 42, 25, 0.94);
  border: 1px solid var(--line-2);
  color: var(--fern);
  transition:
    background var(--dur-1) var(--ease-out),
    color var(--dur-1) var(--ease-out);
}

.mapctl__btn:hover {
  color: var(--white);
  border-color: var(--sprout);
}

.mapctl__btn.is-on {
  background: var(--sprout);
  color: var(--onyx);
  border-color: var(--sprout);
}
</style>