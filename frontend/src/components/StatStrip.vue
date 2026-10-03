<script setup>
defineProps({
  stats: { type: Array, default: () => [] }
})
</script>

<template>
  <div class="statstrip">
    <div v-for="s in stats" :key="s.label" class="stat">
      <span class="stat__value">{{ s.value }}</span>
      <span class="stat__label">{{ s.label }}</span>
    </div>
  </div>
</template>