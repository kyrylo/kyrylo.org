// Exercise the real controller with DOM/renderer test doubles. This checks input and
// session behavior; it deliberately does not stand in for visual browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as model from '../model.js';
import {createRaceClock,formatRaceTime,readRaceBests} from '../race-clock.js';
import {createAmbience} from '../ambience.js';
import {beginHomeArrival,advanceHomeArrival} from '../home-arrival.js';
import {stageBarrierTrap} from './barrier-trap.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const controller=readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
async function harness({finish=false,dry=false,shoe,stance,barrierStance,legHit=()=>null,storage=new Map()}={}) {
 let now=100,frame,clean=.75,viewOffset=0,viewScale=1,currentGame,currentRace,aimPlans=0,focused='';
 const windowEvents=new Map(),documentEvents=new Map();
 const elements=new Map();
 class Element {
  constructor(id,tag){this.id=id;this.hidden=/\bhidden\b/.test(tag);this.disabled=/\bdisabled\b/.test(tag);this.dataset=new Proxy({},{set:(target,key,value)=>{target[key]=String(value);return true;}});this.parentElement={dataset:{}};this.textContent='';this.value='';this.listeners=new Map();this.attributes={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};this.style={setProperty(){}};}
  addEventListener(type,fn){this.listeners.set(type,fn);}
  fire(type,event={}){this.listeners.get(type)?.({preventDefault(){},...event});}
  getAttribute(key){return this.attributes[key]??null;}
  setAttribute(key,value){this.attributes[key]=String(value);}
  focus(){focused=this.id;}
  setPointerCapture(id){this.captured=id;}
  hasPointerCapture(id){return this.captured===id;}
  releasePointerCapture(){this.captured=null;this.fire('lostpointercapture',{pointerId:1});}
  getBoundingClientRect(){return {left:0,top:0,right:900,bottom:800,width:900,height:800};}
 }
 for(const match of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g))elements.set(match[1],new Element(match[1],match[0]));
 const get=id=>{assert.ok(elements.has(id),'Missing DOM element: '+id);return elements.get(id);};
 const renderer={mask:null,assetsReady:true,legAtPoint:legHit,prepare(){},render(){},invalidateSize(){},worldPoint:(x,y)=>({x:x/viewScale,y:y/viewScale+viewOffset}),screenPoint:p=>({x:p.x*viewScale,y:(p.y-viewOffset)*viewScale}),metrics:{cacheBytes:0,chunks:0}};
 const context={...model,beginHomeArrival,advanceHomeArrival,planStep:(...args)=>{aimPlans++;return model.planStep(...args);},createRaceClock:now=>{currentRace=createRaceClock(now);return currentRace;},formatRaceTime,readRaceBests,createAmbience,createGame:(id,seed)=>{
  // A material override exercises legacy result/record rendering, without a loadout UI.
  const g=model.createGame(shoe??id,seed??42);
  if(dry)g.street=model.indexStreet({...g.street,patches:[],obstacles:[]});
  if(stance)g.feet.forEach((f,i)=>Object.assign(f,{...stance[i],bestY:stance[i].y}));
  if(barrierStance){stageBarrierTrap(g,g.street.obstacles.find(o=>o.type==='barrier'),barrierStance);g.events.length=0;g.phase='ready';}
  if(finish){g.feet.forEach((f,i)=>{f.y=model.ROAD.finish-60-i*20;f.stain.fill(1-clean);f.sole.forEach(z=>z.stain=1-clean);f.coverage=1-clean;});}
  currentGame=g;return g;
 },createRenderer:async()=>renderer,document:{getElementById:get,hidden:false,addEventListener(type,fn){documentEvents.set(type,fn);}},window:{addEventListener(type,fn){windowEvents.set(type,fn);}},matchMedia:()=>({matches:false}),localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},performance:{now:()=>now},requestAnimationFrame:fn=>{frame=fn;}};
 await runInNewContext('(async()=>{'+controller+'})()',context);
 const tick=(n=1)=>{for(let i=0;i<n;i++){now+=1000/60;const next=frame;frame=null;next?.(now);}};
 const click=id=>{get(id).focus();get(id).fire('click');};
 const key=(value,extra={})=>get('street').fire('keydown',{key:value,repeat:false,...extra});
 const keyup=value=>windowEvents.get('keyup')?.({key:value});
 const pointer=(type,x=500,y=560,extra={})=>get('street').fire(type,{button:0,pointerId:1,pointerType:'touch',clientX:x,clientY:y,...extra});
 const walkToFinish=()=>{for(let i=0;i<5&&get('street').dataset.phase!=='finished';i++){key(' ');tick(70);}assert.equal(get('street').dataset.phase,'finished');};
 const untilMode=mode=>{for(let i=0;i<120&&currentGame.mode!==mode;i++)tick();assert.equal(currentGame.mode,mode);};
 return {get,focused:()=>focused,has:id=>elements.has(id),texts:()=>[...elements.values()].map(e=>e.textContent).join(' '),tick,click,key,keyup,pointer,untilMode,walkToFinish,aimPlans:()=>aimPlans,pendingFrame:()=>Boolean(frame),resize:()=>windowEvents.get('resize')?.(),blur:()=>windowEvents.get('blur')?.(),hide:value=>{context.document.hidden=value;documentEvents.get('visibilitychange')?.();},elapse:ms=>{now+=ms;},splits:()=>currentRace.splits(),emit:(...events)=>currentGame.events.push(...events),setClean:value=>{clean=value;},setView:value=>{viewOffset=value;},setScale:value=>{viewScale=value;}};
}

test('pointer aiming is reused by the next frame, but hover follows a changing camera',async()=>{
 const h=await harness({dry:true});h.click('start');
 h.pointer('pointermove',440,400,{pointerType:'mouse'});const plans=h.aimPlans();h.tick();
 assert.equal(h.aimPlans(),plans,'rendering must not repeat the pointer landing calculation');
 const target=h.get('street').dataset.target;
 h.setView(25);h.tick();assert.equal(h.aimPlans(),plans+1);assert.notEqual(h.get('street').dataset.target,target);
});
test('a held landing remains cached through camera movement and refreshes on a real drag',async()=>{
 const h=await harness({dry:true});h.click('start');h.pointer('pointerdown',440,400);h.tick();
 const target=h.get('street').dataset.target,plans=h.aimPlans();h.setView(25);h.tick(5);
 assert.equal(h.aimPlans(),plans);assert.equal(h.get('street').dataset.target,target);
 h.pointer('pointermove',430,420);assert.equal(h.aimPlans(),plans+1);h.tick();
 assert.equal(h.aimPlans(),plans+1);assert.notEqual(h.get('street').dataset.target,target);
 h.pointer('pointerup',430,420);h.tick(90);assert.equal(Number(h.get('street').dataset.steps),1);
});

test('losing focus preserves an adjusted footprint, clears held keys and keeps walking',async()=>{
 const h=await harness();h.click('start');h.key('ArrowLeft');h.tick();
 const target=h.get('street').dataset.target;
 h.blur();h.tick(120);
 assert.equal(h.get('street').dataset.phase,'walking');assert.equal(h.get('welcome').hidden,true);
 assert.equal(h.get('street').dataset.target,target);assert.equal(Number(h.get('street').dataset.steps),0);
 assert.ok(Number(h.get('street').dataset.raceTime)>=2000);
});
test('Escape and focus loss never interrupt an in-flight step or open a menu',async()=>{
 for(const action of ['escape','blur','hidden']){
  const h=await harness();h.click('start');h.key(' ');h.tick(8);
  if(action==='escape')h.key('Escape');else if(action==='blur')h.blur();else h.hide(true);
  h.tick(120);h.hide(false);h.tick();
  assert.equal(h.get('street').dataset.phase,'walking');assert.equal(h.get('welcome').hidden,true);
  assert.equal(h.get('street').dataset.mode,'idle');assert.equal(Number(h.get('street').dataset.steps),1);
 }
});
test('starting a new street resets the walk and clock',async()=>{
 const h=await harness();h.click('start');h.key(' ');h.tick(70);
 h.click('restart');h.tick();
 assert.equal(Number(h.get('street').dataset.steps),0);assert.equal(h.get('street').dataset.phase,'ready');
 assert.equal(h.get('welcome').hidden,false);assert.equal(h.get('race-time').textContent,'0:00.00');
 h.click('start');assert.equal(h.get('welcome').hidden,true);assert.equal(h.get('goal-condition').textContent,'100.0%');
});
test('the result is cleanliness and time, and Walk again repeats the same street with a fresh clock',async()=>{
 const key='puddle-walker-100m-best-walking-v2',storage=new Map([[key,'8290']]),h=await harness({finish:true,storage});
 h.click('start');h.walkToFinish();const seed=h.get('street').dataset.seed;
 assert.equal(h.get('result-clean').textContent,'75.0%');assert.match(h.get('result-time').textContent,/^0:/);
 assert.doesNotMatch(h.get('street').attributes['aria-label'],/points|score/i);
 h.setClean(.9);h.click('again');assert.equal(h.get('race-time').textContent,'0:00.00');
 assert.equal(h.get('street').dataset.seed,seed);assert.equal(h.get('welcome').hidden,true);assert.equal(h.get('result').hidden,true);
 h.walkToFinish();assert.equal(h.get('result-clean').textContent,'90.0%');assert.equal(storage.get(key),'8290','legacy point records are neither read nor changed');
 for(const id of ['score','result-score','streak','flow-hud','stretch-hud','goal-status','left-state','right-loss','feedback','different-street'])assert.equal(h.has(id),false,id);
});
test('a full clean walk completes and replays without medal or combo UI',async()=>{
 const h=await harness({dry:true});h.click('start');
 for(let i=0;i<150&&h.get('street').dataset.phase!=='finished';i++){h.key(' ');h.tick(70);}
 assert.equal(h.get('street').dataset.phase,'finished');assert.equal(h.get('result-clean').textContent,'100.0%');
 assert.doesNotMatch(h.texts(),/medal|streak|flow|points|crossing|needle|target/i);
 h.click('again');h.tick();assert.equal(h.get('street').dataset.phase,'walking');assert.equal(h.get('goal-condition').textContent,'100.0%');
});

test('a key pressed just before touchdown takes exactly one following step',async()=>{
 const h=await harness();h.click('start');h.key(' ');h.untilMode('settling');h.key(' ');
 assert.equal(h.get('street').dataset.queued,'true');h.tick(120);
 assert.equal(Number(h.get('street').dataset.steps),2);assert.equal(h.get('street').dataset.mode,'idle');
 assert.equal(h.get('street').dataset.queued,'false');
});
test('early input expires and held-key repeats never start an extra step',async()=>{
 const h=await harness();h.click('start');h.key(' ');h.key(' ');h.tick(90);
 assert.equal(Number(h.get('street').dataset.steps),1);
 h.key(' ');h.untilMode('settling');h.key(' ',{repeat:true});h.tick(90);
 assert.equal(Number(h.get('street').dataset.steps),2);
});
test('a late touch lands at the clicked ground spot even as the camera moves',async()=>{
 const h=await harness();h.click('start');h.key(' ');h.untilMode('settling');
 h.pointer('pointerdown');h.pointer('pointerup');assert.equal(h.get('street').dataset.queued,'true');
 h.setView(100);h.tick(120);
 const right=JSON.parse(h.get('street').dataset.feet)[1];
 assert.equal(Number(h.get('street').dataset.steps),2);assert.ok(Math.abs(right.x-500)<2);assert.ok(Math.abs(right.y-560)<2);
});
test('losing focus cancels a queued step while the current step finishes',async()=>{
 const h=await harness();h.click('start');h.key(' ');h.untilMode('settling');h.key(' ');
 h.blur();h.tick(120);
 assert.equal(Number(h.get('street').dataset.steps),1);assert.equal(h.get('street').dataset.queued,'false');
});
test('catching an obstacle discards a buffered step and waits for a deliberate new placement',async()=>{
 const h=await harness({dry:true});h.click('start');h.key(' ');h.untilMode('settling');h.key(' ');
 assert.equal(h.get('street').dataset.queued,'true');h.emit({type:'bump',side:0,force:.7,obstacle:'barrier'});h.tick(120);
 assert.equal(Number(h.get('street').dataset.steps),1);assert.equal(h.get('street').dataset.queued,'false');
 h.key(' ');h.tick(90);assert.equal(Number(h.get('street').dataset.steps),2);
});
test('dragging can begin during a step and commits only when released',async()=>{
 const h=await harness();h.click('start');h.key(' ');h.tick(4);h.pointer('pointerdown');h.tick(90);
 assert.equal(Number(h.get('street').dataset.steps),1);
 h.pointer('pointermove',510,570);h.pointer('pointerup',510,570);h.tick(90);
 const right=JSON.parse(h.get('street').dataset.feet)[1];
 assert.equal(Number(h.get('street').dataset.steps),2);assert.ok(Math.abs(right.x-510)<2);assert.ok(Math.abs(right.y-570)<2);
});
test('cancelled or off-canvas touches do not leave a hidden step queued',async()=>{
 for(const action of ['pointercancel','off-canvas']) {
  const h=await harness();h.click('start');h.key(' ');h.untilMode('settling');h.pointer('pointerdown');
  if(action==='off-canvas')h.pointer('pointerup',1000,560);else h.pointer(action);
  h.tick(120);assert.equal(Number(h.get('street').dataset.steps),1);assert.equal(h.get('street').dataset.queued,'false');
 }
});
test('Shift gives finer keyboard placement and releasing it restores normal aiming',async()=>{
 const normal=await harness(),fine=await harness();
 normal.click('start');fine.click('start');normal.key('ArrowLeft');fine.key('ArrowLeft',{shiftKey:true});
 normal.tick(5);fine.tick(5);
 const x=h=>Number(h.get('street').dataset.target.split(',')[0]);
 const normalDistance=420-x(normal),fineDistance=420-x(fine);
 assert.ok(fineDistance>0&&fineDistance<normalDistance/3);
 fine.keyup('Shift');const before=x(fine);fine.tick(5);assert.ok(before-x(fine)>15);
});

test('wet contact, clean crossings and streak events produce no explanatory overlay',async()=>{
 const h=await harness();h.click('start');
 h.emit({type:'splash',side:0,surface:'water',intensity:1},{type:'land',side:0,surface:'gum'},{type:'chainLost'},
  {type:'clean',side:1,points:35,chain:1,crossed:true},{type:'clean',flowRaised:true,multiplier:3});h.tick();
 assert.equal(h.get('street').dataset.phase,'walking');
 assert.doesNotMatch(h.texts(),/splash|gum|streak|flow|crossing|needle|soaking|−/i);
 assert.equal(h.has('feedback'),false);h.click('restart');h.tick();assert.equal(h.get('welcome').hidden,false);
});

test('section splits include time away from the tab and reset on replay',async()=>{
 const h=await harness({dry:true});
 const walk=()=>{for(let i=0;i<150&&h.get('street').dataset.phase!=='finished';i++){h.key(' ');h.tick(40);}};
 h.click('start');h.tick(60);h.hide(true);h.elapse(10000);h.hide(false);walk();
 assert.equal(h.get('street').dataset.phase,'finished');
 const [m,sec]=h.get('result-time').textContent.split(':').map(Number),total=m*60000+sec*1000;
 const first=h.splits();assert.equal(first.length,5);assert.ok(first.every(s=>s.duration>0));
 assert.ok(Math.abs(total-first.reduce((n,s)=>n+s.duration,0))<50);assert.ok(first[0].duration>10000);
 h.click('again');assert.equal(h.splits().length,0);walk();
 assert.ok(h.splits()[0].duration<first[0].duration);
 h.click('restart');assert.equal(h.splits().length,0);
});
test('finishing after a dirty event still shows only the final condition',async()=>{
 const h=await harness({finish:true});h.click('start');h.emit({type:'chainLost'});h.tick();h.walkToFinish();
 assert.equal(h.has('feedback'),false);assert.equal(h.get('result-clean').textContent,'75.0%');
});
test('sound is opt-in, remembers the chosen setting and keeps the button state consistent',async()=>{
 const storage=new Map(),first=await harness({storage});
 assert.equal(first.get('sound').attributes['aria-pressed'],'false');
 first.click('sound');assert.equal(first.get('sound').attributes['aria-pressed'],'true');
 assert.equal(first.get('sound').attributes.title,'Sound on');
 const next=await harness({storage});assert.equal(next.get('sound').attributes['aria-pressed'],'true');
 next.click('sound');assert.equal(next.get('sound').attributes['aria-label'],'Enable sounds');
 const muted=await harness({storage});assert.equal(muted.get('sound').attributes['aria-pressed'],'false');
});

test('toggling sound returns keyboard control to walking without moving an aimed footprint or interrupting a step',async()=>{
 const h=await harness({dry:true});h.click('start');h.key('ArrowLeft');h.keyup('ArrowLeft');h.tick();
 const target=h.get('street').dataset.target;
 h.click('sound');h.tick();assert.equal(h.focused(),'street');assert.equal(h.get('street').dataset.target,target);assert.equal(Number(h.get('street').dataset.steps),0);
 h.key(' ');h.tick(3);assert.equal(h.get('street').dataset.mode,'flight');
 h.click('sound');assert.equal(h.focused(),'street');h.tick(90);
 assert.equal(Number(h.get('street').dataset.steps),1);assert.equal(h.get('street').dataset.mode,'idle');
 assert.equal(h.get('sound').attributes['aria-pressed'],'false');
});


test('a backward tap cannot move the player and a forward tap still works',async()=>{
 const h=await harness();h.click('start');h.tick();const before=h.get('street').dataset.feet;
 h.pointer('pointerdown',400,150);h.pointer('pointerup',400,150);h.tick(70);
 assert.equal(Number(h.get('street').dataset.steps),0);assert.equal(h.get('street').dataset.feet,before);
 h.pointer('pointerdown',400,400);h.pointer('pointerup',400,400);h.tick(70);
 assert.equal(Number(h.get('street').dataset.steps),1);
});
test('all finishes show their actual cleanliness without a pass/fail target',async()=>{
 const h=await harness({finish:true});h.click('start');h.walkToFinish();
 assert.equal(h.get('result-clean').textContent,'75.0%');assert.equal(h.has('goal-status'),false);
 h.setClean(.95);h.click('again');h.walkToFinish();assert.equal(h.get('result-clean').textContent,'95.0%');
 h.setClean(1);h.click('again');h.walkToFinish();assert.equal(h.get('result-clean').textContent,'100.0%');
});

test('the live clock counts hidden-tab time without animation frames, resets on retry and stops at finish',async()=>{
 const h=await harness({finish:true});h.tick(100);assert.equal(h.get('race-time').textContent,'0:00.00');
 h.click('start');h.tick(90);const first=Number(h.get('street').dataset.raceTime);assert.ok(first>=1400);
 h.hide(true);h.elapse(10000);h.hide(false);h.tick(90);
 // The HUD refreshes every 70ms; all 10s away plus 1.5s of frames must count.
 assert.ok(Math.abs(Number(h.get('street').dataset.raceTime)-first-11500)<100);assert.equal(h.get('street').dataset.phase,'walking');
 h.walkToFinish();const finish=h.get('result-time').textContent;h.tick(300);assert.equal(h.get('result-time').textContent,finish);
 h.click('again');assert.equal(h.get('race-time').textContent,'0:00.00');
});
test('only clean finishes save a personal race record',async()=>{
 const storage=new Map(),h=await harness({finish:true,storage});h.click('start');h.walkToFinish();
 assert.equal(storage.has('puddle-walker-clean-times-walking-v8'),false);assert.equal(h.get('result-time-best').hidden,true);
 h.setClean(.98);h.click('again');h.walkToFinish();const first=JSON.parse(storage.get('puddle-walker-clean-times-walking-v8')).leather;
 assert.ok(first>0);assert.equal(h.get('result-time-best').dataset.record,'true');
 h.click('again');h.tick(300);h.walkToFinish();assert.equal(JSON.parse(storage.get('puddle-walker-clean-times-walking-v8')).leather,first);assert.equal(h.get('result-time-best').dataset.record,'false');
});
test('F and tapping a planted shoe switch feet without a button or an accidental step',async()=>{
 const h=await harness();h.click('start');assert.equal(h.get('street').dataset.activeFoot,'0');
 h.key('f');h.tick();assert.equal(h.get('street').dataset.activeFoot,'1');assert.equal(Number(h.get('street').dataset.steps),0);
 h.key('f');h.tick();assert.equal(h.get('street').dataset.activeFoot,'0');assert.equal(h.has('switch-foot'),false);
 assert.doesNotMatch(h.get('control-hint').textContent,/switch|feet|\bF\b/i);
 h.pointer('pointerdown',480,240);h.pointer('pointerup',480,240);h.tick();assert.equal(h.get('street').dataset.activeFoot,'1');assert.equal(Number(h.get('street').dataset.steps),0);
 h.key(' ');h.tick(5);assert.equal(h.get('street').dataset.mode,'flight');h.key('f');assert.equal(h.get('street').dataset.activeFoot,'1');
 h.tick(90);assert.equal(h.get('street').dataset.mode,'idle');
});

test('either planted shoe can be grabbed and dragged in one gesture, preserving the grip offset',async()=>{
 for(const side of [0,1]){
  const h=await harness({dry:true}),x=420+side*60;h.click('start');
  h.pointer('pointerdown',x+8,250);h.tick();
  assert.equal(h.get('street').dataset.activeFoot,String(side));assert.equal(Number(h.get('street').dataset.steps),0);
  h.pointer('pointermove',x+38,410);h.tick();
  const landingY=side?400:420;
  assert.equal(h.get('street').dataset.pointer,'dragging');assert.equal(h.get('street').dataset.target,`${x+30}.0,${landingY}.0`);
  h.pointer('pointerup',x+38,410);h.tick(90);
  const foot=JSON.parse(h.get('street').dataset.feet)[side];
  assert.equal(Number(h.get('street').dataset.steps),1);assert.ok(Math.abs(foot.x-x-30)<2);assert.ok(Math.abs(foot.y-landingY)<2);
 }
});
test('finger jitter while selecting a shoe never commits a step',async()=>{
 const h=await harness();h.click('start');h.pointer('pointerdown',480,240);h.pointer('pointermove',484,242);h.tick(30);h.pointer('pointerup',484,242);h.tick(90);
 assert.equal(h.get('street').dataset.activeFoot,'1');assert.equal(Number(h.get('street').dataset.steps),0);assert.equal(h.get('street').dataset.targetValid,'true');
});
test('phone-sized shoes have a fingertip-sized selection area and overlapping areas choose the nearest shoe',async()=>{
 const h=await harness();h.setScale(.5);h.click('start');
 for(const [x,side] of [[254,1],[226,1],[224,0]]){
  h.pointer('pointerdown',x,125);h.pointer('pointerup',x,125);h.tick();
  assert.equal(h.get('street').dataset.activeFoot,String(side));assert.equal(Number(h.get('street').dataset.steps),0);
 }
});
test('a held touch keeps its ground position through camera movement and releases onto that same position',async()=>{
 const h=await harness({dry:true});h.click('start');h.pointer('pointerdown',420,400);h.tick();
 const target=h.get('street').dataset.target;h.setView(80);h.tick(30);assert.equal(h.get('street').dataset.target,target);
 h.pointer('pointerup',420,400);h.tick(90);
 assert.ok(Math.abs(JSON.parse(h.get('street').dataset.feet)[0].y-400)<2);
});
test('a grabbed shoe keeps its grip and ground position when the camera settles',async()=>{
 const h=await harness({dry:true});h.click('start');h.pointer('pointerdown',488,250);h.pointer('pointermove',518,410);h.tick();
 h.setView(100);h.tick(30);assert.equal(h.get('street').dataset.target,'510.0,400.0');
 h.pointer('pointerup',518,410);h.tick(90);
 const right=JSON.parse(h.get('street').dataset.feet)[1];assert.ok(Math.abs(right.x-510)<2);assert.ok(Math.abs(right.y-400)<2);
});
test('an unpressed mouse still aims under its cursor as the camera moves',async()=>{
 const h=await harness();h.click('start');h.pointer('pointermove',420,400,{pointerType:'mouse'});h.tick();
 assert.equal(h.get('street').dataset.target,'420.0,400.0');h.setView(30);h.tick();assert.equal(h.get('street').dataset.target,'420.0,430.0');
});
test('cancelled, lost, unfocused and off-canvas shoe drags cannot commit a hidden step',async()=>{
 for(const action of ['pointercancel','lostpointercapture','blur','hidden','off-canvas']){
  const h=await harness();h.click('start');h.pointer('pointerdown',480,240);h.pointer('pointermove',510,410);
  if(action==='blur')h.blur();
  else if(action==='hidden'){h.hide(true);h.hide(false);}
  else if(action==='off-canvas')h.pointer('pointerup',1000,410);
  else h.pointer(action,510,410);
  h.pointer('pointerup',510,410);h.tick(90);
  assert.equal(Number(h.get('street').dataset.steps),0);assert.equal(h.get('street').dataset.queued,'false');assert.equal(h.get('street').dataset.pointer,'ground');
 }
});
test('dragging a stretched leading shoe inward completes even after focus loss',async()=>{
 const h=await harness({dry:true,stance:[{x:420,y:300},{x:450,y:515}]});h.click('start');
 h.pointer('pointerdown',450,515);h.pointer('pointermove',500,425);h.tick();
 assert.equal(h.get('street').dataset.activeFoot,'1');assert.equal(h.get('street').dataset.targetValid,'true');
 const distance=h.get('distance').textContent;
 h.pointer('pointerup',500,425);h.tick(4);h.blur();h.tick(120);
 const feet=JSON.parse(h.get('street').dataset.feet);
 assert.equal(Number(h.get('street').dataset.steps),1);assert.equal(h.get('distance').textContent,distance);
 assert.ok(feet[1].x>499&&feet[1].y<426&&feet[1].y>424);assert.equal(feet[0].y,300);
});
test('a collision still allows foot selection without a HUD control or event announcement',async()=>{
 const h=await harness({dry:true,stance:[{x:420,y:300},{x:450,y:515}]});h.click('start');h.emit({type:'bump'});h.tick();
 assert.equal(h.has('feedback'),false);assert.equal(h.has('switch-foot'),false);assert.equal(h.get('street').dataset.phase,'walking');
 h.key('f');h.tick();assert.equal(h.get('street').dataset.activeFoot,'1');assert.equal(Number(h.get('street').dataset.steps),0);
});
test('Make room and R escape a trapped stance without resetting the race or street',async()=>{
 for(const kind of ['corner','middle']){
  const h=await harness({barrierStance:kind});h.click('start');h.tick(20);
  const seed=h.get('street').dataset.seed,steps=Number(h.get('street').dataset.steps),clock=Number(h.get('street').dataset.raceTime);
  assert.equal(h.get('make-room').hidden,false);
  for(let n=0;n<8&&!h.get('make-room').hidden;n++){
   if(n%2)h.key('r');else h.click('make-room');
   h.tick(2);assert.equal(h.get('make-room').disabled,true);h.tick(60);
  }
  assert.equal(h.get('make-room').hidden,true);assert.equal(h.get('street').dataset.seed,seed);
  assert.ok(Number(h.get('street').dataset.steps)>steps);assert.ok(Number(h.get('street').dataset.raceTime)>clock);
  assert.equal(h.get('welcome').hidden,true);assert.equal(h.get('street').dataset.queued,'false');
  assert.equal(h.has('feedback'),false);
  h.key(' ');h.tick(60);assert.equal(h.get('street').dataset.mode,'idle');
 }
});
test('held recovery input never chains steps and focus loss allows one placement to finish',async()=>{
 const h=await harness({barrierStance:'middle'});h.click('start');h.tick();const steps=Number(h.get('street').dataset.steps);
 h.key('r');h.tick(4);h.key('r',{repeat:true});h.blur();h.tick(90);h.key('r',{repeat:true});h.tick(90);
 assert.equal(Number(h.get('street').dataset.steps),steps+1);assert.equal(h.get('street').dataset.queued,'false');
});

test('race records keep materials separate and survive later dirty finishes',async()=>{
 const storage=new Map([['puddle-walker-clean-times-walking-v8','{"leather":55000}']]);
 const h=await harness({finish:true,shoe:'canvas',storage});h.setClean(.98);h.click('again');h.walkToFinish();
 const saved=JSON.parse(storage.get('puddle-walker-clean-times-walking-v8'));assert.equal(saved.leather,55000);assert.ok(saved.canvas>0);assert.equal(saved.knit,undefined);
 h.setClean(.7);h.click('again');h.walkToFinish();assert.deepEqual(JSON.parse(storage.get('puddle-walker-clean-times-walking-v8')),saved);
});


test('walking is the only move: J is inert and Space moves only the selected shoe',async()=>{
 assert.doesNotMatch(html,/id="leap"|J toggles leap/);
 const h=await harness({dry:true});h.click('start');h.key('ArrowLeft');h.keyup('ArrowLeft');h.tick();
 const target=h.get('street').dataset.target,before=JSON.parse(h.get('street').dataset.feet);
 h.key('j');h.key('J');h.tick(60);assert.equal(h.get('street').dataset.target,target);assert.equal(Number(h.get('street').dataset.steps),0);
 assert.doesNotMatch(h.get('control-hint').textContent,/leap|jump/i);assert.doesNotMatch(h.get('street').attributes['aria-label'],/leap|jump/i);
 h.key(' ');h.tick(8);const moving=JSON.parse(h.get('street').dataset.feet);
 assert.ok(moving[0].z>0);assert.deepEqual(moving[1],before[1]);h.tick(90);assert.equal(Number(h.get('street').dataset.steps),1);
});
test('shoe selection and edge controls preserve an aimed walking depth without moving either foot',async()=>{
 const h=await harness({dry:true});h.click('start');h.pointer('pointermove',420,400,{pointerType:'mouse'});h.tick();
 const before=h.get('street').dataset.feet;
 h.pointer('pointermove',480,240,{pointerType:'mouse'});h.tick(20);assert.equal(h.get('street').dataset.target,'420.0,400.0');
 h.pointer('pointerdown',480,240,{pointerType:'mouse'});h.pointer('pointerup',480,240,{pointerType:'mouse'});h.tick();
 assert.equal(h.get('street').dataset.activeFoot,'1');assert.equal(h.get('street').dataset.target,'447.0,400.0');
 h.pointer('pointerleave',901,400,{pointerType:'mouse'});h.blur();h.tick();
 assert.equal(h.get('street').dataset.target,'447.0,400.0');assert.equal(h.get('street').dataset.feet,before);assert.equal(Number(h.get('street').dataset.steps),0);
});
test('hard-course records exclude easier streets and old leaps without deleting those times',async()=>{
 const storage=new Map([['puddle-walker-clean-times-v1','{"leather":1}'],['puddle-walker-clean-times-walking-v5','{"leather":2}'],['puddle-walker-clean-times-walking-v6','{"leather":3}'],['puddle-walker-clean-times-walking-v7','{"leather":4}'],['puddle-walker-100m-best-v1','999999']]);
 const h=await harness({finish:true,storage});h.setClean(.99);h.click('again');h.walkToFinish();
 assert.equal(h.get('result-time-best').textContent,'New best time');assert.equal(h.has('result-score'),false);
 assert.ok(JSON.parse(storage.get('puddle-walker-clean-times-walking-v8')).leather>1);
 assert.equal(storage.get('puddle-walker-clean-times-walking-v7'),'{"leather":4}','earlier finish rules keep separate records');
 assert.equal(storage.get('puddle-walker-clean-times-walking-v6'),'{"leather":3}');assert.equal(storage.get('puddle-walker-clean-times-walking-v5'),'{"leather":2}');assert.equal(storage.get('puddle-walker-clean-times-v1'),'{"leather":1}');assert.equal(storage.get('puddle-walker-100m-best-v1'),'999999');
});


test('arriving home wipes both shoes and enters before results, with time and cleanliness banked',async()=>{
 const h=await harness({finish:true});h.click('start');h.walkToFinish();
 assert.equal(h.get('result').hidden,true);
 assert.equal(h.get('street').parentElement.dataset.phase,'arriving');
 const beforeHidden=h.get('street').dataset.feet;h.hide(true);h.tick(400);h.hide(false);assert.equal(h.get('street').dataset.feet,beforeHidden);assert.equal(h.get('result').hidden,true);
 const time=h.get('race-time').textContent,clean=h.get('goal-condition').textContent,stages=new Set();
 for(let n=0;n<400&&h.get('result').hidden;n++){
  h.tick();stages.add(h.get('street').dataset.arrival);
  assert.equal(h.get('race-time').textContent,time);assert.equal(h.get('goal-condition').textContent,clean);
  if(n%10===0){h.key(' ');h.key('f');h.pointer('pointerdown');h.pointer('pointerup');}
 }
 assert.ok(stages.has('wipe'));assert.ok(stages.has('enter'));
 const feet=JSON.parse(h.get('street').dataset.feet);
 assert.ok(feet.every(f=>f.y>model.ROAD.finish+300));
 assert.equal(h.get('result').hidden,false);
 assert.equal(h.get('street').parentElement.dataset.phase,'finished');
 assert.equal(h.get('race-time').textContent,time);
 h.click('again');h.walkToFinish();assert.equal(h.get('result').hidden,true);
 h.click('restart');h.tick(400);
 assert.equal(h.get('result').hidden,true);assert.equal(h.get('welcome').hidden,false);
 assert.equal(h.get('street').dataset.phase,'ready');
});

// The renderer supplies the visible cloth hit; selection must not turn a leg tap into a step.
test('tapping either leg selects its shoe and dragging keeps the original grip offset',async()=>{
 for(const side of [0,1]){
  const x=420+side*60;
  const h=await harness({dry:true,legHit:(px,py)=>Math.abs(px-x)<20&&py===600?side:null});h.click('start');
  h.pointer('pointerdown',x,600);h.pointer('pointerup',x,600);h.tick();
  assert.equal(h.get('street').dataset.activeFoot,String(side));assert.equal(Number(h.get('street').dataset.steps),0);
  h.pointer('pointerdown',x,600);h.pointer('pointermove',x,740);h.pointer('pointerup',x,740);h.tick(90);
  const feet=JSON.parse(h.get('street').dataset.feet);
  assert.equal(Number(h.get('street').dataset.steps),1);assert.ok(Math.abs(feet[side].y-(side?380:400))<1);
 }
});

 test('menus stop requesting game frames; start, replay and resize wake them',async()=>{
 const h=await harness({finish:true});h.tick();assert.equal(h.pendingFrame(),false);
 h.resize();assert.equal(h.pendingFrame(),true);h.tick();assert.equal(h.pendingFrame(),false);
 h.click('start');assert.equal(h.pendingFrame(),true);h.walkToFinish();h.tick(500);
 assert.equal(h.get('result').hidden,false);assert.equal(h.pendingFrame(),false);
 h.click('again');assert.equal(h.pendingFrame(),true);h.tick();assert.equal(h.get('street').dataset.phase,'walking');
 h.click('restart');h.tick();assert.equal(h.pendingFrame(),false);
 });
