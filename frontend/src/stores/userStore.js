import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // État minimal utilisateur / profil
  const user = ref(null)
  const profile = ref({
    nom: '',
    ville: 'Bujumbura',
    score_total: 0
  })
  const isAuthenticated = ref(false)

  // Actions de base à implémenter lors de la connexion
  function setSession(sessionUser, userProfile = null) {
    user.value = sessionUser
    isAuthenticated.value = !!sessionUser
    if (userProfile) {
      profile.value = userProfile
    }
  }

  function clearSession() {
    user.value = null
    profile.value = {
      nom: '',
      ville: 'Bujumbura',
      score_total: 0
    }
    isAuthenticated.value = false
  }

  return {
    user,
    profile,
    isAuthenticated,
    setSession,
    clearSession
  }
})
