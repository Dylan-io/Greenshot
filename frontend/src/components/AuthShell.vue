<template>
  <div class="auth">
    <div class="auth__col">
      <p class="auth__step">1 / 5</p>

      <h1 class="auth__title">{{ titre }}</h1>
      <p class="auth__texte">{{ texte }}</p>

      <slot name="corps" />

      <p v-if="erreur" class="auth__msg auth__msg--err" role="alert">{{ erreur }}</p>
      <p v-if="succes" class="auth__msg auth__msg--ok" role="status">{{ succes }}</p>

      <button v-if="cta" type="button" class="btn btn--primary btn--block auth__cta" :disabled="envoiEnCours" @click="$emit('suivant')">
        {{ envoiEnCours ? 'En cours…' : cta }}
      </button>

      <button type="button" class="auth__retour" @click="$emit('retour')">{{ libelleRetour }}</button>

      <slot name="pied" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  titre: { type: String, required: true },
  texte: { type: String, default: '' },
  cta: { type: String, default: 'Continuer' },
  libelleRetour: { type: String, default: 'Retour' },
  erreur: { type: String, default: '' },
  succes: { type: String, default: '' },
  envoiEnCours: { type: Boolean, default: false },
  etape: { type: String, default: '1 / 5' }
})
defineEmits(['suivant', 'retour'])
</script>

<style scoped>
/* Colonne centrée étroite, fond vert quasi noir. Pas de barre d'application :
   le parcours d'authentification est hors du cadre de navigation. */
.auth {
  min-height: 100dvh;
  display: grid;
  place-items: start center;
  padding: calc(40px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 50% -8%, rgba(104, 239, 63, 0.1), transparent 42%),
    var(--forest-3);
  color: var(--white);
  overflow-y: auto;
}

.auth__col {
  width: min(100%, 660px);
  display: grid;
}

.auth__step {
  margin: 0 0 18px;
  font-size: 12px;
  color: var(--lichen);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.auth__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(32px, 8vw, 46px);
  line-height: 1.05;
  letter-spacing: -0.025em;
}

.auth__texte {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--white);
  max-width: 34ch;
}

.auth__cta {
  margin-top: 34px;
}

/* Sans CTA, le lien Retour remonte : sinon il flotte au milieu de l'écran
   dans une zone vide. */
.auth__retour:not(:has(~ .auth__cta)) {
  margin-top: 30px;
}

.auth__retour {
  justify-self: center;
  margin-top: 16px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--white);
}

.auth__retour:hover {
  color: var(--sprout);
}

.auth__msg {
  margin: 18px 0 0;
  padding: 11px 13px;
  border-radius: var(--r-xs);
  font-size: 13px;
  line-height: 1.5;
}

.auth__msg--err {
  background: rgba(255, 116, 82, 0.12);
  color: var(--danger);
  border: 1px solid rgba(255, 116, 82, 0.3);
}

.auth__msg--ok {
  background: rgba(104, 239, 63, 0.12);
  color: var(--sprout);
  border: 1px solid rgba(104, 239, 63, 0.3);
}
</style>