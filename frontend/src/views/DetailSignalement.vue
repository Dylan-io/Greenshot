<template>
  <div class="page-detail-signalement">
    <div class="detail-header">
      <router-link to="/carte" class="back-link">← Retour à la carte</router-link>
      <BadgeStatut :statut="signalement?.statut || 'en_attente'" />
    </div>

    <div v-if="chargement" class="loading-state">
      Chargement des informations du signalement...
    </div>

    <div v-else-if="!signalement" class="error-state">
      Signalement introuvable.
    </div>

    <div v-else class="detail-content">
      <!-- Photos Avant / Après -->
      <div class="photos-container">
        <div class="photo-card">
          <span class="photo-badge avant">📸 Photo Initiale (Avant)</span>
          <img :src="signalement.photo_avant_url" alt="Photo avant" class="main-photo" />
        </div>

        <div v-if="signalement.photo_apres_url" class="photo-card">
          <span class="photo-badge apres">✨ Preuve de Nettoyage (Après)</span>
          <img :src="signalement.photo_apres_url" alt="Photo après nettoyage" class="main-photo" />
        </div>
      </div>

      <!-- Action Nettoyage si non encore nettoyé -->
      <div v-if="signalement.statut === 'en_attente' || signalement.statut === 'vu'" class="cleanup-cta">
        <div class="cta-text">
          <strong>Cette zone a besoin d'un citoyen engagé !</strong>
          <p>Nettoyez cet endroit, soumettez votre photo après et gagnez des points bonus.</p>
        </div>
        <router-link :to="{ path: '/nettoyage', query: { id: signalement.id } }" class="btn-clean-now">
          Nettoyer cette zone 🧹
        </router-link>
      </div>

      <!-- Informations Générales -->
      <div class="info-card">
        <h3>{{ signalement.categories?.nom || 'Atteinte environnementale' }}</h3>
        <p class="info-location">📍 {{ signalement.ville || 'Bujumbura' }}</p>
        
        <p v-if="signalement.description" class="info-description">
          "{{ signalement.description }}"
        </p>

        <div class="actors-grid">
          <div class="actor-box">
            <span class="actor-role">Signalé par :</span>
            <span class="actor-name">{{ signalement.profiles?.nom || 'Citoyen anonyme' }}</span>
          </div>

          <div v-if="signalement.nettoye_par_user_id" class="actor-box cleaner">
            <span class="actor-role">Nettoyé par :</span>
            <span class="actor-name">{{ signalement.nettoyeur?.nom || 'Héros citoyen' }}</span>
            <small v-if="signalement.date_nettoyage">Le {{ formaterDate(signalement.date_nettoyage) }}</small>
          </div>
        </div>
      </div>

      <!-- Timeline des Statuts (statuts_historique) -->
      <div class="timeline-card">
        <h4>Historique et suivi du traitement</h4>
        <div class="timeline">
          <div 
            v-for="(hist, idx) in historique" 
            :key="hist.id || idx" 
            class="timeline-item"
          >
            <div class="timeline-dot"></div>
            <div class="timeline-info">
              <span class="timeline-status">{{ getLabelStatut(hist.nouveau_statut) }}</span>
              <span class="timeline-date">{{ formaterDate(hist.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../services/supabaseClient'
import BadgeStatut from '../components/BadgeStatut.vue'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const route = useRoute()
const signalementId = props.id || route.params.id

const signalement = ref(null)
const historique = ref([])
const chargement = ref(true)

onMounted(async () => {
  await chargerDetails()
})

async function chargerDetails() {
  chargement.value = true
  try {
    // 1. Récupération du signalement
    const { data, error } = await supabase
      .from('signalements')
      .select('*, categories(nom), profiles:user_id(nom), nettoyeur:nettoye_par_user_id(nom)')
      .eq('id', signalementId)
      .single()

    if (error) throw error
    signalement.value = data

    // 2. Récupération de l'historique des statuts
    const { data: histData } = await supabase
      .from('statuts_historique')
      .select('*')
      .eq('signalement_id', signalementId)
      .order('date', { ascending: true })

    historique.value = histData || []

    if (historique.value.length === 0 && data) {
      historique.value = [
        { nouveau_statut: 'en_attente', date: data.created_at }
      ]
      if (data.statut === 'nettoye' && data.date_nettoyage) {
        historique.value.push({ nouveau_statut: 'nettoye', date: data.date_nettoyage })
      }
    }
  } catch (err) {
    console.warn('Erreur chargement signalement, fallback démo:', err)
    signalement.value = {
      id: signalementId,
      statut: 'en_attente',
      ville: 'Bujumbura (Centre)',
      photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600',
      photo_apres_url: null,
      description: 'Accumulation de bouteilles en plastique et sachets non dégradables.',
      categories: { nom: 'Déchets plastiques' },
      profiles: { nom: 'Aline N.' },
      created_at: new Date().toISOString()
    }
    historique.value = [
      { nouveau_statut: 'en_attente', date: new Date().toISOString() }
    ]
  } finally {
    chargement.value = false
  }
}

function getLabelStatut(statut) {
  const map = {
    'en_attente': 'Signalement créé (En attente)',
    'vu': 'Signalement pris en compte (Vu)',
    'nettoye': 'Zone nettoyée par un citoyen',
    'traite': 'Validé et clôturé'
  }
  return map[statut] || statut
}

function formaterDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.page-detail-signalement {
  max-width: 680px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.back-link {
  text-decoration: none;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
}

.photos-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.photo-card {
  position: relative;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.photo-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 4px;
}

.photo-badge.avant {
  background: rgba(15, 23, 42, 0.8);
  color: white;
}

.photo-badge.apres {
  background: rgba(232, 163, 61, 0.95);
  color: white;
}

.main-photo {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.cleanup-cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #FFFBEB;
  border: 1px solid #FCD34D;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.cleanup-cta strong {
  color: #92400E;
  display: block;
  font-size: 0.95rem;
}

.cleanup-cta p {
  color: #78350F;
  font-size: 0.85rem;
  margin: 0;
}

.btn-clean-now {
  padding: 0.6rem 1rem;
  background: #E8A33D;
  color: white;
  text-decoration: none;
  font-weight: 700;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
}

.info-card, .timeline-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.info-card h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.info-location {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.info-description {
  font-style: italic;
  color: #334155;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.actors-grid {
  display: flex;
  gap: 1rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.75rem;
}

.actor-box {
  display: flex;
  flex-direction: column;
}

.actor-role {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 700;
}

.actor-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

/* Timeline */
.timeline-card h4 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-left: 2px solid #e2e8f0;
  padding-left: 1rem;
  margin-left: 0.5rem;
}

.timeline-item {
  position: relative;
}

.timeline-dot {
  position: absolute;
  left: -1.35rem;
  top: 0.2rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10B981;
  border: 2px solid white;
}

.timeline-status {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: #0f172a;
}

.timeline-date {
  font-size: 0.8rem;
  color: #64748b;
}
</style>
