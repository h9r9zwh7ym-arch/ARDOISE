/* Skull King — logique de score pure (sans DOM), testée dans tests/skull-king.test.js.
   Règles : voir RULES.md dans ce dossier. */

// Cartes du jeu de base : 4 couleurs × 14 + 5 pirates + Tigresse + Skull King + 2 sirènes + 5 fuites.
export const BASE_DECK = 70;

// Bonus de capture (valables uniquement si la mise est exacte).
// max : plafond de saisie par joueur et par manche.
export const BONUSES = [
  { key: 'sk',   icon: '💀',  label: 'Pirates capturés par Skull King', pts: 30, unit: '30 pts chacun',   max: 6 },
  { key: 'sk14', icon: '🧜‍♀️', label: 'Skull King capturé par une sirène', pts: 40, unit: '40 pts',          max: 1 },
  { key: 'mer',  icon: '🏴‍☠️', label: 'Sirènes capturées par un pirate',  pts: 20, unit: '20 pts chacune',  max: 2 },
  { key: 'b14',  icon: '🖤',  label: 'Carte 14 noire (Drapeau pirate)',   pts: 20, unit: '20 pts',          max: 1 },
  { key: 'c14',  icon: '🎨',  label: 'Cartes 14 de couleur',              pts: 10, unit: '10 pts chacune',  max: 3 },
  { key: 'loot', icon: '💰',  label: 'Alliances Butin réussies',          pts: 20, unit: '20 pts chacune',  max: 2, opt: 'loot' }
];

export function activeBonuses(opts) {
  return BONUSES.filter(b => !b.opt || opts[b.opt]);
}

export function newEntry() {
  return { bid: 0, tricks: 0, sk: 0, sk14: 0, mer: 0, b14: 0, c14: 0, loot: 0, wager: 0, shot: 'chev' };
}

export function makeRound(cards, nPlayers) {
  return { cards, destroyed: 0, e: Array.from({ length: nPlayers }, newEntry) };
}

/** Taille du paquet selon les cartes avancées utilisées. Pas de Butin à 2 joueurs. */
export function deckSize(opts, nPlayers) {
  let d = BASE_DECK;
  if (opts.loot && nPlayers > 2) d += 2;
  if (opts.kraken) d += 1;
  if (opts.whale) d += 1;
  return d;
}

/** Nombre de cartes distribuées : même nombre pour tous, plafonné par la taille du paquet.
    À 2 joueurs, 3 mains sont distribuées (Barbe Grise). */
export function cardsFor(wanted, opts, nPlayers) {
  const hands = nPlayers === 2 ? 3 : nPlayers;
  return Math.min(wanted, Math.floor(deckSize(opts, nPlayers) / Math.max(1, hands)));
}

/** Plis pouvant être détruits dans une manche : 1 Kraken + 1 Baleine blanche au maximum. */
export function maxDestroyed(opts) {
  return (opts.kraken ? 1 : 0) + (opts.whale ? 1 : 0);
}

export function bonusOf(e, opts) {
  return activeBonuses(opts).reduce((s, b) => s + (e[b.key] || 0) * b.pts, 0);
}

export function bonusCount(e, opts) {
  return activeBonuses(opts).reduce((s, b) => s + (e[b.key] || 0), 0);
}

/**
 * Points d'un joueur pour une manche.
 * opts : { scoring: 'sk'|'rascal', cannonball, wager, loot }
 */
export function scoreEntry(e, cards, opts) {
  const exact = e.tricks === e.bid;
  const gap = Math.abs(e.bid - e.tricks);
  const bon = bonusOf(e, opts);
  let base = 0, bonus = 0, wag = 0;

  if (opts.scoring === 'rascal') {
    const cannon = opts.cannonball && e.shot === 'boul';
    if (cannon) { base = exact ? 15 * cards : 0; bonus = exact ? bon : 0; }
    else if (exact) { base = 10 * cards; bonus = bon; }
    else if (gap === 1) { base = 5 * cards; bonus = Math.round(bon / 2); }
  } else {
    if (e.bid === 0) { base = exact ? 10 * cards : -10 * cards; bonus = exact ? bon : 0; }
    else if (exact) { base = 20 * e.bid; bonus = bon; }
    else { base = -10 * gap; }
  }
  if (opts.wager && e.wager > 0) wag = exact ? e.wager : -e.wager;
  return { base, bonus, wager: wag, pts: base + bonus + wag, exact, gap, rawBonus: bon };
}

/** Totaux par joueur sur les `played` premières manches (manches validées uniquement). */
export function totals(rounds, opts, nPlayers, played) {
  const t = Array(nPlayers).fill(0);
  const lim = Math.min(played, rounds.length);
  for (let r = 0; r < lim; r++) {
    const R = rounds[r];
    for (let i = 0; i < nPlayers; i++) t[i] += scoreEntry(R.e[i], R.cards, opts).pts;
  }
  return t;
}

/**
 * Vérifie la cohérence des plis saisis.
 * - Chaque pli est remporté par un joueur, sauf ceux détruits par le Kraken / la Baleine blanche.
 * - À 2 joueurs, Barbe Grise (le fantôme) prend les plis restants.
 * Retourne { ok, sum, cards, destroyed, ghost, rest, msg }.
 */
export function checkTricks(round, opts, nPlayers) {
  const sum = round.e.reduce((a, e) => a + e.tricks, 0);
  const cards = round.cards;
  const destroyed = round.destroyed || 0;
  const ghost = nPlayers === 2;
  const counted = sum + destroyed;
  const rest = cards - counted;
  let ok, msg;
  if (destroyed > maxDestroyed(opts)) {
    ok = false; msg = `Au plus ${maxDestroyed(opts)} pli(s) détruit(s) avec les cartes choisies`;
  } else if (destroyed > cards) {
    ok = false; msg = `Il n'y a que ${cards} pli${cards > 1 ? 's' : ''} dans cette manche`;
  } else if (ghost) {
    ok = rest >= 0;
    msg = ok ? null : `Il n'y a que ${cards} pli${cards > 1 ? 's' : ''} dans cette manche`;
  } else {
    ok = rest === 0;
    msg = ok ? null : rest > 0
      ? `Il manque ${rest} pli${rest > 1 ? 's' : ''} : ${cards} au total${maxDestroyed(opts) ? ' (plis détruits compris)' : ''}`
      : `${-rest} pli${-rest > 1 ? 's' : ''} de trop : il n'y en a que ${cards}`;
  }
  return { ok, sum, cards, destroyed, ghost, rest, msg };
}
