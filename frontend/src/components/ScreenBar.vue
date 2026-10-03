<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>

<template>
  <header class="sbar">
    <div class="sbar__body">
      <h1 class="sbar__title">{{ title }}</h1>
      <p v-if="subtitle" class="sbar__sub">{{ subtitle }}</p>
      <slot />
    </div>
    <slot name="action" />
  </header>
</template>