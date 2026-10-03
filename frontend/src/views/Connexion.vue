<template>
  <AuthShell
    titre="Connexion"
    texte="Entrez votre e-mail ou votre nom d'utilisateur, et votre mot de passe."
    cta="Se connecter"
    libelle-retour="Retour"
    :erreur="messageErreur"
    :succes="messageSucces"
    :envoi-en-cours="envoiEnCours"
    etape="1 / 5"
    @suivant="seConnecter"
    @retour="router.push('/')"
  >
    <template #corps>
      <form class="form" novalidate @submit.prevent="seConnecter">
        <!-- Un seul champ : on détecte e-mail ou username à la volée.
             Le placeholder ne change pas, c'est l'icône qui le dit. -->
        <AuthField
          v-model="identifiant"
          label="E-mail ou nom d'utilisateur"
          icone="M3 7h18v10H3zM3 7l9 6 9-6M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM4 21a8 8 0 0 1 16 0"
          placeholder="vous@exemple.bi"
          autocomplete="username"
        />

        <AuthField
          v-model="password"
          label="Mot de passe"
          type="password"
          icone="M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z"
          autocomplete="current-password"
          :erreur="erreurPassword"
        />

        <div class="form__lien">
          <router-link to="/mot-de-passe-oublie" class="form__oublie">
            Mot de passe oublié
          </router-link>
        </div>
      </form>
    </template>

    <template #pied>
      <p v-if="!emailVerifie" class="note">
        Vous n'avez pas vérifié votre adresse ? Vous pouvez parcourir l'application,
        mais pas signaler de déchet.
        <button type="button" class="note__btn" @click="renvoyer">Renvoyer l'email</button>
      </p>
    </template>
  </AuthShell>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import AuthShell from '../components/AuthShell.vue'
import AuthField from '../components/AuthField.vue'

const router = useRouter()
const userStore = useUserStore()

const identifiant = ref('')
const password = ref('')
const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')
const erreurPassword = ref('')
const emailVerifie = ref(false)

// Un username ne contient pas d'@, un e-mail toujours. C'est la seule
// distinction nécessaire ici : Supabase Auth ne connaît que l'e-mail,
// le username est résolu ensuite via le RPC obtenir_email_par_username().
function estEmail(v) {
  return v.includes('@')
}

async function seConnecter() {
  messageErreur.value = ''
  erreurPassword.value = ''

  const id = identifiant.value.trim()
  if (!id || !password.value) {
    messageErreur.value = 'Renseignez votre identifiant et votre mot de passe.'
    return
  }

  envoiEnCours.value = true
  try {
    const result = estEmail(id)
      ? await userStore.seConnecterEmail(id, password.value)
      : await userStore.seConnecterUsername(id, password.value)

    if (result.error) {
      if (/invalid login credentials/i.test(result.error.message)) {
        // Message volontairement identique dans les deux cas : dire
        // « e-mail inconnu » permet d'énumérer les comptes existants.
        erreurPassword.value = 'Identifiant ou mot de passe incorrect.'
      } else {
        messageErreur.value = result.error.message
      }
      return
    }

    emailVerifie.value = userStore.profile?.email_verified === true
    router.push('/')
  } catch (err) {
    messageErreur.value = err.message || 'Connexion impossible. Réessayez.'
  } finally {
    envoiEnCours.value = false
  }
}

async function renvoyer() {
  const result = await userStore.renvoyerVerification()
  messageErreur.value = result?.error?.message || ''
  if (!result?.error) messageSucces.value = 'Email de vérification renvoyé.'
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 24px;
  margin-top: 34px;
}

/* Le lien « mot de passe oublié » est aligné à droite, juste sous le
   champ, pas isolé en bas de page : c'est là qu'on le cherche. */
.form__lien {
  display: flex;
  justify-content: flex-end;
  margin-top: -12px;
}

.form__oublie {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--sprout);
}

.form__oublie:hover {
  text-decoration: underline;
}

.note {
  margin: 26px 0 0;
  padding: 13px 15px;
  border-radius: var(--r-xs);
  background: rgba(242, 193, 78, 0.1);
  border: 1px solid rgba(242, 193, 78, 0.28);
  color: var(--fern);
  font-size: 13px;
  line-height: 1.5;
}

.note__btn {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--amber);
}
</style>