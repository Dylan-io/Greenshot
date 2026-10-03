# Contrat API — Greenshot (Backend ↔ Frontend)

> Ce document décrit ce que **le backend expose** et **ce que le frontend doit
> appeler**. Il est écrit du point de vue du backend. Toute évolution de
> `backend/` doit être répercutée ici.

Base du projet : `https://cxlrhvkpozrbyategufj.supabase.co`
Authentification : Supabase Auth (JWT). Clé `anon` = publique (embarquée dans le
JS). Clé `service_role` = **jamais** dans le frontend.

---

## 1. Ce que le client a le droit de lire

| Objet | Colonnes accessibles | Qui |
|---|---|---|
| `profiles` | `id`, `nom`, `ville`, `username`, `score_signalement`, `score_nettoyage`, `created_at` | **Tous**, y compris anonymes |
| `profiles` | `email`, `phone`, `email_verified` | **Personne en direct** — passer par `obtenir_mon_profil()` |
| `categories` | toutes (lecture seule) | Tous |
| `signalements` | toutes, en lecture | Tous |
| `statuts_historique` | toutes, en lecture | Tous |
| `usernames_reserves` | toutes | Tous |

## 2. Ce que le client a le droit d'écrire

| Action | Autorisé |
|---|---|
| Modifier son profil : `nom`, `ville`, `phone` | Son propre compte |
| Modifier son profil : `username` | **Uniquement via `changer_username()`** |
| Modifier `score_signalement` / `score_nettoyage` | **Personne** — triggers uniquement |
| Créer un signalement | Si `email_verified = true`, et uniquement pour soi |
| Modifier la `description` d'un signalement | Son propre signalement |
| Modifier latitude / longitude / photos / statut | **Personne** — passer par une RPC |
| Insérer dans `statuts_historique` | **Personne** |
| Supprimer quoi que ce soit | **Personne** (aucun `GRANT DELETE`) |

---

## 3. Fonctions RPC

### 3.1 `obtenir_classement(p_ville TEXT, p_limite INTEGER)`

Leaderboard. **Accessible aux anonymes** (le classement est public).

```js
const { data, error } = await supabase.rpc('obtenir_classement', {
  p_ville: null,      // null = tout le Burundi
  p_limite: 30
})
// -> [{ rang, id, nom, ville, score_signalement, score_nettoyage, score_total }]
```

### 3.2 `obtenir_email_par_username(p_username TEXT)`

Résout un username en email. **Accessible aux anonymes** : la connexion précède
l'authentification.

```js
const { data: email, error } = await supabase.rpc('obtenir_email_par_username', {
  p_username: 'aline_4829'
})
// -> "aline@mail.com" | null
```

### 3.3 `obtenir_mon_profil()`

Profil complet de l'appelant, **PII comprise**. Authentifié requis.

```js
const { data, error } = await supabase.rpc('obtenir_mon_profil')
// -> [{ id, nom, ville, username, phone, email, email_verified,
//       score_signalement, score_nettoyage, created_at }]
// ⚠️ RETOURNE UN TABLEAU (une ligne) : lire data[0]
```

### 3.4 `utilisateur_email_verifie()`

**Interne** — utilisée par la politique RLS d'insertion. Le frontend n'a pas
besoin de l'appeler.

### 3.5 `soumettre_preuve_nettoyage(p_signalement_id, p_photo_apres_url, p_latitude, p_longitude)`

Soumettre une preuve de nettoyage. Authentifié requis.

```js
const { data, error } = await supabase.rpc('soumettre_preuve_nettoyage', {
  p_signalement_id: id,
  p_photo_apres_url: url,
  p_latitude: -3.3615,
  p_longitude: 29.3750
})
```

Deux sorties possibles, **toutes deux en HTTP 200** :

```js
// Succès
{ success: true, message: 'Preuve de nettoyage validee avec succes !',
  points_gagnes: 30, distance: 0.0 }

// Refus (trop loin) — ce n'est PAS une erreur HTTP
{ success: false, message: 'Position trop eloignee. Vous etes a 1724.5 m du lieu (maximum autorise: 50 m).',
  distance: 1724.5 }
```

→ **Tester `data.success`, pas `error`.**

### 3.6 `mettre_a_jour_statut(p_signalement_id UUID, p_nouveau_statut TEXT)`

Faire avancer le cycle de vie. Authentifié, déclarant uniquement.

`p_nouveau_statut` ∈ `{'vu', 'traite'}`. **`'nettoye'` est refusé ici** : ce
statut passe uniquement par `soumettre_preuve_nettoyage`.

Transitions autorisées : `en_attente → vu`, `en_attente → traite`, `vu → traite`.
Aucune transition inverse.

```js
const { data, error } = await supabase.rpc('mettre_a_jour_statut', {
  p_signalement_id: id,
  p_nouveau_statut: 'vu'
})
// -> { success: true, ancien_statut: 'en_attente', nouveau_statut: 'vu' }
```

### 3.7 `username_est_disponible(p_username TEXT, p_exclure_id UUID)`

**Nouvelle — migration 006.** Vérifier la disponibilité **pendant la saisie**,
avant de soumettre. Accessible aux anonymes.

```js
const { data, error } = await supabase.rpc('username_est_disponible', {
  p_username: 'aline_4829',
  p_exclure_id: userId   // passer son propre id pour ne pas se bloquer soi-même
})
```

Réponse **positive** :
```js
{ disponible: true, username: 'aline_4829', message: 'Ce nom d''utilisateur est disponible.' }
```

Réponses **négatives** (toujours HTTP 200, toujours `disponible: false`) :
```js
{ disponible: false, raison: 'vide',        message: 'Le nom d''utilisateur ne peut pas être vide.' }
{ disponible: false, raison: 'trop_court', message: 'Au moins 3 caractères.' }
{ disponible: false, raison: 'trop_long',  message: '30 caractères maximum.' }
{ disponible: false, raison: 'caracteres', message: 'Lettres sans accent, chiffres et « _ » uniquement.' }
{ disponible: false, raison: 'reserve',    message: 'Ce nom d''utilisateur est réservé.' }
{ disponible: false, raison: 'deja_pris',  message: 'Déjà pris par un autre citoyen.' }
```

### 3.8 `changer_username(p_nouveau_username TEXT)`

**Nouvelle — migration 006.** Applique le changement après confirmation de
l'utilisateur. Authentifié requis.

```js
const { data, error } = await supabase.rpc('changer_username', {
  p_nouveau_username: 'aline_4829'
})
```

Succès :
```js
{ success: true, ancien_username: 'citoyen_5921',
  nouveau_username: 'aline_4829', message: 'Nom d''utilisateur mis à jour.' }
```

Refus (HTTP 200, `success: false`) : mêmes `raison` et `message` que
`username_est_disponible`. **Ne jamais lever une exception** côté UI sur ce cas.

---

## 4. Format du nom d'utilisateur

| Règle | Valeur |
|---|---|
| Longueur | 3 à 30 caractères |
| Caractères autorisés | `a-z`, `0-9`, `_` |
| Minuscules | obligatoires (`Aline` → `aline`) |
| Accents | interdits (`Élodie` → `elodie`) |
| Unicité | oui, un par compte, garantie en base |
| Noms réservés | `admin`, `root`, `greenshot`, `support`, `aide`, `officiel`, `systeme`… (table `usernames_reserves`) |

**Génération automatique** (à l'inscription) : premier mot du prénom → accents
retirés (`unaccent`) → minuscules → caractères non alphanumériques supprimés →
suffixe de 4 chiffres aléatoires.

Exemples : `Aline N.` → `aline_4829`, `Aline Nzigire` → `aline_1627`,
`Élodie Kabange` → `elodie_7293`, prénom vide → `citoyen_8537`.

---

## 5. Parcours utilisateur de référence

1. **Inscription** — email + mot de passe + nom + téléphone.
   La base crée le profil et **génère** le username.
2. **Utilisateur connecté** — l'app appelle `obtenir_mon_profil()` et affiche
   le username généré.
3. **Changement de username** — l'app appelle `username_est_disponible()` pendant
   la saisie, puis `changer_username()` à la confirmation.
4. **Navigation** — autorisée sans email vérifié, sauf signalement et nettoyage.
5. **Vérification email** — le trigger `on_auth_user_updated` met à jour
   `profiles.email` et `profiles.email_verified`.
6. **Signalement** — photo compressée, GPS automatique (corrigeable), catégorie,
   ville, description. Statut initial `en_attente`, points crédités, première
   ligne d'historique écrite.
7. **Nettoyage** — photo « après », contrôle GPS ≤ 50 m. Sinon refusé avec la
   distance mesurée.
8. **Classement** — rang selon `score_signalement + score_nettoyage`, filtrable
   par ville.

---

## 6. Codes d'erreur à connaître

| Code | Signification | Action attendue côté UI |
|---|---|---|
| `42501` | RLS refusée | Souvent `email_verified = false` : proposer de renvoyer l'email de vérification |
| `23505` | Unicité violée | Ne devrait plus arriver pour le username (géré par `changer_username`) |
| `P0001` | Exception levée par une fonction (`RAISE EXCEPTION`) | `error.message` contient le message métier, l'afficher tel quel |

## 7. Ce qui est INTERDIT au frontend

- Utiliser la clé `service_role` (elle contourne **toutes** les politiques RLS)
- Écrire dans `score_signalement` / `score_nettoyage` (la base refuse)
- Écrire dans `statuts_historique` (la base refuse)
- Faire un `UPDATE` direct de `statut` sur `signalements` (la base refuse)
- Supprimer une ligne de `signalements` ou `profiles`
- Afficher une donnée de démonstration en production (`import.meta.env.DEV`)