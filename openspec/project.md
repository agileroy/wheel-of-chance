# Contexte du projet

## Objectif
Roue de la chance pour désigner, équipe par équipe, qui anime la réunion.

## Stack
- Node.js 22+, sans aucune dépendance npm (`node:http`, `node:test`, `node:crypto`).
- Frontend HTML, CSS et JavaScript natifs, sans build.
- Stockage dans un fichier JSON (`data/db.json`).

## Conventions
- Interface et messages en français.
- Specs OpenSpec rédigées en français.
- Logique métier dans `src/store.js`, testée indépendamment du serveur HTTP.
- `npm test` doit passer avant toute fusion.
