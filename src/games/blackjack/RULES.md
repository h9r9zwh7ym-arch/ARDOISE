# Blackjack — règles retenues

Source : Wikipédia, « Blackjack (jeu) » : <https://fr.wikipedia.org/wiki/Blackjack_(jeu)>.
Les règles varient selon les casinos : l'app propose les variantes de table qui changent les
paiements.

## Dans l'app

Ardoise suit les **jetons** de chaque joueur face au croupier. Le croupier n'est pas un joueur
de l'app. Chaque joueur part avec le même nombre de jetons (100, 500 ou 1000). Une manche se
saisit en deux étapes, comme à la table :

1. **Mises**, avant la distribution : un compteur par joueur (de 5 en 5), avec des montants
   rapides 10, 25, 50, 100 et « Passe ». Les mises de la manche précédente sont reprises.
2. **Résultats**, une fois la main jouée : 4 gros boutons par joueur (Perdu, Égalité, Gagné,
   Blackjack), qui affichent **ce que le joueur gagne ou perd avant même de toucher**. « Plus
   d'options » ouvre les cas rares : mise doublée, séparer (split), assurance. Abandon apparaît
   s'il est autorisé.

| Règle | Paiement retenu | Source |
|---|---|---|
| Main gagnante | +1 × la mise (×2 si doublée) | Wikipédia : « gagnent une fois leur mise » |
| Blackjack | +1,5 × la mise (3:2), ou +1,2 × la mise (6:5) selon la table | Wikipédia : « 3 pour 2 ». Le 6:5 est une variante de table courante, non citée par Wikipédia. |
| Égalité | 0 | Wikipédia : « récupèrent simplement leur mise » |
| Main perdue | −1 × la mise (×2 si doublée) | |
| Abandon (option) | −0,5 × la mise | Wikipédia : « perdre la moitié de sa mise » |
| Assurance (option) | Mise = la moitié de la mise de la 1re main ; +2 × l'assurance si le croupier a un blackjack, sinon perdue | Wikipédia : le joueur « reçoit le double de son assurance » |

**Fin de partie** : quand vous voulez, avec « Terminer la partie ». Celui qui a le plus de jetons
gagne.

## À valider

1. Les jetons de départ (1000 par défaut) et la mise par défaut (10).
2. Faut-il permettre de « racheter » des jetons quand un joueur est à court ? Pour l'instant, le
   total peut devenir négatif.
