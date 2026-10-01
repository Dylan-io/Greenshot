<template>
  <span
    v-if="svg"
    class="icone"
    :class="`icone--${nomResolu}`"
    :style="taille ? { width: taille, height: taille } : null"
    aria-hidden="true"
    v-html="svg"
  />
</template>

<script setup>
import { computed } from 'vue'

/**
 * Jeu d'icônes Greenshot — remplace les emojis par des SVG vectoriels.
 * Style identique à BottomNav.vue : viewBox 24x24, contours currentColor.
 * La taille suit la police (1em) pour s'insérer dans le texte sans le casser.
 */
const props = defineProps({
  nom: { type: String, required: true },
  taille: { type: String, default: '' }, // ex : '15px'
  trait: { type: [String, Number], default: 2 } // épaisseur du contour
})

// Les anciennes versions du store fournissent des emojis : on les traduit
// pour éviter une icône manquante si le store n'a pas encore été rechargé.
const EQUIVALENTS = {
  '🥤': 'bouteille', '⚠️': 'alerte', '⚠': 'alerte', '💧': 'goutte',
  '🌳': 'arbre', '📍': 'localisation', '♻️': 'recyclage', '♻': 'recyclage',
  '🗑️': 'dechet', '🧹': 'balai', '🌱': 'feuille', '🌿': 'feuille',
  '🏆': 'trophee', '🌍': 'globe', '👑': 'couronne', '📸': 'image',
  '📷': 'appareil_photo', '🤖': 'robot', '✨': 'etincelles', '🎉': 'celebration',
  '🔄': 'rafraichir', '↺': 'rafraichir', '🔍': 'recherche', '📡': 'navigation',
  '🛰️': 'navigation', '✅': 'succes', '❌': 'erreur', '✓': 'coherent',
  '❓': 'question', '←': 'fleche_gauche', '→': 'fleche_droite', '✕': 'fermer'
}

const TRACES = {
  // --- Navigation & actions ---
  fleche_gauche: '<path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>',
  fleche_droite: '<path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/>',
  fermer: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
  rafraichir: '<path d="M21 4v6h-6"/><path d="M3 20v-6h6"/><path d="M20.5 10a8.5 8.5 0 0 0-14.2-4.8L3 9"/><path d="M3.5 14a8.5 8.5 0 0 0 14.2 4.8L21 15"/>',
  recherche: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
  calendrier: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',

  // --- Localisation & GPS ---
  localisation: '<path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  navigation: '<path d="M3 11l19-9-9 19-2-8-8-2z"/>',
  horloge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',

  // --- Médias ---
  appareil_photo: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',

  // --- États de contrôle ---
  succes: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  verification: '<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.3 2.3 4.3-4.6"/>',
  erreur: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
  alerte: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4.5"/><path d="M12 17.2h.01"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.2a3 3 0 0 1 5.8 1c0 2-3 2.8-3 2.8"/><path d="M12 17h.01"/>',
  celebration: '<path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18.5 15.5l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z"/><path d="M5 2v3M3.5 3.5h3"/>',
  etincelles: '<path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18.5 15.5l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z"/>',
  coherent: '<path d="M20 6L9 17l-5-5"/>',

  // --- Environnement ---
  dechet: '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M5.5 6l1 14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-14"/><path d="M10 11v6M14 11v6"/>',
  recyclage: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 16"/><path d="M4 20v-4h4"/>',
  feuille: '<path d="M20 4C10 4 4 8 4 16"/><path d="M20 4c0 8-5 14-13 15"/><path d="M5 20c2-6 7-11 13-13"/>',
  arbre: '<path d="M12 2l4.5 6h-2.6l3.6 5.5H14V22h-4v-8.5H5.5L9.1 8H6.5z"/>',
  goutte: '<path d="M12 2.7l5.7 5.6a8 8 0 1 1-11.4 0z"/>',
  bouteille: '<path d="M9 2h6v3.5l-1 1.5V20a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V7L9 5.5V2z"/><path d="M8 11h8"/>',
  balai: '<path d="M18.5 2.5l-8.6 8.6"/><path d="M12.2 8.8l3 3"/><path d="M10.4 10.6L4 17a3 3 0 0 0 4.2 4.2l6.4-6.4z"/>',

  // --- Citoyenneté & encouraged ---
  robot: '<path d="M12 8V4.5H8.5"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 13v2M15 13v2"/><path d="M2 14h2M20 14h2"/>',
  trophee: '<path d="M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 3"/><path d="M17 6h3a3 3 0 0 1-3 3"/><path d="M12 15v4"/><path d="M8 21h8"/>',
  couronne: '<path d="M3 8l3.6 3L12 4l5.4 7L21 8l-1.5 11h-15L3 8z"/><path d="M4.5 22h15"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>',
  utilisateur: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>'
}

const nomResolu = computed(() => {
  const nom = props.nom || ''
  return EQUIVALENTS[nom] || nom
})

const svg = computed(() => {
  const traces = TRACES[nomResolu.value]
  // Nom inconnu : on ne dessine rien plutôt qu'une icône trompeuse
  if (!traces) return ''
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${props.trait}" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%">${traces}</svg>`
})
</script>

<style scoped>
.icone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  vertical-align: -0.14em;
  line-height: 0;
}
</style>
