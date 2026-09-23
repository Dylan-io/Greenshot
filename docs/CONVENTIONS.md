# Conventions de Développement — CleanShoot

Pour garantir une collaboration fluide entre le Frontend et le Backend, voici les standards adoptés sur le projet.

---

## 1. Conventions Git & Commits

Nous utilisons la convention **Conventional Commits** :

`<type>(<scope>): <description en français ou anglais, verbe à l'infinitif>`

### Types :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage, CSS, indentations sans modification de logique
- `refactor` : Réorganisation de code sans nouvelle feature ni correction de bug
- `perf` : Optimisation de performance (notamment réduction de poids assets / requêtes)
- `chore` : Maintenance, mise à jour de dépendances, configuration

### Scopes recommandés :
- `frontend` ou composant précis (ex: `feat(frontend-carte): ajout des filtres par catégorie`)
- `backend` ou table (ex: `feat(backend-rls): ajout des politiques de lecture sur signalements`)
- `docs` (ex: `docs(schema): ajout table statuts_historique`)

---

## 2. Conventions de Nommage

### Frontend (Vue.js / JavaScript) :
* **Composants Vue :** PascalCase (ex: `FormSignalement.vue`, `CarteInteractive.vue`).
* **Vues (Pages) :** PascalCase (ex: `Signalement.vue`, `Carte.vue`).
* **Stores Pinia :** camelCase préfixé ou suffixé par `Store` (ex: `signalementStore.js`).
* **Fichiers JS utilitaires / services :** camelCase (ex: `supabaseClient.js`).
* **Variables & Fonctions JS :** camelCase (ex: `compresserImage()`, `recupererSignalements()`).
* **Classes CSS :** kebab-case (ex: `.carte-container`, `.btn-signalement`).

### Backend (PostgreSQL / Supabase) :
* **Noms de tables :** snake_case au pluriel (ex: `profiles`, `categories`, `signalements`, `statuts_historique`).
* **Noms de colonnes :** snake_case (ex: `user_id`, `score_total`, `photo_url`, `created_at`).
* **Clés primaires :** toujours nommées `id`.
* **Clés étrangères :** `nom_table_singulier_id` (ex: `user_id`, `categorie_id`, `signalement_id`).
* **Fonctions SQL :** snake_case (ex: `calculer_score_utilisateur()`).

---

## 3. Gestion des Données & Bonnes Pratiques
* **Pas de secrets dans Git :** Ne jamais commiter `.env`. Seul `.env.example` doit être versionné.
* **Sobriété data :** Toujours valider la compression d'image avant upload pour ne pas surcharger la data mobile des utilisateurs burundais ni l'espace de stockage Supabase.
