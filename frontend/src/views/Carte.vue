<template>
  <ScreenBar title="Carte du Burundi" subtitle="Les signalements autour de vous">
    <template #action>
      <span class="pill pill--dark" v-if="position">
        <span class="pill__dot" />Ma position
      </span>
      <button
        type="button"
        class="pill pill--ghost"
        :aria-pressed="relief"
        @click="basculerRelief"
      >
        ● 3D
      </button>
    </template>
  </ScreenBar>

  <div class="gs-pad carte-wrap">
    <div class="carte-top">
      <p v-if="horsLigne" class="carte-warn" role="status">
        Tuiles injoignables — vue hors ligne du Burundi.
      </p>
      <p v-else class="carte-loc">
        Bujumbura · {{ signalements.length }} signalement{{ signalements.length > 1 ? 's' : '' }}
      </p>
    </div>

    <div class="carte-body">
      <!-- Filtre catégories : tuiles carrées avec compteur -->
      <div class="carte-filters" role="group" aria-label="Filtrer par catégorie">
        <button
          v-for="c in categoriesCalcul"
          :key="c.id"
          type="button"
          class="catbtn"
          :class="{ 'is-on': filtreCategorie === c.id }"
          :aria-pressed="filtreCategorie === c.id"
          @click="basculerCategorie(c.id)"
        >
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path :d="c.trace" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span v-if="c.nombre" class="catbtn__count">{{ c.nombre }}</span>
        </button>

        <button type="button" class="legend-btn" @click="legendeOuverte = !legendeOuverte">
          <span aria-hidden="true">≡</span> Légende
          <svg class="ic ic--xs chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="carte-map">
        <CarteMapLibre
          ref="carteRef"
          :signalements="signalementsFiltres"
          :position="position"
          @select-signalement="ouvrirDetail"
        />

        <button type="button" class="btn btn--primary carte-signal" @click="signalerIci">
          Signaler ici
        </button>
      </div>
    </div>

    <!-- Légende dépliable -->
    <div v-if="legendeOuverte" class="carte-legende" role="group" aria-label="Légende des statuts">
      <span class="carte-legende__item"><i :style="{ background: STATUTS.en_attente }" /> En attente</span>
      <span class="carte-legende__item"><i :style="{ background: STATUTS.vu }" /> Vu</span>
      <span class="carte-legende__item"><i :style="{ background: STATUTS.nettoye }" /> Nettoyé</span>
      <span class="carte-legende__item"><i :style="{ background: STATUTS.traite }" /> Traité</span>
    </div>

    <!-- Bandeau bas : compteur + partage -->
    <div class="carte-strip">
      <p class="carte-strip__count">
        {{ signalementsFiltres.length }}
        <span>signalements à traiter</span>
      </p>
      <button type="button" class="btn btn--secondary btn--sm carte-share" @click="partager">
        <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="m21 3-8 18-3-7-7-3z" stroke-linejoin="round" />
        </svg>
        Partager
      </button>
    </div>

    <p class="carte-credit">
      Fond de carte © contributeurs OpenStreetMap · tuiles OpenFreeMap
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabaseClient'
import CarteMapLibre from '../components/CarteMapLibre.vue'
import ScreenBar from '../components/ScreenBar.vue'

const STATUTS = {
  en_attente: '#B5502F',
  vu: '#3E7CA6',
  nettoye: '#E8A33D',
  traite: '#1F4D3A'
}

const TRACES = {
  plastique: 'M9 3h6l-1 3h3l-3 15H10L7 6h3z',
  verre: 'M8 3h8l-1 7 3 4v7H6v-7l3-4z',
  megots: 'M4 18h16v2H4zM7 14h10v3H7zM9 9h6v4H9z',
  ordures: 'M6 8h12l-1 13H7zM9 5V3h6v2M9 11v7M15 11v7',
  organique: 'M12 21c-4 0-7-3-7-7 0-3 2-5 4-6 0-2 1-4 3-4s3 2 3 4c2 1 4 3 4 6 0 4-3 7-7 7z',
  ewaste: 'M4 7h16v10H4zM9 11h6M8 17v3M16 17v3M6 4h4M14 4h4'
}

function tracer(nom) {
  const t = String(nom || '').toLowerCase()
  if (t.includes('plastique') || t.includes('bouteille')) return TRACES.plastique
  if (t.includes('verre')) return TRACES.verre
  if (t.includes('mégot') || t.includes('megot') || t.includes('cigarette')) return TRACES.megots
  if (t.includes('organique') || t.includes('manger')) return TRACES.organique
  if (t.includes('électro') || t.includes('electro') || t.includes('e-waste')) return TRACES.ewaste
  return TRACES.ordures
}

const router = useRouter()
const carteRef = ref(null)
const signalements = ref([])
const categories = ref([])
const filtreCategorie = ref('')
const position = ref(null)
const relief = ref(false)
const horsLigne = ref(false)
const legendeOuverte = ref(false)

// Filtres par statut, comme dans le prototype : tuile dédiée par statut
// plutôt qu'un seul bouton « tous ».
const categoriesCalcul = computed(() => {
  const base = [
    { id: '', nom: 'Tous', trace: TRACES.ordures },
    { id: 'plastique', nom: 'Plastique', trace: TRACES.plastique },
    { id: 'verre', nom: 'Verre', trace: TRACES.verre },
    { id: 'megots', nom: 'Mégots', trace: TRACES.megots },
    { id: 'organique', nom: 'Organique', trace: TRACES.organique },
    { id: 'ewaste', nom: 'Électronique', trace: TRACES.ewaste }
  ]

  return base.map((c) => {
    let nombre = 0
    if (c.id === '') {
      nombre = signalements.value.length
    } else {
      nombre = signalements.value.filter((s) => categorieIdDe(s) === c.id).length
    }
    return { ...c, nombre }
  })
})

function categorieIdDe(s) {
  const n = String(s.categories?.nom || '').toLowerCase()
  if (n.includes('plastique')) return 'plastique'
  if (n.includes('verre')) return 'verre'
  if (n.includes('mégot') || n.includes('megot')) return 'megots'
  if (n.includes('organique')) return 'organique'
  if (n.includes('électro') || n.includes('electro')) return 'ewaste'
  return 'ordures'
}

const signalementsFiltres = computed(() => {
  if (!filtreCategorie.value) return signalements.value
  return signalements.value.filter((s) => categorieIdDe(s) === filtreCategorie.value)
})

function basculerCategorie(id) {
  filtreCategorie.value = filtreCategorie.value === id ? '' : id
}

function ouvrirDetail(id) {
  router.push(`/signalement/${id}`)
}

function signalerIci() {
  if (position.value) {
    router.push({ path: '/signaler', query: { lat: position.value.lat, lng: position.value.lng } })
  } else {
    router.push('/signaler')
  }
}

function basculerRelief() {
  relief.value = !relief.value
  carteRef.value?.basculerRelief()
}

function partager() {
  if (navigator.share) {
    navigator.share({ title: 'Greenshot', url: window.location.href }).catch(() => {})
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href)
  }
}

onMounted(async () => {
  await Promise.all([chargerCategories(), chargerSignalements()])
  demanderPosition()
})

onBeforeUnmount(() => {
  horsLigne.value = false
})

async function chargerCategories() {
  try {
    const { data } = await supabase.from('categories').select('*').order('nom')
    if (data && data.length > 0) categories.value = data
  } catch (err) {
    console.warn('Supabase categories non dispo:', err)
  }
}

async function chargerSignalements() {
  try {
    const { data, error } = await supabase
      .from('signalements')
      .select('*, categories(nom, points_signalement, points_nettoyage)')
      .order('created_at', { ascending: false })
    if (error) throw error
    if (data) signalements.value = data
  } catch (err) {
    console.warn('Supabase signalements indisponible:', err)
    // Données de démonstration : UNIQUEMENT en développement local.
    // Encadré par import.meta.env.DEV, jamais en production.
    if (import.meta.env.DEV && signalements.value.length === 0) {
      signalements.value = [
        { id: 'demo-1', latitude: -3.3822, longitude: 29.3644, statut: 'en_attente', ville: 'Bujumbura (Centre-ville)', categories: { nom: 'Déchets plastiques' } },
        { id: 'demo-2', latitude: -3.3615, longitude: 29.3750, statut: 'nettoye', ville: 'Bujumbura (Buyenzi)', categories: { nom: 'Décharge sauvage' } },
        { id: 'demo-3', latitude: -3.3950, longitude: 29.3520, statut: 'vu', ville: 'Bujumbura (Kigobe)', categories: { nom: 'Pollution eau' } }
      ]
    }
  }
}

function demanderPosition() {
  if (!('geolocation' in navigator)) return
  navigator.geolocation.getCurrentPosition(
    (p) => { position.value = { lat: p.coords.latitude, lng: p.coords.longitude } },
    () => {},
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  )
}
</script>

<style scoped>
.carte-wrap {
  display: grid;
  gap: 12px;
}

.carte-top {
  min-height: 20px;
}

.carte-loc {
  margin: 0;
  font-size: 13px;
  color: var(--fern);
}

.carte-warn {
  margin: 0;
  padding: 9px 12px;
  border-radius: var(--r-xs);
  background: rgba(242, 193, 78, 0.12);
  border: 1px solid rgba(242, 193, 78, 0.3);
  color: var(--amber);
  font-size: 12.5px;
}

.carte-body {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 10px;
  height: min(62vh, 520px);
}

.carte-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.catbtn {
  flex: 1 1 0;
  min-height: 46px;
}

.catbtn {
  position: relative;
  display: grid;
  place-items: center;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--fern);
  transition:
    background var(--dur-1) var(--ease-out),
    color var(--dur-1) var(--ease-out),
    border-color var(--dur-1) var(--ease-out);
}

.catbtn .ic {
  width: 20px;
  height: 20px;
}

.catbtn:hover {
  color: var(--white);
  border-color: var(--line-2);
}

.catbtn.is-on {
  background: var(--sprout);
  border-color: var(--sprout);
  color: var(--onyx);
}

.catbtn__count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  border-radius: var(--r-pill);
  background: var(--onyx);
  color: var(--white);
  font-size: 10.5px;
  font-weight: 700;
}

.catbtn.is-on .catbtn__count {
  background: var(--onyx);
  color: var(--sprout);
}

.legend-btn {
  flex: none;
  display: grid;
  justify-items: center;
  gap: 3px;
  padding: 9px 4px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--fern);
  font-size: 10.5px;
  font-weight: 600;
}

.legend-btn:hover {
  color: var(--white);
  border-color: var(--line-2);
}

.carte-map {
  position: relative;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.carte-signal {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  min-height: 44px;
  padding: 0 16px;
  font-size: 14px;
}

.carte-legende {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 11px 13px;
  border-radius: var(--r-sm);
  background: var(--panel);
  border: 1px solid var(--line);
}

.carte-legende__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--fern);
}

.carte-legende__item i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: block;
}

.carte-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--r-sm);
  background: var(--panel);
  border: 1px solid var(--line);
}

.carte-strip__count {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--sprout);
  letter-spacing: -0.01em;
}

.carte-strip__count span {
  font-family: var(--font-ui);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--lichen);
}

.carte-credit {
  margin: 0;
  font-size: 11px;
  color: var(--lichen);
  text-align: center;
}
</style>