## MODIFIED Requirements

### Requirement: Renommer un membre
Un pictogramme crayon, à côté de chaque prénom, SHALL permettre de corriger ce prénom, avec les mêmes règles de longueur et d'unicité. Le pictogramme SHALL avoir le libellé accessible « Renommer <prénom> » et l'infobulle « Renommer ». L'infobulle SHALL s'afficher dès le survol de la souris ou le focus clavier, sans délai. Le membre MUST garder son état dans le tour en cours.

#### Scenario: Correction d'une faute de frappe
- **GIVEN** « Jluie » est déjà passée dans le tour en cours
- **WHEN** un utilisateur la renomme en « Julie »
- **THEN** « Julie » reste dans « Déjà passés » jusqu'à la fin du tour

### Requirement: Supprimer un membre
Un pictogramme poubelle, à côté de chaque prénom, SHALL permettre de supprimer ce membre de l'équipe, après confirmation. Le pictogramme SHALL avoir le libellé accessible « Supprimer <prénom> de l'équipe » et l'infobulle « Supprimer de l'équipe ». L'infobulle SHALL s'afficher dès le survol de la souris ou le focus clavier, sans délai. Le membre SHALL disparaître de la roue et de la liste « Déjà passés », et son prénom SHALL redevenir disponible dans l'équipe. Si la suppression laisse des membres mais plus personne en lice, un nouveau tour SHALL commencer comme décrit dans « Fin de tour ».

#### Scenario: Départ d'un membre
- **WHEN** un utilisateur supprime « Marc » de l'équipe « Produit » et confirme
- **THEN** « Marc » n'apparaît plus ni dans la roue ni dans « Déjà passés »
