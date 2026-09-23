# Backend Supabase — CleanShoot

Ce dossier contient l'ensemble des migrations PostgreSQL, fonctions PostGIS et règles RLS pour déployer le backend CleanShoot sur Supabase.

---

## 📋 Procédure de déploiement (À réaliser par le développeur Backend)

### 1. Créer le projet Supabase
1. Rendez-vous sur le dashboard [Supabase](https://supabase.com).
2. Créez un projet nommé **CleanShoot**.
3. Définissez un mot de passe sécurisé pour la base de données.

### 2. Récupérer les identifiants pour le Frontend
Dans **Project Settings > API** :
- Copier **Project URL** (`https://<project-ref>.supabase.co`)
- Copier **anon public key**
Transmettez ces deux clés au développeur frontend pour son fichier `frontend/.env`.

### 3. Activer PostGIS
Dans **Database > Extensions** :
- Rechercher `postgis` et l'activer (indispensable pour les types spatiaux et le calcul de distance à 50 m).

### 4. Exécuter les migrations SQL dans l'ordre (SQL Editor)
Copier-coller et exécuter chaque fichier dans Supabase SQL Editor :
1. `migrations/001_create_profiles.sql`
2. `migrations/002_create_categories.sql`
3. `migrations/003_create_signalements.sql`
4. `migrations/004_create_statuts_historique.sql`

### 5. Installer les fonctions SQL et triggers
1. `functions/calcul_score.sql` (trigger d'attribution des points signalement et statut initial)
2. `functions/verifier_nettoyage_geoloc.sql` (RPC anti-fraude GPS < 50m et points nettoyage)
3. `functions/classement.sql` (RPC leaderboard global et par ville)

### 6. Appliquer les politiques de sécurité (RLS)
1. `policies/rls_policies.sql`

### 7. Configurer le Storage (Bucket Photos)
Dans **Storage** :
1. Créer un bucket nommé `signalements-photos`.
2. Cocher **Public bucket** pour permettre l'affichage direct des photos avant et après sur la carte et le fil.
3. Ajouter une politique de storage : autoriser les uploads pour les utilisateurs authentifiés (`authenticated`).
