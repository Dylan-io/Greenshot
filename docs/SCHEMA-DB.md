# Schéma de la Base de Données — Greenshot (Supabase / PostgreSQL)

Ce document décrit en clair les tables, colonnes, types de données et relations du modèle validé pour Greenshot V1.0.

---

## 1. Table `profiles`
Stocke les informations des utilisateurs (liée au compte Supabase `auth.users`).

| Colonne | Type SQL | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE` | Identifiant unique de l'utilisateur |
| `nom` | `TEXT` | `NOT NULL` | Nom ou prénom public |
| `ville` | `TEXT` | `DEFAULT 'Bujumbura'` | Ville ou commune de résidence au Burundi |
| `username` | `TEXT` | `UNIQUE` | Nom d'utilisateur (auto-généré : prénom + 4 chiffres aléatoires) |
| `phone` | `TEXT` | — | Numéro de téléphone pour contact |
| `email` | `TEXT` | `UNIQUE` | Email utilisé pour la connexion |
| `email_verified` | `BOOLEAN` | `DEFAULT false` | `true` si l'utilisateur a vérifié son email |

**Colonnes non lisibles par le client :** `email` et `phone` ne sont volontairement
pas accordées au rôle `anon` ni à `authenticated`. La clé anon est publique
(embarquée dans le JS) : sans cette restriction, n'importe quel visiteur pourrait
lire les coordonnées de tous les citoyens sans créer de compte. Le profil de
l'appelant s'obtient via la fonction `obtenir_mon_profil()`.
| `score_signalement` | `INTEGER` | `DEFAULT 0, CHECK (score_signalement >= 0)` | Points cumulés pour les signalements créés |
| `score_nettoyage` | `INTEGER` | `DEFAULT 0, CHECK (score_nettoyage >= 0)` | Points cumulés pour les nettoyages prouvés |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT now()` | Date d'inscription |

**Index :**
- `idx_profiles_score` — Pour le classement rapide
- `idx_profiles_ville` — Pour le filtrage par ville
- `idx_profiles_username` — Pour la recherche par username
- `idx_profiles_email` — Pour la recherche par email

---

## 2. Table `categories`
Table de référence des catégories de problèmes environnementaux.

| Colonne | Type SQL | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identifiant unique de la catégorie |
| `nom` | `TEXT` | `NOT NULL, UNIQUE` | Libellé (ex: "Déchets plastiques", "Décharge sauvage", "Pollution eau", etc.) |
| `points_signalement` | `INTEGER` | `CHECK (points_signalement > 0)` | Points accordés au déclarant |
| `points_nettoyage` | `INTEGER` | `CHECK (points_nettoyage > points_signalement)` | Points accordés au nettoyeur (toujours supérieur) |

**Données initiales :**
| Nom | Points signalement | Points nettoyage |
|---|---|---|
| Déchets plastiques | 10 | 30 |
| Décharge sauvage | 15 | 45 |
| Pollution eau | 20 | 50 |
| Déforestation | 20 | 60 |
| Autre | 10 | 25 |

---

## 3. Table `signalements`
Table principale des signalements et preuves de nettoyage (avec PostGIS).

| Colonne | Type SQL | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identifiant unique du signalement |
| `user_id` | `UUID` | `NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE` | Déclarant initial du problème |
| `categorie_id` | `UUID` | `NOT NULL, REFERENCES categories(id) ON DELETE RESTRICT` | Catégorie du problème |
| `photo_avant_url` | `TEXT` | `NOT NULL` | URL de la photo initiale ("avant") |
| `photo_apres_url` | `TEXT` | `NULLABLE` | URL de la photo de preuve ("après nettoyage") |
| `nettoye_par_user_id`| `UUID` | `NULLABLE, REFERENCES profiles(id) ON DELETE SET NULL` | Utilisateur ayant nettoyé le site |
| `date_nettoyage` | `TIMESTAMPTZ`| `NULLABLE` | Date et heure de validation du nettoyage |
| `latitude` | `NUMERIC(10,7)` | `NOT NULL` | Latitude GPS décimale |
| `longitude` | `NUMERIC(10,7)` | `NOT NULL` | Longitude GPS décimale |
| `location` | `GEOGRAPHY(Point, 4326)` | `STORED`, générée | Colonne spatiale PostGIS pour les calculs géodésiques |
| `ville` | `TEXT` | `NULLABLE` | **Ville/commune du LIEU signalé** (pas celle du profil) |
| `description` | `TEXT` | `NULLABLE` | Description optionnelle |
| `statut` | `TEXT` | `DEFAULT 'en_attente', CHECK (statut IN ('en_attente', 'vu', 'nettoye', 'traite'))` | Cycle de vie du signalement |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT now()` | Date et heure du signalement |

**Colonne `ville` — pourquoi elle existe en plus de `profiles.ville` :**
`profiles.ville` est la ville de **résidence** de l'utilisateur (elle sert au
filtre du classement). `signalements.ville` est la ville **où se trouve le
problème**. Les deux peuvent différer : un habitant de Gitega signale un dépôt à
Rohero. Sans cette colonne, le filtre « ville » de la carte regrouperait à tort
tous les signalements sous la ville d'un seul citoyen et le comptage par commune
communiqué aux bailleurs serait faux.

**RLS sur INSERT :** l'utilisateur doit avoir `email_verified = true` dans `profiles`
(vérifié via la fonction `utilisateur_email_verifie()`) et ne peut créer un
signalement que pour lui-même.

**RLS sur UPDATE :** le rôle client n'a le droit d'écrire que sur la colonne
`description`, et seulement sur ses propres signalements. La latitude, la
longitude, les photos et le statut sont hors de portée d'un `UPDATE` direct : ils
passent par `soumettre_preuve_nettoyage()` ou `mettre_a_jour_statut()`.

**Index :**
- `idx_signalements_location` — Index spatial PostGIS pour la carte
- `idx_signalements_statut` — Pour filtrer par statut
- `idx_signalements_categorie` — Pour filtrer par catégorie
- `idx_signalements_user` — Pour les signalements d'un utilisateur
- `idx_signalements_nettoyeur` — Pour les nettoyages d'un utilisateur
- `idx_signalements_ville` — Pour le filtre « ville » de la carte

---

## 4. Table `statuts_historique`
Journal d'audit pour afficher la timeline du signalement (`en_attente` ➔ `vu` ➔ `nettoye` ➔ `traite`).

| Colonne | Type SQL | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identifiant unique de l'entrée d'historique |
| `signalement_id` | `UUID` | `NOT NULL, REFERENCES signalements(id) ON DELETE CASCADE` | Signalement associé |
| `ancien_statut` | `TEXT` | `NULLABLE` | Statut précédent |
| `nouveau_statut` | `TEXT` | `NOT NULL, CHECK (nouveau_statut IN ('en_attente', 'vu', 'nettoye', 'traite'))` | Nouveau statut appliqué |
| `date` | `TIMESTAMPTZ`| `DEFAULT now()` | Horodatage de l'événement |

**Index :** `idx_statuts_historique_signalement` — Pour charger rapidement la timeline

---

## Fonctions et Triggers Métier

### 1. Trigger `on_signalement_created` (dans `calcul_score.sql`)
- Crédite automatiquement `points_signalement` sur le profil de `user_id` et enregistre le statut initial dans `statuts_historique`.

### 2. Trigger `on_signalement_statut_change` (dans `historiser_statut.sql`)
- Historise **tout** changement effectif de `statut`, dans un seul sens.
- Ce trigger est la source de vérité de la timeline. Le RPC
  `soumettre_preuve_nettoyage()` ne journalise plus lui-même, pour éviter un
  doublon.

### 3. Fonction RPC `soumettre_preuve_nettoyage` (dans `verifier_nettoyage_geoloc.sql`)
- Calcule avec PostGIS la distance entre le signalement initial et la géolocalisation de la photo après. Si distance <= 50 m, bascule le statut à `nettoye`, historise l'événement et crédite `points_nettoyage` au compte de `nettoye_par_user_id`. Rejette l'opération si > 50 m.

### 4. Fonction RPC `mettre_a_jour_statut` (dans `mettre_a_jour_statut.sql`)
- Fait avancer le cycle `en_attente → vu → traite`.
- Seuls le **déclarant** et ces transitions-là sont autorisés. `nettoye` est
  refusé ici : il est réservé à `soumettre_preuve_nettoyage`, qui contrôle la
  preuve et la distance.

### 5. Fonction RPC `obtenir_classement` (dans `classement.sql`)
- Calcule le rang et le score total (`score_signalement + score_nettoyage`) avec filtrage par ville optionnel.

### 6. Trigger `on_auth_user_created` (dans `001_create_profiles.sql`)
- Crée automatiquement une ligne `profiles` lors de la création d'un utilisateur Supabase Auth.
- Version définitive dans `005_add_auth_fields.sql` (elle ajoute `username`,
  `phone`, `email` et `email_verified`).

### 7. Trigger `on_auth_user_updated` (dans `005_add_auth_fields.sql`)
- Synchronise `profiles.email` et `profiles.email_verified` quand
  `auth.users.email_confirmed_at` ou `auth.users.email` changent.
- Sans la synchronisation de l'email, un changement d'adresse côté Auth
  rendrait la connexion par username impossible.

### 8. Fonction `generate_username` (dans `005_add_auth_fields.sql`)
- Génère un username unique : premier mot du prénom → accents retirés
  (`unaccent`) → minuscules → suppression des caractères non alphanumériques →
  suffixe de 4 chiffres aléatoires.
- Exemples : « Aline Nzigire » → `aline_4829`, « Élodie Kabange » → `elodie_7293`,
  prénom vide ou exotique → `citoyen_1234`.

---

## Sécurité — Qui peut écrire quoi

| Opération | Autorisé | Mécanisme |
|---|---|---|
| Lire profil public (nom, ville, username, scores) | Tous, y compris anonymes | `GRANT SELECT` colonne par colonne |
| Lire email / téléphone d'un profil | **Personne** directement | colonnes non accordées ; passer par `obtenir_mon_profil()` (sa propre ligne) |
| Modifier `nom`, `ville`, `phone`, `username` | Le propriétaire | `GRANT UPDATE` limité à ces colonnes + RLS `auth.uid() = id` |
| Modifier `score_signalement` / `score_nettoyage` | **Aucun client** | colonnes non accordées ; seuls les triggers `SECURITY DEFINER` les écrivent |
| Créer un signalement | Authentifié, email vérifié, pour soi | RLS `INSERT` + colonne `ville` incluse |
| Modifier la `description` d'un signalement | Son déclarant | `GRANT UPDATE (description)` + RLS |
| Modifier latitude / longitude / photos / statut | **Aucun client** | hors `GRANT` ; passer par une RPC |
| Passer un signalement à `nettoye` | Tout authentifié, si la preuve GPS est valide | `soumettre_preuve_nettoyage()` |
| Faire avancer `en_attente → vu → traite` | Son déclarant | `mettre_a_jour_statut()` |
| Insérer une ligne d'historique | **Aucun client** | politique `INSERT` supprimée ; triggers uniquement |
| Supprimer une donnée | **Personne** | aucun `GRANT DELETE` |
| Résoudre un username en email | Anonyme | `obtenir_email_par_username()` |

**Note sur les fonctions `SECURITY DEFINER`** : elles portent toutes
`SET search_path = public, pg_temp` et leur `EXECUTE` est révoqué sur `PUBLIC`.
Postabase accorde par défaut `EXECUTE` à `PUBLIC` sur toute fonction créée — sans
ce `REVOKE`, un visiteur non connecté pourrait appeler les fonctions privilégiées
via `POST /rest/v1/rpc/<nom>`.
