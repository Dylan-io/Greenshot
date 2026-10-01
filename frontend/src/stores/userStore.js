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

  let authPromise = null

  // Initialiser et écouter les changements de session Supabase Auth
  function initAuth() {
    if (authPromise) return authPromise

    loading.value = true

    authPromise = new Promise((resolve) => {
      // 1. Vérifier la session actuelle
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          handleSessionChange(session)
        } else {
          clearSession()
        }
        loading.value = false
        resolve(session)
      }).catch((err) => {
        console.warn('Erreur récupération session:', err)
        clearSession()
        loading.value = false
        resolve(null)
      })
    })

    // 2. Écouter les changements de session en temps réel
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleSessionChange(session)
      } else {
        clearSession()
      }
      loading.value = false
    })

    return authPromise
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
  // On passe par le RPC obtenir_mon_profil() : les colonnes email / phone / email_verified
  // sont protégées et non accessibles via un simple select('*') public.
  async function chargerProfile() {
    if (!user.value) return
    try {
      const { data, error } = await supabase.rpc('obtenir_mon_profil')
      if (error) throw error

      const profil = Array.isArray(data) ? data[0] : data
      if (profil) {
        profile.value = {
          ...profile.value,
          ...profil,
          score_total: (profil.score_signalement || 0) + (profil.score_nettoyage || 0)
        }
      }
    } catch (err) {
      console.warn('Erreur chargement profil RPC:', err)
      // Fallback sur le select de colonnes publiques autorisées
      try {
        const { data: pubData } = await supabase
          .from('profiles')
          .select('id, nom, ville, username, score_signalement, score_nettoyage, created_at')
          .eq('id', user.value.id)
          .maybeSingle()
        if (pubData) {
          profile.value = {
            ...profile.value,
            ...pubData,
            score_total: (pubData.score_signalement || 0) + (pubData.score_nettoyage || 0)
          }
        }
      } catch (e) {
        console.warn('Erreur fallback profil:', e)
      }
    }
  }

  // Inscription (nom complet, email, phone, mot de passe)
  async function inscrire(email, password, nom, phone, ville = 'Bujumbura') {
    const cleanEmail = email.trim().toLowerCase()
    const cleanNom = nom.trim()
    const cleanPhone = phone.trim()

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          nom: cleanNom,
          phone: cleanPhone,
          ville: ville
        }
      }
    })

    if (!error && data?.user) {
      if (data.session) {
        handleSessionChange(data.session)
      } else {
        // Compte créé avec confirmation d'email
        user.value = data.user
        isAuthenticated.value = true
        profile.value.nom = cleanNom
        profile.value.phone = cleanPhone
        profile.value.email = cleanEmail
        profile.value.ville = ville
      }
    }

    return { data, error }
  }

  // Connexion par email + mot de passe
  async function seConnecterEmail(email, password) {
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    })

    if (!error && data?.session) {
      handleSessionChange(data.session)
    }

    return { data, error }
  }

  // Mot de passe oublié / Réinitialisation
  async function reinitialiserMotDePasse(email) {
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/profil`
    })
    return { data, error }
  }

  // Se déconnecter
  async function deconnecter() {
    const { error } = await supabase.auth.signOut()
    clearSession()
    return { error }
  }

  // Renvoyer l'email de vérification
  // NOTE: supabase-js v2 utilise supabase.auth.resend(), PAS resendVerificationEmail()
  async function renvoyerVerification() {
    const targetEmail = profile.value.email || user.value?.email
    if (!targetEmail) return { error: new Error('Aucune adresse email trouvée.') }
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail
    })
    return { data, error }
  }

  // Mettre à jour le profil (nom, ville, phone, username)
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
    reinitialiserMotDePasse,
    deconnecter,
    renvoyerVerification,
    mettreAJourProfil,
    peutSignaler
  }
})
