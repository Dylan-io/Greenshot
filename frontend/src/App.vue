<template>
  <div id="greenshot-app">
    <!-- En-tête mobile Greenshot -->
    <header class="app-header">
      <div class="header-container">
        <router-link to="/" class="brand-link" aria-label="Accueil Greenshot">
          <!-- Logo : icône feuille dans un carré arrondi vert forêt #1F4D3A -->
          <div class="logo-box">
            <svg class="leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 4 13c0-4 3-7 8-9 5 2 8 5 8 9a7 7 0 0 1-7 7z"/>
              <path d="M12 4v16"/>
            </svg>
          </div>
          <span class="brand-title">Green<span>shot</span></span>
        </router-link>
        <div class="header-actions">
          <!-- Badge discret de contexte pays -->
          <div class="header-badge">
            <span class="badge-flag">🇧🇮</span>
            <span class="badge-country">Burundi</span>
          </div>

          <!-- Liens rapides auth si non connecté -->
          <div v-if="!userStore.isAuthenticated" class="header-auth">
            <router-link to="/connexion" class="link-auth">Connexion</router-link>
            <router-link to="/inscription" class="link-auth btn-inscrire-mini">S'inscrire</router-link>
          </div>
          <div v-else class="header-user">
            <router-link to="/profil" class="link-user-profile" title="Mon profil">
              👤 {{ userStore.profile?.username || userStore.profile?.nom?.split(' ')[0] || 'Profil' }}
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Bannière de vérification email si nécessaire -->
    <div v-if="userStore.isAuthenticated && !userStore.profile?.email_verified" class="verification-banner">
      ⚠️ <strong>Votre email n'est pas encore vérifié.</strong> 
      Pour valider vos actions, cliquez sur le lien reçu par email.
      <button @click="renvoyerVerification" class="btn-resend-verify" type="button">📧 Renvoyer l'email</button>
    </div>

    <main class="app-content">
      <router-view />
    </main>

    <!-- Barre de navigation mobile-first en bas (BottomNav) -->
    <BottomNav />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/userStore'
import BottomNav from './components/BottomNav.vue'

const userStore = useUserStore()

// Initialiser l'authentification au montage
onMounted(() => {
  userStore.initAuth()
})

// Renvoyer l'email de vérification
async function renvoyerVerification() {
  await userStore.renvoyerVerification()
}

</script>

<style>
:root {
  /* Charte Greenshot officielle */
  --color-bg: #F6F8F3;
  --color-primary: #1F4D3A;        /* Vert forêt pour action principale & actif */
  --color-primary-hover: #163a2c;
  --color-primary-light: #EBF3EF;
  --color-amber: #E8A33D;          /* Ambre pour points & gamification */
  --color-amber-light: #FDF6EB;
  --color-terracotta: #B5502F;     /* Terre cuite pour alertes & en attente */
  --color-terracotta-light: #FDF0EC;
  --color-card: #FFFFFF;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --color-border: #E5E9E2;

  --font-title: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
}

/* Reset général */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

h1, h2, h3, h4, .font-title {
  font-family: var(--font-title);
  letter-spacing: -0.02em;
}

#greenshot-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* En-tête Greenshot */
.app-header {
  background-color: #FFFFFF;
  border-bottom: 1px solid var(--color-border);
  padding: 0.65rem 1rem;
  position: sticky;
  top: 0;
  z-index: 900;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.header-container {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
}

/* Logo : icône feuille dans un carré arrondi vert forêt #1F4D3A */
.logo-box {
  width: 34px;
  height: 34px;
  background-color: var(--color-primary, #1F4D3A);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  box-shadow: 0 2px 6px rgba(31, 77, 58, 0.25);
}

.leaf-icon {
  width: 20px;
  height: 20px;
}

.brand-title {
  font-family: var(--font-title);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-primary, #1F4D3A);
  letter-spacing: -0.03em;
}

.brand-title span {
  color: var(--color-amber, #E8A33D);
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0.2rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-auth {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.link-auth {
  text-decoration: none;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--color-primary, #1F4D3A);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.link-auth:hover {
  background: var(--color-primary-light, #EBF3EF);
}

.btn-inscrire-mini {
  background: var(--color-primary, #1F4D3A) !important;
  color: #FFFFFF !important;
}

.btn-inscrire-mini:hover {
  background: var(--color-primary-hover, #163a2c) !important;
}

.header-user {
  display: flex;
  align-items: center;
}

.link-user-profile {
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-primary, #1F4D3A);
  background: var(--color-primary-light, #EBF3EF);
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid rgba(31, 77, 58, 0.15);
}

/* Bannière de vérification email */
.verification-banner {
  background: #FFFBEB;
  border-bottom: 1px solid #FCD34D;
  padding: 0.65rem 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: #92400E;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.verification-banner strong {
  font-weight: 700;
}

.btn-resend-verify {
  padding: 0.2rem 0.6rem;
  background: #E8A33D;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.4rem;
}

.app-content {
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem 1rem calc(76px + env(safe-area-inset-bottom, 16px));
  flex: 1;
}

@media (min-width: 481px) {
  .app-content {
    padding-top: 1.25rem;
  }
}
</style>
