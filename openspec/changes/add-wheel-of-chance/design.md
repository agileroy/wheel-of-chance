# Conception

## Principe directeur

Faire le plus simple possible : aucune dépendance npm, aucune étape de build, un seul processus.

## Stack

- **Serveur** : Node.js 22+, module `node:http` uniquement. Il sert l'API JSON et les fichiers statiques.
- **Frontend** : HTML, CSS et JavaScript natifs (modules ES), sans framework. La roue est dessinée en SVG et animée par une transition CSS.
- **Stockage** : un fichier JSON (`data/db.json`), écrit de façon atomique (fichier temporaire puis renommage). Les écritures sont sérialisées dans le processus.
- **Tests** : `node:test`, sur l'API et sur la logique métier.
- **Déploiement** : `npm start`, ou l'image Docker fournie avec un volume pour `data/`.

### Pourquoi un fichier JSON plutôt qu'une base de données

Quelques équipes d'une dizaine de personnes et quelques écritures par jour : un fichier suffit largement. Ça évite toute dépendance native et toute installation de base. Si le besoin grossit, la couche `store` est isolée et pourra passer à SQLite sans toucher au reste.

Limite assumée : une seule instance du serveur à la fois.

## Modèle de données

```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "Produit",
      "deletedAt": null,
      "members": [
        { "id": "uuid", "name": "Julie", "withdrawn": false }
      ]
    }
  ]
}
```

- `deletedAt` non nul : l'équipe est dans la corbeille.
- `withdrawn` vrai : le membre est dans « Déjà passés » pour le cycle en cours.

## Règles métier

- **Normalisation des noms** : suppression des espaces en début et fin, espaces multiples réduits à un seul. Longueur de 1 à 50 caractères.
- **Comparaison** : insensible à la casse (`toLocaleLowerCase('fr')`). Les accents restent distincts (« Élodie » et « Elodie » sont deux prénoms).
- **Tirage** : fait côté serveur avec `crypto.randomInt` parmi les membres non retirés. Le client anime la roue jusqu'au résultat reçu. Deux tirages simultanés restent donc cohérents avec l'état enregistré.
- **Réinitialisation automatique** : dès qu'une équipe a des membres mais aucun membre en lice (après un retrait ou une suppression de membre), tous les membres reviennent dans la roue.
- **Garder** ne fait aucun appel serveur : le tirage ne modifie pas l'état.

## API

| Méthode | Chemin | Effet |
|---|---|---|
| GET | `/api/teams` | Équipes actives |
| GET | `/api/trash` | Équipes dans la corbeille |
| POST | `/api/teams` | Créer une équipe `{name}` |
| GET | `/api/teams/:id` | Détail d'une équipe |
| PATCH | `/api/teams/:id` | Renommer `{name}` |
| POST | `/api/teams/:id/trash` | Mettre à la corbeille |
| POST | `/api/teams/:id/restore` | Restaurer depuis la corbeille |
| DELETE | `/api/teams/:id` | Supprimer définitivement (équipe en corbeille uniquement) |
| POST | `/api/teams/:id/members` | Ajouter un membre `{name}` |
| PATCH | `/api/teams/:id/members/:mid` | Renommer un membre `{name}` |
| DELETE | `/api/teams/:id/members/:mid` | Supprimer un membre |
| POST | `/api/teams/:id/spin` | Tirer au sort, renvoie `{winnerId, team}` |
| POST | `/api/teams/:id/members/:mid/withdraw` | Retirer, renvoie `{cycleReset, team}` |
| POST | `/api/teams/:id/members/:mid/reinstate` | Rétablir |
| POST | `/api/teams/:id/reset` | Réinitialiser le cycle |

Erreurs : `400` donnée invalide, `404` introuvable, `409` nom déjà pris ou opération impossible dans cet état. Corps `{error: "message lisible"}`.

## Frontend

Routage par ancre : `#/` (équipes), `#/team/:id` (roue), `#/trash` (corbeille). Une équipe dans la corbeille n'est pas accessible en `#/team/:id`.
