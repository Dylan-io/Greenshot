<template>
  <div class="page-profil">
    
    <!-- État de chargement discret (Skeleton) -->
    <div v-if="chargement" class="skeleton-profile" aria-label="Chargement du profil">
      <div class="skeleton-card">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-line name"></div>
        <div class="skeleton-line meta"></div>
        <div class="skeleton-stats-row">
          <div class="skeleton-stat-box"></div>
          <div class="skeleton-stat-box"></div>
          <div class="skeleton-stat-box"></div>
        </div>
      </div>
      <div class="skeleton-card-small"></div>
      <div class="skeleton-list">
        <div v-for="n in 3" :key="n" class="skeleton-hist-row"></div>
      </div>
    </div>

    <!-- Contenu Principal -->
    <div v-else class="profil-content">
      
      <!-- 1. EN-TÊTE DE PROFIL -->
      <section class="profile-card" aria-label="Informations personnelles">
        <!-- Avatar avec initiales sur fond vert forêt #1F4D3A -->
        <div class="avatar-container">
          <div class="profile-avatar">
            {{ extraireInitiales(profile.nom) }}
          </div>
          <span class="avatar-badge" title="Citoyen actif Greenshot">🌿</span>
        </div>

        <div class="profile-main-info">
          <!-- Nom et bouton Modifier -->
          <div class="name-edit-row">
            <h1 class="profile-name">{{ profile.nom || 'Citoyen Greenshot' }}</h1>
            <button 
              type="button" 
              class="btn-edit-profile" 
              @click="ouvrirModaleModifier"
              title="Modifier les informations du profil"
              aria-label="Modifier le profil"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="edit-icon">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span>Modifier</span>
            </button>
          </div>

          <!-- Ville/quartier + Date d'inscription -->
          <div class="profile-meta-row">
            <span class="profile-city">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="meta-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ profile.ville || 'Bujumbura, Burundi' }}
            </span>
            <span class="meta-separator">·</span>
            <span class="profile-joined">
              Membre depuis {{ dateInscriptionFormatee }}
            </span>
          </div>
        </div>

        <!-- 2. STATISTIQUES CLÉS -->
        <div class="stats-overview" aria-label="Statistiques d'impact">
          <div class="stats-grid">
            <!-- Score Total -->
            <div class="stat-box stat-total">
              <span class="stat-number">{{ scoreTotal }}</span>
              <span class="stat-label">Score total</span>
            </div>

            <!-- Signalements effectués -->
            <div class="stat-box stat-sig">
              <span class="stat-number">{{ totalSignalementsCount }}</span>
              <span class="stat-label">Signalements</span>
            </div>

            <!-- Nettoyages effectués -->
            <div class="stat-box stat-clean">
              <span class="stat-number">{{ totalNettoyagesCount }}</span>
              <span class="stat-label">Nettoyages</span>
            </div>
          </div>

          <!-- Répartition des points (étiquettes côte à côte) -->
          <div class="points-breakdown">
            <div class="point-pill pill-signalement">
              <span class="pill-dot"></span>
              <span class="pill-score">{{ pointsSignalement }} pts</span>
              <span class="pill-type">signalement</span>
            </div>
            <div class="point-pill pill-nettoyage">
              <span class="pill-dot"></span>
              <span class="pill-score">{{ pointsNettoyage }} pts</span>
              <span class="pill-type">nettoyage</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. RANG DANS LE CLASSEMENT -->
      <section class="rank-card" aria-label="Rang citoyen">
        <div class="rank-left">
          <div class="rank-trophy-badge">🏆</div>
          <div class="rank-texts">
            <span class="rank-title">Rang Greenshot</span>
            <strong class="rank-position">{{ texteRang }}</strong>
          </div>
        </div>
        <router-link to="/classement" class="rank-link" aria-label="Voir le classement complet">
          <span>Voir le classement</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" class="arrow-icon">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>
      </section>

      <!-- 4. HISTORIQUE COMPLET (Signalements & Nettoyages mélangés) -->
      <section class="history-section" aria-label="Historique complet des actions">
        <div class="history-header">
          <div class="history-title-wrap">
            <h2 class="history-title">Historique des actions</h2>
            <span v-if="historiqueComplet.length > 0" class="history-count">
              {{ historiqueComplet.length }}
            </span>
          </div>
          <span class="history-subtitle">Vos contributions citoyennes pour le Burundi</span>
        </div>

        <!-- État vide encourageant si l'utilisateur n'a encore rien fait -->
        <div v-if="historiqueComplet.length === 0" class="empty-history-box">
          <div class="empty-illustration">🌱</div>
          <h3 class="empty-title">Votre première action commence ici</h3>
          <p class="empty-text">
            Ton premier signalement changera ton quartier — commence maintenant !
          </p>
          <router-link to="/signaler" class="btn-first-action">
            📸 Nouveau signalement
          </router-link>
        </div>

        <!-- Liste scrollable des actions -->
        <div v-else class="history-list">
          <article 
            v-for="action in historiqueComplet" 
            :key="action.uniqueKey"
            class="history-card"
            @click="ouvrirDetail(action.signalement_id || action.id)"
            tabindex="0"
            role="button"
            :aria-label="`Voir détail : ${action.categorie_nom} à ${action.ville}`"
          >
            <!-- Miniature de la photo -->
            <div class="history-thumb-wrap">
              <img 
                :src="action.photo_url || 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=400'" 
                :alt="action.categorie_nom" 
                class="history-thumb"
                loading="lazy"
              />
              <span 
                class="history-action-tag" 
                :class="action.type === 'nettoyage' ? 'tag-nettoyage' : 'tag-signalement'"
              >
                {{ action.type === 'nettoyage' ? '🧹 Nettoyé' : '📸 Signalé' }}
              </span>
            </div>

            <!-- Détails de l'action -->
            <div class="history-body">
              <!-- En-tête : Catégorie + Points gagnés -->
              <div class="history-top-row">
                <span class="history-category">{{ action.categorie_nom }}</span>
                <span 
                  class="action-points-badge"
                  :class="action.type === 'nettoyage' ? 'pts-clean' : 'pts-sig'"
                >
                  +{{ action.points }} pts
                </span>
              </div>

              <!-- Lieu / Ville / Quartier -->
              <div class="history-location">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loc-mini-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{{ action.ville || 'Bujumbura' }}</span>
              </div>

              <!-- Bas : Statut actuel & Date -->
              <div class="history-bottom-row">
                <BadgeStatut :statut="action.statut" />
                <time class="history-date">{{ formaterDateRelative(action.date) }}</time>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- 5. DÉCONNEXION -->
      <footer class="logout-section">
        <button 
          type="button" 
          class="btn-logout" 
          @click="confirmerDeconnexion"
          :disabled="deconnexionEnCours"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logout-icon">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>{{ deconnexionEnCours ? 'Déconnexion en cours…' : 'Se déconnecter' }}</span>
        </button>
        <p class="app-version">Greenshot Burundi · v1.2.0</p>
      </footer>

    </div>

    <!-- MODALE : MODIFIER LE PROFIL -->
    <div v-if="modaleModifierOuverte" class="modal-overlay" @click.self="fermerModaleModifier">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Modifier mon profil</h3>
          <button type="button" class="btn-close-modal" @click="fermerModaleModifier" aria-label="Fermer">✕</button>
        </div>

        <form @submit.prevent="sauvegarderProfil" class="modal-form">
          <div class="form-group">
            <label for="edit-nom" class="form-label">Nom complet ou pseudonyme</label>
            <input 
              id="edit-nom" 
              v-model="formProfil.nom" 
              type="text" 
              class="form-input" 
              placeholder="Ex : Dyllan Nkurunziza" 
              required
            />
          </div>

          <div class="form-group">
            <label for="edit-ville" class="form-label">Ville ou quartier</label>
            <input 
              id="edit-ville" 
              v-model="formProfil.ville" 
              type="text" 
              class="form-input" 
              placeholder="Ex : Bujumbura (Ngagara)" 
              required
            />
          </div>

          <div v-if="messageSucces" class="modal-success-banner">
            ✓ {{ messageSucces }}
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-modal-cancel" @click="fermerModaleModifier">
              Annuler
            </button>
            <button type="submit" class="btn-modal-save" :disabled="enregistrementEnCours">
              {{ enregistrementEnCours ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="toast-notification">
        {{ toastMessage }}
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'
import BadgeStatut from '../components/BadgeStatut.vue'

const router = useRouter()
const userStore = useUserStore()

const chargement = ref(true)
const deconnexionEnCours = ref(false)
const modaleModifierOuverte = ref(false)
const enregistrementEnCours = ref(false)
const messageSucces = ref('')
const toastMessage = ref('')

// Valeurs initiales. En développement on garde un profil de démonstration
// pour travailler la mise en page ; en production, un profil vide pour ne pas afficher
// un faux citoyen à un visiteur non connecté.
const profile = ref(import.meta.env.DEV
  ? {
      id: 'usr-7',
      nom: 'Dyllan N.',
      ville: 'Bujumbura (Ngagara)',
      score_signalement: 40,
      score_nettoyage: 80,
      created_at: new Date('2026-03-01T10:00:00Z').toISOString()
    }
  : {
      nom: '',
      ville: '',
      score_signalement: 0,
      score_nettoyage: 0
    })


const mesSignalements = ref([])
const mesNettoyages = ref([])
const rangBujumbura = ref(4)
const rangNational = ref(7)

// Formulaire d'édition de profil
const formProfil = ref({
  nom: '',
  ville: ''
})

// Scores et totaux
const scoreTotal = computed(() => {
  return (profile.value.score_signalement || 0) + (profile.value.score_nettoyage || 0)
})

const pointsSignalement = computed(() => profile.value.score_signalement || 0)
const pointsNettoyage = computed(() => profile.value.score_nettoyage || 0)

const totalSignalementsCount = computed(() => mesSignalements.value.length)
const totalNettoyagesCount = computed(() => mesNettoyages.value.length)

// Texte du rang dynamique
const texteRang = computed(() => {
  const ville = (profile.value.ville || 'Bujumbura').split('(')[0].trim()
  return `#${rangBujumbura.value} à ${ville} · #${rangNational.value} au national`
})

// Date d'inscription formatée
const dateInscriptionFormatee = computed(() => {
  if (!profile.value.created_at) return 'récemment'
  try {
    const d = new Date(profile.value.created_at)
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  } catch {
    return 'mars 2026'
  }
})

// 4. HISTORIQUE COMPLET : Signalements ET Nettoyages mélangés et triés par date décroissante
const historiqueComplet = computed(() => {
  const liste = []

  // 1. Ajouter les signalements faits par l'utilisateur
  mesSignalements.value.forEach(sig => {
    liste.push({
      uniqueKey: `sig-${sig.id}`,
      id: sig.id,
      signalement_id: sig.id,
      type: 'signalement',
      categorie_nom: sig.categories?.nom || 'Problème environnemental',
      ville: sig.ville || profile.value.ville || 'Bujumbura',
      photo_url: sig.photo_avant_url,
      points: sig.categories?.points_signalement || 10,
      statut: sig.statut || 'en_attente',
      date: sig.created_at || new Date().toISOString()
    })
  })

  // 2. Ajouter les nettoyages effectués par l'utilisateur
  mesNettoyages.value.forEach(clean => {
    liste.push({
      uniqueKey: `clean-${clean.id}`,
      id: clean.id,
      signalement_id: clean.id,
      type: 'nettoyage',
      categorie_nom: clean.categories?.nom || 'Zone assainie',
      ville: clean.ville || profile.value.ville || 'Bujumbura',
      photo_url: clean.photo_apres_url || clean.photo_avant_url,
      points: clean.categories?.points_nettoyage || 30,
      statut: clean.statut || 'nettoye',
      date: clean.date_nettoyage || clean.created_at || new Date().toISOString()
    })
  })

  // 3. Trier du plus récent au plus ancien
  return liste.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

onMounted(async () => {
  await chargerDonneesProfil()
})

// Chargement des données réelles Supabase avec fallback réaliste démo
async function chargerDonneesProfil() {
  chargement.value = true

  // Initialiser les valeurs de démonstration au cas où
  const fallbackSignalements = [
    {
      id: 'sig-buj-1',
      ville: 'Bujumbura (Rohero)',
      statut: 'en_attente',
      photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      categories: { nom: 'Déchets plastiques', points_signalement: 10, points_nettoyage: 30 }
    },
    {
      id: 'sig-buj-2',
      ville: 'Bujumbura (Buyenzi)',
      statut: 'vu',
      photo_avant_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600',
      created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
      categories: { nom: 'Décharge sauvage', points_signalement: 15, points_nettoyage: 45 }
    },
    {
      id: 'sig-buj-4',
      ville: 'Bujumbura (Mutanga Nord)',
      statut: 'traite',
      photo_avant_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600',
      created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      categories: { nom: 'Déforestation', points_signalement: 15, points_nettoyage: 60 }
    }
  ]

  const fallbackNettoyages = [
    {
      id: 'sig-buj-3',
      ville: 'Bujumbura (Bord du lac)',
      statut: 'nettoye',
      photo_avant_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600',
      photo_apres_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600',
      date_nettoyage: new Date(Date.now() - 3600000 * 18).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      categories: { nom: 'Pollution eau', points_signalement: 20, points_nettoyage: 50 }
    },
    {
      id: 'sig-buj-4',
      ville: 'Bujumbura (Mutanga Nord)',
      statut: 'traite',
      photo_avant_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600',
      photo_apres_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600',
      date_nettoyage: new Date(Date.now() - 3600000 * 40).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      categories: { nom: 'Déforestation', points_signalement: 15, points_nettoyage: 30 }
    }
  ]

  if (!supabaseConfigured) {
    appliquerDemoData(fallbackSignalements, fallbackNettoyages)
    chargement.value = false
    return
  }

  try {
    // 1. Récupérer l'utilisateur courant authentifié
    let userId = userStore.user?.id
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        userId = authData.user.id
        userStore.setSession(authData.user)
      }
    }

    if (userId) {
      // 2. Charger le profil Supabase
      // Colonnes explicitement listées : email / phone / email_verified ne
      // sont plus accordées au rôle client (protection des PII). Le profil
      // complet est déjà chargé par le store via obtenir_mon_profil().
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('id, nom, ville, username, score_signalement, score_nettoyage, created_at')
        .eq('id', userId)
        .maybeSingle()

      if (!profError && prof) {
        profile.value = { ...profile.value, ...prof }
        userStore.profile = { ...userStore.profile, ...prof }
      }

      // 3. Charger les signalements faits par l'utilisateur
      const { data: sigData } = await supabase
        .from('signalements')
        .select('*, categories(nom, points_signalement, points_nettoyage)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      mesSignalements.value = sigData || []

      // 4. Charger les nettoyages réalisés par l'utilisateur
      const { data: cleanData } = await supabase
        .from('signalements')
        .select('*, categories(nom, points_signalement, points_nettoyage)')
        .eq('nettoye_par_user_id', userId)
        .order('date_nettoyage', { ascending: false })

      mesNettoyages.value = cleanData || []

      // 5. Calculer le rang dans le classement
      await calculerRangUtilisateur(userId)
    } else {
      // Données de démonstration : UNIQUEMENT en développement local
      if (import.meta.env.DEV) {
        appliquerDemoData(fallbackSignalements, fallbackNettoyages)
      }
    }
  } catch (err) {
    console.warn('Erreur chargement profil Supabase, utilisation démo:', err)
    if (import.meta.env.DEV) {
      appliquerDemoData(fallbackSignalements, fallbackNettoyages)
    }
  } finally {
    chargement.value = false
  }

}

function appliquerDemoData(sigDemo, cleanDemo) {
  if (userStore.profile?.nom) {
    profile.value = {
      ...profile.value,
      ...userStore.profile
    }
  }
  mesSignalements.value = sigDemo
  mesNettoyages.value = cleanDemo
  rangBujumbura.value = 4
  rangNational.value = 7
}

async function calculerRangUtilisateur(userId) {
  try {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, ville, score_signalement, score_nettoyage')

    if (allProfiles && allProfiles.length > 0) {
      const calcules = allProfiles.map(p => ({
        id: p.id,
        ville: p.ville,
        score: (p.score_signalement || 0) + (p.score_nettoyage || 0)
      })).sort((a, b) => b.score - a.score)

      const nationalIndex = calcules.findIndex(p => p.id === userId)
      if (nationalIndex >= 0) {
        rangNational.value = nationalIndex + 1
      }

      const memeVille = calcules.filter(p => (p.ville || '').toLowerCase().includes((profile.value.ville || 'bujumbura').toLowerCase()))
      const villeIndex = memeVille.findIndex(p => p.id === userId)
      if (villeIndex >= 0) {
        rangBujumbura.value = villeIndex + 1
      }
    }
  } catch (e) {
    console.warn('Impossible de calculer le rang exact:', e)
  }
}

// Navigation vers le détail
function ouvrirDetail(id) {
  if (!id) return
  router.push(`/signalement/${id}`)
}

// Modale Modifier
function ouvrirModaleModifier() {
  formProfil.value = {
    nom: profile.value.nom || '',
    ville: profile.value.ville || ''
  }
  messageSucces.value = ''
  modaleModifierOuverte.value = true
}

function fermerModaleModifier() {
  modaleModifierOuverte.value = false
  messageSucces.value = ''
}

async function sauvegarderProfil() {
  enregistrementEnCours.value = true
  messageSucces.value = ''

  try {
    const nouveauNom = formProfil.value.nom.trim()
    const nouvelleVille = formProfil.value.ville.trim()

    profile.value.nom = nouveauNom
    profile.value.ville = nouvelleVille

    userStore.profile = {
      ...userStore.profile,
      nom: nouveauNom,
      ville: nouvelleVille
    }

    // Sauvegarder dans Supabase si connecté
    const userId = userStore.user?.id
    if (supabaseConfigured && userId) {
      await supabase
        .from('profiles')
        .update({
          nom: nouveauNom,
          ville: nouvelleVille
        })
        .eq('id', userId)
    }

    messageSucces.value = 'Profil mis à jour avec succès !'
    afficherToast('Profil mis à jour avec succès')

    setTimeout(() => {
      fermerModaleModifier()
    }, 900)
  } catch (err) {
    console.warn('Erreur mise à jour profil:', err)
  } finally {
    enregistrementEnCours.value = false
  }
}

// 5. DÉCONNEXION FONCTIONNELLE
async function confirmerDeconnexion() {
  if (!window.confirm('Voulez-vous vraiment vous déconnecter de Greenshot ?')) {
    return
  }

  deconnexionEnCours.value = true
  try {
    if (supabaseConfigured) {
      await supabase.auth.signOut()
    }
    userStore.clearSession()
    afficherToast('Déconnexion réussie')

    setTimeout(() => {
      router.push('/')
    }, 500)
  } catch (err) {
    console.warn('Erreur lors de la déconnexion:', err)
    userStore.clearSession()
    router.push('/')
  } finally {
    deconnexionEnCours.value = false
  }
}

function afficherToast(msg) {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

function extraireInitiales(nom) {
  if (!nom) return '🌱'
  const parties = nom.trim().split(/\s+/)
  if (parties.length >= 2) {
    return (parties[0][0] + parties[1][0]).toUpperCase()
  }
  return nom.substring(0, 2).toUpperCase()
}

function formaterDateRelative(d) {
  if (!d) return ''
  try {
    const diffMs = Date.now() - new Date(d).getTime()
    const diffHeures = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHeures < 1) return 'À l\'instant'
    if (diffHeures < 24) return `Il y a ${diffHeures}h`
    const diffJours = Math.floor(diffHeures / 24)
    if (diffJours === 1) return 'Hier'
    if (diffJours < 7) return `Il y a ${diffJours} jours`
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}
</script>

<style scoped>
.page-profil {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

/* SKELETON LOADER */
.skeleton-profile {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: var(--radius-lg, 16px);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.skeleton-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 1rem;
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 0.5rem;
}

.skeleton-line.name {
  width: 140px;
  height: 20px;
}

.skeleton-line.meta {
  width: 200px;
}

.skeleton-stats-row {
  display: flex;
  width: 100%;
  gap: 0.5rem;
  margin-top: 1rem;
}

.skeleton-stat-box {
  flex: 1;
  height: 60px;
  border-radius: 10px;
  background: #F1F5F9;
}

.skeleton-card-small {
  height: 64px;
  background: #FFFFFF;
  border: 1px solid #E5E9E2;
  border-radius: 14px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-hist-row {
  height: 82px;
  background: #FFFFFF;
  border: 1px solid #E5E9E2;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 1. EN-TÊTE DE PROFIL */
.profile-card {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: var(--radius-lg, 16px);
  padding: 1.25rem 1rem 1rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1rem;
  text-align: center;
}

.avatar-container {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 0.75rem;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary, #1F4D3A) 0%, #163A2C 100%);
  color: #FFFFFF;
  font-family: var(--font-title);
  font-size: 1.55rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3.5px solid #FFFFFF;
  box-shadow: 0 4px 14px rgba(31, 77, 58, 0.25);
}

.avatar-badge {
  position: absolute;
  bottom: 0px;
  right: -2px;
  width: 24px;
  height: 24px;
  background-color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  border: 1.5px solid var(--color-border, #E5E9E2);
}

.name-edit-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.profile-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  line-height: 1.2;
}

.btn-edit-profile {
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-full);
  padding: 0.25rem 0.55rem;
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748B);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-edit-profile:hover {
  background: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
  border-color: #A4CCB9;
}

.edit-icon {
  width: 12px;
  height: 12px;
}

.profile-meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748B);
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.profile-city {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  color: var(--color-text, #0F172A);
}

.meta-icon {
  width: 13px;
  height: 13px;
  color: var(--color-primary, #1F4D3A);
}

.meta-separator {
  color: #CBD5E1;
  font-weight: bold;
}

.profile-joined {
  color: var(--color-text-muted, #64748B);
}

/* 2. STATISTIQUES CLÉS */
.stats-overview {
  padding-top: 1rem;
  border-top: 1px solid #F1F5F9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
  margin-bottom: 0.85rem;
}

.stat-box {
  padding: 0.75rem 0.4rem;
  border-radius: var(--radius-md, 12px);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.stat-number {
  font-family: var(--font-title);
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 0.2rem;
}

.stat-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748B);
  letter-spacing: -0.01em;
}

.stat-total {
  background-color: var(--color-primary-light, #EBF3EF);
  border: 1px solid #D1E5DA;
}

.stat-total .stat-number {
  color: var(--color-primary, #1F4D3A);
}

.stat-sig {
  background-color: #EBF4F9;
  border: 1px solid #BEDAEB;
}

.stat-sig .stat-number {
  color: #3E7CA6;
}

.stat-clean {
  background-color: var(--color-amber-light, #FDF6EB);
  border: 1px solid #F6D7A4;
}

.stat-clean .stat-number {
  color: #C07912;
}

/* Répartition des points */
.points-breakdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.point-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.point-pill .pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.pill-signalement {
  background-color: #EBF4F9;
  border: 1px solid #BEDAEB;
  color: #276288;
}

.pill-signalement .pill-dot {
  background-color: #3E7CA6;
}

.pill-nettoyage {
  background-color: var(--color-amber-light, #FDF6EB);
  border: 1px solid #F6D7A4;
  color: #925406;
}

.pill-nettoyage .pill-dot {
  background-color: var(--color-amber, #E8A33D);
}

.pill-score {
  font-family: var(--font-title);
  font-weight: 800;
}

.pill-type {
  font-weight: 500;
  opacity: 0.9;
}

/* 3. RANG */
.rank-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFBF9 100%);
  border: 1.5px solid #E5E9E2;
  border-radius: var(--radius-md, 14px);
  padding: 0.85rem 1rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rank-trophy-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background-color: var(--color-amber-light, #FDF6EB);
  border: 1px solid #F6D7A4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.rank-texts {
  display: flex;
  flex-direction: column;
}

.rank-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.rank-position {
  font-family: var(--font-title);
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--color-primary, #1F4D3A);
}

.rank-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-amber, #E8A33D);
  text-decoration: none;
  white-space: nowrap;
  transition: transform 0.15s ease, color 0.15s ease;
}

.rank-link:hover {
  color: #B47318;
  transform: translateX(2px);
}

.arrow-icon {
  width: 14px;
  height: 14px;
}

/* 4. HISTORIQUE COMPLET */
.history-section {
  margin-bottom: 1.5rem;
}

.history-header {
  margin-bottom: 0.85rem;
}

.history-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}

.history-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
}

.history-count {
  background-color: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
  font-family: var(--font-title);
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-full);
}

.history-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748B);
}

/* État vide encourageant */
.empty-history-box {
  background-color: var(--color-card, #FFFFFF);
  border: 1.5px dashed var(--color-border, #E5E9E2);
  border-radius: var(--radius-lg, 16px);
  padding: 2rem 1.25rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-illustration {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  margin-bottom: 0.35rem;
}

.empty-text {
  font-size: 0.88rem;
  color: var(--color-text-muted, #64748B);
  line-height: 1.45;
  max-width: 320px;
  margin-bottom: 1.25rem;
}

.btn-first-action {
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  text-decoration: none;
  font-family: var(--font-title);
  font-size: 0.88rem;
  font-weight: 700;
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md, 12px);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  box-shadow: 0 4px 12px rgba(31, 77, 58, 0.25);
  transition: transform 0.15s ease, background 0.15s ease;
}

.btn-first-action:hover {
  background-color: var(--color-primary-hover, #163a2c);
  transform: translateY(-1px);
}

/* Liste de cartes d'historique */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.history-card {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: var(--radius-md, 14px);
  padding: 0.65rem;
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.history-card:hover,
.history-card:focus-visible {
  transform: translateY(-2px);
  border-color: #CBD5E1;
  box-shadow: var(--shadow-sm);
}

.history-thumb-wrap {
  position: relative;
  width: 78px;
  height: 78px;
  border-radius: var(--radius-sm, 10px);
  overflow: hidden;
  background-color: #0F172A;
  flex-shrink: 0;
}

.history-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.history-action-tag {
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tag-signalement {
  background-color: rgba(62, 124, 166, 0.9);
  color: #FFFFFF;
}

.tag-nettoyage {
  background-color: rgba(232, 163, 61, 0.95);
  color: #FFFFFF;
}

.history-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.history-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.history-category {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-text, #0F172A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-points-badge {
  font-family: var(--font-title);
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.pts-sig {
  background-color: #EBF4F9;
  color: #2563EB;
}

.pts-clean {
  background-color: var(--color-amber-light, #FDF6EB);
  color: #B45309;
}

.history-location {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748B);
  margin: 0.2rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loc-mini-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.history-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.history-date {
  font-size: 0.72rem;
  color: #94A3B8;
  font-weight: 500;
}

/* 5. DÉCONNEXION */
.logout-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #E5E9E2;
}

.btn-logout {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-md, 12px);
  padding: 0.65rem 1.25rem;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-logout:hover:not(:disabled) {
  background: #FEF2F2;
  border-color: #FECACA;
  color: #DC2626;
}

.btn-logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-icon {
  width: 16px;
  height: 16px;
}

.app-version {
  font-size: 0.72rem;
  color: #94A3B8;
  margin-top: 0.75rem;
}

/* MODALE DE MODIFICATION */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(3px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  background-color: #FFFFFF;
  border-radius: var(--radius-lg, 16px);
  max-width: 400px;
  width: 100%;
  padding: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: modalPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPop {
  0% { transform: scale(0.94); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.15rem;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
}

.btn-close-modal {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #94A3B8;
  cursor: pointer;
  padding: 0.25rem;
}

.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.35rem;
}

.form-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #CBD5E1;
  border-radius: var(--radius-sm, 10px);
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: #0F172A;
  outline: none;
  transition: border-color 0.15s ease;
}

.form-input:focus {
  border-color: var(--color-primary, #1F4D3A);
}

.modal-success-banner {
  background-color: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.btn-modal-cancel {
  flex: 1;
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  padding: 0.65rem;
  border-radius: var(--radius-sm, 10px);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.btn-modal-save {
  flex: 1;
  background: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  border: none;
  padding: 0.65rem;
  border-radius: var(--radius-sm, 10px);
  font-family: var(--font-title);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(31, 77, 58, 0.25);
}

.btn-modal-save:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* TOAST */
.toast-notification {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(15, 23, 42, 0.92);
  color: #FFFFFF;
  padding: 0.65rem 1.15rem;
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1200;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
