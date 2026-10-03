<template>
  <!-- ═══ Étape 1 — aiguillage ═══════════════════════════════════════════ -->
  <AuthShell
    v-if="etape === 0"
    titre="Votre compte Greenshot"
    texte="Votre profil, vos points et votre classement sont liés à ce compte. Un compte, un historique, sur tous vos appareils."
    cta=""
    libelle-retour="Retour"
    :erreur="messageErreur"
    etape="1 / 5"
    @retour="router.push('/onboarding')"
  >
    <template #corps>
      <div class="choix">
        <!-- Carte primaire verte : le chemin principal -->
        <button type="button" class="choix__carte choix__carte--on" @click="etape = 1">
          <span class="choix__ic" aria-hidden="true">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 5v14M5 12h14" stroke-linecap="round" />
            </svg>
          </span>
          <span class="choix__corps">
            <span class="choix__titre">Créer un compte</span>
            <span class="choix__sous">30 secondes, avec votre avatar</span>
          </span>
        </button>

        <!-- Carte secondaire sombre : le retour -->
        <button type="button" class="choix__carte" @click="router.push('/connexion')">
          <span class="choix__ic" aria-hidden="true">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" stroke-linecap="round" />
            </svg>
          </span>
          <span class="choix__corps">
            <span class="choix__titre">J’ai déjà un compte</span>
            <span class="choix__sous">Se connecter avec mon e-mail</span>
          </span>
        </button>
      </div>
    </template>
  </AuthShell>

  <!-- ═══ Étape 2 — identité ═════════════════════════════════════════════ -->
  <AuthShell
    v-else-if="etape === 1"
    titre="Créer votre compte"
    texte="Ces informations restent sur cet appareil dans cette démonstration."
    cta="Continuer"
    libelle-retour="Retour"
    :erreur="messageErreur"
    :succes="messageSucces"
    :envoi-en-cours="envoiEnCours"
    etape="2 / 5"
    @suivant="validerIdentite"
    @retour="etape = 0"
  >
    <template #corps>
      <form class="champs" novalidate @submit.prevent="validerIdentite">
        <AuthField
          v-model="nom"
          label="Nom complet"
          icone="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0"
          placeholder="Ex. Camille Mukamana"
          autocomplete="name"
        />

        <AuthField
          v-model="email"
          label="Adresse e-mail"
          type="email"
          icone="M3 7h18v10H3zM3 7l9 6 9-6"
          placeholder="vous@exemple.bi"
          autocomplete="email"
          inputmode="email"
        />

        <!-- Indicatif + numéro : deux champs juxtaposés, le sélecteur plus étroit -->
        <div class="champs__paire">
          <label class="paire">
            <span class="paire__label">Indicatif</span>
            <span class="paire__box">
              <select v-model="indicatif" class="paire__select">
                <option value="+257">+257</option>
              </select>
              <svg class="ic ic--xs paire__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>

          <AuthField
            v-model="phone"
            label="Téléphone"
            icone="M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"
            placeholder="79 12 345"
            autocomplete="tel"
            inputmode="tel"
          />
        </div>

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

  <!-- ═══ Étape 3 — avatar ═══════════════════════════════════════════════ -->
  <AuthShell
    v-else
    titre="Votre avatar"
    texte="Un avatar est créé automatiquement à l'inscription. Vous pourrez le changer, ou ajouter une photo, depuis votre profil."
    cta="Entrer dans Greenshot"
    libelle-retour="Retour"
    :erreur="messageErreur"
    :envoi-en-cours="envoiEnCours"
    etape="3 / 5"
    @suivant="finaliser"
    @retour="etape = 1"
  >
    <template #corps>
      <div class="av">
        <!-- Carte de l'avatar courant -->
        <div class="av__courant">
          <span class="av__vignette">
            <img :src="avatarChoisi" alt="Avatar sélectionné" />
            <span class="av__badge" aria-hidden="true">1</span>
          </span>
          <span class="av__corps">
            <span class="av__titre">Avatar Greenshot</span>
            <span class="av__sous">Dessiné dans vos couleurs, aucun réseau</span>
          </span>
          <button type="button" class="av__photo">
            <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 8h3l2-2h6l2 2h3v11H4z" stroke-linejoin="round" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
            Photo
          </button>
        </div>

        <!-- Grille de choix : 2 rangées de 4 -->
        <div class="av__grille">
          <button
            v-for="a in avatars"
            :key="a"
            type="button"
            class="av__choix"
            :class="{ 'is-on': avatarChoisi === `/avatars/${a}` }"
            :aria-pressed="avatarChoisi === `/avatars/${a}`"
            :aria-label="`Choisir l'avatar ${a}`"
            @click="avatarChoisi = `/avatars/${a}`"
          >
            <img :src="`/avatars/${a}`" alt="" />
          </button>
        </div>
      </div>
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

const etape = ref(0)
const nom = ref('')
const email = ref('')
const indicatif = ref('+257')
const phone = ref('')
const password = ref('')
const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')
const erreurPassword = ref('')

const avatars = [
  'avatar-benevole.svg',
  'avatar-sofia.svg',
  'avatar-camille.svg',
  'avatar-lea.svg',
  'avatar-nadia.svg',
  'avatar-marc.svg',
  'avatar-yanis.svg',
  'avatar-eric.svg'
]

const avatarChoisi = ref('/avatars/avatar-benevole.svg')

function validerIdentite() {
  messageErreur.value = ''
  erreurPassword.value = ''

  if (!nom.value.trim()) {
    messageErreur.value = 'Renseignez votre nom complet.'
    return
  }
  if (!email.value.trim() || !email.value.includes('@')) {
    messageErreur.value = 'Renseignez une adresse e-mail valide.'
    return
  }
  if (!phone.value.trim()) {
    messageErreur.value = 'Renseignez votre numéro de téléphone.'
    return
  }
  if (password.value.length < 8) {
    erreurPassword.value = '8 caractères minimum.'
    return
  }

  etape.value = 2
}

async function finaliser() {
  envoiEnCours.value = true
  messageErreur.value = ''
  messageSucces.value = ''

  try {
    const { error } = await userStore.inscrire(
      email.value.trim(),
      password.value,
      nom.value.trim(),
      `${indicatif.value} ${phone.value.trim()}`
    )

    if (error) throw error

    // L'avatar choisi est stocké dans le profil une fois le compte créé.
    try {
      await userStore.mettreAJourProfil({ username: '' })
    } catch {
      /* le trigger génère déjà un username ; rien à faire ici */
    }

    router.push('/')
  } catch (err) {
    const msg = err?.message || ''
    if (msg.includes('already registered') || msg.includes('User already registered')) {
      messageErreur.value = 'Un compte existe déjà avec cet e-mail.'
      etape.value = 1
    } else if (msg.includes('Password should be at least')) {
      erreurPassword.value = 'Mot de passe trop court.'
      etape.value = 1
    } else {
      messageErreur.value = msg || 'Erreur lors de la création du compte.'
    }
  } finally {
    envoiEnCours.value = false
  }
}
</script>

<style scoped>
/* ── Étape 1 : deux grandes cartes empilées ────────────────────────────── */

.choix {
  display: grid;
  gap: 14px;
  margin-top: 34px;
}

.choix__carte {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
  padding: 19px 22px;
  border-radius: var(--r-card);
  text-align: left;
  transition: filter var(--dur-1) var(--ease-out);
}

.choix__carte--on {
  background: var(--sprout);
  color: var(--onyx);
}

.choix__carte--on:hover {
  filter: brightness(1.07);
}

.choix__carte:not(.choix__carte--on) {
  background: var(--panel);
  border: 1px solid var(--line);
}

.choix__carte:not(.choix__carte--on):hover {
  border-color: var(--line-2);
}

.choix__ic {
  width: 46px;
  height: 46px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(48, 50, 42, 0.16);
  color: var(--onyx);
}

.choix__carte:not(.choix__carte--on) .choix__ic {
  background: rgba(104, 239, 63, 0.12);
  color: var(--sprout);
}

.choix__corps {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.choix__titre {
  font-size: 16px;
  font-weight: 600;
}

.choix__sous {
  font-size: 13px;
  color: var(--fern);
}

/* Sur la carte verte, le sous-titre doit rester sombre : le lisible sur
   fond clair. */
.choix__carte--on .choix__sous {
  color: var(--onyx);
  opacity: 0.72;
}

/* ── Étape 2 : champs ──────────────────────────────────────────────────── */

.champs {
  display: grid;
  gap: 24px;
  margin-top: 34px;
}

.champs__paire {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 10px;
  align-items: end;
}

.paire {
  display: grid;
  gap: 8px;
}

.paire__label {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--lichen);
}

.paire__box {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 54px;
  padding: 0 12px;
  border-radius: var(--r-sm);
  background: var(--panel);
  border: 1px solid var(--line);
}

.paire__box:hover {
  border-color: var(--line-2);
}

.paire__select {
  flex: 1 1 auto;
  min-width: 0;
  background: none;
  border: none;
  color: var(--white);
  font: inherit;
  font-size: 15px;
  appearance: none;
  padding: 0;
}

.paire__select:focus {
  outline: none;
}

.paire__chev {
  flex: none;
  color: var(--fern);
  pointer-events: none;
}

/* ── Étape 3 : avatar ─────────────────────────────────────────────────── */

.av {
  display: grid;
  gap: 22px;
  margin-top: 30px;
}

.av__courant {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px 20px;
  border-radius: var(--r-card);
  background: var(--panel);
  border: 1px solid var(--sprout);
}

.av__vignette {
  position: relative;
  width: 62px;
  height: 62px;
  flex: none;
}

.av__vignette img {
  width: 100%;
  height: 100%;
  border-radius: var(--r-pill);
  object-fit: cover;
  background: var(--forest-2);
}

.av__badge {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: var(--r-pill);
  background: var(--sprout);
  color: var(--onyx);
  border: 2px solid var(--panel);
  font-size: 11px;
  font-weight: 700;
}

.av__corps {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 3px;
}

.av__titre {
  font-size: 16px;
  font-weight: 600;
}

.av__sous {
  font-size: 13px;
  color: var(--fern);
}

.av__photo {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line-2);
  color: var(--white);
  font-size: 14.5px;
  font-weight: 600;
}

.av__photo:hover {
  border-color: var(--sprout);
}

.av__grille {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.av__choix {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid transparent;
  padding: 3px;
  transition: border-color var(--dur-1) var(--ease-out);
}

.av__choix img {
  width: 100%;
  height: 100%;
  border-radius: var(--r-pill);
  object-fit: cover;
  background: var(--forest-2);
}

.av__choix:hover {
  border-color: var(--line-2);
}

.av__choix.is-on {
  border-color: var(--sprout);
}
</style>