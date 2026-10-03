<template>
  <!-- Carrousel plein écran. Pas de barre d'application ni de navigation :
       c'est une entrée dans le produit, pas une page à côté des autres. -->
  <div class="onb">
    <header class="onb__bar">
      <button
        v-if="etape > 0"
        type="button"
        class="onb__back"
        aria-label="Étape précédente"
        @click="etape--"
      >
        <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 5-7 7 7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="onb__prog">
        <span class="onb__num">{{ etape + 1 }} / {{ etapes.length }}</span>
        <span class="onb__dots" aria-hidden="true">
          <i v-for="(e, i) in etapes" :key="i" class="onb__dot" :class="{ 'is-on': i <= etape }" />
        </span>
      </div>
    </header>

    <main class="onb__body">
      <!-- Carte icône : fond vert dégradé, icône lime centrée -->
      <div class="onb__visual">
        <svg class="onb__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path :d="page.icone" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <h1 class="onb__title">{{ page.titre }}</h1>
      <p class="onb__texte">{{ page.texte }}</p>

      <ul class="onb__infos">
        <li v-for="info in page.infos" :key="info.titre" class="onb__info">
          <span class="onb__info-ic" aria-hidden="true">
            <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
              <path :d="info.icone" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="onb__info-corps">
            <span class="onb__info-titre">{{ info.titre }}</span>
            <span class="onb__info-texte">{{ info.texte }}</span>
          </span>
        </li>
      </ul>
    </main>

    <footer class="onb__foot">
      <button type="button" class="btn btn--primary btn--block" @click="suivant">
        <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ page.cta }}
      </button>

      <button type="button" class="onb__skip" @click="passer">Passer la présentation</button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const CAMERA = 'M4 8h3l2-2h6l2 2h3v11H4zM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0z'
const FEUILLE = 'M12 21c-4 0-7-3-7-7 0-3 2-5 4-6 0-2 1-4 3-4s3 2 3 4c2 1 4 3 4 6 0 4-3 7-7 7z'
const TROPHY = 'M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 13v7'
const SPARKLE = 'M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z'
const CARTE = 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14'
const GOUTTE = 'M12 3c2 4 5 6.5 5 10a5 5 0 0 1-10 0c0-1.8 1.3-3 2.5-4.3C11.6 6.5 12 5 12 3z'
const PHOTO = 'M4 8h3l2-2h6l2 2h3v11H4zM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0z'

const etapes = [
  {
    icone: CAMERA,
    titre: 'Signalez en trois gestes',
    texte: 'Une photo, un type de déchet, une rue. Greenshot classe, situe et publie le signalement à votre place.',
    infos: [
      { icone: SPARKLE, titre: "L'IA lit la photo", texte: 'Plastique, verre, organique, e-waste : la catégorie est proposée, vous corrigez si besoin.' },
      { icone: CARTE, titre: 'La carte se remplit', texte: 'Votre quartier, vos signalements, ceux des voisins — en direct.' }
    ],
    cta: 'Continuer'
  },
  {
    icone: FEUILLE,
    titre: 'Nettoyez, et faites vérifier',
    texte: 'La preuve se prend avant et après. Greenshot mesure la distance entre les deux et ne valide que ce qui colle.',
    infos: [
      { icone: PHOTO, titre: 'Le lieu n’a pas changé', texte: 'Si l’endroit a bougé entre les deux photos, la validation est refusée.' }
    ],
    cta: 'Continuer'
  },
  {
    icone: TROPHY,
    titre: 'Montez de niveau',
    texte: 'Vos actions font une série, ouvrent des badges et vous placent dans le classement du quartier.',
    infos: [
      { icone: GOUTTE, titre: 'Une série de jour', texte: 'Contribuer chaque jour entretient la série affichée sur votre profil.' },
      { icone: TROPHY, titre: 'Un classement réel', texte: 'Par quartier ou parmi vos amis, avec votre place et l’écart de points.' }
    ],
    cta: 'Créer mon compte'
  }
]

const etape = ref(0)
const page = computed(() => etapes[etape.value])

function suivant() {
  // L'étape 3 est la sortie du parcours : elle mène à l'inscription.
  if (etape.value === etapes.length - 1) {
    router.push('/inscription')
    return
  }
  etape.value++
}

function passer() {
  router.push('/')
}
</script>

<style scoped>
.onb {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background:
    radial-gradient(circle at 50% -8%, rgba(104, 239, 63, 0.12), transparent 42%),
    var(--forest-3);
  color: var(--white);
  overflow-y: auto;
}

.onb__bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: calc(30px + env(safe-area-inset-top)) 20px 0;
}

.onb__back {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--white);
}

.onb__back:hover {
  border-color: var(--line-2);
}

.onb__prog {
  display: grid;
  justify-items: end;
  gap: 7px;
}

.onb__num {
  font-size: 12px;
  color: var(--lichen);
  font-variant-numeric: tabular-nums;
}

.onb__dots {
  display: flex;
  gap: 5px;
}

/* La pastille du pas courant est la plus large : c'est la lecture
   « 1 / 3 » de la capture, pas trois ronds identiques. */
.onb__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--line-2);
  transition: width var(--dur-2) var(--ease-out);
}

.onb__dot.is-on {
  background: var(--sprout);
}

.onb__dot:last-child.is-on {
  width: 18px;
}

.onb__body {
  width: min(100%, 660px);
  margin: 0 auto;
  padding: 40px 28px 24px;
}

.onb__visual {
  display: grid;
  place-items: center;
  height: 170px;
  border-radius: var(--r-card);
  background: linear-gradient(140deg, rgba(38, 162, 0, 0.22), rgba(18, 35, 20, 0.5));
}

.onb__icon {
  width: 54px;
  height: 54px;
  color: var(--sprout);
}

.onb__title {
  margin: 26px 0 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(30px, 8vw, 44px);
  line-height: 1.05;
  letter-spacing: -0.025em;
}

.onb__texte {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--white);
  max-width: 30ch;
}

.onb__infos {
  list-style: none;
  margin: 32px 0 0;
  padding: 0;
  display: grid;
  gap: 22px;
}

.onb__info {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.onb__info + .onb__info {
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.onb__info-ic {
  width: 38px;
  height: 38px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(104, 239, 63, 0.12);
  color: var(--sprout);
}

.onb__info-corps {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.onb__info-titre {
  font-size: 15px;
  font-weight: 600;
}

.onb__info-texte {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--fern);
}

.onb__foot {
  width: min(100%, 660px);
  margin: 0 auto;
  padding: 0 28px calc(28px + env(safe-area-inset-bottom));
  display: grid;
  gap: 16px;
}

.onb__skip {
  justify-self: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--white);
  padding: 8px 12px;
}

.onb__skip:hover {
  color: var(--sprout);
}
</style>