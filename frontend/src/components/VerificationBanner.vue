<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '../stores/userStore'

const userStore = useUserStore()
const profile = computed(() => userStore.profile || {})
const busy = ref(false)
const message = ref('')

const shown = computed(
  () => userStore.isAuthenticated && profile.value.email_verified === false
)

async function resend() {
  busy.value = true
  message.value = ''
  const result = await userStore.renvoyerVerification()
  message.value = result?.message || (result?.ok ? 'Email renvoyé.' : 'Envoi impossible.')
  busy.value = false
}
</script>

<template>
  <div v-if="shown" class="vbanner">
    <p class="vbanner__text">
      Votre adresse email n'est pas vérifiée. Vous pouvez parcourir l'application, mais
      pour <strong>signaler un déchet</strong> et <strong>valider un nettoyage</strong>, ouvrez
      le lien reçu par email.
    </p>
    <button type="button" class="btn btn--secondary btn--sm" :disabled="busy" @click="resend">
      {{ busy ? 'Envoi…' : 'Renvoyer l\'email' }}
    </button>
    <p v-if="message" class="vbanner__msg" role="status">{{ message }}</p>
  </div>
</template>

<style scoped>
.vbanner {
  grid-area: nav;
  align-self: end;
  display: grid;
  gap: 10px;
  padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
  background: var(--amber);
  color: var(--onyx);
}

.vbanner__text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
}

.vbanner__text strong {
  font-weight: 700;
}

.vbanner .btn--secondary {
  color: var(--onyx);
  border-color: rgba(48, 50, 42, 0.35);
  justify-self: start;
}

.vbanner .btn--secondary:hover {
  color: var(--onyx);
  background: rgba(48, 50, 42, 0.1);
  border-color: var(--onyx);
}

.vbanner__msg {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
}
</style>