import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as J from '../src/games/jass/scoring.js';

const S = o => ({ ...J.schieberRound(), ...o });

test('Schieber : 157 points par jeu, partagés entre les équipes', () => {
  assert.deepEqual(J.schieberDetail(S({ pts: 100 })).total, [100, 57]);
});

test('Schieber : Match = 257 pour l’équipe qui fait tous les plis', () => {
  assert.deepEqual(J.schieberDetail(S({ match: 1 })).total, [0, 257]);
});

test('Schieber : multiplicateurs ×1 / ×2 / ×3 sur cartes, Weis et Stöck', () => {
  const o = { factors: true };
  assert.deepEqual(J.schieberDetail(S({ trump: 'coeur', pts: 100 }), o).total, [100, 57]);
  assert.deepEqual(J.schieberDetail(S({ trump: 'pique', pts: 100, weis: [50, 0], stoeck: 0 }), o).total, [(100 + 50 + 20) * 2, 57 * 2]);
  assert.deepEqual(J.schieberDetail(S({ trump: 'obe', match: 0 }), o).total, [771, 0]);   // « Match triple » = 771
  assert.deepEqual(J.schieberDetail(S({ trump: 'pique', pts: 100 }), {}).total, [100, 57]); // sans multiplicateurs
});

test('Schieber : saisie complète requise', () => {
  assert.equal(J.checkSchieber(S({}), {}).ok, false);
  assert.equal(J.checkSchieber(S({ pts: 80 }), { factors: true }).ok, false);   // atout manquant
  assert.equal(J.checkSchieber(S({ pts: 80, trump: 'coeur' }), { factors: true }).ok, true);
  assert.equal(J.checkSchieber(S({ pts: 158 }), {}).ok, false);
});

test('Schieber : arrivée « Stöck – Wys – Stich »', () => {
  const o = { target: 200 };
  const R1 = S({ pts: 0, weis: [185, 0] });          // 185 / 157
  // L'équipe 1 annonce les Stöck (+20 → 205) : elle atteint 200 avant que les plis ne comptent,
  // même si l'équipe 2 finit la manche avec plus de points (157 + 147 = 304).
  const R2 = S({ pts: 10, stoeck: 0 });
  assert.deepEqual(J.schieberWinners([R1, R2], o), [0]);
  // Sans Stöck, les deux passent la cible avec les plis : le plus haut total l'emporte.
  assert.deepEqual(J.schieberWinners([R1, S({ pts: 20 })], o), [1]);
});

test('Coiffeur : seules les dizaines comptent, multipliées par la ligne', () => {
  assert.deepEqual(J.coiffeurPoints({ team: 0, row: 'trefle', pts: 129, match: false }), [24, 0]);  // 12 × 2
  assert.deepEqual(J.coiffeurPoints({ team: 1, row: 'pique', pts: 0, match: true }), [0, 25]);      // Match 257 → 25
  assert.deepEqual(J.coiffeurPoints({ team: 1, row: 'unde', pts: 52, match: false }, { fullPoints: true }), [0, 312]);
});

test('Coiffeur : une ligne ne se joue qu’une fois par équipe', () => {
  assert.equal(J.checkCoiffeur({ team: 0, row: 'coeur', pts: 80 }, [['coeur'], []]).ok, false);
  assert.equal(J.checkCoiffeur({ team: 1, row: 'coeur', pts: 80 }, [['coeur'], []]).ok, true);
});

test('Différenzler : pénalité = écart, total des points = 157', () => {
  const R = { pred: [40, 30, 50, 37], pts: [40, 20, 60, 37] };
  assert.deepEqual(J.diffPoints(R), [0, 10, 10, 0]);
  assert.deepEqual(J.diffPoints(R, { exactBonus: true }), [-10, 10, 10, -10]);
  assert.equal(J.checkDiff(R).ok, true);
  assert.equal(J.checkDiff({ pred: [40, 30, 50, 37], pts: [40, 20, 60, 30] }).ok, false);
});
