import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, emptyDb, importLegacy, playerByName, KEY, LEGACY_KEY } from '../src/core/store.js';
import { totals, ranking, winners, playerStats, played, recentPlayers } from '../src/core/scoring.js';
import { getGame } from '../src/games/registry.js';

const SK = getGame('skull-king');
const memStorage = (init = {}) => {
  const m = { ...init };
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, dump: m };
};

function newGame(db, names, format = 'classique', options = {}) {
  const g = { id: 'g' + db.games.length, gameId: 'skull-king', status: 'playing', startedAt: 1000 + db.games.length,
    playerIds: names.map(n => playerByName(db, n).id), format, options: { ...SK.defaultOptions(), ...options }, dealer: 0 };
  SK.setup(g); db.games.push(g); return g;
}

test('Migration : la partie de l’ancienne app est reprise, joueurs créés, clé d’origine conservée', () => {
  const legacy = { players: ['Alice', 'Bob', 'alice '], mode: 'classique', scoring: 'sk', rounds: [
    { cards: 1, e: [{ bid: 1, tricks: 1 }, { bid: 0, tricks: 0 }, { bid: 0, tricks: 0 }].map(e => ({ sk: 0, sk14: 0, mer: 0, b14: 0, c14: 0, loot: 0, wager: 0, shot: 'chev', ...e })) },
    { cards: 2, e: [0, 1, 2].map(() => ({ bid: 0, tricks: 0, sk: 0, sk14: 0, mer: 0, b14: 0, c14: 0, loot: 0, wager: 0, shot: 'chev' })) }
  ], cur: 1, dealer: 0, done: false, started: 42 };
  const st = memStorage({ [LEGACY_KEY]: JSON.stringify(legacy), 'sk.dark': '1' });
  const db = createStore(st).load();
  assert.equal(db.games.length, 1);
  assert.equal(db.players.length, 2);                 // « alice » = « Alice »
  const g = db.games[0];
  assert.equal(db.current, g.id);
  assert.equal(g.status, 'playing');
  assert.equal(g.rounds[0].destroyed, 0);
  assert.deepEqual(totals(SK, g), [20, 10, 10]);      // seule la manche 1 est jouée
  assert.equal(db.prefs.theme, 'dark');
  assert.ok(st.dump[LEGACY_KEY]);                     // ancienne sauvegarde intacte
  // pas de double import au lancement suivant
  assert.equal(createStore(st).load().games.length, 1);
  assert.ok(JSON.parse(st.dump[KEY]).legacyImported);
});

test('Base vide sans ancienne sauvegarde', () => {
  const db = createStore(memStorage()).load();
  assert.deepEqual(db.games, []);
  assert.equal(importLegacy(emptyDb(), null), null);
});

test('Classement : ex æquo au même rang, delta = dernière manche', () => {
  const db = emptyDb();
  const g = newGame(db, ['A', 'B', 'C']);
  g.rounds[0].e[0].bid = 1; g.rounds[0].e[0].tricks = 1;           // A +20, B +10, C +10
  g.cur = 1;
  const r = ranking(SK, g);
  assert.deepEqual(r.map(x => [x.i, x.total, x.rank]), [[0, 20, 1], [1, 10, 2], [2, 10, 2]]);
  g.rounds[1].e[1].bid = 1; g.rounds[1].e[1].tricks = 1;           // B +20, A/C mise 0 réussie +20
  g.cur = 2;
  assert.deepEqual(ranking(SK, g).map(x => [x.i, x.delta]), [[0, 20], [1, 20], [2, 20]]);
  assert.equal(played(g), 2);
});

test('Statistiques joueur : parties terminées seulement, égalité = victoire partagée', () => {
  const db = emptyDb();
  const g1 = newGame(db, ['A', 'B'], 'dodo');
  g1.rounds[0].e[0].bid = 1; g1.rounds[0].e[0].tricks = 1; g1.cur = 1; g1.status = 'done';
  const g2 = newGame(db, ['A', 'B'], 'dodo');
  g2.cur = 1; g2.status = 'done';                                   // 10 – 10 : égalité
  newGame(db, ['A', 'B']);                                          // en cours : ignorée
  const a = db.players.find(p => p.name === 'A').id, b = db.players.find(p => p.name === 'B').id;
  assert.deepEqual(winners(SK, g2), [0, 1]);
  const sa = playerStats(db, getGame, a), sb = playerStats(db, getGame, b);
  assert.equal(sa.played, 2); assert.equal(sa.wins, 2); assert.equal(sa.winRate, 100);
  assert.equal(sb.wins, 1); assert.equal(sb.favorite, 'skull-king');
  assert.equal(recentPlayers(db).length, 2);
});

test('Skull King : pas de Butin à 2 joueurs, formats plafonnés au paquet', () => {
  const db = emptyDb();
  const g = newGame(db, ['A', 'B'], 'classique', { loot: true });
  assert.equal(g.options.loot, false);
  const g8 = newGame(db, ['1', '2', '3', '4', '5', '6', '7', '8']);
  assert.deepEqual(g8.rounds.map(R => R.cards), [1, 2, 3, 4, 5, 6, 7, 8, 8, 8]);
  assert.equal(SK.validateRound(g8, g8.rounds[0]).ok, false);
});
