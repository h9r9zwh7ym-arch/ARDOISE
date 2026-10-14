/* Jass — logique de score pure (Schieber, Coiffeur, Différenzler), testée dans tests/jass.test.js.
   Règles : voir RULES.md dans ce dossier. */

export const GAME_POINTS = 157;   // 152 points de cartes + 5 pour le dernier pli
export const MATCH = 257;         // les 9 plis : 157 + 100

// Atouts, avec les facteurs du Schieber (×1 / ×2 / ×3, jassverzeichnis.ch)
export const TRUMPS = [
  { id: 'carreau', label: 'Carreau', sym: '♦', factor: 1 },
  { id: 'coeur', label: 'Cœur', sym: '♥', factor: 1 },
  { id: 'pique', label: 'Pique', sym: '♠', factor: 2 },
  { id: 'trefle', label: 'Trèfle', sym: '♣', factor: 2 },
  { id: 'obe', label: 'Obenabe', sym: '↓', factor: 3 },
  { id: 'unde', label: 'Undenufe', sym: '↑', factor: 3 }
];
export const trumpOf = id => TRUMPS.find(t => t.id === id) || null;

// Lignes du Coiffeur et leurs facteurs (jassverzeichnis.ch, « Coiffeur »)
export const COIFFEUR_ROWS = [
  { id: 'pique', label: 'Pique ♠', factor: 1 },
  { id: 'trefle', label: 'Trèfle ♣', factor: 2 },
  { id: 'carreau', label: 'Carreau ♦', factor: 3 },
  { id: 'coeur', label: 'Cœur ♥', factor: 4 },
  { id: 'obe', label: 'Obenabe ↓', factor: 5 },
  { id: 'unde', label: 'Undenufe ↑', factor: 6 },
  { id: 'joker1', label: 'Joker', factor: 7 },
  { id: 'joker2', label: 'Joker', factor: 8 }
];
export const coiffeurRows = n => COIFFEUR_ROWS.slice(0, n);

export const WEIS_VALUES = [20, 50, 100, 150, 200];

/* ═══════════ Schieber ═══════════ */
export function schieberRound() {
  return { trump: null, pts: null, match: null, weis: [0, 0], stoeck: null };
}
/** Points de cartes de chaque équipe (157 au total, ou 257 / 0 en cas de Match). */
export function schieberCards(R) {
  if (R.match === 0 || R.match === 1) return R.match === 0 ? [MATCH, 0] : [0, MATCH];
  const a = typeof R.pts === 'number' ? R.pts : 0;
  return [a, GAME_POINTS - a];
}
/**
 * Points de la manche par équipe. Avec les multiplicateurs, cartes, Weis et Stöck sont
 * multipliés par le facteur de l'atout.
 * Détail renvoyé : { cards, weis, stoeck, factor, total } pour départager à l'arrivée (Stöck – Weis – Stich).
 */
export function schieberDetail(R, opts = {}) {
  const f = opts.factors ? (trumpOf(R.trump) || { factor: 1 }).factor : 1;
  const cards = schieberCards(R).map(v => v * f);
  const weis = [0, 1].map(i => (R.weis[i] || 0) * f);
  const stoeck = [0, 1].map(i => (R.stoeck === i ? 20 * f : 0));
  return { cards, weis, stoeck, factor: f, total: [0, 1].map(i => cards[i] + weis[i] + stoeck[i]) };
}
export function checkSchieber(R, opts = {}) {
  if (opts.factors && !R.trump) return { ok: false, msg: 'Choisissez l’atout' };
  if (R.match !== 0 && R.match !== 1 && typeof R.pts !== 'number') return { ok: false, msg: 'Saisissez les points de l’équipe 1' };
  if (typeof R.pts === 'number' && (R.pts < 0 || R.pts > GAME_POINTS)) return { ok: false, msg: `Les points de cartes vont de 0 à ${GAME_POINTS}` };
  return { ok: true, msg: null };
}
/**
 * Équipe(s) gagnante(s) d'une partie de Schieber. Si les deux équipes passent la cible
 * dans la même manche, on compte dans l'ordre Stöck, puis Weis, puis plis (« Stöck – Wys – Stich ») :
 * la première à atteindre la cible gagne.
 */
export function schieberWinners(rounds, opts) {
  const target = opts.target || 1000;
  const t = [0, 0];
  for (const R of rounds) {
    const d = schieberDetail(R, opts);
    for (const part of ['stoeck', 'weis', 'cards']) {
      const before = t.slice();
      t[0] += d[part][0]; t[1] += d[part][1];
      const hit = [0, 1].filter(i => t[i] >= target);
      if (hit.length === 1) return hit;
      if (hit.length === 2) {
        // atteinte au même moment : celle qui est passée seule avant, sinon le plus haut total
        const first = [0, 1].filter(i => before[i] >= target);
        if (first.length === 1) return first;
        return t[0] === t[1] ? [0, 1] : [t[0] > t[1] ? 0 : 1];
      }
    }
  }
  return t[0] === t[1] ? [0, 1] : [t[0] > t[1] ? 0 : 1];
}

/* ═══════════ Coiffeur ═══════════ */
export function coiffeurRound() { return { team: null, row: null, pts: null, match: false }; }
/** Points écrits : seulement les dizaines (52 → 5, Match 257 → 25), multipliées par le facteur de la ligne. */
export function coiffeurPoints(R, opts = {}) {
  const row = COIFFEUR_ROWS.find(r => r.id === R.row);
  if (!row || (R.team !== 0 && R.team !== 1)) return [0, 0];
  const raw = R.match ? MATCH : (typeof R.pts === 'number' ? R.pts : 0);
  const v = (opts.fullPoints ? raw : Math.floor(raw / 10)) * row.factor;
  return R.team === 0 ? [v, 0] : [0, v];
}
/** usedRows : lignes déjà jouées par chaque équipe dans les autres manches. */
export function checkCoiffeur(R, usedRows = [[], []]) {
  if (R.team !== 0 && R.team !== 1) return { ok: false, msg: 'Quelle équipe a annoncé ?' };
  if (!R.row) return { ok: false, msg: 'Choisissez la ligne jouée' };
  if (usedRows[R.team].includes(R.row)) return { ok: false, msg: 'Cette ligne est déjà remplie pour cette équipe' };
  if (!R.match && typeof R.pts !== 'number') return { ok: false, msg: 'Saisissez les points' };
  if (!R.match && (R.pts < 0 || R.pts > GAME_POINTS)) return { ok: false, msg: `Les points vont de 0 à ${GAME_POINTS}` };
  return { ok: true, msg: null };
}

/* ═══════════ Différenzler ═══════════ */
export function diffRound(n) { return { pred: Array(n).fill(null), pts: Array(n).fill(null) }; }
/** Pénalité = écart entre l'annonce et les points faits ; option : −10 pour une annonce exacte. */
export function diffPoints(R, opts = {}) {
  return R.pred.map((p, i) => {
    const d = Math.abs((p || 0) - (R.pts[i] || 0));
    return d === 0 && opts.exactBonus ? -10 : d;
  });
}
export function checkDiffPreds(R) {
  const miss = R.pred.filter(v => typeof v !== 'number').length;
  if (miss) return { ok: false, msg: miss === 1 ? 'Il manque une annonce' : `Il manque ${miss} annonces` };
  if (R.pred.some(v => v < 0 || v > GAME_POINTS)) return { ok: false, msg: `Les annonces vont de 0 à ${GAME_POINTS}` };
  return { ok: true, msg: null };
}
export function checkDiff(R) {
  const p = checkDiffPreds(R); if (!p.ok) return p;
  const miss = R.pts.filter(v => typeof v !== 'number').length;
  if (miss) return { ok: false, msg: miss === 1 ? 'Il manque des points' : `Il manque les points de ${miss} joueurs` };
  const sum = R.pts.reduce((a, b) => a + b, 0);
  if (sum !== GAME_POINTS) return { ok: false, msg: `Total des points : ${sum} au lieu de ${GAME_POINTS}` };
  return { ok: true, msg: null };
}
