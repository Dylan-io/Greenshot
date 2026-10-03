<script setup>
const props = defineProps({
  entries: { type: Array, default: () => [] }
})

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const series = () => {
  const base = new Array(7).fill(0)
  for (const e of props.entries) {
    const i = JOURS.indexOf(String(e.jour || '').charAt(0))
    if (i >= 0) base[i] += 1
  }
  return base
}

const data = series()
const max = Math.max(1, ...data)
const total = data.reduce((a, b) => a + b, 0)
const actifs = data.filter((n) => n > 0).length

// Intensité 0.12 → 1 selon le ratio. Le vide reste visible : c'est
// l'absence d'action, pas une case manquante.
function niveau(n) {
  if (n === 0) return 0
  return Math.round(0.25 + (n / max) * 0.75)
}
</script>

<template>
  <section aria-labelledby="sec-activite">
    <div class="h-sec">
      <h2 id="sec-activite" class="h-sec__title">Votre activité</h2>
      <span class="dim" style="font-size: 13px">7 derniers jours</span>
    </div>

    <div class="card">
      <div
        class="heat"
        role="img"
        :aria-label="`Contributions sur 7 jours : ${total} actions, ${actifs} jours actifs`"
      >
        <div v-for="(n, i) in data" :key="i" class="heat__cell" :style="{ '--n': niveau(n) }">
          <span class="heat__day">{{ JOURS[i] }}</span>
        </div>
      </div>

      <p class="heat__foot">
        <span v-if="total">
          <strong>{{ actifs }}</strong> jour{{ actifs > 1 ? 's' : '' }} sur 7 ·
          {{ total }} action{{ total > 1 ? 's' : '' }}
        </span>
        <span v-else>
          Aucune action cette semaine. Votre première contribution apparaîtra ici.
        </span>
        <span class="heat__legend" aria-hidden="true">
          <span class="dim">Moins</span>
          <i v-for="i in 4" :key="i" class="heat__swatch" :style="{ '--n': i / 4 }" />
          <span class="dim">Plus</span>
        </span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.heat {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.heat__cell {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 7px;
  min-height: 92px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--sprout) calc(var(--n) * 100%), var(--panel));
}

.heat__cell[style*='--n: 0'] {
  background: var(--panel);
}

.heat__day {
  font-size: 12px;
  font-weight: 600;
  color: var(--lichen);
  text-align: center;
}

.heat__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin: 16px 0 0;
  font-size: 13.5px;
  color: var(--fern);
}

.heat__foot strong {
  color: var(--white);
  font-weight: 700;
}

.heat__legend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
}

.heat__swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--sprout) calc(var(--n) * 100%), var(--panel));
  border: 1px solid var(--line);
}
</style>