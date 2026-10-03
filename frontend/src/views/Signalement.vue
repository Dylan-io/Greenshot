<template>
  <ScreenBar title="Signaler un déchet" subtitle="Photo · type · emplacement" />

  <div class="gs-pad">
    <FormSignalement />
  </div>
</template>

<script setup>
import FormSignalement from '../components/FormSignalement.vue'
import ScreenBar from '../components/ScreenBar.vue'
</script>