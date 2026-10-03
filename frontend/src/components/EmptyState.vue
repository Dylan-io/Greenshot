<script setup>
defineProps({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  text: { type: String, default: '' },
  actionLabel: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<template>
  <div class="empty">
    <span class="empty__icon" aria-hidden="true">
      <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M3 7h18M8 7V5h8v2M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <p class="empty__title">{{ title }}</p>
    <p v-if="text" class="empty__text">{{ text }}</p>
    <button v-if="actionLabel" type="button" class="btn btn--primary btn--sm" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>