/* Règles affichées dans l'app — résumé de Wikipédia « Trou du cul (jeu) » et regles-de-jeux.com (sources dans RULES.md). */
export const RULES_HTML = `
<div class="rule-h">Le but</div>
<div class="rule-p">Se débarrasser de toutes ses cartes le premier. L'ordre d'arrivée donne les rôles de la manche suivante.</div>

<div class="rule-h">Ordre des cartes</div>
<div class="rule-p">Du plus faible au plus fort : 3, 4, 5, 6, 7, 8, 9, 10, Valet, Dame, Roi, As, <b>2</b> (le joker, s'il est utilisé, est au-dessus du 2).</div>

<div class="rule-h">Un tour</div>
<div class="rule-p">Le premier joueur pose une carte, une paire, un brelan ou un carré. Chacun doit poser autant de cartes, d'une valeur plus forte, ou passer. Quand tout le monde passe, le dernier à avoir joué ramasse le pli et recommence.</div>

<div class="rule-h">Les rôles</div>
<table class="bonus-tbl">
  <tr><td>1er sorti</td><td>Président</td></tr>
  <tr><td>2e sorti (dès 4 joueurs)</td><td>Vice-président</td></tr>
  <tr><td>Au milieu (dès 5 joueurs)</td><td>Neutre</td></tr>
  <tr><td>Avant-dernier (dès 4 joueurs)</td><td>Vice-trou du cul</td></tr>
  <tr><td>Dernier</td><td>Trou du cul</td></tr>
</table>

<div class="rule-h">Échanges de cartes</div>
<div class="rule-p">Au début de chaque manche, sauf la première : le <b>Trou du cul</b> donne ses <b>2 meilleures cartes</b> au Président, qui lui rend 2 cartes de son choix. Le <b>Vice-trou du cul</b> donne sa <b>meilleure carte</b> au Vice-président, qui lui en rend une. Le Neutre n'échange rien. Le Trou du cul distribue.</div>

<div class="rule-h">Points</div>
<div class="rule-p">À chaque manche, le Président marque <b>n−1 points</b> (n = nombre de joueurs), le suivant un de moins, et ainsi de suite jusqu'au Trou du cul qui marque 0. Le plus grand total gagne.</div>

<div class="rule-h">Variantes</div>
<div class="rule-p"><b>Révolution :</b> un carré inverse l'ordre des cartes (le 3 devient la plus forte) jusqu'à la fin de la manche ; un autre carré le rétablit.</div>
<div class="rule-p"><b>Le 2 bat tout :</b> un 2 seul bat n'importe quelle combinaison et fait rejouer.</div>
<div class="rule-p"><b>Interdit de finir par un 2 :</b> celui qui pose sa dernière carte sur un 2 devient Trou du cul.</div>
<div class="rule-p"><b>Bombes :</b> un carré bat n'importe quelle combinaison, même un 2.</div>
<div class="rule-p"><b>Passage de tour :</b> poser la même valeur que le joueur précédent fait sauter le suivant.</div>
<div class="rule-p"><b>Putsch :</b> avant l'échange, le Trou du cul peut refuser de donner ses cartes. S'il finit Président, il marque n points ; sinon il perd 1 point.</div>

<div class="note">Jeu traditionnel, sans éditeur officiel : règles d'après Wikipédia et regles-de-jeux.com. Les variantes se décident avant de jouer.</div>
`;
