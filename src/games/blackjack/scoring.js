/* Blackjack — gains et pertes de jetons par joueur face au croupier (logique pure, testée).
   Règles : voir RULES.md dans ce dossier. */

export const RESULTS = [
  ['lose', 'Perdu'], ['push', 'Égalité'], ['win', 'Gagné'], ['bj', 'Blackjack'], ['surrender', 'Abandon']
];

export function newHand(bet) { return { bet, result: null, doubled: false }; }
export function newEntry(bet) { return { hands: [newHand(bet)], insurance: false }; }
export function makeRound(prevBets) { return { e: prevBets.map(b => newEntry(b)), dealerBJ: false }; }

/** Gain net d'une main. payout : '3:2' (par défaut) ou '6:5' pour un blackjack naturel. */
export function handNet(h, opts = {}) {
  const bet = Math.max(0, h.bet || 0);
  const stake = h.doubled ? bet * 2 : bet;
  switch (h.result) {
    case 'win': return stake;
    case 'bj': return opts.payout === '6:5' ? bet * 6 / 5 : bet * 3 / 2;
    case 'push': return 0;
    case 'surrender': return -bet / 2;
    case 'lose': return -stake;
    default: return 0;
  }
}

/**
 * Gain net d'un joueur pour la manche : ses mains + l'assurance.
 * Assurance = mise de la moitié de la première main, payée 2:1 si le croupier a un blackjack.
 */
export function entryNet(e, dealerBJ, opts = {}) {
  let net = e.hands.reduce((s, h) => s + handNet(h, opts), 0);
  if (opts.insurance && e.insurance) {
    const ins = (e.hands[0] ? e.hands[0].bet : 0) / 2;
    net += dealerBJ ? ins * 2 : -ins;
  }
  return Math.round(net * 100) / 100;
}

export function roundNets(R, opts) { return R.e.map(e => entryNet(e, R.dealerBJ, opts)); }

/** Chaque main misée doit avoir un résultat. Une mise de 0 = le joueur ne joue pas cette manche. */
export function checkRound(R) {
  let missing = 0;
  R.e.forEach(e => e.hands.forEach(h => { if ((h.bet || 0) > 0 && !h.result) missing++; }));
  if (missing) return { ok: false, msg: missing === 1 ? 'Il manque un résultat' : `Il manque ${missing} résultats` };
  if (R.e.every(e => e.hands.every(h => !(h.bet > 0)))) return { ok: false, msg: 'Aucune mise dans cette manche' };
  return { ok: true, msg: null };
}
