<template>
  <div class="page-detail-signalement">
    
    <!-- Barre supérieure de navigation avec retour -->
    <header class="detail-top-nav">
      <button type="button" class="btn-back" @click="retourEnArriere" aria-label="Retour">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" class="back-icon">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Retour</span>
      </button>

      <span class="nav-title">Détail du signalement</span>

      <!-- Badge de statut en haut à droite -->
      <span 
        v-if="signalement"
        class="top-status-badge"
        :style="{ 
          backgroundColor: confStatut.bgLight, 
          color: confStatut.color 
        }"
      >
        ● {{ confStatut.label }}
      </span>
      <div v-else style="width: 40px;"></div>
    </header>

    <!-- État de chargement discret (Skeleton) -->
    <div v-if="chargement" class="skeleton-detail">
      <div class="skeleton-photo"></div>
      <div class="skeleton-line title"></div>
      <div class="skeleton-line meta"></div>
      <div class="skeleton-timeline"></div>
    </div>

    <!-- État d'erreur si signalement introuvable -->
    <div v-else-if="!signalement" class="error-detail-state">
      <span class="error-icon">🔍</span>
      <h3>Signalement introuvable</h3>
      <p>Le signalement demandé n'existe pas ou a été supprimé.</p>
      <button type="button" class="btn-primary-return" @click="retourEnArriere">
        ← Retourner à la carte
      </button>
    </div>

    <!-- Contenu Principal -->
    <main v-else class="detail-main-content">
      
      <!-- 1. PHOTO PRINCIPALE (AVANT) & BADGES -->
      <section class="photo-hero-card">
        <div class="photo-wrapper">
          <img 
            :src="signalement.photo_avant_url || 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800'" 
            alt="Photo du problème environnemental" 
            class="hero-img"
          />
          <span class="photo-tag-badge">📸 Photo Avant</span>
        </div>

        <div class="hero-info">
          <!-- Ligne catégorie & points déclarant -->
          <div class="category-row">
            <span class="category-pill">
              {{ signalement.categories?.nom || 'Problème environnemental' }}
            </span>
            <span class="points-earned-tag">
              +{{ signalement.categories?.points_signalement || 10 }} pts gagnés
            </span>
          </div>

          <!-- Zone / Ville et Date -->
          <div class="location-date-row">
            <span class="location-text">
              📍 {{ signalement.ville || zoneDetectee || 'Bujumbura, Burundi' }}
            </span>
            <span class="date-text">
              {{ formaterDateHeure(signalement.created_at) }}
            </span>
          </div>

          <!-- Description optionnelle -->
          <p v-if="signalement.description" class="description-text">
            « {{ signalement.description }} »
          </p>

          <!-- Auteur du signalement -->
          <div class="author-meta">
            <span class="author-avatar">{{ extraireInitiales(nomDeclarant) }}</span>
            <span class="author-label">Signalé par <strong>{{ nomDeclarant }}</strong></span>
          </div>
        </div>
      </section>

      <!-- 2. TIMELINE DE STATUT (ÉLÉMENT CENTRAL) -->
      <section class="timeline-section" aria-label="Suivi du signalement">
        <h2 class="section-heading">Suivi de l'intervention</h2>

        <div class="timeline-steps">
          
          <!-- ÉTAPE 1 : Signalement envoyé -->
          <div class="timeline-step">
            <div class="step-indicator">
              <div class="step-dot done">
                <span class="check-icon">✓</span>
              </div>
              <div class="step-line" :class="{ 'solid': etapeDeuxStatus !== 'a_venir' }"></div>
            </div>
            <div class="step-content">
              <div class="step-header">
                <strong class="step-title done-text">1. Signalement envoyé</strong>
                <span class="step-badge done">Enregistré</span>
              </div>
              <p class="step-desc">
                Transmis avec preuve photo et coordonnées GPS validées.
              </p>
              <small class="step-time">{{ formaterDateHeure(signalement.created_at) }}</small>
            </div>
          </div>

          <!-- ÉTAPE 2 : Vu par l'équipe locale -->
          <div class="timeline-step">
            <div class="step-indicator">
              <div class="step-dot" :class="etapeDeuxStatus">
                <span v-if="etapeDeuxStatus === 'done'" class="check-icon">✓</span>
                <span v-else-if="etapeDeuxStatus === 'current'" class="pulse-dot"></span>
                <span v-else class="step-num">2</span>
              </div>
              <div class="step-line" :class="{ 'solid': etapeTroisStatus !== 'a_venir' }"></div>
            </div>
            <div class="step-content">
              <div class="step-header">
                <strong class="step-title" :class="etapeDeuxStatus + '-text'">2. Vu par l'équipe locale</strong>
                <span class="step-badge" :class="etapeDeuxStatus">
                  {{ etapeDeuxLabel }}
                </span>
              </div>
              <p class="step-desc">
                Constat pris en compte et visible sur la carte citoyenne pour mobilisation.
              </p>
              <small v-if="dateVu" class="step-time">{{ formaterDateHeure(dateVu) }}</small>
            </div>
          </div>

          <!-- ÉTAPE 3 : Nettoyé par la communauté -->
          <div class="timeline-step">
            <div class="step-indicator">
              <div class="step-dot" :class="etapeTroisStatus">
                <span v-if="etapeTroisStatus === 'done'" class="check-icon">✓</span>
                <span v-else-if="etapeTroisStatus === 'current'" class="pulse-dot"></span>
                <span v-else class="step-num">3</span>
              </div>
              <div class="step-line" :class="{ 'solid': etapeQuatreStatus !== 'a_venir' }"></div>
            </div>
            <div class="step-content">
              <div class="step-header">
                <strong class="step-title" :class="etapeTroisStatus + '-text'">3. Nettoyé par la communauté</strong>
                <span class="step-badge" :class="etapeTroisStatus">
                  {{ etapeTroisLabel }}
                </span>
              </div>
              <p class="step-desc">
                Action collective d'assainissement avec prise de photo "Après".
              </p>
              <small v-if="signalement.date_nettoyage" class="step-time">
                Le {{ formaterDateHeure(signalement.date_nettoyage) }}
              </small>
            </div>
          </div>

          <!-- ÉTAPE 4 : Traité & Validé -->
          <div class="timeline-step">
            <div class="step-indicator">
              <div class="step-dot" :class="etapeQuatreStatus">
                <span v-if="etapeQuatreStatus === 'done'" class="check-icon">✓</span>
                <span v-else-if="etapeQuatreStatus === 'current'" class="pulse-dot"></span>
                <span v-else class="step-num">4</span>
              </div>
            </div>
            <div class="step-content">
              <div class="step-header">
                <strong class="step-title" :class="etapeQuatreStatus + '-text'">4. Traité & Validé</strong>
                <span class="step-badge" :class="etapeQuatreStatus">
                  {{ etapeQuatreLabel }}
                </span>
              </div>
              <p class="step-desc">
                Zone entièrement assainie, clôturée et points définitivement crédités.
              </p>
            </div>
          </div>

        </div>
      </section>

      <!-- COMPARAISON AVANT / APRÈS SI NETTOYÉ OU TRAITÉ -->
      <section v-if="estNettoyeOuTraite" class="before-after-section" aria-label="Preuve de nettoyage">
        <div class="before-after-header">
          <span class="sparkle-icon">✨</span>
          <h2 class="section-heading">Preuve d'assainissement citoyen</h2>
        </div>

        <div class="before-after-grid">
          <div class="comparison-card">
            <span class="card-badge before-badge">Avant</span>
            <img :src="signalement.photo_avant_url" alt="Avant nettoyage" class="comparison-img" />
          </div>

          <div class="comparison-card">
            <span class="card-badge after-badge">Après nettoyage ✨</span>
            <img 
              :src="signalement.photo_apres_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600'" 
              alt="Après nettoyage" 
              class="comparison-img" 
            />
          </div>
        </div>

        <!-- Auteur du nettoyage et points remportés -->
        <div class="cleaner-hero-box">
          <div class="cleaner-left">
            <span class="cleaner-avatar">{{ extraireInitiales(nomNettoyeur) }}</span>
            <div class="cleaner-text">
              <span class="cleaner-label">Nettoyé avec succès par</span>
              <strong class="cleaner-name">{{ nomNettoyeur }}</strong>
            </div>
          </div>
          <div class="cleaner-points-badge">
            +{{ signalement.categories?.points_nettoyage || 30 }} pts gagnés
          </div>
        </div>
      </section>

      <!-- 3. ACTION CONTEXTUELLE EN BAS -->
      <footer class="contextual-action-bar">
        
        <!-- Cas 1 : En attente ou Vu + utilisateur NON déclarant → Bouton d'action Nettoyage -->
        <div v-if="peutNettoyer" class="action-cta-box">
          <div class="cta-header">
            <strong>Mobilisons-nous pour cet endroit !</strong>
            <p>Rendez-vous sur place, nettoyez la zone et gagnez +{{ signalement.categories?.points_nettoyage || 30 }} points.</p>
          </div>
          <button type="button" class="btn-action-nettoyer" @click="allerAuNettoyage">
            J'ai nettoyé cette zone 🧹
          </button>
        </div>

        <!-- Cas 2 : En attente ou Vu + utilisateur EST le déclarant → Règle anti-fraude bienveillante -->
        <div v-else-if="estLeDeclarant && (signalement.statut === 'en_attente' || signalement.statut === 'vu')" class="owner-notice-box">
          <span class="notice-icon">⏳</span>
          <div class="notice-text">
            <strong>Vous êtes l'auteur de ce signalement</strong>
            <p>En attente qu'un autre membre de la communauté Greenshot nettoie cette zone pour valider son assainissement.</p>
          </div>
        </div>

        <!-- Cas 3 : Nettoyé ou Traité → Résumé final -->
        <div v-else-if="estNettoyeOuTraite" class="completed-summary-box">
          <span class="completed-icon">🎉</span>
          <div class="completed-text">
            <strong>Zone assainie et validée !</strong>
            <p>
              Nettoyée le {{ formaterDate(signalement.date_nettoyage || signalement.created_at) }} 
              par <strong>{{ nomNettoyeur }}</strong>.
            </p>
          </div>
        </div>

      </footer>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'
import { MAP_CONFIG, normaliserStatut } from '../config/mapConfig'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const signalementId = computed(() => {
  return route.params.id || route.query.id || 'sig-buj-1'
})

const signalement = ref(null)
const historique = ref([])
const chargement = ref(true)
const zoneDetectee = ref('Bujumbura')

// Exemples réalistes Greenshot pour couvrir tous les statuts
const SIGNALEMENTS_DEMO = {
  'sig-buj-1': {
    id: 'sig-buj-1',
    user_id: 'usr-4',
    statut: 'en_attente',
    ville: 'Bujumbura (Rohero)',
    photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800',
    description: 'Amas important de sachets et bouteilles plastiques près du canal d\'évacuation de Rohero.',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    categories: { nom: 'Déchets plastiques', points_signalement: 10, points_nettoyage: 30 },
    profiles: { id: 'usr-4', nom: 'Christa Marie M.' }
  },
  'sig-buj-2': {
    id: 'sig-buj-2',
    user_id: 'usr-5',
    statut: 'vu',
    ville: 'Bujumbura (Buyenzi)',
    photo_avant_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800',
    description: 'Décharge sauvage d\'ordures ménagères à ciel ouvert constatée au croisement des avenues.',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    categories: { nom: 'Décharge sauvage', points_signalement: 15, points_nettoyage: 45 },
    profiles: { id: 'usr-5', nom: 'Fabrice Nkurunziza' }
  },
  'sig-buj-3': {
    id: 'sig-buj-3',
    user_id: 'usr-2',
    nettoye_par_user_id: 'usr-1',
    statut: 'nettoye',
    ville: 'Bujumbura (Bord du lac)',
    photo_avant_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800',
    photo_apres_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    description: 'Pollution plastique importante sur la plage publique du lac Tanganyika.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    date_nettoyage: new Date(Date.now() - 3600000 * 12).toISOString(),
    categories: { nom: 'Pollution eau', points_signalement: 20, points_nettoyage: 50 },
    profiles: { id: 'usr-2', nom: 'Belyse Iteriteka' },
    nettoyeur: { id: 'usr-1', nom: 'Jean-Claude N.' }
  },
  'sig-buj-4': {
    id: 'sig-buj-4',
    user_id: 'usr-3',
    nettoye_par_user_id: 'usr-7',
    statut: 'traite',
    ville: 'Bujumbura (Mutanga Nord)',
    photo_avant_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800',
    photo_apres_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
    description: 'Arbres abattus et branchages encombrants sur les berges de la rivière Ntahangwa.',
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    date_nettoyage: new Date(Date.now() - 3600000 * 40).toISOString(),
    categories: { nom: 'Déforestation', points_signalement: 20, points_nettoyage: 60 },
    profiles: { id: 'usr-3', nom: 'Alain-Pacifique K.' },
    nettoyeur: { id: 'usr-7', nom: 'Dyllan N.' }
  }
}

onMounted(async () => {
  await chargerDetails()
})

async function chargerDetails() {
  chargement.value = true
  const idRecherche = signalementId.value

  // Vérifier d'abord si c'est un ID démo pré-défini
  if (SIGNALEMENTS_DEMO[idRecherche]) {
    signalement.value = SIGNALEMENTS_DEMO[idRecherche]
    chargement.value = false
    return
  }

  if (!supabaseConfigured) {
    signalement.value = SIGNALEMENTS_DEMO['sig-buj-1']
    chargement.value = false
    return
  }

  try {
    const { data, error } = await supabase
      .from('signalements')
      .select('*, categories(nom, points_signalement, points_nettoyage), profiles:user_id(id, nom, ville), nettoyeur:nettoye_par_user_id(id, nom, ville)')
      .eq('id', idRecherche)
      .maybeSingle()

    if (error) throw error

    if (data) {
      signalement.value = data

      // Charger l'historique des statuts
      const { data: histData } = await supabase
        .from('statuts_historique')
        .select('*')
        .eq('signalement_id', idRecherche)
        .order('date', { ascending: true })

      historique.value = histData || []
    } else {
      // Données de démonstration : UNIQUEMENT en développement local
      if (import.meta.env.DEV) {
        signalement.value = SIGNALEMENTS_DEMO[idRecherche] || SIGNALEMENTS_DEMO['sig-buj-1']
      }
    }
  } catch (err) {
    console.warn('Erreur chargement signalement:', err)
    if (import.meta.env.DEV) {
      signalement.value = SIGNALEMENTS_DEMO[idRecherche] || SIGNALEMENTS_DEMO['sig-buj-1']
    }
  } finally {
    chargement.value = false
  }
}

// Configuration visuelle du statut actuel
const confStatut = computed(() => {
  const s = normaliserStatut(signalement.value?.statut)
  return MAP_CONFIG.statusConfig[s] || MAP_CONFIG.statusConfig.en_attente
})

const nomDeclarant = computed(() => {
  return signalement.value?.profiles?.nom || 'Citoyen Greenshot'
})

const nomNettoyeur = computed(() => {
  return signalement.value?.nettoyeur?.nom || 'Membre bénévole Greenshot'
})

// Détermination de l'état de chaque étape de la timeline
const statutActuel = computed(() => {
  return normaliserStatut(signalement.value?.statut)
})

// Étape 2 (Vu)
const etapeDeuxStatus = computed(() => {
  if (statutActuel.value === 'en_attente') return 'current'
  return 'done'
})

const etapeDeuxLabel = computed(() => {
  if (statutActuel.value === 'en_attente') return 'En cours de revue'
  return 'Validé'
})

const dateVu = computed(() => {
  const hist = historique.value.find(h => h.nouveau_statut === 'vu')
  if (hist?.date) return hist.date
  if (statutActuel.value !== 'en_attente' && signalement.value?.created_at) {
    return new Date(new Date(signalement.value.created_at).getTime() + 7200000).toISOString()
  }
  return null
})

// Étape 3 (Nettoyé)
const etapeTroisStatus = computed(() => {
  if (statutActuel.value === 'en_attente') return 'a_venir'
  if (statutActuel.value === 'vu') return 'current'
  return 'done'
})

const etapeTroisLabel = computed(() => {
  if (statutActuel.value === 'en_attente') return 'À venir'
  if (statutActuel.value === 'vu') return 'Prêt à nettoyer'
  return 'Nettoyé'
})

// Étape 4 (Traité)
const etapeQuatreStatus = computed(() => {
  if (statutActuel.value === 'traite') return 'done'
  if (statutActuel.value === 'nettoye') return 'current'
  return 'a_venir'
})

const etapeQuatreLabel = computed(() => {
  if (statutActuel.value === 'traite') return 'Clôturé'
  if (statutActuel.value === 'nettoye') return 'Validation'
  return 'À venir'
})

const estNettoyeOuTraite = computed(() => {
  return statutActuel.value === 'nettoye' || statutActuel.value === 'traite'
})

// Règle de permission anti-fraude pour le bouton de nettoyage
const estLeDeclarant = computed(() => {
  const monId = userStore.user?.id || userStore.profile?.id
  const declarantId = signalement.value?.user_id || signalement.value?.profiles?.id
  if (monId && declarantId && monId === declarantId) return true
  // Détection par nom si pas d'ID UUID connecté
  if (userStore.profile?.nom && nomDeclarant.value && userStore.profile.nom === nomDeclarant.value) {
    return true
  }
  return false
})

const peutNettoyer = computed(() => {
  return (statutActuel.value === 'en_attente' || statutActuel.value === 'vu') && !estLeDeclarant.value
})

function retourEnArriere() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/carte')
  }
}

function allerAuNettoyage() {
  router.push({
    path: '/nettoyage',
    query: { id: signalement.value?.id }
  })
}

function formaterDateHeure(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

function formaterDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

function extraireInitiales(nom) {
  if (!nom) return '🌱'
  const parties = nom.trim().split(/\s+/)
  if (parties.length >= 2) {
    return (parties[0][0] + parties[1][0]).toUpperCase()
  }
  return nom.substring(0, 2).toUpperCase()
}
</script>

<style scoped>
.page-detail-signalement {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

/* Barre supérieure avec bouton retour */
.detail-top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.btn-back {
  background: #FFFFFF;
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: var(--radius-sm, 8px);
  padding: 0.4rem 0.65rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text, #0F172A);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-back:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
}

.back-icon {
  width: 16px;
  height: 16px;
}

.nav-title {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text, #0F172A);
}

.top-status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  white-space: nowrap;
}

/* 1. PHOTO PRINCIPALE (AVANT) */
.photo-hero-card {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.25rem;
}

.photo-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background-color: #0F172A;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-tag-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(15, 23, 42, 0.75);
  color: #FFFFFF;
  backdrop-filter: blur(4px);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.hero-info {
  padding: 1rem;
}

.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
}

.category-pill {
  background-color: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
  font-family: var(--font-title);
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 8px;
}

.points-earned-tag {
  background-color: var(--color-amber-light, #FDF6EB);
  color: #B47318;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.location-date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.65rem;
}

.location-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text, #0F172A);
}

.date-text {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748B);
}

.description-text {
  font-size: 0.88rem;
  color: #334155;
  font-style: italic;
  line-height: 1.4;
  background: #F8FAF9;
  border-left: 3px solid var(--color-primary, #1F4D3A);
  padding: 0.5rem 0.75rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 0.75rem;
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: var(--color-text-muted, #64748B);
  padding-top: 0.5rem;
  border-top: 1px solid #F1F5F9;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F1F5F9;
  color: var(--color-primary, #1F4D3A);
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 2. TIMELINE VERTICALE */
.timeline-section {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 18px;
  padding: 1.15rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.25rem;
}

.section-heading {
  font-family: var(--font-title);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  margin-bottom: 1.15rem;
}

.timeline-steps {
  display: flex;
  flex-direction: column;
}

.timeline-step {
  display: flex;
  gap: 0.85rem;
  position: relative;
  min-height: 64px;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}

.step-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-size: 0.75rem;
  font-weight: 800;
  z-index: 2;
  transition: all 0.2s ease;
}

.step-dot.done {
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
}

.step-dot.current {
  background-color: var(--color-amber, #E8A33D);
  color: #FFFFFF;
  box-shadow: 0 0 0 4px rgba(232, 163, 61, 0.2);
}

.step-dot.a_venir {
  background-color: #F1F5F9;
  border: 1.5px solid #CBD5E1;
  color: #94A3B8;
}

.check-icon {
  font-size: 0.85rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #FFFFFF;
  animation: pulseDot 1.5s infinite;
}

.step-line {
  width: 2px;
  flex: 1;
  background-color: #E2E8F0;
  border-left: 2px dashed #CBD5E1;
  margin: 3px 0;
}

.step-line.solid {
  border-left: none;
  background-color: var(--color-primary, #1F4D3A);
}

.step-content {
  flex: 1;
  padding-bottom: 1.1rem;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
}

.step-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-text, #0F172A);
}

.step-title.done-text {
  color: var(--color-primary, #1F4D3A);
}

.step-title.current-text {
  color: #B47318;
}

.step-title.a_venir-text {
  color: var(--color-text-muted, #64748B);
}

.step-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
}

.step-badge.done {
  background-color: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
}

.step-badge.current {
  background-color: var(--color-amber-light, #FDF6EB);
  color: #B47318;
}

.step-badge.a_venir {
  background-color: #F1F5F9;
  color: #94A3B8;
}

.step-desc {
  font-size: 0.78rem;
  color: var(--color-text-muted, #64748B);
  line-height: 1.35;
  margin-bottom: 0.2rem;
}

.step-time {
  font-size: 0.7rem;
  color: #94A3B8;
  display: block;
}

/* PREUVE DE NETTOYAGE (AVANT / APRÈS) */
.before-after-section {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 18px;
  padding: 1.15rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.25rem;
}

.before-after-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

.sparkle-icon {
  font-size: 1.1rem;
}

.before-after-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.comparison-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background-color: #0F172A;
}

.comparison-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.before-badge {
  background: rgba(15, 23, 42, 0.75);
  color: #FFFFFF;
}

.after-badge {
  background: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
}

.cleaner-hero-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-amber-light, #FDF6EB);
  border: 1px solid #FDE68A;
  border-radius: 12px;
  padding: 0.65rem 0.85rem;
  gap: 0.5rem;
}

.cleaner-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.cleaner-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E8A33D;
  color: #FFFFFF;
  font-family: var(--font-title);
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cleaner-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}

.cleaner-label {
  font-size: 0.68rem;
  color: #92400E;
}

.cleaner-name {
  font-size: 0.82rem;
  color: #78350F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cleaner-points-badge {
  background: #E8A33D;
  color: #0F172A;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  white-space: nowrap;
}

/* 3. ACTION CONTEXTUELLE EN BAS */
.contextual-action-bar {
  margin-top: 1rem;
}

.action-cta-box {
  background: #FFFFFF;
  border: 1.5px solid var(--color-primary, #1F4D3A);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cta-header strong {
  display: block;
  font-family: var(--font-title);
  font-size: 0.95rem;
  color: var(--color-primary, #1F4D3A);
  margin-bottom: 2px;
}

.cta-header p {
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748B);
  margin: 0;
  line-height: 1.35;
}

.btn-action-nettoyer {
  width: 100%;
  min-height: 52px;
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(31, 77, 58, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action-nettoyer:hover {
  background-color: var(--color-primary-hover, #163a2c);
  transform: translateY(-1px);
}

.owner-notice-box {
  background: var(--color-amber-light, #FDF6EB);
  border: 1.5px solid #FCD34D;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.notice-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.notice-text strong {
  display: block;
  font-size: 0.85rem;
  color: #92400E;
  margin-bottom: 2px;
}

.notice-text p {
  font-size: 0.78rem;
  color: #B45309;
  margin: 0;
  line-height: 1.35;
}

.completed-summary-box {
  background: var(--color-primary-light, #EBF3EF);
  border: 1.5px solid #A7F3D0;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.completed-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.completed-text strong {
  display: block;
  font-size: 0.85rem;
  color: #065F46;
  margin-bottom: 2px;
}

.completed-text p {
  font-size: 0.78rem;
  color: #047857;
  margin: 0;
  line-height: 1.35;
}

/* Skeleton Loading */
.skeleton-detail {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.skeleton-photo {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 18px;
  background: #E2E8F0;
  animation: pulseSkel 1.5s infinite;
}

.skeleton-line {
  background: #E2E8F0;
  border-radius: 8px;
  animation: pulseSkel 1.5s infinite;
}

.skeleton-line.title {
  height: 24px;
  width: 70%;
}

.skeleton-line.meta {
  height: 16px;
  width: 45%;
}

.skeleton-timeline {
  height: 160px;
  background: #E2E8F0;
  border-radius: 18px;
  animation: pulseSkel 1.5s infinite;
}

/* Erreur */
.error-detail-state {
  text-align: center;
  padding: 3rem 1rem;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  display: block;
}

.btn-primary-return {
  margin-top: 1rem;
  background: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  border: none;
  padding: 0.55rem 1.25rem;
  border-radius: 10px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

@keyframes pulseDot {
  0%, 100% { opacity: 0.5; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes pulseSkel {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
