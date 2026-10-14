/* Module de jeu « Jass » pour Ardoise : Schieber, Coiffeur et Différenzler.
   Schieber et Coiffeur se jouent à 4, en deux équipes (partenaires face à face :
   joueurs 1 et 3 contre 2 et 4) ; le Différenzler se joue chacun pour soi. */
import * as J from './scoring.js';
import { RULES_HTML } from './rules-fr.js';
import { esc, sign, avatar, segmented, icon, numField, plural } from '../../core/ui.js';

const VARIANTS = [['schieber', 'Schieber'], ['coiffeur', 'Coiffeur'], ['diff', 'Différenzler']];
const OPTIONS = [
  { key: 'variant', label: 'Variante', type: 'choice', prominent: true, def: 'schieber', choices: VARIANTS,
    desc: o => ({
      schieber: 'À 4, deux équipes face à face. La première équipe qui atteint l’objectif gagne.',
      coiffeur: 'À 4, deux équipes. Chaque équipe joue chaque atout une fois, avec un facteur par ligne.',
      diff: 'De 3 à 5 joueurs, chacun pour soi. On annonce ses points ; l’écart est une pénalité.'
    })[o.variant] },
  { key: 'target', label: 'Objectif', type: 'choice', def: '1000', when: o => o.variant === 'schieber',
    choices: [['1000', '1000'], ['1500', '1500'], ['2500', '2500']],
    desc: () => 'Nombre de points à atteindre (2500 est courant avec les multiplicateurs).' },
  { key: 'factors', label: 'Multiplicateurs par atout', type: 'toggle', def: true, when: o => o.variant === 'schieber',
    desc: () => '♦ ♥ ×1, ♠ ♣ ×2, Obenabe et Undenufe ×3 : cartes, Weis et Stöck sont multipliés.' },
  { key: 'rows', label: 'Lignes', type: 'choice', def: '8', when: o => o.variant === 'coiffeur',
    choices: [['6', '6 lignes'], ['8', '8 avec Jokers']],
    desc: () => '♠ ×1, ♣ ×2, ♦ ×3, ♥ ×4, Obenabe ×5, Undenufe ×6, puis Jokers ×7 et ×8.' },
  { key: 'fullPoints', label: 'Points complets', type: 'toggle', def: false, when: o => o.variant === 'coiffeur',
    desc: () => 'Écrire tous les points au lieu des seules dizaines (à convenir avant de jouer).' },
  { key: 'rounds', label: 'Nombre de jeux', type: 'choice', def: '12', when: o => o.variant === 'diff',
    choices: [['8', '8'], ['12', '12'], ['16', '16']], desc: () => 'Le règlement prévoit 12 jeux.' },
  { key: 'exactBonus', label: 'Bonus annonce exacte', type: 'toggle', def: false, when: o => o.variant === 'diff',
    desc: () => '−10 points pour une annonce exacte (à convenir avant de jouer).' }
];

const rulesBtn = `<button class="icon-btn" data-act="rules" data-game="jass" aria-label="Règles">${icon('book')}</button>`;
const V = game => game.options.variant || 'schieber';
const isTeam = o => (o.variant || 'schieber') !== 'diff';
const teamNames = names => [`${names[0]} et ${names[2]}`, `${names[1]} et ${names[3]}`];
const target = o => +(o.target || 1000);
const usedRows = (game, exceptR) => {
  const u = [[], []];
  game.rounds.forEach((R, r) => { if (r !== exceptR && r < game.cur && R.row && (R.team === 0 || R.team === 1)) u[R.team].push(R.row); });
  return u;
};
const ok = html => ({ ok: true, html: `${icon('check', 18)}<span>${html}</span>` });
const ko = msg => ({ ok: false, html: `${icon('alert', 18)}<span>${msg}</span>` });

/* ═══════════ Schieber ═══════════ */
function schieberBody(game, R, p, sides) {
  const o = game.options, cards = J.schieberCards(R);
  const tr = J.trumpOf(R.trump);
  const noStoeck = o.factors && tr && (tr.id === 'obe' || tr.id === 'unde');
  let h = '';
  if (o.factors) {
    h += `<section class="section"><h2 class="label">Atout</h2><div class="pick-grid">${J.TRUMPS.map(t =>
      `<button class="pick ${R.trump === t.id ? 'on' : ''}" data-act="ja.trump" data-p="${p}" data-v="${t.id}" aria-pressed="${R.trump === t.id}">
        <b>${t.sym} ${t.label}</b><small>×${t.factor}</small></button>`).join('')}</div></section>`;
  }
  h += `<section class="section"><h2 class="label">Points de cartes</h2><div class="card list" style="padding:0 16px">
    <div class="prow"><div class="prow-main"><div class="prow-txt"><span class="prow-n">${esc(sides[0])}</span><span class="prow-s">Points faits (0 à 157)</span></div>
      ${R.match === 0 || R.match === 1 ? `<span class="pts">${cards[0]}</span>` : numField({ id: `${p}pts`, value: R.pts, input: 'ja.pts', data: { p }, label: `Points de ${sides[0]}` })}</div></div>
    <div class="prow"><div class="prow-main"><div class="prow-txt"><span class="prow-n">${esc(sides[1])}</span><span class="prow-s">Le reste des 157</span></div>
      <span class="pts" id="${p}other">${R.match === 0 || R.match === 1 || typeof R.pts === 'number' ? cards[1] : '—'}</span></div></div>
    </div>
    <div class="row-extra" style="padding-left:0">${[0, 1].map(i => `<button class="chip ${R.match === i ? 'on' : ''}" data-act="ja.match" data-p="${p}" data-i="${i}" aria-pressed="${R.match === i}">Match ${esc(sides[i])}</button>`).join('')}</div></section>`;
  h += `<section class="section"><h2 class="label">Weis</h2><div class="card list" style="padding:0 16px">${[0, 1].map(i => `
    <div class="prow"><div class="prow-main"><div class="prow-txt"><span class="prow-n">${esc(sides[i])}</span></div><span class="pts">${R.weis[i] || 0}</span>
      ${R.weis[i] ? `<button class="icon-btn plain" data-act="ja.weisReset" data-p="${p}" data-i="${i}" aria-label="Effacer les Weis de ${esc(sides[i])}">${icon('close', 18)}</button>` : ''}</div>
      <div class="row-extra" style="padding-left:0">${J.WEIS_VALUES.map(v => `<button class="chip add" data-act="ja.weis" data-p="${p}" data-i="${i}" data-v="${v}">+${v}</button>`).join('')}</div></div>`).join('')}
    </div><p class="hint">Seule l’équipe qui a le meilleur Weis les inscrit.</p></section>`;
  if (!noStoeck) {
    h += `<section class="section"><h2 class="label">Stöck (roi et dame d’atout, 20)</h2><div class="row-extra" style="padding-left:0">${[0, 1].map(i =>
      `<button class="chip ${R.stoeck === i ? 'on' : ''}" data-act="ja.stoeck" data-p="${p}" data-i="${i}" aria-pressed="${R.stoeck === i}">${esc(sides[i])}</button>`).join('')}</div></section>`;
  }
  return h;
}
function schieberStatus(game, R, sides) {
  const c = J.checkSchieber(R, game.options);
  if (!c.ok) return ko(c.msg);
  const t = J.schieberDetail(R, game.options).total;
  return ok(`${esc(sides[0])} ${sign(t[0])} · ${esc(sides[1])} ${sign(t[1])}`);
}

/* ═══════════ Coiffeur ═══════════ */
function coiffeurBody(game, R, p, sides, exceptR) {
  const rows = J.coiffeurRows(+game.options.rows || 8), used = usedRows(game, exceptR);
  let h = `<section class="section"><h2 class="label">Équipe qui a annoncé</h2>
    ${segmented([[0, esc(sides[0])], [1, esc(sides[1])]], R.team, 'ja.team', 'Équipe qui a annoncé', { p })}</section>`;
  if (R.team === 0 || R.team === 1) {
    h += `<section class="section"><h2 class="label">Ligne jouée</h2><div class="pick-grid">${rows.map(row => {
      const done = used[R.team].includes(row.id);
      return `<button class="pick ${R.row === row.id ? 'on' : ''}" data-act="ja.row" data-p="${p}" data-v="${row.id}" ${done ? 'disabled' : ''} aria-pressed="${R.row === row.id}">
        <b>${row.label}</b><small>${done ? 'déjà jouée' : '×' + row.factor}</small></button>`;
    }).join('')}</div></section>`;
  }
  h += `<section class="section"><h2 class="label">Points de l’équipe qui a annoncé</h2>
    <div class="card row-card"><div class="prow-txt"><span class="prow-n">Points faits</span><span class="prow-s">0 à 157${game.options.fullPoints ? '' : ' · seules les dizaines comptent'}</span></div>
      ${R.match ? `<span class="pts">257</span>` : numField({ id: `${p}pts`, value: R.pts, input: 'ja.cpts', data: { p }, label: 'Points faits' })}</div>
    <div class="row-extra" style="padding-left:0"><button class="chip ${R.match ? 'on' : ''}" data-act="ja.cmatch" data-p="${p}" aria-pressed="${!!R.match}">Match (257)</button></div></section>`;
  return h;
}
function coiffeurStatus(game, R, sides, exceptR) {
  const c = J.checkCoiffeur(R, usedRows(game, exceptR));
  if (!c.ok) return ko(c.msg);
  const v = J.coiffeurPoints(R, game.options);
  return ok(`${esc(sides[R.team])} ${sign(v[R.team])}`);
}

/* ═══════════ Différenzler ═══════════ */
function diffBody(game, R, p, names, step, totals) {
  const key = step === 'pred' ? 'pred' : 'pts';
  const rows = names.map((n, i) => `<li class="prow"><div class="prow-main">${avatar(n)}
    <div class="prow-txt"><span class="prow-n">${esc(n)}</span><span class="prow-s" id="${p}s${i}">${diffSub(game, R, i, step, totals)}</span></div>
    ${numField({ id: `${p}${key}${i}`, value: R[key][i], input: 'ja.dval', enter: 'ja.dnext', data: { p, i, k: key }, label: `${step === 'pred' ? 'Annonce' : 'Points'} de ${n}` })}</div></li>`).join('');
  return `<ul class="card list">${rows}</ul>`;
}
function diffSub(game, R, i, step, totals) {
  if (step === 'pred') return totals ? `Total ${totals[i]}` : '';
  const pred = R.pred[i], pts = R.pts[i];
  if (typeof pts !== 'number') return `Annonce ${pred ?? '—'}`;
  return `Annonce ${pred} · écart ${J.diffPoints({ pred: [pred], pts: [pts] }, game.options)[0]}`;
}
function diffStatus(game, R, step) {
  if (step === 'pred') {
    const c = J.checkDiffPreds(R);
    return c.ok ? ok('Annonces complètes') : ko(c.msg);
  }
  const c = J.checkDiff(R);
  if (c.ok) return ok('157 points répartis');
  const sum = R.pts.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
  return ko(R.pts.some(v => typeof v !== 'number') ? `${c.msg} · reste ${J.GAME_POINTS - sum}` : c.msg);
}

/* ═══════════ Le module ═══════════ */
export default {
  id: 'jass',
  name: 'Jass',
  tagline: 'Schieber, Coiffeur, Différenzler',
  players: o => (isTeam(o) ? { min: 4, max: 4 } : { min: 3, max: 5 }),
  winner: game => (V(game) === 'diff' ? 'lowest' : 'highest'),
  roundsLabel: n => `${n} jeu${n > 1 ? 'x' : ''}`,
  formats: [],
  options: OPTIONS,
  rulesHtml: RULES_HTML,
  seatLabel: (k, o) => (isTeam(o || {}) ? (k % 2 === 0 ? 'Équipe 1' : 'Équipe 2') : ''),

  defaultOptions() { return Object.fromEntries(OPTIONS.map(o => [o.key, o.def])); },
  visibleOptions(o, n) { return OPTIONS.filter(d => !d.when || d.when(o, n)); },
  optionsSummary(o) {
    if (o.variant === 'coiffeur') return `${o.rows || 8} lignes${o.fullPoints ? ' · points complets' : ' · dizaines'}`;
    if (o.variant === 'diff') return `${o.rounds || 12} jeux${o.exactBonus ? ' · bonus annonce exacte' : ''}`;
    return `Objectif ${o.target || 1000}${o.factors ? ' · multiplicateurs' : ''}`;
  },

  // Équipes : partenaires face à face (places 1 et 3, 2 et 4)
  sides(game, names) { return isTeam(game.options) ? teamNames(names) : names; },
  sideCount(game) { return isTeam(game.options) ? 2 : game.playerIds.length; },
  sideOf(game, i) { return isTeam(game.options) ? i % 2 : i; },

  setup(game) {
    const v = V(game), n = game.playerIds.length;
    if (v === 'coiffeur') game.rounds = Array.from({ length: 2 * (+game.options.rows || 8) }, J.coiffeurRound);
    else if (v === 'diff') game.rounds = Array.from({ length: +game.options.rounds || 12 }, () => J.diffRound(n));
    else game.rounds = [J.schieberRound()];
    game.cur = 0; game.step = 'pred';
    return game;
  },
  prepareRound(game) {
    if (V(game) === 'schieber') while (game.rounds.length <= game.cur) game.rounds.push(J.schieberRound());
  },
  isOver(game) {
    if (V(game) !== 'schieber') return game.cur >= game.rounds.length;
    const n = Math.min(game.cur, game.rounds.length), t = [0, 0];
    for (let r = 0; r < n; r++) J.schieberDetail(game.rounds[r], game.options).total.forEach((v, i) => { t[i] += v; });
    return t.some(v => v >= target(game.options));
  },
  decideWinners(game) {
    if (V(game) !== 'schieber') return null;
    return J.schieberWinners(game.rounds.slice(0, game.rounds.length), { ...game.options, target: target(game.options) });
  },
  roundPoints(game, r) {
    const R = game.rounds[r], v = V(game);
    if (v === 'coiffeur') return J.coiffeurPoints(R, game.options);
    if (v === 'diff') return J.diffPoints(R, game.options);
    return J.schieberDetail(R, game.options).total;
  },
  validateRound(game, R, r = game.cur) {
    const v = V(game);
    if (v === 'coiffeur') return J.checkCoiffeur(R, usedRows(game, r));
    if (v === 'diff') return J.checkDiff(R);
    return J.checkSchieber(R, game.options);
  },
  roundHead(game, r) {
    const R = game.rounds[r], v = V(game);
    if (v === 'schieber') { const t = J.trumpOf(R.trump); return { label: `J${r + 1}`, sub: t ? t.sym : '', long: t ? `atout ${t.label}` : '' }; }
    if (v === 'coiffeur') { const row = J.COIFFEUR_ROWS.find(x => x.id === R.row); return { label: `J${r + 1}`, sub: row ? '×' + row.factor : '', long: row ? row.label : '' }; }
    return { label: `J${r + 1}`, sub: '', long: '' };
  },
  progress(game, totals) {
    const v = V(game);
    if (v === 'schieber') {
      const max = totals && totals.length ? Math.max(0, ...totals) : 0, tg = target(game.options);
      return { total: tg, ratio: Math.min(1, max / tg), label: `Jeu ${game.cur + 1} · objectif ${tg}` };
    }
    return { total: game.rounds.length, label: `Jeu ${Math.min(game.cur + 1, game.rounds.length)} sur ${game.rounds.length}` };
  },
  nextLabel(game) { return `Jeu ${game.cur + 1}`; },
  endStats(game) {
    const v = V(game);
    if (v === 'schieber') {
      const matches = game.rounds.filter(R => R.match === 0 || R.match === 1).length;
      const weis = game.rounds.reduce((s, R) => s + (R.weis[0] || 0) + (R.weis[1] || 0), 0);
      return [{ v: game.rounds.length, l: 'jeux' }, { v: matches, l: matches > 1 ? 'Matchs' : 'Match' }, { v: weis, l: 'points de Weis' }];
    }
    if (v === 'coiffeur') {
      const matches = game.rounds.filter(R => R.match).length;
      return [{ v: game.rounds.length, l: 'jeux' }, { v: matches, l: matches > 1 ? 'Matchs' : 'Match' }, { v: +game.options.rows || 8, l: 'lignes par équipe' }];
    }
    const exact = game.rounds.reduce((s, R) => s + R.pred.filter((p, i) => p === R.pts[i]).length, 0);
    return [{ v: game.rounds.length, l: 'jeux' }, { v: exact, l: 'annonces exactes' }, { v: '157', l: 'points par jeu' }];
  },

  roundScreen(api, game) {
    const v = V(game), R = game.rounds[game.cur], names = api.names(game), sides = api.sideNames(game);
    let body, st, sub;
    if (v === 'schieber') {
      body = schieberBody(game, R, 'ja', sides); st = schieberStatus(game, R, sides);
      sub = `Schieber · objectif ${target(game.options)}`;
    } else if (v === 'coiffeur') {
      body = coiffeurBody(game, R, 'ja', sides, game.cur); st = coiffeurStatus(game, R, sides, game.cur);
      sub = `Coiffeur · ${plural(game.rounds.length - game.cur, 'jeu restant', 'jeux restants')}`;
    } else {
      const step = game.step === 'pts' ? 'pts' : 'pred';
      body = `<div class="steps">${segmented([['pred', '1 · Annonces'], ['pts', '2 · Points faits']], step, 'ja.step', 'Étape')}</div>
        ${diffBody(game, R, 'ja', names, step, api.totals(game))}`;
      st = diffStatus(game, R, step);
      sub = `Différenzler · ${plural(game.rounds.length, 'jeu', 'jeux')}`;
      if (step === 'pred') {
        return { title: `Jeu ${game.cur + 1}`, sub, right: rulesBtn, body,
          bar: `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="ja-tally" role="status">${st.html}</div>
            <button class="btn btn-primary" data-act="ja.step" data-v="pts">Passer aux points ${icon('next', 20)}</button>` };
      }
    }
    return {
      title: `Jeu ${game.cur + 1}`, sub, right: rulesBtn, body,
      bar: `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="ja-tally" role="status">${st.html}</div>
        <button class="btn btn-primary" data-act="ja.validate">Valider le jeu</button>`
    };
  },

  editorBody(api, game, draft) {
    const v = V(game), R = draft.round, sides = api.sideNames(game), names = api.names(game);
    if (v === 'schieber') return { body: schieberBody(game, R, 'ed', sides), status: schieberStatus(game, R, sides) };
    if (v === 'coiffeur') return { body: coiffeurBody(game, R, 'ed', sides, draft.r), status: coiffeurStatus(game, R, sides, draft.r) };
    return {
      body: `<h3 class="label">Annonces</h3>${diffBody(game, R, 'edp', names, 'pred')}<h3 class="label">Points faits</h3>${diffBody(game, R, 'ed', names, 'pts')}`,
      status: diffStatus(game, R, 'pts')
    };
  },

  actions(api) {
    const g = () => api.game();
    const roundOf = p => (p === 'ed' || p === 'edp' ? api.draft().round : g().rounds[g().cur]);
    const redraw = p => { if (p === 'ed' || p === 'edp') api.editorRefresh(); else { api.save(); api.render(); } };
    const tally = p => document.getElementById(p === 'ed' || p === 'edp' ? 'ed-tally' : 'ja-tally');
    const setTally = (p, st) => { const el = tally(p); if (el) { el.className = `tally ${st.ok ? 'ok' : 'ko'}`; el.innerHTML = st.html; } };
    const num = v => { const t = String(v ?? '').trim(); if (t === '') return null; const n = parseInt(t, 10); return Number.isNaN(n) ? null : Math.max(0, Math.min(J.GAME_POINTS, n)); };
    const isEd = p => p === 'ed' || p === 'edp';
    const exceptR = p => (isEd(p) ? api.draft().r : g().cur);
    return {
      'ja.step': d => { g().step = d.v; api.save(); api.render(true); },
      'ja.trump': d => { const R = roundOf(d.p); R.trump = d.v; const t = J.trumpOf(d.v); if (t && (t.id === 'obe' || t.id === 'unde')) R.stoeck = null; redraw(d.p); },
      'ja.pts': (value, el) => {
        const p = el.dataset.p, R = roundOf(p);
        R.pts = num(value);
        const o = document.getElementById(`${p}other`);
        if (o) o.textContent = typeof R.pts === 'number' ? J.schieberCards(R)[1] : '—';
        if (!isEd(p)) api.save();
        setTally(p, schieberStatus(g(), R, api.sideNames(g())));
      },
      'ja.match': d => { const R = roundOf(d.p); R.match = R.match === +d.i ? null : +d.i; redraw(d.p); },
      'ja.weis': d => { const R = roundOf(d.p); R.weis[+d.i] = (R.weis[+d.i] || 0) + +d.v; redraw(d.p); },
      'ja.weisReset': d => { roundOf(d.p).weis[+d.i] = 0; redraw(d.p); },
      'ja.stoeck': d => { const R = roundOf(d.p); R.stoeck = R.stoeck === +d.i ? null : +d.i; redraw(d.p); },
      'ja.team': d => { const R = roundOf(d.p); R.team = +d.v; if (R.row && usedRows(g(), exceptR(d.p))[R.team].includes(R.row)) R.row = null; redraw(d.p); },
      'ja.row': d => { roundOf(d.p).row = d.v; redraw(d.p); },
      'ja.cpts': (value, el) => {
        const p = el.dataset.p, R = roundOf(p);
        R.pts = num(value);
        if (!isEd(p)) api.save();
        setTally(p, coiffeurStatus(g(), R, api.sideNames(g()), exceptR(p)));
      },
      'ja.cmatch': d => { const R = roundOf(d.p); R.match = !R.match; redraw(d.p); },
      'ja.dval': (value, el) => {
        const p = el.dataset.p, R = roundOf(p), i = +el.dataset.i, k = el.dataset.k;
        R[k][i] = num(value);
        if (!isEd(p)) api.save();
        const step = k === 'pred' ? 'pred' : 'pts';
        const t = isEd(p) ? null : api.totals(g());
        R.pred.forEach((_, j) => { const s = document.getElementById(`${p}s${j}`); if (s) s.innerHTML = diffSub(g(), R, j, step, t); });
        // dans l'éditeur, une annonce modifiée change l'écart affiché sous les points
        if (isEd(p)) R.pred.forEach((_, j) => { const s = document.getElementById(`eds${j}`); if (s) s.innerHTML = diffSub(g(), R, j, 'pts'); });
        setTally(p, diffStatus(g(), R, isEd(p) ? 'pts' : step));
      },
      'ja.dnext': (value, el) => {
        const next = document.getElementById(`${el.dataset.p}${el.dataset.k}${+el.dataset.i + 1}`);
        if (next) next.focus(); else el.blur();
      },
      'ja.validate': () => {
        const game = g(), R = game.rounds[game.cur];
        const res = V(game) === 'coiffeur' ? J.checkCoiffeur(R, usedRows(game, game.cur))
          : V(game) === 'diff' ? J.checkDiff(R) : J.checkSchieber(R, game.options);
        if (!res.ok) { api.toast(res.msg); api.shake('ja-tally'); return; }
        game.step = 'pred';
        api.finishRound(game);
      }
    };
  }
};

