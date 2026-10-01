import { createRouter, createWebHistory } from 'vue-router'
import Accueil from '../views/Accueil.vue'
import Signalement from '../views/Signalement.vue'
import Carte from '../views/Carte.vue'
import Nettoyage from '../views/Nettoyage.vue'
import Classement from '../views/Classement.vue'
import DetailSignalement from '../views/DetailSignalement.vue'
import Profil from '../views/Profil.vue'
import Inscription from '../views/Inscription.vue'
import Connexion from '../views/Connexion.vue'
import { useUserStore } from '../stores/userStore'

const routes = [
  {
    path: '/',
    name: 'Accueil',
    component: Accueil
  },
  {
    path: '/signaler',
    name: 'Signaler',
    component: Signalement,
    meta: { requiresAuth: true }
  },
  {
    path: '/carte',
    name: 'Carte',
    component: Carte
  },
  {
    path: '/nettoyage',
    name: 'Nettoyage',
    component: Nettoyage,
    meta: { requiresAuth: true }
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
    component: Profil,
    meta: { requiresAuth: true }
  },
  {
    path: '/inscription',
    name: 'Inscription',
    component: Inscription
  },
  {
    path: '/connexion',
    name: 'Connexion',
    component: Connexion
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard global pour la protection des routes et la mémorisation de l'action
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // Attendre la vérification de session initiale
  await userStore.initAuth()

  // 1. Si la route requiert une authentification et l'utilisateur n'est pas connecté
  if (to.matched.some(record => record.meta.requiresAuth) && !userStore.isAuthenticated) {
    return next({
      path: '/connexion',
      query: { redirect: to.fullPath }
    })
  }

  // 2. Si l'utilisateur est déjà connecté et tente d'accéder à Connexion ou Inscription
  if ((to.path === '/connexion' || to.path === '/inscription') && userStore.isAuthenticated) {
    const destination = to.query.redirect ? String(to.query.redirect) : '/'
    return next({ path: destination })
  }

  next()
})

export default router
