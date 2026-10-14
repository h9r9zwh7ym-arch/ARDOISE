/* Règles affichées dans l'app — résumé de jassverzeichnis.ch et schieber.ch (sources dans RULES.md). */
export const RULES_HTML = `
<div class="rule-h">Valeur des cartes</div>
<div class="rule-p">Chaque jeu vaut <b>157 points</b> : 152 points de cartes et 5 pour le dernier pli. Faire les 9 plis, c'est un <b>Match</b> : 257 points.</div>
<table class="bonus-tbl">
  <tr><td>Valet d'atout (Puur)</td><td>20</td></tr>
  <tr><td>9 d'atout (Nell)</td><td>14</td></tr>
  <tr><td>As</td><td>11</td></tr>
  <tr><td>10</td><td>10</td></tr>
  <tr><td>Roi</td><td>4</td></tr>
  <tr><td>Dame</td><td>3</td></tr>
  <tr><td>Valet (hors atout)</td><td>2</td></tr>
</table>
<div class="rule-p rule-ex">Obenabe : pas d'atout, l'as est le plus fort et chaque 8 vaut 8. Undenufe : le 6 est le plus fort et vaut 11, l'as vaut 0, chaque 8 vaut 8.</div>

<div class="rule-h">Schieber</div>
<div class="rule-p">À 4 joueurs, en deux équipes : les partenaires sont assis face à face. Celui qui choisit l'atout peut « chibrer » (pousser) et laisser son partenaire choisir. La première équipe qui atteint l'objectif gagne.</div>
<div class="rule-p"><b>Multiplicateurs</b> (à convenir avant de jouer) : ♦ Carreau et ♥ Cœur ×1, ♠ Pique et ♣ Trèfle ×2, Obenabe et Undenufe ×3. Les Weis sont multipliés aussi.</div>

<div class="rule-h">Weis</div>
<table class="bonus-tbl">
  <tr><td>3 cartes qui se suivent</td><td>20</td></tr>
  <tr><td>4 cartes qui se suivent</td><td>50</td></tr>
  <tr><td>5 cartes qui se suivent</td><td>100</td></tr>
  <tr><td>6, 7, 8, 9 cartes qui se suivent</td><td>150, 200, 250, 300</td></tr>
  <tr><td>4 Valets</td><td>200</td></tr>
  <tr><td>4 Neuf</td><td>150</td></tr>
  <tr><td>4 cartes d'une autre valeur</td><td>100</td></tr>
</table>
<div class="rule-p">Seule l'équipe qui a <b>le meilleur Weis</b> inscrit ses Weis (tous ceux de l'équipe). Une suite bat un carré, puis la carte la plus haute, puis celui qui a annoncé en premier.</div>

<div class="rule-h">Stöck</div>
<div class="rule-p">Le roi et la dame d'atout dans la même main valent <b>20 points</b>, annoncés quand la deuxième carte est jouée. Pas de Stöck en Obenabe ni en Undenufe.</div>
<div class="note"><b>Arrivée : « Stöck – Weis – Stich ».</b> Si les deux équipes atteignent l'objectif dans le même jeu, on compte d'abord les Stöck, puis les Weis, puis les plis : la première équipe qui atteint l'objectif gagne.</div>

<div class="rule-h">Coiffeur</div>
<div class="rule-p">Chaque équipe doit jouer chaque atout une fois. Chaque ligne a son facteur : ♠ ×1, ♣ ×2, ♦ ×3, ♥ ×4, Obenabe ×5, Undenufe ×6, puis deux Jokers ×7 et ×8 (au choix : couleur, Obenabe ou Undenufe).</div>
<div class="rule-p">On n'inscrit que les <b>dizaines</b> des points faits par l'équipe qui a annoncé (52 → 5, Match 257 → 25), multipliées par le facteur. Pas de Weis ni de Stöck. La partie se termine quand les deux équipes ont rempli toutes leurs lignes ; le plus grand total gagne.</div>

<div class="rule-h">Différenzler</div>
<div class="rule-p">De 3 à 5 joueurs, chacun pour soi (à 5, on retire un 6). L'atout est donné par la dernière carte distribuée. Avant de jouer, chacun annonce combien de points il pense faire (0 à 157).</div>
<div class="rule-p">L'<b>écart</b> entre l'annonce et les points faits est une pénalité. Pas de Weis. Après 12 jeux, le plus petit total gagne.</div>

<div class="rule-h">Jass à deux (Schieber zu Zweit)</div>
<div class="rule-p">Chaque joueur reçoit <b>deux paquets de 9 cartes</b> face cachée et en choisit un. L'adversaire du donneur annonce l'atout. On joue les 9 premières cartes, puis on prend le second paquet ; celui qui a fait le 9ᵉ pli entame. Chacun compte ses points (157 par jeu). Objectif : 500 ou 1000 points. Weis en variante.</div>

<div class="rule-h">Jeu de cartes</div>
<div class="rule-p">Le Jass se joue avec <b>36 cartes</b> (6 à As). Avec un jeu de 54 cartes, retirez les 2, 3, 4, 5 et les deux jokers.</div>

<div class="note">Règles résumées d'après jassverzeichnis.ch et schieber.ch. Application de score non officielle.</div>
`;
