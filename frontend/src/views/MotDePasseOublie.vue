<template>
  <!-- ═══ Étape 1 — l'adresse du compte ════════════════════════════════════ -->
  <AuthShell
    v-if="etape === 1"
    titre="Mot de passe oublié"
    texte="Indiquez l'adresse e-mail de votre compte Greenshot. Nous vous envoyons un code pour le réinitialiser."
    cta="Envoyer le code"
    libelle-retour="Retour"
    :erreur="messageErreur"
    :envoi-en-cours="envoiEnCours"
    etape="1 / 3"
    @suivant="envoyerCode"
    @retour="router.push('/connexion')"
  >
    <template #corps>
      <form class="form" novalidate @submit.prevent="envoyerCode">
        <AuthField
          v-model="email"
          label="Adresse e-mail"
          type="email"
          icone="M3 7h18v10H3zM3 7l9 6 9-6"
          placeholder="vous@exemple.bi"
          autocomplete="email"
          inputmode="email"
        />
      </form>
    </template>
  </AuthShell>

  <!-- ═══ Étape 2 — le code reçu par e-mail ════════════════════════════════ -->
  <AuthShell
    v-else-if="etape === 2"
    titre="Vérifiez votre adresse"
    :texte="`Un code à 6 chiffres a été envoyé à ${email}. Saisissez-le pour continuer.`"
    cta="Vérifier le code"
    libelle-retour="Retour"
    :erreur="messageErreur"
    :envoi-en-cours="envoiEnCours"
    etape="2 / 3"
    @suivant="verifierCode"
    @retour="etape = 1"
  >
    <template #corps>
      <form class="form" novalidate @submit.prevent="verifierCode">
        <AuthField
          v-model="code"
          label="Code de vérification"
          icone="M4 10 12 4l8 6v9H4zM9 19v-6h6v6"
          placeholder="000000"
          inputmode="numeric"
          autocomplete="one-time-code"
          :erreur="erreurCode"
        />

        <!-- Renvoyer : c'est le geste que l'on cherche quand le code
             n'arrive pas. Passé 45 s, on ne le propose plus : l'e-mail
             finit toujours par arriver. -->
        <p v-if="peutRenvoyer" class="renvoi">
          Code expiré ou jamais reçu ?
          <button type="button" class="renvoi__btn" :disabled="envoiEnCours" @click="renvoyer">
            Renvoyer le code
          </button>
        </p>
        <p v-else class="renvoi renvoi--attente">Nouveau code disponible dans {{ secondesRestantes }} s.</p>
      </form>
    </template>
  </AuthShell>

  <!-- ═══ Étape 3 — le nouveau mot de passe ════════════════════════════════ -->
  <AuthShell
    v-else
    titre="Nouveau mot de passe"
    texte="Choisissez un mot de passe d'au moins 8 caractères. Vous serez connecté automatiquement."
    cta="Enregistrer"
    libelle-retour="Retour"
    :erreur="messageErreur"
    :succes="messageSucces"
    :envoi-en-cours="envoiEnCours"
    etape="3 / 3"
    @suivant="enregistrer"
    @retour="etape = 1"
  >
    <template #corps>
      <form class="form" novalidate @submit.prevent="enregistrer">
        <AuthField
          v-model="password"
          label="Mot de passe"
          type="password"
          icone="M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z"
          placeholder="8 caractères minimum"
          autocomplete="new-password"
          :erreur="erreurPassword"
        />
      </form>
    </template>
  </AuthShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { supabase, supabaseConfigured } from '../services/supabaseClient'
import AuthShell from '../components/AuthShell.vue'
import AuthField from '../components/AuthField.vue'

const router = useRouter()
const userStore = useUserStore()

const etape = ref(1)
const email = ref('')
const code = ref('')
const password = ref('')

const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')
const erreurCode = ref('')
const erreurPassword = ref('')

const DELAI_RENOUVOI = 45
const secondesRestantes = ref(DELAI_RENOUVOI)
const peutRenvoyer = computed(() => secondesRestantes.value === 0)

let minuterie = null

// Si le visiteur arrive envenance du lien de l'e-mail, Supabase a déjà
// échangé le jeton contre une session : il n'y a rien à lui demander, il
// passe directement au nouveau mot de passe.
onMounted(async () => {
  if (!supabaseConfigured) {
    messageErreur.value = 'Service de connexion indisponible. Réessayez plus tard.'
  }

  const { data } = await supabase.auth.getSession()
  if (data.session) {
    // On mémorise l'adresse de la session : c'est elle qu'on vérifie à
    // l'étape 2 si l'utilisateur revient en arrière.
    if (data.session.user.email) email.value = data.session.user.email
    etape.value = 3
    demarrerCompteARebours()
  }
})

onBeforeUnmount(() => {
  if (minuterie) clearInterval(minuterie)
})

function demarrerCompteARebours() {
  secondesRestantes.value = DELAI_RENOUVOI
  if (minuterie) clearInterval(minuterie)
  minuterie = setInterval(() => {
    if (secondesRestantes.value > 0) secondesRestantes.value -= 1
    if (secondesRestantes.value === 0 && minuterie) {
      clearInterval(minuterie)
      minuterie = null
    }
  }, 1000)
}

async function envoyerCode() {
  messageErreur.value = ''

  const adresse = email.value.trim()
  if (!adresse.includes('@')) {
    messageErreur.value = 'Renseignez une adresse e-mail valide.'
    return
  }

  envoiEnCours.value = true
  try {
    const { error } = await userStore.demanderReinitialisation(
      adresse,
      `${window.location.origin}/mot-de-passe-oublie`
    )
    if (error) throw error

    etape.value = 2
    demarrerCompteARebours()
  } catch (err) {
    messageErreur.value = messageLisible(err)
  } finally {
    envoiEnCours.value = false
  }
}

async function renvoyer() {
  messageErreur.value = ''
  envoiEnCours.value = true
  try {
    const { error } = await userStore.demanderReinitialisation(
      email.value.trim(),
      `${window.location.origin}/mot-de-passe-oublie`
    )
    if (error) throw error
    messageSucces.value = 'Nouveau code envoyé.'
  } catch (err) {
    messageErreur.value = messageLisible(err)
  } finally {
    envoiEnCours.value = false
    demarrerCompteARebours()
  }
}

async function verifierCode() {
  messageErreur.value = ''
  erreurCode.value = ''

  // Supabase n'accepte que les chiffres du token. On retire les espaces de
  // saisie au passage : « 123 456 » est un code valide tapé au téléphone.
  const token = code.value.replace(/\D/g, '')
  if (token.length !== 6) {
    erreurCode.value = 'Le code comporte 6 chiffres.'
    return
  }

  envoiEnCours.value = true
  try {
    const { error } = await userStore.verifierCodeRecuperation(email.value.trim(), token)
    if (error) throw error

    etape.value = 3
    demarrerCompteARebours()
  } catch (err) {
    erreurCode.value = messageLisible(err)
  } finally {
    envoiEnCours.value = false
  }
}

async function enregistrer() {
  messageErreur.value = ''
  erreurPassword.value = ''

  if (password.value.length < 8) {
    erreurPassword.value = '8 caractères minimum.'
    return
  }

  envoiEnCours.value = true
  try {
    const { error } = await userStore.changerMotDePasse(password.value)
    if (error) throw error

    await userStore.chargerProfile()
    router.push('/')
  } catch (err) {
    const msg = messageLisible(err)
    // Un échec ici signifie le plus souvent que la session de récupération a
    // expiré : le retour à l'étape 2 est alors la seule sortie.
    erreurPassword.value = msg
    if (/expired|invalid|session/i.test(msg)) etape.value = 2
  } finally {
    envoiEnCours.value = false
  }
}

// Les messages d'erreur de Supabase sont en anglais et mentionnent parfois
// des noms de tables. On ne les montre jamais tels quels à un citoyen.
function messageLisible(err) {
  const msg = err?.message || ''

  if (/rate limit|too many/i.test(msg)) {
    return 'Trop de tentatives. Attendez une minute avant de réessayer.'
  }
  if (/expired/i.test(msg)) {
    return 'Ce code a expiré. Demandez-en un nouveau.'
  }
  if (/token|invalid/i.test(msg)) {
    return 'Code incorrect. Vérifiez les 6 chiffres.'
  }
  if (/not found|signups not allowed/i.test(msg)) {
    return 'Aucune erreur : si un compte existe à cette adresse, le code est envoyé.'
  }
  return 'Connexion impossible. Réessayez dans un instant.'
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 24px;
  margin-top: 34px;
}

.renvoi {
  margin: -8px 0 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--fern);
}

.renvoi__btn {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--sprout);
  text-decoration: underline;
}

.renvoi__btn:disabled {
  color: var(--lichen);
  cursor: not-allowed;
  text-decoration: none;
}

.renvoi--attente {
  color: var(--lichen);
}
</style>
