/* Règles affichées dans l'app — résumé de la notice officielle Magilano (sources dans RULES.md). */
export const RULES_HTML = `
<div class="rule-h">Le but</div>
<div class="rule-p">Skyjo se joue en plusieurs manches. La partie s'arrête dès qu'un joueur atteint <b>100 points ou plus</b> : le joueur qui a <b>le moins de points</b> gagne. Il faut donc se débarrasser des cartes les plus fortes.</div>

<div class="rule-h">Mise en place</div>
<div class="rule-p">Chaque joueur reçoit 12 cartes face cachée et les dispose en <b>4 colonnes de 3 cartes</b>, puis en retourne deux. Une carte est retournée pour former la défausse, le reste forme la pioche.</div>
<div class="rule-p">À la première manche, le joueur dont les deux cartes visibles font le plus gros total commence. Ensuite, c'est celui qui a fermé la manche précédente.</div>

<div class="rule-h">Un tour de jeu</div>
<div class="rule-p">Prenez la carte visible de la défausse, ou la carte du dessus de la pioche.</div>
<div class="rule-p"><b>Carte de la défausse :</b> échangez-la obligatoirement contre une carte de votre grille (visible ou cachée), et posez la carte remplacée face visible sur la défausse.</div>
<div class="rule-p"><b>Carte de la pioche :</b> regardez-la, puis gardez-la (échange comme ci-dessus) ou défaussez-la et retournez une de vos cartes cachées.</div>

<div class="rule-h">Colonne de trois cartes identiques</div>
<div class="rule-p">Trois cartes identiques et visibles dans une même <b>colonne</b> sont aussitôt défaussées : elles ne comptent plus. La règle vaut aussi au dernier tour, quand on retourne les cartes restantes. Elle ne s'applique pas aux lignes.</div>

<div class="rule-h">Fin de manche</div>
<div class="rule-p">Dès qu'un joueur a retourné toutes ses cartes, <b>chacun des autres joue encore un tour</b>. On retourne ensuite les cartes cachées et chaque joueur additionne les cartes de sa grille.</div>

<div class="rule-h" id="r-double">Règle du doublement</div>
<div class="rule-p">Le joueur qui a fermé la manche doit avoir <b>le plus petit score</b> de la manche. Si un autre joueur a <b>autant ou moins</b>, les points de sa manche sont <b>doublés</b>.</div>
<div class="note"><b>Attention :</b> le doublement ne s'applique qu'aux points positifs, jamais à un score nul ou négatif.</div>
<div class="rule-p rule-ex">Exemple : Alice ferme la manche avec 10 points, Bruno a 24 et Chloé 10. Alice n'a pas le plus petit score : ses points sont doublés, elle marque 20.</div>

<div class="rule-h">Skyjo Action</div>
<div class="rule-p">Mêmes manches, même fin de partie à 100 points et même doublement. Au décompte :</div>
<table class="bonus-tbl">
  <tr><td>Carte numérotée</td><td>sa valeur</td></tr>
  <tr><td>Carte étoile</td><td>0</td></tr>
  <tr><td>Carte action restée dans la grille</td><td>10 chacune</td></tr>
  <tr><td>Colonne de 3 étoiles défaussée</td><td>−10</td></tr>
  <tr><td>Ligne de 4 étoiles défaussée</td><td>−15</td></tr>
</table>
<div class="rule-p">Une colonne ou une ligne <b>complète</b> de cartes numérotées identiques (3 ou 4) est défaussée. Les étoiles peuvent compléter une série.</div>

<div class="note">Règles du jeu <b>Skyjo</b> et <b>Skyjo Action</b> — Magilano. Application de score non officielle.</div>
`;
