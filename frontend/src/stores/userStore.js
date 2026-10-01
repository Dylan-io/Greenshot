import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../services/supabaseClient'

export const useUserStore = defineStore('user', () => {
  // État utilisateur / profil
  const user = ref(null)
  const profile = ref({
    nom: '',
    ville: 'Bujumbura',
    username: '',
    phone: '',
    email: '',
    email_verified: false,
    score_total: 0
  })
  const isAuthenticated = ref(false)
  const loading = ref(true)

  // Écouter les changements de session Supabase Auth
  function initAuth() {
    loading.value = true
    
    // Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSessionChange(session)
      } else {
        clearSession()
        loading.value = false
      }
    })

    // Écouter les changements de session en temps réel
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleSessionChange(session)
      } else {
        clearSession()
      }
      loading.value = false
    })
  }

  function handleSessionChange(session) {
    user.value = session.user
    isAuthenticated.value = true
    chargerProfile()
  }

  function clearSession() {
    user.value = null
    profile.value = {
      nom: '',
      ville: 'Bujumbura',
      username: '',
      phone: '',
      email: '',
      email_verified: false,
      score_total: 0
    }
    isAuthenticated.value = false
  }

  // Charger le profil depuis Supabase
  // On passe par le RPC obtenir_mon_profil() et non par un
  // profiles.select('*') : les colonnes email / phone / email_verified ne
  // sont plus lisibles en direct (elles ne sont plus accordées au rôle
  // client), pour éviter de publier les coordonnées de tous les citoyens.
  async function chargerProfile() {
    if (!user.value) return
    try {
      const { data, error } = await supabase.rpc('obtenir_mon_profil')
      if (error) throw error

      const profil = Array.isArray(data) ? data[0] : data
      if (profil) {
        profile.value = profil
        profile.value.score_total = (profil.score_signalement || 0) + (profil.score_nettoyage || 0)
      }
    } catch (err) {
      console.warn('Erreur chargement profil:', err)
    }
  }

  // Inscription (email + mot de passe + téléphone)
  async function inscrire(email, password, nom, phone) {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nom: nom,
          phone: phone
        }
      }
    })
    return { data, error }
  }

  // Connexion par email + mot de passe
  async function seConnecterEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    return { data, error }
  }

  // Connexion par username + mot de passe
  // Supabase Auth ne connaît que l'email : on resolve l'email associé au
  // username via le RPC obtenir_email_par_username(). Un simple
  // profiles.select('email') n'est plus possible (colonne non accordée).
  async function seConnecterUsername(username, password) {
    const { data: email, error } = await supabase.rpc('obtenir_email_par_username', {
      p_username: username
    })

    if (error) {
      return { data: null, error: new Error("Connexion impossible. Réessayez dans un instant.") }
    }

    if (!email) {
      return { data: null, error: new Error("Aucun compte ne correspond à ce nom d'utilisateur.") }
    }

    return seConnecterEmail(email, password)
  }

  // Se déconnecter
  async function deconnecter() {
    const { error } = await supabase.auth.signOut()
    clearSession()
    return { error }
  }

  // Renvoyer l'email de vérification
  async function renvoyerVerification() {
    const { data, error } = await supabase.auth.resendVerificationEmail({
      email: profile.value.email
    })
    return { data, error }
  }

  // Mettre à jour le profil (username, phone, nom, ville)
  // Le rôle client n'a le droit d'écrire QUE sur ces 4 colonnes : toute autre
  // colonne (notamment les scores) est refusée par Postgres. On relit le
  // profil via le RPC pour obtenir l'état à jour.
  async function mettreAJourProfil(updates) {
    const champsAutorises = ['nom', 'ville', 'phone', 'username']
    const champsRefuses = Object.keys(updates).filter(c => !champsAutorises.includes(c))

    if (champsRefuses.length > 0) {
      return {
        data: null,
        error: new Error(`Modification refusée pour : ${champsRefuses.join(', ')}`)
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value.id)

    if (error) return { data: null, error }

    await chargerProfile()
    return { data: profile.value, error: null }
  }

  // Vérifier si l'utilisateur peut signaler (email vérifié)
  function peutSignaler() {
    return isAuthenticated.value && profile.value.email_verified === true
  }

  return {
    user,
    profile,
    isAuthenticated,
    loading,
    initAuth,
    chargerProfile,
    inscrire,
    seConnecterEmail,
    seConnecterUsername,
    deconnecter,
    renvoyerVerification,
    mettreAJourProfil,
    peutSignaler
  }
})
