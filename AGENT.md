# 🤖 Greenshot — Agent de Collaboration

> Ce document définit la manière dont nous collaborons sur le projet Greenshot. Il sert de référence pour tout agent (humain ou IA) travaillant sur ce codebase.

---

## 📌 Qu'est-ce que Greenshot ?

**Greenshot** est une application web citoyenne **ClimateTech** conçue pour le **Burundi**. Elle permet aux citoyens de :

1. **Signaler** des problèmes environnementaux (déchets plastiques, décharges sauvages, pollution, déforestation) via photo + géolocalisation.
2. **Nettoyer** ces zones et prouver l'action par une photo "après".
3. **Gagner des points** selon un barème (signalement < nettoyage) et consulter un **classement (leaderboard)**.

**Objectif final** : Produire des données environnementales fiables pour mobiliser des financements auprès de bailleurs (ONG, PNUD, GEF).

---

## 🏗️ Architecture du Projet

C'est un **monorepo** avec deux grandes parties :

```
greenshot/
├── backend/          # Tout le backend est du SQL Supabase
│   ├── migrations/   # 5 fichiers SQL de création de tables
│   ├── functions/    # 6 fonctions SQL/triggers
│   ├── policies/     # RLS + Storage
│   └── README.md
├── frontend/         # App Vue 3 (Vite + Pinia + Leaflet)
│   ├── src/
│   │   ├── components/   # 5 composants Vue
│   │   ├── views/        # 6 pages/vues
│   │   ├── stores/       # 2 stores Pinia
│   │   ├── services/     # 1 client Supabase
│   │   ├── config/       # Config Leaflet/CARTO
│   │   ├── router/       # Vue Router
│   │   └── App.vue / main.js
│   └── package.json / vite.config.js
├── docs/             # Documentation projet
│   ├── PROJET.md
│   ├── SCHEMA-DB.md
│   └── CONVENTIONS.md
└── README.md
```

---

## 🔧 Stack Technique

| Couche | Technologie |
|---|---|
| **Frontend** | Vue 3 + Vite + Pinia + Vue Router |
| **Cartographie** | Leaflet + tuiles CARTO gratuites (Dark Matter / Voyager) |
| **Backend** | Supabase (PostgreSQL + PostGIS + Auth + Storage + RLS) |
| **Stockage photos** | Supabase Storage bucket `signalements-photos` |
| **Auth** | Supabase Auth — **email + mot de passe uniquement** (pas d'auth anonyme) |
| **Hébergement** | Vercel ou Netlify (frontend) |

---

## 🗄️ Base de Données — Le Backend est 100% SQL

### ⚠️ Point crucial : il n'y a PAS de serveur traditionnel (Node.js, Express, etc.)

Le backend est entièrement basé sur des **fichiers SQL Supabase**. Toute modification backend = modification SQL.

### Tables (4) :

| Table | Description |
|---|---|
| `profiles` | Profils utilisateurs (liés à `auth.users`). Colonnes : `nom`, `ville`, `username`, `phone`, `email`, `email_verified`, `score_signalement`, `score_nettoyage` |
| `categories` | Catégories de problèmes (Déchets plastiques, Décharge sauvage, Pollution eau, Déforestation, Autre) avec barème de points |
| `signalements` | Table principale. Contient `photo_avant_url`, `photo_apres_url`, `ville`, coordonnées GPS (PostGIS), statut, catégorie |
| `statuts_historique` | Journal d'audit pour la timeline des statuts |

> **Colonne `ville` — décision d'équipe.** Elle existe sur `signalements` **et** sur
> `profiles`, et ce n'est pas un doublon. `profiles.ville` = là où l'utilisateur
> habite (affichée sur son profil, utilisée pour filtrer le classement par ville).
> `signalements.ville` = là où se trouve **le problème signalé**. Un habitant de
> Gitega peut signaler un dépôt à Rohero. Le filtre « ville » de la carte porte sur
> `signalements.ville`, sinon toutes les épingles d'un même village s'afficheraient
> à la verticale les unes des autres et le comptage par commune deviendrait faux.
> **Ne pas supprimer `signalements.ville` sans revoir la carte, les épingles et le
> filtre ville en même temps.**

### Cycle de statut :
```
en_attente → vu → nettoye → traite
```

| Vers | Comment | Qui |
|---|---|---|
| `en_attente` | Valeur par défaut à l'insertion | — |
| `vu` | RPC `mettre_a_jour_statut()` | Le déclarant |
| `nettoye` | RPC `soumettre_preuve_nettoyage()` | Tout citoyen authentifié (avec contrôle GPS ≤ 50 m) |
| `traite` | RPC `mettre_a_jour_statut()` | Le déclarant |

Le statut ne se modifie **jamais** par un `UPDATE` direct : il passe toujours par une
RPC, ce qui garantit que chaque transition est vérifiée et historisée.

### Authentification des utilisateurs

| Fonctionnalité | Comportement |
|---|---|
| **Inscription** | Email + mot de passe + nom + téléphone |
| **Username auto-généré** | Premier mot du prénom, accents retirés, minuscules, + 4 chiffres aléatoires. Ex : « Aline Nzigire » → `aline_4829`, « Élodie Kabange » → `elodie_7293` |
| **Connexion par email** | `signInWithPassword({ email, password })` |
| **Connexion par username** | `obtenir_email_par_username()` récupère l'email, puis `signInWithPassword()` |
| **Vérification email** | Non bloquante à l'inscription, **obligatoire pour signaler** |
| **RLS signalements** | Seuls les comptes à `email_verified = true` peuvent créer un signalement |
| **Modification du profil** | `nom`, `ville`, `phone`, `username` uniquement |

### Fonctions SQL

**Logique métier**

| Fonction | Rôle |
|---|---|
| `handle_nouveau_signalement()` | Trigger : crédite les points signalement et crée l'entrée d'historique |
| `handle_statut_change()` | Trigger : historise **tout** changement de statut |
| `handle_new_user()` | Trigger : crée le profil + username à l'inscription |
| `handle_email_verification_update()` | Trigger : synchronise `email` et `email_verified` |
| `generate_username()` | Génère un username unique à partir du prénom |
| `soumettre_preuve_nettoyage()` | RPC : vérifie la distance GPS ≤ 50 m, bascule le statut, crédite les points |
| `mettre_a_jour_statut()` | RPC : transition de statut validée (`en_attente → vu → traite`) |
| `obtenir_classement()` | RPC : leaderboard global ou par ville, avec `DENSE_RANK` |

**Accès à la PII** (voir §Sécurité — ces colonnes ne sont pas lisibles en direct)

| Fonction | Rôle |
|---|---|
| `obtenir_mon_profil()` | Renvoie le profil complet de l'appelant (email, téléphone inclus) |
| `obtenir_email_par_username()` | Résout un username en email pour la connexion |
| `utilisateur_email_verifie()` | Booléen utilisé par la politique RLS d'insertion |

### Stockage :
- Bucket : `signalements-photos` (public, 1 Mo max, `image/jpeg|png|webp` uniquement, upload réservé aux authentifiés)
- Compression **obligatoire** côté client avant upload (`browser-image-compression`, max 0.35 MB, max 1280px)

---

## 📋 Comment créer/modifier des tables sur Supabase

### Processus standard :

1. **Écrire le fichier migration SQL** dans `backend/migrations/` avec le numérotage séquentiel :
   - `001_create_profiles.sql`
   - `002_create_categories.sql`
   - `003_create_signalements.sql`
   - `004_create_statuts_historique.sql`
   - `005_...` pour toute nouvelle table

2. **Format du fichier migration** :
   ```sql
   -- ==============================================================================
   -- 00X_nom_table.sql
   -- Description courte
   -- ==============================================================================
   
   -- Activation des extensions si nécessaire
   CREATE EXTENSION IF NOT EXISTS postgis;
   
   CREATE TABLE IF NOT EXISTS public.ma_table (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       ...
   );
   
   -- Index si nécessaire
   CREATE INDEX IF NOT EXISTS idx_ma_table_categorie ON public.ma_table (categorie_id);
   
   -- Trigger/fonction si nécessaire
   CREATE OR REPLACE FUNCTION public.ma_fonction() ...
   ```

3. **Ajouter les politiques RLS** dans `backend/policies/rls_policies.sql` :
   ```sql
   ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Description" ON public.ma_table;
   CREATE POLICY "Description" ON public.ma_table FOR SELECT/INSERT/UPDATE/DELETE
       TO authenticated USING (...) WITH CHECK (...);
   ```

4. **Ajouter les fonctions/triggers** dans `backend/functions/` si nécessaire.

5. **Déployer** dans l'ordre dans Supabase SQL Editor :
   1. Migrations
   2. Fonctions SQL
   3. Politiques RLS
   4. Politiques Storage

> ⚠️ `rls_policies.sql` doit être appliqué **après** les fonctions : il révoque
> tous les droits par défaut puis accorde l'EXECUTE sur les RPC. L'appliquer
> avant laisserait les fonctions inaccessibles, l'appliquer avant les
> migrations ferait échouer les GRANT sur des tables inexistantes.

> ⚠️ Les `REVOKE`/`GRANT` du bloc « permissions de colonnes » de
> `rls_policies.sql` sont indispensables : ce sont eux qui empêchent un
> utilisateur de modifier ses propres scores. Les supprimer revient à rouvrir
> la faille la plus grave du projet.

### Parcours utilisateur de référence

À vérifier à chaque livraison :

1. **Inscription** → email + mot de passe + nom + téléphone. Le trigger
   `handle_new_user` crée le profil et attribue un `username` du type `aline_4829`.
2. **Navigation sans email vérifié** → autorisé. Le bandeau d'avertissement
   s'affiche. Les boutons de signalement et de nettoyage sont bloqués.
3. **Vérification email** → le trigger met à jour `profiles.email_verified`.
4. **Signalement** → photo compressée, GPS automatique (corrigeable), catégorie,
   ville, description. `statut` démarre à `en_attente`, les points
   `points_signalement` sont crédités, la première entrée d'historique est écrite.
5. **Consultation** → la carte affiche le signalement avec sa ville et sa couleur
   de statut ; le détail affiche la timeline.
6. **Nettoyage par un citoyen** → photo « après », contrôle GPS ≤ 50 m.
   Si la distance dépasse 50 m, la preuve est refusée et l'utilisateur voit la
   distance mesurée. Sinon le statut passe à `nettoye` et les points
   `points_nettoyage` sont crédités.
7. **Classement** → le citizen apparaît au rang correspondant à la somme de ses
   points, filtrable par ville.

### Règles pour les nouvelles tables :

- **Nom** : snake_case, pluriel (ex: `commentaires`, `photos`)
- **Clé primaire** : toujours `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Clé étrangère** : `nom_table_singulier_id UUID REFERENCES public.nom_table_singulier(id) ON DELETE CASCADE`
- **Timestamps** : `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Soft delete** : pas de deleted_at, préférer une colonne de statut si besoin
- **Index** : toujours ajouter des index pour les colonnes de filtrage fréquentes
- **PostGIS** : si la table a besoin de coordonnées GPS, ajouter `location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED`

---

## 🎨 Frontend — Structure et Conventions

### Composants (`src/components/`) :
| Composant | Rôle |
|---|---|
| `FormSignalement.vue` | Formulaire principal de signalement (photo, GPS, catégorie, description) |
| `CarteInteractive.vue` | Carte Leaflet avec marqueurs colorés par statut |
| `BadgeStatut.vue` | Badge coloré affichant le statut du signalement |
| `ModalNettoyage.vue` | Modal pour soumettre une preuve de nettoyage |
| `CarteScore.vue` | Classement/leaderboard avec filtres par ville |

### Vues (`src/views/`) :
| Vue | Route | Rôle |
|---|---|---|
| `Signalement.vue` | `/` | Page d'accueil = formulaire de signalement |
| `Carte.vue` | `/carte` | Carte avec filtres (catégorie, statut, ville) |
| `Nettoyage.vue` | `/nettoyage` | Sélection d'un signalement + soumission preuve |
| `Classement.vue` | `/classement` | Leaderboard |
| `DetailSignalement.vue` | `/signalement/:id` | Détail d'un signalement + timeline |
| `Profil.vue` | `/profil` | Profil utilisateur + historique |

### Stores Pinia (`src/stores/`) :
- **`signalementStore.js`** : État des signalements et catégories (encore minimal, à enrichir)
- **`userStore.js`** : Session utilisateur, profil, authentification

### Services :
- **`supabaseClient.js`** : Configuration du client Supabase (URL + anon key depuis `.env`)

---

## 📝 Conventions de Code

### Commits (Conventional Commits) :
```
<type>(<scope>): <description>
```
- Types : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `chore`
- Scopes : `frontend`, `backend`, `backend-migration`, `backend-function`, `backend-policy`, `docs`, `ui`
- Exemples : `feat(frontend-carte): ajout filtre par ville`, `feat(backend-migration): ajout table commentaires`

### Nommage Frontend :
- Composants Vue : **PascalCase** (`FormSignalement.vue`)
- Stores : **camelCase** avec suffixe `Store` (`signalementStore.js`)
- Variables/fonctions JS : **camelCase**
- Classes CSS : **kebab-case**

### Nommage Backend (SQL) :
- Tables : **snake_case** pluriel (`signalements`, `statuts_historique`)
- Colonnes : **snake_case** (`user_id`, `photo_avant_url`)
- Fonctions : **snake_case** (`calculer_score_utilisateur`)

---

## ⚠️ Points d'Attention / Pièges Connus

### Corrigé en septembre 2026 — ne pas réintroduire ces failles

Une revue de sécurité a été faite avant le premier déploiement. Les 9 points
ci-dessous ont été corrigés. Ils sont documentés ici parce que **plusieurs sont
invisibles dans le code** : un futur développeur pourrait très bien les
« simplifier » et réouvrir la faille.

| # | Problème | Correction appliquée |
|---|---|---|
| 1 | `signalements` n'avait **pas** de colonne `ville`, alors que le formulaire l'envoyait → toute création de signalement échouait | Colonne `ville` + index ajoutés en migration 003 |
| 2 | Un utilisateur pouvait écrire dans `score_signalement` / `score_nettoyage` et se placer n°1 au classement | `GRANT UPDATE (nom, ville, phone, username)` seulement. Les scores sont modifiés **uniquement** par les triggers |
| 3 | Tout utilisateur authentifié pouvait modifier latitude / longitude / photo de **n'importe quel** signalement → preuves falsifiables | `GRANT UPDATE (description)` + politique limitée au déclarant. Statut et nettoyage passent par RPC |
| 4 | `SELECT` public sur `profiles` exposait **email et téléphone** de tous les citoyens | `GRANT SELECT` colonne par colonne, sans `email` ni `phone`. Accès via `obtenir_mon_profil()` |
| 5 | L'historique n'écrivait qu'à 2 endroits : les transitions `en_attente → vu → traite` n'étaient **jamais** journalisées | Trigger `handle_statut_change` sur `AFTER UPDATE OF statut` |
| 6 | Tout utilisateur authentifié pouvait insérer **n'importe quelle** ligne d'historique → timeline falsifiable | politique `INSERT` supprimée. Écriture réservée aux triggers |
| 7 | Un changement d'email côté Auth ne se répercutait pas dans `profiles` → connexion par username cassée | `handle_email_verification_update()` synchronise `email` **et** `email_verified` |
| 8 | `generate_username()` produisait `_line__zigire_8996` : la regex tournait **avant** le `lower()`, donc les majuscules étaient remplacées | `unaccent` + `lower`, puis suppression des non-alphanumériques. Premier mot seulement |
| 9 | Postgres accorde `EXECUTE` à `PUBLIC` sur toute nouvelle fonction → les fonctions `SECURITY DEFINER` étaient appelables par un visiteur anonyme | `REVOKE ... FROM PUBLIC` systematically, puis `GRANT` nominatif. Voir §Sécurité |

### Sécurité — règles à respecter pour toute évolution

Ce projet protège des données de citoyens burundais (email, téléphone, position
géographique). Les règles suivantes ne sont pas optionnelles.

1. **Les scores ne sont jamais modifiables par le client.** Ni en ajoutant une
   colonne, ni en élargissant le `GRANT`. Un seul point de modification et
   l'application perd sa valeur.
2. **Les colonnes PII ne sont pas accordées au rôle `anon`.** Si un jour
   `profiles.select('*')` est nécessaire côté client, passer par une fonction.
3. **Toute fonction `SECURITY DEFINER` porte `SET search_path = public, pg_temp`**,
   et son `EXECUTE` est révoqué sur `PUBLIC` avant tout `GRANT`.
4. **Supabase accorde `EXECUTE` à `anon` et `authenticated` par défaut, ensemble.**
   Un `GRANT ... TO authenticated` laisse aussi passer `anon` : il faut un
   `REVOKE ... FROM anon` explicite si la fonction doit rester privée.
5. **Le statut ne se change que par RPC.** Un `UPDATE` direct contournerait à la
   fois le contrôle GPS et l'historisation.
6. **Les 4 alertes Advisors restantes sont intentionnelles** : ce sont les RPC
   legitimes (`obtenir_classement`, `obtenir_email_par_username`,
   `obtenir_mon_profil`, `soumettre_preuve_nettoyage`). Ne pas y remédier
   machinalement, cela casserait l'application.

### Autres incohérences entre frontend et backend :
1. **`signalementStore`** est un stub : il ne contient que des `ref`, aucune action.
   Les appels Supabase sont faits directement dans les vues.
2. **`ModalNettoyage.vue`** existe mais n'est jamais monté. Tout le flux de
   nettoyage est dans `Nettoyage.vue`. Ne pas s'appuyer sur ce composant.
3. **Données de démonstration** : les vues contiennent encore des données de
   démo, mais elles sont désormais **conditionnées à `import.meta.env.DEV`**.
   Elles servent au travail de mise en page en local et **n'existent plus dans
   le build de production**.
   → Raison : Greenshot vend de la donnée fiable à des bailleurs. Un classement
   affichant « Jean-Claude N. — 300 pts » sur une base vide, ou 3 signalements
   fictifs posés sur de vraies coordonnées de Bujumbura, ferait prendre du
   décor pour du terrain. Inacceptable devant un bailleur.
   → **Toute donnée de démo ajoutée plus tard doit être encadrée par `import.meta.env.DEV`.**
   → Test de non-régression : `npm run build && npm run preview` doit afficher un
     état vide, jamais des noms fictifs.
   → Le formulaire de signalement ne substitue **plus** de position GPS par
     défaut, et les catégories de secours ne sont plus envoyables.
4. **Jointure `profiles:user_id(nom)`** dans `DetailSignalement.vue` : elle
   fonctionne car `user_id` référence bien `profiles(id)`. L'alias `profiles`
   est explicite, pas implicite.

### Sécurité (variables d'environnement) :
- Le fichier `.env` contient la **clé anon** Supabase, qui est publique par nature
  (elle est embarquée dans le JS du navigateur). Ce n'est pas un secret.
- La **clé service_role** en revanche ne doit **JAMAIS** apparaître dans le frontend
  ni dans Git : elle contourne toutes les politiques RLS.
- `.env` est dans `.gitignore`, seule `.env.example` est versionné.

### Performance / Data :
- Compression **obligatoire** des photos avant upload (0.35 MB max, 1280px max)
- Le Burundi a une connectivité internet limitée (12-26%)
- Le client doit rester léger
- **Géolocalisation** : capturée automatiquement à l'ouverture du formulaire, mais
  l'utilisateur peut corriger latitude/longitude à la main. En cas d'échec du GPS,
  on ne substitue **aucune** position par défaut : la saisie manuelle est exigée.
  Raison : une position fausse par défaut placerait le signalement au centre-ville
  de Bujumbura, ce qui fausserait à la fois la carte et les statistiques
  communiquées aux bailleurs.

---

## 🔄 Workflow de Développement

### Quand on veut ajouter une fonctionnalité :

1. **Identifier** si c'est frontend ou backend (ou les deux)
2. **Backend** : Écrire la migration SQL → Tester dans Supabase SQL Editor → Ajouter RLS → Mettre à jour la doc
3. **Frontend** : Créer/modifier le composant ou la vue → Mettre à jour le router si nécessaire → Tester
4. **Commit** : Suivre les conventions de commit

### Quand on veut modifier le schéma DB :

1. Créer un nouveau fichier migration dans `backend/migrations/`
2. Mettre à jour `docs/SCHEMA-DB.md`
3. Mettre à jour le frontend si nécessaire (nouvelles colonnes = nouveaux selects/inserts)
4. Ajouter les RLS correspondantes

---

## 📚 Documentation de Référence

- **[Vision & Périmètre V1.0](docs/PROJET.md)** — Détail des fonctionnalités et contraintes
- **[Schéma de la Base de Données](docs/SCHEMA-DB.md)** — Tables, colonnes, types, relations
- **[Conventions de code](docs/CONVENTIONS.md)** — Standards Git, nommage, bonnes pratiques

---

## 🚀 Démarrage Rapide

### Backend :
1. Créer un projet Supabase sur [supabase.com]
2. Activer l'extension **PostGIS**
3. Exécuter les migrations dans l'ordre dans SQL Editor
4. Installer les fonctions SQL et triggers
5. Appliquer les politiques RLS
6. Configurer le bucket `signalements-photos` dans Storage

### Frontend :
1. `cd frontend`
2. `npm install`
3. `cp .env.example .env` (remplir avec l'URL et la clé anon Supabase)
4. `npm run dev`

---

## 🤝 Rôle de cet Agent (AGENT.md)

Cet agent est conçu pour vous aider à :
- **Créer et modifier des tables** sur Supabase (écrire des fichiers SQL de migration)
- **Créer des fonctions SQL** et triggers pour la logique métier
- **Configurer les politiques RLS** de sécurité
- **Déboguer le backend** (queries, permissions, triggers)
- **Comprendre et naviguer dans le code frontend**
- **Respecter les conventions** du projet
- **Poser des questions** quand quelque chose est ambigu

Quand vous me demandez de créer des tables ou des fonctions, je produirai toujours :
1. Le fichier SQL complet et testé
2. Les RLS associées
3. La mise à jour de la documentation si nécessaire
4. Une explication claire de ce qui a été fait

---

*Dernière mise à jour : Septembre 2026*
