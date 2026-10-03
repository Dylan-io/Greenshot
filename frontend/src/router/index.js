import { createRouter, createWebHistory } from 'vue-router'
import Accueil from '../views/Accueil.vue'
import Carte from '../views/Carte.vue'
import Signalement from '../views/Signalement.vue'
import Classement from '../views/Classement.vue'
import DetailSignalement from '../views/DetailSignalement.vue'
import Profil from '../views/Profil.vue'
import Nettoyage from '../views/Nettoyage.vue'
// ⚠️ Pages d'authentification - Créées par l'agent IA
// À valider avec l'équipe frontend
import Inscription from '../views/Inscription.vue'
import Connexion from '../views/Connexion.vue'
import Onboarding from '../views/Onboarding.vue'
import MotDePasseOublie from '../views/MotDePasseOublie.vue'

const routes = [
  // L'onboarding précède la maison : c'est la première visite, pas une route
  // de navigation. On doit être connecté pour la voir une seule fois.
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: Onboarding
  },
  {
    path: '/',
    name: 'Accueil',
    component: Accueil
  },
  {
    path: '/carte',
    name: 'Carte',
    component: Carte
  },
  {
    path: '/signaler',
    name: 'Signalement',
    component: Signalement
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
  },
  // ⚠️ Routes d'authentification - À valider avec l'équipe frontend
  {
    path: '/inscription',
    name: 'Inscription',
    component: Inscription
  },
  {
    path: '/connexion',
    name: 'Connexion',
    component: Connexion
  },
  {
    // Sortie du parcours d'authentification : cet écran est aussi la cible du
    // lien de récupération dans l'e-mail, d'où le `redirectTo` de la même URL.
    path: '/mot-de-passe-oublie',
    name: 'MotDePasseOublie',
    component: MotDePasseOublie
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router