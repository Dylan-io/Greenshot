<template>
  <span :class="['badge-statut', `statut-${statutClass}`]">
    {{ statutTexte }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  statut: {
    type: String,
    default: 'en attente'
  }
})

const statutClass = computed(() => {
  if (props.statut === 'traité') return 'traite'
  if (props.statut === 'nettoyé') return 'nettoye'
  if (props.statut === 'vu') return 'vu'
  return 'en-attente'
})

const statutTexte = computed(() => {
  if (props.statut === 'traité') return 'Traité'
  if (props.statut === 'nettoyé') return 'Nettoyé'
  if (props.statut === 'vu') return 'Vu'
  return 'En attente'
})
</script>

<style scoped>
.badge-statut {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: capitalize;
  line-height: 1.2;
}

/* En attente : Terre cuite (#B5502F) */
.statut-en-attente {
  background-color: #FBEBE8;
  color: #B5502F;
  border: 1px solid #F3C3B6;
}

/* Vu : Ciel (#3E7CA6) */
.statut-vu {
  background-color: #EBF4F9;
  color: #3E7CA6;
  border: 1px solid #BEDAEB;
}

/* Nettoyé : Ambre (#E8A33D) */
.statut-nettoye {
  background-color: #FDF6EB;
  color: #C07912;
  border: 1px solid #F6D7A4;
}

/* Traité : Forêt (#1F4D3A) */
.statut-traite {
  background-color: #E8F2ED;
  color: #1F4D3A;
  border: 1px solid #A4CCB9;
}
</style>
