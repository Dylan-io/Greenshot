<template>
  <nav class="bottom-nav" aria-label="Navigation principale">
    <div class="bottom-nav-container">
      
      <!-- 1. Accueil -->
      <router-link to="/" class="nav-item" :class="{ 'active': estActif('/') }">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span class="nav-label">Accueil</span>
      </router-link>

      <!-- 2. Carte -->
      <router-link to="/carte" class="nav-item" :class="{ 'active': estActif('/carte') }">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
        </div>
        <span class="nav-label">Carte</span>
      </router-link>

      <!-- 3. Signaler (Élément central surélevé - Ambre #E8A33D) -->
      <router-link to="/signaler" class="nav-item nav-item-central" :class="{ 'active': estActif('/signaler') }">
        <div class="central-button" title="Signaler un déchet">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" class="central-icon">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <span class="nav-label central-label">Signaler</span>
      </router-link>

      <!-- 4. Classement -->
      <router-link to="/classement" class="nav-item" :class="{ 'active': estActif('/classement') }">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v3h10v-3c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
        </div>
        <span class="nav-label">Classement</span>
      </router-link>

      <!-- 5. Profil -->
      <router-link to="/profil" class="nav-item" :class="{ 'active': estActif('/profil') }">
        <div class="nav-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <span class="nav-label">Profil</span>
      </router-link>

    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

function estActif(chemin) {
  // Sur l'écran de détail d'un signalement ou de preuve de nettoyage, aucun élément n'est actif
  if (route.path.startsWith('/signalement') || route.path.startsWith('/nettoyage')) {
    return false
  }
  if (chemin === '/') {
    return route.path === '/'
  }
  if (chemin === '/signaler') {
    return route.path === '/signaler'
  }
  return route.path.startsWith(chemin)
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FFFFFF;
  border-top: 1px solid #E5E9E2;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-nav-container {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 62px;
  position: relative;
  padding: 0 0.5rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #64748B;
  transition: all 0.18s ease;
  flex: 1;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}

.nav-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  transition: transform 0.15s ease, color 0.15s ease;
}

.nav-icon svg {
  width: 100%;
  height: 100%;
}

.nav-label {
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: color 0.15s ease;
}

/* Élément actif : Vert forêt #1F4D3A */
.nav-item.active {
  color: #1F4D3A;
}

.nav-item.active .nav-icon {
  transform: translateY(-1px);
}

.nav-item.active .nav-label {
  font-weight: 700;
  color: #1F4D3A;
}

/* Bouton central surélevé - Ambre #E8A33D */
.nav-item-central {
  position: relative;
  top: -12px;
}

.central-button {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E8A33D 0%, #D48C28 100%);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(232, 163, 61, 0.45);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  border: 3.5px solid #FFFFFF;
}

.central-icon {
  width: 24px;
  height: 24px;
}

.nav-item-central:hover .central-button,
.nav-item-central:active .central-button {
  transform: scale(1.08);
  box-shadow: 0 6px 18px rgba(232, 163, 61, 0.55);
}

.central-label {
  font-weight: 700;
  color: #E8A33D;
  margin-top: 2px;
}

.nav-item-central.active .central-label {
  color: #B47318;
}

.nav-item-central.active .central-button {
  box-shadow: 0 4px 16px rgba(232, 163, 61, 0.6);
}
</style>
