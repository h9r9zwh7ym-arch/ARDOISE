/* Règles affichées dans l'app — résumé de Wikipédia « Menteur (jeu) » et regles-de-jeux.com (sources dans RULES.md). */
export const RULES_HTML = `
<div class="rule-h">Le but</div>
<div class="rule-p">Être le premier à se débarrasser de toutes ses cartes, en bluffant si besoin.</div>

<div class="rule-h">Mise en place</div>
<div class="rule-p">À partir de 2 joueurs, avec 32 ou 52 cartes (on peut doubler le jeu si on est nombreux). Les cartes sont distribuées une à une, pour que chacun en ait autant ; celles qui restent sont mises de côté.</div>

<div class="rule-h">Un tour</div>
<div class="rule-p">Le donneur pose une carte face visible et annonce sa couleur. Ensuite, chacun à son tour pose une carte <b>face cachée</b> en annonçant la couleur demandée. <b>L'annonce peut être fausse.</b></div>

<div class="rule-h">« Menteur ! »</div>
<div class="rule-p">Avant que la carte soit recouverte, n'importe qui peut crier « Menteur ! ». On retourne la carte :</div>
<div class="rule-p">— si le joueur a menti, <b>il ramasse tout le tas</b> ;<br>— s'il disait vrai, c'est <b>celui qui a crié</b> qui ramasse le tas.</div>
<div class="rule-p">Celui qui a ramassé recommence, sans rejouer la dernière couleur. Une carte recouverte ne peut plus être contestée.</div>

<div class="rule-h">Fin de manche</div>
<div class="rule-p">Le premier qui n'a plus de cartes gagne la manche. Dans l'app, les cartes restées en main sont des points de pénalité : le plus petit total gagne la partie.</div>

<div class="note">Jeu traditionnel, sans éditeur officiel : règles d'après Wikipédia et regles-de-jeux.com. Il existe beaucoup de variantes : à vous de choisir la vôtre.</div>
`;
