<!-- ⚠️ ATTENTION : Ce fichier a été créé par l'agent IA - À valider avec l'équipe frontend -->
<!-- Page de connexion - Par email ou username + mot de passe -->

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h2>🌍 Connexion Greenshot</h2>
        <p class="subtitle">Bienvenue sur votre espace citoyen</p>
      </div>

      <form @submit.prevent="handleConnexion" class="auth-form">
        <!-- Mode de connexion -->
        <div class="form-group">
          <label class="form-label">Mode de connexion</label>
          <div class="mode-toggle">
            <button
              type="button"
              :class="['toggle-btn', { active: modeConnexion === 'email' }]"
              @click="modeConnexion = 'email'"
            >
              📧 Par email
            </button>
            <button
              type="button"
              :class="['toggle-btn', { active: modeConnexion === 'username' }]"
              @click="modeConnexion = 'username'"
            >
              👤 Par username
            </button>
          </div>
        </div>

        <!-- Identifiant (email OU username) -->
        <div class="form-group">
          <label class="form-label">
            {{ modeConnexion === 'email' ? 'Adresse email' : 'Nom d\'utilisateur' }} *
          </label>
          <input
            v-model="identifiant"
            type="text"
            required
            :placeholder="modeConnexion === 'email' ? 'votre@email.com' : 'Ex: aline_4829'"
            class="text-input"
          />
        </div>

        <!-- Mot de passe -->
        <div class="form-group">
          <label class="form-label">Mot de passe *</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="Votre mot de passe"
            class="text-input"
          />
        </div>

        <!-- Message d'erreur -->
        <div v-if="messageErreur" class="alert-error">
          {{ messageErreur }}
        </div>

        <!-- Message de succès -->
        <div v-if="messageSucces" class="alert-success">
          {{ messageSucces }}
        </div>

        <!-- Bouton de connexion -->
        <button
          type="submit"
          class="btn-submit"
          :disabled="envoiEnCours"
        >
          <span v-if="envoiEnCours">Connexion en cours...</span>
          <span v-else>Se connecter</span>
        </button>
      </form>

      <!-- Liens utiles -->
      <div class="auth-footer">
        <p>Pas de compte ? <router-link to="/inscription">Créer un compte</router-link></p>
        <p class="mt-1"><router-link to="/">Retour à l'accueil</router-link></p>
      </div>

      <!-- Note sur la vérification email -->
      <div v-if="!emailVerified" class="verification-notice">
        <p>💡 <strong>Vous n'avez pas encore vérifié votre email ?</strong></p>
        <p>Vous pouvez naviguer sur l'application, mais vous ne pourrez pas soumettre de signalements tant que votre email n'est pas confirmé.</p>
        <button class="btn-resend" @click="renvoyerVerification">
          📧 Renvoyer l'email de vérification
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const modeConnexion = ref('email')
const identifiant = ref('')
const password = ref('')
const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')
const emailVerified = ref(false)

async function handleConnexion() {
  envoiEnCours.value = true
  messageErreur.value = ''
  messageSucces.value = ''

  try {
    let result

    if (modeConnexion.value === 'email') {
      result = await userStore.seConnecterEmail(identifiant.value.trim(), password.value)
    } else {
      result = await userStore.seConnecterUsername(identifiant.value.trim(), password.value)
    }

    if (result.error) throw result.error

    messageSucces.value = 'Connexion réussie ! 🎉'
    
    // Vérifier si l'email est vérifié
    const prof = userStore.profile
    emailVerified.value = prof.email_verified
    
    setTimeout(() => {
      router.push('/')
    }, 2000)

  } catch (err) {
    console.error('Erreur connexion:', err)
    
    if (err.message.includes('Invalid credentials') || err.message.includes('Invalid login credentials')) {
      messageErreur.value = 'Email/username ou mot de passe incorrect.'
    } else if (err.message.includes('User not found')) {
      messageErreur.value = 'Utilisateur introuvable.'
    } else {
      messageErreur.value = err.message || 'Erreur lors de la connexion. Réessayez.'
    }
  } finally {
    envoiEnCours.value = false
  }
}

async function renvoyerVerification() {
  try {
    const { data, error } = await userStore.renvoyerVerification()
    if (error) throw error
    messageSucces.value = 'Email de vérification renvoyé ! 📧'
  } catch (err) {
    messageErreur.value = 'Impossible de renvoyer l\'email de vérification.'
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding: 1rem;
}

.auth-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-header h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-weight: 700;
  font-size: 0.9rem;
  color: #1e293b;
  margin-bottom: 0.4rem;
}

.text-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
  box-sizing: border-box;
}

.mode-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.toggle-btn.active {
  background: #10B981;
  color: white;
  border-color: #10B981;
}

.alert-error {
  padding: 0.75rem;
  background: #FEF2F2;
  color: #991B1B;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.alert-success {
  padding: 0.75rem;
  background: #ECFDF5;
  color: #065F46;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.btn-submit {
  width: 100%;
  padding: 0.85rem;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-submit:hover {
  background: #059669;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.auth-footer p {
  color: #64748b;
  font-size: 0.85rem;
}

.auth-footer a {
  color: #10B981;
  font-weight: 700;
  text-decoration: none;
}

.mt-1 { margin-top: 0.5rem; }

.verification-notice {
  margin-top: 1.25rem;
  padding: 1rem;
  background: #FFFBEB;
  border: 1px solid #FCD34D;
  border-radius: 8px;
  font-size: 0.85rem;
}

.verification-notice p {
  color: #92400E;
  margin-bottom: 0.5rem;
}

.verification-notice p:last-child {
  margin-bottom: 0;
}

.btn-resend {
  display: block;
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background: #E8A33D;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
</style>
