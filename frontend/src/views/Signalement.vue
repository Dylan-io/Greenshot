<template>
  <div class="page-signalement">
    <h2>Nouveau Signalement</h2>
    <p class="subtitle">Photographiez et géolocalisez un problème environnemental.</p>
    <FormSignalement />
  </div>
</template>

<script setup>
import FormSignalement from '../components/FormSignalement.vue'
</script>

<style scoped>
.page-signalement {
  max-width: 600px;
  margin: 0 auto;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #64748b;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}
</style>
