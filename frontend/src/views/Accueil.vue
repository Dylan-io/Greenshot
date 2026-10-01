<template>
  <div class="page-accueil">
    
    <!-- Hero Banner Citoyen -->
    <header class="accueil-hero">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        Plateforme Éco-Citoyenne · Burundi
      </div>
      <h1 class="hero-title">Gardons notre environnement propre</h1>
      <p class="hero-subtitle">
        Signalez les déchets, participez aux actions de nettoyage citoyen et gagnez des points.
      </p>
    </header>

    <!-- Cartes d'Actions Principales -->
    <div class="actions-grid">
      <!-- Action 1 : Signaler (Action Principale Ambre) -->
      <router-link to="/signaler" class="action-card card-signaler">
        <div class="card-icon-wrapper icon-amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <div class="card-content">
          <div class="card-top-row">
            <h2 class="card-title">Nouveau signalement</h2>
            <span class="badge-pts">+10 à 20 pts</span>
          </div>
          <p class="card-desc">Prenez en photo un déchet ou une décharge avec votre position GPS.</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>

      <!-- Action 2 : Nettoyer -->
      <router-link to="/nettoyage" class="action-card card-nettoyer">
        <div class="card-icon-wrapper icon-forest">
          <!-- Icône Nettoyage Citoyen (étincelles & balai écologique) -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z"/>
            <path d="M19 15l1 2.2L22.2 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>
            <path d="M5 16l.8 1.8L7.6 18.5l-1.8.7L5 21l-.7-1.8L2.5 18.5l1.8-.7L5 16z"/>
          </svg>
        </div>
        <div class="card-content">
          <div class="card-top-row">
            <h2 class="card-title">Nettoyer une zone</h2>
            <span class="badge-pts-clean">+30 à 60 pts</span>
          </div>
          <p class="card-desc">Prenez en photo une zone assainie sur le terrain pour valider l'action.</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>

      <!-- Action 3 : Voir la Carte -->
      <router-link to="/carte" class="action-card card-carte">
        <div class="card-icon-wrapper icon-neutral">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
        </div>
        <div class="card-content">
          <h2 class="card-title">Explorer la carte</h2>
          <p class="card-desc">Visualisez les signalements à Bujumbura, Gitega et dans tout le pays.</p>
        </div>
        <span class="card-arrow">→</span>
      </router-link>
    </div>

  </div>
</template>

<script setup>
// Vue Accueil Greenshot
</script>

<style scoped>
.page-accueil {
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 1.5rem;
}

.accueil-hero {
  margin-bottom: 1.5rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background-color: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-primary, #1F4D3A);
}

.hero-title {
  font-family: var(--font-title);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-text, #0F172A);
  line-height: 1.25;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted, #64748B);
  line-height: 1.45;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.action-card {
  background-color: var(--color-card, #FFFFFF);
  border: 1px solid var(--color-border, #E5E9E2);
  border-radius: 16px;
  padding: 1.15rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.07);
}

.card-signaler {
  border-left: 4px solid var(--color-amber, #E8A33D);
}

.card-nettoyer {
  border-left: 4px solid var(--color-primary, #1F4D3A);
}

.card-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-wrapper svg {
  width: 22px;
  height: 22px;
}

.icon-amber {
  background-color: var(--color-amber-light, #FDF6EB);
  color: var(--color-amber, #E8A33D);
}

.icon-forest {
  background-color: var(--color-primary-light, #EBF3EF);
  color: var(--color-primary, #1F4D3A);
}

.icon-neutral {
  background-color: #F1F5F9;
  color: #475569;
}

.card-content {
  flex: 1;
}

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
}

.card-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text, #0F172A);
}

.badge-pts {
  font-size: 0.72rem;
  font-weight: 800;
  background-color: var(--color-amber, #E8A33D);
  color: #0F172A;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.badge-pts-clean {
  font-size: 0.72rem;
  font-weight: 800;
  background-color: var(--color-primary, #1F4D3A);
  color: #FFFFFF;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.card-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748B);
  line-height: 1.35;
}

.card-arrow {
  font-size: 1.2rem;
  color: #94A3B8;
  transition: transform 0.15s ease;
}

.action-card:hover .card-arrow {
  transform: translateX(3px);
  color: var(--color-primary, #1F4D3A);
}
</style>
