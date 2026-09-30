<!-- ⚠️ ATTENTION : Ce fichier a été créé par l'agent IA - À valider avec l'équipe frontend -->
<!-- Page d'inscription - Email, mot de passe, téléphone, username auto-généré -->

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h2>🌍 Inscription Greenshot</h2>
        <p class="subtitle">Rejoignez la communauté citoyenne du Burundi</p>
      </div>

      <form @submit.prevent="handleInscription" class="auth-form">
        <!-- Nom -->
        <div class="form-group">
          <label class="form-label">Votre nom prénom *</label>
          <input
            v-model="nom"
            type="text"
            required
            placeholder="Ex: Aline Niyonkuru"
            class="text-input"
            disabled
          />
        </div>

        <!-- Email -->
        <div class="form-group">
          <label class="form-label">Adresse email *</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="votre@email.com"
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
            placeholder="Au moins 6 caractères"
            class="text-input"
          />
          <small class="form-help">Le mot de passe n'est jamais partagé avec qui que ce soit.</small>
        </div>

        <!-- Téléphone -->
        <div class="form-group">
          <label class="form-label">Numéro de téléphone *</label>
          <input
            v-model="phone"
            type="tel"
            required
            placeholder="+257 XXX XXX XXX"
            class="text-input"
          />
          <small class="form-help">Utilisé uniquement pour être contacté en cas de besoin.</small>
        </div>

        <!-- Username auto-généré -->
        <div class="form-group">
          <label class="form-label">Nom d'utilisateur *</label>
          <div class="username-box">
            <input
              v-model="username"
              type="text"
              required
              class="text-input"
              placeholder="Le système génère automatiquement ce nom"
            />
            <button type="button" class="btn-refresh" @click="genererUsername" title="Générer un nouveau username">
              🔄
            </button>
          </div>
          <small class="form-help">Généré à partir de votre prénom + 4 chiffres. Modifiable.</small>
        </div>

        <!-- Message d'erreur -->
        <div v-if="messageErreur" class="alert-error">
          {{ messageErreur }}
        </div>

        <!-- Message de succès -->
        <div v-if="messageSucces" class="alert-success">
          {{ messageSucces }}
        </div>

        <!-- Bouton d'inscription -->
        <button
          type="submit"
          class="btn-submit"
          :disabled="envoiEnCours"
        >
          <span v-if="envoiEnCours">Inscription en cours...</span>
          <span v-else>Créer mon compte</span>
        </button>
      </form>

      <!-- Lien vers la connexion -->
      <div class="auth-footer">
        <p>Déjà inscrit ? <router-link to="/connexion">Se connecter</router-link></p>
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

const nom = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const username = ref('')
const envoiEnCours = ref(false)
const messageErreur = ref('')
const messageSucces = ref('')

// Générer le username automatiquement à partir du prénom
function genererUsername() {
  if (!nom.value.trim()) return
  // Prendre le premier mot (prénom), le nettoyer, ajouter 4 chiffres
  const prenom = nom.value.trim().split(' ')[0].toLowerCase()
  const clean = prenom.replace(/[^a-z0-9éèêëàâäùûüîïôöçñ]/g, '_')
  const suffix = Math.floor(Math.random() * 9000 + 1000)
  username.value = clean + '_' + suffix
}

async function handleInscription() {
  envoiEnCours.value = true
  messageErreur.value = ''
  messageSucces.value = ''

  // Générer le username si pas encore fait
  if (!username.value) {
    genererUsername()
  }

  try {
    const { data, error } = await userStore.inscrire(
      email.value.trim(),
      password.value,
      nom.value.trim(),
      phone.value.trim()
    )

    if (error) throw error

    messageSucces.value = 'Compte créé avec succès ! 🎉 Un email de vérification vous a été envoyé. Vous pouvez déjà naviguer sur l\'application.'
    
    // Rediriger vers la page d'accueil après quelques secondes
    setTimeout(() => {
      router.push('/')
    }, 3000)

  } catch (err) {
    console.error('Erreur inscription:', err)
    
    // Messages d'erreur personnalisés
    if (err.message.includes('already registered')) {
      messageErreur.value = 'Un compte existe déjà avec cet email.'
    } else if (err.message.includes('User already registered')) {
      messageErreur.value = 'Un compte existe déjà avec cet email.'
    } else if (err.message.includes('Password should be at least')) {
      messageErreur.value = 'Le mot de passe doit contenir au moins 6 caractères.'
    } else {
      messageErreur.value = err.message || 'Erreur lors de l\'inscription. Réessayez.'
    }
  } finally {
    envoiEnCours.value = false
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

.form-help {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
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

.text-input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

.username-box {
  display: flex;
  gap: 0.5rem;
}

.username-box .text-input {
  flex: 1;
}

.btn-refresh {
  padding: 0.6rem 0.75rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
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
</style>
