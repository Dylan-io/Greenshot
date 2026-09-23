<template>
  <div class="page-carte">
    <div class="carte-header">
      <div>
        <h2>🗺️ Carte des Signalements</h2>
        <p class="subtitle">Explorez les signalements au Burundi et visualisez les zones assainies.</p>
      </div>

      <!-- Filtres par catégorie et par zone -->
      <div class="filters-bar">
        <select v-model="filtreCategorie" class="filter-select">
          <option value="">Toutes les catégories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.nom }}
          </option>
        </select>

        <select v-model="filtreStatut" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="vu">Vu / Confirmé</option>
          <option value="nettoye">Nettoyé</option>
          <option value="traite">Traité & Clôturé</option>
        </select>

        <select v-model="filtreVille" class="filter-select">
          <option value="">Toutes les villes</option>
          <option value="Bujumbura">Bujumbura</option>
          <option value="Gitega">Gitega</option>
          <option value="Ngozi">Ngozi</option>
        </select>
      </div>
    </div>

    <!-- Composant Carte Interactive Leaflet + CARTO -->
    <CarteInteractive 
      :signalements="signalementsFiltres" 
      @select-signalement="allerAuDetail"
      @nettoyer-signalement="allerAuNettoyage"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabaseClient'
import CarteInteractive from '../components/CarteInteractive.vue'

const router = useRouter()

const signalements = ref([])
const categories = ref([])
const filtreCategorie = ref('')
const filtreStatut = ref('')
const filtreVille = ref('')

onMounted(async () => {
  await Promise.all([
    chargerCategories(),
    chargerSignalements()
  ])
})

async function chargerCategories() {
  try {
    const { data } = await supabase.from('categories').select('*').order('nom')
    if (data && data.length > 0) {
      categories.value = data
    }
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
    if (data) {
      signalements.value = data
    }
  } catch (err) {
    console.warn('Supabase signalements non dispo (affichage démo Bujumbura si vide):', err)
    // Données de démonstration réalistes à Bujumbura si Supabase n'est pas encore connecté
    if (signalements.value.length === 0) {
      signalements.value = [
        {
          id: 'demo-1',
          latitude: -3.3822,
          longitude: 29.3644,
          statut: 'en_attente',
          ville: 'Bujumbura (Centre-ville)',
          categories: { nom: 'Déchets plastiques' },
          photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=500'
        },
        {
          id: 'demo-2',
          latitude: -3.3615,
          longitude: 29.3750,
          statut: 'nettoye',
          ville: 'Bujumbura (Buyenzi)',
          categories: { nom: 'Décharge sauvage' },
          photo_avant_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500'
        },
        {
          id: 'demo-3',
          latitude: -3.3950,
          longitude: 29.3520,
          statut: 'vu',
          ville: 'Bujumbura (Kigobe)',
          categories: { nom: 'Pollution eau' },
          photo_avant_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500'
        }
      ]
    }
  }
}

const signalementsFiltres = computed(() => {
  return signalements.value.filter((s) => {
    const matchCat = !filtreCategorie.value || s.categorie_id === filtreCategorie.value
    const matchStatut = !filtreStatut.value || s.statut === filtreStatut.value
    const matchVille = !filtreVille.value || s.ville === filtreVille.value
    return matchCat && matchStatut && matchVille
  })
})

function allerAuDetail(sig) {
  router.push(`/signalement/${sig.id}`)
}

function allerAuNettoyage(sig) {
  router.push({ path: '/nettoyage', query: { id: sig.id } })
}
</script>

<style scoped>
.page-carte {
  width: 100%;
}

.carte-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.2rem;
}

.filters-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: white;
  color: #334155;
  cursor: pointer;
}
</style>
