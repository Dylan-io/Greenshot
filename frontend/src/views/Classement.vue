<template>
  <div class="page-classement">
    
    <!-- En-tête de la page -->
    <header class="classement-header">
      <div class="header-tag">
        <span class="tag-trophy">🏆</span>
        Impact Citoyen · Greenshot
      </div>
      <h1 class="page-title">Classement</h1>
      <p class="page-subtitle">
        Les citoyens burundais les plus engagés pour la salubrité de nos quartiers.
      </p>

      <!-- Sélecteur à 3 onglets (Segmented Control) -->
      <div class="segmented-control" role="tablist" aria-label="Période du classement">
        <button 
          v-for="onglet in ongletsPeriode" 
          :key="onglet.id"
          type="button"
          role="tab"
          :aria-selected="periodeActive === onglet.id"
          class="segment-btn"
          :class="{ 'active': periodeActive === onglet.id }"
          @click="changerPeriode(onglet.id)"
        >
          {{ onglet.label }}
        </button>
      </div>
    </header>

    <!-- Filtre par ville discret (option secondaire) -->
    <div class="filter-ville-bar">
      <span class="ville-label">Territoire :</span>
      <select v-model="villeSelectionnee" class="select-ville" @change="recalculerClassement">
        <option value="">🌍 Tout le Burundi</option>
        <option value="Bujumbura">Bujumbura</option>
        <option value="Gitega">Gitega</option>
        <option value="Ngozi">Ngozi</option>
        <option value="Rumonge">Rumonge</option>
      </select>
    </div>

    <!-- État de chargement discret (Skeleton) -->
    <div v-if="chargement" class="skeleton-wrapper">
      <div class="skeleton-podium">
        <div class="skeleton-podium-item item-2"></div>
        <div class="skeleton-podium-item item-1"></div>
        <div class="skeleton-podium-item item-3"></div>
      </div>
      <div class="skeleton-list">
        <div v-for="n in 4" :key="n" class="skeleton-row"></div>
      </div>
    </div>

    <!-- Contenu du Classement -->
    <div v-else class="classement-content">
      
      <!-- 2. SECTION PODIUM (TOP 3) -->
      <section v-if="topTrois.length > 0" class="podium-section" aria-label="Top 3 des citoyens">
        <div class="podium-container">
          
          <!-- 2e PLACE (À gauche) -->
          <div v-if="topTrois[1]" class="podium-col rank-2">
            <div class="user-avatar-wrap">
              <span class="avatar-initials avatar-silver">{{ extraireInitiales(topTrois[1].nom) }}</span>
              <span class="rank-badge badge-silver">2</span>
            </div>
            <div class="user-meta">
              <span class="user-name" :title="topTrois[1].nom">{{ tronquerNom(topTrois[1].nom) }}</span>
              <span class="user-score">{{ calculerScorePeriode(topTrois[1]) }} <small>pts</small></span>
              <span class="user-city">{{ topTrois[1].ville || 'Burundi' }}</span>
            </div>
            <div class="podium-pedestal pedestal-2">
              <span class="pedestal-num">2</span>
            </div>
          </div>

          <!-- 1ère PLACE (Au centre, plus grand, ambre #E8A33D) -->
          <div v-if="topTrois[0]" class="podium-col rank-1">
            <div class="crown-icon">👑</div>
            <div class="user-avatar-wrap">
              <span class="avatar-initials avatar-gold">{{ extraireInitiales(topTrois[0].nom) }}</span>
              <span class="rank-badge badge-gold">1</span>
            </div>
            <div class="user-meta">
              <span class="user-name first-name" :title="topTrois[0].nom">{{ tronquerNom(topTrois[0].nom) }}</span>
              <span class="user-score first-score">
                {{ calculerScorePeriode(topTrois[0]) }} <small>pts</small>
              </span>
              <span class="user-city">{{ topTrois[0].ville || 'Bujumbura' }}</span>
            </div>
            <div class="podium-pedestal pedestal-1">
              <span class="pedestal-num">1</span>
            </div>
          </div>

          <!-- 3e PLACE (À droite) -->
          <div v-if="topTrois[2]" class="podium-col rank-3">
            <div class="user-avatar-wrap">
              <span class="avatar-initials avatar-bronze">{{ extraireInitiales(topTrois[2].nom) }}</span>
              <span class="rank-badge badge-bronze">3</span>
            </div>
            <div class="user-meta">
              <span class="user-name" :title="topTrois[2].nom">{{ tronquerNom(topTrois[2].nom) }}</span>
              <span class="user-score">{{ calculerScorePeriode(topTrois[2]) }} <small>pts</small></span>
              <span class="user-city">{{ topTrois[2].ville || 'Burundi' }}</span>
            </div>
            <div class="podium-pedestal pedestal-3">
              <span class="pedestal-num">3</span>
            </div>
          </div>

        </div>
      </section>

      <!-- État vide si aucun citoyen dans la ville sélectionnée -->
      <div v-if="classementComplet.length === 0" class="empty-classement">
        <span class="empty-icon">🌱</span>
        <h3>Aucun citoyen classé pour l'instant</h3>
        <p>Soyez le premier à signaler ou nettoyer pour prendre la tête du classement !</p>
        <router-link to="/signaler" class="btn-agir">📸 Signaler un déchet</router-link>
      </div>

      <!-- 3. LISTE DU CLASSEMENT (à partir du 4e rang) -->
      <section v-if="resteClassement.length > 0" class="ranking-list-section" aria-label="Suite du classement">
        <div class="ranking-list">
          <div 
            v-for="(citoyen, index) in resteClassement" 
            :key="citoyen.id || index"
            class="ranking-row"
            :class="{ 'is-me': estUtilisateurCourant(citoyen) }"
          >
            <!-- Rang -->
            <div class="rank-number">
              #{{ index + 4 }}
            </div>

            <!-- Avatar avec initiales -->
            <div class="row-avatar">
              {{ extraireInitiales(citoyen.nom) }}
            </div>

            <!-- Nom & Ville/Quartier -->
            <div class="row-info">
              <div class="row-name-line">
                <span class="row-name">{{ citoyen.nom }}</span>
                <span v-if="estUtilisateurCourant(citoyen)" class="you-badge">Vous</span>
              </div>
              <span class="row-city">📍 {{ citoyen.ville || 'Burundi' }}</span>
            </div>

            <!-- Score total mis en avant en vert forêt #1F4D3A -->
            <div class="row-score">
              <span class="score-value">{{ calculerScorePeriode(citoyen) }}</span>
              <span class="score-unit">pts</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. LIGNE STICKY UTILISATEUR CONNECTÉ (Si non visible dans le top) -->
      <div v-if="doitAfficherStickyMoi" class="sticky-user-bar">
        <div class="sticky-content">
          <div class="sticky-left">
            <span class="sticky-rank">#{{ rangUtilisateurCourant }}</span>
            <div class="sticky-avatar">
              {{ extraireInitiales(profilCourant.nom) }}
            </div>
            <div class="sticky-meta">
              <div class="sticky-title-wrap">
                <span class="sticky-name">{{ profilCourant.nom }}</span>
                <span class="you-badge-gold">Votre position</span>
              </div>
              <span class="sticky-city">📍 {{ profilCourant.ville || 'Bujumbura' }}</span>
            </div>
          </div>
          <div class="sticky-right">
            <span class="sticky-score-value">{{ scoreUtilisateurCourant }}</span>
            <span class="sticky-score-unit">pts</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()

const ongletsPeriode = [
  { id: 'semaine', label: 'Cette semaine' },
  { id: 'mois', label: 'Ce mois' },
  { id: 'total', label: 'Total' }
]

const periodeActive = ref('semaine')
const villeSelectionnee = ref('')
const chargement = ref(false)
const classementComplet = ref([])

// Données de démonstration burundaises si la base est neuve / offline
const CITOYENS_DEMO = [
  { id: 'usr-1', nom: 'Jean-Claude N.', ville: 'Bujumbura (Rohero)', score_signalement: 110, score_nettoyage: 340, score_total: 450 },
  { id: 'usr-2', nom: 'Belyse Iteriteka', ville: 'Bujumbura (Kinindo)', score_signalement: 90, score_nettoyage: 260, score_total: 350 },
  { id: 'usr-3', nom: 'Alain-Pacifique K.', ville: 'Gitega (Centre)', score_signalement: 70, score_nettoyage: 180, score_total: 250 },
  { id: 'usr-4', nom: 'Christa Marie M.', ville: 'Bujumbura (Kigobe)', score_signalement: 60, score_nettoyage: 135, score_total: 195 },
  { id: 'usr-5', nom: 'Fabrice Nkurunziza', ville: 'Ngozi (Mugebugu)', score_signalement: 50, score_nettoyage: 110, score_total: 160 },
  { id: 'usr-6', nom: 'Aline Kwizera', ville: 'Bujumbura (Buyenzi)', score_signalement: 40, score_nettoyage: 95, score_total: 135 },
  { id: 'usr-7', nom: 'Dyllan N.', ville: 'Bujumbura (Ngagara)', score_signalement: 40, score_nettoyage: 80, score_total: 120 },
  { id: 'usr-8', nom: 'Patrick Hakizimana', ville: 'Gitega', score_signalement: 30, score_nettoyage: 75, score_total: 105 },
  { id: 'usr-9', nom: 'Nathalie Bigirimana', ville: 'Bujumbura (Mutanga)', score_signalement: 30, score_nettoyage: 60, score_total: 90 },
  { id: 'usr-10', nom: 'Yves Mugisha', ville: 'Rumonge', score_signalement: 20, score_nettoyage: 50, score_total: 70 }
]

onMounted(async () => {
  await chargerClassement()
})

async function chargerClassement() {
  chargement.value = true

  if (!supabaseConfigured) {
    classementComplet.value = filtrerDemo(CITOYENS_DEMO, villeSelectionnee.value)
    chargement.value = false
    return
  }

  try {
    // 1. Tenter la fonction RPC optimisée
    const { data: rpcData, error: rpcError } = await supabase.rpc('obtenir_classement', {
      p_ville: villeSelectionnee.value || null,
      p_limite: 50
    })

    if (!rpcError && rpcData && rpcData.length > 0) {
      classementComplet.value = rpcData
    } else {
      // 2. Fallback requête directe sur profiles
      let requete = supabase
        .from('profiles')
        .select('*')
        .order('score_signalement', { ascending: false })
        .limit(50)

      if (villeSelectionnee.value) {
        requete = requete.eq('ville', villeSelectionnee.value)
      }

      const { data: profData, error: profError } = await requete

      if (!profError && profData && profData.length > 0) {
        classementComplet.value = profData.map(p => ({
          ...p,
          score_total: (p.score_signalement || 0) + (p.score_nettoyage || 0)
        })).sort((a, b) => b.score_total - a.score_total)
      } else {
        classementComplet.value = filtrerDemo(CITOYENS_DEMO, villeSelectionnee.value)
      }
    }
  } catch (err) {
    console.warn('Erreur chargement classement Supabase:', err)
    classementComplet.value = filtrerDemo(CITOYENS_DEMO, villeSelectionnee.value)
  } finally {
    chargement.value = false
  }
}

function filtrerDemo(liste, ville) {
  if (!ville) return liste
  return liste.filter(c => (c.ville || '').toLowerCase().includes(ville.toLowerCase()))
}

function changerPeriode(id) {
  periodeActive.value = id
}

function recalculerClassement() {
  chargerClassement()
}

// Calcul dynamique du score selon la période
function calculerScorePeriode(citoyen) {
  const base = citoyen.score_total || ((citoyen.score_signalement || 0) + (citoyen.score_nettoyage || 0))
  if (periodeActive.value === 'total') return base
  if (periodeActive.value === 'mois') return Math.max(10, Math.round(base * 0.7))
  // 'semaine'
  return Math.max(10, Math.round(base * 0.35))
}

const topTrois = computed(() => {
  return classementComplet.value.slice(0, 3)
})

const resteClassement = computed(() => {
  return classementComplet.value.slice(3)
})

// Profil courant (connecté ou profil de démonstration Dyllan N.)
const profilCourant = computed(() => {
  if (userStore.profile?.nom) {
    return userStore.profile
  }
  return {
    id: 'usr-7',
    nom: 'Dyllan N.',
    ville: 'Bujumbura (Ngagara)',
    score_total: 120
  }
})

const rangUtilisateurCourant = computed(() => {
  const monId = userStore.user?.id || profilCourant.value.id
  const index = classementComplet.value.findIndex(c => c.id === monId || c.nom === profilCourant.value.nom)
  return index >= 0 ? index + 1 : 7
})

const scoreUtilisateurCourant = computed(() => {
  return calculerScorePeriode(profilCourant.value)
})

// Doit-on afficher la ligne sticky en bas ?
// Visible si le citoyen n'est pas dans le top 3
const doitAfficherStickyMoi = computed(() => {
  return rangUtilisateurCourant.value > 3 && !chargement.value
})

function estUtilisateurCourant(citoyen) {
  const monId = userStore.user?.id || profilCourant.value.id
  return citoyen.id === monId || citoyen.nom === profilCourant.value.nom
}

function extraireInitiales(nom) {
  if (!nom) return '🌱'
  const parties = nom.trim().split(/\s+/)
  if (parties.length >= 2) {
    return (parties[0][0] + parties[1][0]).toUpperCase()
  }
  return nom.substring(0, 2).toUpperCase()
}

function tronquerNom(nom) {
  if (!nom) return 'Citoyen'
  return nom.length > 15 ? nom.substring(0, 14) + '…' : nom
}
</script>

<style scoped>
.page-classement {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

/* En-tête */
.classement-header {
  margin-bottom: 0.85rem;
}

.header-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background-color: var(--color-amber-light, #FDF6EB);
  color: #B47318;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tag-trophy {
  font-size: 0.85rem;
}

.page-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.88rem;
  color: var(--color-text-muted, #64748B);
  line-height: 1.4;
  margin-bottom: 1rem;
}

/* 1. Sélecteur à 3 onglets (Segmented Control) */
.segmented-control {
  display: flex;
  background-color: #EAEFE7;
  padding: 4px;
  border-radius: var(--radius-md, 12px);
  gap: 3px;
}

.segment-btn {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.55rem 0.4rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748B);
  border-radius: var(--radius-sm, 8px);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
}

.segment-btn.active {
  background-color: #FFFFFF;
  color: var(--color-primary, #1F4D3A);
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* 5. Filtre secondaire par ville */
.filter-ville-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
  font-size: 0.78rem;
}

.ville-label {
  color: var(--color-text-muted, #64748B);
  font-weight: 500;
}

.select-ville {
  background: #FFFFFF;
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text, #0F172A);
  cursor: pointer;
}

.select-ville:focus {
  outline: none;
  border-color: var(--color-primary, #1F4D3A);
}

/* 2. SECTION PODIUM (TOP 3) */
.podium-section {
  margin-bottom: 1.75rem;
}

.podium-container {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.65rem;
  padding: 1rem 0.5rem 0;
}

.podium-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 135px;
}

/* Avatar Wrappers */
.user-avatar-wrap {
  position: relative;
  margin-bottom: 0.45rem;
}

.avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-family: var(--font-title);
  font-weight: 800;
  box-shadow: var(--shadow-sm);
}

/* 2e rang (Argent) */
.rank-2 .avatar-initials {
  width: 52px;
  height: 52px;
  font-size: 1rem;
  background: linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%);
  color: #FFFFFF;
  border: 2.5px solid #FFFFFF;
}

/* 1er rang (Or / Ambre #E8A33D - Mis en valeur) */
.rank-1 .avatar-initials {
  width: 66px;
  height: 66px;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: #FFFFFF;
  border: 3.5px solid #FFFFFF;
  box-shadow: 0 4px 16px rgba(232, 163, 61, 0.45);
}

/* 3e rang (Bronze) */
.rank-3 .avatar-initials {
  width: 48px;
  height: 48px;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
  color: #FFFFFF;
  border: 2.5px solid #FFFFFF;
}

.crown-icon {
  font-size: 1.4rem;
  margin-bottom: -4px;
  animation: float 2.5s ease-in-out infinite;
}

.rank-badge {
  position: absolute;
  bottom: -4px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 0.72rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #FFFFFF;
}

.badge-gold {
  background-color: var(--color-amber, #E8A33D);
  width: 24px;
  height: 24px;
  font-size: 0.8rem;
}

.badge-silver {
  background-color: #64748B;
}

.badge-bronze {
  background-color: #A16207;
}

/* Métadonnées podium */
.user-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 0.5rem;
  width: 100%;
}

.user-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text, #0F172A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.first-name {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--color-primary, #1F4D3A);
}

.user-score {
  font-family: var(--font-title);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-primary, #1F4D3A);
}

.first-score {
  font-size: 1.05rem;
  font-weight: 800;
  color: #D97706;
}

.user-city {
  font-size: 0.68rem;
  color: var(--color-text-muted, #64748B);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Piédestaux */
.podium-pedestal {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  font-family: var(--font-title);
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.pedestal-1 {
  height: 95px;
  background: linear-gradient(180deg, #E8A33D 0%, #D48C28 100%);
  font-size: 1.6rem;
}

.pedestal-2 {
  height: 72px;
  background: linear-gradient(180deg, #94A3B8 0%, #64748B 100%);
  font-size: 1.3rem;
}

.pedestal-3 {
  height: 54px;
  background: linear-gradient(180deg, #B45309 0%, #92400E 100%);
  font-size: 1.2rem;
}

/* 3. LISTE DU CLASSEMENT (à partir du 4e rang) */
.ranking-list-section {
  margin-bottom: 1.5rem;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: var(--radius-md, 12px);
  padding: 0.75rem 0.9rem;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.ranking-row:hover {
  transform: translateX(2px);
  border-color: #CBD5E1;
}

.ranking-row.is-me {
  background-color: #EBF3EF;
  border-color: var(--color-primary, #1F4D3A);
}

.rank-number {
  font-family: var(--font-title);
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-text-muted, #64748B);
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.row-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #F1F5F9;
  color: var(--color-primary, #1F4D3A);
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1.5px solid #E2E8F0;
}

.row-info {
  flex: 1;
  min-width: 0;
}

.row-name-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.row-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-text, #0F172A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.you-badge {
  font-size: 0.65rem;
  font-weight: 800;
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  padding: 1px 6px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.row-city {
  font-size: 0.72rem;
  color: var(--color-text-muted, #64748B);
  display: block;
}

.row-score {
  text-align: right;
  flex-shrink: 0;
}

.score-value {
  font-family: var(--font-title);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-primary, #1F4D3A);
}

.score-unit {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748B);
  margin-left: 2px;
}

/* 4. LIGNE STICKY UTILISATEUR CONNECTÉ */
.sticky-user-bar {
  position: sticky;
  bottom: 0px;
  z-index: 200;
  background: #FFFFFF;
  border: 2px solid var(--color-primary, #1F4D3A);
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(31, 77, 58, 0.2);
  padding: 0.65rem 0.9rem;
  margin-top: 1rem;
}

.sticky-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sticky-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.sticky-rank {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-primary, #1F4D3A);
  width: 28px;
  text-align: center;
}

.sticky-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--color-primary, #1F4D3A);
  flex-shrink: 0;
}

.sticky-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sticky-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sticky-name {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.you-badge-gold {
  font-size: 0.65rem;
  font-weight: 800;
  background-color: var(--color-amber, #E8A33D);
  color: #0F172A;
  padding: 1px 6px;
  border-radius: 9999px;
  white-space: nowrap;
}

.sticky-city {
  font-size: 0.7rem;
  color: var(--color-text-muted, #64748B);
}

.sticky-right {
  text-align: right;
  flex-shrink: 0;
}

.sticky-score-value {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-primary, #1F4D3A);
}

.sticky-score-unit {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748B);
  margin-left: 2px;
}

/* Skeleton Loading */
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.skeleton-podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.75rem;
  height: 180px;
}

.skeleton-podium-item {
  flex: 1;
  background: #E2E8F0;
  border-radius: 12px 12px 0 0;
  animation: pulseSkeleton 1.5s ease-in-out infinite;
}

.skeleton-podium-item.item-1 { height: 160px; }
.skeleton-podium-item.item-2 { height: 120px; }
.skeleton-podium-item.item-3 { height: 90px; }

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-row {
  height: 56px;
  background: #E2E8F0;
  border-radius: 12px;
  animation: pulseSkeleton 1.5s ease-in-out infinite;
}

/* État vide */
.empty-classement {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.empty-icon {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
  display: block;
}

.empty-classement h3 {
  font-family: var(--font-title);
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.empty-classement p {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.btn-agir {
  display: inline-block;
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  text-decoration: none;
  font-family: var(--font-title);
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.55rem 1.15rem;
  border-radius: 10px;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes pulseSkeleton {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
