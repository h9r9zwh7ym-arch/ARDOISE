/* Briques d'interface partagées par le noyau et les modules de jeu.
   Les boutons portent data-act="nom" ; un seul écouteur appelle l'action enregistrée. */

const ACTIONS = {};
export function on(map) { Object.assign(ACTIONS, map); }

export function installDispatcher(root = document) {
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
  });
  root.addEventListener('input', e => {
    const el = e.target.closest('[data-input]');
    const fn = el && ACTIONS[el.dataset.input];
    if (fn) fn(el.value, el, e);
  });
  root.addEventListener('keydown', e => {
    const el = e.target.closest('[data-enter]');
    if (el && e.key === 'Enter') { const fn = ACTIONS[el.dataset.enter]; if (fn) { e.preventDefault(); fn(el.value, el, e); } }
  });
}

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const sign = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v);
export const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
export const initial = name => (String(name || '?').trim()[0] || '?').toUpperCase();

export function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms || 8); } catch (e) { /* iOS : pas de vibration */ } }

/* ─── Icônes (traits, couleur héritée) ─── */
const P = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  more: '<circle cx="5.5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  crown: '<path d="M4 17h16l1-10-5 4-4-7-4 7-5-4z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  tally: '<path d="M6 6v12M10 6v12M14 6v12M18 6v12M4 15l16-6"/>',
  players: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.6c2.2 0 3.8 1.3 4.5 3.8"/>',
  share: '<path d="M12 4v11M8 8l4-4 4 4"/><path d="M5 13v6h14v-6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  book: '<path d="M5 4h11l3 3v13H5z"/><path d="M9 10h6M9 14h6"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
  star: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>'
};
export function icon(name, size = 22, extra = '') {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[name] || ''}</svg>`;
}

export const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true" class="logo"><rect width="64" height="64" rx="15" class="logo-bg"/><path class="logo-t" d="M20 20.5 L19.4 43.5 M27.2 20 L26.8 44 M34.4 20.6 L34 43.6 M41.6 20.2 L41.2 43.8"/><path class="logo-x" d="M14.5 39.5 L48 24.5"/></svg>`;

function dataAttrs(data) { return Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' '); }

export function avatar(name, cls = '') {
  return `<span class="av ${cls}" aria-hidden="true">${esc(initial(name))}</span>`;
}

/** Compteur − valeur + ; act reçoit data-d = -1 ou 1 et les data supplémentaires. */
export function stepper({ value, act, data = {}, label = '', min = 0, max = 99, id = '' }) {
  const d = dataAttrs(data);
  return `<div class="step" role="group" aria-label="${esc(label)}">
    <button class="step-b" data-act="${act}" data-d="-1" ${d} aria-label="${esc(label)} : moins" ${value <= min ? 'disabled' : ''}>${icon('minus', 22)}</button>
    <output class="step-v" ${id ? `id="${id}"` : ''}>${value}</output>
    <button class="step-b" data-act="${act}" data-d="1" ${d} aria-label="${esc(label)} : plus" ${value >= max ? 'disabled' : ''}>${icon('plus', 22)}</button>
  </div>`;
}

export function toggle(on, act, data = {}, label = '') {
  const d = dataAttrs(data);
  return `<button class="tgl ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-act="${act}" ${d}></button>`;
}

export function segmented(items, current, act, label = '', data = {}) {
  const d = dataAttrs(data);
  return `<div class="seg" role="radiogroup" aria-label="${esc(label)}">${items.map(([v, l]) =>
    `<button class="seg-i ${v === current ? 'on' : ''}" role="radio" aria-checked="${v === current}" data-act="${act}" data-v="${esc(v)}" ${d}>${l}</button>`).join('')}</div>`;
}

/* ─── Toast ─── */
/** toast(message) ou toast(message, { ms, action: { label, fn } }) */
export function toast(msg, opts = {}) {
  if (typeof opts === 'number') opts = { ms: opts };
  const t = document.getElementById('toast');
  t.textContent = msg;
  if (opts.action) {
    const b = document.createElement('button');
    b.className = 'toast-act'; b.textContent = opts.action.label;
    b.addEventListener('click', () => { t.classList.remove('show'); opts.action.fn(); });
    t.appendChild(b);
  }
  t.classList.toggle('has-act', !!opts.action);
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), opts.ms || 2400);
}

/* ─── Feuille modale (une seule à la fois) ─── */
let sheetClose = null;
export function openSheet({ title, sub = '', body, foot = '', onClose = null }) {
  const sh = document.getElementById('sheet');
  const wasOpen = sh.classList.contains('on');
  const scroll = wasOpen ? sh.querySelector('.sh-body').scrollTop : 0;
  sh.innerHTML = `<div class="sh-grab" aria-hidden="true"></div>
    <header class="sh-hd"><div class="sh-tt"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>
    <button class="icon-btn" data-act="sheetClose" aria-label="Fermer">${icon('close')}</button></header>
    <div class="sh-body">${body}</div>${foot ? `<footer class="sh-foot">${foot}</footer>` : ''}`;
  sh.querySelector('.sh-body').scrollTop = scroll;
  sheetClose = onClose;
  if (!wasOpen) {
    document.getElementById('scrim').classList.add('on');
    sh.classList.add('on');
    sh.setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked');
  }
}
export function closeSheet(silent) {
  const sh = document.getElementById('sheet');
  if (!sh.classList.contains('on')) return;
  sh.classList.remove('on'); sh.setAttribute('aria-hidden', 'true');
  document.getElementById('scrim').classList.remove('on');
  document.body.classList.remove('locked');
  const cb = sheetClose; sheetClose = null;
  if (cb && !silent) cb();
}
export const sheetOpen = () => document.getElementById('sheet').classList.contains('on');
on({ sheetClose: () => closeSheet() });

export function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

/** Date courte en français : « aujourd'hui », « hier », « samedi », « 3 oct. ». */
export function shortDate(ts, now = Date.now()) {
  if (!ts) return '';
  const d = new Date(ts), n = new Date(now);
  const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(n) - day(d)) / 864e5);
  if (diff === 0) return 'aujourd’hui';
  if (diff === 1) return 'hier';
  if (diff < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
