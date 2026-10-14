/* Président (Trou du cul) — rôles et points par manche (logique pure, testée).
   Règles : voir RULES.md dans ce dossier. */

/**
 * Rôle selon la place d'arrivée (0 = premier sorti) pour n joueurs.
 * 1er Président, 2e Vice-président (dès 4 joueurs), avant-dernier Vice-trou du cul (dès 4),
 * dernier Trou du cul ; les autres sont Neutres.
 */
export function roleOf(place, n) {
  if (place === 0) return 'p';
  if (place === n - 1) return 'tdc';
  if (n >= 4 && place === 1) return 'vp';
  if (n >= 4 && place === n - 2) return 'vtdc';
  return 'n';
}
export const ROLE_LABEL = { p: 'Président', vp: 'Vice-président', n: 'Neutre', vtdc: 'Vice-trou du cul', tdc: 'Trou du cul' };

export function makeRound(n) { return { order: [], putsch: null }; }

/** Place d'arrivée de chaque joueur (null si non saisie). */
export function places(R, n) {
  const pl = Array(n).fill(null);
  R.order.forEach((p, k) => { pl[p] = k; });
  return pl;
}

/**
 * Points de la manche (Wikipédia, « jeu aux points ») : le Président marque n−1, puis un de moins
 * par place, jusqu'au Trou du cul qui marque 0.
 * Putsch (option) : réussi (le putschiste finit Président) il marque n ; raté il perd 1 point.
 */
export function roundPoints(R, n, opts = {}) {
  const pl = places(R, n);
  return pl.map((k, i) => {
    if (k === null) return 0;
    let v = n - 1 - k;
    if (opts.putsch && R.putsch === i) v = k === 0 ? n : -1;
    return v;
  });
}

export function checkRound(R, n) {
  if (R.order.length < n) {
    const left = n - R.order.length;
    return { ok: false, msg: left === 1 ? 'Il reste un joueur à classer' : `Il reste ${left} joueurs à classer` };
  }
  return { ok: true, msg: null };
}

/** Échanges de cartes en début de manche, d'après les rôles de la manche précédente. */
export function exchanges(prev, n, names) {
  if (!prev || prev.order.length < n) return [];
  const who = role => { const k = Array.from({ length: n }, (_, p) => p).find(p => roleOf(p, n) === role); return k === undefined ? null : names[prev.order[k]]; };
  const out = [];
  const p = who('p'), t = who('tdc'), vp = who('vp'), vt = who('vtdc');
  if (p && t) out.push(`${t} donne ses 2 meilleures cartes à ${p}, qui lui en rend 2 de son choix`);
  if (vp && vt) out.push(`${vt} donne sa meilleure carte à ${vp}, qui lui en rend 1 de son choix`);
  return out;
}
