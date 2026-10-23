# Qui anime ?

Roue de la chance pour désigner, équipe par équipe, qui anime la réunion.

- Plusieurs équipes, chacune avec sa roue et son état.
- Après un tirage : **Retirer** la personne pour le reste du tour, ou la **Garder** (si elle est absente, par exemple). Fermer la fenêtre revient à garder.
- Une personne retirée par erreur peut être **rétablie**.
- Quand tout le monde est passé, la roue repart automatiquement pour un tour complet. On peut aussi recommencer le tour à la main.
- Les équipes supprimées passent par une **corbeille**.

Pas de compte : toute personne qui a le lien peut lancer la roue et gérer les équipes.

## Démarrer

Prérequis : Node.js 22 ou plus. Aucune dépendance à installer.

```bash
npm start            # http://localhost:3000
npm run dev          # redémarre à chaque modification
npm test
```

Variables d'environnement :

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | Port d'écoute |
| `DATA_FILE` | `data/db.json` | Fichier où sont stockées les équipes |

## Docker

```bash
docker build -t wheel-of-chance .
docker run -d -p 3000:3000 -v wheel-data:/app/data wheel-of-chance
```

Le volume garde les équipes entre deux redémarrages. Une seule instance doit tourner à la fois, puisque les données sont dans un fichier.

## Organisation

```
src/store.js     logique métier et stockage dans le fichier JSON
src/server.js    API HTTP et fichiers statiques
public/          interface (HTML, CSS, JS sans build)
test/            tests node:test
openspec/        spécifications
```

Les spécifications fonctionnelles et les choix techniques sont dans `openspec/changes/add-wheel-of-chance/`.
