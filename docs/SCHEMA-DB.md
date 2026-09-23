# Schéma de la Base de Données — Greenshot (Supabase / PostgreSQL)

Ce document décrit en clair les tables, colonnes, types de données et relations du modèle validé pour Greenshot V1.0.

---

## 1. Table `profiles`
Stocke les informations publiques des utilisateurs (liée au compte Supabase `auth.users`).

| Colonne | Type SQL | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE` | Identifiant unique de l'utilisateur |
| `nom` | `TEXT` | `NOT NULL` | Nom ou pseudonyme public |
| `ville` | `TEXT` | `DEFAULT 'Bujumbura'` | Ville ou commune de résidence au Burundi |
| `score_signalement` | `INTEGER` | `DEFAULT 0, CHECK (score_signalement >= 0)` | Points cumulés pour les signalements créés |
| `score_nettoyage` | `INTEGER` | `DEFAULT 0, CHECK (score_nettoyage >= 0)` | Points cumulés pour les nettoyages prouvés |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT now()` | Date d'inscription |

---

## 2. Table `categories`
Table de référence des catégories de problèmes environnementaux.

| Colonne | Type SQL | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identifiant unique de la catégorie |
| `nom` | `TEXT` | `NOT NULL, UNIQUE` | Libellé (ex: "Déchets plastiques", "Décharge sauvage", "Pollution eau", etc.) |
| `points_signalement` | `INTEGER` | `CHECK (points_signalement > 0)` | Points accordés au déclarant |
| `points_nettoyage` | `INTEGER` | `CHECK (points_nettoyage > points_signalement)` | Points accordés au nettoyeur (toujours supérieur) |

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
| `latitude` | `NUMERIC` | `NOT NULL` | Latitude GPS décimale |
| `longitude` | `NUMERIC` | `NOT NULL` | Longitude GPS décimale |
| `location` | `GEOGRAPHY(Point, 4326)` | `STORED` | Colonne spatiale PostGIS pour les calculs géodésiques |
| `description` | `TEXT` | `NULLABLE` | Description optionnelle |
| `statut` | `TEXT` | `DEFAULT 'en_attente', CHECK (statut IN ('en_attente', 'vu', 'nettoye', 'traite'))` | Cycle de vie du signalement |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT now()` | Date et heure du signalement |

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

---

## Fonctions et Triggers Métier
1. **Trigger `on_signalement_created` :**
   Crédite automatiquement `points_signalement` sur le profil de `user_id` et enregistre le statut initial dans `statuts_historique`.
2. **Fonction RPC `soumettre_preuve_nettoyage` :**
   Calcule avec PostGIS la distance entre le signalement initial et la géolocalisation de la photo après. Si distance <= 50 m, bascule le statut à `nettoye`, historise l'événement et crédite `points_nettoyage` au compte de `nettoye_par_user_id`. Rejette l'opération si > 50 m.
3. **Fonction RPC `obtenir_classement` :**
   Calcule le rang et le score total (`score_signalement + score_nettoyage`) avec filtrage par ville optionnel.
