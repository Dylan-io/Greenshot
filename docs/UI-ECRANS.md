# 📸 Référence des écrans — Greenshot

> Ce document est le **catalogue de référence visuelle** du projet. Il associe chaque
> capture d'écran à un nom de fichier stable, à une route et à une description
> détaillée. Un agent qui doit « voir la page de connexion » n'a plus à fouiller
> dans un dossier : il ouvre ce fichier, trouve le nom, lit l'image.

**Emplacement des images :** `frontend/src/assets/images/`

**⚠️ Lisez d'abord la section [« Comment coder un écran »](#-comment-coder-un-écran)
plus bas** : elle contient les règles, le vocabulaire visuel et la checklist de
travail. Le reste du document est la description écran par écran.

---

# 🧭 Comment coder un écran

Cette section est le mode d'emploi. Elle existe parce que les sections suivantes
décrivent **ce qu'on voit**, mais pas **comment le construire**. Ne commencez pas à
coder avant de l'avoir lue.

## 1. La règle d'or : quelle version est la cible ?

Il existe deux versions de l'interface Greenshot dans ce dépôt :

| | Description | Où |
|---|---|---|
| **Design cible** | L'interface décrite dans ce document, illustrée par les 39 captures | Ce fichier |
| **Code actuel** | Ce qui est implémenté dans `frontend/src` | L'application |

**Le code actuel n'est PAS à recopier.** C'est une version antérieure du design.
Votre travail consiste à **faire évoluer le code vers ce document**, pas l'inverse.

Le rapport de l'écart entre les deux est dans **[RAPPORT-UI.md](RAPPORT-UI.md)**.
Lisez-le avant de commencer : il dit, route par route, ce qui existe déjà.

## 2. Cinq règles non négociables

### Règle 1 — Ne supprimez aucune fonctionnalité existante

Il y a des fonctionnalités dans le code actuel qui **n'apparaissent pas** sur les
captures. Elles sont réelles et ont été construites délibérément :

- **`/connexion` : connexion par username** (bouton 👤 « Par username »)
- **`/connexion` : renvoi de l'email de vérification**
- **`/inscription` : génération et régénération du username** (bouton 🔄)
- **`/nettoyage` : avertissement de sécurité citoyenne** (déchets dangereux)

Quand vous alignez une page sur son capture, vous **redessinez** ces éléments, vous
ne les effacez pas. Si un élément de code n'a pas de place dans la capture,
demandez plutôt que de le supprimer.

### Règle 2 — Le thème existe déjà, ne le recréez pas

`frontend/src/assets/styles/tokens.css` (17 Ko) contient déjà **32 variables CSS**
définies. Utilisez-les. **N'écrivez pas de couleur en dur** (`#5CE04A`, `white`,
`rgb(...)`) dans un composant.

Le vocabulaire réel du projet (ces noms, pas ceux de ce document) :

| Rôle | Variable | Remarque |
|---|---|---|
| Fond le plus profond | `--onyx` | fond application |
| Fonds de panneau | `--panel`, `--panel-2` | cartes, sidebar |
| Fond profond textured | `--forest`, `--forest-2`, `--forest-3` | dégradés, textures |
| Vert primaire (CTA) | `--sprout`, `--sprout-2` | boutons actifs |
| Vert moyen | `--verdant` | accents, icônes |
| Vert pâle | `--lichen`, `--fern` | dégradés d'avatar, fonds de tuiles |
| Fond clair (rare) | `--wash`, `--bone` | cartes crème (succès, niveau) |
| Texte principal | `--white` | |
| Ambre / or | `--amber` | **podium du classement uniquement** |
| Rouge / danger | `--danger` | refus de nettoyage |
| Bordures | `--line`, `--line-2` | |
| Rayons | `--r-xs`, `--r-sm`, `--r-card`, `--r-pill` | |
| Typo | `--font-display`, `--font-ui` | |
| Espacement | `--gap`, `--gutter` | |
| Durées / courbes | `--dur-1..3`, `--ease-in`, `--ease-out` | |

> **À noter** : ce document parle parfois de « vert primaire », « vert lime »,
> « fond crème ». Ce sont des descriptions, pas des noms de variables. Traduisez-les
> vers le tableau ci-dessus.

### Règle 3 — Le `--amber` est réservé au podium

Le vert est la couleur de la marque. L'ambre n'apparaît que pour le **1ᵉʳ du
classement**. Ne l'introduisez nulle part ailleurs : c'est le seul moyen de faire
comprendre à l'utilisateur qu'il est premier.

### Règle 4 — Un seul élément primaire vert par écran

Si vous ajoutez un second bouton plein vert sur une page, c'est une erreur de
lecture. Les autres actions sont soit des boutons sombres (carte crème, texte
blanc), soit des liens.

### Règle 5 — Aucune donnée fictive hors `import.meta.env.DEV`

Les captures montrent des noms (« Léa M. », « Tom V. »), des scores (2140) et des
lieux (« Avenue de la Révolution »). **Ce sont des données de démonstration de la
maquette, pas du contenu à reproduire.**

La règle est écrite dans `AGENT.md` : Greenshot vend de la donnée fiable à des
bailleurs. Un classement affichant « Jean-Claude — 300 pts » sur une base vide
ferait prendre du décor pour du terrain.

```vue
<!-- Acceptable : visible en local, absent du build de production -->
<script setup>
const zones = ref([])
if (import.meta.env.DEV) {
  zones.value = [{ nom: 'Avenue de la Révolution', points: 65 }]  // démo
}
</script>
```

Test de non-régression : `npm run build && npm run preview` doit montrer des
états **vides**, jamais des noms fictifs.

Les captures servent à comprendre la **mise en page**, pas à être recopiées
pixel par pixel sur le contenu.

## 3. Vocabulaire visuel (à employer tel quel)

| Terme | Description | Exemple |
|---|---|---|
| **Carte display** | titre en très gras, tracking serré, 1-2 lignes max | « Signalez en trois gestes » |
| **Carte crème** | fond `--wash`, contenu sombre, réservée à 2 usages : la tuile de niveau sur l'accueil et la carte de succès du nettoyage | |
| **Carte verte** | fond `--panel`, bordure `--line` subtile | toutes les autres cartes |
| **Onglet segmenté** | 2 grandes zones côte à côte, l'active en vert plein | Signaler / Nettoyer |
| **Pill** | petite capsule arrondie (`--r-pill`) | points, niveau, statut |
| **Pastille de compteur** | petit cercle en coin d'une tuile, chiffre blanc | (12) sur un filtre de carte |
| **Pill de points** | capsule verte à bordure, `+65 pts` | liste « À nettoyer » |
| **Empty state** | rond sombre + icône + titre + phrase d'invitation | « Historique vide » |
| **Section titrée** | titre à gauche, filet horizontal qui va à droite | « À nettoyer près de vous ───── » |
| **État verrouillé** | tout le texte en gris, icône grise | badges non obtenus |
| **Bordure pointillée** | rectangle en pointillés, signale « vide, à remplir » | zone de photo, colonne « APRÈS » |

## 4. Structure de page type

Presque toutes les pages suivent le même squelette. Reprenez-le :

```
┌──────────┬────────────────────────────────────────┐
│          │  ScreenBar (titre + sous-titre)         │
│  AppNav  ├────────────────────────────────────────┤
│  (fixe,  │                                        │
│  sombre) │  contenu, largeur max ~1100px          │
│          │  gap entre sections = --gap            │
│          │                                        │
│  [profil]│                                        │
│  [Signaler]                                     │
└──────────┴────────────────────────────────────────┘
```

- **`AppNav.vue`** : la sidebar. Logo, 5 entrées, carte profil, bouton vert.
- **`ScreenBar.vue`** : bandeau de titre. C'est un composant de 0,4 Ko qui prend
  `title` et `subtitle`. Utilisez-le sur toute nouvelle page, ne recréez pas un
  `<h1>` à la main.
- **`BottomNav.vue`** : navigation basse, pour le mobile. Il fait 0,2 Ko — c'est
  probablement un stub à remplir.

## 5. Comment traiter une page — méthode en 6 étapes

Pour chaque page à construire :

1. **Lire la capture** avec l'outil de lecture d'image. Plusieurs captures = une
   page scrollée, lisez-les dans l'ordre.
2. **Lire la section** correspondante de ce document (plus bas). Elle décrit la
   structure champ par champ.
3. **Inventorier l'existant** : ouvrir la vue et le composant associé dans
   `frontend/src`, noter ce qui est réutilisable (AppNav, ScreenBar, LevelCard,
   StatStrip, ReportList, ActivityChart, EmptyState, BadgeStatut sont déjà faits).
4. **Lister les états** : vide, chargement, rempli, erreur. Chaque section a un
   état vide dans les captures — ne les oubliez pas.
5. **Coder** en utilisant `tokens.css`, sans couleur en dur.
6. **Vérifier** avec la checklist ci-dessous.

## 6. Checklist de livraison

Pour chaque page terminée :

- [ ] Aucune couleur en dur, uniquement les variables de `tokens.css`
- [ ] Un seul bouton primaire vert sur l'écran
- [ ] Tous les états gérés : vide, chargement, rempli, erreur
- [ ] Les libellés correspondent **mot pour mot** aux captures (y compris les
      accents, les apostrophes `«  »`, les points de suspension)
- [ ] Les données fictives sont sous `import.meta.env.DEV`
- [ ] Les fonctionnalités existantes de la page ont été **conservées** (règle 1)
- [ ] Aucun emoji dans l'interface — les captures n'en contiennent pas. Si vous en
      trouvez dans le code actuel (`🌍`, `🧹`, `💡`, `🔄`, `📧`, `👤`), retirez-les
      au passage, l'apparence des captures est sans emoji
- [ ] `npm run build` passe sans erreur
- [ ] Le titre de l'onglet et le `<h1>` sont corrects
- [ ] Les images de la section de ce document sont toujours dans
      `frontend/src/assets/images/` et n'ont pas été renommées

## 7. Ordre de travail recommandé

| # | Page | Pourquoi dans cet ordre |
|---|---|---|
| 1 | `/` Accueil | Le point d'entrée. Structure déjà proche. |
| 2 | `/carte` | Le cœur du produit. Filtres à remplir. |
| 3 | `/profil` | Dépend de l'accueil pour les compteurs. |
| 4 | `/signaler` | Dépend des catégories et de la carte. |
| 5 | `/nettoyage` | Le parcours le plus long (7 états). **Le plus coûteux.** |
| 6 | `/classement` | Dépend du profil (points, niveau). |
| 7 | `/connexion` + `/inscription` | Dépendent du modèle de compte. |
| 8 | `/onboarding` | Se fait en dernier : c'est du storytelling, pas une fonctionnalité. |

Traitez `/nettoyage` **en dernier malgré son importance** : c'est la page qui
prend le plus de temps, et elle dépend de la carte et du profil pour être
cohérente.

## 8. Ce qui n'est pas dans ce document

N'inventez pas. Si un écran n'est pas listé, dites-le et demandez une capture.

Manquant : étapes 2 à 5 de l'inscription, page `/signalement/:id` (détail d'un
signalement), états avec données réelles (les captures sont toutes vides ou en
démo), l'état « nettoyage refusé » pour distance GPS > 50 m, les écrans d'erreur
réseau.

**Assets manquants** : les 50 pièces d'avatar du compositeur
(`av-full-*`, `av-pixie-*`, `av-turban-*`…) sont dans
`Design-opendesign-Greenshot/assets/avatars/parts/` et **ne sont pas** dans
`frontend/public/avatars/`, qui ne contient que les 10 avatars entiers. Si vous
construisez le compositeur d'avatar, vous devez d'abord copier ces pièces.

---

## 📑 Index rapide

## 📑 Index rapide

| # | Nom de fichier | Écran | Route |
|---|---|---|---|
| 1 | `onboarding-1-signalez-en-trois-gestes.png` | Onboarding — étape 1/3 | *(onboarding)* |
| 2 | `onboarding-2-nettoyez-et-faites-verifier.png` | Onboarding — étape 2/3 | *(onboarding)* |
| 3 | `onboarding-3-montez-de-niveau.png` | Onboarding — étape 3/3 | *(onboarding)* |
| 4 | `onboarding-4-choix-du-compte.png` | Choix : créer un compte / se connecter | `/inscription` |
| 5 | `page-connexion.png` | Connexion (e-mail + mot de passe) | `/connexion` |
| 6 | `page-selection-avatar.png` | Sélection d'avatar | `/inscription` |
| 7 | `page-accueil-haut.png` | Accueil — en-tête de tableau de bord | `/` |
| 8 | `page-accueil-milieu-liste-nettoyage.png` | Accueil — liste « À nettoyer près de vous » | `/` |
| 9 | `page-accueil-bas-activite-et-defis.png` | Accueil — activité 7 jours + défis | `/` |
| 10 | `page-carte.png` | Carte du Burundi — desktop | `/carte` |
| 11 | `page-carte-mobile-vue-ville.png` | Carte — vue ville (mobile) | `/carte` |
| 12 | `page-carte-mobile-vue-pays.png` | Carte — vue pays (mobile) | `/carte` |
| 13 | `page-carte-mobile-vue-3d.png` | Carte — vue 3D inclinée (mobile) | `/carte` |
| 14 | `page-inscription-etape-1-identite-haut.png` | Créer votre compte — champs 1-2 | `/inscription` |
| 15 | `page-inscription-etape-1-identite-bas.png` | Créer votre compte — champs 2-4 | `/inscription` |
| 16 | `page-signaler-un-dechet.png` | Signaler — zone de photo | `/signaler` |
| 17 | `page-signaler-type-et-emplacement.png` | Signaler — type de déchet + emplacement | `/signaler` |
| 18 | `page-signaler-type-et-emplacement-large.png` | Signaler — même section, format large | `/signaler` |
| 19 | `page-signaler-precision-et-publication.png` | Signaler — précision + CTA publier | `/signaler` |
| 20 | `page-classement-podium.png` | Classement — podium | `/classement` |
| 21 | `page-classement-liste-bas.png` | Classement — liste complète (bas) | `/classement` |
| 22 | `page-profil-haut.png` | Profil — identité + total cumulé | `/profil` |
| 23 | `page-profil-badges.png` | Profil — grille de badges | `/profil` |
| 24 | `page-profil-historique-et-mon-compte.png` | Profil — historique + menu compte | `/profil` |
| 25 | `page-bilan-dimpact-haut.png` | Bilan d'impact — carte de score | `/profil` → bilan |
| 26 | `page-bilan-dimpact-partage.png` | Bilan d'impact — partage + nettoyages | `/profil` → bilan |
| 27 | `modale-avatar-choix-source.png` | Modale — changer d'avatar ou photo | `/profil` |
| 28 | `modale-avatar-compositeur-haut.png` | Modale — coiffure + expression | `/profil` |
| 29 | `modale-avatar-compositeur-bas.png` | Modale — peau, cheveux, chemise | `/profil` |
| 30 | `page-nettoyage-liste-zones.png` | Nettoyer un endroit — liste des zones | `/nettoyage` |
| 31 | `page-nettoyage-etape-1-photo-avant.png` | Nettoyage — étape 1, photo avant | `/nettoyage` |
| 32 | `page-nettoyage-etape-1-photo-avant-prise.png` | Nettoyage — étape 1 validée | `/nettoyage` |
| 33 | `page-nettoyage-etape-2-menage.png` | Nettoyage — étape 2, ménage | `/nettoyage` |
| 34 | `page-nettoyage-etape-3-comparaison.png` | Nettoyage — étape 3, comparaison avant/après | `/nettoyage` |
| 35 | `page-nettoyage-analyse-ia-en-cours.png` | Nettoyage — analyse IA en cours | `/nettoyage` |
| 36 | `page-nettoyage-succes-valide.png` | Nettoyage — succès, nettoyage validé | `/nettoyage` |
| 37 | `page-signaler-photo-chargee.png` | Signaler — photo chargée, grille catégories | `/signaler` |
| 38 | `page-signaler-categorie-choisie.png` | Signaler — catégorie sélectionnée | `/signaler` |
| 39 | `page-signaler-formulaire-complet.png` | Signaler — formulaire prêt à publier | `/signaler` |

**Recherche rapide par mot-clé :**

| Je cherche… | Fichier |
|---|---|
| onboarding, présentation, 3 gestes | `onboarding-1-…` `onboarding-2-…` `onboarding-3-…` |
| login, se connecter, e-mail, mot de passe | `page-connexion.png` |
| inscription, créer un compte, nom, téléphone | `onboarding-4-choix-du-compte.png`, `page-inscription-etape-1-identite-haut.png`, `page-inscription-etape-1-identite-bas.png` |
| avatar, profil visuel | `page-selection-avatar.png` |
| dashboard, accueil, points, niveau, série | `page-accueil-haut.png` |
| à nettoyer, liste de déchets, +25 pts | `page-accueil-milieu-liste-nettoyage.png` |
| activité, calendrier 7 jours, challenges | `page-accueil-bas-activite-et-defis.png` |
| carte, map, Leaflet, Bujumbura, épingles | `page-carte.png` |
| carte mobile, zoom ville, zoom pays | `page-carte-mobile-vue-ville.png`, `page-carte-mobile-vue-pays.png` |
| carte 3D, relief, inclinaison, pitch | `page-carte-mobile-vue-3d.png` |
| signaler, photo, formulaire de dépôt | `page-signaler-un-dechet.png` |
| signaler, type de déchet, catégories, GPS | `page-signaler-type-et-emplacement.png` |
| signaler, description, précision, publier | `page-signaler-precision-et-publication.png` |
| classement, leaderboard, podium, amis | `page-classement-podium.png` |
| classement, liste, rang, écart de points | `page-classement-liste-bas.png` |
| profil, identité, niveau, points | `page-profil-haut.png` |
| profil, badges | `page-profil-badges.png` |
| profil, historique, réglages, déconnexion | `page-profil-historique-et-mon-compte.png` |
| bilan d'impact, score, carte à partager | `page-bilan-dimpact-haut.png` |
| partage, télécharger l'image | `page-bilan-dimpact-partage.png` |
| avatar, changer d'avatar, photo de profil | `modale-avatar-choix-source.png` |
| avatar, coiffure, expression, peau, chemise | `modale-avatar-compositeur-haut.png`, `modale-avatar-compositeur-bas.png` |
| nettoyer, liste des zones, choisir quoi nettoyer | `page-nettoyage-liste-zones.png` |
| nettoyage, photo avant, étape 1 | `page-nettoyage-etape-1-photo-avant.png`, `page-nettoyage-etape-1-photo-avant-prise.png` |
| nettoyage, ménage, étape 2, ce que vous avez enlevé | `page-nettoyage-etape-2-menage.png` |
| nettoyage, photo après, comparaison avant/après | `page-nettoyage-etape-3-comparaison.png` |
| nettoyage, analyse IA, étapes de validation | `page-nettoyage-analyse-ia-en-cours.png` |
| nettoyage, validé, points crédités, confiance IA | `page-nettoyage-succes-valide.png` |
| signaler, photo chargée, aperçu | `page-signaler-photo-chargee.png` |
| signaler, catégorie choisie, points | `page-signaler-categorie-choisie.png` |
| signaler, formulaire complet, prêt à publier | `page-signaler-formulaire-complet.png` |

---

## 🧭 Onboarding — 3 pages (carrousel plein écran)

Fond vert très sombre, contenu centré dans une colonne étroite, indicateur de
progression en haut à droite (`1/3`, `2/3`, `3/3`), bouton retour en haut à
gauche (absent sur l'étape 1), bouton primaire vert `#5CE04A` en bas, lien
secondaire **« Passer la présentation »**.

Chaque page suit la même structure :

1. Carte icône (rectangle arrondi, fond vert dégradé, icône lime centrée)
2. Titre en display gras très serré, 2 lignes max
3. Paragraphe descriptif
4. 1 à 2 blocs « info » — icône dans un carré vert sombre + titre + texte
5. CTA principal + lien d'évitement

| Fichier | Titre | Icône | Blocs d'info | CTA |
|---|---|---|---|---|
| `onboarding-1-signalez-en-trois-gestes.png` | **Signalez en trois gestes** | Appareil photo | « L'IA lit la photo » (plastique, verre, organique, e-waste → catégorie proposée, corrigeable) · « La carte se remplit » (votre quartier, vos signalements, ceux des voisins) | Continuer |
| `onboarding-2-nettoyez-et-faites-verifier.png` | **Nettoyez, et faites vérifier** | Feuille | « Le lieu n'a pas changé » (si l'endroit a bougé entre les deux photos, la validation est refusée) | Continuer |
| `onboarding-3-montez-de-niveau.png` | **Montez de niveau** | Trophée | « Une série de jour » (contribuer chaque jour entretient la série affichée sur le profil) · « Un classement réel » (par quartier ou parmi vos amis, avec place et écart de points) | **Créer mon compte** |

> L'étape 3 est le **point de sortie** de l'onboarding vers l'inscription.

---

## 🔐 Parcours d'authentification — 3 pages

Séquence de 5 étapes (indicateur `1/5` visible), retour possible via le lien
**« Retour »** en bas de chaque écran.

### 1. `onboarding-4-choix-du-compte.png` → `/inscription`

- Titre display : **Votre compte Greenshot**
- Texte : « Votre profil, vos points et votre classement sont liés à ce compte. Un compte, un historique, sur tous vos appareils. »
- **Deux grandes cartes cliquables empilées :**
  - Carte **primaire verte** : icône `+` dans un carré → « Créer un compte » / « 30 secondes, avec votre avatar »
  - Carte **secondaire sombre** : icône personne → « J'ai déjà un compte » / « Se connecter avec mon e-mail »
- Pas de formulaire sur cet écran : c'est un aiguillage.

### 2. `page-connexion.png` → `/connexion`

- Titre display : **Connexion**
- Sous-titre : « Entrez l'adresse associée à votre compte Greenshot. »
- **2 champs** avec label en capitales gris au-dessus du champ :
  - `ADRESSE E-MAIL` — champ avec icône enveloppe à gauche, valeur pré-remplie
  - `MOT DE PASSE` — champ avec icône cadenas, contenu masqué, **bordure lime active** (focus), et **icône œil à droite sous le champ** pour afficher/masquer
- Espacements verticaux généreux entre les deux champs
- CTA primaire pleine largeur **« Se connecter »**, puis lien **« Retour »**

### 3. `page-selection-avatar.png` → `/inscription`

- Titre display : **Votre avatar**
- Texte : « Un avatar est créé automatiquement à l'inscription. Vous pourrez le changer, ou ajouter une photo, depuis votre profil. »
- **Carte de l'avatar courant** (bordure verte) : vignette ronde, badge vert avec lettre, nom **« Avatar Greenshot »**, description « Dessiné dans vos couleurs, aucun réseau », et bouton secondaire **« Photo »** avec icône appareil photo
- **Grille d'avatars** : 2 rangées de 4 avatars ronds, fond vert dégradé, personnages stylisés aux cheveux variés (argenté, rose, brun, blond, lavande, turban, barbe, violet) — sert deChoices
- CTA primaire pleine largeur **« Entrer dans Greenshot »**, puis lien **« Retour »**

### 4. Inscription — étape 1/5 : identité et accès (2 captures, même page scrollée)

Mêmes conventions que `page-connexion.png` : colonne centrée étroite, indicateur
`1/5` en haut à droite, label en capitales gris au-dessus du champ, champ
vert sombre à coins arrondis avec icône à gauche, CTA primaire pleine largeur
**« Continuer »** puis lien **« Retour »**.

`page-inscription-etape-1-identite-haut.png` — partie haute :
- Titre display : **Créer votre compte**
- Sous-titre : « Ces informations restent sur cet appareil dans cette démonstration. »
- Champ **NOM COMPLET** — icône personne, placeholder « Ex. Camille Mukamana »
- Champ **ADRESSE E-MAIL** — icône enveloppe, placeholder « vous@exemple.bi »
- Le label **TÉLÉPHONE** est coupé en bas par le CTA collé (débordement de mise en page visible sur la capture)

`page-inscription-etape-1-identite-bas.png` — partie basse :
- Champ **ADRESSE E-MAIL** (idem)
- Champ **TÉLÉPHONE** — **deux champs juxtaposés** :
  - Sélecteur d'indicatif, plus étroit : **« +257 »** avec chevron `›` à droite
  - Champ de saisie avec icône téléphone, valeur « 79 12 345 »
- Champ **MOT DE PASSE** — icône cadenas, placeholder « 8 caractères minimum », avec **icône œil** à droite sous le champ (comme sur la connexion)

> Les 4 champs de cette étape correspondent au contrat d'inscription défini dans
> `AGENT.md` : nom, e-mail, mot de passe, téléphone. Le `username` n'est pas
> saisi — il est auto-généré par le trigger `handle_new_user`.

---

## 🏠 Accueil / Dashboard — 3 captures (même page, scrollé)

Page la plus riche de l'application. Structure commune à toutes les captures :

- **Sidebar gauche fixe** (largeur ~400px) sur fond vert très sombre :
  - Logo : carré vert arrondi avec icône feuille + « Green**shot** » (le mot « shot » en vert lime)
  - Nav verticale avec icônes : Accueil (maison), Carte (carte pliée), Signaler (appareil photo, pastille verte), Classement (trophée), Profil (personne)
  - L'item actif a un **fond vert plus clair**
  - En bas : **carte profil** (avatar + nom + « Niveau 1 · 0 pts ») puis **grand bouton vert primaire « Signaler »**
- **Bouton micro flottant** en bas à droite :Pastille verte ronde avec micro, badge rouge `4` (notifications)
- En haut à droite de l'en-tête : **badge du niveau** (goutte + « Niveau 1 »)

| Fichier | Section visible |
|---|---|
| `page-accueil-haut.png` | Salutation **« Bonjour Éclaireur »** + « Prêt à verdir votre quartier ? », tuile niveau (carte crème, pastille géomètre, points, barre de progression, « Encore 250 pts pour le niveau 2 », 2 boutons : **Signaler un déchet** (primaire sombre) et **Carte** (secondaire)), puis bandeau de 3 statistiques (0 signalements publiés · 0 nettoyages validés · 0 actions cette semaine). Début de « À nettoyer près de vous ». |
| `page-accueil-milieu-liste-nettoyage.png` | Liste **« À nettoyer près de vous »** complète avec bouton « ↻ Actualiser » et « Mis à jour il y a X s » : 4 lignes (Verre +25 pts · Mégots +15 pts · Plastique +20 pts · Déchets ménagers +20 pts), chacune avec icône de catégorie dans un carré vert, lieu, badge **« À nettoyer »** et points alignés à droite. Début du graphe « Votre activité ». |
| `page-accueil-bas-activite-et-defis.png` | Graphe **« Votre activité »** — 7 derniers jours, colonnes L M M J V S D, cellule du jour entourée en blanc, légende Moins ▪▪▪▪ Plus, texte **« 0 jour sur 7 »** + « 0 actions · 0 pts ». Puis **empty state** : rond avec icône feuille, **« Aucune activité pour l'instant »**, « Signalez votre premier déchet pour lancer votre progression. » Puis carte **« Mes défis du jour »** (4 restantes) avec chevron. |

---

## 🗺️ Carte du Burundi — 4 vues (desktop + 3 états mobiles)

Toutes les vues partagent le même **chrome** :

- Titre d'en-tête sobre en haut à gauche : **Carte du Burundi**
- **Puce de localisation** en surimpression : « Bujumbura · position de démo » + pastille **« ● 3D »** à droite
- **Filtre catégories** : colonne verticale de tuiles carrées à gauche (7 tuiles), chacune avec icône et **pastille de compteur** en coin (12, 3, 2, 2, 2, 1, 2). La tuile active est en vert pleine. Bouton **« ≡ Légende › »** en dessous
- **Contrôles de carte** à droite, empilés verticalement dans des boutons ronds : `+`, `−`, `layers` (couches), `⊙` (recentrer)
- Bouton primaire **« Signaler ici »** en bas à droite
- Mention de crédits en bas : « Fond de carte © contributeurs OpenStreetMap · tuiles OpenFreeMap »
- **Bandeau inférieur** sombre : **« 12 SIGNALEMENTS À TRAITER »** (12 en gros, le reste en capitales petites) + bouton **« Partager »** avec icône avion engrené

### Vue desktop — `page-carte.png`

- **Sidebar gauche** visible (identique à l'accueil) + barre de scroll à droite
- Carte en **vue 2D stylisée** : contour du Burundi en vert lime, ~15 épingles circulaires colorées (rouge, vert, bleu, orange, violet) avec petite icône de déchet au centre
- **Bandeau d'avertissement** sous la puce : « Tuiles injoignables — vue hors ligne du Burundi, signalements de démonstration. »

### Vue mobile — ville — `page-carte-mobile-vue-ville.png`

- **Pas de sidebar** — l'écran occupe toute la largeur, format large/basse
- Zoom **ville** : voirie de Bujumbura en détail, noms de rues et de quartiers en surimpression (Avenue de l'Indépendance, Avenue du Commerce, Gasanira), lac au nord-ouest
- ~7 épingles dispersées, mostly vertes/bleues/violettes
- Relief plat, pas d'inclinaison

### Vue mobile — pays — `page-carte-mobile-vue-pays.png`

- **Zoom pays** : contour national complet du Burundi en vert lime, étiquette **« Burundi »** au centre, **Rwanda** en haut, frontière et cours d'eau en bleu
- ~5 épingles seulement (la plupart hors champ) : une pastille verte entourée d'un anneau au centre-gauche (position utilisateur), une violette en haut, deux vertes
- Lac Tanganyika à l'ouest en bleu foncé

### Vue mobile — 3D — `page-carte-mobile-vue-3d.png`

- **Inclinaison 3D active** : le terrain est en perspective, les bâtiments ont du **relief et des ombres portées**, la vue plongeante donne une lecture de « maquette »
- Le bouton **`layers` est activé** (fond vert plein, icône verte) — c'est l'indicateur de cet état
- Noms de rues et d_repères très denses en surimpression (Avenue des Martyrs, Avenue des Manguiers, Avenue des Euphores, Avenue de l'Indépendance, Rue du Commerce)
- Trois **bassins/deux rectangles bleu foncés** visibles au centre-gauche (réservoirs ou.toits piscines)

> Les trois vues mobiles documentent les **états de la carte**, pas des pages
> différentes : c'est la même route `/carte` avec des niveaux de zoom et un
> basculement 3D. Utile pour vérifier l.calcage des épingles, le contraste des
> marqueurs sur fond sombre, et la lisibilité des libellés de rue.

- Titre d'en-tête sobre : **Carte du Burundi**
- **Puce de localisation** en haut à droite : « Bujumbura · position de démo » + pastille **« ● 3D »**
- **Bandeau d'avertissement** : « Tuiles injoignables — vue hors ligne du Burundi, signalements de démonstration. »
- **Carte Leaflet** : contour du Burundi en vert lime sur fond sombre, ~15 épingles
  circulaires colorées selon la catégorie (rouge, vert, bleu, orange, violet), avec petite icône de déchet au centre
- **Filtre catégories** : colonne de 7 tuiles carrées empilées à gauche, chacune avec une icône, une **pastille de compteur** en coin (12, 3, 2, 2, 2, 1, 2) et la tuile active en vert pleine. Bouton **« ≡ Légende › »** en dessous
- **Contrôles de carte** à droite : `+`, `−`, `layers`, `⊙` (recentrer)
- Bouton primaire **« Signaler ici »** en bas à droite
- Mention de crédits : OpenStreetMap · OpenFreeMap
- Bandeau inférieur : **« 12 SIGNALEMENTS À TRAITER »** + bouton **« Partager »**

---

## 📸 Signaler un déchet — 4 captures (formulaire long, scrollé)

Une seule page `/signaler`, capturée en 4 morceaux. **Sidebar visible sur les 3 dernières**, absente de la première (qui est cadrée plus haut).

### 1. `page-signaler-un-dechet.png` — en-tête et zone photo

- En-tête : bouton retour `‹`, titre display **Signaler un déchet**, sous-titre « Photo · type · emplacement »
- **Onglets** (segmented control) :
  - Onglet actif **« Signaler »** — fond vert pleine, icône appareil photo dans un carré
  - Onglet inactif **« Nettoyer »** — fond sombre, icône feuille
- Ligne d'aide sous les onglets : « Vous en avez vu un : une photo suffit pour lancer la validation. »
- **Label** : « Photo du déchet * » (astérisque en vert)
- **Zone de dépôt** : grand rectangle pointillé vert, icône appareil photo dans un rond vert, **« Prendre une photo »** en gras, « Appuyez pour ouvrir l'appareil photo »

### 2. `page-signaler-type-et-emplacement-large.png` — types et emplacement (vue large)

- Bouton secondaire **« Photo de démo »** aligné à droite sous la zone de photo — **encadré par `import.meta.env.DEV`**, à ne pas garder en production
- Texte d'aide : « Une photo nette accélère la validation par l'IA. »
- **Label** « Type de déchet * » puis **grille de 6 cartes** en 2 colonnes :

| Catégorie | Couleur / forme de l'icône |
|---|---|
| Déchets ménagers | vert, poubelle |
| Plastique | cyan, bouteille |
| Verre | bleu, verre à pied |
| Mégots | jaune, triangle d'avertissement |
| Encombrants | orange, voiture |
| Papiers & cartons | violet, boîte |

Chaque icône est dans un **hexagone/rhombe** de sa couleur, pas dans un carré — à distinguer des captures d'accueil où les icônes sont dans des carrés. Aucune carte n'est sélectionnée sur ces captures.

- Aide sous la grille : « Choisissez la catégorie qui correspond le mieux. »
- **Label** « Emplacement * » puis champ **liste déroulante** : « Marché du Centre (Rohero) » avec chevron à droite
- Ligne GPS avec icône cible : **« Position GPS détectée · précision 8 m »**

### 3. `page-signaler-type-et-emplacement.png` — même section, cadrage resserré

Même contenu que la vue large mais **sans la zone de photo** et sans le bouton « Photo de démo ». La grille déborde légèrement à droite (2ᵉ colonne coupée) : défaut de largeur du conteneur.

### 4. `page-signaler-precision-et-publication.png` — description et publication

- Bas de la grille de catégories (Verre, Mégots, Encombrants, Papiers & cartons)
- Champ **Emplacement** (déroulant) + ligne GPS
- **Label** « Précision (facultatif) » — **sans astérisque**, seul champ optionnel
- **Zone de texte multiligne** (≈ 5 lignes, coin d'agrandissement en bas à droite), placeholder : « Ex. sacs éventrés devant le n° 62, sur le trottoir »
- **CTA primaire pleine largeur** : **« Publier le signalement »** avec icône avion engrené à gauche
- Réassurance sous le CTA : « Un signalement publié rapporte **+20 pts**. » (le montant est en vert)

---

## 🏆 Classement — 2 captures

`/classement`, sidebar avec **Classement** actif.

### 1. `page-classement-podium.png` — filtres et podium

- Titre display **Classement**, sous-titre « Commune de Rohero · cette semaine »
- Bouton info dans un carré arrondi en haut à droite
- **3 onglets de portée** (pills) : **Quartier** (actif, vert plein) · **Global** (icône globe) · **Amis** (icône étoile)
- **Section Podium** — libellé avec icône trophée dans un carré, filet horizontal à droite
- **3 cartes** de largeurs et hauteurs différentes : la 1ʳᵉ est plus haute, plus large, fond **ambre/or** et bordure dorée ; les 2ᵉ et 3ᵉ sont en vert sombre
- Badges de rang circulaires **1** (or), **2** (argent), **3** (bronze) en haut de chaque carte
- Chaque carte : avatar rond avec pastille **« Niv. X »**, nom, points en gros chiffres verts
- Contenu : `1` Léa M. Niv. 9 — **2140** · `2` Yanis B. Niv. 8 — **1830** · `3` Nadia K. Niv. 7 — **1610**
- **Carte « Vous »** (bordure verte) : votre avatar, **« Vous #10 sur 10 »** en vert, « Niveau 1 · Rohero », score `0` à droite et **écart `−180 pts`** en vert
- **Section Classement complet** — libellé avec icône liste, compteur **10** à droite, puis début de la liste

### 2. `page-classement-liste-bas.png` — liste complète

Bas de la même liste, entrées 5 à 10 :

| Rang | Joueur | Niveau · lieu | Score | Écart |
|---|---|---|---|---|
| 5 | *(coupé)* | Niveau 5 · Gihanga | 460 | −290 |
| 6 | Tom V. | Niveau 4 · Ngaramba | 870 | −235 |
| 7 | Aline R. | Niveau 3 · Rohero | 640 | −230 |
| 8 | Eric N. | Niveau 2 · Mukike | 395 | −245 |
| 9 | Bénévole B. | Niveau 1 · Rohero | 180 | −215 |
| 10 | **Vous** | Niveau 1 · Rohero | 0 | −180 |

- Ligne « Vous » : **bordure verte**, avatar et nom en gras
- L'écart de points est toujours affiché **en vert**, y compris quand il est négatif : la couleur ne code pas le sens
- Puis : « Touchez un joueur pour voir sa fiche et le suivre. »
- Carte **« Mes défis du jour »** avec **« 4 restantes »** en vert à droite

---

## 👤 Profil — 3 captures

`/profil`, sidebar avec **Profil** actif.

### 1. `page-profil-haut.png` — identité et score

- Titre display **Profil**, sous-titre « Votre impact sur Greenshot »
- **Grande carte verte** centrée :
- Avatar rond en **grand** avec **anneau vert lumineux** et **badge appareil photo** en bas à droite (modifier l'avatar)
- Nom **Éclaireur** en display
- Sous-titre : « Éclaireur vert · Rohero, Bujumbura »
- **3 pills** : « Niveau 1 » (feuille, bordure verte active) · « #10 du quartier » (trophée) · « 0 badge » (étincelle)
- **Carte claire** « TOTAL CUMULÉ » : gros `0` en display, « pts », texte « 0 pts sur 250 · encore 250 pour le niveau 2 », barre de progression vide
- Début du bandeau de 3 statistiques (signalements / nettoyages / actions)

### 2. `page-profil-badges.png` — badges

- Bas des 3 statistiques : `0` signalements · `0` nettoyages · `0` actions
- **Section Badges `0 / 6`** — grille de 6 cartes en 3 colonnes, **toutes verrouillées** (texte gris, icône grise) :

| Badge | Condition |
|---|---|
| Première pousse | 1er signalement |
| Gardien du quartier | 3 signalements |
| Éco-nettoyeur | 1er nettoyage |
| Série active | 3 nettoyages |
| Niveau 5 | 1 000 pts |
| Top 3 | Classement |

- **Section Historique `0 action`** puis empty state : rond avec icône horloge, **« Historique vide »**, « Vos signalements et nettoyages validés apparaîtront ici. »

### 3. `page-profil-historique-et-mon-compte.png` — menu du compte

- Haut : empty state Historique (idem), avec le **titre de section** juste au-dessus (trait horizontal fin)
- **Section « Mon compte »** — 3 lignes cliquables, chacune avec icône dans un carré vert sombre, titre, sous-titre, et **chevron à droite** :

| Ligne | Sous-titre | Icône |
|---|---|---|
| **Mon bilan d'impact** | Carte à partager · 0 pts | balance |
| **Défis du jour** | 4 restantes · 0 sur 4 accomplies | éclair |
| **Réglages** | Notifications, localisation, animations | couches |

- Une 4ᵉ carte commence à apparaître en bas (bordure verte visible, contenu coupé)

---

## 📊 Bilan d'impact — 2 captures

Sous-page ouverte depuis « Mon bilan d'impact » du profil. **Sidebar conservée**, Profil toujours actif dans la nav.

### 1. `page-bilan-dimpact-haut.png` — carte de score partageable

- Bouton retour `‹`, titre display **Mon bilan d'impact**, sous-titre « Ce que vos actions ont changé »
- **Grande carte verte à bordure verte** (c'est la carte qui sera exportée en image) :
- Avatar en haut, centré, avec anneau vert
- Nom **Éclaireur** en display
- **« Niveau 1 · #10 du quartier »** en vert
- **Gros `0` + « PTS »** au centre
- **3 pastilles** sur une ligne : « 0 j de série » (goutte) · « 0 zone nettoyée » (feuille) · « 0 signalement » (appareil photo)
- **Barre de 3 statistiques** séparée par des filets verticaux : `0` signalements publiés · `0` nettoyages validés · `0` badges obtenus
- **Signature** en bas : logo + « Greenshot · Éclaireur »
- Un **cercle vert décoratif** dans l'angle supérieur droit, débordant du cadre
- Début d'une section suivante (bordure verte visible en bas)

### 2. `page-bilan-dimpact-partage.png` — partage et nettoyages

- Bas de la carte de score (statistiques + signature)
- **Section « Partager mon bilan »** :
- CTA primaire pleine largeur **« Partager ma carte »** avec icône avion engrené
- Bouton secondaire pleine largeur **« Télécharger l'image »** avec icône téléchargement
- Réassurance : « L'image est dessinée sur votre appareil, elle n'est envoyée à personne. »
- **Section « Ce que vous nettoyez »** puis empty state : rond avec icône feuille, **« Pas encore de nettoyage »**, « Validez un premier nettoyage : votre bilan se remplira ici et sur la carte. »

---

## 🎨 Modale de changement d'avatar — 3 états

Ouverte depuis le **badge appareil photo** sur l'avatar du profil. Le fond est **flouté et assombri** (backdrop), pas masqué.

### 1. `modale-avatar-choix-source.png` — choix de la source

- Titre **« Votre avatar »**, texte : « Il est créé automatiquement à l'inscription. Vous pouvez le recomposer ou utiliser une photo. »
- **2 lignes cliquables** dans des cartes vert sombre, icône + titre + description + chevron :
- **Changer d'avatar** — « Coiffure, expression, peau, chemise » (icône étincelles)
- **Mettre une photo de profil** — « Recadrée en carré · JPG ou PNG » (icône image)
- Bouton tertaire pleine largeur **« Annuler »**
- La boîte est **centrée horizontalement**, à cheval sur le contenu : la sidebar reste visible et non floutée à gauche

### 2. `modale-avatar-compositeur-haut.png` — composeur, partie haute

- **Poignée de glissement** (trait horizontal court) en haut → c'est une **bottom sheet**, pas une boîte centrée
- Titre **« Votre avatar »** aligné à gauche
- **Aperçu** : avatar rond en grand avec anneau vert
- Texte : « Chaque modification s'applique immédiatement et vous suit sur le classement. »
- **Label « COIFFURE »** → grille de **8 vignettes** (rangée de 6 + rangée de 2), la 2ᵉ sélectionnée avec **bordure verte**
- **Label « EXPRESSION »** → rangée de 5 vignettes, la 1ʳᵉ sélectionnée (bordure verte)
- Les vignettes sont des **tuiles carrées à coins arrondis** avec le buste du personnage en fond vert

### 3. `modale-avatar-compositeur-bas.png` — composeur, partie basse

- Fin de la grille **COIFFURE** (2 vignettes)
- **EXPRESSION** : 5 expressions — neutre, sourire, bouche ouverte, mécontent, sourire grand
- **Label « TEINTE DE PEAU »** → 5 pastilles circulaires du plus foncé au plus clair, la 2ᵉ entourée de vert
- **Label « COULEUR DE CHEVRUX »** → 6 pastilles (noir, brun foncé, brun, blond, roux, gris), la 1ʳᵉ entourée de vert
- **Label « CHEMISE »** → 6 pastilles (vert vif, vert foncé, blanc, bleu, orange, violet)
- **CTA primaire pleine largeur « Terminé »**
- Cette capture contient une **notification Windows** (« Outil Capture d'écran ») qui masque le coin inférieur droit. Sans impact sur le design.

> **Différentiel important** : le choix d'avatar à l'inscription (`page-selection-avatar.png`) propose des avatars **entiers déjà composés**, alors que le compositeur du profil permet de **recomposer** un avatar par attributs (coiffure / expression / teinte / cheveux / chemise). Ce sont deux mécaniques différentes, à ne pas confondre.

---

## 🧹 Nettoyer un endroit — 7 captures

`/nettoyage` est le **parcours miroir** de `/signaler` : là où on dépose, ici on
justifie. Même sidebar, mais l'entrée de nav active est **Carte** — la route
`/nettoyage` n'a pas d'icône propre dans la navigation.

### 1. `page-nettoyage-liste-zones.png` — sélection de la zone

- Titre display **Nettoyer un endroit**, sous-titre **« 13 zones à nettoyer »**
- **Onglets** identiques à ceux de `/signaler` : **Signaler** (inactif) · **Nettoyer** (actif, vert plein, icône feuille)
- Ligne d'aide : « Un signalement ouvert vous attend : photo avant, ménage, photo après. »
- **Section « Zones signalées près de vous »** avec, à droite, le critère de tri **« la plus proche d'abord »**
- **Liste de lignes** : icône de catégorie dans un carré vert sombre + nom de catégorie + lieu, puis à droite un **badge de points** (pill verte) et un **chevron** :

| Catégorie | Lieu | Nettoyage |
|---|---|---|
| Verre | Avenue de la Révolution | +65 pts |
| Mégots | Carrefour Gihanga | +55 pts |
| Plastique | Avenue du Commerce | +60 pts |
| Déchets ménagers | Marché du Centre | +60 pts |

> **Les points sont bien plus élevés qu'en signalement** (verre : +65 en nettoyage contre +25 en signalement). C'est cohérent avec la règle d'`AGENT.md` : « signalement < nettoyage ».

### 2. `page-nettoyage-etape-1-photo-avant.png` — étape 1, cadrage vide

- Titre display **Nettoyage**, sous-titre **« Avenue de la Révolution »** (le lieu choisi)
- **Barre de progression en 4 segments** : le 1ᵉʳ est **vert plein**, les 3 suivants gris. NB : la barre compte **4** segments alors que le parcours se décrit en 3 étapes nommées (photo avant / ménage / photo après). La 4ᵉ étape est l'analyse IA.
- **Carte récapitulative** : icône verre, **Verre**, « Avenue de la Révolution · +65 pts », badge **« À nettoyer »** à droite
- **Carte d'étape** : rond vert avec icône appareil photo, **« Étape 1 · Photo avant »**, « Cadrez la zone sale avant de commencer. »
- Grande zone vide en dessous (le rectangle de la photo)

### 3. `page-nettoyage-etape-1-photo-avant-prise.png` — étape 1 validée

- Aperçu de la photo dans le rectangle
- Champ d'aide **« Photo de démo »** (encadré par `import.meta.env.DEV`)
- **CTA vert avec coche** : **« ✓ Photo avant prise »** — le libellé change pour confirmer l'action faite

### 4. `page-nettoyage-etape-2-menage.png` — étape 2

- **Carte d'étape bordée de vert** (étape courante) : rond vert plein avec icône feuille, **« Étape 2 · Faites le ménage »**, « Ramassez les déchets, puis décrivez ce que vous avez enlevé. »
- **Liste à puces de consignes** :
  - Portez des gants si besoin.
  - Déposez au bon bac de tri.
  - Gardez cet angle pour la photo d'après.
- **Label** « Ce que vous avez enlevé **(facultatif)** » — pas d'astérisque
- **Zone de texte multiligne** : « Ex. 3 sacs plastique et une bouteille, ramenés au bac de tri du marché »
- **Aide** : « Un mot sur le ménage aide l'IA à confirmer le travail. »
- **CTA vert** : **« J'ai terminé, photo après »**

### 5. `page-nettoyage-etape-3-comparaison.png` — étape 3, comparaison

- **Carte d'étape** : **« Étape 3 · Photo après »**, « Même angle que la photo avant : c'est ce qui permet de vérifier. »
- **Deux colonnes côte à côte** avec labels en capitales gris au-dessus :
  - **AVANT** — photo chargée, bordure **continue**
  - **APRÈS** — rectangle vide avec **bordure pointillée verte**, icône appareil photo et libellé **« À prendre »** en vert
- Champ « Photo de démo »
- **CTA vert désactivé** (opacité réduite) : **« Analyser avec l'IA »** — bloqué tant que la photo après manque

> C'est le point de contrôle central de Greenshot : **le même angle** est la
> condition de la validation. La bordure pointillée de la colonne « APRÈS » rend
> cette exigence visible avant même de l'expliquer.

### 6. `page-nettoyage-analyse-ia-en-cours.png` — analyse en cours

- Sous-titre **« Avenue du Commerce »**, catégorie **Plastique** · +60 pts
- Barre de progression : **les 4 segments sont verts**
- **Carte d'analyse bordée de vert** : rond vert avec étincelles, **« Analyse IA en cours »**, « Comparaison des photos avant / après… »
- **3 étapes avec état** :

| Étape | État |
|---|---|
| Chargement des deux images | coche verte |
| Détection des déchets (avant) | coche verte |
| Détection de la zone nettoyée (après) | cercle vert creux, **en cours** |

- **Barre de progression** ~40 % verte sous les étapes
- La sidebar affiche **« Niveau 1 · 120 pts »** : les points de signalement sont déjà crédités pendant que le nettoyage est analysé

### 7. `page-nettoyage-succes-valide.png` — nettoyage validé

- **Carte claire de succès** (fond crème, seule utilisation du fond clair hors carte « Total cumulé ») :
  - **Rond vert plein avec coche blanche**
  - Titre **« Nettoyage validé »**
  - « La zone a bien été nettoyée. Les points ont été crédités. »
  - **« Confiance de l'analyse »** avec **`93 %`** à droite et barre verte pleine
- Puis **comparaison AVANT / APRÈS** en dessous, les deux images remplies
- Sidebar : **« Niveau 1 · 65 pts »** (les +65 du nettoyage)

---

## 🖼️ Signaler — états avancés (3 captures)

Complètent les 4 captures de la section « Signaler un déchet » : elles montrent
le formulaire **après** chargement de la photo, contrairement aux captures
précédentes prises sur un formulaire vide.

### `page-signaler-photo-chargee.png` — photo chargée

- Même en-tête et onglets que `page-signaler-un-dechet.png`
- **Zone photo remplie** par l'image chargée (2 vignettes) avec **panneau de réglages par-dessus** (inspecteur Figma dans la maquette) : « Layer blur », « Blur 200 », « Apparence 80 % », « Plus lighter »
- **Bouton refresh** dans un carré arrondi à droite de l'aperçu
- La grille des 6 catégories commence en bas de la capture

### `page-signaler-categorie-choisie.png` — catégorie sélectionnée

- Bas de l'aperçu photo, bouton « Photo de démo » à droite
- **Grille des 6 catégories, entièrement visible cette fois** (2 colonnes)
- **État sélectionné** : la carte **Déchets ménagers** a une **bordure verte 2px**, un fond vert très légèrement plus clair et son **libellé passe en vert** — les 5 autres restent blanches
- **Remplace** l'aide générique « Choisissez la catégorie qui correspond le mieux. » par un **récapitulatif de points** : « Catégorie choisie : **Déchets ménagers** · +20 pts. »
- Le pointage de chaque catégorie est donc **révélé au moment du choix**, pas seulement dans la liste « À nettoyer » de l'accueil

### `page-signaler-formulaire-complet.png` — prêt à publier

- Bas de la grille (Verre, Mégots, Encombrants, Papiers & cartons)
- Rappel « Catégorie choisie : **Déchets ménagers** · +20 pts. »
- Champ **Emplacement** (déroulant) + ligne GPS
- Champ **Précision (facultatif)** multiligne
- **CTA vert** « Publier le signalement » + réassurance « Un signalement publié rapporte **+20 pts**. »
- Le texte d'aide « Une photo nette accélère la validation par l'IA. » a **disparu** une fois la photo chargée

---

## 🎨 Tokens visuels (communis à tous les écrans)

| Rôle | Valeur approximative |
|---|---|
| Fond application | `#04150B` → `#062413` (vert quasi noir) |
| Fond surface / carte | `#0B2B16` / `#0E3A1C` |
| Vert primaire (CTA, actif, logo) | `#5CE04A` |
| Vert lime (texte d'accent, bordure map) | `#7CFF4F` |
| Texte principal | `#F2F2EF` (blanc cassé) |
| Texte secondaire | `#8A9A8E` (gris-vert) |
| Carte claire (carte niveau) | `#F4F6F0` |
| Typo titres | Display très gras, tracking serré, 2 lignes max |
| Typo corps | Sans-serif regular, gris-vert, interlignage large |
| Rayons | Grands (≈ 20–24px) sur les cartes, 999px sur les pastilles |
| Icônes | Lucide, stroke 2, taille 20–24px, toujours dans un carré vert sombre |

**Règles de mise en page récurrentes :**
- Sidebar fixe à gauche sur desktop, contenu scrollé à droite
- Cartes en coins très arrondis, bordure verte subtile ou aucune
- Un seul élément primaire vert par écran
- Les titres display sont toujours sur **une ou deux lignes maximum**

---

## 🧭 Comment un agent utilise ce document

1. Identifier l'écran nécessaire (route, mot-clé, ou tableau d'index).
2. Lire l'image correspondante avec l'outil de lecture d'image.
3. S'aligner sur la structure décrite ci-dessus avant d'écrire ou modifier du code.
4. Si l'écran concerné n'est pas listé, **ne pas inventer** : le dire et demander
   une capture, ou signaler l'absence dans la section « Écarts connus ».

**Écrans non documentés à ce jour :** étapes 2 à 5 de l'inscription, page
`/signalement/:id` (détail d'un signalement + timeline), la section « Ce que vous
nettoyez » du bilan d'impact lorsqu'elle contient des données, et l'état
« nettoyage refusé » (distance GPS > 50 m) décrit dans `AGENT.md` mais pas
visible sur les captures.
