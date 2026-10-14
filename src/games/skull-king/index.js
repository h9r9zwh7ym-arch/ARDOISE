/* Module de jeu « Skull King » pour Ardoise.
   - logique (testée) : formats, options, mise en place, points par manche, validation ;
   - interface : saisie de la manche (mises puis plis), modification d'une manche validée. */
import * as SK from './scoring.js';
import { RULES_HTML } from './rules-fr.js';
import { esc, sign, plural, avatar, stepper, segmented, icon } from '../../core/ui.js';

const FORMATS = [
  { id: 'classique',  name: 'Classique',        desc: '10 manches, de 1 à 10 cartes',        cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 'impair',     name: 'Pas d’impair',     desc: '2, 4, 6, 8 et 10 cartes, deux fois',  cards: [2, 2, 4, 4, 6, 6, 8, 8, 10, 10] },
  { id: 'combat',     name: 'Prêt au combat',   desc: '5 manches de 6 à 10 cartes',          cards: [6, 7, 8, 9, 10] },
  { id: 'eclair',     name: 'Attaque éclair',   desc: '5 manches de 5 cartes',               cards: [5, 5, 5, 5, 5] },
  { id: 'barrage',    name: 'Tir de barrage',   desc: '10 manches de 10 cartes',             cards: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10] },
  { id: 'tourbillon', name: 'Tourbillon',       desc: '9, 7, 5, 3 et 1 carte, deux fois',    cards: [9, 9, 7, 7, 5, 5, 3, 3, 1, 1] },
  { id: 'dodo',       name: 'L’heure du dodo',  desc: 'Une seule manche d’une carte',        cards: [1] }
];

const OPTIONS = [
  { key: 'scoring', label: 'Décompte', type: 'choice', def: 'sk',
    choices: [['sk', 'Skull King'], ['rascal', 'Rascal']],
    desc: o => o.scoring === 'rascal'
      ? '10 points par carte pour tous ; écart de 1 : la moitié ; écart de 2 ou plus : rien.'
      : 'Mise exacte : 20 points par pli ; ratée : −10 par pli d’écart.' },
  { key: 'cannonball', label: 'Boulet de canon', type: 'toggle', def: false, when: o => o.scoring === 'rascal',
    desc: () => 'Chacun choisit : Chevrotine (Rascal normal) ou Boulet (15 par carte, tout ou rien).' },
  { key: 'greybeard', label: 'Barbe Grise (à 2 joueurs)', type: 'toggle', def: true, when: (o, n) => n === 2,
    desc: () => 'Règle officielle à 2 : une 3ᵉ main jouée par le fantôme Barbe Grise. Désactivez pour jouer en face à face.' },
  { key: 'kraken', label: 'Kraken', type: 'toggle', def: false, desc: () => 'Détruit un pli : personne ne le remporte.' },
  { key: 'whale', label: 'Baleine blanche', type: 'toggle', def: false, desc: () => 'Pli défaussé si seules des cartes spéciales y sont jouées.' },
  { key: 'loot', label: 'Cartes Butin', type: 'toggle', def: false, when: (o, n) => n > 2, desc: () => '+20 chacun si les deux alliés réussissent leur mise.' },
  { key: 'wager', label: 'Pari de Rascal (pirate)', type: 'toggle', def: false, desc: () => 'Pari de 10 ou 20 points, gagné si la mise est exacte.' }
];

const fmt = game => FORMATS.find(f => f.id === game.format) || FORMATS[0];
const dealerOf = (game, r) => (game.dealer + r) % game.playerIds.length;

function clampBonus(e, k, d) {
  const b = SK.BONUSES.find(x => x.key === k);
  e[k] = Math.max(0, Math.min(b.max, (e[k] || 0) + d));
}

/* ═══════════ Interface : écran de la manche en cours ═══════════ */
function entryRow(game, R, i, name, step, total) {
  const e = R.e[i], o = game.options;
  const isD = dealerOf(game, game.cur) === i;
  let sub, ctl;
  if (step === 'bid') {
    sub = `Total ${total}${isD ? ' · donne' : ''}`;
    ctl = stepper({ value: e.bid, act: 'sk.bid', data: { i }, label: `Mise de ${name}`, max: R.cards });
  } else {
    const s = SK.scoreEntry(e, R.cards, o);
    sub = `Misé ${e.bid} · <b class="${s.pts >= 0 ? 'pos' : 'neg'}">${sign(s.pts)}</b>`;
    ctl = stepper({ value: e.tricks, act: 'sk.tricks', data: { i }, label: `Plis de ${name}`, max: R.cards });
  }
  let extra = '';
  if (step === 'bid' && o.wager) extra += `<div class="row-extra">${segmented([[0, 'Sans pari'], [10, 'Pari 10'], [20, 'Pari 20']], e.wager, 'sk.wager', 'Pari de ' + name, { i })}</div>`;
  if (step === 'bid' && o.scoring === 'rascal' && o.cannonball) extra += `<div class="row-extra">${segmented([['chev', 'Chevrotine'], ['boul', 'Boulet']], e.shot, 'sk.shot', 'Tir de ' + name, { i })}</div>`;
  if (step === 'tricks') {
    const b = SK.bonusOf(e, o);
    extra += `<div class="row-extra"><button class="chip ${b ? 'on' : ''}" data-act="sk.bonusOpen" data-i="${i}">${b ? `Bonus +${b}` : 'Ajouter un bonus'}</button></div>`;
  }
  return `<li class="prow">
    <div class="prow-main">${avatar(name)}<div class="prow-txt"><span class="prow-n">${esc(name)}</span><span class="prow-s">${sub}</span></div>${ctl}</div>${extra}</li>`;
}

function destroyedRow(game, R, act, data = {}) {
  const mx = SK.maxDestroyed(game.options);
  if (!mx) return '';
  const what = [game.options.kraken && 'Kraken', game.options.whale && 'Baleine blanche'].filter(Boolean).join(' ou ');
  return `<div class="card row-card dashed">
    <div class="prow-txt"><span class="prow-n">Plis détruits</span><span class="prow-s">${what}</span></div>
    ${stepper({ value: R.destroyed || 0, act, data, label: 'Plis détruits', max: Math.min(mx, R.cards) })}</div>`;
}

function trickStatus(game, R) {
  const c = SK.checkTricks(R, game.options, game.playerIds.length);
  if (!c.ok) return { ok: false, html: `${icon('alert', 18)}<span>${c.msg}</span>` };
  let t = `${plural(c.sum, 'pli remporté', 'plis remportés')}`;
  if (c.destroyed) t += ` + ${c.destroyed} détruit${c.destroyed > 1 ? 's' : ''}`;
  if (c.ghost && c.rest > 0) t += ` + ${c.rest} pour Barbe Grise`;
  return { ok: true, html: `${icon('check', 18)}<span>${t} = ${c.cards}</span>` };
}

function roundScreen(api, game) {
  const R = game.rounds[game.cur], names = api.names(game), step = game.step || 'bid';
  const t = api.totals(game);
  const d = names[dealerOf(game, game.cur)];
  let body = `<div class="steps">${segmented([['bid', '1 · Mises'], ['tricks', '2 · Plis et bonus']], step, 'sk.step', 'Étape')}</div>`;
  if (step === 'tricks') body += destroyedRow(game, R, 'sk.destroyed');
  body += `<ul class="card list">${names.map((n, i) => entryRow(game, R, i, n, step, t[i])).join('')}</ul>`;
  let bar;
  if (step === 'bid') {
    const sum = R.e.reduce((a, e) => a + e.bid, 0);
    body += `<p class="hint center">Total misé : <b>${sum}</b> pour ${plural(R.cards, 'pli', 'plis')}${SK.hasGhost(game.options, game.playerIds.length) ? ' · Barbe Grise joue la 3ᵉ main' : ''}</p>`;
    bar = `<button class="btn btn-primary" data-act="sk.step" data-v="tricks">Passer aux plis ${icon('next', 20)}</button>`;
  } else {
    const st = trickStatus(game, R);
    bar = `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="sk-tally" role="status">${st.html}</div>
      <button class="btn btn-primary" data-act="sk.validate">Valider la manche</button>`;
  }
  return {
    title: `Manche ${game.cur + 1}`,
    sub: `${plural(R.cards, 'carte', 'cartes')} · ${esc(d)} donne`,
    back: 'game',
    right: `<button class="icon-btn" data-act="rules" data-game="skull-king" aria-label="Règles">${icon('book')}</button>`,
    body, bar
  };
}

function bonusSheetBody(game, e, act, data) {
  return `<p class="hint">Comptés seulement si la mise est exacte.</p><ul class="card list">${SK.activeBonuses(game.options).map(b =>
    `<li class="prow"><div class="prow-main"><div class="prow-txt"><span class="prow-n">${b.label}</span><span class="prow-s">${b.unit}</span></div>
      ${stepper({ value: e[b.key] || 0, act, data: { ...data, k: b.key }, label: b.label, max: b.max })}</div></li>`).join('')}</ul>`;
}

function openBonusSheet(api, game, i) {
  const e = game.rounds[game.cur].e[i];
  api.sheet({
    title: `Bonus · ${esc(api.names(game)[i])}`,
    body: bonusSheetBody(game, e, 'sk.bonus', { i }),
    foot: `<button class="btn btn-primary" data-act="sheetClose">OK · ${SK.bonusOf(e, game.options) ? '+' + SK.bonusOf(e, game.options) : 'aucun bonus'}</button>`,
    onClose: () => api.render()
  });
}

/* ═══════════ Interface : modification d'une manche validée ═══════════ */
function editorBody(api, game, draft) {
  const R = draft.round, names = api.names(game), o = game.options;
  draft.open = draft.open || {};
  let h = destroyedRow(game, R, 'sk.edDestroyed');
  h += names.map((n, i) => {
    const e = R.e[i], s = SK.scoreEntry(e, R.cards, o), b = SK.bonusOf(e, o);
    const open = draft.open[i];
    return `<section class="card ed">
      <div class="prow-main">${avatar(n)}<div class="prow-txt"><span class="prow-n">${esc(n)}</span><span class="prow-s">Total ${draft.after[i]}</span></div>
        <span class="pts ${s.pts >= 0 ? 'pos' : 'neg'}">${sign(s.pts)}</span></div>
      <div class="ed-row"><span>Mise</span>${stepper({ value: e.bid, act: 'sk.ed', data: { i, k: 'bid' }, label: `Mise de ${n}`, max: R.cards })}</div>
      <div class="ed-row"><span>Plis</span>${stepper({ value: e.tricks, act: 'sk.ed', data: { i, k: 'tricks' }, label: `Plis de ${n}`, max: R.cards })}</div>
      ${o.wager ? `<div class="ed-row">${segmented([[0, 'Sans pari'], [10, 'Pari 10'], [20, 'Pari 20']], e.wager, 'sk.edWager', 'Pari de ' + n, { i })}</div>` : ''}
      ${o.scoring === 'rascal' && o.cannonball ? `<div class="ed-row">${segmented([['chev', 'Chevrotine'], ['boul', 'Boulet']], e.shot, 'sk.edShot', 'Tir de ' + n, { i })}</div>` : ''}
      <button class="disclose" data-act="sk.edOpen" data-i="${i}" aria-expanded="${!!open}">Bonus ${b ? '+' + b : ''}<span>${icon('chevron', 18)}</span></button>
      ${open ? `<ul class="list sub">${SK.activeBonuses(o).map(bd =>
        `<li class="prow"><div class="prow-main"><div class="prow-txt"><span class="prow-n">${bd.label}</span><span class="prow-s">${bd.unit}</span></div>
        ${stepper({ value: e[bd.key] || 0, act: 'sk.edBonus', data: { i, k: bd.key }, label: bd.label, max: bd.max })}</div></li>`).join('')}</ul>` : ''}
    </section>`;
  }).join('');
  const st = trickStatus(game, R);
  return { body: h, status: st };
}

/* ═══════════ Le module ═══════════ */
export default {
  id: 'skull-king',
  name: 'Skull King',
  tagline: 'Plis et paris de pirates · 2 à 8 joueurs',
  players: { min: 2, max: 8 },
  winner: 'highest',
  seatLabel: k => (k === 0 ? 'Donne en premier' : ''),
  tieHint: 'rejouez une manche !',
  formats: FORMATS,
  defaultFormat: 'classique',
  options: OPTIONS,
  rulesHtml: RULES_HTML,

  defaultOptions() { return Object.fromEntries(OPTIONS.map(o => [o.key, o.def])); },
  visibleOptions(opts, n) { return OPTIONS.filter(o => !o.when || o.when(opts, n)); },
  optionsSummary(opts, n) {
    const on = this.visibleOptions(opts, n).filter(o => o.type === 'toggle' && opts[o.key]).map(o => o.label);
    return [`Décompte ${opts.scoring === 'rascal' ? 'Rascal' : 'Skull King'}`, ...on].join(' · ');
  },
  formatSummary(game, n) {
    const f = FORMATS.find(x => x.id === game.format) || FORMATS[0];
    const cards = f.cards.map(c => SK.cardsFor(c, game.options, n));
    const capped = cards.some((c, i) => c < f.cards[i]);
    return `${f.desc}${capped ? ` (max ${Math.max(...cards)} cartes à ${n})` : ''}`;
  },

  /** Prépare les manches d'une nouvelle partie. */
  setup(game) {
    const n = game.playerIds.length;
    if (n === 2) game.options.loot = false;   // pas de Butin à 2 joueurs
    game.rounds = fmt(game).cards.map(c => SK.makeRound(SK.cardsFor(c, game.options, n), n));
    game.cur = 0; game.step = 'bid';
    return game;
  },
  isOver(game) { return game.cur >= game.rounds.length; },
  roundPoints(game, r) {
    const R = game.rounds[r];
    return R.e.map(e => SK.scoreEntry(e, R.cards, game.options).pts);
  },
  validateRound(game, R) {
    const c = SK.checkTricks(R, game.options, game.playerIds.length);
    return { ok: c.ok, msg: c.msg };
  },
  roundHead(game, r) { const c = game.rounds[r].cards; return { label: `M${r + 1}`, sub: `${c} c.`, long: plural(c, 'carte', 'cartes') }; },
  progress(game) {
    const total = game.rounds.length;
    return { total, ratio: Math.min(game.cur, total) / total, label: `Manche ${Math.min(game.cur + 1, total)} sur ${total}` };
  },
  nextLabel(game) {
    const R = game.rounds[game.cur];
    return `Manche ${game.cur + 1} · ${plural(R.cards, 'carte', 'cartes')}`;
  },
  /** Statistiques de fin de partie propres au jeu. */
  endStats(game, names) {
    let exact = 0, zeros = 0, n = 0, best = { v: -Infinity };
    game.rounds.forEach((R, r) => R.e.forEach((e, i) => {
      const s = SK.scoreEntry(e, R.cards, game.options); n++;
      if (s.exact) exact++;
      if (e.bid === 0 && s.exact) zeros++;
      if (s.pts > best.v) best = { v: s.pts, who: names[i] };
    }));
    return [
      { v: `${Math.round(exact / Math.max(1, n) * 100)} %`, l: 'mises exactes' },
      { v: sign(best.v), l: `meilleure manche · ${esc(best.who || '')}` },
      { v: zeros, l: 'mises à zéro réussies' }
    ];
  },

  /* Interface */
  roundScreen,
  editorBody,
  newRevengeOptions(game) { return { ...game.options }; },

  actions(api) {
    const g = () => api.game();
    const R = () => g().rounds[g().cur];
    const changed = () => { api.save(); api.render(); };
    const draftChanged = () => api.editorRefresh();
    return {
      'sk.step': d => { g().step = d.v; api.save(); api.render(true); },
      'sk.bid': d => { const e = R().e[d.i]; e.bid = Math.max(0, Math.min(R().cards, e.bid + +d.d)); changed(); },
      'sk.tricks': d => { const e = R().e[d.i]; e.tricks = Math.max(0, Math.min(R().cards, e.tricks + +d.d)); changed(); },
      'sk.wager': d => { R().e[d.i].wager = +d.v; changed(); },
      'sk.shot': d => { R().e[d.i].shot = d.v; changed(); },
      'sk.destroyed': d => {
        const r = R(); r.destroyed = Math.max(0, Math.min(Math.min(SK.maxDestroyed(g().options), r.cards), (r.destroyed || 0) + +d.d)); changed();
      },
      'sk.bonusOpen': d => openBonusSheet(api, g(), +d.i),
      'sk.bonus': d => { clampBonus(R().e[d.i], d.k, +d.d); api.save(); openBonusSheet(api, g(), +d.i); },
      'sk.validate': () => {
        const v = SK.checkTricks(R(), g().options, g().playerIds.length);
        if (!v.ok) { api.toast(v.msg); api.shake('sk-tally'); return; }
        api.finishRound(g());
      },
      // Modification d'une manche validée (brouillon)
      'sk.ed': d => { const dr = api.draft(), e = dr.round.e[d.i]; e[d.k] = Math.max(0, Math.min(dr.round.cards, e[d.k] + +d.d)); draftChanged(); },
      'sk.edBonus': d => { clampBonus(api.draft().round.e[d.i], d.k, +d.d); draftChanged(); },
      'sk.edWager': d => { api.draft().round.e[d.i].wager = +d.v; draftChanged(); },
      'sk.edShot': d => { api.draft().round.e[d.i].shot = d.v; draftChanged(); },
      'sk.edOpen': d => { const dr = api.draft(); dr.open = dr.open || {}; dr.open[d.i] = !dr.open[d.i]; draftChanged(); },
      'sk.edDestroyed': d => {
        const r = api.draft().round;
        r.destroyed = Math.max(0, Math.min(Math.min(SK.maxDestroyed(g().options), r.cards), (r.destroyed || 0) + +d.d)); draftChanged();
      }
    };
  }
};
