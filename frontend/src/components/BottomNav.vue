<script setup>
defineProps({
  entries: { type: Array, default: () => [] }
})
</script>

<template>
  <nav class="gs-nav" aria-label="Navigation principale">
    <slot />
  </nav>
</template>