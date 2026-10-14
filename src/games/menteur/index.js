/* Module de jeu « Menteur » pour Ardoise.
   À la fin de chaque manche, on note les cartes restées en main : le joueur sans carte a gagné
   la manche, celui qui en a le plus l'a perdue. Le plus petit total gagne la partie. */
import * as M from './scoring.js';
import { RULES_HTML } from './rules-fr.js';
import { esc, avatar, icon, stepper } from '../../core/ui.js';

const DECK_OPT = { key: 'deck', label: 'Jeu de cartes', type: 'choice', prominent: true, def: '54',
  choices: [['36', '36 cartes'], ['54', '54 cartes']], desc: o => o.deck === '36' ? 'Jeu de 36 cartes : à beaucoup de joueurs, mélangez deux jeux.' : 'Jeu de 54 cartes : retirez les jokers, ou gardez-les comme cartes libres.' };
const OPTIONS = [
  DECK_OPT,
  { key: 'end', label: 'Fin de partie', type: 'choice', def: 'free',
    choices: [['free', 'Libre'], ['r5', '5 manches'], ['r10', '10 manches']],
    desc: o => ({ free: 'Vous arrêtez quand vous voulez avec « Terminer la partie ».', r5: 'La partie s’arrête après 5 manches.', r10: 'La partie s’arrête après 10 manches.' })[o.end] }
];
const LIMIT = { r5: 5, r10: 10 };

function rows(game, R, p, names, totals) {
  const w = M.roundWinner(R), losers = M.checkRound(R).ok ? M.roundLosers(R) : [];
  return `<ul class="card list">${names.map((n, i) => {
    const v = R.left[i];
    const sub = w === i ? '<b class="pos">Gagnant</b>' : losers.includes(i) ? 'Perdant' : (totals ? `Total ${totals[i]}` : '');
    return `<li class="prow"><div class="prow-main">${avatar(n, w === i ? 'lead' : '')}
      <div class="prow-txt"><span class="prow-n">${esc(n)}</span><span class="prow-s">${sub}</span></div>
      ${stepper({ value: v || 0, act: 'me.step', data: { p, i }, label: `Cartes de ${n}`, max: M.MAX_CARDS })}</div></li>`;
  }).join('')}</ul>`;
}
function statusOf(R) {
  const c = M.checkRound(R);
  return c.ok ? { ok: true, html: `${icon('check', 18)}<span>Manche complète</span>` } : { ok: false, html: `${icon('alert', 18)}<span>${c.msg}</span>` };
}

export default {
  id: 'menteur',
  name: 'Menteur',
  tagline: 'Le bluff · le moins de cartes gagne',
  players: { min: 2, max: 10 },
  winner: 'lowest',
  formats: [],
  options: OPTIONS,
  rulesHtml: RULES_HTML,
  manualEnd: game => game.options.end === 'free',
  unit: n => (Math.abs(n) > 1 ? 'cartes' : 'carte'),

  defaultOptions() { return { end: 'free', deck: '54' }; },
  visibleOptions() { return OPTIONS; },
  optionsSummary(o) { return { free: 'Partie libre', r5: '5 manches', r10: '10 manches' }[o.end || 'free']; },

  setup(game) { game.rounds = [M.makeRound(game.playerIds.length)]; game.cur = 0; return game; },
  prepareRound(game) { while (game.rounds.length <= game.cur) game.rounds.push(M.makeRound(game.playerIds.length)); },
  isOver(game) { const l = LIMIT[game.options.end]; return !!l && Math.min(game.cur, game.rounds.length) >= l; },
  roundPoints(game, r) { return M.roundPoints(game.rounds[r]); },
  validateRound(game, R) { return M.checkRound(R); },
  roundHead(game, r) { return { label: `M${r + 1}`, sub: '', long: '' }; },
  progress(game) {
    const l = LIMIT[game.options.end];
    return l ? { total: l, label: `Manche ${Math.min(game.cur + 1, l)} sur ${l}` } : { total: null, ratio: null, label: `Manche ${game.cur + 1}` };
  },
  nextLabel(game) { return `Manche ${game.cur + 1}`; },
  endStats(game, names) {
    const wins = names.map(() => 0);
    game.rounds.forEach(R => { const w = M.roundWinner(R); if (w !== null) wins[w]++; });
    const best = wins.indexOf(Math.max(...wins));
    const worst = Math.max(0, ...game.rounds.flatMap(R => M.roundPoints(R)));
    return [
      { v: game.rounds.length, l: game.rounds.length > 1 ? 'manches' : 'manche' },
      { v: wins[best], l: `manches gagnées · ${esc(names[best])}` },
      { v: worst, l: 'cartes, pire fin de manche' }
    ];
  },

  roundScreen(api, game) {
    const R = game.rounds[game.cur], names = api.names(game), st = statusOf(R);
    return {
      title: `Manche ${game.cur + 1}`, sub: 'Cartes restées en main',
      right: `<button class="icon-btn" data-act="rules" data-game="menteur" aria-label="Règles">${icon('book')}</button>`,
      body: `<p class="hint">Le gagnant reste à 0 : comptez les cartes restées en main des autres.</p>${rows(game, R, 'me', names, api.totals(game))}`,
      bar: `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="me-tally" role="status">${st.html}</div>
        <button class="btn btn-primary" data-act="me.validate">Valider la manche</button>`
    };
  },
  editorBody(api, game, draft) {
    return { body: rows(game, draft.round, 'ed', api.names(game)), status: statusOf(draft.round) };
  },

  actions(api) {
    const g = () => api.game();
    const roundOf = p => (p === 'ed' ? api.draft().round : g().rounds[g().cur]);
    const redraw = p => { if (p === 'ed') api.editorRefresh(); else { api.save(); api.render(); } };
    return {
      'me.step': d => { const R = roundOf(d.p), i = +d.i; R.left[i] = Math.max(0, Math.min(M.MAX_CARDS, (R.left[i] || 0) + +d.d)); redraw(d.p); },
      'me.validate': () => {
        const R = g().rounds[g().cur], v = M.checkRound(R);
        if (!v.ok) { api.toast(v.msg); api.shake('me-tally'); return; }
        api.finishRound(g());
      }
    };
  }
};
