import * as SK from './games/skull-king/scoring.js';
import { RULES_HTML } from './games/skull-king/rules-fr.js';

/* ═══════════════ DONNÉES DE JEU (règles officielles) ═══════════════ */
const MODES={
  classique:{n:'Classique',i:'🏴‍☠️',d:'10 manches : 1, 2, 3… jusqu’à 10 cartes.',c:[1,2,3,4,5,6,7,8,9,10]},
  impair:{n:'Pas d’impair',i:'2️⃣',d:'Deux manches de 2, 4, 6, 8 et enfin 10 cartes.',c:[2,2,4,4,6,6,8,8,10,10]},
  combat:{n:'Prêt au combat',i:'⚔️',d:'Partie en 5 manches : 6, 7, 8, 9 et enfin 10 cartes.',c:[6,7,8,9,10]},
  eclair:{n:'Attaque éclair',i:'⚡',d:'Cinq manches avec 5 cartes.',c:[5,5,5,5,5]},
  barrage:{n:'Tir de barrage',i:'💥',d:'Dix manches avec 10 cartes.',c:[10,10,10,10,10,10,10,10,10,10]},
  tourbillon:{n:'Tourbillon',i:'🌀',d:'Deux manches de 9, 7, 5, 3 et enfin 1 carte.',c:[9,9,7,7,5,5,3,3,1,1]},
  dodo:{n:'L’heure du dodo',i:'🌙',d:'Une manche avec 1 carte, puis un bisou et bonne nuit !',c:[1]}
};
const AV=[
 {i:'💀',c:'#c8860a'},{i:'🦜',c:'#1a6b3c'},{i:'⚓',c:'#185fa5'},{i:'💎',c:'#8b2a8b'},
 {i:'🗡️',c:'#9b2020'},{i:'🐚',c:'#0f6e7a'},{i:'🏴',c:'#5a4a8a'},{i:'⚡',c:'#b86a0a'}
];
const MEDAL=['🥇','🥈','🥉'];

/* ═══════════════ ÉTAT ═══════════════ */
let state=null, bonusOpen={}, draft=null;
const K='skullking.v3';

function blank(){
  return {players:[],mode:'classique',scoring:'sk',cannonball:false,wager:false,loot:false,
          kraken:false,whale:false,rounds:[],cur:0,dealer:0,done:false,started:Date.now()};
}

function save(){try{localStorage.setItem(K,JSON.stringify(state))}catch(e){}}
function load(){
  try{
    const r=localStorage.getItem(K); if(!r)return null;
    const s=Object.assign(blank(),JSON.parse(r));
    // parties enregistrées avant l'ajout du Kraken / de la Baleine blanche
    s.rounds.forEach(R=>{if(R.destroyed===undefined)R.destroyed=0});
    return s;
  }catch(e){return null}
}
function wipe(){try{localStorage.removeItem(K)}catch(e){}}

/* ═══════════════ CALCUL DES POINTS (délégué au module de jeu) ═══════════════ */
const bonusOf=e=>SK.bonusOf(e,state);
const scoreOf=(e,cards)=>SK.scoreEntry(e,cards,state);
function playedCount(){return state.done ? state.rounds.length : state.cur}
// Totaux sur les manches validées uniquement (bug 3 : les manches à venir étaient comptées)
function totals(upto){
  return SK.totals(state.rounds,state,state.players.length,upto===undefined?playedCount():upto);
}
const cardsFor=c=>SK.cardsFor(c,state,state.players.length);
const sign=v=>(v>=0?'+':'')+v;

/* ═══════════════ UTILITAIRES UI ═══════════════ */
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms||8)}catch(e){}}
function av(i,cls,isD){
  const a=AV[i%8];
  return `<div class="pav ${cls||''}" style="background:${a.c}1f;border-color:${a.c}55">${a.i}${isD?'<span class="dealer-dot">D</span>':''}</div>`;
}
function ripple(el,ev){
  if(!el)return;
  const r=document.createElement('div'); r.className='ripple';
  const b=el.getBoundingClientRect();
  const x=(ev&&ev.clientX)||b.left+b.width/2, y=(ev&&ev.clientY)||b.top+b.height/2;
  r.style.left=(x-b.left)+'px'; r.style.top=(y-b.top)+'px';
  el.appendChild(r); setTimeout(()=>r.remove(),650);
}
function toast(msg,ms){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),ms||2200);
}
function shake(el){if(!el)return;el.style.animation='none';void el.offsetWidth;el.style.animation='shake .4s ease'}
function tick(el){if(!el)return;el.classList.remove('tick');void el.offsetWidth;el.classList.add('tick')}
function goto(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  window.scrollTo({top:0,behavior:'instant'});
}
function activeScreen(){const s=document.querySelector('.screen.on');return s?s.id:null}
function openSheet(id){
  document.getElementById('scrim').classList.add('on');
  document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('on'));
  const sh=document.getElementById(id); sh.classList.add('on'); sh.scrollTop=0;
  document.body.style.overflow='hidden';
}
function closeSheet(){
  document.getElementById('scrim').classList.remove('on');
  document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('on'));
  document.body.style.overflow='';
}
function scrimTap(){if(draft)cancelEdit();else closeSheet()}
function stepper(val,minus,plus,id,big){
  return `<div class="step${big?'':' step-sm'}">
    <button class="step-b" onclick="${minus}" aria-label="Moins">−</button>
    <div class="step-v" ${id?`id="${id}"`:''}>${val}</div>
    <button class="step-b" onclick="${plus}" aria-label="Plus">＋</button></div>`;
}

/* ═══════════════ SETUP ═══════════════ */
function renderPlayers(){
  const d=document.getElementById('plist'); d.innerHTML='';
  state.players.forEach((p,i)=>{
    const row=document.createElement('div'); row.className='prow';
    row.innerHTML=`${av(i)}<input type="text" maxlength="16" placeholder="Matelot ${i+1}" value="${esc(p)}" oninput="state.players[${i}]=this.value.replace(/[<>]/g,'')">`
      +(state.players.length>2?`<button class="rm" onclick="delPlayer(${i})" aria-label="Retirer">✕</button>`:'');
    d.appendChild(row);
  });
  document.getElementById('pcount').textContent=state.players.length+'/8';
}
function addPlayer(){
  if(state.players.length>=8){toast('Maximum 8 joueurs');return}
  state.players.push(''); renderPlayers(); buzz();
  const inp=document.querySelectorAll('#plist input'); inp[inp.length-1].focus();
  renderModes();
}
function delPlayer(i){
  if(state.players.length<=2){toast('Minimum 2 joueurs');return}
  state.players.splice(i,1); renderPlayers(); renderModes(); buzz();
}
function renderModes(){
  const d=document.getElementById('modes'); d.innerHTML='';
  Object.keys(MODES).forEach(k=>{
    const m=MODES[k], on=state.mode===k;
    const cards=m.c.map(cardsFor);
    const capped=m.c.some((c,i)=>cards[i]<c);
    d.innerHTML+=`<div class="opt ${on?'on':''}" onclick="setMode('${k}')">
      <span class="opt-icon">${m.i}</span>
      <div class="opt-body"><div class="opt-t">${m.n}</div>
      <div class="opt-d">${m.c.length} manche${m.c.length>1?'s':''} · ${cards.join(' · ')} carte${cards[0]>1?'s':''}${capped?' <b style="color:var(--gold)">(ajusté au nb de joueurs)</b>':''}</div></div>
      <div class="opt-chk">✓</div></div>`;
  });
  document.getElementById('mode-desc').textContent=MODES[state.mode].d;
}
function setMode(k){state.mode=k;renderModes();buzz()}
function setScoring(s){
  state.scoring=s;
  document.getElementById('sg-sk').classList.toggle('on',s==='sk');
  document.getElementById('sg-rascal').classList.toggle('on',s==='rascal');
  document.getElementById('rascal-opts').style.display=s==='rascal'?'block':'none';
  document.getElementById('scoring-desc').innerHTML = s==='sk'
    ? 'Système classique, taillé pour les audacieux. Vous ne gagnez des points que si votre mise est exacte — sinon vous en perdez.'
    : 'Système équilibré : chaque manche vaut 10 points par carte distribuée pour tout le monde. Mise exacte = tous les points, écart de 1 = la moitié, écart de 2 ou plus = rien.';
  buzz();
}
function toggleOpt(key,btn){state[key]=!state[key];btn.classList.toggle('on',state[key]);renderModes();buzz()}
function toggleDark(btn){
  const on=!document.body.classList.contains('dark');
  document.body.classList.toggle('dark',on);
  btn.classList.toggle('on',on);
  try{localStorage.setItem('sk.dark',on?'1':'0')}catch(e){}
  document.querySelector('meta[name=theme-color]').setAttribute('content',on?'#0d1824':'#0a1520');
  buzz();
}
function renderResume(){
  const saved=load(); const box=document.getElementById('resume-box');
  if(!saved||!saved.rounds||!saved.rounds.length||saved.done){box.innerHTML='';return}
  const t=saved.rounds.length, m=MODES[saved.mode];
  box.innerHTML=`<div class="card" style="border-color:var(--gold);box-shadow:0 0 0 3px var(--glow)">
    <div class="clabel">⏳ Partie en cours</div>
    <div style="font-size:15px;font-weight:700;margin-bottom:3px">${saved.players.map(esc).join(' · ')}</div>
    <div style="font-size:13px;color:var(--muted);font-weight:600;margin-bottom:12px">${m.i} ${m.n} — manche ${Math.min(saved.cur+1,t)} sur ${t}</div>
    <div class="btn-row">
      <button class="btn btn-gold btn-sm" onclick="resumeGame()">Reprendre</button>
      <button class="btn btn-line btn-sm" onclick="wipe();renderResume();toast('Partie effacée')">Abandonner</button>
    </div></div>`;
}
function resumeGame(){
  state=load(); bonusOpen={};
  if(state.done) showEnd(true); else if(state.rounds[state.cur]) renderBid(); else renderScores();
  toast('Partie reprise ⚓');
}
function buildRounds(){
  state.rounds=MODES[state.mode].c.map(c=>SK.makeRound(cardsFor(c),state.players.length));
}
function startGame(ev){
  ripple(ev.currentTarget,ev); buzz(14);
  state.players=state.players.map((p,i)=>(p||'').trim().slice(0,16)||`Matelot ${i+1}`);
  if(state.players.length===2) state.loot=false; // pas de Butin à 2 joueurs (règle officielle)
  buildRounds();
  state.cur=0; state.dealer=0; state.done=false; state.started=Date.now();
  bonusOpen={}; save();
  setTimeout(renderBid,130);
}

/* ═══════════════ BARRES DE MANCHE ═══════════════ */
function roundBar(id,idx){
  const R=state.rounds[idx], n=state.rounds.length, m=MODES[state.mode];
  document.getElementById(id).innerHTML=
   `<div class="rb-l">
      <div class="rb-lbl">Manche</div>
      <div class="rb-cards">${R.cards} carte${R.cards>1?'s':''} par joueur</div>
      <span class="rb-chip">${m.i} ${m.n}${state.scoring==='rascal'?' · 🎩 Rascal':''}</span>
    </div>
    <div class="rb-r"><div class="rb-num">${idx+1}<small> / ${n}</small></div></div>`;
}
function progress(id,done){
  document.getElementById(id).style.width=(done/state.rounds.length*100)+'%';
}
function renderDots(id,idx){
  const d=document.getElementById(id); if(!d)return;
  d.innerHTML=state.rounds.map((r,i)=>
    `<div class="dot ${i<state.cur?'done':i===idx?'cur':''}" ${i<state.cur?`onclick="editRound(${i})"`:''} title="Manche ${i+1}"></div>`).join('');
}
function curRound(){return state.rounds[state.cur]}

/* ═══════════════ ÉCRAN MISES ═══════════════ */
function renderBid(){
  const idx=state.cur, R=state.rounds[idx];
  roundBar('bid-bar',idx); progress('bid-prog',idx+1); renderDots('bid-dots',idx);
  document.getElementById('bid-tbsub').textContent = `Manche ${idx+1} sur ${state.rounds.length}`;
  document.getElementById('bid-note').innerHTML = state.players.length===2
    ? "👻 <b>Partie à deux :</b> distribuez trois paquets — le troisième est celui de Barbe Grise. Il ne mise pas et ne marque pas de points, mais il peut remporter des plis."
    : "Poing fermé = mise de <b>0</b>. Frappez trois fois la table et criez « <b>Yo-ho-ho !</b> » — au troisième coup, tout le monde révèle sa mise en même temps.";

  const t=totals(idx);
  const d=document.getElementById('bid-list'); d.innerHTML='';
  state.players.forEach((p,i)=>{
    const e=R.e[i], isD=(state.dealer+idx)%state.players.length===i;
    const quick=Array.from({length:Math.min(R.cards,6)+1},(_,k)=>k);
    const el=document.createElement('div'); el.className='pblock';
    el.innerHTML=`<div class="plr">
      ${av(i,'',isD)}
      <div class="plr-b"><div class="plr-n">${esc(p)}</div>
        <div class="plr-s">${isD?'🎴 Donneur · ':''}Total <b>${t[i]}</b></div></div>
      ${stepper(e.bid,`stepBid(${i},-1,this)`,`stepBid(${i},1,this)`,'bv'+i,true)}</div>
      <div class="qbid" id="qb${i}">${quick.map(k=>`<button class="qb ${e.bid===k?'on':''}" onclick="setBid(${i},${k})">${k}</button>`).join('')}${R.cards>6?`<button class="qb ${e.bid>6?'on':''}" onclick="toast('Utilise les boutons + et −')">7+</button>`:''}</div>
      ${state.wager?wagerRow(i,e,'setWager'):''}
      ${(state.scoring==='rascal'&&state.cannonball)?shotRow(i,e,'setShot'):''}`;
    d.appendChild(el);
  });
  updateBidSum();
  goto('sc-bid');
}
function wagerRow(i,e,fn){
  return `<div class="mini-seg" ${fn==='setWager'?`id="wg${i}"`:''}>
    ${[0,10,20].map(v=>`<div class="ms ${e.wager===v?'on':''}" onclick="${fn}(${i},${v})">${v?'🎲 Parier '+v:'Pas de pari'}</div>`).join('')}</div>`;
}
function shotRow(i,e,fn){
  return `<div class="mini-seg" ${fn==='setShot'?`id="sh${i}"`:''}>
    <div class="ms ${e.shot==='chev'?'on':''}" onclick="${fn}(${i},'chev')">🖐️ Chevrotine ×10</div>
    <div class="ms ${e.shot==='boul'?'on':''}" onclick="${fn}(${i},'boul')">✊ Boulet ×15</div></div>`;
}
function stepBid(i,d,btn){setBid(i,curRound().e[i].bid+d);if(btn)ripple(btn)}
function setBid(i,val){
  const R=curRound(), e=R.e[i];
  e.bid=Math.max(0,Math.min(R.cards,val));
  const v=document.getElementById('bv'+i); v.textContent=e.bid; tick(v);
  refreshQuick(i); updateBidSum(); buzz();
}
function refreshQuick(i){
  const e=curRound().e[i], q=document.getElementById('qb'+i); if(!q)return;
  [...q.children].forEach(b=>{
    const n=parseInt(b.textContent);
    b.classList.toggle('on', !isNaN(n) ? n===e.bid : e.bid>6);
  });
}
function setWager(i,v){curRound().e[i].wager=v;const w=document.getElementById('wg'+i);[...w.children].forEach((c,k)=>c.classList.toggle('on',[0,10,20][k]===v));buzz()}
function setShot(i,s){curRound().e[i].shot=s;const w=document.getElementById('sh'+i);[...w.children].forEach((c,k)=>c.classList.toggle('on',['chev','boul'][k]===s));buzz()}
function updateBidSum(){
  const R=curRound(), sum=R.e.reduce((a,e)=>a+e.bid,0);
  const diff=sum-R.cards;
  document.getElementById('bid-sum').textContent = `Total misé : ${sum} / ${R.cards}` +
    (diff===0?' — pile poil':diff>0?` — surmisé de ${diff}`:` — sous-misé de ${-diff}`);
  document.getElementById('bid-dealer').textContent='🎴 '+state.players[(state.dealer+state.cur)%state.players.length];
}
function bidBack(){
  if(state.cur>0){renderScores();return}
  if(confirm('Retourner à la configuration ? La partie en cours sera perdue.')){wipe();resetSetup()}
}
function confirmBids(ev){ripple(ev.currentTarget,ev);buzz(14);save();setTimeout(renderTricks,110)}

/* ═══════════════ ÉCRAN PLIS ═══════════════ */
function renderTricks(){
  const idx=state.cur, R=state.rounds[idx];
  roundBar('tr-bar',idx); progress('tr-prog',idx+1);
  document.getElementById('tr-tbsub').textContent = `Manche ${idx+1} sur ${state.rounds.length}`;
  document.getElementById('tr-destroyed').innerHTML = destroyedCard(R,'stepDestroyed');

  const d=document.getElementById('tr-list'); d.innerHTML='';
  state.players.forEach((p,i)=>{
    const e=R.e[i], nb=SK.bonusCount(e,state);
    const open = bonusOpen[i] || nb>0;
    const el=document.createElement('div'); el.className='pblock';
    el.innerHTML=`<div class="plr">
      ${av(i)}
      <div class="plr-b"><div class="plr-n">${esc(p)}</div>
        <div class="plr-s">Misé <b>${e.bid}</b>${state.wager&&e.wager?` · 🎲 ${e.wager}`:''}${state.scoring==='rascal'&&state.cannonball?` · ${e.shot==='boul'?'✊':'🖐️'}`:''} · <span class="pv" id="pv${i}"></span></div></div>
      ${stepper(e.tricks,`stepTrick(${i},-1,this)`,`stepTrick(${i},1,this)`,'tv'+i,true)}</div>
      <div class="bsec">
        <div class="bhead" onclick="toggleBonus(${i})">
          🏆 Bonus capturés
          <span class="bcount ${nb?'':'zero'}" id="bc${i}">${nb?('+'+bonusOf(e)):'0'}</span>
          <span id="ba${i}">${open?'▲':'▼'}</span>
        </div>
        <div class="bgrid ${open?'':'hide'}" id="bg${i}">
          ${SK.activeBonuses(state).map(b=>bchip(i,b,e[b.key],'stepBonus')).join('')}
        </div>
      </div>`;
    d.appendChild(el);
  });
  updateTrickSum();
  goto('sc-tricks');
}
function destroyedCard(R,fn){
  const mx=SK.maxDestroyed(state); if(!mx)return '';
  const names=[state.kraken?'🐙 Kraken':'',state.whale?'🐋 Baleine blanche':''].filter(Boolean).join(' / ');
  return `<div class="card flush destroyed">
    <div class="plr" style="padding:0;border:none">
      <div class="pav" style="background:var(--card2);border-color:var(--border)">🌊</div>
      <div class="plr-b"><div class="plr-n">Plis détruits</div><div class="plr-s">${names} — remportés par personne</div></div>
      ${stepper(R.destroyed||0,`${fn}(-1)`,`${fn}(1)`,fn==='stepDestroyed'?'dv':null,true)}</div></div>`;
}
function bchip(i,b,v,fn){
  const live=fn==='stepBonus'; // les identifiants ne servent qu'à l'écran des plis
  return `<div class="bchip ${v>0?'on':''}" ${live?`id="bx${b.key}${i}"`:''}>
    <span class="bi">${b.icon}</span>
    <div class="bd"><div class="bt">${b.label}</div><div class="bp">${b.unit}</div></div>
    <div class="bstep">
      <button class="bb" onclick="${fn}(${i},'${b.key}',-1)" aria-label="Moins">−</button>
      <span class="bv" ${live?`id="b${b.key}${i}"`:''}>${v}</span>
      <button class="bb" onclick="${fn}(${i},'${b.key}',1)" aria-label="Plus">＋</button>
    </div></div>`;
}
function toggleBonus(i){
  const g=document.getElementById('bg'+i), a=document.getElementById('ba'+i);
  const hidden=g.classList.toggle('hide');
  a.textContent=hidden?'▼':'▲'; bonusOpen[i]=!hidden; buzz();
}
function stepTrick(i,d,btn){
  const R=curRound(), e=R.e[i];
  e.tricks=Math.max(0,Math.min(R.cards,e.tricks+d));
  const v=document.getElementById('tv'+i); v.textContent=e.tricks; tick(v);
  updateTrickSum(); buzz(); if(btn)ripple(btn);
}
function stepDestroyed(d){
  const R=curRound();
  R.destroyed=Math.max(0,Math.min(Math.min(SK.maxDestroyed(state),R.cards),(R.destroyed||0)+d));
  const v=document.getElementById('dv'); v.textContent=R.destroyed; tick(v);
  updateTrickSum(); buzz();
}
function bumpBonus(e,k,d){
  const b=SK.BONUSES.find(x=>x.key===k);
  e[k]=Math.max(0,Math.min(b.max,(e[k]||0)+d));
}
function stepBonus(i,k,d){
  const e=curRound().e[i];
  bumpBonus(e,k,d);
  document.getElementById('b'+k+i).textContent=e[k];
  document.getElementById('bx'+k+i).classList.toggle('on',e[k]>0);
  const nb=SK.bonusCount(e,state), c=document.getElementById('bc'+i);
  c.textContent=nb?('+'+bonusOf(e)):'0'; c.classList.toggle('zero',!nb);
  updateTrickSum(); buzz();
}
function trickStatus(R){
  const c=SK.checkTricks(R,state,state.players.length);
  const pl=n=>`${n} pli${n>1?'s':''}`;
  if(!c.ok) return {ok:false,html:`⚠️ ${c.msg}`};
  let h=`✅ ${pl(c.sum)} remporté${c.sum>1?'s':''}`;
  if(c.destroyed) h+=` + ${c.destroyed} détruit${c.destroyed>1?'s':''}`;
  if(c.ghost&&c.rest>0) h+=` · 👻 ${pl(c.rest)} pour Barbe Grise`;
  return {ok:true,html:h+` — ${c.cards} au total`};
}
function updateTrickSum(){
  const R=curRound(), st=trickStatus(R), el=document.getElementById('tr-sum');
  el.innerHTML=st.html; el.classList.toggle('ok',st.ok); el.classList.toggle('ko',!st.ok);
  // aperçu des points de la manche pour chaque joueur
  state.players.forEach((p,i)=>{
    const s=scoreOf(R.e[i],R.cards), pv=document.getElementById('pv'+i);
    if(pv){pv.textContent=`${sign(s.pts)} pts`;pv.className='pv '+(s.pts>=0?'p':'n')}
  });
}
function confirmTricks(ev){
  const R=curRound();
  if(!SK.checkTricks(R,state,state.players.length).ok){
    toast(SK.checkTricks(R,state,state.players.length).msg);
    shake(document.getElementById('tr-sum')); buzz([30,40,30]); return;
  }
  ripple(ev.currentTarget,ev); buzz(16);
  state.cur++; save();
  setTimeout(()=>renderScores(true),110);
}

/* ═══════════════ ÉCRAN SCORES ═══════════════ */
function ranking(){
  const t=totals(), last=playedCount()-1;
  const prev = last>0 ? totals(last) : state.players.map(()=>0);
  return state.players.map((p,i)=>({p,i,sc:t[i],dl:t[i]-prev[i]})).sort((a,b)=>b.sc-a.sc);
}
function renderScores(animate){
  const last = playedCount()-1;
  const R = last>=0 ? state.rounds[last] : null;
  const n=state.rounds.length;

  document.getElementById('sc-title').textContent = 'Classement';
  document.getElementById('sc-tbsub').textContent = `${last+1} manche${last>0?'s':''} sur ${n} · ${MODES[state.mode].i} ${MODES[state.mode].n} · ${state.scoring==='rascal'?'Rascal':'Skull King'}`;
  progress('sc-prog',last+1);

  // Le total n'est affiché qu'ici (bug 3) ; la feuille de score ne montre que les points par manche.
  const rows=ranking();
  let h=`<div class="card rank"><div class="sh">
      <div style="width:30px">#</div><div style="flex:1;padding-left:8px">Joueur</div>
      <div class="s-dl">${R?`M${last+1}`:''}</div><div class="s-tt">Total</div></div>`;
  rows.forEach((r,k)=>{
    const s2 = R?scoreOf(R.e[r.i],R.cards):null;
    const cls = animate&&s2 ? (s2.exact?'hit':'miss') : '';
    const rk = k>0 && r.sc===rows[k-1].sc ? '=' : (r.sc===rows[0].sc?'👑':k+1);
    h+=`<div class="sr ${r.sc===rows[0].sc?'lead':''} ${cls}">
      <div class="s-rk">${rk}</div>
      <div class="s-nm">${av(r.i,'sm')}<span>${esc(r.p)}</span></div>
      <div class="s-dl ${r.dl>=0?'p':'n'}">${R?sign(r.dl):''}</div>
      <div class="s-tt">${r.sc}</div></div>`;
  });
  document.getElementById('sc-rank').innerHTML=h+'</div>';

  h='';
  if(R){
    h+=`<div class="card"><div class="clabel">📜 Détail de la manche ${last+1}${R.destroyed?` · 🌊 ${R.destroyed} pli${R.destroyed>1?'s':''} détruit${R.destroyed>1?'s':''}`:''}<span class="cl-act" onclick="editRound(${last})">✏️ Modifier</span></div>`;
    state.players.forEach((p,i)=>{h+=recap(R,i)});
    h+='</div>';
  }
  h+=`<div class="card"><div class="clabel">📋 Feuille de score<span class="cl-act" onclick="openHistory()">Modifier une manche ›</span></div><div class="tw">${scoreTable(false)}</div></div>`;
  document.getElementById('sc-body').innerHTML=h;

  const nb=document.getElementById('next-btn');
  if(state.cur>=n){nb.innerHTML='👑 Voir le classement final →';nb.onclick=(e)=>{ripple(nb,e);setTimeout(()=>showEnd(),120)}}
  else{nb.innerHTML=`Manche ${state.cur+1} — ${state.rounds[state.cur].cards} carte${state.rounds[state.cur].cards>1?'s':''} →`;nb.onclick=(e)=>{ripple(nb,e);buzz(12);setTimeout(renderBid,120)}}

  goto('sc-scores');
  if(animate&&R) rows.forEach((r,k)=>setTimeout(()=>flyPts(r.dl,k),180+k*90));
  save();
}
function recap(R,i){
  const e=R.e[i], s=scoreOf(e,R.cards);
  return `<div class="rec"><div class="rec-h">${av(i,'xs')}
    <span class="rec-n">${esc(state.players[i])}</span>
    <span class="rec-p ${s.pts>=0?'p':'n'}">${sign(s.pts)}</span></div>
    <div class="pills">
      <span class="pill ${s.exact?'ok':'ko'}">Misé ${e.bid} · Fait ${e.tricks}${s.exact?' ✓':(s.gap===1&&state.scoring==='rascal'?' ~':' ✕')}</span>
      ${s.bonus>0?`<span class="pill bon">Bonus +${s.bonus}</span>`:(s.rawBonus>0?`<span class="pill">Bonus perdu −${s.rawBonus}</span>`:'')}
      ${SK.activeBonuses(state).filter(b=>e[b.key]).map(b=>`<span class="pill">${b.icon}${b.max>1?'×'+e[b.key]:''}</span>`).join('')}
      ${state.wager&&e.wager?`<span class="pill ${s.wager>=0?'ok':'ko'}">🎲 ${sign(s.wager)}</span>`:''}
      ${state.scoring==='rascal'&&state.cannonball?`<span class="pill">${e.shot==='boul'?'✊ Boulet':'🖐️ Chevrotine'}</span>`:''}
    </div></div>`;
}
function flyPts(pts,idx){
  const el=document.createElement('div');
  el.className='fly '+(pts>=0?'p':'n');
  el.textContent=sign(pts);
  el.style.top=(170+idx*60)+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1150);
}
// Feuille de score : une colonne par manche jouée (en-tête cliquable = modifier la manche).
// showTotal : uniquement là où aucun classement n'affiche déjà le total.
function scoreTable(showTotal){
  const np=playedCount();
  let h='<table class="tbl"><thead><tr><th class="nm">Joueur</th>';
  for(let r=0;r<np;r++)h+=`<th class="th-ed" onclick="editRound(${r})">M${r+1}<br><span style="opacity:.6;font-weight:600">${state.rounds[r].cards}c ✏️</span></th>`;
  if(showTotal)h+='<th class="tot">Total</th>';
  h+='</tr></thead><tbody>';
  const t=totals();
  state.players.forEach((p,i)=>{
    h+=`<tr><td class="nm"><div style="display:flex;align-items:center;gap:6px">${av(i,'xs')}<span class="tbl-n">${esc(p)}</span></div></td>`;
    for(let r=0;r<np;r++){
      const s=scoreOf(state.rounds[r].e[i],state.rounds[r].cards);
      h+=`<td class="${s.pts>=0?'pos':'neg'}">${sign(s.pts)}</td>`;
    }
    if(showTotal)h+=`<td class="tot">${t[i]}</td>`;
    h+='</tr>';
  });
  return h+'</tbody></table>';
}

/* ═══════════════ MODIFICATION D'UNE MANCHE VALIDÉE (bug 2) ═══════════════
   Tout se modifie sur une copie (mises, plis, bonus, paris, plis détruits) ;
   « Enregistrer » remplace la manche et tous les totaux sont recalculés. */
function editRound(i){
  if(!state||i<0||i>=state.rounds.length){toast('Aucune manche à modifier');return}
  if(i>=playedCount()){toast('Cette manche n’a pas encore été jouée');return}
  draft={idx:i,R:JSON.parse(JSON.stringify(state.rounds[i]))};
  buzz(12); renderEditor(); openSheet('sheet-edit');
}
function renderEditor(){
  const {idx,R}=draft;
  document.getElementById('ed-title').textContent=`✏️ Manche ${idx+1}`;
  document.getElementById('ed-sub').textContent=`${R.cards} carte${R.cards>1?'s':''} par joueur · les totaux seront recalculés`;
  const before=totals();
  const after=SK.totals(state.rounds.map((x,k)=>k===idx?R:x),state,state.players.length,playedCount());
  let h=destroyedCard(R,'edDestroyed');
  state.players.forEach((p,i)=>{
    const e=R.e[i], s=scoreOf(e,R.cards), diff=after[i]-before[i];
    h+=`<div class="card ed-p">
      <div class="plr" style="padding-top:0">
        ${av(i)}
        <div class="plr-b"><div class="plr-n">${esc(p)}</div>
          <div class="plr-s">Total <b>${after[i]}</b>${diff?` <span class="${diff>0?'pos':'neg'}">(${sign(diff)})</span>`:''}</div></div>
        <div class="rec-p ${s.pts>=0?'p':'n'}" style="font-size:20px">${sign(s.pts)}</div>
      </div>
      <div class="ed-row"><span class="ed-l">Mise</span>${stepper(e.bid,`edStep(${i},'bid',-1)`,`edStep(${i},'bid',1)`)}</div>
      <div class="ed-row"><span class="ed-l">Plis remportés</span>${stepper(e.tricks,`edStep(${i},'tricks',-1)`,`edStep(${i},'tricks',1)`)}</div>
      ${state.wager?wagerRow(i,e,'edSet'):''}
      ${(state.scoring==='rascal'&&state.cannonball)?shotRow(i,e,'edShot'):''}
      <div class="bgrid" style="margin-top:10px">${SK.activeBonuses(state).map(b=>bchip(i,b,e[b.key],'edBonus')).join('')}</div>
    </div>`;
  });
  document.getElementById('ed-body').innerHTML=h;
  const st=trickStatus(R), el=document.getElementById('ed-status');
  el.innerHTML=st.html; el.className='ed-status tally '+(st.ok?'ok':'ko');
}
function edStep(i,k,d){
  const e=draft.R.e[i]; e[k]=Math.max(0,Math.min(draft.R.cards,e[k]+d)); buzz(); renderEditor();
}
function edBonus(i,k,d){bumpBonus(draft.R.e[i],k,d);buzz();renderEditor()}
function edSet(i,v){draft.R.e[i].wager=v;buzz();renderEditor()}
function edShot(i,v){draft.R.e[i].shot=v;buzz();renderEditor()}
function edDestroyed(d){
  const R=draft.R;
  R.destroyed=Math.max(0,Math.min(Math.min(SK.maxDestroyed(state),R.cards),(R.destroyed||0)+d));
  buzz(); renderEditor();
}
function cancelEdit(){draft=null;closeSheet()}
function commitEdit(ev){
  const c=SK.checkTricks(draft.R,state,state.players.length);
  if(!c.ok){toast(c.msg);shake(document.getElementById('ed-status'));buzz([30,40,30]);return}
  ripple(ev&&ev.currentTarget,ev);
  const idx=draft.idx;
  state.rounds[idx]=draft.R; draft=null; save(); closeSheet(); buzz(16);
  toast(`Manche ${idx+1} modifiée · totaux recalculés ✓`);
  refreshScreen();
}
function refreshScreen(){
  const s=activeScreen();
  if(s==='sc-bid')renderBid();
  else if(s==='sc-tricks')renderTricks();
  else if(s==='sc-end')showEnd(true);
  else renderScores();
}

/* ═══════════════ HISTORIQUE ═══════════════ */
function openHistory(){
  const n=playedCount();
  let h='';
  if(!n){h=`<div class="empty"><div class="empty-i">🗒️</div><div class="empty-t">Aucune manche jouée pour l'instant</div></div>`}
  else{
    h+=`<div class="card"><div class="clabel">📋 Feuille de score complète</div><div class="tw">${scoreTable(true)}</div></div>`;
    h+=`<div class="card"><div class="clabel">✏️ Modifier une manche</div>`;
    for(let r=n-1;r>=0;r--){
      const R=state.rounds[r];
      const sum=state.players.map((p,i)=>`${p.split(' ')[0]} ${sign(scoreOf(R.e[i],R.cards).pts)}`).join(' · ');
      h+=`<div class="hrow" onclick="editRound(${r})">
        <div class="hr-badge"><b>${r+1}</b><i>${R.cards} c.</i></div>
        <div class="hr-b"><div class="hr-t">Manche ${r+1}${R.destroyed?' · 🌊'+R.destroyed:''}</div><div class="hr-s">${esc(sum)}</div></div>
        <div class="hr-go">›</div></div>`;
    }
    h+='</div>';
  }
  document.getElementById('hist-body').innerHTML=h;
  openSheet('sheet-hist');
}

/* ═══════════════ MENU ═══════════════ */
function openMenu(){
  const adv=[state.wager?'🎲 Flambeur':'',state.loot?'💰 Butin':'',state.kraken?'🐙 Kraken':'',state.whale?'🐋 Baleine':''].filter(Boolean).join(' · ');
  const h=`<div class="card">
    <div class="clabel">Partie en cours</div>
    <div class="tgl-row"><div class="tgl-body"><div class="tgl-t">Type</div>
      <div class="tgl-d">${MODES[state.mode].i} ${MODES[state.mode].n} — ${MODES[state.mode].d}</div></div></div>
    <div class="tgl-row"><div class="tgl-body"><div class="tgl-t">Décompte</div>
      <div class="tgl-d">${state.scoring==='rascal'?'🎩 Les scores selon Rascal':'💀 Les scores selon Skull King'}${state.cannonball?' · Boulet de canon activé':''}</div></div></div>
    ${adv?`<div class="tgl-row"><div class="tgl-body"><div class="tgl-t">Cartes avancées</div><div class="tgl-d">${adv}</div></div></div>`:''}
    <div class="tgl-row"><div class="tgl-body"><div class="tgl-t">Joueurs</div>
      <div class="tgl-d">${state.players.map(esc).join(' · ')}</div></div></div>
    <div class="tgl-row">
      <div class="tgl-body"><div class="tgl-t">🌙 Thème sombre</div><div class="tgl-d">Confort de lecture en soirée</div></div>
      <button class="tgl ${document.body.classList.contains('dark')?'on':''}" onclick="toggleDark(this)"></button>
    </div>
  </div>
  <button class="btn btn-line" onclick="closeSheet();openRules()">📖 Règles officielles</button>
  <button class="btn btn-line" style="margin-top:9px" onclick="closeSheet();openHistory()">📊 Historique et modifications</button>
  <button class="btn btn-line" style="margin-top:9px" onclick="shareResults()">📤 Partager les scores</button>
  <button class="btn btn-line" style="margin-top:9px;color:var(--ko);border-color:var(--ko)" onclick="abandon()">🗑️ Abandonner la partie</button>`;
  document.getElementById('menu-body').innerHTML=h;
  openSheet('sheet-menu');
}
function abandon(){
  if(confirm('Abandonner la partie en cours ? Les scores seront perdus.')){
    wipe(); closeSheet(); resetSetup(); toast('Partie abandonnée');
  }
}

/* ═══════════════ FIN DE PARTIE ═══════════════ */
function showEnd(quiet){
  state.done=true; save();
  const t=totals();
  const rows=state.players.map((p,i)=>({p,i,sc:t[i]})).sort((a,b)=>b.sc-a.sc);
  const w=rows[0], tie=rows.filter(r=>r.sc===w.sc);
  const max=Math.max(...rows.map(r=>Math.abs(r.sc)),1);

  document.getElementById('win-box').innerHTML=`
    <div class="conf" id="conf"></div>
    <span class="win-skull">💀</span>
    <span class="win-crown">👑</span>
    <div class="win-nm">${tie.length>1?tie.map(x=>esc(x.p)).join(' & '):esc(w.p)}</div>
    <div class="win-pt">${w.sc} points</div>
    <div class="win-sb">${tie.length>1?'Égalité — rejouez une manche !':'Capitaine des Sept Mers'}</div>`;

  document.getElementById('final-list').innerHTML=rows.map((r,k)=>
    `<div class="fr"><div class="f-md">${MEDAL[k]||k+1}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:9px">${av(r.i,'sm')}<span class="f-nm">${esc(r.p)}</span></div>
        <div class="f-bar"><i style="width:${Math.max(3,Math.abs(r.sc)/max*100)}%;background:${r.sc>=0?'var(--gold)':'var(--ko)'}"></i></div>
      </div>
      <div class="f-sc">${r.sc}</div></div>`).join('');

  // statistiques
  let bestR={v:-1e9},worstR={v:1e9},exact=0,zeros=0,tot=0;
  state.rounds.forEach((R,r)=>state.players.forEach((p,i)=>{
    const s=scoreOf(R.e[i],R.cards); tot++;
    if(s.exact)exact++;
    if(R.e[i].bid===0&&s.exact)zeros++;
    if(s.pts>bestR.v)bestR={v:s.pts,p,r:r+1};
    if(s.pts<worstR.v)worstR={v:s.pts,p,r:r+1};
  }));
  const mins=Math.round((Date.now()-(state.started||Date.now()))/60000);
  document.getElementById('stats').innerHTML=`
    <div class="stat"><div class="stat-v">${Math.round(exact/Math.max(1,tot)*100)}%</div><div class="stat-l">Mises exactes</div></div>
    <div class="stat"><div class="stat-v">${zeros}</div><div class="stat-l">Mises à zéro réussies</div></div>
    <div class="stat"><div class="stat-v">${sign(bestR.v)}</div><div class="stat-l">Meilleure manche · ${esc((bestR.p||'').split(' ')[0])}</div></div>
    <div class="stat"><div class="stat-v">${worstR.v}</div><div class="stat-l">Pire manche · ${esc((worstR.p||'').split(' ')[0])}</div></div>
    <div class="stat"><div class="stat-v">${state.rounds.length}</div><div class="stat-l">Manches jouées</div></div>
    <div class="stat"><div class="stat-v">${mins>0?mins+' min':'—'}</div><div class="stat-l">Durée</div></div>`;

  document.getElementById('final-table').innerHTML=scoreTable(false);
  if(activeScreen()!=='sc-end')goto('sc-end');
  if(!quiet)setTimeout(confetti,350);
}
function confetti(){
  const l=document.getElementById('conf'); if(!l)return;
  const cols=['#f0c040','#c8860a','#ffffff','#3ddc84','#ff6b6b','#6aa9ff','#c96aff'];
  for(let k=0;k<34;k++){
    const s=document.createElement('div');
    const c=cols[k%cols.length], sz=5+Math.random()*6;
    s.style.cssText=`position:absolute;width:${sz}px;height:${sz*(Math.random()>.5?1:1.8)}px;`+
      `border-radius:${k%3===0?'50%':'2px'};background:${c};left:${Math.random()*100}%;top:-12px;`+
      `opacity:0;animation:confetti ${1+Math.random()*1.1}s cubic-bezier(.3,.6,.5,1) ${Math.random()*.7}s forwards`;
    l.appendChild(s);
  }
}
function shareResults(){
  const t=totals();
  const rows=state.players.map((p,i)=>({p,sc:t[i]})).sort((a,b)=>b.sc-a.sc);
  const np=playedCount();
  const txt=`💀 SKULL KING — ${MODES[state.mode].n}\n\n`+
    rows.map((r,k)=>`${MEDAL[k]||(k+1)+'.'} ${r.p} — ${r.sc} pts`).join('\n')+
    `\n\n${np} manche${np>1?'s':''} · ${state.scoring==='rascal'?'Décompte Rascal':'Décompte Skull King'}`;
  if(navigator.share){navigator.share({title:'Skull King',text:txt}).catch(()=>{})}
  else if(navigator.clipboard){navigator.clipboard.writeText(txt).then(()=>toast('Scores copiés ✓')).catch(()=>toast('Copie impossible'))}
  else toast('Partage indisponible');
  closeSheet();
}
function rematch(){
  const old=state;
  state=blank();
  ['players','mode','scoring','cannonball','wager','loot','kraken','whale'].forEach(k=>state[k]=old[k]);
  buildRounds();
  state.cur=0; state.dealer=(old.dealer+1)%state.players.length; state.started=Date.now();
  bonusOpen={}; save(); toast('Revanche ! ⚔️'); renderBid();
}
function newGame(){
  const old=state; wipe();
  state=blank();
  ['mode','scoring','cannonball','wager','loot','kraken','whale'].forEach(k=>state[k]=old[k]);
  state.players=old.players.length>=2?old.players.slice():['','',''];
  resetSetup();
}
function resetSetup(){
  draft=null; bonusOpen={};
  renderPlayers(); renderModes(); setScoring(state.scoring);
  ['cannon:cannonball','wager:wager','loot:loot','kraken:kraken','whale:whale'].forEach(x=>{
    const [id,k]=x.split(':'); document.getElementById('tg-'+id).classList.toggle('on',!!state[k]);
  });
  renderResume(); goto('sc-setup');
}

/* ═══════════════ RÈGLES ═══════════════ */
function openRules(anchor){
  document.getElementById('rules-body').innerHTML=RULES_HTML;
  openSheet('sheet-rules');
  if(anchor){setTimeout(()=>{const el=document.getElementById('r-'+anchor);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},220)}
}

/* ═══════════════ GESTIONNAIRES APPELÉS DEPUIS LE HTML ═══════════════ */
Object.assign(window,{
  addPlayer,delPlayer,setMode,setScoring,toggleOpt,toggleDark,resumeGame,startGame,wipe,renderResume,toast,
  bidBack,stepBid,setBid,setWager,setShot,confirmBids,goto,openRules,
  stepTrick,stepDestroyed,stepBonus,toggleBonus,confirmTricks,
  openHistory,openMenu,editRound,edStep,edBonus,edSet,edShot,edDestroyed,cancelEdit,commitEdit,
  closeSheet,scrimTap,abandon,shareResults,newGame,rematch
});
Object.defineProperty(window,'state',{get:()=>state,set:v=>{state=v}});

/* ═══════════════ DÉMARRAGE ═══════════════ */
(function init(){
  try{if(localStorage.getItem('sk.dark')==='1'){
    document.body.classList.add('dark');
    document.querySelector('meta[name=theme-color]').setAttribute('content','#0d1824');
  }}catch(e){}
  state=blank(); state.players=['','',''];
  resetSetup();
  document.getElementById('tg-dark').classList.toggle('on',document.body.classList.contains('dark'));
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();
