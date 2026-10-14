import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreEntry, totals, checkTricks, makeRound, newEntry, bonusOf,
  cardsFor, deckSize, maxDestroyed
} from '../src/games/skull-king/scoring.js';

const SK = { scoring: 'sk', cannonball: false, wager: false, loot: false, kraken: false, whale: false };
const RASCAL = { ...SK, scoring: 'rascal' };
const e = o => ({ ...newEntry(), ...o });
const pts = (o, cards, opts = SK) => scoreEntry(e(o), cards, opts).pts;

test('Skull King — exemples du livret officiel', () => {
  assert.equal(pts({ bid: 3, tricks: 3 }, 5), 60);        // Calvin : 20 × 3
  assert.equal(pts({ bid: 2, tricks: 4 }, 5), -20);       // Angela : −10 × 2
  assert.equal(pts({ bid: 0, tricks: 0 }, 7), 70);        // Kate : 10 × 7
  assert.equal(pts({ bid: 0, tricks: 2 }, 9), -90);       // Johnny : −10 × 9
});

test('Skull King — bonus uniquement si la mise est exacte', () => {
  // Exemple du livret : sirène prend le Skull King + jaune 14 → +50
  assert.equal(pts({ bid: 1, tricks: 1, sk14: 1, c14: 1 }, 3), 20 + 50);
  assert.equal(pts({ bid: 2, tricks: 1, sk14: 1, c14: 1 }, 3), -10);
  assert.equal(pts({ bid: 2, tricks: 2, sk: 2, mer: 1, b14: 1 }, 5), 40 + 60 + 20 + 20);
});

test("Butin compté seulement si l'option est active", () => {
  assert.equal(bonusOf(e({ loot: 1 }), SK), 0);
  assert.equal(bonusOf(e({ loot: 1 }), { ...SK, loot: true }), 20);
});

test('Rascal — coup direct / frappe à revers / échec (PDF officiel)', () => {
  // Exemple B : 4 cartes, potentiel 40
  assert.equal(pts({ bid: 1, tricks: 1 }, 4, RASCAL), 40);
  assert.equal(pts({ bid: 0, tricks: 1 }, 4, RASCAL), 20);
  assert.equal(pts({ bid: 4, tricks: 2 }, 4, RASCAL), 0);
  // Bonus : tous / moitié / aucun
  assert.equal(pts({ bid: 2, tricks: 2, sk: 1 }, 4, RASCAL), 40 + 30);
  assert.equal(pts({ bid: 2, tricks: 1, sk: 1 }, 4, RASCAL), 20 + 15);
  assert.equal(pts({ bid: 3, tricks: 1, sk: 1 }, 4, RASCAL), 0);
});

test('Rascal — boulet de canon', () => {
  const C = { ...RASCAL, cannonball: true };
  assert.equal(pts({ bid: 2, tricks: 2, shot: 'boul' }, 4, C), 60);
  assert.equal(pts({ bid: 2, tricks: 1, shot: 'boul' }, 4, C), 0);
  assert.equal(pts({ bid: 2, tricks: 1, shot: 'chev' }, 4, C), 20);
});

test('Pari de Rascal le Flambeur : gagné si exact, perdu sinon', () => {
  const W = { ...SK, wager: true };
  assert.equal(pts({ bid: 1, tricks: 1, wager: 20 }, 3, W), 40);
  assert.equal(pts({ bid: 1, tricks: 2, wager: 10 }, 3, W), -20);
  assert.equal(pts({ bid: 1, tricks: 2, wager: 10 }, 3, { ...RASCAL, wager: true }), 15 - 10);
});

test("Bug 3 — les totaux n'incluent que les manches jouées", () => {
  const rounds = [1, 2, 3, 4, 5].map(c => makeRound(c, 3));
  rounds[0].e[0].bid = 1; rounds[0].e[0].tricks = 1;   // A : +20 ; B, C : mise 0 réussie → +10
  assert.deepEqual(totals(rounds, SK, 3, 1), [20, 10, 10]);
  assert.deepEqual(totals(rounds, SK, 3, 0), [0, 0, 0]);
  // Le total = somme des points manche par manche (ce qu'affiche la feuille de score)
  const sheet = [0, 1, 2].map(i => scoreEntry(rounds[0].e[i], 1, SK).pts);
  assert.deepEqual(totals(rounds, SK, 3, 1), sheet);
});

test('Bug 1 — Kraken / Baleine blanche : plis détruits acceptés', () => {
  const R = makeRound(5, 3);
  R.e[0].tricks = 2; R.e[1].tricks = 2; R.e[2].tricks = 0;
  const K = { ...SK, kraken: true };
  assert.equal(checkTricks(R, SK, 3).ok, false);           // sans Kraken : 4/5 refusé
  R.destroyed = 1;
  assert.equal(checkTricks(R, K, 3).ok, true);             // 4 + 1 détruit = 5
  assert.equal(checkTricks(R, SK, 3).ok, false);           // détruit sans Kraken en jeu
  R.e[2].tricks = 1;
  assert.equal(checkTricks(R, K, 3).ok, false);            // 5 + 1 = trop
  R.e[2].tricks = 0; R.e[1].tricks = 1; R.destroyed = 2;
  assert.equal(checkTricks(R, { ...K, whale: true }, 3).ok, true);
  assert.equal(maxDestroyed({ kraken: true, whale: true }), 2);
});

test('Partie à 2 : Barbe Grise prend les plis restants', () => {
  const R = makeRound(5, 2);
  R.e[0].tricks = 2; R.e[1].tricks = 1;
  const c = checkTricks(R, SK, 2);
  assert.equal(c.ok, true); assert.equal(c.rest, 2);
  R.e[1].tricks = 4;
  assert.equal(checkTricks(R, SK, 2).ok, false);
});

test('Nombre de cartes ajusté au paquet', () => {
  assert.equal(cardsFor(10, SK, 8), 8);     // livret : 8 joueurs → 8 cartes max
  assert.equal(cardsFor(10, SK, 7), 10);
  assert.equal(deckSize({ loot: true, kraken: true, whale: true }, 4), 74);
  assert.equal(deckSize({ loot: true }, 2), 70);  // pas de Butin à 2
});

test('Tigresse jouée en Pirate : jusqu’à 6 captures par le Skull King (+30 chacune)', async () => {
  const { BONUSES } = await import('../src/games/skull-king/scoring.js');
  assert.equal(BONUSES.find(b => b.key === 'sk').max, 6);
  assert.equal(pts({ bid: 1, tricks: 1, sk: 6 }, 10), 20 + 180);
});

test('Boulet de canon : bonus complets si exact, aucun sinon', () => {
  const C = { ...RASCAL, cannonball: true };
  assert.equal(pts({ bid: 2, tricks: 2, shot: 'boul', b14: 1 }, 6), 40 + 20); // SK scoring unaffected
  assert.equal(pts({ bid: 3, tricks: 3, shot: 'boul', b14: 1 }, 6, C), 90 + 20);
  assert.equal(pts({ bid: 3, tricks: 2, shot: 'boul', b14: 1 }, 6, C), 0);
});

test('À 2 joueurs, Barbe Grise est optionnel', async () => {
  const { checkTricks, makeRound, cardsFor, hasGhost } = await import('../src/games/skull-king/scoring.js');
  const R = makeRound(5, 2); R.e[0].tricks = 2; R.e[1].tricks = 1;
  assert.equal(hasGhost(SK, 2), true);
  assert.equal(checkTricks(R, SK, 2).ok, true);                        // 2 plis pour Barbe Grise
  const NoGhost = { ...SK, greybeard: false };
  assert.equal(checkTricks(R, NoGhost, 2).ok, false);                  // sans lui, les 5 plis sont aux joueurs
  R.e[1].tricks = 3;
  assert.equal(checkTricks(R, NoGhost, 2).ok, true);
  assert.equal(cardsFor(10, NoGhost, 2), 10);
});
