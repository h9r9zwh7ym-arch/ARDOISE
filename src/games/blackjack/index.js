/* Module de jeu « Blackjack » pour Ardoise : suivi des jetons de chaque joueur face au croupier.
   À chaque manche : la mise et le résultat de chaque main (doublé, séparé, abandon, assurance). */
import * as B from './scoring.js';
import { RULES_HTML } from './rules-fr.js';
import { esc, sign, avatar, segmented, icon, numField } from '../../core/ui.js';

const OPTIONS = [
  { key: 'bank', label: 'Jetons au départ', type: 'choice', def: '1000',
    choices: [['100', '100'], ['500', '500'], ['1000', '1000']], desc: () => 'Chaque joueur commence avec ce nombre de jetons.' },
  { key: 'payout', label: 'Paiement du blackjack', type: 'choice', def: '3:2',
    choices: [['3:2', '3 pour 2'], ['6:5', '6 pour 5']], desc: o => (o.payout === '6:5' ? 'Table en 6:5 : un blackjack sur 10 jetons rapporte 12.' : 'Paiement classique : un blackjack sur 10 jetons rapporte 15.') },
  { key: 'surrender', label: 'Abandon autorisé', type: 'toggle', def: false, desc: () => 'Le joueur peut abandonner et récupérer la moitié de sa mise.' },
  { key: 'insurance', label: 'Assurance', type: 'toggle', def: false, desc: () => 'Quand le croupier montre un as : moitié de la mise, payée 2:1 s’il a un blackjack.' }
];
const DEFAULT_BET = 10;
const fmt = v => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));
const results = o => B.RESULTS.filter(([k]) => k !== 'surrender' || o.surrender);

function playerBlock(game, R, i, name, p, bank) {
  const e = R.e[i], o = game.options, bet = e.hands[0].bet || 0;
  const net = B.entryNet(e, R.dealerBJ, o);
  let h = `<li class="prow"><div class="prow-main">${avatar(name)}
    <div class="prow-txt"><span class="prow-n">${esc(name)}</span>
      <span class="prow-s" id="${p}s${i}">${bank !== undefined ? `${fmt(bank)} jetons` : ''}${bet > 0 && e.hands.every(x => x.result) ? ` · <b class="${net >= 0 ? 'pos' : 'neg'}">${sign(net)}</b>` : ''}</span></div>
    <span class="bet-l">Mise</span>${numField({ id: `${p}bet${i}`, value: bet, input: 'bj.bet', data: { p, i }, label: `Mise de ${name}` })}</div>`;
  if (bet <= 0) return h + `<p class="hint row-extra">Ne joue pas cette manche.</p></li>`;
  e.hands.forEach((hd, k) => {
    h += `<div class="row-extra hand">
      ${e.hands.length > 1 ? `<span class="hand-l">Main ${k + 1}</span>` : ''}
      <div class="seg wrap">${results(o).map(([v, l]) => `<button class="seg-i ${hd.result === v ? 'on' : ''}" role="radio" aria-checked="${hd.result === v}" data-act="bj.result" data-p="${p}" data-i="${i}" data-h="${k}" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="hand-opts"><button class="chip ${hd.doubled ? 'on' : ''}" data-act="bj.double" data-p="${p}" data-i="${i}" data-h="${k}" aria-pressed="${hd.doubled}">Doublé</button>
      ${k > 0 ? `<button class="chip" data-act="bj.unsplit" data-p="${p}" data-i="${i}" data-h="${k}">Retirer la main</button>` : ''}</div></div>`;
  });
  h += `<div class="row-extra">${e.hands.length < 4 ? `<button class="chip add" data-act="bj.split" data-p="${p}" data-i="${i}">Séparer (split)</button>` : ''}
    ${o.insurance ? `<button class="chip ${e.insurance ? 'on' : ''}" data-act="bj.ins" data-p="${p}" data-i="${i}" aria-pressed="${e.insurance}">Assurance</button>` : ''}</div></li>`;
  return h;
}
function body(game, R, p, names, banks) {
  const ins = game.options.insurance && R.e.some(e => e.insurance);
  return `${ins ? `<div class="card row-card dashed"><div class="prow-txt"><span class="prow-n">Le croupier avait un blackjack</span><span class="prow-s">Pour payer les assurances</span></div>
      <button class="chip ${R.dealerBJ ? 'on' : ''}" data-act="bj.dealer" data-p="${p}" aria-pressed="${R.dealerBJ}">${R.dealerBJ ? 'Oui' : 'Non'}</button></div>` : ''}
    <ul class="card list">${names.map((n, i) => playerBlock(game, R, i, n, p, banks ? banks[i] : undefined)).join('')}</ul>`;
}
function statusOf(game, R) {
  const c = B.checkRound(R);
  if (!c.ok) return { ok: false, html: `${icon('alert', 18)}<span>${c.msg}</span>` };
  const total = B.roundNets(R, game.options).reduce((a, b) => a + b, 0);
  return { ok: true, html: `${icon('check', 18)}<span>Table : ${sign(Math.round(total * 10) / 10)} jetons</span>` };
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

  setup(game) { game.rounds = [B.makeRound(game.playerIds.map(() => DEFAULT_BET))]; game.cur = 0; return game; },
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
    const R = game.rounds[game.cur], st = statusOf(game, R);
    return {
      title: `Manche ${game.cur + 1}`, sub: `Blackjack payé ${game.options.payout || '3:2'}`,
      right: `<button class="icon-btn" data-act="rules" data-game="blackjack" aria-label="Règles">${icon('book')}</button>`,
      body: body(game, R, 'bj', api.names(game), api.totals(game)),
      bar: `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="bj-tally" role="status">${st.html}</div>
        <button class="btn btn-primary" data-act="bj.validate">Valider la manche</button>`
    };
  },
  editorBody(api, game, draft) {
    return { body: body(game, draft.round, 'ed', api.names(game)), status: statusOf(game, draft.round) };
  },

  actions(api) {
    const g = () => api.game();
    const roundOf = p => (p === 'ed' ? api.draft().round : g().rounds[g().cur]);
    const redraw = p => { if (p === 'ed') api.editorRefresh(); else { api.save(); api.render(); } };
    return {
      'bj.bet': (value, el) => {
        const p = el.dataset.p, R = roundOf(p), i = +el.dataset.i;
        const n = parseInt(String(value).trim(), 10);
        const bet = Number.isNaN(n) ? 0 : Math.max(0, Math.min(1e6, n));
        const wasPlaying = (R.e[i].hands[0].bet || 0) > 0;
        R.e[i].hands.forEach(h => { h.bet = bet; });
        if (p !== 'ed') api.save();
        // passer de 0 à une mise (ou l'inverse) change l'affichage : on redessine en gardant le focus
        if (wasPlaying !== bet > 0) {
          redraw(p);
          const f = document.getElementById(`${p}bet${i}`);
          if (f) { f.focus(); const L = f.value.length; f.setSelectionRange(L, L); }
          return;
        }
        const t = document.getElementById(`${p === 'ed' ? 'ed' : 'bj'}-tally`), st = statusOf(g(), R);
        if (t) { t.className = `tally ${st.ok ? 'ok' : 'ko'}`; t.innerHTML = st.html; }
      },
      'bj.result': d => { roundOf(d.p).e[+d.i].hands[+d.h].result = d.v; redraw(d.p); },
      'bj.double': d => { const h = roundOf(d.p).e[+d.i].hands[+d.h]; h.doubled = !h.doubled; redraw(d.p); },
      'bj.split': d => { const e = roundOf(d.p).e[+d.i]; e.hands.push(B.newHand(e.hands[0].bet)); redraw(d.p); },
      'bj.unsplit': d => { roundOf(d.p).e[+d.i].hands.splice(+d.h, 1); redraw(d.p); },
      'bj.ins': d => { const e = roundOf(d.p).e[+d.i]; e.insurance = !e.insurance; redraw(d.p); },
      'bj.dealer': d => { const R = roundOf(d.p); R.dealerBJ = !R.dealerBJ; redraw(d.p); },
      'bj.validate': () => {
        const R = g().rounds[g().cur], v = B.checkRound(R);
        if (!v.ok) { api.toast(v.msg); api.shake('bj-tally'); return; }
        api.finishRound(g());
      }
    };
  }
};
