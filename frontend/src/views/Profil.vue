<template>
  <ScreenBar title="Profil" subtitle="Votre impact sur Greenshot" />

  <div class="gs-pad">
    <section class="idcard">
      <div class="idcard__avatar">
        <img :src="avatarUrl" :alt="`Avatar de ${displayName}`" />
        <button type="button" class="idcard__cam" aria-label="Changer d'avatar">
          <svg class="ic ic--xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 8h3l2-2h6l2 2h3v11H4z" stroke-linejoin="round" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </button>
      </div>

      <h2 class="idcard__name">{{ displayName }}</h2>
      <p class="idcard__sub">{{ rang }} · {{ profile.ville || 'Bujumbura, Burundi' }}</p>

      <div class="idcard__tags">
        <span class="pill pill--dark"><span class="pill__dot" />Niveau {{ niveau }}</span>
        <span v-if="rang" class="pill pill--ghost">{{ rang }}</span>
        <span v-if="badgeCount" class="pill pill--ghost">{{ badgeCount }} badge{{ badgeCount > 1 ? 's' : '' }}</span>
      </div>
    </section>

    <section class="card total">
      <p class="eyebrow">Total cumulé</p>
      <p class="total__pts">{{ scoreTotal }}<small>pts</small></p>
      <p class="total__next">{{ encore }} pts pour le niveau {{ niveau + 1 }}</p>
      <div class="xp">
        <i class="xp__fill" :style="{ width: ratioProgression }" />
      </div>
    </section>

    <StatStrip :stats="stats" />

    <section aria-labelledby="sec-onglets">
      <div class="h-sec">
        <h2 id="sec-onglets" class="h-sec__title">Mon historique</h2>
      </div>

      <div class="tabs" role="tablist" aria-label="Filtrer mon historique">
        <button
          type="button"
          role="tab"
          class="tab"
          :class="{ 'is-on': ongletActif === 'signalements' }"
          :aria-selected="ongletActif === 'signalements'"
          @click="ongletActif = 'signalements'"
        >
          Signalements ({{ mesSignalements.length }})
        </button>
        <button
          type="button"
          role="tab"
          class="tab"
          :class="{ 'is-on': ongletActif === 'nettoyages' }"
          :aria-selected="ongletActif === 'nettoyages'"
          @click="ongletActif = 'nettoyages'"
        >
          Nettoyages ({{ mesNettoyages.length }})
        </button>
      </div>

      <div v-if="ongletActif === 'signalements'">
        <EmptyState
          v-if="mesSignalements.length === 0"
          icon="bin"
          title="Aucun signalement pour l'instant"
          text="Une photo suffit pour lancer la validation de votre premier signalement."
          action-label="Signaler un déchet"
          @action="router.push('/signaler')"
        />
        <div v-else class="hist">
          <button
            v-for="sig in mesSignalements"
            :key="sig.id"
            type="button"
            class="hist__card"
            @click="router.push(`/signalement/${sig.id}`)"
          >
            <img :src="sig.photo_avant_url" alt="" class="hist__img" />
            <span class="hist__body">
              <span class="hist__top">
                <span class="hist__cat">{{ sig.categories?.nom || 'Déchet' }}</span>
                <BadgeStatut :statut="sig.statut" />
              </span>
              <span class="hist__loc">{{ sig.ville }}</span>
              <span class="hist__date">{{ formaterDate(sig.created_at) }}</span>
            </span>
          </button>
        </div>
      </div>

      <div v-else>
        <EmptyState
          v-if="mesNettoyages.length === 0"
          icon="leaf"
          title="Aucun nettoyage validé"
          text="Trouvez un déchet signalé près de vous et photographiez-le après nettoyage pour gagner des points."
          action-label="Voir la carte"
          @action="router.push('/carte')"
        />
        <div v-else class="hist">
          <button
            v-for="clean in mesNettoyages"
            :key="clean.id"
            type="button"
            class="hist__card"
            @click="router.push(`/signalement/${clean.id}`)"
          >
            <img :src="clean.photo_apres_url || clean.photo_avant_url" alt="" class="hist__img" />
            <span class="hist__body">
              <span class="hist__top">
                <span class="hist__cat">{{ clean.categories?.nom || 'Zone nettoyée' }}</span>
                <BadgeStatut :statut="clean.statut" />
              </span>
              <span class="hist__loc">{{ clean.ville }}</span>
              <span class="hist__date">Nettoyé le {{ formaterDate(clean.date_nettoyage) }}</span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <section class="card card--flat links">
      <router-link to="/classement" class="links__row">
        <span>Classement</span>
        <svg class="ic ic--sm chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </router-link>
      <button type="button" class="links__row" @click="deconnecter">
        <span>Se déconnecter</span>
        <svg class="ic ic--sm chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../stores/userStore'
import BadgeStatut from '../components/BadgeStatut.vue'
import ScreenBar from '../components/ScreenBar.vue'
import StatStrip from '../components/StatStrip.vue'
import EmptyState from '../components/EmptyState.vue'

const SEUIL_NIVEAU = 250

const router = useRouter()
const userStore = useUserStore()

const ongletActif = ref('signalements')
const mesSignalements = ref([])
const mesNettoyages = ref([])

const profile = ref(
  import.meta.env.DEV
    ? { nom: 'Éclaireur', ville: 'Bujumbura, Burundi', score_signalement: 20, score_nettoyage: 45 }
    : { nom: '', ville: '', score_signalement: 0, score_nettoyage: 0 }
)

const displayName = computed(() => profile.value.nom || 'Citoyen')
const rang = computed(() => profile.value.rang || '')

const scoreTotal = computed(
  () => (profile.value.score_signalement || 0) + (profile.value.score_nettoyage || 0)
)

const niveau = computed(() => Math.max(1, Math.floor(scoreTotal.value / SEUIL_NIVEAU) + 1))
const encore = computed(() => Math.max(0, niveau.value * SEUIL_NIVEAU - scoreTotal.value))
const ratioProgression = computed(
  () => `${Math.min(100, Math.round((scoreTotal.value % SEUIL_NIVEAU) / SEUIL_NIVEAU * 100))}%`
)

const badgeCount = computed(() => {
  if (scoreTotal.value >= 1000) return 6
  return [0, 1, 2].filter((s) => scoreTotal.value >= s).length
})

const stats = computed(() => [
  { value: mesSignalements.value.length, label: 'signalements' },
  { value: mesNettoyages.value.length, label: 'nettoyages' },
  { value: mesSignalements.value.length + mesNettoyages.value.length, label: 'actions' }
])

// Avatar par défaut : un SVG local, pas de service externe.
// Voir Design-opendesign-Greenshot/assets/avatars/
const avatarUrl = computed(
  () => profile.value.avatar_url || '/avatars/avatar-camille.svg'
)

onMounted(async () => {
  await chargerProfil()
})

async function chargerProfil() {
  try {
    const userId = userStore.user?.id
    if (userId) {
      // Colonnes explicitement listées : email / phone / email_verified ne
      // sont plus accordées au rôle client (protection des PII). Le profil
      // complet est déjà chargé par le store via obtenir_mon_profil().
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, nom, ville, username, score_signalement, score_nettoyage, created_at')
        .eq('id', userId)
        .single()
      if (prof) profile.value = { ...profile.value, ...prof }

      const { data: sigs } = await supabase.from('signalements').select('*, categories(nom)').eq('user_id', userId)
      if (sigs) mesSignalements.value = sigs

      const { data: cleans } = await supabase.from('signalements').select('*, categories(nom)').eq('nettoye_par_user_id', userId)
      if (cleans) mesNettoyages.value = cleans
    } else if (import.meta.env.DEV) {
      // Données de démonstration : UNIQUEMENT en développement local.
      // Un visiteur non connecté qui ouvrirait /profil en production ne doit
      // pas voir un profil « Dyllan N. » avec un historique de nettoyages
      // qui n'a jamais eu lieu.
      mesSignalements.value = [
        {
          id: 'sig-demo-1',
          categories: { nom: 'Déchets plastiques' },
          statut: 'nettoye',
          ville: 'Bujumbura (Rohero)',
          photo_avant_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=400',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]
      mesNettoyages.value = [
        {
          id: 'clean-demo-1',
          categories: { nom: 'Décharge sauvage' },
          statut: 'nettoye',
          ville: 'Bujumbura (Buyenzi)',
          photo_apres_url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=400',
          date_nettoyage: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }
  } catch (err) {
    console.warn('Erreur chargement profil:', err)
  }
}

async function deconnecter() {
  await userStore.deconnecter()
  router.push('/connexion')
}

function formaterDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<style scoped>
.idcard {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  padding: 22px 18px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.idcard::after {
  content: '';
  position: absolute;
  right: -40px;
  top: -50px;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 40% 40%,
    rgba(104, 239, 63, 0.4),
    rgba(38, 162, 0, 0.06) 62%,
    transparent 72%
  );
}

.idcard > * {
  position: relative;
  z-index: 1;
}

.idcard__avatar {
  position: relative;
  width: 92px;
  height: 92px;
  margin: 0 auto 12px;
}

.idcard__avatar img {
  width: 100%;
  height: 100%;
  border-radius: var(--r-pill);
  border: 2px solid var(--sprout);
  object-fit: cover;
  background: var(--forest-2);
}

.idcard__cam {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: var(--r-pill);
  background: var(--sprout);
  color: var(--onyx);
  border: 3px solid var(--panel);
}

.idcard__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 27px;
  letter-spacing: -0.015em;
  line-height: 1.15;
}

.idcard__sub {
  margin: 7px 0 0;
  font-size: 13.5px;
  color: var(--fern);
}

.idcard__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 14px;
}

.total {
  margin-top: 12px;
}

.total__pts {
  font-family: var(--font-display);
  font-size: 44px;
  letter-spacing: -0.02em;
  line-height: 1;
  margin: 10px 0 4px;
  display: flex;
  align-items: baseline;
  gap: 7px;
  color: var(--white);
}

.total__pts small {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--fern);
}

.total__next {
  margin: 0;
  font-size: 13.5px;
  color: var(--fern);
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tab {
  min-height: 44px;
  padding: 0 15px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--fern);
  font-size: 13.5px;
  font-weight: 600;
  transition:
    background var(--dur-1) var(--ease-out),
    color var(--dur-1) var(--ease-out);
}

.tab:hover {
  color: var(--white);
  border-color: var(--line-2);
}

.tab.is-on {
  background: var(--sprout);
  border-color: var(--sprout);
  color: var(--onyx);
}

.hist {
  display: grid;
  gap: 11px;
}

.hist__card {
  display: flex;
  gap: 13px;
  padding: 12px;
  border-radius: var(--r-sm);
  background: var(--panel);
  border: 1px solid var(--line);
  text-align: left;
  width: 100%;
  transition:
    border-color var(--dur-1) var(--ease-out),
    background var(--dur-1) var(--ease-out);
}

.hist__card:hover {
  border-color: var(--line-2);
  background: var(--panel-2);
}

.hist__img {
  width: 68px;
  height: 68px;
  flex: none;
  object-fit: cover;
  border-radius: var(--r-xs);
  background: var(--forest-2);
}

.hist__body {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: 4px;
  align-content: center;
}

.hist__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.hist__cat {
  font-size: 14.5px;
  font-weight: 600;
}

.hist__loc {
  font-size: 12.5px;
  color: var(--fern);
}

.hist__date {
  font-size: 11.5px;
  color: var(--lichen);
}

.links {
  display: grid;
  gap: 2px;
  padding: 6px;
  margin-top: 12px;
}

.links__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border-radius: var(--r-xs);
  font-size: 14.5px;
  font-weight: 600;
  color: var(--white);
}

.links__row:hover {
  background: rgba(255, 255, 255, 0.04);
}
</style>