<template>
  <div class="page-signalement-ia">
    <RouterLink to="/signaler" class="mode-manuel-link">
      <span class="back-icon" aria-hidden="true">←</span>
      <span class="back-copy">
        <strong>Retour au signalement manuel</strong>
        <small>Revenir au parcours classique</small>
      </span>
    </RouterLink>
    <div class="page-heading">
      <p class="eyebrow">NOUVEAU PARCOURS</p>
      <h2>Signalement assisté par IA</h2>
      <p class="subtitle">L’IA propose une description et un tri à partir de la photo. Vous gardez le dernier mot avant l’envoi.</p>
    </div>
    <FormSignalementIA />
  </div>
</template>

<script setup>
import FormSignalementIA from '../components/FormSignalementIA.vue'
</script>

<style scoped>
.page-signalement-ia {
  max-width: 520px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.mode-manuel-link {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 54px;
  margin-bottom: 1.1rem;
  padding: 0.55rem 1rem 0.55rem 0.65rem;
  border: 1px solid #173b2e;
  border-radius: 12px;
  background: linear-gradient(135deg, #1f4d3a, #173b2e);
  color: #fff;
  box-shadow: 0 5px 14px rgba(31, 77, 58, 0.18);
  text-decoration: none;
  transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
}

.mode-manuel-link:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #286247, #1f4d3a);
  box-shadow: 0 7px 18px rgba(31, 77, 58, 0.24);
}

.mode-manuel-link:focus-visible {
  outline: 3px solid #e8a33d;
  outline-offset: 3px;
}

.back-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 1.25rem;
}

.back-copy {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.back-copy strong {
  font-size: 0.86rem;
  line-height: 1.2;
}

.back-copy small {
  color: #d7e6dc;
  font-size: 0.72rem;
}

.page-heading {
  margin-bottom: 1.5rem;
}

.eyebrow {
  margin-bottom: 0.35rem;
  color: var(--color-primary, #1f4d3a);
  font-size: 0.72rem;
  font-weight: 800;
}

h2 {
  margin-bottom: 0.3rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-muted, #64748b);
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>