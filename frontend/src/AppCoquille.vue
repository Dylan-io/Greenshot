<script setup>
import { useUserStore } from '../stores/userStore'
import AppNav from '../components/AppNav.vue'
import VerificationBanner from '../components/VerificationBanner.vue'

const userStore = useUserStore()

userStore.initAuth()
</script>

<template>
  <div class="gs-app">
    <VerificationBanner />

    <main class="gs-main">
      <router-view />
    </main>

    <AppNav />
  </div>
</template>

<style>
/* Onboarding et authentification sont hors du cadre de navigation.
   Voir docs/UI-ECRANS.md : ces écrans sont plein écran, sans barre
   latérale ni navigation basse. */
.gs-app:has(.onb),
.gs-app:has(.auth) {
  display: block;
  height: auto;
  min-height: 100dvh;
  grid-template-columns: none;
  grid-template-rows: none;
  grid-template-areas: none;
  background: var(--forest-3);
}

.gs-app:has(.onb) .gs-main,
.gs-app:has(.auth) .gs-main {
  overflow: visible;
}
</style>