/* Règles affichées dans l'app — résumé de Wikipédia « Blackjack (jeu) » (sources dans RULES.md). */
export const RULES_HTML = `
<div class="rule-h">Le but</div>
<div class="rule-p">Battre le croupier : s'approcher le plus possible de <b>21</b> sans le dépasser. Les figures valent 10, l'as 1 ou 11.</div>

<div class="rule-h">Paiements</div>
<table class="bonus-tbl">
  <tr><td>Main gagnante</td><td>1 pour 1</td></tr>
  <tr><td>Blackjack (as + figure ou 10 en 2 cartes)</td><td>3 pour 2</td></tr>
  <tr><td>Égalité avec le croupier (« push »)</td><td>mise rendue</td></tr>
  <tr><td>Abandon (si autorisé)</td><td>moitié de la mise perdue</td></tr>
  <tr><td>Assurance (croupier montre un as)</td><td>2 pour 1 s'il a un blackjack</td></tr>
</table>
<div class="rule-p rule-ex">Certaines tables paient le blackjack 6 pour 5 : réglable dans les options de la partie.</div>

<div class="rule-h">Doubler</div>
<div class="rule-p">Après les deux premières cartes, le joueur double sa mise et reçoit une seule carte de plus.</div>

<div class="rule-h">Séparer (split)</div>
<div class="rule-p">Avec deux cartes de même valeur, le joueur en fait deux mains, avec une mise égale sur la seconde. Un as et une figure obtenus après un split font 21, pas un blackjack.</div>

<div class="rule-h">Le croupier</div>
<div class="rule-p">Il tire jusqu'à 16 et s'arrête à 17. La règle la plus courante est de rester sur un 17 « souple » (avec un as compté 11).</div>

<div class="note">Règles d'après Wikipédia. Ardoise ne fait que compter les jetons : aucun argent réel n'est en jeu.</div>
`;
