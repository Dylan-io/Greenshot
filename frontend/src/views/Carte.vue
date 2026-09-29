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
          <span class="chip-icon">{{ cat.icone || '📍' }}</span>
          <span class="chip-label">{{ cat.nom }}</span>
          <span class="chip-count">{{ compterSignalementsParCategorie(cat.id, cat.nom) }}</span>
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
        <div class="empty-icon">🌱</div>
        <div class="empty-text">
          <strong>Aucun signalement dans cette sélection</strong>
          <p>Soyez le premier à signaler un déchet dans cette zone !</p>
        </div>
        <router-link to="/signaler" class="btn-nouveau-signalement">
          📸 Signaler (+pts)
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
import { ref, onMounted, computed } from 'vue'
import { useSignalementStore } from '../stores/signalementStore'
import CarteInteractive from '../components/CarteInteractive.vue'

const store = useSignalementStore()

const categoriesSelectionnees = ref([])

onMounted(async () => {
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

.chips-scroll {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding: 4px 2px 8px;
  pointer-events: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.chips-scroll::-webkit-scrollbar {
  display: none;
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
