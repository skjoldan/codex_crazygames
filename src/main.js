import {LEVELS,SECTORS,dailyLevel} from './levels.js';
import {makeState,shoot,step,snapshot,remaining,starsFor,clamp,STEP,FLOOR} from './engine.js';
import {Renderer} from './render.js';
import {Portal} from './portal.js';
import {Sound} from './audio.js';
const $=id=>document.getElementById(id),canvas=$('game'),modal=$('modal'),card=$('modal-content');
const portal=new Portal(),sound=new Sound(),renderer=new Renderer(canvas);
await portal.init();let progress=portal.load();sound.enabled=progress.sound;renderer.motion=progress.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
let booted=false;
let level,state,angle=-Math.PI/2,history=null,paused=false,hidden=document.hidden,dragging=false,activePointer=null,keys=new Set(),accumulator=0,lastTime=0,resultDelay=0,resultShown=false,toastTimer=0,previousFocus=null;
const totalStars=()=>progress.stars.reduce((a,b)=>a+b,0);
const unlocked=()=>Math.min(29,progress.stars.findIndex(s=>s===0)<0?29:progress.stars.findIndex(s=>s===0));
const save=()=>portal.save(progress);
function updateSound(){sound.enabled=progress.sound;$('sound-btn').textContent=progress.sound?'♪':'♪̸';$('sound-btn').classList.toggle('muted',!progress.sound);$('sound-btn').setAttribute('aria-label',progress.sound?'Mute sound':'Unmute sound');}
function hideTutorial(){progress.tutorial=true;$('tutorial').classList.add('hidden');save();}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2000);}
function hud(){
 $('cores-count').textContent=remaining(state);$('shots-count').textContent=state.shots;
 const busy=state.phase==='flight';$('volley-label').lastElementChild.textContent=busy?`${state.combo} BROKEN · VOLLEY IN FLIGHT`:`${level.balls} BALLS · ${state.phase==='aim'?'READY':'COMPLETE'}`;
 $('undo-btn').disabled=!history||state.phase==='flight';$('total-stars').textContent=`${totalStars()} / 90 STARS`;
}
function loadLevel(which){
 level=typeof which==='number'?LEVELS[clamp(which,0,29)]:which;state=makeState(level);angle=-Math.PI/2;history=null;resultDelay=0;resultShown=false;accumulator=0;renderer.particles=[];renderer.rings=[];renderer.words=[];
 $('level-name').textContent=level.name;$('chamber-title').textContent=level.name;$('level-description').textContent=level.tip;
 const counter=level.id==='daily'?'DAILY / '+level.day:`CHAMBER ${String(level.id+1).padStart(2,'0')} / 30`;
 $('level-counter').textContent=counter;$('mobile-level').textContent=counter;
 $('sector-label').textContent=`SECTOR 0${level.sector+1} / ${SECTORS[level.sector].name}`;
 $('par-label').textContent=`${level.par} ${level.par===1?'VOLLEY':'VOLLEYS'}`;
 $('tutorial').classList.toggle('hidden',progress.tutorial||level.id!==0);
 closeModal(false);if(booted)portal.start();hud();
 if(level.id!==0)toast(level.tip);
}
function openModal(html){previousFocus=document.activeElement;paused=true;keys.clear();dragging=false;activePointer=null;portal.stop();sound.silence(true);card.innerHTML=html;modal.classList.remove('hidden');requestAnimationFrame(()=>card.querySelector('button')?.focus());}
function closeModal(resume=true){modal.classList.add('hidden');paused=false;keys.clear();sound.silence(hidden);if(resume&&(state.phase==='aim'||state.phase==='flight'))portal.start();previousFocus?.focus?.({preventScroll:true});lastTime=performance.now();accumulator=0;}
function fire(){if(paused||hidden||state.phase!=='aim')return;sound.unlock();history=snapshot(state);if(shoot(state,angle)){hideTutorial();hud();}}
function rewind(){if(!history||state.phase==='flight')return;state=snapshot(history);history=null;resultShown=false;resultDelay=0;closeModal();portal.start();hud();toast('Volley rewound. Try a different angle.');}
function retry(){sound.unlock();loadLevel(level);}
function showResult(){
 resultShown=true;const won=state.phase==='won',stars=starsFor(state,level),isDaily=level.id==='daily';
 if(won){if(isDaily){const old=progress.daily[level.day];progress.daily[level.day]=Math.min(old||999,state.used);const days=Object.keys(progress.daily).sort();while(days.length>35)delete progress.daily[days.shift()];}else{progress.stars[level.id]=Math.max(progress.stars[level.id],stars);portal.call('reportGameCompletedPercentage',Math.round(progress.stars.filter(s=>s>0).length/30*100));if((level.id+1)%6===0)portal.call('happytime');}save();hud();}
 const done=won&&!isDaily&&level.id===29;
 openModal(`<div class="eyebrow">${isDaily?'DAILY REACTOR':won?'CHAMBER COMPLETE':'ANOTHER ANGLE. ANOTHER CHANCE.'}</div><div class="result-symbol">${won?'✦':'↶'}</div><h2 id="modal-title">${done?'Foundry mastered.':won?(stars===3?'Beautifully done.':'Reactor cleared.'):'Almost there.'}</h2>${won?`<div class="stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}<span class="off">${'★'.repeat(3-stars)}</span></div>`:''}<p>${won?(isDaily?`Today's best: ${progress.daily[level.day]} volleys. A new reactor arrives at midnight UTC.`:stars===3?'That is how you start a chain reaction.':`Clear in ${level.par} volleys for all three stars.`):`${remaining(state)} cores left. Rewind your last volley or try a new approach.`}</p><div class="result-stats"><div><b>${state.used}</b><span>VOLLEYS USED</span></div><div><b>${state.maxCombo}</b><span>BEST CHAIN</span></div></div>${done?'<p class="final-note">All 30 chambers cleared! Chase 90 stars or take on the daily reactor.</p>':''}<button class="primary" id="result-next">${won?(done||isDaily?'Choose a chamber':'Next chamber →'):'Try again ↻'}</button>${history&&!won?'<button class="secondary" id="result-rewind">Rewind last volley</button>':won?'<button class="secondary" id="result-replay">Replay chamber</button>':''}<button class="text-button" id="result-levels">${done?'Play daily reactor':'Chamber selection'}</button>`);
 $('result-next').onclick=()=>won?(done||isDaily?showLevels():loadLevel(level.id+1)):retry();
 $('result-rewind')?.addEventListener('click',rewind);$('result-replay')?.addEventListener('click',retry);$('result-levels').onclick=()=>done?loadLevel(dailyLevel()):showLevels();
}
function showLevels(){
 const max=unlocked();openModal(`<div class="menu-header"><h2 id="modal-title">The foundry</h2><button id="close-levels" aria-label="Close level selection">×</button></div><div class="menu-meta">${totalStars()} / 90 stars · ${progress.stars.filter(s=>s>0).length} / 30 chambers cleared</div>${SECTORS.map((sector,j)=>`<div class="sector-title"><span>0${j+1} / ${sector.name}</span><span>${progress.stars.slice(j*6,j*6+6).reduce((a,b)=>a+b,0)} / 18 ★</span></div><div class="level-grid">${LEVELS.slice(j*6,j*6+6).map(l=>`<button class="level-tile ${level.id===l.id?'current':''}" data-level="${l.id}" ${l.id>max?'disabled':''} aria-label="Chamber ${l.id+1}, ${l.name}, ${progress.stars[l.id]} stars${l.id>max?', locked':''}">${l.id>max?'·':String(l.id+1).padStart(2,'0')}<small>${progress.stars[l.id]?'★'.repeat(progress.stars[l.id]):'—'}</small></button>`).join('')}</div>`).join('')}<button class="secondary" id="menu-daily">◈ Daily reactor · ${new Date().toISOString().slice(0,10)}</button><button class="text-button" id="menu-settings">Settings & controls</button>`);
 card.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>loadLevel(Number(b.dataset.level)));
 $('close-levels').onclick=()=>{closeModal();if(resultShown&&(state.phase==='won'||state.phase==='lost'))showResult();};$('menu-daily').onclick=()=>loadLevel(dailyLevel());$('menu-settings').onclick=showPause;
}
function showPause(){
 openModal(`<div class="eyebrow">TAKE YOUR TIME</div><h2 id="modal-title">Foundry on hold.</h2><p>Find an angle. Make a little chaos.</p><div class="toggle-row"><span>Sound effects</span><button id="setting-sound">${progress.sound?'On':'Off'}</button></div><div class="toggle-row"><span>Screen shake & trails</span><button id="setting-motion">${renderer.motion?'On':'Off'}</button></div><div class="pause-controls"><p><b>Mouse / touch</b> · Aim anywhere in the chamber, then release to fire.<br><b>Keyboard</b> · ← / → aim, Space fires, Z rewinds, R restarts, P pauses.</p><p>Break every colored core before you run out of volleys. Numbers show remaining hits. Red overloads explode; mint splitters add balls. Steel stays.</p></div><button class="primary" id="resume-btn">Resume →</button><button class="secondary" id="pause-levels">Choose a chamber</button>`);
 $('setting-sound').onclick=()=>{progress.sound=!progress.sound;updateSound();save();$('setting-sound').textContent=progress.sound?'On':'Off';};
 $('setting-motion').onclick=()=>{renderer.motion=!renderer.motion;progress.motion=renderer.motion;save();$('setting-motion').textContent=renderer.motion?'On':'Off';};
 $('resume-btn').onclick=()=>{sound.unlock();closeModal();if(resultShown&&(state.phase==='won'||state.phase==='lost'))showResult();};$('pause-levels').onclick=showLevels;
}
function aimAt(e){const p=renderer.point(e.clientX,e.clientY);if(p.y>FLOOR-12)return;angle=clamp(Math.atan2(p.y-FLOOR,p.x-state.launcher),-Math.PI+.18,-.18);}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||paused||state.phase!=='aim'||activePointer!==null)return;sound.unlock();activePointer=e.pointerId;dragging=true;aimAt(e);canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
canvas.addEventListener('pointermove',e=>{if(paused||state.phase!=='aim')return;if(activePointer===null||e.pointerId===activePointer)aimAt(e);});
canvas.addEventListener('pointerup',e=>{if(e.pointerId!==activePointer)return;aimAt(e);dragging=false;activePointer=null;fire();});
canvas.addEventListener('pointercancel',()=>{dragging=false;activePointer=null;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
 if(!modal.classList.contains('hidden')){
  if(e.key==='Tab'){const btns=[...card.querySelectorAll('button:not(:disabled)')];if(!btns.length)return;const first=btns[0],last=btns.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  if(e.code==='KeyP'){e.preventDefault();closeModal();if(resultShown)showResult();}return;
 }
 if(['ArrowLeft','ArrowRight','Space','KeyZ','KeyR','KeyP'].includes(e.code)){
  // Space on an actual button retains native button behavior.
  if(e.code==='Space'&&document.activeElement?.tagName==='BUTTON')return;
  e.preventDefault();keys.add(e.code);sound.unlock();if(e.repeat)return;
  if(e.code==='Space')fire();if(e.code==='KeyZ')rewind();if(e.code==='KeyR')retry();if(e.code==='KeyP')showPause();
 }
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();dragging=false;activePointer=null;});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;keys.clear();dragging=false;activePointer=null;accumulator=0;lastTime=performance.now();sound.silence(hidden||paused);});
document.addEventListener('pointerup',()=>sound.unlock());
$('levels-btn').onclick=showLevels;$('brand').onclick=showLevels;$('daily-btn').onclick=()=>loadLevel(dailyLevel());$('pause-btn').onclick=showPause;$('sound-btn').onclick=()=>{sound.unlock();progress.sound=!progress.sound;updateSound();save();};$('retry-btn').onclick=retry;$('undo-btn').onclick=rewind;$('skip-tutorial').onclick=hideTutorial;
new ResizeObserver(()=>renderer.resize()).observe($('canvas-wrap'));
function frame(now){const dt=Math.min(.05,(now-(lastTime||now))/1000);lastTime=now;
 if(!hidden){
  if(!paused){if(state.phase==='aim'){if(keys.has('ArrowLeft'))angle-=dt*.9;if(keys.has('ArrowRight'))angle+=dt*.9;angle=clamp(angle,-Math.PI+.18,-.18);}
   accumulator+=dt;while(accumulator>=STEP){step(state,STEP);accumulator-=STEP;}
   for(const e of state.events){renderer.effects(e);sound.play(e.type,e.combo);if(e.type==='win'||e.type==='lose')resultDelay=.8;}
   state.events=[];if(resultDelay>0){resultDelay-=dt;if(resultDelay<=0&&!resultShown)showResult();}hud();
  }
  renderer.draw(state,angle,paused?0:dt,dragging);
 }
 requestAnimationFrame(frame);
}
updateSound();loadLevel(unlocked());portal.ready();booted=true;portal.start();requestAnimationFrame(frame);
// QA harness exists only on localhost; never exposed on the portal or preview hosts.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('qa')){
 window.__qa={get state(){return state;},get level(){return level;},get progress(){return progress;},get angle(){return angle;},get portal(){return portal;},load:i=>loadLevel(i==='daily'?dailyLevel():i),shoot:a=>{angle=a;fire();},point:(x,y)=>renderer.screenPoint(x,y),advance:(seconds)=>{for(let i=0;i<seconds/STEP;i++)step(state,STEP);},showLevels,showPause,rewind,renderer};
}
