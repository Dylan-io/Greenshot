import { createRouter, createWebHistory } from 'vue-router'
import Accueil from '../views/Accueil.vue'
import Signalement from '../views/Signalement.vue'
import SignalementIA from '../views/SignalementIA.vue'
import Carte from '../views/Carte.vue'
import Nettoyage from '../views/Nettoyage.vue'
import Classement from '../views/Classement.vue'
import DetailSignalement from '../views/DetailSignalement.vue'
import Profil from '../views/Profil.vue'

const routes = [
  {
    path: '/',
    name: 'Accueil',
    component: Accueil
  },
  {
    path: '/signaler',
    name: 'Signaler',
    component: Signalement
  },
  {
    path: '/signalement-ia',
    name: 'SignalementIA',
    component: SignalementIA
  },
  {
    path: '/carte',
    name: 'Carte',
    component: Carte
  },
  {
    path: '/nettoyage',
    name: 'Nettoyage',
    component: Nettoyage
  },
  {
    path: '/classement',
    name: 'Classement',
    component: Classement
  },
  {
    path: '/signalement/:id',
    name: 'DetailSignalement',
    component: DetailSignalement,
    props: true
  },
  {
    path: '/profil',
    name: 'Profil',
    component: Profil
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
