/* Graphiques d'Ardoise, en SVG pur (sans bibliothèque).
   Forme « mise en avant » : une seule série en couleur (ardoise / craie), les autres en gris,
   pour garder la palette sobre. Un appui sur un nom met sa courbe en avant ; un appui sur le
   graphique affiche les valeurs de la manche (info-bulle). */
import { esc, num } from './ui.js';

const W = 340;

/** Graduations « rondes » entre min et max (3 à 5 valeurs). */
export function niceTicks(min, max, count = 4) {
  if (min === max) { max = min + 1; }
  const span = max - min, raw = span / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => span / s <= count) || 10 * pow;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const t = [];
  for (let v = lo; v <= hi + step / 2; v += step) t.push(Math.round(v * 100) / 100);
  return t;
}
const compact = v => (Math.abs(v) >= 10000 ? `${num(Math.round(v / 100) / 10)}k` : num(v));

const charts = {};   // données des graphiques affichés, pour les info-bulles

/**
 * Courbes des totaux cumulés. series : [{ name, values: [total après 0, 1, 2… manches] }].
 * focus : index de la série mise en avant. animate : tracé progressif à l'affichage.
 */
export function lineChart({ id, series, focus = 0, animate = false, label = 'Total', roundLabel = r => `Manche ${r}` }) {
  const H = 196, m = { l: 38, r: 64, t: 14, b: 26 };
  const n = Math.max(1, series[0].values.length - 1);
  const all = series.flatMap(s => s.values);
  const ticks = niceTicks(Math.min(0, ...all), Math.max(...all), 4);
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const X = r => m.l + (W - m.l - m.r) * (r / n);
  const Y = v => m.t + (H - m.t - m.b) * (1 - (v - y0) / (y1 - y0 || 1));
  const path = vals => vals.map((v, r) => `${r ? 'L' : 'M'}${X(r).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  const order = series.map((_, i) => i).filter(i => i !== focus).concat(focus);   // la série en avant au premier plan
  const xEvery = Math.ceil(n / 6);
  const f = series[focus], fEnd = f.values[f.values.length - 1];
  charts[id] = { series, X, Y, n, H, roundLabel, focus };
  const len = W * 2;
  return `<figure class="chart" id="${id}" data-chart="${id}">
    <figcaption class="sr">${esc(label)} : ${series.map(s => `${esc(s.name)} ${num(s.values[s.values.length - 1])}`).join(', ')}</figcaption>
    <div class="chart-legend" role="radiogroup" aria-label="Mettre en avant">${series.map((s, i) =>
      `<button class="leg ${i === focus ? 'on' : ''}" role="radio" aria-checked="${i === focus}" data-act="chartFocus" data-chart="${id}" data-i="${i}"><i aria-hidden="true"></i>${esc(s.name)}</button>`).join('')}</div>
    <div class="chart-box">
    <svg viewBox="0 0 ${W} ${H}" class="chart-svg ${animate ? 'draw' : ''}" role="img" aria-label="${esc(label)} manche par manche">
      ${ticks.map(t => `<line class="grid ${t === 0 ? 'zero' : ''}" x1="${m.l}" x2="${W - m.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"/>
        <text class="tick" x="${m.l - 6}" y="${(Y(t) + 4).toFixed(1)}" text-anchor="end">${compact(t)}</text>`).join('')}
      ${Array.from({ length: n + 1 }, (_, r) => r).filter(r => r % xEvery === 0 || r === n).map(r =>
        `<text class="tick" x="${X(r).toFixed(1)}" y="${H - 8}" text-anchor="middle">${r}</text>`).join('')}
      ${order.map(i => `<path class="ln ${i === focus ? 'focus' : ''}" d="${path(series[i].values)}" style="--len:${len}"/>`).join('')}
      <circle class="end" cx="${X(n).toFixed(1)}" cy="${Y(fEnd).toFixed(1)}" r="4.5"/>
      <text class="end-l" x="${(X(n) + 9).toFixed(1)}" y="${(Y(fEnd) + 4).toFixed(1)}">${esc(f.name.length > 9 ? f.name.slice(0, 8) + '…' : f.name)}</text>
      <line class="cross" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/>
      <rect class="hit" x="${m.l - 10}" y="0" width="${W - m.l - m.r + 20}" height="${H}" data-chart-hit="${id}"/>
    </svg>
    <div class="tip" role="status" hidden></div></div>
  </figure>`;
}

/**
 * Colonnes des points par manche (une série). polarity : vert/rouge autour de 0 quand
 * plus de points est une bonne nouvelle ; neutre sinon (Skyjo, Différenzler).
 */
export function barChart({ id, values, polarity = true, animate = false, roundLabel = r => `Manche ${r}` }) {
  const H = 150, m = { l: 38, r: 8, t: 14, b: 24 };
  const n = values.length;
  const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values), 3);
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const Y = v => m.t + (H - m.t - m.b) * (1 - (v - y0) / (y1 - y0 || 1));
  const band = (W - m.l - m.r) / n, bw = Math.max(4, Math.min(24, band - 4));
  const best = values.indexOf(Math.max(...values)), worst = values.indexOf(Math.min(...values));
  const xEvery = Math.ceil(n / 8);
  charts[id] = { bars: values, band, ml: m.l, roundLabel };
  const bar = (v, r) => {
    const x = m.l + band * r + (band - bw) / 2, yz = Y(0), yv = Y(v), h = Math.abs(yz - yv);
    const rad = Math.min(4, h, bw / 2);
    // bout arrondi côté valeur, carré côté ligne de base
    const d = v >= 0
      ? `M${x},${yz}V${yv + rad}Q${x},${yv} ${x + rad},${yv}H${x + bw - rad}Q${x + bw},${yv} ${x + bw},${yv + rad}V${yz}Z`
      : `M${x},${yz}V${yv - rad}Q${x},${yv} ${x + rad},${yv}H${x + bw - rad}Q${x + bw},${yv} ${x + bw},${yv - rad}V${yz}Z`;
    const cls = polarity ? (v > 0 ? 'pos' : v < 0 ? 'neg' : '') : 'neutral';
    return `<path class="col ${cls}" d="${h < 0.5 ? `M${x},${yz}h${bw}` : d}" style="--i:${r}"/>`;
  };
  const lbl = r => `<text class="bar-l" x="${(m.l + band * r + band / 2).toFixed(1)}" y="${(values[r] >= 0 ? Y(values[r]) - 5 : Y(values[r]) + 13).toFixed(1)}" text-anchor="middle">${values[r] > 0 && polarity ? '+' : ''}${num(values[r])}</text>`;
  return `<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" class="chart-svg ${animate ? 'grow' : ''}" role="img" aria-label="Points manche par manche : ${values.map(num).join(', ')}">
    ${ticks.map(t => `<line class="grid ${t === 0 ? 'zero' : ''}" x1="${m.l}" x2="${W - m.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"/>
      <text class="tick" x="${m.l - 6}" y="${(Y(t) + 4).toFixed(1)}" text-anchor="end">${compact(t)}</text>`).join('')}
    <g class="bars" style="transform-origin: 0 ${Y(0).toFixed(1)}px">${values.map(bar).join('')}</g>
    ${n > 1 && best !== worst ? lbl(best) + lbl(worst) : n === 1 ? lbl(0) : ''}
    ${values.map((_, r) => r).filter(r => r % xEvery === 0 || r === n - 1).map(r => `<text class="tick" x="${(m.l + band * r + band / 2).toFixed(1)}" y="${H - 7}" text-anchor="middle">${r + 1}</text>`).join('')}
    <rect class="hit" x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" data-chart-hit="${id}"/>
  </svg><div class="tip" role="status" hidden></div></div>`;
}

/**
 * Places obtenues sur les dernières parties (1 en haut). points : [{ place, of, label }].
 */
export function placeChart({ id, points, animate = false }) {
  const H = 132, m = { l: 34, r: 12, t: 12, b: 14 };
  const maxPlace = Math.max(2, ...points.map(p => p.of));
  const n = points.length;
  const X = k => m.l + (W - m.l - m.r) * (n === 1 ? 0.5 : k / (n - 1));
  const Y = p => m.t + (H - m.t - m.b) * ((p - 1) / (maxPlace - 1));
  const ticks = [...new Set([1, Math.ceil(maxPlace / 2), maxPlace])];
  charts[id] = { places: points, X };
  return `<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" class="chart-svg ${animate ? 'draw' : ''}" role="img" aria-label="Places sur les ${n} dernières parties : ${points.map(p => p.place).join(', ')}">
    ${ticks.map(t => `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"/>
      <text class="tick" x="${m.l - 6}" y="${(Y(t) + 4).toFixed(1)}" text-anchor="end">${t === 1 ? '1er' : t + 'e'}</text>`).join('')}
    ${n > 1 ? `<path class="ln" d="${points.map((p, k) => `${k ? 'L' : 'M'}${X(k).toFixed(1)},${Y(p.place).toFixed(1)}`).join('')}" style="--len:${W * 2}"/>` : ''}
    ${points.map((p, k) => `<circle class="dot ${p.place === 1 ? 'win' : ''}" cx="${X(k).toFixed(1)}" cy="${Y(p.place).toFixed(1)}" r="${p.place === 1 ? 5.5 : 4.5}" style="--i:${k}"/>`).join('')}
    <rect class="hit" x="0" y="0" width="${W}" height="${H}" data-chart-hit="${id}"/>
  </svg><div class="tip" role="status" hidden></div></div>`;
}

/* ═══ Info-bulles : appui ou glissé du doigt sur un graphique ═══ */
function showTip(hit, clientX) {
  const id = hit.dataset.chartHit, c = charts[id];
  const box = hit.closest('.chart-box'), svg = hit.ownerSVGElement, tip = box && box.querySelector('.tip');
  if (!c || !tip) return;
  const rect = svg.getBoundingClientRect(), scale = rect.width / W;
  const x = (clientX - rect.left) / scale;
  let html, px;
  if (c.series) {
    const r = Math.max(0, Math.min(c.n, Math.round((x - c.X(0)) / ((c.X(c.n) - c.X(0)) / c.n))));
    const rows = c.series.map((s, i) => ({ s, i, v: s.values[r] })).sort((a, b) => b.v - a.v);
    html = `<b>${r === 0 ? 'Départ' : esc(c.roundLabel(r))}</b>${rows.map(o => `<span class="${o.i === c.focus ? 'f' : ''}"><i></i>${esc(o.s.name)}<em>${num(o.v)}</em></span>`).join('')}`;
    px = c.X(r);
    const cross = svg.querySelector('.cross');
    cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
  } else if (c.bars) {
    const r = Math.max(0, Math.min(c.bars.length - 1, Math.floor((x - c.ml) / c.band)));
    html = `<b>${esc(c.roundLabel(r + 1))}</b><span class="f">${num(c.bars[r])} pts</span>`;
    px = c.ml + c.band * r + c.band / 2;
  } else {
    let k = 0, best = Infinity;
    c.places.forEach((p, j) => { const d = Math.abs(c.X(j) - x); if (d < best) { best = d; k = j; } });
    const p = c.places[k];
    html = `<b>${esc(p.label)}</b><span class="f">${p.place === 1 ? 'Victoire' : `${p.place}e sur ${p.of}`}</span>`;
    px = c.X(k);
  }
  tip.innerHTML = html; tip.hidden = false;
  const left = Math.max(4, Math.min(box.clientWidth - tip.offsetWidth - 4, px * scale - tip.offsetWidth / 2));
  tip.style.left = `${left}px`;
}
function hideTips(root) {
  root.querySelectorAll('.chart-box .tip').forEach(t => { t.hidden = true; });
  root.querySelectorAll('.cross').forEach(c => c.setAttribute('visibility', 'hidden'));
}
export function installChartTips(root = document) {
  root.addEventListener('pointerdown', e => {
    const hit = e.target.closest && e.target.closest('[data-chart-hit]');
    if (!hit) { hideTips(root); return; }
    showTip(hit, e.clientX);
  });
  root.addEventListener('pointermove', e => {
    const hit = e.target.closest && e.target.closest('[data-chart-hit]');
    if (hit && (e.buttons || e.pointerType === 'mouse')) showTip(hit, e.clientX);
  });
  root.addEventListener('pointerleave', e => { if (e.target.classList && e.target.classList.contains('chart-box')) hideTips(root); }, true);
}
