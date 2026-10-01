<template>
  <div id="greenshot-app">
    <!-- Barre de navigation principale Greenshot -->
    <header class="app-header">
      <div class="header-container">
        <router-link to="/" class="logo-link">
          <h1 class="logo">Green<span>shot</span> 🌍</h1>
        </router-link>
        <nav class="main-nav">
          <router-link to="/">Signaler</router-link>
          <router-link to="/carte">Carte</router-link>
          <router-link to="/nettoyage" class="nav-clean">Nettoyer 🧹</router-link>
          <router-link to="/classement">Classement</router-link>
          <router-link to="/profil">Profil</router-link>
          <!-- Lien auth : se connecter ou s'inscrire -->
          <template v-if="!isAuthenticated">
            <router-link to="/connexion" class="nav-auth">Connexion</router-link>
            <router-link to="/inscription" class="nav-auth nav-inscription">S'inscrire</router-link>
          </template>
          <template v-else>
            <span class="nav-user">👤 {{ profile.username || profile.nom }}</span>
            <button @click="deconnecter" class="btn-deconnexion">Déconnexion</button>
          </template>
        </nav>
      </div>
    </header>

    <!-- Bannière de vérification email si nécessaire -->
    <div v-if="isAuthenticated && !profile.email_verified" class="verification-banner">
      ⚠️ <strong>Votre email n'est pas encore vérifié.</strong> 
      Vous pouvez naviguer sur l'application, mais pour <strong>signaler un problème</strong>, 
      vous devez cliquer sur le lien dans l'email que nous vous avons envoyé.
      <button @click="renvoyerVerification" class="btn-resend-verify">📧 Renvoyer l'email</button>
    </div>

    <!-- Avertissement si email non vérifié et page de signalement -->
    <div v-if="isAuthenticated && !profile.email_verified && isOnSignalementPage" class="verification-warning">
      ⛔ Vous devez vérifier votre email pour soumettre un signalement.
    </div>

    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const { user, profile, isAuthenticated } = userStore

// Initialiser l'authentification au montage
onMounted(() => {
  userStore.initAuth()
})

// Vérifier si on est sur une page de signalement
const isOnSignalementPage = computed(() => {
  return router.currentRoute.value.path === '/' || 
         router.currentRoute.value.path === '/nettoyage'
})

// Se déconnecter
async function deconnecter() {
  await userStore.deconnecter()
  router.push('/connexion')
}

// Renvoyer l'email de vérification
async function renvoyerVerification() {
  await userStore.renvoyerVerification()
}
</script>

<style>
/* Reset & typographie moderne */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}

.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.logo-link {
  text-decoration: none;
}

.logo {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.logo span {
  color: #10b981;
}

.main-nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.main-nav a {
  text-decoration: none;
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.main-nav a:hover {
  color: #0f172a;
  background-color: #f1f5f9;
}

.main-nav a.router-link-active {
  color: #10b981;
  background-color: #ecfdf5;
}

.main-nav a.nav-clean.router-link-active {
  color: #c07912;
  background-color: #fdf6eb;
}

/* Lien auth dans la nav */
.nav-auth {
  color: #64748b !important;
}

.nav-auth.router-link-active {
  color: #10b981 !important;
  background-color: #ecfdf5 !important;
}

.nav-inscription {
  background-color: #10B981 !important;
  color: white !important;
  border-radius: 6px;
}

.nav-user {
  font-weight: 600;
  font-size: 0.9rem;
  color: #0f172a;
}

.btn-deconnexion {
  padding: 0.3rem 0.65rem;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #94a3b8;
}

.btn-deconnexion:hover {
  background-color: #FEF2F2;
  color: #991B1B;
  border-color: #FECACA;
}

/* Bannière de vérification email */
.verification-banner {
  background: #FFFBEB;
  border-bottom: 1px solid #FCD34D;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.85rem;
  color: #92400E;
  max-width: 960px;
  margin: 0 auto;
}

.verification-banner strong {
  font-weight: 700;
}

.btn-resend-verify {
  padding: 0.25rem 0.75rem;
  background: #E8A33D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

/* Avertissement sur la page de signalement */
.verification-warning {
  max-width: 960px;
  margin: 0.5rem auto;
  padding: 0.75rem 1rem;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  color: #991B1B;
  font-size: 0.85rem;
  text-align: center;
}

.app-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
}
</style>
