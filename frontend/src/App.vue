<template>
  <div id="cleanshoot-app">
    <!-- Barre de navigation principale CleanShoot -->
    <header class="app-header">
      <div class="header-container">
        <router-link to="/" class="logo-link">
          <h1 class="logo">Clean<span>Shoot</span> 🌍</h1>
        </router-link>
        <nav class="main-nav">
          <router-link to="/">Signaler</router-link>
          <router-link to="/carte">Carte</router-link>
          <router-link to="/nettoyage" class="nav-clean">Nettoyer 🧹</router-link>
          <router-link to="/classement">Classement</router-link>
          <router-link to="/profil">Profil</router-link>
        </nav>
      </div>
    </header>

    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// Application Shell CleanShoot
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

.main-nav a.nav-clean {
  color: #c07912;
}

.main-nav a.nav-clean.router-link-active {
  color: #c07912;
  background-color: #fdf6eb;
}

.app-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
}
</style>
