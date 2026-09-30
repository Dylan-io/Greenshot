<!--
  ═══════════════════════════════════════════════════════════════════════
  SiteImmersif — composant racine. NE JAMAIS MODIFIER.
  ═══════════════════════════════════════════════════════════════════════
  Rôle unique : monter le moteur d'animation canonique dans Vue.

  Le moteur (engine/app.js) est un IIFE impératif qui pilote le scroll et
  écrit directement dans le DOM. Il n'est PAS un composant Vue et ne le
  deviendra pas. La stratégie est donc la suivante :

    1. engine/template.html est injecté en une seule fois via v-html.
    2. engine/content.js remplit ce DOM juste après le montage.
    3. engine/app.js est importé APRÈS, au montage, parce qu'il cherche
       #smooth dans le document dès son exécution.

  Pourquoi `raw` n'est jamais modifié : le template ne contient aucune
  liaison réactive ({{ }}, v-if, v-for). Vue n'a donc jamais de raison de
  re-patcher ce sous-arbre, et les mutations faites par le moteur y
  survivent. Si l'on ajoutait une seule liaison ici, Vue écraserait au
  prochain tick le travail du moteur et les scènes casseraient.

  Pourquoi l'import dynamique de app.js : un import statique serait
  évalué au chargement du module, avant le montage, quand #smooth
  n'existe pas encore. app.js ferait alors `const wrapper = $('#smooth')`
  → null, et le site resterait figé, sans aucune animation.
-->
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import template from './engine/template.html?raw'
import { injectSiteContent } from './engine/content.js'
import './engine/styles.css'

// Jamais réassigné : c'est ce qui empêche Vue de re-patcher le DOM du moteur.
const raw = ref(template)

let restoreBody = null

onMounted(async () => {
  // 1. Snapshot de l'état du <body> AVANT que le moteur ne le touche.
  //    app.js y pose une hauteur en px inline et des classes
  //    (is-smooth, is-ready, is-scrolled, static, handoff) qu'il ne retire
  //    jamais. Sans ce snapshot, un démontage laisserait le document
  //    verROUILLÉ à une hauteur arbitraire.
  restoreBody = snapshotBody()

  // 2. Remplissage du DOM depuis content.js.
  injectSiteContent(document)

  // 3. Démarrage du moteur. DOIT rester après le 1 et le 2.
  await import('./engine/app.js')
})

onBeforeUnmount(() => {
  restoreBody?.()
  restoreBody = null
})

/**
 * Capture l'état du <body> et renvoie sa restauration.
 * Limite connue : app.js n'expose aucune API de destruction. Ses écouteurs
 * (mousemove ×2, resize) et sa boucle requestAnimationFrame survivent au
 * démontage. C'est acceptable tant que ce site est une page entière
 * (cf. README du skill). Ne pas l'insérer comme simple composant au milieu
 * d'un layout existant sans lui ajouter d'abord un vrai teardown.
 */
function snapshotBody() {
  const body = document.body
  const prevInlineHeight = body.style.height
  const prevClasses = new Set(body.classList)

  return () => {
    body.style.height = prevInlineHeight
    for (const cls of [...body.classList]) {
      if (!prevClasses.has(cls)) body.classList.remove(cls)
    }
  }
}
</script>

<template>
  <div v-html="raw"></div>
</template>
