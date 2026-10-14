/* Module de jeu « Président » (Trou du cul) pour Ardoise.
   À chaque manche, on touche les joueurs dans l'ordre où ils ont posé leur dernière carte :
   les rôles et les points en découlent, et les échanges de cartes de la manche suivante s'affichent. */
import * as P from './scoring.js';
import { RULES_HTML } from './rules-fr.js';
import { esc, avatar, icon, plural } from '../../core/ui.js';

const DECK_OPT = { key: 'deck', label: 'Jeu de cartes', type: 'choice', prominent: true, def: '54',
  choices: [['36', '36 cartes'], ['54', '54 cartes']], desc: o => o.deck === '36' ? 'Jeu de 36 cartes (6 à As) : l’As est la carte la plus forte.' : 'Jeu de 54 cartes : le 2 est la plus forte, les deux jokers au-dessus (ou retirez-les).' };

const REMINDERS = [
  ['revolution', 'Révolution', 'Un carré inverse l’ordre des cartes jusqu’à la fin de la manche.'],
  ['two', 'Le 2 bat tout', 'Un 2 seul bat n’importe quelle combinaison et fait rejouer.', o => o.deck !== '36'],
  ['noTwoEnd', 'Interdit de finir par un 2', 'Celui qui sort sur un 2 devient Trou du cul.', o => o.deck !== '36'],
  ['bombs', 'Bombes', 'Un carré bat n’importe quelle combinaison, même la carte la plus forte.'],
  ['skip', 'Passage de tour', 'Poser la même valeur fait sauter le joueur suivant.'],
  ['suites', 'Suites', 'Les suites (3-4-5…) sont autorisées.']
];
const OPTIONS = [
  { key: 'end', label: 'Fin de partie', type: 'choice', def: 'free',
    choices: [['free', 'Libre'], ['r10', '10 manches'], ['p30', '30 points']],
    desc: o => ({ free: 'Vous arrêtez quand vous voulez avec « Terminer la partie ».', r10: 'La partie s’arrête après 10 manches.', p30: 'Le premier à 30 points gagne.' })[o.end] },
  { key: 'putsch', label: 'Putsch', type: 'toggle', def: false,
    desc: () => 'Le Trou du cul peut refuser l’échange : s’il finit Président il marque n points, sinon il perd 1 point.' },
  DECK_OPT,
  ...REMINDERS.map(([key, label, d, when]) => ({ key, label, type: 'toggle', def: false, when, desc: () => d }))
];

function orderList(game, R, p, names, totals) {
  const n = names.length, pl = P.places(R, n);
  return `<ul class="card list">${names.map((nm, i) => {
    const k = pl[i];
    const role = k === null ? '' : `${k + 1} · ${P.ROLE_LABEL[P.roleOf(k, n)]}`;
    return `<li><button class="row" data-act="pr.tap" data-p="${p}" data-i="${i}" aria-pressed="${k !== null}">
      ${avatar(nm, k === 0 ? 'lead' : '')}
      <span class="row-txt"><span class="row-t">${esc(nm)}</span><span class="row-s">${role || (totals ? `Total ${totals[i]}` : 'Toucher pour classer')}</span></span>
      <span class="place ${k === null ? '' : 'on'}" aria-hidden="true">${k === null ? '' : k + 1}</span></button></li>`;
  }).join('')}</ul>`;
}

function statusOf(game, R) {
  const c = P.checkRound(R, game.playerIds.length);
  return c.ok ? { ok: true, html: `${icon('check', 18)}<span>Classement complet</span>` } : { ok: false, html: `${icon('alert', 18)}<span>${c.msg}</span>` };
}

function putschChip(game, R, p, names) {
  if (!game.options.putsch) return '';
  const prev = game.rounds[(p === 'ed' ? null : game.cur) - 1];
  const n = names.length;
  const tdc = prev && prev.order.length === n ? prev.order[n - 1] : null;
  if (tdc === null || tdc === undefined) return '';
  return `<div class="row-extra" style="padding-left:0"><button class="chip ${R.putsch === tdc ? 'on' : ''}" data-act="pr.putsch" data-p="${p}" data-i="${tdc}" aria-pressed="${R.putsch === tdc}">Putsch de ${esc(names[tdc])}</button></div>`;
}

export default {
  id: 'president',
  name: 'Président',
  tagline: 'Trou du cul · 3 à 10 joueurs',
  players: { min: 3, max: 10 },
  winner: 'highest',
  formats: [],
  options: OPTIONS,
  rulesHtml: RULES_HTML,
  manualEnd: game => game.options.end === 'free',

  defaultOptions() { return Object.fromEntries(OPTIONS.map(o => [o.key, o.def])); },
  visibleOptions(o, n) { return OPTIONS.filter(d => !d.when || d.when(o, n)); },
  optionsSummary(o) {
    const end = { free: 'Partie libre', r10: '10 manches', p30: '30 points' }[o.end || 'free'];
    const on = OPTIONS.filter(d => d.type === 'toggle' && o[d.key] && (!d.when || d.when(o))).map(d => d.label);
    return [end, ...on].join(' · ');
  },

  setup(game) { game.rounds = [P.makeRound()]; game.cur = 0; return game; },
  prepareRound(game) { while (game.rounds.length <= game.cur) game.rounds.push(P.makeRound()); },
  isOver(game) {
    const n = Math.min(game.cur, game.rounds.length);
    if (game.options.end === 'r10') return n >= 10;
    if (game.options.end === 'p30') {
      const t = game.playerIds.map(() => 0);
      for (let r = 0; r < n; r++) P.roundPoints(game.rounds[r], game.playerIds.length, game.options).forEach((v, i) => { t[i] += v; });
      return t.some(v => v >= 30);
    }
    return false;
  },
  roundPoints(game, r) { return P.roundPoints(game.rounds[r], game.playerIds.length, game.options); },
  validateRound(game, R) { return P.checkRound(R, game.playerIds.length); },
  roundHead(game, r) { return { label: `M${r + 1}`, sub: '', long: '' }; },
  progress(game, totals) {
    const o = game.options;
    if (o.end === 'r10') return { total: 10, label: `Manche ${Math.min(game.cur + 1, 10)} sur 10` };
    if (o.end === 'p30') { const max = Math.max(0, ...(totals || [0])); return { total: 30, ratio: Math.min(1, max / 30), label: `Manche ${game.cur + 1} · ${max} / 30 points` }; }
    return { total: null, ratio: null, label: `Manche ${game.cur + 1}` };
  },
  nextLabel(game) { return `Manche ${game.cur + 1}`; },
  endStats(game, names) {
    const n = game.playerIds.length, pres = names.map(() => 0), tdc = names.map(() => 0);
    game.rounds.forEach(R => { if (R.order.length === n) { pres[R.order[0]]++; tdc[R.order[n - 1]]++; } });
    const best = pres.indexOf(Math.max(...pres)), worst = tdc.indexOf(Math.max(...tdc));
    return [
      { v: game.rounds.length, l: game.rounds.length > 1 ? 'manches' : 'manche' },
      { v: pres[best], l: `fois Président · ${esc(names[best])}` },
      { v: tdc[worst], l: `fois Trou du cul · ${esc(names[worst])}` }
    ];
  },

  roundScreen(api, game) {
    const R = game.rounds[game.cur], names = api.names(game), n = names.length;
    const ex = R.putsch !== null && R.putsch !== undefined ? ['Putsch : pas d’échange de cartes cette manche'] : P.exchanges(game.rounds[game.cur - 1], n, names);
    const rules = REMINDERS.filter(([k, , , when]) => game.options[k] && (!when || when(game.options))).map(([, l]) => l);
    rules.unshift(game.options.deck === '36' ? '36 cartes, As le plus fort' : '54 cartes');
    const st = statusOf(game, R);
    return {
      title: `Manche ${game.cur + 1}`,
      sub: game.cur === 0 ? 'Première manche : elle fixe la hiérarchie' : plural(n, 'joueur', 'joueurs'),
      right: `<button class="icon-btn" data-act="rules" data-game="president" aria-label="Règles">${icon('book')}</button>`,
      body: `${ex.length ? `<section class="section"><h2 class="label">Échanges de cartes</h2><div class="note">${ex.map(esc).join('<br>')}</div></section>` : ''}
        ${rules.length ? `<p class="hint">Règles de la table : ${rules.map(esc).join(' · ')}</p>` : ''}
        <section class="section"><div class="section-h"><h2 class="label">Ordre d’arrivée</h2>
          ${R.order.length ? '<button class="link" data-act="pr.clear" data-p="pr">Effacer</button>' : ''}</div>
          <p class="hint">Touchez les joueurs dans l’ordre où ils ont fini.</p>
          ${orderList(game, R, 'pr', names, api.totals(game))}${putschChip(game, R, 'pr', names)}</section>`,
      bar: `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="pr-tally" role="status">${st.html}</div>
        <button class="btn btn-primary" data-act="pr.validate">Valider la manche</button>`
    };
  },
  editorBody(api, game, draft) {
    const names = api.names(game);
    return {
      body: `<div class="section-h"><p class="hint">Touchez les joueurs dans l’ordre où ils ont fini.</p><button class="link" data-act="pr.clear" data-p="ed">Effacer</button></div>${orderList(game, draft.round, 'ed', names)}`,
      status: statusOf(game, draft.round)
    };
  },

  actions(api) {
    const g = () => api.game();
    const roundOf = p => (p === 'ed' ? api.draft().round : g().rounds[g().cur]);
    const redraw = p => { if (p === 'ed') api.editorRefresh(); else { api.save(); api.render(); } };
    return {
      'pr.tap': d => {
        const R = roundOf(d.p), i = +d.i, n = g().playerIds.length;
        const at = R.order.indexOf(i);
        if (at >= 0) R.order.splice(at, 1);           // retoucher un joueur le retire du classement
        else {
          R.order.push(i);
          if (R.order.length === n - 1) {                // le dernier restant est forcément Trou du cul
            const last = Array.from({ length: n }, (_, k) => k).find(k => !R.order.includes(k));
            R.order.push(last);
          }
        }
        redraw(d.p);
      },
      'pr.clear': d => { roundOf(d.p).order = []; redraw(d.p); },
      'pr.putsch': d => { const R = roundOf(d.p); R.putsch = R.putsch === +d.i ? null : +d.i; redraw(d.p); },
      'pr.validate': () => {
        const R = g().rounds[g().cur], v = P.checkRound(R, g().playerIds.length);
        if (!v.ok) { api.toast(v.msg); api.shake('pr-tally'); return; }
        api.finishRound(g());
      }
    };
  }
};
