import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roleOf, roundPoints, checkRound, exchanges } from '../src/games/president/scoring.js';

test('Rôles selon l’arrivée : 4 joueurs, 5 joueurs, 3 joueurs', () => {
  assert.deepEqual([0, 1, 2, 3].map(k => roleOf(k, 4)), ['p', 'vp', 'vtdc', 'tdc']);
  assert.deepEqual([0, 1, 2, 3, 4].map(k => roleOf(k, 5)), ['p', 'vp', 'n', 'vtdc', 'tdc']);
  assert.deepEqual([0, 1, 2].map(k => roleOf(k, 3)), ['p', 'n', 'tdc']);
});

test('Points : n−1 pour le Président … 0 pour le Trou du cul (Wikipédia)', () => {
  // ordre d'arrivée : joueur 2, puis 0, puis 3, puis 1
  assert.deepEqual(roundPoints({ order: [2, 0, 3, 1], putsch: null }, 4), [2, 0, 3, 1]);
});

test('Putsch : réussi = n points, raté = −1', () => {
  const o = { putsch: true };
  assert.deepEqual(roundPoints({ order: [1, 0, 2, 3], putsch: 1 }, 4, o), [2, 4, 1, 0]);
  assert.deepEqual(roundPoints({ order: [0, 2, 3, 1], putsch: 1 }, 4, o), [3, -1, 2, 1]);
  assert.deepEqual(roundPoints({ order: [1, 0, 2, 3], putsch: 1 }, 4), [2, 3, 1, 0]);   // option désactivée
});

test('Saisie : tout le monde doit être classé', () => {
  assert.equal(checkRound({ order: [0, 1], putsch: null }, 3).ok, false);
  assert.equal(checkRound({ order: [0, 1, 2], putsch: null }, 3).ok, true);
});

test('Échanges d’après la manche précédente', () => {
  const ex = exchanges({ order: [2, 0, 3, 1] }, 4, ['Ana', 'Bob', 'Cid', 'Dom']);
  assert.equal(ex.length, 2);
  assert.match(ex[0], /^Bob donne ses 2 meilleures cartes à Cid/);
  assert.match(ex[1], /^Dom donne sa meilleure carte à Ana/);
  assert.deepEqual(exchanges(null, 4, []), []);
});

test('À 2 joueurs : Président et Trou du cul, échange d’une seule carte', () => {
  assert.deepEqual([0, 1].map(k => roleOf(k, 2)), ['p', 'tdc']);
  assert.deepEqual(roundPoints({ order: [1, 0], putsch: null }, 2), [0, 1]);
  const ex = exchanges({ order: [1, 0] }, 2, ['Ana', 'Bob']);
  assert.deepEqual(ex, ['Ana donne sa meilleure carte à Bob, qui lui en rend 1 de son choix']);
});
