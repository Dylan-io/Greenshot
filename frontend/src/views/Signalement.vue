<template>
  <div class="page-signalement">
    <header class="signalement-page-header">
      <div class="header-tag">
        <span class="tag-pulse"></span>
        Action Citoyenne · Burundi
      </div>
      <h1 class="page-title">Nouveau signalement</h1>
      <p class="page-subtitle">
        Prenez une photo sur le terrain et géolocalisez un déchet pour mobiliser la communauté et cumuler des points.
      </p>
    </header>

    <main class="signalement-body">
      <FormSignalement />
    </main>
  </div>
</template>

<script setup>
import FormSignalement from '../components/FormSignalement.vue'
</script>

<style scoped>
.page-signalement {
  max-width: 520px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.signalement-page-header {
  margin-bottom: 1.25rem;
  text-align: left;
}

.header-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background-color: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full, 9999px);
  margin-bottom: 0.6rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.tag-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-primary, #1F4D3A);
  animation: pulse 1.8s infinite;
}

.page-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  line-height: 1.2;
  margin-bottom: 0.45rem;
}

.page-subtitle {
  color: var(--color-text-muted, #64748B);
  font-size: 0.92rem;
  line-height: 1.45;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.45rem;
  }
  .page-subtitle {
    font-size: 0.88rem;
  }
}
</style>
