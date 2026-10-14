import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handNet, entryNet, checkRound, makeRound } from '../src/games/blackjack/scoring.js';

const H = (bet, result, doubled = false) => ({ bet, result, doubled });

test('Paiements de base : gagné 1:1, égalité, perdu', () => {
  assert.equal(handNet(H(10, 'win')), 10);
  assert.equal(handNet(H(10, 'push')), 0);
  assert.equal(handNet(H(10, 'lose')), -10);
});

test('Blackjack payé 3:2, ou 6:5 selon la table', () => {
  assert.equal(handNet(H(10, 'bj')), 15);
  assert.equal(handNet(H(10, 'bj'), { payout: '6:5' }), 12);
});

test('Doubler : la mise est doublée, gain ou perte', () => {
  assert.equal(handNet(H(10, 'win', true)), 20);
  assert.equal(handNet(H(10, 'lose', true)), -20);
});

test('Abandon : on perd la moitié de la mise', () => {
  assert.equal(handNet(H(10, 'surrender')), -5);
});

test('Séparer (split) : chaque main compte pour elle-même', () => {
  const e = { hands: [H(10, 'win'), H(10, 'lose', true)], insurance: false };
  assert.equal(entryNet(e, false), 10 - 20);
});

test('Assurance : moitié de la mise, payée 2:1 si le croupier a un blackjack', () => {
  const opts = { insurance: true };
  const e = { hands: [H(10, 'lose')], insurance: true };
  assert.equal(entryNet(e, true, opts), -10 + 10);   // la main perd, l'assurance compense
  assert.equal(entryNet({ hands: [H(10, 'win')], insurance: true }, false, opts), 10 - 5);
});

test('Saisie : chaque main misée doit avoir un résultat', () => {
  const R = makeRound([10, 0]);
  assert.equal(checkRound(R).ok, false);
  R.e[0].hands[0].result = 'win';
  assert.equal(checkRound(R).ok, true);              // le joueur à 0 ne joue pas
  assert.equal(checkRound(makeRound([0, 0])).ok, false);
});
