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

        <h1 class="auth-title">Créer mon compte</h1>
        <p class="auth-subtitle">Rejoignez la communauté écocitoyenne du Burundi</p>

        <!-- Message d'information si redirection depuis une action protégée -->
        <div v-if="redirectMessage" class="redirect-info-pill">
          🌱 {{ redirectMessage }}
        </div>
      </div>

      <!-- Formulaire d'Inscription -->
      <form @submit.prevent="soumettreInscription" class="auth-form" novalidate>
        
        <!-- 1. Nom et prénom -->
        <div class="form-group" :class="{ 'has-error': erreurs.nom && touches.nom }">
          <label for="reg-nom" class="form-label">
            Nom et prénom <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="reg-nom"
              v-model="nom"
              type="text"
              autocomplete="name"
              placeholder="Ex: Aline Niyonkuru"
              class="form-input"
              @blur="touches.nom = true; validerNom()"
              @input="validerNom"
            />
          </div>
          <span v-if="erreurs.nom && touches.nom" class="field-error">
            {{ erreurs.nom }}
          </span>
        </div>

        <!-- 2. Email -->
        <div class="form-group" :class="{ 'has-error': erreurs.email && touches.email }">
          <label for="reg-email" class="form-label">
            Adresse email <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="reg-email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="votre.email@exemple.com"
              class="form-input"
              @blur="touches.email = true; validerEmail()"
              @input="validerEmail"
            />
          </div>
          <span v-if="erreurs.email && touches.email" class="field-error">
            {{ erreurs.email }}
          </span>
        </div>

        <!-- 3. Numéro de téléphone -->
        <div class="form-group" :class="{ 'has-error': erreurs.phone && touches.phone }">
          <label for="reg-phone" class="form-label">
            Numéro de téléphone <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <input
              id="reg-phone"
              v-model="phone"
              type="tel"
              autocomplete="tel"
              placeholder="Ex: +257 79 000 000"
              class="form-input"
              @blur="touches.phone = true; validerPhone()"
              @input="validerPhone"
            />
          </div>
          <span v-if="erreurs.phone && touches.phone" class="field-error">
            {{ erreurs.phone }}
          </span>
        </div>

        <!-- 4. Mot de passe -->
        <div class="form-group" :class="{ 'has-error': erreurs.password && touches.password }">
          <label for="reg-password" class="form-label">
            Mot de passe <span class="required">*</span>
          </label>
          <div class="input-wrapper input-with-icon">
            <input
              id="reg-password"
              v-model="password"
              :type="afficherMdp ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="8 caractères minimum"
              class="form-input"
              @blur="touches.password = true; validerPassword()"
              @input="validerPassword(); if (touches.confirmPassword) validerConfirmPassword()"
            />
            <button
              type="button"
              class="btn-toggle-eye"
              :aria-label="afficherMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              @click="afficherMdp = !afficherMdp"
            >
              <svg v-if="afficherMdp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </button>
          </div>
          <span v-if="erreurs.password && touches.password" class="field-error">
            {{ erreurs.password }}
          </span>
        </div>

        <!-- 5. Confirmation du mot de passe -->
        <div class="form-group" :class="{ 'has-error': erreurs.confirmPassword && touches.confirmPassword }">
          <label for="reg-confirm-password" class="form-label">
            Confirmer le mot de passe <span class="required">*</span>
          </label>
          <div class="input-wrapper input-with-icon">
            <input
              id="reg-confirm-password"
              v-model="confirmPassword"
              :type="afficherConfirmMdp ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Répétez votre mot de passe"
              class="form-input"
              @blur="touches.confirmPassword = true; validerConfirmPassword()"
              @input="validerConfirmPassword"
            />
            <button
              type="button"
              class="btn-toggle-eye"
              :aria-label="afficherConfirmMdp ? 'Masquer la confirmation' : 'Afficher la confirmation'"
              @click="afficherConfirmMdp = !afficherConfirmMdp"
            >
              <svg v-if="afficherConfirmMdp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </button>
          </div>
          <span v-if="erreurs.confirmPassword && touches.confirmPassword" class="field-error">
            {{ erreurs.confirmPassword }}
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

        <!-- Bouton Principal d'Inscription -->
        <button
          type="submit"
          class="btn-auth-submit"
          :disabled="!formulaireEstValide || envoiEnCours"
        >
          <template v-if="envoiEnCours">
            <span class="spinner-auth"></span>
            Création de votre compte...
          </template>
          <template v-else>
            Créer mon compte
          </template>
        </button>

      </form>

      <!-- Pied de carte : Navigation vers Connexion -->
      <footer class="auth-card-footer">
        <p class="switch-auth-text">
          Déjà un compte ?
          <router-link :to="lienVersConnexion" class="auth-link">
            Se connecter
          </router-link>
        </p>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const nom = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')

const afficherMdp = ref(false)
const afficherConfirmMdp = ref(false)
const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')

// Suivi du statut des champs (au blur)
const touches = reactive({
  nom: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false
})

const erreurs = reactive({
  nom: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const destinationApresInscription = computed(() => {
  return route.query.redirect ? String(route.query.redirect) : '/'
})

const lienVersConnexion = computed(() => {
  return route.query.redirect
    ? { path: '/connexion', query: { redirect: route.query.redirect } }
    : { path: '/connexion' }
})

const redirectMessage = computed(() => {
  const dest = route.query.redirect
  if (!dest) return ''
  return 'Créez votre compte citoyen pour valider votre action.'
})

// Fonctions de validation individuelles
function validerNom() {
  const v = nom.value.trim()
  if (!v) {
    erreurs.nom = 'Le nom et prénom sont obligatoires.'
    return false
  }
  if (v.length < 3) {
    erreurs.nom = 'Veuillez saisir votre nom complet (au moins 3 caractères).'
    return false
  }
  erreurs.nom = ''
  return true
}

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

function validerPhone() {
  const v = phone.value.trim()
  if (!v) {
    erreurs.phone = 'Le numéro de téléphone est obligatoire.'
    return false
  }
  const cleaned = v.replace(/[\s\-\.]/g, '')
  if (cleaned.length < 6) {
    erreurs.phone = 'Numéro de téléphone trop court.'
    return false
  }
  erreurs.phone = ''
  return true
}

function validerPassword() {
  const v = password.value
  if (!v) {
    erreurs.password = 'Le mot de passe est obligatoire.'
    return false
  }
  if (v.length < 8) {
    erreurs.password = 'Le mot de passe doit comporter au moins 8 caractères.'
    return false
  }
  erreurs.password = ''
  return true
}

function validerConfirmPassword() {
  const v = confirmPassword.value
  if (!v) {
    erreurs.confirmPassword = 'La confirmation du mot de passe est obligatoire.'
    return false
  }
  if (v !== password.value) {
    erreurs.confirmPassword = 'Les deux mots de passe ne correspondent pas.'
    return false
  }
  erreurs.confirmPassword = ''
  return true
}

// Validation globale du formulaire
const formulaireEstValide = computed(() => {
  return (
    nom.value.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) &&
    phone.value.trim().length >= 6 &&
    password.value.length >= 8 &&
    confirmPassword.value === password.value
  )
})

async function soumettreInscription() {
  // Marquer tous les champs comme touchés pour afficher les erreurs si nécessaire
  touches.nom = true
  touches.email = true
  touches.phone = true
  touches.password = true
  touches.confirmPassword = true

  const nomOk = validerNom()
  const emailOk = validerEmail()
  const phoneOk = validerPhone()
  const passOk = validerPassword()
  const confirmOk = validerConfirmPassword()

  if (!nomOk || !emailOk || !phoneOk || !passOk || !confirmOk) return

  envoiEnCours.value = true
  messageErreur.value = ''
  messageSucces.value = ''

  try {
    const { data, error } = await userStore.inscrire(
      email.value,
      password.value,
      nom.value,
      phone.value,
      'Bujumbura'
    )

    if (error) {
      const errMsg = (error.message || '').toLowerCase()
      if (errMsg.includes('rate limit') || errMsg.includes('too many') || error.status === 429) {
        messageErreur.value = '⏳ Trop de tentatives d\'inscription récentes. Le serveur limite les envois d\'emails. Veuillez patienter 1 heure puis réessayer, ou contactez votre administrateur.'
      } else if (errMsg.includes('already') || errMsg.includes('registered') || errMsg.includes('exists')) {
        messageErreur.value = 'Cette adresse email est déjà associée à un compte Greenshot. Veuillez vous connecter.'
      } else if (errMsg.includes('weak') || errMsg.includes('password')) {
        messageErreur.value = 'Le mot de passe choisi est trop simple. Choisissez un mot de passe plus robuste (8+ caractères avec lettres et chiffres).'
      } else if (errMsg.includes('not_confirmed') || errMsg.includes('email not confirmed')) {
        messageErreur.value = 'Votre adresse email n\'est pas encore confirmée. Vérifiez votre boîte de réception (et les spams) pour le lien de confirmation.'
      } else if (errMsg.includes('network') || errMsg.includes('fetch')) {
        messageErreur.value = 'Connexion internet instable. Veuillez vérifier votre réseau.'
      } else {
        messageErreur.value = `Impossible de créer le compte : ${error.message || 'erreur inconnue'}. Veuillez réessayer.`
      }
      return
    }

    messageSucces.value = 'Compte créé avec succès ! Bienvenue sur Greenshot.'

    // Redirection fluide
    setTimeout(() => {
      router.push(destinationApresInscription.value)
    }, 600)

  } catch (err) {
    console.error('Erreur inscription:', err)
    messageErreur.value = 'Une erreur inattendue est survenue lors de l\'inscription.'
  } finally {
    envoiEnCours.value = false
  }
}
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
  background: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
  border: 1px solid #A7F3D0;
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
  gap: 1.05rem;
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
</style>
