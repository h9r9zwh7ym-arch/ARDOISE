/* Skyjo — logique de score pure (sans DOM), testée dans tests/skyjo.test.js.
   Règles : voir RULES.md dans ce dossier (notice officielle Magilano). */

export const TARGET = 100;          // la partie s'arrête dès qu'un joueur atteint 100 points ou plus
export const SCORE_MIN = -99, SCORE_MAX = 999;

export function makeRound(nPlayers) {
  return { scores: Array(nPlayers).fill(null), closer: null };
}

/**
 * Points de la manche après la règle du doublement :
 * celui qui a fermé la manche doit avoir strictement le plus petit score ; si un autre joueur
 * a autant ou moins, ses points de la manche sont doublés — seulement s'ils sont positifs.
 */
export function roundPoints(round) {
  const s = round.scores.map(v => (typeof v === 'number' ? v : 0));
  const c = round.closer;
  if (c === null || c === undefined || s[c] <= 0) return s;
  const beaten = s.some((v, j) => j !== c && v <= s[c]);
  return beaten ? s.map((v, j) => (j === c ? v * 2 : v)) : s;
}

export function isDoubled(round) {
  const c = round.closer;
  if (c === null || c === undefined) return false;
  return roundPoints(round)[c] !== (round.scores[c] || 0);
}

/** La manche est complète : tous les scores saisis et le joueur qui a fermé désigné. */
export function checkRound(round) {
  const missing = round.scores.filter(v => typeof v !== 'number').length;
  if (missing) return { ok: false, msg: missing === 1 ? 'Il manque un score' : `Il manque ${missing} scores` };
  if (round.closer === null || round.closer === undefined) return { ok: false, msg: 'Qui a retourné toutes ses cartes en premier ?' };
  return { ok: true, msg: null };
}

export function parseScore(text) {
  const t = String(text ?? '').replace(/[−–]/g, '-').replace(/\s/g, '');
  if (t === '' || t === '-') return null;
  const n = parseInt(t, 10);
  if (Number.isNaN(n)) return null;
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, n));
}
