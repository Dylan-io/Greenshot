<template>
  <div class="page-carte-wrapper">
    
    <!-- Barre de Filtres Flottante en haut de la carte -->
    <div class="floating-filters-container">
      <div class="chips-scroll" role="tablist" aria-label="Filtres par catégorie">
        
        <!-- Puce "Tous" -->
        <button 
          type="button"
          class="filter-chip"
          :class="{ 'chip-active': filtreTousActif }"
          @click="reinitialiserFiltres"
        >
          <span class="chip-label">Tous</span>
          <span class="chip-count">{{ signalementsBruts.length }}</span>
        </button>

        <!-- Puces par Catégorie -->
        <button 
          v-for="cat in categoriesDisponibles"
          :key="cat.id"
          type="button"
          class="filter-chip"
          :class="{ 'chip-active': categoriesSelectionnees.includes(cat.id) }"
          @click="basculerCategorie(cat.id)"
        >
          <span class="chip-icon"><Icone :nom="cat.icone || 'localisation'" taille="15px" :trait="2.2" /></span>
          <span class="chip-label">{{ cat.nom }}</span>
          <span class="chip-count">{{ compterSignalementsParCategorie(cat.id, cat.nom) }}</span>
        </button>

      </div>
      <div class="map-sync-status" aria-live="polite">
        <span class="sync-dot" :class="{ live: realtimeActif }"></span>
        <span>{{ realtimeActif ? 'Signalements en temps réel' : 'Actualisation automatique chaque minute' }}</span>
        <button type="button" class="map-refresh-button" :disabled="store.chargementSignalements" @click="rafraichirSignalements">
          Actualiser
        </button>
      </div>
    </div>

    <!-- Indicateur de chargement discret (Skeleton / Toast flottant) -->
    <transition name="fade">
      <div v-if="store.chargementSignalements" class="floating-loading-indicator">
        <div class="spinner-small"></div>
        <span>Actualisation des signalements...</span>
      </div>
    </transition>

    <!-- Message d'état vide encourageant -->
    <transition name="fade">
      <div v-if="!store.chargementSignalements && signalementsFiltres.length === 0" class="empty-state-floating">
        <div class="empty-icon"><Icone nom="feuille" /></div>
        <div class="empty-text">
          <strong>Aucun signalement dans cette sélection</strong>
          <p>Soyez le premier à signaler un déchet dans cette zone !</p>
        </div>
        <router-link to="/signaler" class="btn-nouveau-signalement">
          <Icone nom="image" /> Signaler (+pts)
        </router-link>
      </div>
    </transition>

    <!-- Composant Carte Interactive Leaflet + CARTO Voyager -->
    <CarteInteractive 
      :signalements="signalementsFiltres"
      :user-position="positionUtilisateur"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSignalementStore } from '../stores/signalementStore'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import CarteInteractive from '../components/CarteInteractive.vue'
import Icone from '../components/Icone.vue'

const store = useSignalementStore()

const categoriesSelectionnees = ref([])
const realtimeActif = ref(false)
let realtimeChannel = null
let refreshInterval = null
let refreshTimeout = null

onMounted(async () => {
  if (supabaseConfigured) {
    realtimeChannel = supabase
      .channel('greenshot-carte-signalements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'signalements'
      }, () => {
        clearTimeout(refreshTimeout)
        refreshTimeout = setTimeout(rafraichirSignalements, 250)
      })
      .subscribe((status) => {
        realtimeActif.value = status === 'SUBSCRIBED'
      })
  }

  refreshInterval = setInterval(() => {
    if (!realtimeActif.value && !store.chargementSignalements) {
      rafraichirSignalements()
    }
  }, 60000)

  // 1. Charger les catégories si pas encore fait
  if (!store.categoriesChargees) {
    await store.chargerCategories()
  }

  // 2. Charger les signalements depuis Supabase (avec fallback de qualité)
  await store.chargerTousLesSignalements()

  // 3. Détecter la position utilisateur si non disponible
  if (store.latitude === null) {
    store.capturerGeolocalisation()
  }
})

onUnmounted(() => {
  clearInterval(refreshInterval)
  clearTimeout(refreshTimeout)
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

function rafraichirSignalements() {
  if (!store.chargementSignalements) return store.chargerTousLesSignalements()
}

const signalementsBruts = computed(() => {
  return store.listeSignalements || []
})

const categoriesDisponibles = computed(() => {
  return store.categories || []
})

const filtreTousActif = computed(() => {
  return categoriesSelectionnees.value.length === 0
})

const positionUtilisateur = computed(() => {
  if (store.latitude !== null && store.longitude !== null) {
    return {
      latitude: store.latitude,
      longitude: store.longitude
    }
  }
  return null
})

// Filtrage réactif des signalements avec transitions
const signalementsFiltres = computed(() => {
  if (categoriesSelectionnees.value.length === 0) {
    return signalementsBruts.value
  }

  return signalementsBruts.value.filter((sig) => {
    const catId = sig.categorie_id || sig.categories?.id
    const catNom = sig.categories?.nom

    return categoriesSelectionnees.value.some((selectedId) => {
      if (catId === selectedId) return true
      // Correspondance par nom pour résilience
      const catObj = categoriesDisponibles.value.find(c => c.id === selectedId)
      if (catObj && catNom && catNom.toLowerCase() === catObj.nom.toLowerCase()) return true
      return false
    })
  })
})

function reinitialiserFiltres() {
  categoriesSelectionnees.value = []
}

function basculerCategorie(id) {
  const index = categoriesSelectionnees.value.indexOf(id)
  if (index > -1) {
    categoriesSelectionnees.value.splice(index, 1)
  } else {
    categoriesSelectionnees.value.push(id)
  }
}

function compterSignalementsParCategorie(catId, catNom) {
  return signalementsBruts.value.filter((sig) => {
    const sCatId = sig.categorie_id || sig.categories?.id
    const sCatNom = sig.categories?.nom
    return sCatId === catId || (catNom && sCatNom && sCatNom.toLowerCase() === catNom.toLowerCase())
  }).length
}
</script>

<style scoped>
.page-carte-wrapper {
  position: relative;
  width: 100%;
  /* Hauteur optimisée plein écran sans marges superflues */
  height: calc(100vh - 54px - 62px);
  margin: -1rem -1rem 0 -1rem;
  overflow: hidden;
}

@media (min-width: 481px) {
  .page-carte-wrapper {
    height: calc(100vh - 58px - 64px);
    margin: -1.25rem -1rem 0 -1rem;
  }
}

/* Filtres Flottants Horizontaux */
.floating-filters-container {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  z-index: 500;
  padding: 0 10px;
  pointer-events: none;
}

.map-sync-status {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  max-width: 100%;
  margin: 0.15rem 0 0 0.65rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.96);
  color: #475569;
  font-size: 0.72rem;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
  /* le conteneur parent désactive les événements : on les rétablit ici */
  pointer-events: auto;
}

.sync-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #f59e0b;
}

.sync-dot.live {
  background: #16a34a;
  box-shadow: 0 0 0 3px #dcfce7;
}

.map-refresh-button {
  padding: 0.2rem 0.4rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: white;
  color: #334155;
  font-size: 0.7rem;
  cursor: pointer;
}

.map-refresh-button:disabled {
  opacity: 0.55;
  cursor: wait;
}

.chips-scroll {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 2px 8px;
  pointer-events: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(31, 77, 58, 0.3) transparent;
}

.chips-scroll::-webkit-scrollbar {
  height: 5px;
}

.chips-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.chips-scroll::-webkit-scrollbar-thumb {
  background: rgba(31, 77, 58, 0.3);
  border-radius: 9999px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border: 1.5px solid var(--color-border, #E5E9E2);
  border-radius: var(--radius-full, 9999px);
  padding: 0.35rem 0.75rem;
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text, #0F172A);
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  scroll-snap-align: start;
}

.filter-chip:hover {
  background: #FFFFFF;
  border-color: #CBD5E1;
}

.filter-chip.chip-active {
  background-color: var(--color-primary, #1F4D3A);
  border-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  box-shadow: 0 4px 10px rgba(31, 77, 58, 0.28);
}

.chip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  font-size: 0.85rem;
}


.chip-count {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
}

.filter-chip.chip-active .chip-count {
  background: rgba(255, 255, 255, 0.25);
  color: #FFFFFF;
}

/* Indicateur de chargement flottant */
.floating-loading-indicator {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  background: rgba(31, 77, 58, 0.9);
  color: #FFFFFF;
  backdrop-filter: blur(6px);
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.spinner-small {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* État vide flottant */
.empty-state-floating {
  position: absolute;
  top: 70px;
  left: 16px;
  right: 16px;
  z-index: 500;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 420px;
  margin: 0 auto;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.empty-text {
  flex: 1;
  font-size: 0.78rem;
  color: var(--color-text, #0F172A);
  line-height: 1.25;
}

.empty-text strong {
  display: block;
  font-family: var(--font-title);
  font-size: 0.82rem;
  margin-bottom: 2px;
}

.empty-text p {
  color: var(--color-text-muted);
  margin: 0;
}

.btn-nouveau-signalement {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  text-decoration: none;
  font-family: var(--font-title);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  white-space: nowrap;
  transition: background 0.15s ease;
}

.btn-nouveau-signalement:hover {
  background: var(--color-primary-hover, #163a2c);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
