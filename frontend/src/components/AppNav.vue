<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const profile = computed(() => userStore.profile || {})

const items = [
  { to: '/', label: 'Accueil', path: '/' },
  { to: '/carte', label: 'Carte', path: '/carte' },
  { to: '/signaler', label: 'Signaler', path: '/signaler', cam: true },
  { to: '/classement', label: 'Classement', path: '/classement' },
  { to: '/profil', label: 'Profil', path: '/profil' }
]

const avatarUrl = computed(
  () => profile.value.avatar_url || '/avatars/avatar-camille.svg'
)

const displayName = computed(() => profile.value.nom || 'Invité')
const scoreTotal = computed(
  () => (profile.value.score_signalement || 0) + (profile.value.score_nettoyage || 0)
)

function isActive(item) {
  return route.path === item.path
}
</script>

<template>
  <nav class="gs-nav" aria-label="Navigation principale">
    <div class="nav-brand">
      <span class="nav-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22c5-3 8-7 8-12a8 8 0 1 0-16 0c0 5 3 9 8 12Z" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="nav-brand__word">Green<em>shot</em></span>
    </div>

    <div class="nav-items">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="navitem"
        :class="{ 'navitem--cam': item.cam }"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path v-if="item.label === 'Accueil'" d="M4 11 12 4l8 7v9H4z" stroke-linejoin="round" />
          <path v-else-if="item.label === 'Carte'" d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14" stroke-linejoin="round" />
          <path v-else-if="item.cam" d="M4 8h3l2-2h6l2 2h3v11H4z" stroke-linejoin="round" />
          <circle v-else-if="item.label === 'Signaler'" cx="12" cy="12" r="8" />
          <path v-else-if="item.label === 'Classement'" d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 13v7" stroke-linecap="round" stroke-linejoin="round" />
          <path v-else d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" stroke-linecap="round" />
        </svg>
        <span>{{ item.label }}</span>
      </router-link>
    </div>

    <div class="nav-foot">
      <router-link to="/profil" class="you">
        <img :src="avatarUrl" alt="" class="you__avatar" />
        <span class="you__body">
          <span class="you__name">{{ displayName }}</span>
          <span class="you__lvl">Niveau 1 · {{ scoreTotal }} pts</span>
        </span>
      </router-link>

      <button type="button" class="btn btn--primary btn--block" @click="router.push('/signaler')">
        Signaler
      </button>
    </div>
  </nav>
</template>

<style scoped>
.gs-nav {
  grid-area: nav;
  border-top: 1px solid var(--line);
  background: rgba(10, 21, 9, 0.96);
  backdrop-filter: blur(14px);
  padding: 8px 10px calc(9px + env(safe-area-inset-bottom));
}

.nav-brand,
.nav-foot {
  display: none;
}

.nav-items {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
}

.navitem {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 8px 2px;
  border-radius: 12px;
  color: var(--lichen);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.2;
  min-height: 56px;
  transition:
    color var(--dur-1) var(--ease-out),
    background var(--dur-1) var(--ease-out);
}

.navitem:hover {
  color: var(--white);
  background: rgba(255, 255, 255, 0.04);
}

.navitem[aria-current='page'] {
  color: var(--sprout);
  background: rgba(104, 239, 63, 0.1);
}

/* ═══════════════════════════════════════════════════════════════════════
   ≥1024px — barre latérale
   ═══════════════════════════════════════════════════════════════════════ */

@media (min-width: 1024px) {
  .gs-nav {
    display: flex;
    flex-direction: column;
    border-top: none;
    border-right: 1px solid var(--line);
    background: var(--forest-2);
    backdrop-filter: none;
    padding: 22px 16px;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 2px 6px 22px;
  }

  .nav-brand__mark {
    width: 42px;
    height: 42px;
    flex: none;
    display: grid;
    place-items: center;
    border-radius: var(--r-sm);
    background: var(--sprout);
    color: var(--onyx);
  }

  .nav-brand__word {
    font-family: var(--font-display);
    font-size: 23px;
    letter-spacing: -0.02em;
    color: var(--white);
  }

  .nav-brand__word em {
    font-style: normal;
    color: var(--sprout);
  }

  .nav-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .navitem {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    font-size: 14.5px;
    border-radius: var(--r-sm);
    min-height: 48px;
  }

  .navitem[aria-current='page'] {
    background: rgba(104, 239, 63, 0.12);
  }

  /* L'icône Signaler garde son disque vert : c'est l'icône de l'app.
     Actif, elle passe en blanc — on sait où l'on est sans lire le libellé. */
  .navitem--cam .ic {
    width: 24px;
    height: 24px;
    padding: 6px;
    border-radius: 50%;
    background: var(--sprout);
    color: var(--onyx);
    stroke-width: 2;
    transition: background var(--dur-1) var(--ease-out);
  }

  .navitem--cam:hover .ic {
    background: #7cf55c;
  }

  .navitem--cam[aria-current='page'] .ic {
    background: var(--white);
    color: var(--onyx);
  }

  .navitem--cam[aria-current='page'] {
    color: var(--sprout);
  }

  .nav-foot {
    display: grid;
    gap: 10px;
    margin-top: auto;
    padding-top: 16px;
  }

  .you {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 11px 13px;
    border-radius: var(--r-sm);
    background: var(--panel);
    border: 1px solid var(--line);
  }

  .you:hover {
    border-color: var(--line-2);
  }

  .you__avatar {
    width: 38px;
    height: 38px;
    flex: none;
    border-radius: var(--r-pill);
    object-fit: cover;
    background: var(--forest-3);
  }

  .you__body {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .you__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--white);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .you__lvl {
    font-size: 11.5px;
    color: var(--fern);
  }
}

@media (min-width: 1440px) {
  .gs-nav {
    width: 288px;
  }
}
</style>