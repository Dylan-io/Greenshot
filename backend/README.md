# Backend Supabase — Greenshot

Ce dossier contient l'ensemble des migrations PostgreSQL, fonctions PostGIS et règles RLS pour déployer le backend Greenshot sur Supabase.

---

## 📋 Procédure de déploiement (À réaliser par le développeur Backend)

### 1. Créer le projet Supabase
1. Rendez-vous sur le dashboard [Supabase](https://supabase.com).
2. Créez un projet nommé **Greenshot**.
3. Définissez un mot de passe sécurisé pour la base de données.

### 2. Récupérer les identifiants pour le Frontend
Dans **Project Settings > API** :
- Copier **Project URL** (`https://<project-ref>.supabase.co`)
- Copier **Anon public key**
Transmettez ces deux clés au développeur frontend pour son fichier `frontend/.env`.

### 3. Activer PostGIS
- **Automatique.** La migration `003` contient `CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions` et la migration `005` installe `unaccent` (utilisé par `generate_username`). Rien à faire à la main.
- Les fonctions PostGIS doivent être qualifiées `extensions.ST_Distance(...)` : le `search_path` des fonctions `SECURITY DEFINER` est verrouillé sur `public`.

### 4. Exécuter les migrations SQL dans l'ordre (SQL Editor)
Copier-coller et exécuter chaque fichier dans Supabase SQL Editor **dans l'ordre** :
1. `migrations/001_create_profiles.sql` — Tables `profiles` + trigger d'authentification
2. `migrations/002_create_categories.sql` — Table `categories` + données de référence
3. `migrations/003_create_signalements.sql` — Table `signalements` (PostGIS + colonne `ville`) + index
4. `migrations/004_create_statuts_historique.sql` — Table `statuts_historique` + index
5. `migrations/005_add_auth_fields.sql` — Colonnes `username`, `phone`, `email`, `email_verified` + fonction `generate_username()` + triggers `on_auth_user_created` / `on_auth_user_updated`

### 5. Installer les fonctions SQL et triggers
1. `functions/calcul_score.sql` (trigger d'attribution des points signalement et statut initial)
2. `functions/historiser_statut.sql` (trigger d'historisation de **tout** changement de statut)
3. `functions/verifier_nettoyage_geoloc.sql` (RPC anti-fraude GPS < 50 m et points nettoyage)
4. `functions/mettre_a_jour_statut.sql` (RPC de transition `en_attente → vu → traite`)
5. `functions/classement.sql` (RPC leaderboard global et par ville)
6. `functions/fonctions_acces_profil.sql` (RPC d'accès à la PII : profil, résolution username, vérification email)

### 6. Appliquer les politiques de sécurité (RLS)
1. `policies/rls_policies.sql`
   - ⚠️ **À appliquer après les fonctions** : ce fichier révoque les droits par
     défaut puis accorde l'EXECUTE sur les RPC. L'appliquer plus tôt laisserait
     les fonctions inaccessibles.
   - ⚠️ **Le bloc « permissions de colonnes » est critique.** C'est lui qui
     empêche un utilisateur de modifier ses propres scores et de lire l'email des
     autres. Le supprimer rouvre les deux failles principales du projet.
   - La politique d'insertion sur `signalements` exige `email_verified = true`
     (via la fonction `utilisateur_email_verifie()`).

### 7. Configurer le Storage (Bucket Photos)
- **Automatique** : `policies/storage_policies.sql` crée le bucket
  `signalements-photos` (public, 1 Mo max, `image/jpeg|png|webp`) et ses
  politiques d'accès. Plus besoin de le créer à la main dans l'interface.
- Le bucket est public car les photos "avant"/"après" doivent s'afficher sur la
  carte sans authentification. L'upload est réservé aux utilisateurs connectés.

### 8. Configurer l'authentification email
Dans **Authentication > Settings** :
1. S'assurer que le **provider Email** est activé.
2. Configurer le **site URL** pour que les emails de vérification fonctionnent.
3. Si vous voulez que les utilisateurs puissent naviguer sans vérifier leur email (inscription non obligatoire), **désactiver** "Confirm email" dans les paramètres.

### 9. Configurer l'envoi d'email
Dans **Authentication > Email** :
- Configurer le template d'email de vérification si nécessaire.
- Supabase envoie automatiquement les emails de confirmation.

---

## 📋 Procédure de déploiement — Nouveau

### Authentification des utilisateurs

Le système d'authentification repose sur **Supabase Auth** avec les fonctionnalités suivantes :

| Fonctionnalité | Description |
|---|---|
| **Inscription** | Email + Mot de passe + Téléphone + Nom |
| **Username auto-généré** | Premier mot du prénom, accents retirés, minuscules, + 4 chiffres aléatoires (ex: `aline_4829`) |
| **Connexion** | Par email ou par username |
| **Vérification email** | Non obligatoire à l'inscription, obligatoire pour signaler |
| **RLS sur signalements** | Seuls les utilisateurs ayant `email_verified = true` peuvent créer des signalements |

---

## 📊 Ordre d'exécution des migrations

```
001 → 002 → 003 → 004 → 005 → Functions → RLS → Storage
```

⚠️ **Attention** : La migration 005 remplace le trigger `handle_new_user` de la migration 001. Les deux migrations doivent être exécutées dans cet ordre pour que la nouvelle fonction soit correctement appliquée.

⚠️ **Attention** : `policies/rls_policies.sql` doit être appliqué **après** les fonctions SQL (il accorde l'EXECUTE sur les RPC), et `policies/storage_policies.sql` en dernier.
