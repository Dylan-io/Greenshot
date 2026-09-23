<template>
  <div class="leaderboard-container">
    <div class="leaderboard-filters">
      <button 
        :class="['tab-btn', { active: villeFiltre === '' }]" 
        @click="changerVille('')"
      >
        🌍 Tout le Burundi
      </button>
      <button 
        :class="['tab-btn', { active: villeFiltre === 'Bujumbura' }]" 
        @click="changerVille('Bujumbura')"
      >
        Bujumbura
      </button>
      <button 
        :class="['tab-btn', { active: villeFiltre === 'Gitega' }]" 
        @click="changerVille('Gitega')"
      >
        Gitega
      </button>
    </div>

    <div v-if="chargement" class="loading-state">
      Chargement du classement citoyen...
    </div>

    <div v-else-if="classement.length === 0" class="empty-state">
      Aucun citoyen classé pour le moment dans cette zone.
    </div>

    <div v-else class="ranking-list">
      <div 
        v-for="(item, index) in classement" 
        :key="item.id || index" 
        :class="['rank-item', { 'top-three': index < 3 }]"
      >
        <div class="rank-pos">
          <span v-if="index === 0" class="medal">🥇</span>
          <span v-else-if="index === 1" class="medal">🥈</span>
          <span v-else-if="index === 2" class="medal">🥉</span>
          <span v-else class="rank-num">#{{ index + 1 }}</span>
        </div>

        <div class="rank-details">
          <div class="rank-user">
            <span class="user-name">{{ item.nom }}</span>
            <span class="user-city">📍 {{ item.ville || 'Burundi' }}</span>
          </div>
          
          <div class="score-breakdown">
            <span class="badge-pts sig" title="Points gagnés en signalant des problèmes">
              📸 {{ item.score_signalement || 0 }} pts
            </span>
            <span class="badge-pts clean" title="Points bonus gagnés en nettoyant des zones">
              🧹 {{ item.score_nettoyage || 0 }} pts
            </span>
          </div>
        </div>

        <div class="rank-total">
          <span class="total-pts">{{ item.score_total }}</span>
          <small>points</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabaseClient'

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
    } else {
      // Données de démonstration si backend vide
      chargerDonneesDemo()
    }
  } catch (err) {
    console.warn('RPC obtenir_classement indisponible, affichage démo:', err)
    chargerDonneesDemo()
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
.leaderboard-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
}

.leaderboard-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  overflow-x: auto;
}

.tab-btn {
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}

.tab-btn.active {
  background: #10B981;
  color: white;
  border-color: #10B981;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

.rank-item.top-three {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.rank-pos {
  width: 32px;
  text-align: center;
}

.medal {
  font-size: 1.25rem;
}

.rank-num {
  font-weight: 700;
  color: #64748b;
  font-size: 0.9rem;
}

.rank-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rank-user {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.user-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f172a;
}

.user-city {
  font-size: 0.75rem;
  color: #64748b;
}

.score-breakdown {
  display: flex;
  gap: 0.4rem;
}

.badge-pts {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.badge-pts.sig {
  background: #EBF4F9;
  color: #0369a1;
}

.badge-pts.clean {
  background: #FDF6EB;
  color: #b45309;
}

.rank-total {
  text-align: right;
}

.total-pts {
  display: block;
  font-size: 1.2rem;
  font-weight: 800;
  color: #10B981;
}

.rank-total small {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
}
</style>
