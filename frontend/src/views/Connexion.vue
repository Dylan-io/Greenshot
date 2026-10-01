<template>
  <div class="auth-page">
    <div class="auth-card">
      
      <!-- En-tête : Logo Greenshot & Titre -->
      <div class="auth-header">
        <router-link to="/" class="brand-badge" aria-label="Retour à l'accueil">
          <div class="logo-box">
            <svg class="leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 4 13c0-4 3-7 8-9 5 2 8 5 8 9a7 7 0 0 1-7 7z"/>
              <path d="M12 4v16"/>
            </svg>
          </div>
          <span class="brand-name">Green<span>shot</span></span>
        </router-link>

        <h1 class="auth-title">Connexion</h1>
        <p class="auth-subtitle">Accédez à votre compte pour agir pour le Burundi</p>

        <!-- Message d'information si redirection depuis une action protégée -->
        <div v-if="redirectMessage" class="redirect-info-pill">
          🔒 {{ redirectMessage }}
        </div>
      </div>

      <!-- Formulaire de Connexion -->
      <form @submit.prevent="soumettreConnexion" class="auth-form" novalidate>
        
        <!-- Champ Email -->
        <div class="form-group" :class="{ 'has-error': erreurs.email && touches.email }">
          <label for="login-email" class="form-label">
            Adresse email <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="login-email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="votre.email@exemple.com"
              class="form-input"
              @blur="touches.email = true"
              @input="validerEmail"
            />
          </div>
          <span v-if="erreurs.email && touches.email" class="field-error">
            {{ erreurs.email }}
          </span>
        </div>

        <!-- Champ Mot de passe -->
        <div class="form-group" :class="{ 'has-error': erreurs.password && touches.password }">
          <label for="login-password" class="form-label">
            Mot de passe <span class="required">*</span>
          </label>
          <div class="input-wrapper input-with-icon">
            <input
              id="login-password"
              v-model="password"
              :type="afficherMdp ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Votre mot de passe"
              class="form-input"
              @blur="touches.password = true"
              @input="validerPassword"
            />
            <button
              type="button"
              class="btn-toggle-eye"
              :aria-label="afficherMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              @click="afficherMdp = !afficherMdp"
            >
              <!-- Icône œil ouvert / barré -->
              <svg v-if="afficherMdp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <span v-if="erreurs.password && touches.password" class="field-error">
            {{ erreurs.password }}
          </span>
        </div>

        <!-- Alerte d'erreur générale -->
        <div v-if="messageErreur" class="alert-banner alert-error" role="alert">
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">{{ messageErreur }}</span>
        </div>

        <!-- Alerte de succès -->
        <div v-if="messageSucces" class="alert-banner alert-success" role="status">
          <span class="alert-icon">🎉</span>
          <span class="alert-text">{{ messageSucces }}</span>
        </div>

        <!-- Bouton Principal de Soumission -->
        <button
          type="submit"
          class="btn-auth-submit"
          :disabled="!formulaireRempli || envoiEnCours"
        >
          <template v-if="envoiEnCours">
            <span class="spinner-auth"></span>
            Connexion en cours...
          </template>
          <template v-else>
            Se connecter
          </template>
        </button>

        <!-- Lien Mot de passe oublié -->
        <div class="forgot-password-wrap">
          <button
            type="button"
            class="btn-forgot-password"
            @click="modaleOubliOuverte = true"
          >
            Mot de passe oublié ?
          </button>
        </div>

      </form>

      <!-- Pied de carte : Navigation vers Inscription -->
      <footer class="auth-card-footer">
        <p class="switch-auth-text">
          Pas encore de compte ?
          <router-link :to="lienVersInscription" class="auth-link">
            S'inscrire
          </router-link>
        </p>
      </footer>

    </div>

    <!-- Modale Réinitialisation Mot de passe -->
    <div v-if="modaleOubliOuverte" class="modal-overlay" @click.self="modaleOubliOuverte = false">
      <div class="modal-box">
        <h3 class="modal-title">Réinitialiser votre mot de passe</h3>
        <p class="modal-desc">
          Entrez votre adresse email. Nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe.
        </p>
        
        <form @submit.prevent="demanderReinitialisation" class="modal-form">
          <div class="form-group">
            <label for="reset-email" class="form-label">Votre email</label>
            <input
              id="reset-email"
              v-model="emailReset"
              type="email"
              placeholder="votre.email@exemple.com"
              class="form-input"
              required
            />
          </div>

          <div v-if="messageReset" class="modal-feedback" :class="succesReset ? 'feedback-ok' : 'feedback-err'">
            {{ messageReset }}
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-modal-cancel" @click="modaleOubliOuverte = false">
              Fermer
            </button>
            <button type="submit" class="btn-modal-confirm" :disabled="envoiResetEnCours">
              {{ envoiResetEnCours ? 'Envoi...' : 'Envoyer le lien' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const afficherMdp = ref(false)
const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')

// Modale de réinitialisation
const modaleOubliOuverte = ref(false)
const emailReset = ref('')
const envoiResetEnCours = ref(false)
const messageReset = ref('')
const succesReset = ref(false)

// Gestion du toucher des champs (blur)
const touches = reactive({
  email: false,
  password: false
})

const erreurs = reactive({
  email: '',
  password: ''
})

// Mémorisation de la route de redirection
const destinationApresConnexion = computed(() => {
  return route.query.redirect ? String(route.query.redirect) : '/'
})

const lienVersInscription = computed(() => {
  return route.query.redirect
    ? { path: '/inscription', query: { redirect: route.query.redirect } }
    : { path: '/inscription' }
})

// Message convivial si l'utilisateur venait d'une page protégée
const redirectMessage = computed(() => {
  const dest = route.query.redirect
  if (!dest) return ''
  if (dest.includes('/signaler')) {
    return 'Connectez-vous pour déposer votre signalement citoyen.'
  }
  if (dest.includes('/nettoyage')) {
    return 'Connectez-vous pour valider votre action de nettoyage.'
  }
  if (dest.includes('/profil')) {
    return 'Connectez-vous pour consulter votre profil et vos points.'
  }
  return 'Veuillez vous connecter pour continuer.'
})

// Validation des champs
function validerEmail() {
  const v = email.value.trim()
  if (!v) {
    erreurs.email = 'L\'adresse email est obligatoire.'
    return false
  }
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regexEmail.test(v)) {
    erreurs.email = 'Format d\'email invalide (ex: nom@domaine.bi).'
    return false
  }
  erreurs.email = ''
  return true
}

function validerPassword() {
  const v = password.value
  if (!v) {
    erreurs.password = 'Le mot de passe est obligatoire.'
    return false
  }
  erreurs.password = ''
  return true
}

const formulaireRempli = computed(() => {
  return email.value.trim().length > 0 && password.value.length > 0
})

async function soumettreConnexion() {
  touches.email = true
  touches.password = true

  const emailOk = validerEmail()
  const passOk = validerPassword()

  if (!emailOk || !passOk) return

  envoiEnCours.value = true
  messageErreur.value = ''
  messageSucces.value = ''

  try {
    const { data, error } = await userStore.seConnecterEmail(email.value, password.value)

    if (error) {
      // Sécurité basique : ne jamais préciser si c'est l'email ou le mot de passe qui est faux
      const errMsg = (error.message || '').toLowerCase()
      if (errMsg.includes('rate limit') || errMsg.includes('too many') || error.status === 429) {
        messageErreur.value = '⏳ Trop de tentatives de connexion. Veuillez patienter quelques minutes avant de réessayer.'
      } else if (errMsg.includes('email not confirmed') || errMsg.includes('not_confirmed')) {
        messageErreur.value = '📧 Votre adresse email n\'est pas encore confirmée. Vérifiez votre boîte de réception (et les spams) pour le lien de confirmation Greenshot.'
      } else if (errMsg.includes('invalid') || errMsg.includes('credentials') || errMsg.includes('grant')) {
        messageErreur.value = 'Adresse email ou mot de passe incorrect. Veuillez vérifier vos identifiants.'
      } else if (errMsg.includes('network') || errMsg.includes('fetch')) {
        messageErreur.value = 'Connexion internet instable ou inaccessible. Veuillez vérifier votre réseau.'
      } else {
        messageErreur.value = `Impossible de se connecter : ${error.message || 'erreur inconnue'}. Veuillez réessayer.`
      }
      return
    }

    messageSucces.value = 'Connexion réussie ! Redirection en cours...'

    // Rediriger vers l'action initialement demandée
    setTimeout(() => {
      router.push(destinationApresConnexion.value)
    }, 400)

  } catch (err) {
    console.error('Erreur connexion:', err)
    messageErreur.value = 'Une erreur inattendue est survenue. Veuillez réessayer.'
  } finally {
    envoiEnCours.value = false
  }
}

// Réinitialisation mot de passe
async function demanderReinitialisation() {
  if (!emailReset.value.trim()) return
  envoiResetEnCours.value = true
  messageReset.value = ''

  try {
    const { error } = await userStore.reinitialiserMotDePasse(emailReset.value)
    if (error) {
      messageReset.value = 'Impossible d\'envoyer le lien pour le moment.'
      succesReset.value = false
    } else {
      messageReset.value = 'Un email de réinitialisation vous a été envoyé si l\'adresse existe.'
      succesReset.value = true
    }
  } catch (err) {
    messageReset.value = 'Erreur lors de la demande.'
    succesReset.value = false
  } finally {
    envoiResetEnCours.value = false
  }
}

onMounted(() => {
  // Pré-remplir l'email de reset si déjà saisi
  if (email.value) {
    emailReset.value = email.value
  }
})
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: var(--radius-lg, 16px);
  padding: 1.75rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  margin-bottom: 0.75rem;
}

.logo-box {
  width: 32px;
  height: 32px;
  background-color: var(--color-primary, #1F4D3A);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
}

.leaf-icon {
  width: 18px;
  height: 18px;
}

.brand-name {
  font-family: var(--font-title, sans-serif);
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-primary, #1F4D3A);
  letter-spacing: -0.02em;
}

.brand-name span {
  color: var(--color-amber, #E8A33D);
}

.auth-title {
  font-family: var(--font-title, sans-serif);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.auth-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted, #64748B);
  line-height: 1.4;
}

.redirect-info-pill {
  margin-top: 0.75rem;
  background: var(--color-amber-light, #FDF6EB);
  color: #92400E;
  border: 1px solid #FCD34D;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.76rem;
  font-weight: 600;
  text-align: center;
}

/* Formulaire */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--color-text, #0F172A);
}

.required {
  color: #DC2626;
  font-weight: bold;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  min-height: 48px;
  padding: 0.65rem 0.85rem;
  font-family: var(--font-body, inherit);
  font-size: 0.92rem;
  color: var(--color-text, #0F172A);
  background-color: #FFFFFF;
  border: 1.5px solid var(--color-border, #CBD5E1);
  border-radius: 10px;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary, #1F4D3A);
  box-shadow: 0 0 0 3px rgba(31, 77, 58, 0.12);
}

.has-error .form-input {
  border-color: #EF4444;
  background-color: #FEF2F2;
}

.input-with-icon .form-input {
  padding-right: 2.75rem;
}

.btn-toggle-eye {
  position: absolute;
  right: 0.65rem;
  background: none;
  border: none;
  padding: 0.35rem;
  cursor: pointer;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color 0.15s ease;
}

.btn-toggle-eye:hover {
  color: var(--color-primary, #1F4D3A);
}

.eye-svg {
  width: 20px;
  height: 20px;
}

.field-error {
  font-size: 0.76rem;
  color: #DC2626;
  font-weight: 500;
  margin-top: 0.15rem;
}

/* Alertes */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  font-size: 0.82rem;
  line-height: 1.35;
}

.alert-error {
  background-color: #FEF2F2;
  border: 1px solid #FECACA;
  color: #991B1B;
}

.alert-success {
  background-color: #EBF3EF;
  border: 1px solid #A7F3D0;
  color: #065F46;
}

.alert-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Bouton principal */
.btn-auth-submit {
  width: 100%;
  min-height: 48px;
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-family: var(--font-title, sans-serif);
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(31, 77, 58, 0.25);
  transition: all 0.18s ease;
  margin-top: 0.35rem;
}

.btn-auth-submit:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #163a2c);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(31, 77, 58, 0.32);
}

.btn-auth-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-auth-submit:disabled {
  background-color: #94A3B8;
  color: #F1F5F9;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.85;
}

.spinner-auth {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.forgot-password-wrap {
  text-align: center;
  margin-top: -0.25rem;
}

.btn-forgot-password {
  background: none;
  border: none;
  color: var(--color-text-muted, #64748B);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease;
}

.btn-forgot-password:hover {
  color: var(--color-primary, #1F4D3A);
  text-decoration: underline;
}

/* Pied de carte */
.auth-card-footer {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border, #E5E9E2);
  text-align: center;
}

.switch-auth-text {
  font-size: 0.85rem;
  color: var(--color-text-muted, #64748B);
}

.auth-link {
  color: var(--color-primary, #1F4D3A);
  font-weight: 700;
  text-decoration: none;
  margin-left: 0.25rem;
  transition: color 0.15s ease;
}

.auth-link:hover {
  color: var(--color-amber, #E8A33D);
  text-decoration: underline;
}

/* Modale */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-box {
  width: 100%;
  max-width: 400px;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 800;
  color: #0F172A;
  margin-bottom: 0.35rem;
}

.modal-desc {
  font-size: 0.82rem;
  color: #64748B;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.modal-feedback {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.78rem;
}

.feedback-ok {
  background: #EBF3EF;
  color: #065F46;
}

.feedback-err {
  background: #FEF2F2;
  color: #991B1B;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.btn-modal-cancel {
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-modal-confirm {
  background: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
