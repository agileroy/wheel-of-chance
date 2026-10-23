## ADDED Requirements

### Requirement: Publication automatique
Le site SHALL être publié sur GitHub Pages, à l'adresse https://vinchou59.github.io/wheel-of-chance/, à chaque push sur `main`. Les tests automatiques SHALL être lancés avant la publication, et la publication MUST NOT avoir lieu si un test échoue. Les tests SHALL aussi être lancés sur chaque pull request, sans publication. Les fichiers publiés SHALL être versionnés pour qu'une mise à jour ne serve pas d'anciens styles ou scripts en cache.

#### Scenario: Test en échec
- **GIVEN** un push sur `main` qui casse un test
- **WHEN** le workflow GitHub Actions s'exécute
- **THEN** le job de tests échoue et le site publié reste la version précédente

### Requirement: Interface et appareils
L'interface SHALL être en français. Elle SHALL être utilisable sur ordinateur et sur téléphone (largeur de 360 px et plus) sans défilement horizontal, en thème clair et en thème sombre. Le site MUST NOT afficher de publicité ni charger de traceur, et MUST NOT charger de police ou de ressource depuis un autre service que Firebase.

#### Scenario: Affichage sur téléphone
- **GIVEN** un téléphone de 390 px de large
- **WHEN** un utilisateur ouvre la roue d'une équipe de dix personnes
- **THEN** la roue, puis les listes « En lice » et « Déjà passés », s'affichent l'une sous l'autre sans défilement horizontal

### Requirement: Choix du thème clair ou sombre
Par défaut, le thème SHALL suivre le réglage du système. Un bouton, visible sur tous les écrans, SHALL basculer entre thème clair et thème sombre ; son libellé accessible SHALL indiquer le thème vers lequel il bascule (« Passer en thème sombre » ou « Passer en thème clair »). Le choix SHALL être mémorisé dans le navigateur et appliqué dès l'affichage de la page, sans clignotement du thème par défaut. Ce choix est propre à chaque navigateur et MUST NOT être partagé.

#### Scenario: Bascule vers le thème sombre
- **GIVEN** un système en thème clair et aucun choix mémorisé
- **WHEN** l'utilisateur clique sur le bouton de thème
- **THEN** la page passe en thème sombre et le bouton propose « Passer en thème clair »

### Requirement: Connexion au service temps réel
Le site SHALL se connecter anonymement à Firebase, sans compte, et n'utiliser que des connexions HTTPS (port 443). Si la connexion est perdue, la page SHALL afficher « Connexion perdue, reconnexion… » et reprendre automatiquement à son retour, sans recharger la page. Si une écriture est refusée, la page SHALL l'indiquer et garder l'état précédent.

#### Scenario: Coupure réseau
- **GIVEN** un utilisateur sur la roue d'une équipe
- **WHEN** sa connexion réseau est coupée puis rétablie
- **THEN** le message de connexion perdue s'affiche pendant la coupure, puis disparaît et la roue se met à jour

### Requirement: Règles de sécurité versionnées
Les règles de sécurité de la base Firebase SHALL être versionnées dans le dépôt (`database.rules.json`). Cet outil MUST n'écrire que sous `wheelOfChance`, et ses règles MUST NOT modifier celles des autres outils qui partagent la base (`room`, `skillMatrix`). Les règles MUST exiger une connexion anonyme pour lire ou écrire, valider la forme des données, protéger les réservations de noms, et protéger les équipes de la corbeille.

#### Scenario: Écriture hors de la branche
- **GIVEN** un navigateur connecté à la roue
- **WHEN** il tente d'écrire sous `wheelOfChance/autre`
- **THEN** la base refuse l'écriture
