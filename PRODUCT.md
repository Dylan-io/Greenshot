# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Utilisateurs primaires : citoyens burundais, en particulier les jeunes, qui vivent
leur quotidien au contact direct de déchets plastiques, de décharges sauvages et de
pollution. Ils signalent un problème environnemental depuis le terrain, avec un
téléphone Android d'entrée de gamme et une connexion mobile coûteuse (12–26 % de
pénétration internet, 60–70 % de pénétration mobile).

Ils sont sur le terrain, pas devant un bureau. L'action doit être courte, tenant en un
parcours de quelques minutes : photographier, confirmer la position, choisir une
catégorie, envoyer.

Audiences secondaires **conçues comme public de conviction, pas comme surface
d'interface** : bailleurs internationaux (PNUD, FEM/GEF), ONG environnementales,
institutions publiques. Ils ne
sont pas des utilisateurs de l'application. Ils sont un public de *conviction* : la page
d'accueil doit leur montrer dès le premier écran que la donnée produite est réelle,
géolocalisée et vérifiable avant/après. Décision utilisateur du 2026-09-30 : la surface
produit reste citoyenne, avec une porte d'entrée publique.

## Product Purpose

Greenshot rend possible une action civique environnementale vérifiable au Burundi : tout
citoyen authentifié peut signaler un problème (déchets plastiques, décharge sauvage,
pollution d'eau, déforestation, autre) par photo + géolocalisation, puis tout citoyen
authentifié peut prouver le nettoyage par une photo « après », prise à moins de 50 mètres
du signalement d'origine.

Les deux actions créditent des points (le nettoyage rapporte plus que le signalement) et
alimentent un classement public, global ou filtré par ville.

La finalité n'est pas l'engagement civique pour lui-même. C'est de **produire une donnée
environnementale fiable, géolocalisée et auditable**, capable de mobilisation de
financements auprès de bailleurs, d'ONG et des ministères. Le succès se mesure donc à
la fois sur le volume d'action citoyenne et sur l'exportabilité et l'auditabilité des
indicateurs (nombre de signalements, taux de résolution, répartition par commune et par
catégorie).

Greenshot n'est pas un produit payant pour les citoyens.

## Positioning

La différence tient à un mécanisme, pas à un discours : **la preuve photographique
géolocalisée aller-retour**, contrôlée côté base de données.

Une application voisine de signalement citoyen collecte des photos. Greenshot refuse qu'une
action de nettoyage puisse être revendiquée depuis n'importe où : la RPC
`soumettre_preuve_nettoyage()` recalcule la distance géodésique entre le signalement
d'origine et la position de la preuve, refuse la preuve au-delà de 50 m en renvoyant à
l'utilisateur la distance mesurée, et ne crédite les points qu'après ce contrôle. Le
statut ne change jamais par un `UPDATE` direct : toute transition passe par une RPC
vérifiée et est journalisée dans `statuts_historique`.

Résultat : un jeu de données qui contient, pour chaque site, une preuve datée et
localisée de l'état dégradé **et** de l'état restauré. C'est précisément ce qu'un
bailleur doit pouvoir auditer, et ce qu'un simple formulaire ne peut pas produire.

## Operating Context

- **Terrain, souvent en mobilité.** Le parcours de signalement se fait debout, dehors :
  on repère, on photographie, on envoie. La géolocalisation est capturée automatiquement
  à l'ouverture du formulaire, mais reste corrigeable à la main.
- **Échec GPS fréquent sur le terrain.** En cas d'échec, l'application ne substitue
  aucune position par défaut : la saisie manuelle est exigée. Une position fausse par
  défaut placerait le signalement au centre-ville de Bujumbura et fausserait à la fois
  la carte et les statistiques communiquées aux bailleurs.
- **Nettoyage réel et dangereux.** Le nettoyage est une activité physique réelle, avec
  un avertissement de sécurité préalable obligatoire (verre brisé, déchets médicaux et
  seringues, produits chimiques toxiques).
- **Nettoyage ouvert à tous.** Le nettoyage est accessible à tout citoyen authentifié avec
  email vérifié, pas réservé au déclarant : quelqu'un d'autre peut arriver sur place et
  prouver l'action.
- **Consultation.** La carte affiche les signalements par ville et par couleur de statut,
  avec filtres catégorie / statut / ville et légende visible. Le détail d'un signalement
  affiche la timeline d'historique des statuts.
- **Vérification d'email comme étape de rituel.** Non bloquante à l'inscription,
  obligatoire pour signaler ou nettoyer. Un bandeau d'avertissement accompagne la
  navigation dans l'intervalle.
- **Stack de déploiement évaluée par des tiers techniques.** Migrations, fonctions,
  politiques RLS, bucket Storage : le backend est intégralement du SQL Supabase.

## Capabilities and Constraints

**Périmètre V1.0 confirmé :** signalement rapide (photo, GPS, catégorie, description
optionnelle), preuve de nettoyage ouverte à tout citoyen avec contrôle GPS, carte des
signalements avec filtres et épingles par statut, cycle de statut
`en_attente → vu → nettoye → traite` avec timeline d'historique, classement global et
par ville distinguant points de signalement et points de nettoyage, profil utilisateur
avec score total, répartition des points et historique des actions.

**Exclu de V1.0 (confirmé) :** campagnes de reboisement, gestion d'organisations et de
volontaires, tableau de bord d'impact lourd, IA de classification d'images, détection
automatique de hotspots, génération automatique de rapports PDF, paiements et
intégration mobile money.

**Contraintes techniques fermes :**

- Le backend est du SQL Supabase (PostgreSQL + PostGIS + Auth + Storage + RLS). Il
  n'existe pas de serveur applicatif. Toute modification backend est une modification
  SQL : migration numérotée, puis fonctions, puis RLS, dans cet ordre.
- Les scores ne sont jamais modifiables par le client, ni par ajout de colonne ni par
  élargissement du `GRANT`. Ils sont écrits uniquement par les triggers. Rouvrir ce
  point de modification ruine la valeur de l'application.
- Les colonnes PII (`email`, `phone`) ne sont pas accordées au rôle `anon`. L'accès passe
  par `obtenir_mon_profil()`.
- Toute fonction `SECURITY DEFINER` porte `SET search_path = public, pg_temp`, et son
  `EXECUTE` est révoqué sur `PUBLIC` puis accordé nominativement.
- Supabase accorde `EXECUTE` à `anon` et `authenticated` ensemble : un `GRANT ... TO
  authenticated` laisse aussi passer `anon`.
- Le statut ne se modifie que par RPC.
- `signalements.ville` (lieu du problème) et `profiles.ville` (lieu d'habitation) sont
  deux colonnes distinctes et non redondantes. Ne pas supprimer `signalements.ville`
  sans revoir la carte, les épingles et le filtre ville ensemble.
- Les quatre alertes Advisors restantes sur les RPC légitimes sont intentionnelles.
  Ne pas y remédier machinalement.
- La clé `service_role` ne doit jamais apparaître dans le frontend ni dans Git. La clé
  `anon` est publique par nature et vit dans `.env` (gitignoré), seule `.env.example`
  est versionné.
- Compression obligatoire côté client avant upload (`browser-image-compression`,
  0.35 Mo max, 1280 px max) ; bucket `signalements-photos`, 1 Mo max,
  `image/jpeg|png|webp` uniquement, upload réservé aux authentifiés.
- Connectivité : 12–26 % de pénétration internet, data mobile coûteuse. Le client doit
  rester léger. Une logique offline-first est un contexte de conception, pas une
  fonctionnalité livrée.
- Authentification : email + mot de passe uniquement. Pas d'auth anonyme.
- Login par username résolu via `obtenir_email_par_username()`.
- Modification de profil limitée à `nom`, `ville`, `phone`, `username`.

**Langue.** L'interface est et reste en français (UI, documentation et noms de routes
métier en français). Décision utilisateur du 2026-09-30 : prévoir l'i18n pour plus tard,
sans créer de blocage structurel pour une future traduction. Aucune autre langue n'est
engagée à ce jour ; le kirundi n'est pas prévu.

**Faits produit laissés ouverts :** aucune cible de taille d'audience, de taux de
résolution ou de calendrier n'est documentée. Aucun tarif, ni licence, ni déploiement
n'est confirmé. Aucun tableau de bord d'impact, même léger, n'existe dans le périmètre
V1.0 et aucune surface bailleur n'est prévue.

## Brand Commitments

- **Nom :** Greenshot. Identité verbale discrète aujourd'hui (« Green**shot** », emoji
  🌍 🧹 👤 dans l'UI) — c'est l'état actuel du codebase, pas une direction confirmée.
- **Langue de marque :** français.
- **Aucun logo, favicon ni système d'assets de marque n'existe** dans le dépôt. Les seuls
  assets vectoriels sont les quatre épingles de carte par statut
  (`pin-en-attente.svg`, `pin-vu.svg`, `pin-nettoye.svg`, `pin-traite.svg`).
- **Couleurs de statut contraignantes** (documentées dans `docs/PROJET.md`, utilisées
  comme couleur d'épingle et comme signal d'état dans l'UI) : `en_attente` terre cuite
  `#B5502F`, `vu` ciel `#3E7CA6`, `nettoye` ambre `#E8A33D`, `traite` forêt `#1F4D3A`.
  Le statut est la notion centrale de l'application : sa lisibilité est un fait de
  marque, pas une préférence de design.
- **Aucune donnée de démonstration en production.** Les données de démo sont encadrées
  par `import.meta.env.DEV`. Un classement affichant un nom fictif sur une base vide, ou
  des signalements fictifs posés sur de vraies coordonnées de Bujumbura, ferait prendre
  du décor pour du terrain devant un bailleur. Toute donnée de démo ajoutée plus tard
  doit rester encadrée par `import.meta.env.DEV`, et `npm run build && npm run preview`
  doit afficher un état vide, jamais des noms fictifs.
- **Ne jamais inventer** : témoignages, clients, benchmarks, prix, licences, chiffres
  d'impact ni de surface de couverture. Le produit vend de la donnée fiable à des tiers
  financiers ; toute affirmation non prouvable détruit cette valeur.

## Evidence on Hand

- **Documentation produit réelle, en français :**
  - `README.md` — vision, structure du monorepo, démarrage.
  - `AGENT.md` — modèle de données, cycle de statut, matrice d'authentification,
    conventions de code et de commit, parcours utilisateur de référence, et surtout le
    journal des 9 failles corrigées et des 6 règles de sécurité « non optionnelles ».
    C'est la pièce la plus riche du dépôt.
  - `docs/PROJET.md` — vision V1.0, modèle économique et exigences d'indicateurs,
    contraintes Burundi, périmètre validé et périmètre exclu, couleurs de statut.
  - `docs/SCHEMA-DB.md` — tables, colonnes, types, relations.
  - `docs/CONVENTIONS.md` — standards Git, nommage, bonnes pratiques.
  - `backend/README.md` — procédure de création du projet Supabase et ordre de
    déploiement.
- **Code réel :** 5 composants Vue, 8 vues, 2 stores Pinia, 1 client Supabase,
  config Leaflet/CARTO, routeur. Migrations, fonctions SQL et politiques RLS sous
  `backend/`.
- **Absences à ne jamais combler par invention :** aucun témoignage, aucune étude de
  cas, aucune mention presse, aucun chiffre d'impact validé, aucun client nommé, aucun
  test utilisateur, aucune étude d'usage terrain, aucun contenu photographique réel de
  signalements, aucun logotype ni manuel de marque.
- **État visuel incumbent :** interface existante en CSS dans les composants (palette
  slate `#0f172a`/`#e2e8f0`, vert `#10b981`, fond `#f8fafc`, système `-apple-system` /
  `Segoe UI`), icônes emoji dans la navigation, mise en page à `max-width: 960px`.
  `ModalNettoyage.vue` existe mais n'est jamais monté ; `signalementStore.js` est un
  stub sans action. À traiter comme état actuel, non comme autorité.

## Product Principles

1. **La preuve vérifiable avant l'engagement.** Toute action doit laisser une trace
   géolocalisée, horodatée et non falsifiable côté base de données. La gamification
   récompense la preuve, pas la déclaration.
2. **La donnée est le produit.** Le vrai livrable est un jeu de données auditable par
   un bailleur. Chaque choix d'interface se juge à la lumière de la qualité de la
   donnée qu'il permet de produire, et à la lumière de ce qu'il lui coûte sur le réseau
   et sur la batterie.
3. **Aucune fabrication, jamais.** Ni donnée, ni nom, ni chiffre. Un état vide est
  plus loyal qu'un état rempli de décor. La fiabilité se démontre en ne mentant
   jamais, y compris quand la vérité est moins spectaculaire.
4. **Citoyen d'abord, bailleur convaincu.** L'interface est conçue pour quelqu'un qui
   agit sur le terrain, sur un téléphone économique, avec peu de data. La crédibilité
   institutionnelle se gagne par la transparence de cette sincérité, pas par un ton
   institutionnel.
5. **Le statut est le langage de l'application.** `en_attente`, `vu`, `nettoye`,
   `traite` est la seule narration qui traverse toutes les surfaces. Elle doit être
   lisible au premier coup d'œil, sur un écran petit, en plein jour.
6. **L'accès n'est pas l'exclusion.** Un compte à email non vérifié peut encore
   naviguer et comprendre. Le blocage agit sur l'action, jamais sur la compréhension de ce
   qui existe et de ce qui peut être fait ensuite.