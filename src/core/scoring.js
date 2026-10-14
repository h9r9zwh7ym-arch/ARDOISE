/* Calculs communs à tous les jeux : totaux, classement, statistiques.
   Un module de jeu fournit roundPoints(game, r) → points de chaque joueur pour la manche r. */

/** Nombre de manches validées (une partie terminée les compte toutes). */
export function played(game) {
  return game.status === 'done' ? game.rounds.length : Math.min(game.cur, game.rounds.length);
}

export function totals(mod, game, upto = played(game)) {
  const t = game.playerIds.map(() => 0);
  for (let r = 0; r < Math.min(upto, game.rounds.length); r++) {
    mod.roundPoints(game, r).forEach((p, i) => { t[i] += p; });
  }
  return mod.finalize ? mod.finalize(game, t, upto) : t;
}

/**
 * Classement : [{ i, total, delta, rank }] trié du meilleur au moins bon.
 * Les ex æquo partagent le même rang. delta = points de la dernière manche jouée.
 */
export function ranking(mod, game) {
  const n = played(game);
  const t = totals(mod, game, n);
  const prev = n > 0 ? totals(mod, game, n - 1) : t.map(() => 0);
  const better = mod.winner === 'lowest' ? (a, b) => a - b : (a, b) => b - a;
  const rows = t.map((total, i) => ({ i, total, delta: total - prev[i] })).sort((a, b) => better(a.total, b.total) || a.i - b.i);
  rows.forEach((r, k) => { r.rank = k > 0 && r.total === rows[k - 1].total ? rows[k - 1].rank : k + 1; });
  return rows;
}

/** Index des gagnants d'une partie terminée (plusieurs en cas d'égalité). */
export function winners(mod, game) {
  return ranking(mod, game).filter(r => r.rank === 1).map(r => r.i);
}

/** Statistiques d'un joueur sur toutes les parties terminées. getMod(gameId) → module. */
export function playerStats(db, getMod, playerId) {
  const s = { played: 0, wins: 0, byGame: {}, lastPlayed: null };
  for (const g of db.games) {
    const i = g.playerIds.indexOf(playerId);
    const mod = getMod(g.gameId);
    if (i < 0 || g.status !== 'done' || !mod) continue;
    const bg = s.byGame[g.gameId] || (s.byGame[g.gameId] = { played: 0, wins: 0 });
    s.played++; bg.played++;
    if (winners(mod, g).includes(i)) { s.wins++; bg.wins++; }
    s.lastPlayed = Math.max(s.lastPlayed || 0, g.endedAt || g.startedAt || 0);
  }
  s.winRate = s.played ? Math.round(s.wins / s.played * 100) : 0;
  s.favorite = Object.keys(s.byGame).sort((a, b) => s.byGame[b].played - s.byGame[a].played)[0] || null;
  return s;
}

/** Joueurs triés par dernière apparition (les habitués en premier). */
export function recentPlayers(db) {
  const last = {};
  for (const g of db.games) for (const id of g.playerIds) last[id] = Math.max(last[id] || 0, g.startedAt || 0);
  return db.players.slice().sort((a, b) => (last[b.id] || b.createdAt || 0) - (last[a.id] || a.createdAt || 0));
}
