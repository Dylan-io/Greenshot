<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/userStore'
import AppNav from './components/AppNav.vue'
import VerificationBanner from './components/VerificationBanner.vue'

const userStore = useUserStore()

onMounted(() => {
  userStore.initAuth()
})
</script>

<!--
  Onboarding et authentification sont plein écran, sans coquille.
  La décision est prise dans le routeur (meta.sansCoquille) et appliquée
  ici par un composant distinct : conditionner la coquille sur route.path
  dans le même composant que le router-view créait des incohérences de
  rendu au premier chargement.
-->
<template>
  <div class="gs-app">
    <VerificationBanner />

    <main class="gs-main">
      <router-view />
    </main>

    <AppNav />
  </div>
</template>