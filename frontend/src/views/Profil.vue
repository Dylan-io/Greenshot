<template>
  <div class="page-profil">
    <!-- En-tête du profil -->
    <div class="profile-card">
      <div class="profile-avatar">🌱</div>
      <div class="profile-main">
        <h2>{{ profile.nom || 'Citoyen Éco-Responsable' }}</h2>
        <p class="profile-location">📍 {{ profile.ville || 'Bujumbura, Burundi' }}</p>
      </div>

      <!-- Synthèse des Scores -->
      <div class="stats-grid">
        <div class="stat-box total">
          <span class="stat-val">{{ scoreTotal }}</span>
          <span class="stat-lbl">Points Totaux</span>
        </div>
        <div class="stat-box sig">
          <span class="stat-val">{{ profile.score_signalement || 0 }}</span>
          <span class="stat-lbl">Points Signalements (📸)</span>
        </div>
        <div class="stat-box clean">
          <span class="stat-val">{{ profile.score_nettoyage || 0 }}</span>
          <span class="stat-lbl">Points Nettoyages (🧹)</span>
        </div>
      </div>
    </div>

    <!-- Onglets Historique Personnel -->
    <div class="history-section">
      <div class="history-tabs">
        <button 
          :class="['history-tab', { active: ongletActif === 'mes-signalements' }]"
          @click="ongletActif = 'mes-signalements'"
        >
          📸 Mes Signalements ({{ mesSignalements.length }})
        </button>
        <button 
          :class="['history-tab', { active: ongletActif === 'mes-nettoyages' }]"
          @click="ongletActif = 'mes-nettoyages'"
        >
          🧹 Mes Nettoyages Réalisés ({{ mesNettoyages.length }})
        </button>
      </div>

      <!-- Liste Signalements -->
      <div v-if="ongletActif === 'mes-signalements'">
        <div v-if="mesSignalements.length === 0" class="empty-history">
          Vous n'avez pas encore fait de signalement.
        </div>
        <div v-else class="history-grid">
          <div 
            v-for="sig in mesSignalements" 
            :key="sig.id" 
            class="history-card"
            @click="router.push(`/signalement/${sig.id}`)"
          >
            <img :src="sig.photo_avant_url" alt="Photo" class="hist-img" />
            <div class="hist-info">
              <div class="hist-top">
                <span class="hist-cat">{{ sig.categories?.nom || 'Problème' }}</span>
                <BadgeStatut :statut="sig.statut" />
              </div>
              <p class="hist-loc">📍 {{ sig.ville }}</p>
              <small class="hist-date">{{ formaterDate(sig.created_at) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste Nettoyages -->
      <div v-else>
        <div v-if="mesNettoyages.length === 0" class="empty-history">
          Vous n'avez pas encore soumis de preuve de nettoyage. Rendez-vous sur la carte pour trouver un lieu à assainir !
        </div>
        <div v-else class="history-grid">
          <div 
            v-for="clean in mesNettoyages" 
            :key="clean.id" 
            class="history-card"
            @click="router.push(`/signalement/${clean.id}`)"
          >
            <img :src="clean.photo_apres_url || clean.photo_avant_url" alt="Photo" class="hist-img" />
            <div class="hist-info">
              <div class="hist-top">
                <span class="hist-cat">{{ clean.categories?.nom || 'Zone nettoyée' }}</span>
                <BadgeStatut :statut="clean.statut" />
              </div>
              <p class="hist-loc">📍 {{ clean.ville }}</p>
              <small class="hist-date">Nettoyé le {{ formaterDate(clean.date_nettoyage) }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'
import BadgeStatut from '../components/BadgeStatut.vue'

const router = useRouter()
const userStore = useUserStore()

const ongletActif = ref('mes-signalements')
const mesSignalements = ref([])
const mesNettoyages = ref([])

const profile = ref({
  nom: 'Dyllan N.',
  ville: 'Bujumbura, Burundi',
  score_signalement: 30,
  score_nettoyage: 90
})

const scoreTotal = computed(() => {
  return (profile.value.score_signalement || 0) + (profile.value.score_nettoyage || 0)
})

onMounted(async () => {
  await chargerProfil()
})

async function chargerProfil() {
  try {
    const userId = userStore.user?.id
    if (userId) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (prof) profile.value = prof

      const { data: sigs } = await supabase.from('signalements').select('*, categories(nom)').eq('user_id', userId)
      if (sigs) mesSignalements.value = sigs

      const { data: cleans } = await supabase.from('signalements').select('*, categories(nom)').eq('nettoye_par_user_id', userId)
      if (cleans) mesNettoyages.value = cleans
    } else {
      // Données de démonstration
      mesSignalements.value = [
        {
          id: 'sig-demo-1',
          categories: { nom: 'Déchets plastiques' },
          statut: 'nettoye',
          ville: 'Bujumbura (Rohero)',
          photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=400',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]
      mesNettoyages.value = [
        {
          id: 'clean-demo-1',
          categories: { nom: 'Décharge sauvage' },
          statut: 'nettoye',
          ville: 'Bujumbura (Buyenzi)',
          photo_apres_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=400',
          date_nettoyage: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }
  } catch (err) {
    console.warn('Erreur chargement profil:', err)
  }
}

function formaterDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<style scoped>
.page-profil {
  max-width: 680px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.profile-avatar {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.profile-main h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.profile-location {
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 0.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.stat-box {
  padding: 0.75rem;
  border-radius: 8px;
}

.stat-box.total {
  background: #ECFDF5;
  color: #065F46;
}

.stat-box.sig {
  background: #EFF6FF;
  color: #1E40AF;
}

.stat-box.clean {
  background: #FFFBEB;
  color: #92400E;
}

.stat-val {
  display: block;
  font-size: 1.4rem;
  font-weight: 800;
}

.stat-lbl {
  font-size: 0.75rem;
  font-weight: 600;
}

.history-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
}

.history-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.history-tab {
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
}

.history-tab.active {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.empty-history {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.history-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-card {
  display: flex;
  gap: 0.85rem;
  padding: 0.75rem;
  border: 1px solid #f1f5f9;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.history-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.hist-img {
  width: 75px;
  height: 75px;
  object-fit: cover;
  border-radius: 6px;
}

.hist-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hist-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hist-cat {
  font-weight: 700;
  font-size: 0.9rem;
  color: #0f172a;
}

.hist-loc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0.2rem 0;
}

.hist-date {
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
