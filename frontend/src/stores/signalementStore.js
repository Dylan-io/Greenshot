import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSignalementStore = defineStore('signalement', () => {
  // État minimal pour la gestion des signalements
  const signalements = ref([])
  const categories = ref([])
  const chargement = ref(false)
  const erreur = ref(null)

  return {
    signalements,
    categories,
    chargement,
    erreur
  }
})
