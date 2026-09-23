<template>
  <div class="page-classement">
    <h2>Classement Citoyen (Leaderboard)</h2>
    <p class="subtitle">Les citoyens les plus engagés pour la propreté de notre environnement.</p>
    <CarteScore />
  </div>
</template>

<script setup>
import CarteScore from '../components/CarteScore.vue'
</script>

<style scoped>
.page-classement {
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
