/* Menteur — cartes restantes en fin de manche (logique pure, testée).
   Règles : voir RULES.md dans ce dossier. */
export const MAX_CARDS = 104;   // deux jeux de 52 cartes

export function makeRound(n) { return { left: Array(n).fill(0) }; }

/** Pénalité = cartes restées en main ; le joueur sans carte a gagné la manche. */
export function roundPoints(R) { return R.left.map(v => (typeof v === 'number' ? v : 0)); }

export function roundWinner(R) {
  const z = R.left.map((v, i) => (v === 0 ? i : -1)).filter(i => i >= 0);
  return z.length === 1 ? z[0] : null;
}
/** Perdant(s) de la manche : le plus de cartes en main. */
export function roundLosers(R) {
  const p = roundPoints(R), max = Math.max(...p);
  return max > 0 ? p.map((v, i) => (v === max ? i : -1)).filter(i => i >= 0) : [];
}

export function checkRound(R) {
  const miss = R.left.filter(v => typeof v !== 'number').length;
  if (miss) return { ok: false, msg: miss === 1 ? 'Il manque un nombre de cartes' : `Il manque ${miss} nombres de cartes` };
  const zero = R.left.filter(v => v === 0).length;
  if (zero === 0) return { ok: false, msg: 'Le gagnant de la manche doit avoir 0 carte' };
  if (zero > 1) return { ok: false, msg: 'Un seul joueur peut finir sans carte' };
  return { ok: true, msg: null };
}
