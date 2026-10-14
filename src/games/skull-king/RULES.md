# Skull King — règles de score retenues

Édition actuelle de **Grandpa Beck's Games** (livret © 2012, 2021, 2024). Le module de calcul
est `scoring.js` et les tests sont dans `tests/skull-king.test.js`.

## Sources

- Livret officiel en anglais (PDF, 20 pages) : <https://heyzine.com/flip-book/46b5bd7166.html>.
  On y accède depuis la page de l'éditeur <https://www.grandpabecksgames.com/pages/skull-king>.
- « The Rascal's Scoring » (PDF officiel) :
  <https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Rascal_Scoring.pdf>
- FAQ de l'éditeur : elle se trouve sur la même page <https://www.grandpabecksgames.com/pages/skull-king>.

## Paquet

Le jeu de base compte **70 cartes** : 4 couleurs de 1 à 14 (vert, violet, jaune, et noir qui
est l'atout), 5 Pirates, 1 Tigresse, 1 Skull King, 2 Sirènes et 5 Fuites.

Les cartes avancées sont **optionnelles** : 2 Butins, 1 Kraken et 1 Baleine blanche.
À 8 joueurs, on distribue 8 cartes au maximum. En règle générale, chaque joueur reçoit le même
nombre de cartes. L'app calcule ce plafond automatiquement à partir de la taille du paquet.

## Décompte « Skull King » (par défaut)

| Situation | Points |
|---|---|
| Mise ≥ 1, exacte | +20 par pli misé |
| Mise ≥ 1, ratée | −10 par pli d'écart |
| Mise 0, réussie | +10 × nombre de cartes distribuées |
| Mise 0, ratée | −10 × nombre de cartes distribuées |

## Bonus (« earned only if the player gets their bid »)

| Bonus | Points |
|---|---|
| 14 de couleur (vert, violet, jaune) remporté | +10 chacun |
| 14 noir remporté | +20 |
| Sirène capturée par un Pirate | +20 chacune |
| Pirate capturé par le Skull King | +30 chacun |
| Skull King capturé par une Sirène | +40 |
| Alliance Butin, si **les deux** alliés réussissent leur mise | +20 chacun |

Un 14 rapporte son bonus quel que soit le joueur qui l'a posé. L'ordre de jeu dans le pli
n'a pas d'importance.

Si un Pirate, le Skull King et une Sirène sont dans le même pli, c'est la Sirène qui gagne.
Le seul bonus est alors celui de la Sirène qui capture le Skull King.

Une Tigresse jouée comme Fuite ne rapporte aucun bonus (FAQ).

## Décompte « Rascal » (PDF officiel)

À chaque manche, le potentiel de points est de 10 × le nombre de cartes distribuées.

- **Coup direct** (mise exacte) : tout le potentiel et tous les bonus.
- **Frappe à revers** (écart de 1) : la moitié du potentiel et la moitié des bonus.
- **Échec cuisant** (écart de 2 ou plus) : 0 point.

Le Butin et le pari de Rascal exigent quand même une mise exacte (FAQ).

## Pouvoirs des pirates

- **Rascal of Roatan** : on peut parier 10 ou 20 points. Le pari est gagné si la mise est
  exacte et perdu sinon.
- **Harry le Géant** : il peut modifier sa mise de +1 ou −1. Dans l'app, il suffit de modifier
  la mise avant de valider les plis, ou après coup avec « Modifier la manche ».

## Kraken, Baleine blanche et plis détruits (bug 1)

- **Kraken** : le pli est détruit. Personne ne le remporte.
- **Baleine blanche** : le plus grand numéro gagne. Si seules des cartes spéciales ont été
  jouées, le pli est défaussé.
- **Les deux dans le même pli** : la carte jouée en second décide de l'effet.

Un pli peut donc ne revenir à personne. La saisie accepte alors « plis remportés + plis
détruits = cartes distribuées ». On peut détruire au plus 1 pli par carte activée, donc 2 au
maximum.

## À 2 joueurs (Barbe Grise)

On distribue 3 mains. Le fantôme ne mise pas et ne marque pas. Il remporte les plis que
personne d'autre ne prend, donc la saisie accepte un total de plis inférieur au nombre de
cartes. Il n'y a **pas de Butin** à 2 joueurs.

## Égalité

Le livret dit : « In the event of a tie, play another round until the tie is broken. »
L'app affiche l'égalité. Une manche supplémentaire n'est pas encore proposée.

## Points tranchés

1. **Tigresse jouée comme Pirate, puis capturée par le Skull King : +30** (décision de la
   table, 14/10/2026). Le livret dit « 30 points for each Pirate taken by the Skull King » et
   précise que le Skull King bat « Pirates (including the Tigress when played as a Pirate) ».
   L'app accepte donc jusqu'à 6 captures (5 Pirates + la Tigresse).
2. **Boulet de canon / Chevrotine (variante Rascal)**. Après les mises, chacun révèle en même
   temps son choix :
   - **Chevrotine** (main ouverte) : décompte Rascal normal.
   - **Boulet de canon** (poing fermé) : 15 points par carte distribuée si la mise est exacte,
     0 sinon, même avec un seul pli d'écart. « You must get your bid correct to earn any bonus
     points » : bonus complets si la mise est exacte, aucun sinon.
   - Le pari de Rascal of Roatan n'est pas modifié par le Boulet de canon (FAQ de l'éditeur).

   C'est ce que faisait déjà l'app d'origine. Sources :
   [transcription du livret 2021 (RulesPal)](https://www.rulespal.com/skull-king/rulebook),
   [The Board Game Family](https://www.theboardgamefamily.com/2021/09/the-new-skull-king/),
   [FAQ de l'éditeur](https://www.grandpabecksgames.com/pages/skull-king).

## Point encore ouvert

- **Taille de la main avec les cartes avancées** : à 8 joueurs avec les 4 cartes avancées
  (74 cartes), l'app permet 9 cartes. Le livret ne parle que du paquet de base (8 cartes).
