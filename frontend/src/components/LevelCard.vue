<script setup>
defineProps({
  niveau: { type: Number, default: 1 },
  rang: { type: String, default: 'Éclaireur vert' },
  points: { type: Number, default: 0 },
  seuil: { type: Number, default: 250 }
})
const emit = defineEmits(['signaler', 'carte'])

const ratio = (v, max) => `${Math.min(100, Math.round((v / max) * 100))}%`
</script>

<template>
  <section class="hero-card" aria-labelledby="hero-lvl">
    <p id="hero-lvl" class="hero-card__lvl">
      <svg class="ic ic--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22c5-3 8-7 8-12a8 8 0 1 0-16 0c0 5 3 9 8 12Z" />
      </svg>
      Niveau {{ niveau }} · {{ rang }}
    </p>

    <p class="hero-card__pts">
      {{ points }}<small>pts</small>
    </p>

    <p class="hero-card__to-next">
      Encore {{ Math.max(0, seuil - points) }} pts pour le niveau {{ niveau + 1 }}
    </p>

    <div class="xp">
      <i class="xp__fill" :style="{ width: ratio(points, seuil) }" />
    </div>

    <div class="hero-card__actions">
      <button type="button" class="btn btn--light" @click="emit('signaler')">
        <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
          <path d="M4 8h3l2-2h6l2 2h3v11H4z" stroke-linejoin="round" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
        Signaler un déchet
      </button>
      <button type="button" class="btn btn--secondary" @click="emit('carte')">
        <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" stroke-linejoin="round" />
          <path d="M9 4v14M15 6v14" />
        </svg>
        Carte
      </button>
    </div>
  </section>
</template>