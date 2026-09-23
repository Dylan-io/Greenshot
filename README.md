# CleanShoot 🌍🌱

CleanShoot est une application web citoyenne ClimateTech conçue pour le Burundi. Elle permet aux citoyens de signaler des problèmes environnementaux (déchets plastiques, décharges sauvages, pollution) via photo et géolocalisation, avec un système de score et de classement pour stimuler l'engagement civique.

L'objectif à terme est de produire des données environnementales fiables, géolocalisées et exploitables pour les ONG, les bailleurs de fonds (PNUD, GEF) et les institutions publiques.

---

## 📁 Structure du Monorepo

```
cleanshoot/
├── frontend/    # Application Web Vue 3 (Vite, Pinia, Leaflet, Supabase Client)
├── backend/     # Scripts Supabase (Migrations PostgreSQL/PostGIS, RLS, Fonctions SQL)
├── docs/        # Documentation de référence (Projet, Schéma DB, Conventions)
├── .gitignore
└── README.md
```

---

## 🚀 Démarrage Rapide

### 1. Backend (Supabase)
Consultez [backend/README.md](backend/README.md) pour :
1. Créer le projet Supabase.
2. Activer l'extension PostGIS.
3. Exécuter les scripts de migration dans l'ordre (`001_create_profiles.sql`, etc.).
4. Configurer le bucket Storage pour les photos et appliquer les règles RLS.

### 2. Frontend (Vue.js)
1. Rendez-vous dans le dossier `frontend` :
   ```bash
   cd frontend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Créez votre fichier d'environnement local :
   ```bash
   cp .env.example .env
   ```
4. Renseignez l'URL et la clé anonyme (anon key) Supabase dans le fichier `.env`.
5. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

---

## 📚 Documentation
- [Vision & Périmètre V1.0](docs/PROJET.md)
- [Schéma de la base de données](docs/SCHEMA-DB.md)
- [Conventions de code et de commit](docs/CONVENTIONS.md)
