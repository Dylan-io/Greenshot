# Greenshot — Design System

> Extrait du code réel de `index.html` (bloc `<style>`, lignes 11–1126).
> Ce fichier décrit ce qui est implémenté, pas une intention.

---

## Source de vérité

Le CSS de l'application est **inline dans `index.html`**, lignes 11 à 1126, un seul bloc `<style>`.
`styles.css` **n'est pas chargé** par l'application : il décrit une autre palette (crème et noir)
que celle qui s'affiche réellement.

Conséquence : `DESIGN-MANIFEST.json` déclare `tokens.source: ["styles.css"]`, ce qui est **inexact**.
Ne pas suivre cette indication. La source réelle est le bloc `<style>` de `index.html`.

Polices chargées via Google Fonts : Boldonse, Geist (400/500/600/700), Instrument Serif.

---

## Couleurs

### Surfaces sombres (la base de l'application)

| Token | Valeur | Rôle |
|---|---|---|
| `--forest` | `#122314` | Surface de l'application (`#app`) |
| `--forest-2` | `#0e1c10` | Décalage de profondeur |
| `--forest-3` | `#0a1509` | Fond de page, sous le halo radial |
| `--panel` | `#172a19` | Surface de carte, de statistique |
| `--panel-2` | `#1e3520` | Survol de carte |
| `--line` | `rgba(255,255,255,.09)` | Bordure standard |
| `--line-2` | `#2c4630` | Bordure survolée |

Le fond n'est pas plat. `body` porte un halo radial :
`radial-gradient(circle at 50% -8%, rgba(104,239,63,.12), transparent 42%) fixed`, posé sur `--forest-3`.
Le vert est donc présent même dans les zones vides, en très faible intensité.

### Accents

| Token | Valeur | Rôle |
|---|---|---|
| `--sprout` | `#68ef3f` | Accent principal. Boutons primaires, texte de point, focus |
| `--sprout-2` | `#8ff56a` | Variante claire, rare |
| `--verdant` | `#26a200` | Vert sourd. Bord d'icône, pastille de pilule, début de gradient XP |

### Texte

| Token | Valeur | Rôle |
|---|---|---|
| `--white` | `#ffffff` | Texte principal sur sombre |
| `--fern` | `#b7bda5` | Texte secondaire, sous-titres |
| `--lichen` | `#a7ac9a` | Texte tertiaire, `eyebrow`, chevrons |

Trois niveaux de texte sur fond sombre, plus `--sprout` pour l'accent. C'est une hiérarchie à quatre
niveaux, pas une échelle continue.

### Surfaces claires

| Token | Valeur | Rôle |
|---|---|---|
| `--bone` | `#f2f5eb` | Carte claire, variante `.card.light` |
| `--wash` | `#e7f9dd` | Carte verte pâle, `.pill`, `.card.wash` |
| `--mist` | `#d9deca` | Neutre vert pâle, non utilisé dans le rendu actuel |
| `--onyx` | `#30322a` | Texte **sur** fond clair |
| `--stone` | `#d6d6d6` | Placeholder, contrôle désactivé |
| `--carbon` | `#222222` | Non utilisé dans le rendu actuel |

`--mist` et `--carbon` sont déclarés mais je ne les ai pas trouvés appliqués. Candidats à la suppression.

### Sémantique

| Token | Valeur | Rôle observé |
|---|---|---|
| `--amber` | `#f2c14e` | Statut en cours, `.st-prog` |
| `--danger` | `#ff7452` | Échec, suppression |

---

## Typographie

| Token | Famille | Rôle |
|---|---|---|
| `--font-display` | Boldonse | Titres d'écran, chiffres de points (`.sbar h1`, `.stat b`, `.hero-card .pts`) |
| `--font-ui` | Geist, fallback Inter | Tout le reste. Corps, boutons, navigation |
| `--font-serif` | Instrument Serif | Déclaré, aucun usage visible dans les écrans parcourus |

Le choix est net : **Boldonse est réservé aux titres et aux chiffres qui comptent.**
Les points dans la carte de niveau sont en Boldonse, le mot « pts » à côté est en Geist 600.
C'est le mécanisme qui donne au score sa hiérarchie. À préserver.

Tailles relevées :

- Titre d'écran : 22px, Boldonse, `letter-spacing: -0.01em`
- Sous-titre : 13.5px, Geist, `--fern`
- Titre de section : 18px, Geist 600, `letter-spacing: -0.01em`
- Corps de liste (`.t1`) : 15px, Geist 600
- Secondaire de liste (`.t2`) : 13px, Geist, `--fern`
- Chiffre de statistique : 24px, Boldonse, `--sprout`
- Points (carte héros) : `clamp(38px, 12vw, 50px)`, Boldonse
- `eyebrow` : 11.5px, Geist 600, `letter-spacing: 0.13em`, majuscules, `--lichen`

---

## Formes et espacements

| Token | Valeur | Usage |
|---|---|---|
| `--r-pill` | `999px` | Pastilles, badges de statut |
| `--r-card` | `20px` | Cartes, tuiles de statistique |
| `--r-sm` | `14px` | Boutons, rangées, tuiles d'icône |
| `--r-xs` | `10px` | Petits éléments, `iconbtn` |
| — | `24px` | `.hero-card`, la seule surface au-dessus de 20px |
| — | `12px` | `iconbtn`, `tico` |

**Convention à retenir** : les grands rayons vont sur les grandes surfaces.
Carte 20px, bouton 14px, pastille pleine. Un bouton en pilule sur fond clair et un bouton en
14px sur fond sombre coexistent dans la même page. Ce n'est pas une erreur, mais c'est à
documenter comme une intention, pas un oubli.

Gouttières : 20px sur mobile, `--gutter` en `clamp(20px, 4vw, 64px)`.
Grille `statstrip` : 3 colonnes égales, gap 12px.
Grille `#app` : une colonne, deux rangées (`main` puis `nav`). Mobile d'abord.

---

## Mouvement

| Token | Valeur | Usage |
|---|---|---|
| `--dur-1` | `170ms` | Survol, feedback de bouton |
| `--dur-2` | `260ms` | Transitions de couleur plus longues |
| `--dur-3` | `400ms` | Barre de progression XP (`xpFill`) |
| `--ease-out` | `cubic-bezier(.22,.61,.36,1)` | Sortie, par défaut |
| `--ease-in` | `cubic-bezier(.4,0,1,1)` | Entrée |

Trois durées, deux courbes. C'est serré et cohérent.

Le seul mouvement non essentiel est `xpFill`, `scaleX(0)` vers `scaleX(1)` sur 400ms.
Le reste est du feedback : survol, bordure, couleur. Rien n'est animé au scroll.

`btn:active` applique `transform: scale(.975)`. C'est le seul feedback tactile, et il est
partout où `btn` est utilisé. Sur Android bas de gamme c'est bon.

---

## Composants

### Barre d'écran

Sticky, `padding: 30px + env(safe-area-inset-top)` en haut. Titre Boldonse 22px,
sous-titre 13.5px `--fern`. Un filet lumineux en `::after` :
`linear-gradient(90deg, transparent, rgba(104,239,63,.22) 22%, transparent)`,
centré sur `left/right: 20px`. Sépare le titre du contenu sans trait plein.

### Carte héros

`linear-gradient(150deg, var(--bone), #e9eee0)`, rayon 24px, `overflow: hidden`.
Pastille décorative en `::after` : cercle 180px, `right: -46px`, `top: -58px`,
`radial-gradient(circle at 40% 40%, rgba(104,239,63,.5), rgba(38,162,0,.06) 62%, transparent 72%)`.

C'est la seule carte claire de l'application, et elle porte les points. Le contraste
sombre vers clair attire l'œil exactement sur le score.

### Bouton

`min-height: 52px`, rayon 14px, Geist 600, 15px.
- `.btn-primary` : fond `--sprout`, texte `--onyx`
- `.btn-secondary` : transparent, bordure `--line-2`, survol vers `--sprout`
- `.btn-light` : fond `--onyx`, texte `--bone`
- `.btn-sm` : 44px de hauteur, pour les cibles secondaires

Le `--sprout` porte du texte `--onyx`, pas du blanc. `#68ef3f` est trop clair pour du blanc :
le texte sombre est le choix lisible. À ne pas inverser.

### Rangée d'action

`.rowcard` : 44px d'icône carrée (`tico`, fond `rgba(104,239,63,.12)`, bordure `.22`),
titre 15px/600, secondaire 13px `--fern`, à droite les points en `--sprout`.
Survol vers `--panel-2` et `--line-2`.

### Statut

`st-open` vert, `st-prog` ambre, `st-done` gris. Pastille 11.5px/600, bordure transparente
de base, rayon pleine.

### Navigation basse

Cinq entrées, `grid-area: nav`. L'entrée active est marquée par un fond et la couleur
`--sprout`, pas par un simple changement de couleur de texte.

### Bouton flottant

Cercle en bas à droite, badge de notification en surimpression. Ancré au-dessus de la navigation.

---

## Accessibilité

Déjà en place dans le code :

`outline: 2px solid var(--sprout)` avec `offset: 2px` sur `:focus-visible`, sur `.btn`,
`.navitem`, `.chip`, `.iconbtn`, `.catbtn`, `.avatar-opt`, `.link`, `a`, `button`, `.rowcard`, `.sw`.
Le focus est visible et cohérent. C'est mieux que la plupart des implémentations.

`touch-action: manipulation` posé globalement. Cible 44px minimum sur `.iconbtn` et `.tico`,
52px sur `.btn`.

Ce qui manque, à traiter au moment de l'implémentation Vue :

**`prefers-reduced-motion`.** Aucune règle ne le prend en compte. L'animation `xpFill` et le
`scale(.975)` au clic tournent pour tout le monde. Il faut une règle `@media` qui réduit,
pas qui supprime : l'apparition de la barre de progression reste utile, elle doit être immédiate.

**`lang="fr"`** sur le `<html>`, à vérifier à l'implémentation.

**Contrastes à mesurer.** `--lichen` `#a7ac9a` sur `--forest` `#122314` est le plus juste des
quatre niveaux de texte. `--fern` sur `--panel` dans `.t2` est le cas le plus courant et le
plus à surveiller. Je n'ai pas mesuré les ratios.

---

## Écarts avec `PRODUCT.md`

Trois points relevés, non corrigés.

**Couleurs de statut divergentes.** `PRODUCT.md` documente quatre statuts contraints :
`en_attente` terre cuite `#B5502F`, `vu` ciel `#3E7CA6`, `nettoye` ambre `#E8A33D`,
`traite` forêt `#1F4D3A`. Le CSS n'implémente que trois états visuels, en vert, ambre et gris.
La terre cuite et le ciel n'apparaissent pas. À trancher : soit le CSS est en avance et la doc
est périmée, soit les couleurs contraignantes ne sont pas encore implémentées.

**Fond de carte en ligne.** La carte dépend d'OpenFreeMap. Hors connexion ou en 2G/3G,
l'utilisateur voit « Moteur cartographique indisponible » et une vue du Burundi sans fond.
`PRODUCT.md` note 12 à 26 % de pénétration : ce cas est fréquent, pas rare.

**`styles.css` orphelin.** Déclaré dans le manifest comme source des tokens, jamais chargé.

---

## Ce qui manque par rapport au `DESIGN-MANIFEST.json`

Le manifest exige cinq états d'interaction : default, hover, focus, active, disabled,
loading, empty, error, success. Hover, focus et active sont présents.

**Aucun état vide n'est implémenté.** La base est vide, c'est acté dans `PRODUCT.md`, et la
carte affiche des compteurs à `0` sans traitement particulier. C'est un écart important :
l'état vide est ton état par défaut en V1, pas une exception.

**Aucun état loading.** Les actions asynchrones n'ont pas de traitement en attente visible.
`st-open` existe mais ne semble pas servir d'état de chargement.

**`index.html` est monolithique.** 3 719 lignes, CSS et markup et logique dans un seul fichier.
C'est très bien pour un prototype, et c'est inexploitable tel quel pour une base Vue.
Les classes `od-*` (`od-stack`, `od-cluster`, `od-row`, `od-fill`) sont des primitives
déjà extraites et prêtes à porter en composants.