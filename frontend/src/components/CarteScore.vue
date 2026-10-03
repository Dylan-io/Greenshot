<template>
  <div>
    <div class="tabs" role="tablist" aria-label="Filtrer le classement par ville">
      <button
        v-for="v in villes"
        :key="v.id"
        type="button"
        role="tab"
        class="tab"
        :class="{ 'is-active': villeFiltre === v.id }"
        :aria-selected="villeFiltre === v.id"
        @click="changerVille(v.id)"
      >
        {{ v.label }}
      </button>
    </div>

    <p v-if="chargement" class="loading" role="status">Chargement du classement…</p>

    <EmptyState
      v-else-if="classement.length === 0"
      icon="trophy"
      title="Personne n'est encore classé ici"
      text="Le classement se remplit dès que des citoyens signalent ou nettoient. Faites la première action."
      action-label="Signaler un déchet"
      @action="$router.push('/signaler')"
    />

    <ul v-else class="rank-list">
      <li v-for="(item, index) in classement" :key="item.id || index" class="rank">
        <span class="rank__pos">
          <span v-if="index < 3" class="rank__medal" aria-hidden="true">{{ MEDAILLES[index] }}</span>
          <span v-else class="rank__num">{{ index + 1 }}</span>
        </span>

        <span class="rank__body">
          <span class="rank__name">{{ item.nom }}</span>
          <span class="rank__city">{{ item.ville || 'Burundi' }}</span>
          <span class="rank__pts">
            <span class="tag tag--sig">{{ item.score_signalement || 0 }} signalement</span>
            <span class="tag tag--clean">{{ item.score_nettoyage || 0 }} nettoyage</span>
          </span>
        </span>

        <span class="rank__total">
          <span class="rank__score">{{ item.score_total }}</span>
          <span class="rank__unit">pts</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabaseClient'
import EmptyState from './EmptyState.vue'

const MEDAILLES = ['🥇', '🥈', '🥉']
const villes = [
  { id: '', label: 'Tout le Burundi' },
  { id: 'Bujumbura', label: 'Bujumbura' },
  { id: 'Gitega', label: 'Gitega' }
]

const classement = ref([])
const chargement = ref(false)
const villeFiltre = ref('')

onMounted(async () => {
  await chargerClassement()
})

async function changerVille(v) {
  villeFiltre.value = v
  await chargerClassement()
}

async function chargerClassement() {
  chargement.value = true
  try {
    const { data, error } = await supabase.rpc('obtenir_classement', {
      p_ville: villeFiltre.value ? villeFiltre.value : null,
      p_limite: 30
    })

    if (error) throw error
    if (data && data.length > 0) {
      classement.value = data
    } else if (import.meta.env.DEV) {
      // Données de démonstration : UNIQUEMENT en développement local.
      // En production, un classement vide affiche l'état vide du template.
      // Greenshot vend de la donnée fiable à des bailleurs : afficher de
      // faux citoyens avec de faux scores en production serait trompeur.
      chargerDonneesDemo()
    }
  } catch (err) {
    console.warn('RPC obtenir_classement indisponible:', err)
    if (import.meta.env.DEV) chargerDonneesDemo()
  } finally {
    chargement.value = false
  }
}

function chargerDonneesDemo() {
  classement.value = [
    { id: '1', nom: 'Jean-Claude N.', ville: 'Bujumbura (Rohero)', score_signalement: 60, score_nettoyage: 240, score_total: 300 },
    { id: '2', nom: 'Belyse I.', ville: 'Bujumbura (Kinindo)', score_signalement: 50, score_nettoyage: 180, score_total: 230 },
    { id: '3', nom: 'Alain K.', ville: 'Gitega', score_signalement: 40, score_nettoyage: 120, score_total: 160 },
    { id: '4', nom: 'Christa M.', ville: 'Bujumbura (Kigobe)', score_signalement: 30, score_nettoyage: 90, score_total: 120 },
    { id: '5', nom: 'Fabrice N.', ville: 'Ngozi', score_signalement: 30, score_nettoyage: 60, score_total: 90 }
  ]
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex: none;
  min-height: 40px;
  padding: 0 15px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--fern);
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background var(--dur-1) var(--ease-out),
    color var(--dur-1) var(--ease-out),
    border-color var(--dur-1) var(--ease-out);
}

.tab:hover {
  color: var(--white);
  border-color: var(--line-2);
}

.tab.is-active {
  background: var(--sprout);
  border-color: var(--sprout);
  color: var(--onyx);
}

.loading {
  margin: 0;
  font-size: 13.5px;
  color: var(--fern);
}

.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 11px;
}

.rank {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
  border-radius: var(--r-sm);
  background: var(--panel);
  border: 1px solid var(--line);
}

.rank__pos {
  width: 34px;
  flex: none;
  display: grid;
  place-items: center;
  font-size: 19px;
}

.rank__num {
  font-size: 13px;
  font-weight: 700;
  color: var(--lichen);
}

.rank__body {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 4px;
}

.rank__name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.005em;
}

.rank__city {
  font-size: 12.5px;
  color: var(--fern);
}

.rank__pts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

.tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  white-space: nowrap;
}

.tag--sig {
  background: rgba(104, 239, 63, 0.12);
  color: var(--sprout);
}

.tag--clean {
  background: rgba(242, 193, 78, 0.14);
  color: var(--amber);
}

.rank__total {
  flex: none;
  text-align: right;
  display: grid;
}

.rank__score {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: -0.01em;
  color: var(--sprout);
  line-height: 1.1;
}

.rank__unit {
  font-size: 11px;
  color: var(--lichen);
}
</style>