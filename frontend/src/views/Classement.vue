<template>
  <ScreenBar title="Classement" subtitle="Les citoyens les plus engagés" />

  <div class="gs-pad">
    <CarteScore />
  </div>
</template>

<script setup>
import CarteScore from '../components/CarteScore.vue'
import ScreenBar from '../components/ScreenBar.vue'
</script>