## ADDED Requirements

### Requirement: Son du tirage
Pendant la rotation, le site SHALL jouer un « tic » à chaque séparation entre deux segments qui passe sous le pointeur, en suivant le ralentissement de la roue. Quand la roue s'arrête, une courte fanfare SHALL accompagner l'affichage du résultat. Les sons SHALL être générés par le navigateur, sans fichier ni service externe. Un bouton, visible sur tous les écrans, SHALL couper ou réactiver le son ; son libellé accessible SHALL indiquer l'action (« Couper le son » ou « Activer le son »). Le son SHALL être activé par défaut, et le choix SHALL être mémorisé dans le navigateur, sans être partagé. Une fois le son coupé, le site MUST NOT jouer aucun son. Si le navigateur ne peut pas jouer de son, la roue SHALL fonctionner normalement, en silence.

#### Scenario: Cliquetis pendant la rotation
- **GIVEN** une équipe de sept personnes et le son activé
- **WHEN** un utilisateur lance la roue
- **THEN** des tics rapprochés se font entendre au départ, de plus en plus espacés jusqu'à l'arrêt, puis la fanfare accompagne le résultat

#### Scenario: Son coupé
- **GIVEN** l'utilisateur a cliqué sur « Couper le son »
- **WHEN** il recharge la page puis lance la roue
- **THEN** le bouton propose « Activer le son » et aucun son n'est joué
