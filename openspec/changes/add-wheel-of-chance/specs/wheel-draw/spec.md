## ADDED Requirements

### Requirement: Affichage de la roue
La roue d'une équipe DOIT afficher un segment par membre encore en lice dans le cycle en cours. Les membres retirés DOIVENT rester visibles à côté de la roue, dans une liste « Déjà passés ».

#### Scenario: Roue avec des membres retirés
- **GIVEN** l'équipe compte Julie, Marc et Sami, et Marc a été retiré
- **WHEN** un utilisateur ouvre la roue de l'équipe
- **THEN** la roue affiche Julie et Sami, et la liste « Déjà passés » affiche Marc

#### Scenario: Équipe sans membre
- **GIVEN** l'équipe n'a aucun membre
- **WHEN** un utilisateur ouvre la roue
- **THEN** le bouton de lancement est désactivé et l'utilisateur est invité à ajouter des membres

### Requirement: Lancer la roue
Le lancement DOIT tirer au hasard, de manière uniforme, une personne parmi les membres en lice selon l'état enregistré sur le serveur au moment du tirage. La roue DOIT ensuite s'animer et s'arrêter sur la personne tirée, puis afficher son prénom.

#### Scenario: Tirage
- **WHEN** un utilisateur lance la roue de l'équipe « Produit »
- **THEN** la roue tourne, s'arrête sur un membre en lice, et son prénom est mis en évidence

#### Scenario: État modifié par quelqu'un d'autre
- **GIVEN** un autre utilisateur a retiré Marc depuis que la page a été chargée
- **WHEN** un utilisateur lance la roue
- **THEN** Marc ne peut pas être tiré, et la roue affichée est mise à jour avec l'état du serveur

#### Scenario: Un seul membre en lice
- **GIVEN** seule Julie est encore en lice
- **WHEN** un utilisateur lance la roue
- **THEN** Julie est désignée

### Requirement: Garder ou retirer la personne désignée
Après un tirage, le système DOIT proposer deux choix : « Garder » laisse la personne dans la roue ; « Retirer » la place dans la liste « Déjà passés » pour la suite du cycle. Fermer la fenêtre sans choisir DOIT valoir « Garder ».

#### Scenario: Garder (personne absente)
- **GIVEN** la roue a désigné Julie, qui est absente
- **WHEN** l'utilisateur choisit « Garder »
- **THEN** Julie reste dans la roue et l'utilisateur peut relancer

#### Scenario: Retirer
- **GIVEN** la roue a désigné Julie
- **WHEN** l'utilisateur choisit « Retirer »
- **THEN** Julie n'apparaît plus dans la roue et apparaît dans « Déjà passés »

#### Scenario: Fermeture sans choix
- **GIVEN** la roue a désigné Julie
- **WHEN** l'utilisateur ferme la fenêtre de résultat sans choisir
- **THEN** Julie reste dans la roue

### Requirement: Rétablir une personne retirée
Le système DOIT permettre de remettre dans la roue n'importe quelle personne de la liste « Déjà passés », par exemple après une erreur.

#### Scenario: Retrait par erreur
- **GIVEN** Julie a été retirée par erreur
- **WHEN** un utilisateur la rétablit depuis la liste « Déjà passés »
- **THEN** Julie réapparaît dans la roue

### Requirement: Réinitialisation du cycle
Quand le dernier membre en lice est retiré, le cycle DOIT se réinitialiser automatiquement : tous les membres reviennent dans la roue et l'utilisateur en est informé. Le système DOIT aussi permettre une réinitialisation manuelle, après confirmation.

#### Scenario: Réinitialisation automatique
- **GIVEN** seule Julie est encore en lice
- **WHEN** Julie est désignée et l'utilisateur choisit « Retirer »
- **THEN** tous les membres de l'équipe reviennent dans la roue, la liste « Déjà passés » est vide, et un message indique qu'un nouveau tour commence

#### Scenario: Réinitialisation manuelle
- **GIVEN** Marc et Sami ont été retirés
- **WHEN** un utilisateur demande la réinitialisation et confirme
- **THEN** tous les membres reviennent dans la roue
