/* Règles affichées dans l'app (résumé fidèle du livret officiel — sources dans RULES.md). */
export const RULES_HTML=`
<div class="rule-h">🎯 Le but</div>
<div class="rule-p">Skull King est un jeu de plis dans lequel vous pariez sur le <b>nombre exact de plis</b> que vous pensez réaliser à chaque manche. Le pirate avec le score le plus élevé à la fin de la partie remporte la victoire et le titre de <b>Capitaine des Sept Mers</b>.</div>

<div class="rule-h">🃏 Distribution</div>
<div class="rule-p">Skull King se joue en 10 manches. Une carte est distribuée à chaque joueur à la première manche, deux à la deuxième, et ainsi de suite jusqu'à 10 cartes à la dixième. Toutes les cartes — y compris celles jouées précédemment — sont mélangées à chaque nouvelle manche.</div>
<div class="note"><b>8 joueurs :</b> le paquet ne permet de distribuer que 8 cartes au maximum ; aux manches 9 et 10, distribuez 8 cartes à chacun. Le principe vaut pour tout nombre de joueurs : chacun reçoit le même nombre de cartes. L'application ajuste ce nombre automatiquement.</div>

<div class="rule-h">🤜 Parier</div>
<div class="rule-p">Après avoir pris connaissance de vos cartes, estimez le nombre exact de plis que vous pensez pouvoir remporter. Une fois que tout le monde est prêt, frappez trois fois du poing sur la table en criant à l'unisson « <b>Yo-ho-ho !</b> ». Au troisième coup, tendez chacun un nombre de doigts égal à votre mise, ou un poing fermé si vous misez sur zéro.</div>
<div class="rule-p">Vous misez sur plus de 5 ? Annoncez votre mise à haute voix au lieu d'utiliser vos doigts.</div>

<div class="rule-h">🎴 Suivre la couleur</div>
<div class="rule-p">La première carte jouée lors d'un pli indique la couleur à suivre. Les joueurs <b>doivent</b> jouer une carte de cette couleur s'ils en possèdent une. Les cartes sans numéro (cartes spéciales) ne doivent pas être suivies et peuvent être jouées à tout moment.</div>
<div class="rule-p">Si des couleurs différentes de la première carte sont jouées (mais pas l'atout), ces cartes ne peuvent pas gagner le pli, même si leur valeur est plus élevée.</div>
<div class="note"><b>L'atout :</b> les cartes noires (Drapeau pirate) battent toutes les autres couleurs. Un 1 noir bat un 14 vert.</div>

<div class="rule-h">⚔️ Hiérarchie des cartes</div>
<div class="hier">
  <div class="hi"><div class="hi-r">1</div><div class="hi-i">🧜‍♀️</div><div style="flex:1"><div class="hi-t">Sirène (×2)</div><div class="hi-d">Bat les cartes numérotées et Skull King, perd contre les pirates</div></div></div>
  <div class="hi"><div class="hi-r">2</div><div class="hi-i">💀</div><div style="flex:1"><div class="hi-t">Skull King (×1)</div><div class="hi-d">Bat tout, sauf les sirènes</div></div></div>
  <div class="hi"><div class="hi-r">3</div><div class="hi-i">🏴‍☠️</div><div style="flex:1"><div class="hi-t">Pirate (×5)</div><div class="hi-d">Bat les cartes numérotées et les sirènes</div></div></div>
  <div class="hi"><div class="hi-r">4</div><div class="hi-i">🖤</div><div style="flex:1"><div class="hi-t">Noir — Drapeau pirate (1 à 14)</div><div class="hi-d">Atout : bat toutes les autres couleurs</div></div></div>
  <div class="hi"><div class="hi-r">5</div><div class="hi-i">🎨</div><div style="flex:1"><div class="hi-t">Vert, jaune, violet (1 à 14)</div><div class="hi-d">La plus haute de la couleur demandée l'emporte</div></div></div>
  <div class="hi"><div class="hi-r">6</div><div class="hi-i">⛵</div><div style="flex:1"><div class="hi-t">Fuite (×5)</div><div class="hi-d">Perd contre toutes les autres cartes</div></div></div>
</div>
<div class="note"><b>Tigresse (×1) :</b> lorsque vous la jouez, vous décidez si elle compte comme un Pirate ou une Fuite.<br><br><b>Cas particuliers :</b> si un pirate, Skull King et une sirène sont joués dans le même pli, la <b>sirène gagne toujours</b>, quel que soit l'ordre de jeu. Si plusieurs cartes identiques (pirates, sirènes, fuites) se retrouvent dans le même pli, la <b>première jouée</b> l'emporte.</div>

<div class="rule-h">🚩 Débuter avec une carte spéciale</div>
<div class="rule-p"><b>Avec une fuite</b> (ou Tigresse en fuite, ou un butin) : c'est le joueur suivant qui détermine la couleur à suivre. S'il joue aussi une de ces cartes, le choix passe au joueur suivant.</div>
<div class="rule-p"><b>Avec un personnage</b> (sirène, pirate, Skull King, Tigresse en pirate, kraken ou baleine blanche) : il n'y a <b>pas de couleur à suivre</b>. Tous les autres joueurs jouent la carte de leur choix.</div>

<div class="rule-h" id="r-score">🧮 Les scores selon Skull King</div>
<div class="rule-p">C'est le système classique, excellent pour les joueurs audacieux. Vous ne gagnez des points que si vous misez correctement — sinon vous en perdez.</div>
<table class="bonus-tbl">
  <tr><td>Mise sur 1 ou plus, exacte</td><td>20 pts / pli</td></tr>
  <tr><td>Mise sur 1 ou plus, ratée</td><td>−10 pts / écart</td></tr>
  <tr><td>Mise sur zéro, réussie</td><td>10 × nb de cartes</td></tr>
  <tr><td>Mise sur zéro, ratée</td><td>−10 × nb de cartes</td></tr>
</table>
<div class="rule-p" style="font-size:12.5px;color:var(--muted)">Exemple : Félix mise sur 3 et remporte 3 plis → 60 points. Pauline mise sur 2 mais remporte 4 plis → −20 points. Suzie mise zéro à la 7ᵉ manche et ne prend rien → 70 points.</div>

<div class="rule-h">🎩 Les scores selon Rascal</div>
<div class="rule-p">Méthode équilibrée pour les joueurs rusés. À chaque manche, tous les joueurs ont le même potentiel : <b>10 points par carte distribuée</b>, quelle que soit la mise. Votre précision détermine ce que vous encaissez.</div>
<table class="bonus-tbl">
  <tr><td><b>Coup direct</b> — mise exacte</td><td>Tous les points</td></tr>
  <tr><td><b>Frappe à revers</b> — écart de 1</td><td>La moitié</td></tr>
  <tr><td><b>Échec cuisant</b> — écart de 2 ou +</td><td>Aucun point</td></tr>
</table>
<div class="rule-p">Les mêmes règles s'appliquent aux bonus : tous vos points bonus en cas de coup direct, la moitié en cas de frappe à revers, aucun en cas d'échec cuisant.</div>
<div class="note"><b>Option Boulet de canon :</b> après avoir misé, chacun choisit — <b>Chevrotine</b> (main ouverte) applique la règle habituelle de Rascal. <b>Boulet de canon</b> (poing fermé) rapporte 15 points par carte distribuée si la mise est correcte, et 0 point en cas d'erreur, même d'un seul pli.</div>

<div class="rule-h" id="r-bonus">🏆 Points bonus</div>
<div class="rule-p">Certaines cartes rapportent des points bonus lorsqu'elles sont remportées dans un pli. Ils ne sont gagnés <b>que si la mise est exacte</b> (avec le décompte Rascal : tous, la moitié ou aucun selon la précision).</div>
<table class="bonus-tbl">
  <tr><td>🎨 Carte 14 de couleur (vert, jaune, violet)</td><td>+10 pts</td></tr>
  <tr><td>🖤 Carte 14 noire (Drapeau pirate)</td><td>+20 pts</td></tr>
  <tr><td>🏴‍☠️ Sirène capturée par un pirate</td><td>+20 pts</td></tr>
  <tr><td>💀 Pirate capturé par Skull King</td><td>+30 pts</td></tr>
  <tr><td>🧜‍♀️ Skull King capturé par une sirène</td><td>+40 pts</td></tr>
</table>
<div class="note">Chaque 14 que vous possédez à la fin de la manche vous donne un bonus, <b>peu importe qui l'a joué</b>. L'ordre dans lequel les cartes sont jouées ne change rien à l'attribution des bonus.</div>

<div class="rule-h">🗺️ Nombre de cartes</div>
<div class="rule-p">Prêt à voyager ? Modifiez le nombre de manches et de cartes distribuées.</div>
<table class="bonus-tbl">
  <tr><td><b>Pas d'impair</b></td><td>2, 4, 6, 8, 10 ×2</td></tr>
  <tr><td><b>Prêt au combat</b></td><td>6, 7, 8, 9, 10</td></tr>
  <tr><td><b>Attaque éclair</b></td><td>5 × 5 cartes</td></tr>
  <tr><td><b>Tir de barrage</b></td><td>10 × 10 cartes</td></tr>
  <tr><td><b>Tourbillon</b></td><td>9, 7, 5, 3, 1 ×2</td></tr>
  <tr><td><b>L'heure du dodo</b></td><td>1 manche à 1 carte</td></tr>
</table>

<div class="rule-h">👻 Règle à 2 joueurs</div>
<div class="rule-p">Mélangez et distribuez <b>3 paquets</b>. Vous misez et jouez normalement, mais vous êtes rejoints par le fantôme de <b>Barbe Grise</b>. À chaque manche, vous et votre adversaire commencez alternativement ; Barbe Grise joue toujours sa carte en deuxième position.</div>
<div class="rule-p">À son tour, retournez la carte supérieure de son paquet et ajoutez-la au pli — il n'a pas besoin de suivre la couleur. Quand il gagne un pli, il commence le suivant. Il ne mise pas et ne marque pas de points. Quand il joue Tigresse, c'est pour fuir. Les cartes Butin ne sont pas utilisées à 2 joueurs.</div>

<div class="rule-h">🐙 Règles avancées</div>
<div class="rule-p">Ces cartes sont optionnelles : activez-les dans les options de la partie. Un pli détruit n'est remporté par personne — saisissez-le dans « Plis détruits » pour que le total des plis reste juste.</div>
<div class="rule-p"><b>Kraken :</b> lorsqu'il est joué, le pli est entièrement détruit. Personne ne gagne le pli et les cartes sont mises de côté. Le pli suivant est lancé par le joueur qui aurait dû gagner ce pli.</div>
<div class="rule-p"><b>Baleine blanche :</b> les cartes spéciales sont détruites et ne peuvent pas gagner. Les cartes numérotées perdent leur couleur : la carte au <b>numéro le plus élevé</b> remporte le pli. En cas d'égalité, la première jouée l'emporte. Si seules des cartes spéciales ont été jouées, le pli est défaussé et celui qui l'aurait remporté entame le suivant.</div>
<div class="rule-p"><b>Eaux agitées :</b> si le kraken et la baleine blanche sont joués dans le même pli, la <b>deuxième carte jouée</b> remporte la bataille et son action s'applique.</div>
<div class="rule-p"><b>Cartes Butin (×2) :</b> en jouant une carte Butin, vous concluez une alliance avec le joueur qui la remportera. Si vous misez <b>tous les deux</b> correctement, vous gagnez chacun 20 points bonus.</div>

<div class="rule-h">🏴‍☠️ Pouvoirs avancés des pirates</div>
<div class="rule-p">Pour débloquer le pouvoir d'un pirate, vous devez gagner un pli avec lui. Le pouvoir doit être utilisé immédiatement.</div>
<div class="hier">
  <div class="hi"><div class="hi-i">🥧</div><div style="flex:1"><div class="hi-t">Rosie la Douce</div><div class="hi-d">Choisissez n'importe quel joueur, y compris vous, pour commencer le prochain pli</div></div></div>
  <div class="hi"><div class="hi-i">🎭</div><div style="flex:1"><div class="hi-t">Will le Bandit</div><div class="hi-d">Ajoutez 2 cartes de la pioche à votre main, puis défaussez-en 2</div></div></div>
  <div class="hi"><div class="hi-i">🎲</div><div style="flex:1"><div class="hi-t">Rascal le Flambeur</div><div class="hi-d">Pariez 0, 10 ou 20 points. Gagnez-les si votre mise est exacte, perdez-les sinon</div></div></div>
  <div class="hi"><div class="hi-i">🔮</div><div style="flex:1"><div class="hi-t">Juanita Jade</div><div class="hi-d">Regardez secrètement les cartes non distribuées</div></div></div>
  <div class="hi"><div class="hi-i">💪</div><div style="flex:1"><div class="hi-t">Harry le Géant</div><div class="hi-d">Modifiez votre mise de +1, −1, ou laissez-la telle quelle. Seul pouvoir utilisable après le dernier pli</div></div></div>
</div>
<div class="note" style="margin-bottom:24px">Règles du jeu <b>Skull King™</b> — Grandpa Beck's Games®. Application de score non officielle, conçue pour accompagner votre boîte de jeu.</div>
`;
