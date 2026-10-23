## ADDED Requirements

### Requirement: Créer une équipe
Le site SHALL permettre de créer une équipe avec un nom de 1 à 50 caractères. Les espaces en début et fin SHALL être retirés et les espaces multiples réduits à un seul. Le nom MUST être unique sans tenir compte de la casse ni des espaces en trop, y compris parmi les équipes dans la corbeille ; les accents restent distincts. Cette unicité MUST être appliquée aussi par les règles de sécurité du service temps réel, pas seulement par l'interface. Après la création, la roue de la nouvelle équipe SHALL s'afficher, vide.

#### Scenario: Création réussie
- **WHEN** un utilisateur crée l'équipe « Produit »
- **THEN** la roue vide de l'équipe « Produit » s'affiche, et l'équipe apparaît dans la liste des équipes de tous les navigateurs

#### Scenario: Nom déjà utilisé
- **GIVEN** une équipe « Produit » existe
- **WHEN** un utilisateur crée l'équipe « produit  »
- **THEN** la création est refusée avec le message « Une équipe « Produit » existe déjà. »

#### Scenario: Nom réservé par une équipe de la corbeille
- **GIVEN** l'équipe « Produit » est dans la corbeille
- **WHEN** un utilisateur crée l'équipe « Produit »
- **THEN** la création est refusée avec le message « Une équipe « Produit » existe déjà dans la corbeille. »

#### Scenario: Création simultanée
- **GIVEN** Julie et Marc sur deux navigateurs différents
- **WHEN** ils créent tous les deux l'équipe « Tech » au même instant
- **THEN** une seule équipe « Tech » existe, et l'autre création est refusée par la base

#### Scenario: Nom vide
- **WHEN** un utilisateur crée une équipe dont le nom ne contient que des espaces
- **THEN** la création est refusée avec le message « Le nom de l'équipe est obligatoire. »

### Requirement: Renommer une équipe
Le site SHALL permettre de renommer une équipe active, avec les mêmes règles de longueur et d'unicité qu'à la création. Changer seulement la casse SHALL être permis. Le renommage MUST conserver les membres et l'état de la roue, et SHALL libérer l'ancien nom.

#### Scenario: Renommage réussi
- **GIVEN** l'équipe « Produit », où Marc est déjà passé
- **WHEN** un utilisateur la renomme en « Produit & Design »
- **THEN** l'équipe porte le nouveau nom, Marc est toujours dans « Déjà passés », et le nom « Produit » redevient disponible

### Requirement: Lister les équipes
La page d'accueil SHALL lister les équipes actives par ordre alphabétique, avec leur nombre de personnes, et permettre d'ouvrir la roue de chacune. La liste SHALL se mettre à jour sans recharger la page quand un autre navigateur crée, renomme ou supprime une équipe. Sans équipe, la page SHALL inviter à créer la première.

#### Scenario: Accès à une roue
- **WHEN** un utilisateur sélectionne l'équipe « Produit » dans la liste
- **THEN** la roue de l'équipe « Produit » s'affiche avec ses membres

### Requirement: Corbeille des équipes
Mettre une équipe à la corbeille SHALL demander une confirmation. Une équipe dans la corbeille SHALL disparaître de la liste des équipes et ne plus être accessible par sa roue, mais garder ses membres et l'état de sa roue. La corbeille SHALL lister ces équipes, des plus récemment supprimées aux plus anciennes, avec la date de suppression. Une équipe de la corbeille SHALL pouvoir être restaurée à l'identique, ou supprimée définitivement après confirmation. Les règles de sécurité MUST refuser toute modification du nom ou des membres d'une équipe dans la corbeille, et MUST refuser la suppression définitive d'une équipe qui n'est pas dans la corbeille.

#### Scenario: Mise à la corbeille
- **WHEN** un utilisateur met l'équipe « Produit » à la corbeille et confirme
- **THEN** l'équipe disparaît de la liste des équipes et apparaît dans la corbeille

#### Scenario: Restauration
- **GIVEN** l'équipe « Produit » est dans la corbeille, avec Julie déjà passée
- **WHEN** un utilisateur la restaure
- **THEN** elle réapparaît dans la liste des équipes, avec Julie toujours dans « Déjà passés »

#### Scenario: Suppression définitive
- **GIVEN** l'équipe « Produit » est dans la corbeille
- **WHEN** un utilisateur la supprime définitivement et confirme
- **THEN** l'équipe et ses membres sont effacés, et le nom « Produit » redevient disponible

#### Scenario: Lien vers une équipe dans la corbeille
- **GIVEN** l'équipe « Produit » est dans la corbeille
- **WHEN** un utilisateur ouvre le lien de sa roue
- **THEN** la page indique que l'équipe est introuvable ou dans la corbeille, avec un lien vers la liste des équipes
