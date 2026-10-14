import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundPoints, roundWinner, roundLosers, checkRound, makeRound } from '../src/games/menteur/scoring.js';

test('Pénalité = cartes restantes ; gagnant = celui qui n’a plus de carte', () => {
  const R = { left: [0, 7, 3, 7] };
  assert.deepEqual(roundPoints(R), [0, 7, 3, 7]);
  assert.equal(roundWinner(R), 0);
  assert.deepEqual(roundLosers(R), [1, 3]);
});

test('Saisie : tout le monde, et exactement un joueur à 0', () => {
  assert.equal(checkRound(makeRound(3)).ok, false);
  assert.equal(checkRound({ left: [2, 4, 1] }).ok, false);
  assert.equal(checkRound({ left: [0, 0, 1] }).ok, false);
  assert.equal(checkRound({ left: [0, 4, 1] }).ok, true);
});
