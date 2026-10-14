/* Ardoise — coquille de l'application : navigation, écrans communs, modification des manches.
   Chaque jeu (src/games/<jeu>/) fournit sa logique de points et son écran de saisie. */
import { createStore, playerByName, normName, uid } from './core/store.js';
import { played, totals, ranking, winners, playerStats, recentPlayers, winnerMode } from './core/scoring.js';
import { GAMES, getGame } from './games/registry.js';
import {
  on, installDispatcher, esc, sign, plural, icon, LOGO, avatar, toggle, segmented,
  toast, openSheet, closeSheet, shake, buzz, shortDate
} from './core/ui.js';

const VERSION = '1.3';
const store = createStore(localStorage);
let db = store.load();
let route = { name: 'home', params: {} };
let setup = null;      // brouillon de nouvelle partie
let draft = null;      // brouillon de modification de manche
const lastOrder = {};  // ordre du classement affiché, pour animer les changements de place

const save = () => { if (!store.save(db)) toast('Enregistrement impossible : stockage plein ?'); };
const gameById = id => db.games.find(g => g.id === id);
const playerById = id => db.players.find(p => p.id === id);
const nameOf = id => (playerById(id) || { name: '?' }).name;
const playerNamesOf = game => game.playerIds.map(nameOf);
// Concurrents classés : les joueurs, ou les équipes dans les jeux en équipes (Jass)
const namesOf = game => { const m = modOf(game), p = playerNamesOf(game); return m && m.sides ? m.sides(game, p) : p; };
const teamGame = game => { const m = modOf(game); return !!(m && m.sides && m.sides(game, playerNamesOf(game)).length !== game.playerIds.length); };
// Nombre de joueurs autorisé (il peut dépendre de la variante choisie, ex. Jass)
const rangeOf = (mod, options) => (typeof mod.players === 'function' ? mod.players(options || {}) : mod.players);
const unitOf = (mod, n) => (mod.unit ? mod.unit(n) : (Math.abs(n) > 1 ? 'points' : 'point'));
const modOf = game => getGame(game.gameId);
const gameTotals = (game, upto) => totals(modOf(game), game, upto);
function progressOf(game) {
  const p = modOf(game).progress(game, gameTotals(game));
  return { ...p, ratio: 'ratio' in p ? p.ratio : played(game) / p.total };
}

/* ═══════════════ Navigation et rendu ═══════════════ */
function go(name, params = {}) {
  closeSheet(true);
  route = { name, params };
  render({ enter: true });
  window.scrollTo(0, 0);
}

let pendingTick = null;
document.addEventListener('click', e => {
  const b = e.target.closest('.step-b');
  pendingTick = b ? { act: b.dataset.act, i: b.dataset.i, k: b.dataset.k } : null;
  if (b) buzz();
}, true);
function applyTick() {
  if (!pendingTick) return;
  const { act, i, k } = pendingTick;
  let sel = `.step-b[data-act="${act}"]`;
  if (i !== undefined) sel += `[data-i="${i}"]`;
  if (k !== undefined) sel += `[data-k="${k}"]`;
  const b = document.querySelector(sel);
  const v = b && b.closest('.step').querySelector('.step-v');
  if (v) { v.classList.remove('tick'); void v.offsetWidth; v.classList.add('tick'); }
  pendingTick = null;
}

function render(opts = {}) {
  const screen = SCREENS[route.name] || SCREENS.home;
  const s = screen(route.params, opts);
  if (!s) return;
  const tb = document.getElementById('topbar');
  tb.classList.toggle('large', !!s.large);
  tb.innerHTML = s.large
    ? `${LOGO}<div class="tb-txt"><h1 class="tb-title">${s.title}</h1></div>${s.right || ''}`
    : `${s.back ? `<button class="icon-btn" data-act="go" data-to="${s.back.to}" ${s.back.id ? `data-id="${s.back.id}"` : ''} aria-label="${s.back.label || 'Retour'}">${icon('back')}</button>` : ''}
       <div class="tb-txt">${s.sub ? `<span class="tb-sub">${s.sub}</span>` : ''}<h1 class="tb-title">${s.title}</h1></div>${s.right || ''}`;
  const view = document.getElementById('view');
  view.innerHTML = s.body;
  view.classList.remove('enter');
  if (opts.enter) { void view.offsetWidth; view.classList.add('enter'); }
  document.getElementById('bar').innerHTML = s.bar || '';
  const tabs = document.getElementById('tabs');
  tabs.hidden = !s.tab;
  if (s.tab) ['home', 'players'].forEach(t => document.getElementById('tab-' + t).classList.toggle('on', t === s.tab));
  document.title = s.large ? 'Ardoise' : `${s.title.replace(/<[^>]+>/g, '')} · Ardoise`;
  applyTick();
  if (s.after) requestAnimationFrame(s.after);
}

window.addEventListener('scroll', () => {
  document.getElementById('topbar').classList.toggle('scrolled', window.scrollY > 4);
}, { passive: true });

/* ═══════════════ Morceaux d'interface communs ═══════════════ */
// Vert / rouge seulement quand des points en plus sont une bonne nouvelle (Skull King) ;
// au Skyjo, où le plus petit score gagne, les points restent neutres.
const tone = (mod, game, v) => (winnerMode(mod, game) === 'lowest' ? '' : v > 0 ? 'pos' : v < 0 ? 'neg' : '');
const roundsLabel = (mod, n) => (mod.roundsLabel ? mod.roundsLabel(n) : plural(n, 'manche', 'manches'));
function rankCard(game, animate) {
  const mod = modOf(game), names = namesOf(game), rows = ranking(mod, game), n = played(game);
  const html = `<section class="section"><div class="section-h"><h2 class="label">Classement</h2><span class="label">Total</span></div>
    <div class="card rank">${rows.map((r, k) => `
    <div class="rank-row ${r.rank === 1 ? 'first' : ''}" data-pi="${r.i}">
      <span class="rank-pos">${r.rank === 1 && n ? icon('crown', 20, 'role="img" aria-label="En tête"') : r.rank}</span>
      ${avatar(names[r.i], r.rank === 1 && n ? 'lead' : '')}
      <span class="rank-n">${esc(names[r.i])}</span>
      ${n ? `<span class="rank-d ${tone(mod, game, r.delta)}">${sign(r.delta)}</span>` : ''}
      <span class="rank-total">${r.total}</span>
    </div>`).join('')}</div></section>`;
  const order = rows.map(r => r.i), prev = lastOrder[game.id];
  lastOrder[game.id] = order;
  const after = () => {
    if (!animate || !prev) return;
    document.querySelectorAll('.rank-row').forEach(el => {
      const i = +el.dataset.pi, from = prev.indexOf(i), to = order.indexOf(i);
      el.classList.add('flash');
      if (from >= 0 && from !== to) {
        el.style.transform = `translateY(${(from - to) * el.offsetHeight}px)`;
        el.style.transition = 'none';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; el.style.transform = '';
        }));
      }
    });
  };
  return { html, after };
}

function scoreSheet(game) {
  const mod = modOf(game), names = namesOf(game), n = played(game);
  if (!n) return '';
  const pts = Array.from({ length: n }, (_, r) => mod.roundPoints(game, r));
  let h = '<table class="tbl"><thead><tr><th class="nm" scope="col"><span class="sr">Joueur</span></th>';
  for (let r = 0; r < n; r++) {
    const hd = mod.roundHead(game, r);
    h += `<th scope="col"><button class="th-btn" data-act="edit" data-r="${r}" aria-label="Modifier la manche ${r + 1}">${hd.label}<small>${hd.sub}</small></button></th>`;
  }
  h += '</tr></thead><tbody>';
  names.forEach((nm, i) => {
    h += `<tr><td class="nm">${esc(nm)}</td>${pts.map(p => `<td class="${tone(mod, game, p[i])}">${winnerMode(mod, game) === 'lowest' ? p[i] : sign(p[i])}</td>`).join('')}</tr>`;
  });
  return `<section class="section"><div class="section-h"><h2 class="label">Feuille de score</h2></div>
    <div class="card pad"><div class="sheet-wrap">${h}</tbody></table></div>
    <p class="hint" style="margin-top:8px">Touchez une manche pour la modifier.</p></div></section>`;
}

function gameRow(g) {
  const mod = modOf(g); if (!mod) return '';
  const names = namesOf(g), n = played(g);
  let title, val = '';
  if (g.status === 'done') {
    const w = winners(mod, g), t = gameTotals(g);
    title = `${w.map(i => esc(names[i])).join(' et ')} ${w.length > 1 ? 'à égalité' : teamGame(g) ? 'gagnent' : 'gagne'}`;
    val = `<span class="row-v">${t[w[0]]}</span>`;
  } else title = 'En cours';
  return `<li><button class="row" data-act="open" data-id="${g.id}">
    <div class="row-txt"><span class="row-t">${mod.name} · ${title}</span>
    <span class="row-s">${shortDate(g.startedAt)} · ${plural(names.length, 'joueur', 'joueurs')} · ${roundsLabel(mod, n)}</span></div>
    ${val}${icon('chevron', 18, 'class="ic chev"')}</button></li>`;
}

/* ═══════════════ Écrans ═══════════════ */
const SCREENS = {
  home() {
    // Partie à reprendre : la dernière ouverte, sinon la plus récente encore en cours
    const cur = db.current && gameById(db.current);
    const playing = cur && cur.status === 'playing' ? cur
      : db.games.filter(g => g.status === 'playing').sort((a, b) => b.startedAt - a.startedAt)[0] || null;
    let body = '';
    if (playing) {
      const mod = modOf(playing), rows = ranking(mod, playing), names = namesOf(playing), p = progressOf(playing);
      const lead = played(playing) ? `${esc(names[rows[0].i])} mène` : 'Aucune manche jouée';
      body += `<button class="resume" data-act="go" data-to="game" data-id="${playing.id}">
        <span class="resume-k">Partie en cours</span>
        <span class="resume-main"><span><span class="resume-t">${mod.name}</span><br><span class="resume-s">${p.label} · ${esc(playerNamesOf(playing).join(', '))}</span></span>
          <span><span class="resume-s">${lead}</span><br><span class="resume-v">${played(playing) ? rows[0].total : ''}</span></span></span>
        ${p.ratio === null ? '' : `<span class="track"><i style="width:${p.ratio * 100}%"></i></span>`}
        <span class="resume-go">Reprendre ${icon('next', 20)}</span>
      </button>`;
    }
    body += `<button class="btn ${playing ? 'btn-secondary' : 'btn-primary'}" data-act="newGame">${icon('plus', 22)} Nouvelle partie</button>`;
    const others = db.games.filter(g => g !== playing).sort((a, b) => b.startedAt - a.startedAt);
    if (others.length) {
      body += `<section class="section"><div class="section-h"><h2 class="label">Dernières parties</h2>
        ${others.length > 3 ? '<button class="link" data-act="go" data-to="history">Tout voir</button>' : ''}</div>
        <ul class="card list">${others.slice(0, 3).map(gameRow).join('')}</ul></section>`;
    } else if (!playing) {
      body += `<div class="empty">${LOGO}<p>Aucune partie pour l’instant.<br>Lancez la première !</p></div>`;
    }
    return { large: true, title: 'Ardoise', right: `<button class="icon-btn" data-act="settings" aria-label="Réglages">${icon('settings')}</button>`, body, tab: 'home' };
  },

  newgame() {
    if (!setup) return SCREENS.home();
    if (!setup.gameId) {
      return { title: 'Nouvelle partie', sub: 'Choisir un jeu', back: { to: 'home' },
        body: `<ul class="card list">${gamesByRecency().map(m => `<li><button class="row" data-act="pickGame" data-g="${m.id}">
          <div class="row-txt"><span class="row-t">${m.name}</span><span class="row-s">${m.tagline}</span></div>${icon('chevron', 18, 'class="ic chev"')}</button></li>`).join('')}</ul>` };
    }
    const mod = getGame(setup.gameId), n = setup.playerIds.length, range = rangeOf(mod, setup.options);
    const sel = setup.playerIds.map((id, k) => `<li class="prow"><div class="prow-main">${avatar(nameOf(id))}
      <div class="prow-txt"><span class="prow-n">${esc(nameOf(id))}</span>${mod.seatLabel && mod.seatLabel(k, setup.options) ? `<span class="prow-s">${mod.seatLabel(k, setup.options)}</span>` : ''}</div>
      ${k > 0 && mod.seatLabel ? `<button class="icon-btn plain" data-act="setupUp" data-k="${k}" aria-label="Faire monter ${esc(nameOf(id))}"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>` : ''}
      <button class="icon-btn plain" data-act="setupRemove" data-k="${k}" aria-label="Retirer ${esc(nameOf(id))}">${icon('close', 20)}</button></div></li>`).join('');
    const sugg = recentPlayers(db).filter(p => !setup.playerIds.includes(p.id)).slice(0, 6);
    const full = n >= range.max;
    const body = `
      <section class="section"><div class="section-h"><h2 class="label">Joueurs · ${n}</h2><span class="hint">${range.min === range.max ? `${range.max} joueurs` : `${range.min} à ${range.max}`}</span></div>
        ${n ? `<ul class="card list">${sel}</ul>` : ''}
        ${full ? '' : `<div class="add-row"><input class="field" id="np" type="text" maxlength="16" autocomplete="off" autocapitalize="words" enterkeyhint="done"
            placeholder="Nom d’un joueur" aria-label="Nom d’un joueur" data-input="setupName" data-enter="setupAdd" value="${esc(setup.typing || '')}">
          <button class="icon-btn" data-act="setupAdd" aria-label="Ajouter le joueur">${icon('plus')}</button></div>
          ${sugg.length ? `<div class="row-extra" style="padding-left:0">${sugg.map(p => `<button class="chip add" data-act="setupPick" data-id="${p.id}">${esc(p.name)}</button>`).join('')}</div>` : ''}`}
      </section>
      ${mod.options.filter(o => o.prominent).map(o => `<section class="section"><h2 class="label">${o.label}</h2>
        ${segmented(o.choices, setup.options[o.key], 'setOptMain', o.label, { k: o.key })}<p class="hint">${o.desc(setup.options)}</p></section>`).join('')}
      <section class="section"><h2 class="label">Partie</h2>
        <ul class="card list">
          ${mod.formats.length > 1 ? `<li><button class="row" data-act="setupFormat"><div class="row-txt"><span class="row-t">${mod.formats.find(f => f.id === setup.format).name}</span>
            <span class="row-s">${mod.formatSummary(setup, Math.max(n, range.min))}</span></div>${icon('chevron', 18, 'class="ic chev"')}</button></li>` : ''}
          ${mod.visibleOptions(setup.options, n).some(o => !o.prominent) ? `<li><button class="row" data-act="setupOptions"><div class="row-txt"><span class="row-t">Règles et variantes</span>
            <span class="row-s">${mod.optionsSummary(setup.options, n)}</span></div>${icon('chevron', 18, 'class="ic chev"')}</button></li>` : ''}
        </ul></section>`;
    const ok = n >= range.min && n <= range.max;
    const need = n < range.min ? (range.min === range.max ? `Il faut ${range.min} joueurs` : `Ajoutez au moins ${range.min} joueur${range.min > 1 ? 's' : ''}`) : `${range.max} joueurs au maximum`;
    return { title: mod.name, sub: 'Nouvelle partie', back: GAMES.length > 1 ? { to: 'newgamePick' } : { to: 'home' }, body,
      bar: `<button class="btn btn-primary" data-act="startGame" ${ok ? '' : 'disabled'}>${ok ? `Commencer · ${plural(n, 'joueur', 'joueurs')}` : need}</button>` };
  },

  game(p, opts) {
    const g = gameById(p.id);
    if (!g) return SCREENS.home();
    if (g.status === 'done') { route = { name: 'end', params: { id: g.id } }; return SCREENS.end(route.params, opts); }
    const mod = modOf(g), pr = progressOf(g);
    const rk = rankCard(g, p.animate);
    p.animate = false;
    return {
      title: mod.name, sub: pr.label, back: { to: 'home', label: 'Accueil' },
      right: `<button class="icon-btn" data-act="menu" aria-label="Options de la partie">${icon('more')}</button>`,
      body: `${pr.ratio === null ? '' : `<div class="track" role="progressbar" aria-label="Progression de la partie" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pr.ratio * 100)}"><i style="width:${pr.ratio * 100}%"></i></div>`}
        ${rk.html}${scoreSheet(g)}
        ${(typeof mod.manualEnd === 'function' ? mod.manualEnd(g) : mod.manualEnd) && played(g) ? `<button class="btn btn-secondary" data-act="endGame">Terminer la partie</button>` : ''}`,
      bar: `<button class="btn btn-primary" data-act="go" data-to="round" data-id="${g.id}">${mod.nextLabel(g)} ${icon('next', 20)}</button>`,
      after: rk.after
    };
  },

  round(p) {
    const g = gameById(p.id);
    if (!g || g.status === 'done') return SCREENS.home();
    const s = modOf(g).roundScreen(api, g);
    s.back = { to: 'game', id: g.id, label: 'Classement' };
    return s;
  },

  end(p) {
    const g = gameById(p.id);
    if (!g) return SCREENS.home();
    const mod = modOf(g), names = namesOf(g), t = gameTotals(g), w = winners(mod, g);
    const tie = w.length > 1;
    const celebrate = p.celebrate; p.celebrate = false;
    const body = `
      <section class="win">${celebrate ? '<div class="conf" id="conf"></div>' : ''}
        ${icon('crown', 40)}
        <span class="win-k">${mod.name} · ${roundsLabel(mod, g.rounds.length)}</span>
        <h2 class="win-n">${tie ? `${w.map(i => esc(names[i])).join(' et ')}` : `${esc(names[w[0]])} ${teamGame(g) ? 'gagnent' : 'gagne'}`}</h2>
        <span class="win-p">${tie ? `Égalité à ${t[w[0]]} ${unitOf(mod, t[w[0]])}${mod.tieHint ? ` — ${mod.tieHint}` : ''}` : `${t[w[0]]} ${unitOf(mod, t[w[0]])}`}</span>
      </section>
      ${rankCard(g, false).html}
      <div class="tiles">${mod.endStats(g, names).map(s => `<div class="tile"><b>${s.v}</b><span>${s.l}</span></div>`).join('')}</div>
      ${scoreSheet(g)}`;
    return {
      title: 'Fin de partie', sub: `${mod.name} · ${shortDate(g.endedAt || g.startedAt)}`, back: { to: 'home', label: 'Accueil' },
      right: `<button class="icon-btn" data-act="menu" aria-label="Options de la partie">${icon('more')}</button>`,
      body,
      bar: `<button class="btn btn-primary" data-act="rematch">Revanche</button>`,
      after: celebrate ? confetti : null
    };
  },

  players() {
    const list = recentPlayers(db);
    const body = list.length
      ? `<ul class="card list">${list.map(p => {
          const s = playerStats(db, getGame, p.id);
          return `<li><button class="row" data-act="player" data-id="${p.id}">${avatar(p.name)}
            <div class="row-txt"><span class="row-t">${esc(p.name)}</span><span class="row-s">${s.played ? `${plural(s.played, 'partie', 'parties')} · ${plural(s.wins, 'victoire', 'victoires')}` : 'Aucune partie terminée'}</span></div>
            ${icon('chevron', 18, 'class="ic chev"')}</button></li>`;
        }).join('')}</ul>`
      : `<div class="empty"><p>Les joueurs ajoutés à une partie apparaissent ici, avec leurs statistiques.</p></div>`;
    return { title: 'Joueurs', body, tab: 'players',
      right: `<button class="icon-btn" data-act="playerNew" aria-label="Ajouter un joueur">${icon('plus')}</button>` };
  },

  history() {
    const list = db.games.slice().sort((a, b) => b.startedAt - a.startedAt);
    return { title: 'Historique', sub: plural(list.length, 'partie', 'parties'), back: { to: 'home', label: 'Accueil' },
      body: list.length ? `<ul class="card list">${list.map(gameRow).join('')}</ul>` : '<div class="empty"><p>Aucune partie.</p></div>' };
  }
};
SCREENS.newgamePick = () => { if (setup) setup.gameId = null; route = { name: 'newgame', params: {} }; return SCREENS.newgame(); };

function confetti() {
  const box = document.getElementById('conf'); if (!box) return;
  const cols = ['#E3B04B', '#F3EFE6', '#C9D1D8'];
  for (let k = 0; k < 28; k++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%';
    c.style.background = cols[k % cols.length];
    c.style.animationDelay = (Math.random() * .6) + 's';
    c.style.animationDuration = (1.2 + Math.random() * .8) + 's';
    box.appendChild(c);
  }
}

/* ═══════════════ Modification d'une manche validée ═══════════════ */
function openEditor(gameId, r) {
  const g = gameById(gameId);
  if (!g || r >= played(g)) { toast('Cette manche n’a pas encore été jouée'); return; }
  draft = { gameId, r, round: JSON.parse(JSON.stringify(g.rounds[r])), open: {} };
  renderEditor();
}
function renderEditor() {
  if (!draft) return;
  const g = gameById(draft.gameId), mod = modOf(g);
  const preview = { ...g, rounds: g.rounds.map((x, k) => k === draft.r ? draft.round : x) };
  draft.after = totals(mod, preview);
  const { body, status } = mod.editorBody(api, g, draft);
  openSheet({
    title: `Modifier la manche ${draft.r + 1}`,
    sub: [mod.roundHead(g, draft.r).long, 'les totaux seront recalculés'].filter(Boolean).join(' · '),
    body,
    foot: `<div class="tally ${status.ok ? 'ok' : 'ko'}" id="ed-tally" role="status">${status.html}</div>
      <div class="btn-row"><button class="btn btn-secondary" data-act="sheetClose">Annuler</button>
      <button class="btn btn-primary" data-act="edSave">Enregistrer</button></div>`,
    onClose: () => { draft = null; }
  });
  applyTick();
}

/* ═══════════════ Feuilles : réglages, menu, options… ═══════════════ */
function applyTheme() {
  const t = db.prefs.theme;
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  document.querySelectorAll('meta[name=theme-color]').forEach(m => {
    m.content = t === 'dark' ? '#161D23' : t === 'light' ? '#F5F2EB' : (m.media.includes('dark') ? '#161D23' : '#F5F2EB');
  });
}

function settingsSheet() {
  openSheet({
    title: 'Réglages',
    body: `<section class="section"><h3 class="label">Apparence</h3>
        ${segmented([['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']], db.prefs.theme, 'theme', 'Thème')}</section>
      <section class="section"><h3 class="label">Règles des jeux</h3>
        <ul class="card list">${GAMES.map(m => `<li><button class="row" data-act="rules" data-game="${m.id}"><div class="row-txt"><span class="row-t">${m.name}</span></div>${icon('chevron', 18, 'class="ic chev"')}</button></li>`).join('')}</ul></section>
      <section class="section"><h3 class="label">Données</h3>
        <ul class="card list">
          <li><button class="row" data-act="go" data-to="history"><div class="row-txt"><span class="row-t">Historique des parties</span></div>${icon('chevron', 18, 'class="ic chev"')}</button></li>
          <li><button class="row" data-act="export"><div class="row-txt"><span class="row-t">Exporter une sauvegarde</span><span class="row-s">Fichier à conserver en lieu sûr</span></div>${icon('share', 20, 'class="ic chev"')}</button></li>
        </ul>
        <button class="btn btn-danger" data-act="wipe">Effacer toutes les données</button></section>
      <p class="hint center">Ardoise ${VERSION} · données enregistrées sur cet appareil uniquement</p>`
  });
}

function menuSheet() {
  const g = gameById(route.params.id); if (!g) return;
  const done = g.status === 'done';
  openSheet({
    title: modOf(g).name,
    sub: playerNamesOf(g).map(esc).join(', '),
    body: `<ul class="card list">
        <li><button class="row" data-act="rules" data-game="${g.gameId}">${icon('book')}<div class="row-txt"><span class="row-t">Règles du jeu</span></div></button></li>
        <li><button class="row" data-act="share">${icon('share')}<div class="row-txt"><span class="row-t">Partager les scores</span></div></button></li>
        ${played(g) ? `<li><button class="row" data-act="editList">${icon('edit')}<div class="row-txt"><span class="row-t">Modifier une manche</span></div></button></li>` : ''}
      </ul>
      <button class="btn btn-danger" data-act="deleteGame">${done ? 'Supprimer cette partie' : 'Abandonner la partie'}</button>`
  });
}

function editListSheet() {
  const g = gameById(route.params.id), mod = modOf(g), names = namesOf(g);
  const rows = Array.from({ length: played(g) }, (_, r) => r).reverse().map(r => {
    const pts = mod.roundPoints(g, r);
    return `<li><button class="row" data-act="edit" data-r="${r}"><div class="row-txt"><span class="row-t">Manche ${r + 1}</span>
      <span class="row-s">${names.map((n, i) => `${esc(n)} ${sign(pts[i])}`).join(' · ')}</span></div>${icon('chevron', 18, 'class="ic chev"')}</button></li>`;
  }).join('');
  openSheet({ title: 'Modifier une manche', body: `<ul class="card list">${rows}</ul>` });
}

function formatSheet() {
  const mod = getGame(setup.gameId), n = Math.max(setup.playerIds.length, rangeOf(mod, setup.options).min);
  openSheet({
    title: 'Format',
    body: `<ul class="card list">${mod.formats.map(f => `<li><button class="opt-row ${f.id === setup.format ? 'on' : ''}" style="width:100%;text-align:left" data-act="setFormat" data-v="${f.id}" role="radio" aria-checked="${f.id === setup.format}">
      <span class="radio"></span><span class="row-txt"><span class="row-t">${f.name}</span><span class="row-s">${mod.formatSummary({ ...setup, format: f.id }, n)}</span></span></button></li>`).join('')}</ul>`
  });
}

function optionsSheet() {
  const mod = getGame(setup.gameId), o = setup.options, n = setup.playerIds.length;
  const rows = mod.visibleOptions(o, n).filter(d => !d.prominent).map(d => d.type === 'choice'
    ? `<section class="section"><h3 class="label">${d.label}</h3>${segmented(d.choices, o[d.key], 'setOpt', d.label, { k: d.key })}<p class="hint">${d.desc(o)}</p></section>`
    : `<div class="opt-row"><div class="row-txt"><span class="row-t">${d.label}</span><span class="row-s" style="white-space:normal">${d.desc(o)}</span></div>${toggle(!!o[d.key], 'setOpt', { k: d.key }, d.label)}</div>`);
  const first = rows.findIndex(r => r.startsWith('<div'));
  const choices = rows.filter(r => r.startsWith('<section')).join('');
  const toggles = rows.filter(r => r.startsWith('<div'));
  openSheet({
    title: 'Règles et variantes',
    sub: 'Tout est désactivé par défaut : règles de base',
    body: choices + (first >= 0 ? `<section class="section"><h3 class="label">Variantes</h3><div class="card list" style="padding:0 16px">${toggles.join('')}</div></section>` : ''),
    foot: '<button class="btn btn-primary" data-act="sheetClose">OK</button>',
    onClose: () => render()
  });
}

function playerSheet(id) {
  const p = playerById(id); if (!p) return;
  const s = playerStats(db, getGame, id);
  const inGames = db.games.some(g => g.playerIds.includes(id));
  const byGame = Object.entries(s.byGame);
  const max = Math.max(1, ...byGame.map(([, v]) => v.played));
  openSheet({
    title: esc(p.name),
    body: `<div class="tiles"><div class="tile"><b>${s.played}</b><span>parties terminées</span></div>
        <div class="tile"><b>${s.wins}</b><span>victoires</span></div><div class="tile"><b>${s.winRate} %</b><span>taux de victoire</span></div></div>
      ${byGame.length ? `<section class="section"><h3 class="label">Par jeu</h3><div class="card pad bars">${byGame.map(([gid, v]) =>
        `<div class="bar-row"><span style="width:96px">${(getGame(gid) || { name: gid }).name}</span><span class="track"><i style="width:${v.played / max * 100}%"></i></span><span class="num">${v.wins}/${v.played}</span></div>`).join('')}
        </div><p class="hint">Victoires / parties</p></section>` : ''}
      <section class="section"><h3 class="label">Nom</h3><div class="add-row">
        <input class="field" id="pname" type="text" maxlength="16" value="${esc(p.name)}" aria-label="Nom du joueur" data-enter="playerRename" data-id="${id}">
        <button class="icon-btn" data-act="playerRename" data-id="${id}" aria-label="Enregistrer le nom">${icon('check')}</button></div></section>
      ${inGames ? '' : `<button class="btn btn-danger" data-act="playerDelete" data-id="${id}">Supprimer ce joueur</button>`}`
  });
}

function shareText(g) {
  const mod = modOf(g), names = namesOf(g), rows = ranking(mod, g);
  return `${mod.name} — ${progressOf(g).label}\n\n` + rows.map(r => `${r.rank}. ${names[r.i]} — ${r.total} pts`).join('\n') + '\n\nAvec Ardoise';
}

/* ═══════════════ API offerte aux modules de jeu ═══════════════ */
const api = {
  game: () => gameById(route.params.id),
  names: playerNamesOf,
  sideNames: namesOf,
  totals: (g, upto) => gameTotals(g, upto),
  save,
  render: anim => render({ enter: !!anim }),
  toast,
  shake: id => shake(document.getElementById(id)),
  sheet: o => { openSheet(o); applyTick(); },
  draft: () => draft,
  editorRefresh: renderEditor,
  finishRound(g) {
    const mod = modOf(g);
    g.cur++; g.step = 'bid';
    if (mod.isOver(g)) {
      g.status = 'done'; g.endedAt = Date.now();
      if (db.current === g.id) db.current = null;
      save(); buzz(30);
      go('end', { id: g.id, celebrate: true });
    } else {
      if (mod.prepareRound) mod.prepareRound(g);
      save(); buzz(16);
      go('game', { id: g.id, animate: true });
    }
  },
  previewTotals: (g, r, round) => totals(modOf(g), { ...g, rounds: g.rounds.map((x, k) => (k === r ? round : x)) })
};
GAMES.forEach(m => on(m.actions(api)));

/* ═══════════════ Actions ═══════════════ */
function gamesByRecency() {
  const last = {};
  db.games.forEach(g => { last[g.gameId] = Math.max(last[g.gameId] || 0, g.startedAt || 0); });
  return GAMES.slice().sort((a, b) => (last[b.id] || 0) - (last[a.id] || 0));
}
function startSetup(gameId) {
  const last = db.games.slice().sort((a, b) => b.startedAt - a.startedAt)[0];
  const gid = gameId || (GAMES.length === 1 ? GAMES[0].id : null);
  setup = { gameId: gid, playerIds: last ? last.playerIds.filter(playerById) : [], typing: '' };
  if (gid) initSetupGame(gid, last);
}
function initSetupGame(gid, last) {
  const mod = getGame(gid);
  const same = last && last.gameId === gid;
  setup.gameId = gid;
  setup.format = same ? last.format : mod.defaultFormat;
  setup.options = same ? { ...mod.defaultOptions(), ...last.options } : mod.defaultOptions();
}
function addSetupPlayer(id) {
  const mod = getGame(setup.gameId);
  if (setup.playerIds.includes(id)) { toast('Déjà dans la partie'); return false; }
  const max = rangeOf(mod, setup.options).max;
  if (setup.playerIds.length >= max) { toast(`${max} joueurs au maximum`); return false; }
  setup.playerIds.push(id);
  return true;
}

on({
  go: d => go(d.to, d.id ? { id: d.id } : {}),
  open: d => { const g = gameById(d.id); if (!g) return; if (g.status === 'playing') db.current = g.id, save(); go(g.status === 'done' ? 'end' : 'game', { id: g.id }); },
  newGame: () => { startSetup(); go('newgame'); },
  pickGame: d => { initSetupGame(d.g, db.games.slice().sort((a, b) => b.startedAt - a.startedAt)[0]); render({ enter: true }); },
  setupName: v => { setup.typing = v; },
  setupAdd: () => {
    const name = normName(setup.typing || (document.getElementById('np') || {}).value);
    if (!name) { document.getElementById('np')?.focus(); return; }
    const p = playerByName(db, name);
    if (addSetupPlayer(p.id)) { setup.typing = ''; save(); render(); document.getElementById('np')?.focus(); }
  },
  setupPick: d => { if (addSetupPlayer(d.id)) render(); },
  setupRemove: d => { setup.playerIds.splice(+d.k, 1); render(); },
  setupUp: d => { const k = +d.k, a = setup.playerIds; [a[k - 1], a[k]] = [a[k], a[k - 1]]; render(); },
  setupFormat: formatSheet,
  setFormat: d => { setup.format = d.v; closeSheet(true); render(); },
  setupOptions: optionsSheet,
  setOptMain: d => { setup.options[d.k] = d.v; render(); },
  endGame: () => {
    const g = gameById(route.params.id);
    if (!g || !confirm('Terminer la partie maintenant ? Le classement actuel devient le résultat final.')) return;
    g.rounds.length = Math.min(g.cur, g.rounds.length); g.cur = g.rounds.length;
    g.status = 'done'; g.endedAt = Date.now();
    if (db.current === g.id) db.current = null;
    save(); buzz(30);
    go('end', { id: g.id, celebrate: true });
  },
  setOpt: d => {
    const def = getGame(setup.gameId).options.find(o => o.key === d.k);
    setup.options[d.k] = def.type === 'choice' ? d.v : !setup.options[d.k];
    optionsSheet();
  },
  startGame: () => {
    const mod = getGame(setup.gameId);
    const g = { id: uid('g'), gameId: mod.id, status: 'playing', startedAt: Date.now(), endedAt: null,
      playerIds: setup.playerIds.slice(), format: setup.format, options: { ...setup.options }, dealer: 0 };
    mod.setup(g);
    db.games.push(g); db.current = g.id; setup = null; save();
    go('round', { id: g.id });
  },
  rematch: () => {
    const old = gameById(route.params.id), mod = modOf(old);
    const g = { id: uid('g'), gameId: old.gameId, status: 'playing', startedAt: Date.now(), endedAt: null,
      playerIds: old.playerIds.slice(), format: old.format, options: { ...old.options }, dealer: (old.dealer + 1) % old.playerIds.length };
    mod.setup(g);
    db.games.push(g); db.current = g.id; save();
    toast('Revanche !');
    go('round', { id: g.id });
  },
  edit: d => openEditor(route.params.id, +d.r),
  editList: editListSheet,
  edSave: () => {
    const g = gameById(draft.gameId), v = modOf(g).validateRound(g, draft.round, draft.r);
    if (!v.ok) { toast(v.msg); shake(document.getElementById('ed-tally')); return; }
    const r = draft.r, mod = modOf(g);
    g.rounds[r] = draft.round; draft = null;
    closeSheet(true); buzz(16);
    // Une modification peut changer la fin de partie (Skyjo : passer ou non la barre des 100 points)
    const over = mod.isOver(g);
    if (g.status === 'playing' && over && mod.prepareRound) {
      g.rounds.length = g.cur; g.status = 'done'; g.endedAt = Date.now();
      if (db.current === g.id) db.current = null;
      save(); toast(`Manche ${r + 1} modifiée · la partie est terminée`);
      go('end', { id: g.id });
      return;
    }
    if (g.status === 'done' && !over && mod.prepareRound) {
      g.status = 'playing'; g.endedAt = null; g.cur = g.rounds.length; mod.prepareRound(g); db.current = g.id;
      save(); toast(`Manche ${r + 1} modifiée · la partie reprend`);
      go('game', { id: g.id });
      return;
    }
    save();
    toast(`Manche ${r + 1} modifiée · totaux recalculés`);
    render();
  },
  menu: menuSheet,
  rules: d => {
    const m = getGame(d.game);
    openSheet({ title: `Règles · ${m.name}`, body: `<div class="rules">${m.rulesHtml}</div>` });
  },
  share: () => {
    const g = gameById(route.params.id), txt = shareText(g);
    closeSheet(true);
    if (navigator.share) navigator.share({ title: 'Ardoise', text: txt }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Scores copiés')).catch(() => toast('Copie impossible'));
  },
  deleteGame: () => {
    const g = gameById(route.params.id);
    if (!confirm(g.status === 'done' ? 'Supprimer cette partie de l’historique ?' : 'Abandonner la partie en cours ? Les scores seront perdus.')) return;
    db.games = db.games.filter(x => x !== g);
    if (db.current === g.id) db.current = null;
    save(); toast(g.status === 'done' ? 'Partie supprimée' : 'Partie abandonnée');
    go('home');
  },
  settings: settingsSheet,
  theme: d => { db.prefs.theme = d.v; save(); applyTheme(); settingsSheet(); },
  export: () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ardoise-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  wipe: () => {
    if (!confirm('Effacer toutes les parties et tous les joueurs ? Cette action est définitive.')) return;
    const theme = db.prefs.theme;
    db = { schema: 1, players: [], games: [], current: null, prefs: { theme }, legacyImported: true };
    save(); toast('Données effacées'); go('home');
  },
  player: d => playerSheet(d.id),
  playerNew: () => openSheet({
    title: 'Nouveau joueur',
    body: `<div class="add-row"><input class="field" id="pnew" type="text" maxlength="16" autocapitalize="words" placeholder="Nom" aria-label="Nom du joueur" data-enter="playerCreate">
      <button class="icon-btn" data-act="playerCreate" aria-label="Ajouter">${icon('check')}</button></div>`
  }),
  playerCreate: () => {
    const name = normName(document.getElementById('pnew').value);
    if (!name) return;
    if (db.players.some(p => p.name.toLowerCase() === name.toLowerCase())) { toast('Ce joueur existe déjà'); return; }
    playerByName(db, name); save(); closeSheet(true); render();
  },
  playerRename: (d, el) => {
    const id = d.id || (el && el.dataset.id);
    const name = normName(document.getElementById('pname').value);
    if (!name) return;
    if (db.players.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) { toast('Ce nom est déjà pris'); return; }
    playerById(id).name = name; save(); closeSheet(true); toast('Nom enregistré'); render();
  },
  playerDelete: d => {
    db.players = db.players.filter(p => p.id !== d.id);
    save(); closeSheet(true); render();
  }
});

/* ═══════════════ Démarrage ═══════════════ */
installDispatcher();
applyTheme();
if (db.current && gameById(db.current)?.status === 'playing') route = { name: 'home', params: {} };
render();
const splash = document.getElementById('splash');
const justUpdated = (() => { try { const v = sessionStorage.getItem('ardoise.updated'); sessionStorage.removeItem('ardoise.updated'); return !!v; } catch (e) { return false; } })();
if (justUpdated) { splash.remove(); setTimeout(() => toast('Ardoise est à jour'), 300); }
else {
  setTimeout(() => splash.classList.add('out'), matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1100);
  setTimeout(() => splash.remove(), 1600);
}

/* ═══════════════ Mise à jour automatique (comme Zeste et ASCEN) ═══════════════
   Le service worker sert l'app depuis la copie locale et télécharge la dernière version en
   arrière-plan. Au lancement, si une nouvelle version arrive avant le premier toucher, l'app
   se recharge d'elle-même ; ensuite, un message propose « Recharger » (et la nouvelle version
   s'appliquera de toute façon au prochain lancement). Pas de service worker sur claude.ai ni
   en fichier local. */
const SW_OK = 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')
  && !/claude\.ai|claudeusercontent/.test(location.hostname);
const bootAt = Date.now();
let touched = false, updTimer = null, updShown = false, lastCheck = Date.now();
document.addEventListener('pointerdown', () => { touched = true; }, { capture: true, once: true });
function onUpdateReady() {
  clearTimeout(updTimer);
  // on laisse les autres fichiers finir d'arriver avant d'appliquer
  updTimer = setTimeout(() => {
    if (!touched && !justUpdated && Date.now() - bootAt < 8000) {
      try { sessionStorage.setItem('ardoise.updated', '1'); } catch (e) { /* rien */ }
      location.reload();
      return;
    }
    if (updShown) return;
    updShown = true;
    toast('Nouvelle version d’Ardoise prête', { ms: 9000, action: { label: 'Recharger', fn: () => { try { sessionStorage.setItem('ardoise.updated', '1'); } catch (e) { /* rien */ } location.reload(); } } });
  }, 900);
}
if (SW_OK) {
  try {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'ardoise-updated') onUpdateReady(); });
    // l'app installée reste souvent ouverte longtemps : on revérifie au retour au premier plan (au plus toutes les 30 min)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck < 30 * 60e3 || !navigator.onLine) return;
      lastCheck = Date.now();
      navigator.serviceWorker.ready.then(r => { if (r.active) r.active.postMessage({ type: 'ardoise-check' }); r.update().catch(() => {}); }).catch(() => {});
    });
  } catch (e) { /* le service worker est un plus, jamais un prérequis */ }
}
