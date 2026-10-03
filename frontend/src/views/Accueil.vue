<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import ScreenBar from '../components/ScreenBar.vue'
import LevelCard from '../components/LevelCard.vue'
import StatStrip from '../components/StatStrip.vue'
import ReportList from '../components/ReportList.vue'
import EmptyState from '../components/EmptyState.vue'
import ActivityChart from '../components/ActivityChart.vue'

const router = useRouter()
const userStore = useUserStore()

const profile = computed(() => userStore.profile || {})
const reports = ref([])

const SEUIL = 250

const scoreTotal = computed(
  () => (profile.value.score_signalement || 0) + (profile.value.score_nettoyage || 0)
)
const niveau = computed(() => Math.max(1, Math.floor(scoreTotal.value / SEUIL) + 1))

const stats = computed(() => [
  { value: reports.value.length, label: 'signalements publiés' },
  { value: reports.value.filter((r) => r.statut === 'nettoye').length, label: 'nettoyages validés' },
  { value: reports.value.length, label: 'actions cette semaine' }
])

onMounted(async () => {
  userStore.initAuth()
  // La base est vide en V1. Aucun signalement de démonstration n'est injecté.
  const result = await userStore.chargerMesSignalements?.()
  reports.value = Array.isArray(result) ? result : []
})
</script>

<template>
  <ScreenBar title="Bonjour Éclaireur" subtitle="Prêt à verdir votre quartier ?" />

  <div class="gs-pad">
    <LevelCard
      :points="scoreTotal"
      :niveau="niveau"
      :seuil="SEUIL"
      @signaler="router.push('/signaler')"
      @carte="router.push('/carte')"
    />

    <StatStrip :stats="stats" />

    <section aria-labelledby="sec-nettoyer">
      <div class="h-sec">
        <h2 id="sec-nettoyer" class="h-sec__title">À nettoyer près de vous</h2>
        <button type="button" class="iconbtn" aria-label="Actualiser la liste">
          <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
            <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <ReportList
        v-if="reports.length"
        :items="reports"
        @select="router.push(`/signalement/${$event.id}`)"
      />
      <EmptyState
        v-else
        icon="bin"
        title="Aucun déchet signalé autour de vous"
        text="Soyez la première personne à signaler un déchet dans votre quartier. Une photo suffit pour lancer la validation."
        action-label="Signaler le premier déchet"
        @action="router.push('/signaler')"
      />
    </section>

    <ActivityChart :entries="reports" />

    <section aria-labelledby="sec-defis">
      <div class="h-sec">
        <h2 id="sec-defis" class="h-sec__title">Mes défis du jour</h2>
        <router-link to="/profil" class="h-sec__link">Voir tout</router-link>
      </div>
      <p class="card card--flat dim">
        Les défis quotidiens s'activent dès votre première action.
      </p>
    </section>
  </div>
</template>