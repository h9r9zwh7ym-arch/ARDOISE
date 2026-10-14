/* Module de jeu « Blackjack » pour Ardoise : suivi des jetons de chaque joueur face au croupier.
   À chaque manche : la mise et le résultat de chaque main (doublé, séparé, abandon, assurance). */
import * as B from './scoring.js';
import { RULES_HTML } from './rules-fr.js';
import { esc, sign, avatar, segmented, icon, stepper } from '../../core/ui.js';

const OPTIONS = [
  { key: 'bank', label: 'Jetons au départ', type: 'choice', def: '1000',
    choices: [['100', '100'], ['500', '500'], ['1000', '1000']], desc: () => 'Chaque joueur commence avec ce nombre de jetons.' },
  { key: 'payout', label: 'Paiement du blackjack', type: 'choice', def: '3:2',
    choices: [['3:2', '3 pour 2'], ['6:5', '6 pour 5']], desc: o => (o.payout === '6:5' ? 'Table en 6:5 : un blackjack sur 10 jetons rapporte 12.' : 'Paiement classique : un blackjack sur 10 jetons rapporte 15.') },
  { key: 'surrender', label: 'Abandon autorisé', type: 'toggle', def: false, desc: () => 'Le joueur peut abandonner et récupérer la moitié de sa mise.' },
  { key: 'insurance', label: 'Assurance', type: 'toggle', def: false, desc: () => 'Quand le croupier montre un as : moitié de la mise, payée 2:1 s’il a un blackjack.' }
];
const DEFAULT_BET = 10;
const QUICK_BETS = [10, 25, 50, 100];
const fmt = v => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));
const fmtSign = v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v));
const MAIN_RESULTS = [['lose', 'Perdu'], ['push', 'Égalité'], ['win', 'Gagné'], ['bj', 'Blackjack']];
const more = new Set();   // joueurs dont les options avancées sont dépliées (« Plus d'options »)

/* Étape 1 · Mises */
function betRow(game, R, i, name, p, bank) {
  const bet = R.e[i].hands[0].bet || 0;
  return `<li class="prow"><div class="prow-main">${avatar(name)}
    <div class="prow-txt"><span class="prow-n">${esc(name)}</span><span class="prow-s">${bank !== undefined ? `${fmt(bank)} jetons` : ''}${bet ? '' : ' · ne joue pas'}</span></div>
    ${stepper({ value: bet, act: 'bj.betStep', data: { p, i }, label: `Mise de ${name}`, max: 100000 })}</div>
    <div class="row-extra bet-quick">${QUICK_BETS.map(v => `<button class="chip ${bet === v ? 'on' : 'add'}" data-act="bj.betSet" data-p="${p}" data-i="${i}" data-v="${v}">${v}</button>`).join('')}
      <button class="chip ${bet === 0 ? 'on' : ''}" data-act="bj.betSet" data-p="${p}" data-i="${i}" data-v="0">Passe</button></div></li>`;
}

/* Étape 2 · Résultats */
function resultGrid(game, hd, p, i, k) {
  const o = game.options;
  const opts = [...MAIN_RESULTS, ...(o.surrender ? [['surrender', 'Abandon']] : [])];
  return `<div class="res-grid">${opts.map(([v, l]) => {
    const gain = B.handNet({ ...hd, result: v }, o);
    return `<button class="res ${hd.result === v ? 'on' : ''} res-${v}" data-act="bj.result" data-p="${p}" data-i="${i}" data-h="${k}" data-v="${v}" aria-pressed="${hd.result === v}">
      <b>${l}</b><small>${gain === 0 ? 'mise rendue' : fmtSign(gain)}</small></button>`;
  }).join('')}</div>`;
}
function resultRow(game, R, i, name, p) {
  const e = R.e[i], o = game.options, bet = e.hands[0].bet || 0;
  if (bet <= 0) return `<li class="prow"><div class="prow-main">${avatar(name)}<div class="prow-txt"><span class="prow-n">${esc(name)}</span><span class="prow-s">Ne joue pas cette manche</span></div></div></li>`;
  const done = e.hands.every(h => h.result), net = B.entryNet(e, R.dealerBJ, o);
  const open = more.has(`${p}${i}`) || e.hands.length > 1 || e.hands.some(h => h.doubled) || e.insurance;
  let h = `<li class="prow"><div class="prow-main">${avatar(name)}
    <div class="prow-txt"><span class="prow-n">${esc(name)}</span><span class="prow-s">Mise ${bet}${e.hands.length > 1 ? ` · ${e.hands.length} mains` : ''}</span></div>
    <span class="pts ${done ? (net > 0 ? 'pos' : net < 0 ? 'neg' : '') : ''}">${done ? fmtSign(net) : '—'}</span></div>`;
  e.hands.forEach((hd, k) => {
    h += `<div class="hand">${e.hands.length > 1 ? `<div class="hand-h"><span class="hand-l">Main ${k + 1}</span>${k > 0 ? `<button class="link" data-act="bj.unsplit" data-p="${p}" data-i="${i}" data-h="${k}">Retirer</button>` : ''}</div>` : ''}
      ${resultGrid(game, hd, p, i, k)}
      ${open ? `<div class="hand-opts"><button class="chip ${hd.doubled ? 'on' : ''}" data-act="bj.double" data-p="${p}" data-i="${i}" data-h="${k}" aria-pressed="${hd.doubled}">Mise doublée</button></div>` : ''}</div>`;
  });
  h += open
    ? `<div class="row-extra">${e.hands.length < 4 ? `<button class="chip add" data-act="bj.split" data-p="${p}" data-i="${i}">Séparer en ${e.hands.length + 1} mains</button>` : ''}
        ${o.insurance ? `<button class="chip ${e.insurance ? 'on' : ''}" data-act="bj.ins" data-p="${p}" data-i="${i}" aria-pressed="${e.insurance}">Assurance (${fmt(bet / 2)})</button>` : ''}</div>`
    : `<div class="row-extra"><button class="disclose" style="width:auto;margin:0" data-act="bj.more" data-p="${p}" data-i="${i}" aria-expanded="false">Plus d’options : doubler, séparer${o.insurance ? ', assurance' : ''}<span>${icon('chevron', 16)}</span></button></div>`;
  return h + '</li>';
}
function dealerRow(game, R, p) {
  if (!(game.options.insurance && R.e.some(e => e.insurance))) return '';
  return `<div class="card row-card dashed"><div class="prow-txt"><span class="prow-n">Le croupier avait un blackjack ?</span><span class="prow-s">Pour payer les assurances</span></div>
    ${segmented([[false, 'Non'], [true, 'Oui']], !!R.dealerBJ, 'bj.dealer', 'Blackjack du croupier', { p })}</div>`;
}
function statusOf(game, R) {
  const c = B.checkRound(R);
  if (!c.ok) return { ok: false, html: `${icon('alert', 18)}<span>${c.msg}</span>` };
  const total = Math.round(B.roundNets(R, game.options).reduce((a, b) => a + b, 0) * 10) / 10;
  return { ok: true, html: `${icon('check', 18)}<span>${total >= 0 ? `Les joueurs gagnent ${fmt(total)}` : `Le croupier gagne ${fmt(-total)}`} jetons</span>` };
}
function betStatus(R) {
  const n = R.e.filter(e => (e.hands[0].bet || 0) > 0).length;
  return n ? { ok: true, html: `${icon('check', 18)}<span>${n} joueur${n > 1 ? 's' : ''} en jeu · ${R.e.reduce((s, e) => s + (e.hands[0].bet || 0), 0)} jetons misés</span>` }
    : { ok: false, html: `${icon('alert', 18)}<span>Aucune mise</span>` };
}

export default {
  id: 'blackjack',
  name: 'Blackjack',
  tagline: 'Jetons face au croupier · 1 à 7 joueurs',
  players: { min: 1, max: 7 },
  winner: 'highest',
  formats: [],
  options: OPTIONS,
  rulesHtml: RULES_HTML,
  manualEnd: true,
  unit: n => (Math.abs(n) > 1 ? 'jetons' : 'jeton'),
  roundsLabel: n => `${n} main${n > 1 ? 's' : ''}`,

  defaultOptions() { return Object.fromEntries(OPTIONS.map(o => [o.key, o.def])); },
  visibleOptions() { return OPTIONS; },
  optionsSummary(o) {
    return [`${o.bank || 1000} jetons`, `blackjack ${o.payout || '3:2'}`, o.surrender && 'abandon', o.insurance && 'assurance'].filter(Boolean).join(' · ');
  },

  setup(game) { game.rounds = [B.makeRound(game.playerIds.map(() => DEFAULT_BET))]; game.cur = 0; game.step = 'bets'; return game; },
  /** Nouvelle manche : chacun reprend sa mise précédente. */
  prepareRound(game) {
    while (game.rounds.length <= game.cur) {
      const prev = game.rounds[game.rounds.length - 1];
      game.rounds.push(B.makeRound(prev.e.map(e => e.hands[0].bet || DEFAULT_BET)));
    }
  },
  isOver() { return false; },
  roundPoints(game, r) { return B.roundNets(game.rounds[r], game.options); },
  /** Le total d'un joueur = ses jetons de départ + ses gains et pertes. */
  finalize(game, t) { const bank = +game.options.bank || 1000; return t.map(v => Math.round((v + bank) * 10) / 10); },
  validateRound(game, R) { return B.checkRound(R); },
  roundHead(game, r) { return { label: `M${r + 1}`, sub: '', long: '' }; },
  progress(game) { return { total: null, ratio: null, label: `Manche ${game.cur + 1} · départ ${game.options.bank || 1000} jetons` }; },
  nextLabel(game) { return `Manche ${game.cur + 1}`; },
  endStats(game, names) {
    let best = { v: -Infinity }, bjs = 0;
    game.rounds.forEach(R => {
      B.roundNets(R, game.options).forEach((v, i) => { if (v > best.v) best = { v, who: names[i] }; });
      R.e.forEach(e => e.hands.forEach(h => { if (h.result === 'bj') bjs++; }));
    });
    return [
      { v: game.rounds.length, l: game.rounds.length > 1 ? 'manches' : 'manche' },
      { v: best.v === -Infinity ? '—' : sign(best.v), l: `meilleure manche · ${esc(best.who || '')}` },
      { v: bjs, l: bjs > 1 ? 'blackjacks' : 'blackjack' }
    ];
  },

  roundScreen(api, game) {
    const R = game.rounds[game.cur], names = api.names(game), step = game.step === 'results' ? 'results' : 'bets';
    const head = `<div class="steps">${segmented([['bets', '1 · Mises'], ['results', '2 · Résultats']], step, 'bj.step', 'Étape')}</div>`;
    const right = `<button class="icon-btn" data-act="rules" data-game="blackjack" aria-label="Règles">${icon('book')}</button>`;
    if (step === 'bets') {
      const st = betStatus(R);
      return {
        title: `Manche ${game.cur + 1}`, sub: 'Les mises avant la distribution', right,
        body: `${head}<ul class="card list">${names.map((n, i) => betRow(game, R, i, n, 'bj', api.totals(game)[i])).join('')}</ul>`,
        bar: `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="bj-tally" role="status">${st.html}</div>
          <button class="btn btn-primary" data-act="bj.step" data-v="results" ${st.ok ? '' : 'disabled'}>Cartes distribuées : résultats ${icon('next', 20)}</button>`
      };
    }
    const st = statusOf(game, R);
    return {
      title: `Manche ${game.cur + 1}`, sub: `Blackjack payé ${game.options.payout || '3:2'}`, right,
      body: `${head}${dealerRow(game, R, 'bj')}<ul class="card list">${names.map((n, i) => resultRow(game, R, i, n, 'bj')).join('')}</ul>`,
      bar: `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="bj-tally" role="status">${st.html}</div>
        <button class="btn btn-primary" data-act="bj.validate">Valider la manche</button>`
    };
  },
  editorBody(api, game, draft) {
    const R = draft.round, names = api.names(game);
    return {
      body: `<h3 class="label">Mises</h3><ul class="card list">${names.map((n, i) => betRow(game, R, i, n, 'ed')).join('')}</ul>
        <h3 class="label">Résultats</h3>${dealerRow(game, R, 'ed')}<ul class="card list">${names.map((n, i) => resultRow(game, R, i, n, 'ed')).join('')}</ul>`,
      status: statusOf(game, R)
    };
  },

  actions(api) {
    const g = () => api.game();
    const roundOf = p => (p === 'ed' ? api.draft().round : g().rounds[g().cur]);
    const redraw = p => { if (p === 'ed') api.editorRefresh(); else { api.save(); api.render(); } };
    const setBet = (p, i, v) => { roundOf(p).e[i].hands.forEach(h => { h.bet = Math.max(0, Math.min(100000, v)); }); redraw(p); };
    return {
      'bj.step': d => { g().step = d.v; api.save(); api.render(true); },
      'bj.betStep': d => { const e = roundOf(d.p).e[+d.i]; setBet(d.p, +d.i, (e.hands[0].bet || 0) + 5 * +d.d); },
      'bj.betSet': d => setBet(d.p, +d.i, +d.v),
      'bj.more': d => { more.add(`${d.p}${d.i}`); redraw(d.p); },
      'bj.result': d => { roundOf(d.p).e[+d.i].hands[+d.h].result = d.v; redraw(d.p); },
      'bj.double': d => { const h = roundOf(d.p).e[+d.i].hands[+d.h]; h.doubled = !h.doubled; redraw(d.p); },
      'bj.split': d => { const e = roundOf(d.p).e[+d.i]; e.hands.push(B.newHand(e.hands[0].bet)); redraw(d.p); },
      'bj.unsplit': d => { roundOf(d.p).e[+d.i].hands.splice(+d.h, 1); redraw(d.p); },
      'bj.ins': d => { const e = roundOf(d.p).e[+d.i]; e.insurance = !e.insurance; redraw(d.p); },
      'bj.dealer': d => { roundOf(d.p).dealerBJ = d.v === 'true'; redraw(d.p); },
      'bj.validate': () => {
        const R = g().rounds[g().cur], v = B.checkRound(R);
        if (!v.ok) { api.toast(v.msg); api.shake('bj-tally'); return; }
        g().step = 'bets'; more.clear();
        api.finishRound(g());
      }
    };
  }
};
