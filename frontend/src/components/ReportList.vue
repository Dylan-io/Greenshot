<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] }
})
defineEmits(['select'])

const TRACES = {
  plastique: 'M9 3h6l-1 3h3l-3 15H10L7 6h3z',
  verre: 'M8 3h8l-1 7 3 4v7H6v-7l3-4z',
  megots: 'M4 18h16v2H4zM7 14h10v3H7zM9 9h6v4H9z',
  ordures: 'M6 8h12l-1 13H7zM9 5V3h6v2M9 11v7M15 11v7',
  organique: 'M12 21c-4 0-7-3-7-7 0-3 2-5 4-6 0-2 1-4 3-4s3 2 3 4c2 1 4 3 4 6 0 4-3 7-7 7z'
}

function tracer(type) {
  const t = String(type || '').toLowerCase()
  if (t.includes('plastique') || t.includes('bouteille')) return TRACES.plastique
  if (t.includes('verre')) return TRACES.verre
  if (t.includes('mégot') || t.includes('megot') || t.includes('cigarette')) return TRACES.megots
  if (t.includes('organique') || t.includes('manger')) return TRACES.organique
  return TRACES.ordures
}

const itemsAvecTrace = computed(() =>
  props.items.map((item) => ({ ...item, trace: tracer(item.type) }))
)
</script>

<template>
  <div class="gs-stack">
    <button
      v-for="item in itemsAvecTrace"
      :key="item.id"
      type="button"
      class="rowcard"
      @click="$emit('select', item)"
    >
      <span class="rowcard__icon" aria-hidden="true">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path :d="item.trace" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>

      <span class="rowcard__body">
        <span class="rowcard__title">{{ item.type }}</span>
        <span class="rowcard__sub">{{ item.lieu }} · {{ item.ago }}</span>
      </span>

      <span class="rowcard__meta">
        <span class="pill pill--dark"><span class="pill__dot" />{{ item.statut }}</span>
        <span v-if="item.pts" class="rowcard__pts">+{{ item.pts }} pts</span>
      </span>
    </button>
  </div>
</template>