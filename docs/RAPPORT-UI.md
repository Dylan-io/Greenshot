# 🔍 Rapport de conformité UI — Captures vs application réelle

> **Date** : 2 octobre 2026
> **Méthode** : navigation réelle sur `http://localhost:5173` (serveur Vite en cours), lecture du DOM et captures d'écran pour chaque route du router.
> **Pour** : l'agent qui travaille sur le frontend.

---

## 🎯 Conclusion en une ligne

**Les captures d'écran de `docs/UI-ECRANS.md` ne correspondent pas au front actuel sur 6 routes sur 8.** Les pages `Accueil` et `Carte` sont proches du design. Toutes les autres sont sur l'**ancienne version** de l'interface.

Le design des captures **n'a jamais été implémenté**, ou a été perdu lors d'un merge. Les screenshots servent de **spec de la cible à atteindre**, pas de l'état actuel.

---

## 📊 Tableau de synthèse

| Route | Capture de référence | État réel | Verdict |
|---|---|---|---|
| `/` | `page-accueil-haut.png` + 2 scrolls | Structure identique, **contenu différent** | 🟡 Partiel |
| `/carte` | `page-carte.png` + 3 vues mobiles | Structure identique, **filtres vides** | 🟡 Partiel |
| `/signaler` | `page-signaler-*.png` (7 captures) | **Design entièrement différent** | 🔴 Non conforme |
| `/nettoyage` | `page-nettoyage-*.png` (7 captures) | **Page non construite** | 🔴 Non conforme |
| `/classement` | `page-classement-*.png` (2 captures) | **Design entièrement différent** | 🔴 Non conforme |
| `/profil` | `page-profil-*.png` (3 captures) | **Partiellement différent** | 🟠 Partiel |
| `/connexion` | `page-connexion.png` | **Design entièrement différent** | 🔴 Non conforme |
| `/inscription` | `page-inscription-*.png` (2 captures) | **Design entièrement différent** | 🔴 Non conforme |
| `/signalement/:id` | *aucune capture* | Page existe, design inconnu | ⚪ Non documenté |
| **Onboarding** | 4 captures | **Aucune route** | 🔴 Absent |

---

## 🔴 Bloquants — à traiter en priorité

### 1. `/nettoyage` — le parcours de nettoyage n'existe pas

**Attendu** (7 captures `page-nettoyage-*.png`) : une page avec titre « Nettoyer un endroit », 13 zones listées, puis un parcours en 4 étapes (photo avant → ménage → photo après → analyse IA) avec comparaison avant/après et carte de succès à 93 % de confiance.

**Réel** : une page entitled **« 🧹 Preuve de Nettoyage »** avec le texte « Agissez concrètement pour votre quartier, prouvez votre action avec une photo et gagnez des points bonus ! », un bandeau d'avertissement sécurité citoyenne, et un sélecteur de signalement qui affiche « Chargement des zones à nettoyer... ».

**Manques** : les 4 étapes, la comparaison avant/après, l'analyse IA, la carte de succès. C'est **le cœur de la proposition de valeur** (le barème Cleansing > Reporting décrit dans `AGENT.md`) — la page est à construire entièrement.

### 2. Onboarding — aucune route

Les 4 captures `onboarding-*.png` (Signalez en trois gestes / Nettoyez et faites vérifier / Montez de niveau / Votre compte Greenshot) **n'ont pas de route dans le router**. Un utilisateur connecté arrive directement sur l'accueil ou le formulaire de signalement, sans jamais voir l'explication du produit.

**Attendu aussi** : les étapes 2 à 5 de l'inscription (`1/5` → `5/5`). L'app affiche un formulaire d'inscription unique et classique, pas un parcours en 5 étapes.

### 3. `/signaler` — refonte complète manquée

**Attendu** : 2 onglets (Signaler / Nettoyer), zone de dépôt de photo, grille de 6 catégories en icônes hexagone colorées, champ Emplacement (déroulant), champ Précision, CTA « Publier le signalement ».

**Réel** : un formulaire à 3 étapes numérotées (ÉTAPE 1 / ÉTAPE 2 / ÉTAPE 3) avec :
- Un champ `<input type="file">` natif au lieu de la zone de dépôt cliquable
- Un message d'erreur rouge déjà visible : « La photo du déchet est obligatoire »
- La catégorie est un `radiogroup` **vide** (les 6 options ne sont pas rendues — probablement un chargement Supabase qui échoue)
- Le champ Ville est un `<select>` (Bujumbura / Gitega / Ngozi) au lieu du dropdown « Marché du Centre (Rohero) »
- Pas d'onglet « Nettoyer »
- Le libellé est « Emplacement » avec sous-titre ville, pas de GPS affiché
- Message bloquant : « Connectez-vous pour déposer un signalement. »

**Point d'attention** : le `radiogroup` "Type de déchet" est rendu mais vide. C'est soit un bug de chargement, soit les catégories viennent de la table `categories` qui est vide en local. À vérifier avant tout travail de design.

### 4. `/connexion` — design entièrement différent

**Attendu** (`page-connexion.png`) : page sombre centrée étroite, titre display « Connexion », 2 champs avec labels en capitales, icône œil pour afficher le mot de passe, CTA « Se connecter » + lien « Retour », indicateur `1/5`.

**Réel** : titre **« 🌍 Connexion Greenshot »** (avec emoji), sous-titre « Bienvenue sur votre espace citoyen », **2 boutons de mode de connexion** (📧 Par email / 👤 Par username), 2 champs, CTA, lien « Créer un compte », lien « Retour à l'accueil », et un encart 💡 avec bouton « 📧 Renvoyer l'email de vérification ».

Les deux modes de connexion (email / username) sont une **fonctionnalité réelle** absente des captures. **Ne pas la supprimer** — les captures sont en retard sur le code sur ce point.

### 5. `/inscription` — design entièrement différent

**Attendu** : parcours 5 étapes, champs Nom / E-mail / Téléphone (+257) / Mot de passe, indicateur `1/5`.

**Réel** : titre **« 🌍 Inscription Greenshot »**, formulaire unique avec 5 champs : Nom prénom (**désactivé** `disabled`), Email, Mot de passe, Téléphone, Username (avec bouton 🔄 de régénération).

**Problème** : le champ **Nom prénom est `disabled`** sans raison apparente. Bug à corriger.

**Écart fonctionnel** : le screenshot montre `+257` en sélecteur d'indicatif séparé ; le code a un seul champ texte `+257 XXX XXX XXX`. Décision à prendre sur lequel garde.

---

## 🟠 Partiels — design correct, données incorrectes

### 6. `/profil` — mauvaise gestion de la session utilisateur

**Attendu** (`page-profil-*.png`) : avatar « Éclaireur », sous-titre « Éclaireur vert · Rohero, Bujumbura », 3 pills (Niveau / #10 du quartier / 0 badge), carte « Total cumulé », grille de 6 badges verrouillés, section Historique, section « Mon compte » (Bilan d'impact / Défis du jour / Réglages).

**Réel** :
- Le nom s'affiche **« Éclaireur »** mais la **sidebar affiche « Invité »** → les deux lisent des sources différentes
- Le sous-titre est **« · Bujumbura, Burundi »** — le **virgule initial est vide** (le prénom/nom du niveau manque), et la ville est `Bujumbura, Burundi` au lieu de `Rohero, Bujumbura`
- Pills : **« Niveau 1 »** et **« 3 badges »** — il manque le pill **« #10 du quartier »**, et « 3 badges » s'affiche alors que la capture de référence en montre 0
- La **section « Mon compte »** (Bilan d'impact, Défis du jour, Réglages) **est absente** → impossible d'accéder au bilan d'impact par l'UI
- « Mon historique » est un **encart bleu-gris** avec des onglets, pas la section prévue

**Le bug le plus grave** : la sidebar dit « Invité · 0 pts » pendant que le corps de la page dit « Éclaireur · 65 pts ». Ce sont deux sources de données incompatibles. C'est exactement le type d'incohérence qui trahit une démo devant un bailleur.

### 7. `/classement` — filtres et structure différents

**Attendu** (`page-classement-podium.png`) : sous-titre « Commune de Rohero · cette semaine », 3 pills de portée **Quartier / Global / Amis**, section Podium (3 cartes dont la 1ʳᵉ en or), carte « Vous », puis « Classement complet » sur 10.

**Réel** : sous-titre « Les citoyens les plus engagés », 3 onglets **Tout le Burundi / Bujumbura / Gitega**, puis « Chargement du classement… ».

**Écart** : les filtres **Global** et **Amis** des captures **n'existent pas** dans le code, et le code a **Gitega** que les captures n'ont pas. La notion d'« Amis » et de « cette semaine » n'est implémentée nulle part.

### 8. `/` accueil — structure conforme, données non alignées

La structure de la page correspond (carte de niveau, 3 statistiques, « À nettoyer près de vous », « Votre activité », « Mes défis du jour »), mais :
- Le nom est **« Invité »** dans la sidebar au lieu de « Éclaireur »
- L'état vide « Aucun déchet signalé autour de vous » remplace la liste de 4 déchets des captures — **c'est le comportement correct** (les données de démo sont désactivées en prod), pas un bug
- Le graphe d'activité affiche 7 jours sans les 4 réanimations des captures

**Verdict** : conforme au comportement attendu, les captures montrent un état de démo.

### 9. `/carte` — structure conforme, filtres non remplis

La page correspond globalement (titre, puce de localisation, bouton 3D, contrôles +/−/couches/recentrer, « Signaler ici », bandeau « 0 SIGNALEMENTS À TRAITER », bouton Partager).

**Problème** : la **colonne de filtres de catégories est vide** — 5 boutons sans icône, sans pastille de compteur, alors que les captures en montrent 7 avec compteurs (12, 3, 2, 2, 2, 1, 2).

**Le bouton « Légende » est cassé** : son libellé est coupé verticalement sur 3 lignes au lieu d'être horizontal à côté de l'icône `≡`. Défaut CSS de largeur.

Le fond de carte s'affiche en contour lime sur fond noir — les tuiles de la carte **ne se chargent pas** (pas de voirie, pas de noms de rues). L'absence de bandeau d'avertissement « Tuiles injoignables » que montraient les captures est donc une divergence à traiter.

---

## 🔎 Anomalies de design signalées dans le document, non corrigées

Ces points que j'avais relevés en décrivant les écrans **ne sont pas corrigés** — ils sont seulement documentés :

| # | Anomalie | Fichier concerné |
|---|---|---|
| 1 | Badge de statut **« À nettoyer »** affiché alors que le titre dit « Nettoyage validé » | `page-nettoyage-succes-valide.png` |
| 2 | Barre de progression en **4 segments** alors que le parcours est nommé en **3 étapes** | `page-nettoyage-etape-1-photo-avant.png` |
| 3 | Barème de points **dupliqué** : révélé à `/signaler` (+20) et dans la liste `/nettoyage` (+65) — risque de divergence | `page-signaler-categorie-choisie.png` |
| 4 | Écart de points du classement **toujours en vert**, même négatif (`−290 pts`) | `page-classement-liste-bas.png` |
| 5 | Cibles d'icônes **non homogènes** : hexagones sur `/signaler`, carrés sur l'accueil | `page-signaler-type-et-emplacement-large.png` |
| 6 | Modale de choix d'avatar **centrée** vs compositeur en **bottom sheet** — deux composants pour la même feature | `modale-avatar-choix-source.png` / `modale-avatar-compositeur-haut.png` |
| 7 | Photo « après » de la validation = **mockup d'iPhone** avec « Welcome, Alex » → asset temporaire à remplacer | `page-nettoyage-succes-valide.png` |
| 8 | Grille des 6 catégories **coupée à droite** sur la vue resserrée | `page-signaler-type-et-emplacement.png` |
| 9 | Label « TÉLÉPHONE » **coupé par le CTA** en position absolue | `page-inscription-etape-1-identite-haut.png` |
| 10 | Sidebar `/nettoyage` : score **120 pts** pendant l'analyse, puis **65 pts** après validation → incohérent | `page-nettoyage-analyse-ia-en-cours.png` |
| 11 | Les **filtres Amis / cette semaine** du classement des captures **n'existent pas** dans le code | `page-classement-podium.png` |

---

## ✅ Ce qui est conforme

- Le **thème visuel** est bien celui des captures : vert quasi noir, vert primaire `#5CE04A`, cartes très arrondies, typo display serrée. L'agent a bien posé les fondations.
- La **sidebar** (logo Green+shot, 5 entrées, bloc profil, bouton Signaler) correspond.
- Le **chrome de la carte** (contrôles, bouton 3D, bandeau bas) correspond.
- La **structure de l'accueil** correspond.
- **Aucune erreur console** sur les 8 routes testées.
- Le behavior « pas de données de démo hors DEV » est respecté (états vides affichés), ce qui est la règle d'`AGENT.md`.

---

## 🎯 Ordre de traitement suggéré

1. **`/nettoyage`** — construire le parcours 4 étapes (c'est le manque le plus lourd)
2. **Onboarding** — créer les 4 écrans + les routes
3. **`/profil`** — unifier la source de la sidebar et du corps de page, restaurer la section « Mon compte »
4. **`/signaler`** — grille de catégories, zone de dépôt, onglet « Nettoyer »
5. **`/connexion` / `/inscription`** — aligner sur les captures **sans casser** les modes email/username et la régénération d'username
6. **`/classement`** — décider si on implémente Amis/Global ou si on met les captures à jour
7. **Carte** — remplir les filtres de catégories, corriger le bouton Légende
8. **`/signalement/:id`** — documenter quand une capture existera

---

## 💡 Une question à trancher avant de commencer

Les captures et le code divergent sur **deux points fonctionnels**, pas seulement sur le style :

1. **Connexion par username** — dans le code, pas dans les captures
2. **Filtres Quartier / Global / Amis + « cette semaine »** — dans les captures, pas dans le code

Faut-il faire évoluer le code vers les captures, ou les captures vers le code ? La réponse détermine si le travail est une refonte ou une mise à jour de doc. **À valider avec l'équipe avant que l'agent commence.**

---

*Rapport généré par inspection du DOM et captures d'écran. Aucune modification n'a été apportée au code.*