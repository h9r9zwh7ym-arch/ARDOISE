/* Module de jeu « Skyjo » pour Ardoise.
   À la fin de chaque manche, chacun compte les cartes de sa grille : on saisit ce total
   et le joueur qui a fermé la manche ; l'app applique la règle du doublement et arrête
   la partie dès qu'un joueur atteint 100 points. */
import * as SJ from './scoring.js';
import { RULES_HTML } from './rules-fr.js';
import { esc, avatar, icon } from '../../core/ui.js';

// Pas de variante : la notice officielle n'en propose aucune.
const OPTIONS = [];

const fmtScore = v => (typeof v === 'number' ? String(v) : '');

/* ═══════════ Interface ═══════════ */
function rowSub(round, i, total) {
  const v = round.scores[i];
  const closer = round.closer === i;
  if (closer && SJ.isDoubled(round)) return `<b class="neg">Doublé : ${v} → ${v * 2}</b>`;
  if (closer) return 'A fermé la manche';
  return total === undefined ? '' : `Total ${total}`;
}

function scoreRow(round, i, name, prefix, total) {
  const v = round.scores[i], isC = round.closer === i;
  return `<li class="prow">
    <div class="prow-main">${avatar(name)}
      <div class="prow-txt"><span class="prow-n">${esc(name)}</span><span class="prow-s" id="${prefix}s${i}">${rowSub(round, i, total)}</span></div>
      <div class="score-in">
        <button class="icon-btn plain sign-btn" data-act="sj.sign" data-p="${prefix}" data-i="${i}" aria-label="Changer le signe du score de ${esc(name)}">±</button>
        <input class="field num score" id="${prefix}in${i}" type="text" inputmode="numeric" pattern="-?[0-9]*" autocomplete="off"
          aria-label="Score de ${esc(name)}" placeholder="—" value="${fmtScore(v)}"
          data-input="sj.score" data-enter="sj.next" data-p="${prefix}" data-i="${i}">
      </div>
    </div>
    <div class="row-extra"><button class="chip ${isC ? 'on' : ''}" data-act="sj.closer" data-p="${prefix}" data-i="${i}" aria-pressed="${isC}">${isC ? `${icon('check', 16)} A fermé la manche` : 'A fermé la manche'}</button></div>
  </li>`;
}

function statusOf(round) {
  const c = SJ.checkRound(round);
  if (!c.ok) return { ok: false, html: `${icon('alert', 18)}<span>${c.msg}</span>` };
  return { ok: true, html: `${icon('check', 18)}<span>${SJ.isDoubled(round) ? 'Scores complets · doublement appliqué' : 'Scores complets'}</span>` };
}

function roundScreen(api, game) {
  const R = game.rounds[game.cur], names = api.names(game), t = api.totals(game);
  const st = statusOf(R);
  return {
    title: `Manche ${game.cur + 1}`,
    sub: 'Fin de partie à 100 points',
    right: `<button class="icon-btn" data-act="rules" data-game="skyjo" aria-label="Règles">${icon('book')}</button>`,
    body: `<p class="hint">Saisissez le total de chaque grille, puis indiquez qui a retourné toutes ses cartes en premier.</p>
      <ul class="card list">${names.map((n, i) => scoreRow(R, i, n, 'sj', t[i])).join('')}</ul>`,
    bar: `<div class="tally ${st.ok ? 'ok' : 'ko'}" id="sj-tally" role="status">${st.html}</div>
      <button class="btn btn-primary" data-act="sj.validate">Valider la manche</button>`
  };
}

function editorBody(api, game, draft) {
  const names = api.names(game);
  return {
    body: `<ul class="card list">${names.map((n, i) => scoreRow(draft.round, i, n, 'ed', draft.after[i])).join('')}</ul>`,
    status: statusOf(draft.round)
  };
}

/* ═══════════ Le module ═══════════ */
export default {
  id: 'skyjo',
  name: 'Skyjo',
  tagline: 'Le plus petit score gagne · 2 à 8 joueurs',
  players: { min: 2, max: 8 },
  winner: 'lowest',
  formats: [],
  options: OPTIONS,
  rulesHtml: RULES_HTML,

  defaultOptions() { return {}; },
  visibleOptions() { return OPTIONS; },
  optionsSummary() { return 'Règles officielles'; },

  setup(game) { game.rounds = [SJ.makeRound(game.playerIds.length)]; game.cur = 0; return game; },
  /** Manche suivante (le nombre de manches n'est pas fixé à l'avance). */
  prepareRound(game) {
    while (game.rounds.length <= game.cur) game.rounds.push(SJ.makeRound(game.playerIds.length));
  },
  isOver(game) {
    const n = Math.min(game.cur, game.rounds.length);
    if (!n) return false;
    const t = game.playerIds.map(() => 0);
    for (let r = 0; r < n; r++) SJ.roundPoints(game.rounds[r]).forEach((p, i) => { t[i] += p; });
    return t.some(v => v >= SJ.TARGET);
  },
  roundPoints(game, r) { return SJ.roundPoints(game.rounds[r]); },
  validateRound(game, R) { return SJ.checkRound(R); },
  roundHead(game, r) { return { label: `M${r + 1}`, sub: '', long: '' }; },
  progress(game, totals) {
    const max = totals && totals.length ? Math.max(0, ...totals) : 0;
    return { total: SJ.TARGET, ratio: Math.min(1, max / SJ.TARGET), label: `Manche ${game.cur + 1} · ${max} / ${SJ.TARGET} points` };
  },
  nextLabel(game) { return `Manche ${game.cur + 1}`; },
  endStats(game, names) {
    let best = { v: Infinity }, doubled = 0;
    game.rounds.forEach(R => {
      const p = SJ.roundPoints(R);
      p.forEach((v, i) => { if (v < best.v) best = { v, who: names[i] }; });
      if (SJ.isDoubled(R)) doubled++;
    });
    return [
      { v: game.rounds.length, l: game.rounds.length > 1 ? 'manches' : 'manche' },
      { v: best.v === Infinity ? '—' : best.v, l: `meilleure manche · ${esc(best.who || '')}` },
      { v: doubled, l: doubled > 1 ? 'scores doublés' : 'score doublé' }
    ];
  },

  roundScreen,
  editorBody,

  actions(api) {
    const g = () => api.game();
    // p = « sj » (manche en cours) ou « ed » (modification d'une manche validée)
    const roundOf = p => (p === 'ed' ? api.draft().round : g().rounds[g().cur]);
    const tallyId = p => (p === 'ed' ? 'ed-tally' : 'sj-tally');
    // mise à jour ciblée (sans redessiner l'écran) pour garder le clavier ouvert
    const patch = p => {
      const R = roundOf(p), game = g();
      const t = p === 'ed' ? api.previewTotals(game, api.draft().r, R) : api.totals(game);
      if (p === 'ed') api.draft().after = t;
      R.scores.forEach((_, i) => { const el = document.getElementById(`${p}s${i}`); if (el) el.innerHTML = rowSub(R, i, t[i]); });
      const st = statusOf(R), el = document.getElementById(tallyId(p));
      if (el) { el.className = `tally ${st.ok ? 'ok' : 'ko'}`; el.innerHTML = st.html; }
    };
    const redraw = p => { if (p === 'ed') api.editorRefresh(); else { api.save(); api.render(); } };
    return {
      'sj.score': (value, el) => {
        const p = el.dataset.p, R = roundOf(p);
        R.scores[+el.dataset.i] = SJ.parseScore(value);
        if (p !== 'ed') api.save();
        patch(p);
      },
      'sj.next': (value, el) => {
        const next = document.getElementById(`${el.dataset.p}in${+el.dataset.i + 1}`);
        if (next) next.focus(); else el.blur();
      },
      'sj.sign': d => {
        const R = roundOf(d.p), i = +d.i, v = R.scores[i];
        R.scores[i] = typeof v === 'number' ? -v : null;
        redraw(d.p);
        if (typeof v !== 'number') {   // pas encore de score : on prépare la saisie d'un nombre négatif
          const el = document.getElementById(`${d.p}in${i}`);
          if (el) { el.value = '-'; el.focus(); }
        }
      },
      'sj.closer': d => { const R = roundOf(d.p); R.closer = R.closer === +d.i ? null : +d.i; redraw(d.p); },
      'sj.validate': () => {
        const R = g().rounds[g().cur], v = SJ.checkRound(R);
        if (!v.ok) { api.toast(v.msg); api.shake('sj-tally'); return; }
        api.finishRound(g());
      }
    };
  }
};
