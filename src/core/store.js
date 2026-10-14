/* Persistance d'Ardoise : un seul objet JSON dans localStorage.
   Aucun total n'est stocké : tout se recalcule à partir des manches. */

export const KEY = 'ardoise.v1';
export const LEGACY_KEY = 'skullking.v3';   // ancienne app Skull King
export const LEGACY_DARK_KEY = 'sk.dark';

export function emptyDb() {
  return { schema: 1, players: [], games: [], current: null, prefs: { theme: 'auto' }, legacyImported: false };
}

let seq = 0;
export function uid(prefix) {
  seq = (seq + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${seq.toString(36)}`;
}

export function normName(s) {
  return String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
}

/** Retrouve un joueur par son nom (sans tenir compte de la casse) ou le crée. */
export function playerByName(db, name, now = Date.now()) {
  const n = normName(name);
  const found = db.players.find(p => p.name.toLowerCase() === n.toLowerCase());
  if (found) return found;
  const p = { id: uid('p'), name: n, createdAt: now };
  db.players.push(p);
  return p;
}

/** Reprend la partie de l'ancienne app (clé skullking.v3) dans le nouveau format. */
export function importLegacy(db, legacy, now = Date.now()) {
  if (!legacy || !Array.isArray(legacy.players) || !Array.isArray(legacy.rounds) || !legacy.rounds.length) return null;
  const players = legacy.players.map((n, i) => playerByName(db, normName(n) || `Joueur ${i + 1}`, now));
  const done = !!legacy.done;
  const game = {
    id: uid('g'),
    gameId: 'skull-king',
    status: done ? 'done' : 'playing',
    startedAt: legacy.started || now,
    endedAt: done ? now : null,
    playerIds: players.map(p => p.id),
    format: legacy.mode || 'classique',
    options: {
      scoring: legacy.scoring === 'rascal' ? 'rascal' : 'sk',
      cannonball: !!legacy.cannonball, wager: !!legacy.wager, loot: !!legacy.loot,
      kraken: !!legacy.kraken, whale: !!legacy.whale
    },
    rounds: legacy.rounds.map(R => ({ ...R, destroyed: R.destroyed || 0 })),
    cur: done ? legacy.rounds.length : Math.min(legacy.cur || 0, legacy.rounds.length),
    dealer: legacy.dealer || 0,
    step: 'bid'
  };
  db.games.push(game);
  if (!done) db.current = game.id;
  return game;
}

export function migrate(raw) {
  const db = Object.assign(emptyDb(), raw || {});
  db.prefs = Object.assign({ theme: 'auto' }, db.prefs || {});
  db.players = db.players || [];
  db.games = db.games || [];
  return db;
}

/** storage : objet compatible localStorage (injecté pour les tests). */
export function createStore(storage) {
  const get = k => { try { return storage.getItem(k); } catch (e) { return null; } };
  const parse = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  return {
    load() {
      const db = migrate(parse(get(KEY)));
      if (!db.legacyImported) {
        const legacy = parse(get(LEGACY_KEY));
        if (legacy) importLegacy(db, legacy);
        if (get(LEGACY_DARK_KEY) === '1' && db.prefs.theme === 'auto') db.prefs.theme = 'dark';
        db.legacyImported = true;   // l'ancienne clé est conservée intacte, par sécurité
        this.save(db);
      }
      return db;
    },
    save(db) {
      try { storage.setItem(KEY, JSON.stringify(db)); return true; } catch (e) { return false; }
    }
  };
}
