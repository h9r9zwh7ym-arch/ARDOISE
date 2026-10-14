import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundPoints, isDoubled, checkRound, parseScore, makeRound } from '../src/games/skyjo/scoring.js';
import { emptyDb, playerByName } from '../src/core/store.js';
import { totals, ranking, winners } from '../src/core/scoring.js';
import { getGame } from '../src/games/registry.js';

const R = (scores, closer) => ({ scores, closer });

test('Notice officielle : A ferme avec 10, C a aussi 10 → A est doublé (20)', () => {
  assert.deepEqual(roundPoints(R([10, 24, 10], 0)), [20, 24, 10]);
  assert.equal(isDoubled(R([10, 24, 10], 0)), true);
});

test('Celui qui ferme avec strictement le plus petit score n’est pas doublé', () => {
  assert.deepEqual(roundPoints(R([5, 24, 10], 0)), [5, 24, 10]);
});

test('Skyjo Action, exemple II : score de manche négatif ou nul jamais doublé', () => {
  assert.deepEqual(roundPoints(R([-5, 10, -7], 0)), [-5, 10, -7]);
  assert.deepEqual(roundPoints(R([0, -3, 4], 0)), [0, -3, 4]);
});

test('Seul le joueur qui a fermé peut être doublé', () => {
  assert.deepEqual(roundPoints(R([30, 12, 40], 1)), [30, 12, 40]);
  assert.deepEqual(roundPoints(R([30, 12, 4], 1)), [30, 24, 4]);
});

test('Saisie : tous les scores et le joueur qui a fermé sont obligatoires', () => {
  assert.equal(checkRound(R([1, null, 3], 0)).ok, false);
  assert.equal(checkRound(R([1, 2, 3], null)).ok, false);
  assert.equal(checkRound(R([1, 2, 3], 2)).ok, true);
  assert.deepEqual(makeRound(3), { scores: [null, null, null], closer: null });
});

test('Lecture d’un score saisi (signe moins typographique compris)', () => {
  assert.equal(parseScore('−12'), -12);
  assert.equal(parseScore(' 34 '), 34);
  assert.equal(parseScore(''), null);
  assert.equal(parseScore('-'), null);
  assert.equal(parseScore('5000'), 999);
});

test('Fin de partie dès qu’un joueur atteint 100 ou plus ; le plus petit total gagne', () => {
  const SKY = getGame('skyjo');
  const db = emptyDb();
  const g = { id: 'g', gameId: 'skyjo', status: 'playing', playerIds: ['A', 'B', 'C'].map(n => playerByName(db, n).id), options: SKY.defaultOptions(), dealer: 0 };
  SKY.setup(g);
  g.rounds[0] = R([40, 50, 60], 0); g.cur = 1;
  assert.equal(SKY.isOver(g), false);
  SKY.prepareRound(g);
  g.rounds[1] = R([30, 50, 39], 2); g.cur = 2;      // C ferme avec 39 : pas le plus petit (A 30) → 78
  assert.deepEqual(totals(SKY, g), [70, 100, 138]);
  assert.equal(SKY.isOver(g), true);                 // B atteint exactement 100
  g.status = 'done';
  assert.deepEqual(ranking(SKY, g).map(r => r.i), [0, 1, 2]);
  assert.deepEqual(winners(SKY, g), [0]);
});
