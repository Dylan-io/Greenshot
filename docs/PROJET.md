# CleanShoot — Vision, Modèle & Spécifications V1.0

## 1. Vision du Projet
CleanShoot est une web application ClimateTech burundaise qui permet aux citoyens, en particulier les jeunes, de :
* Signaler des problèmes environnementaux (déchets plastiques, décharges sauvages, pollution d'eau, déforestation, etc.) via photo et géolocalisation.
* Nettoyer eux-mêmes ces zones et en apporter la preuve par une photo "après".
* Gagner des points pour ces deux types d'actions (avec un barème supérieur pour le nettoyage), et consulter un classement public.

**Objectif final :** Produire des données environnementales fiables, géolocalisées et vérifiables (avant/après) pour mobiliser des financements auprès de bailleurs environnementaux (ONG, PNUD, FEM/GEF, ministères).

---

## 2. Modèle Économique & Données d'Impact
CleanShoot n'est **pas** un produit B2C payant pour les citoyens.
* **Cibles :** Bailleurs internationaux, ONG environnementales, agences de développement.
* **Exigence technique :** L'application doit produire des indicateurs exportables et auditables (nombre de signalements, taux de résolution/nettoyage, répartition géographique par commune/quartier, répartition par catégorie de déchets).

---

## 3. Contraintes Spécifiques au Burundi
* **Connectivité Data :** Pénétration internet estimée entre 12 et 26 %, coût élevé de la data mobile.
* **Pénétration Mobile :** Supérieure à 60-70 %.
* **Exigences techniques :**
  * Compression systématique des photos côté client (`browser-image-compression`) avant tout envoi vers Supabase Storage.
  * Interface légère et sobre en bande passante.
  * Conception compatible avec une future logique offline-first.

---

## 4. Stack Technique
* **Frontend :** Vue.js 3 (Vite), Pinia, Vue Router, Leaflet + tuiles CARTO gratuites (Voyager ou Dark Matter, aucun recours à Google Maps), `browser-image-compression`.
* **Backend :** Supabase (PostgreSQL + PostGIS, Authentification, Storage, Row Level Security, fonctions SQL/triggers).
* **Hébergement Frontend :** Vercel ou Netlify.

---

## 5. Fonctionnalités de la Version 1.0 (Périmètre Validé)
1. **Signalement rapide :**
   * Photo + géolocalisation automatique + sélection de catégorie + description optionnelle.
   * Rapporte des `points_signalement`.
2. **Preuve de nettoyage (ouvert à tout citoyen) :**
   * Soumission d'une photo "après" depuis un signalement existant.
   * Avertissement de sécurité préalable (interdiction de manipuler verre brisé, déchets médicaux/seringues, produits chimiques toxiques).
   * Contrôle anti-fraude géodésique : distance < 50 mètres requise entre le signalement initial et la position lors du nettoyage.
   * Rapporte des `points_nettoyage` bonifiés.
3. **Carte des signalements :**
   * Fond de tuiles CARTO sombre ou clair personnalisé.
   * Épingles personnalisées par statut :
     * `en_attente` : Terre cuite (`#B5502F`)
     * `vu` : Ciel (`#3E7CA6`)
     * `nettoye` : Ambre (`#E8A33D`)
     * `traite` : Forêt (`#1F4D3A`)
   * Filtres par catégorie et par zone, légende visible.
4. **Statut étendu du signalement :**
   * Cycle : `en_attente` ➔ `vu` ➔ `nettoye` ➔ `traite`.
   * Timeline d'historique complète visible dans le détail du signalement.
5. **Classement (Leaderboard) :**
   * Classement global et filtrable par ville/quartier.
   * Distinction visible entre points de signalement et points de nettoyage.
6. **Profil utilisateur :**
   * Nom, score total, répartition des points et historique des actions (signalés / nettoyés).

---

## 6. Fonctionnalités Exclues de la V1.0
* Campagnes de reboisement / plantation d'arbres.
* Gestion des organisations et volontaires.
* Tableau de bord d'impact lourd.
* IA de classification d'images.
* Détection automatique de hotspots.
* Génération automatique de rapports PDF.
* Paiements et intégration mobile money.
