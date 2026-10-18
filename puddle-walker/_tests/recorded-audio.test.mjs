import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createAmbience,RECORDINGS} from '../ambience.js';
import {createGame} from '../model.js';
function fixture(load){
 const nodes=[],param=()=>({value:0,values:[],setValueAtTime(v){this.value=v;this.values.push(v);},linearRampToValueAtTime(v){this.value=v;this.values.push(v);},cancelScheduledValues(){}});
 const node=kind=>{const n={kind,gain:param(),frequency:param(),Q:param(),pan:param(),playbackRate:param(),starts:[],stops:[],connect(next){return next;},disconnect(){this.disconnected=true;},start(t){this.starts.push(t);},stop(t){this.stops.push(t);}};nodes.push(n);return n;};
 const ctx={currentTime:0,destination:{},createGain:()=>node('gain'),createBufferSource:()=>node('source'),createBiquadFilter:()=>node('filter'),createStereoPanner:()=>node('pan')};
 const clips=Object.fromEntries(Object.entries(RECORDINGS).map(([name,n])=>[name,Array.from({length:n},(_,i)=>({name:`${name}-${i}`,duration:.8}))]));
 let loads=0;const a=createAmbience({load:async c=>{loads++;return load?load(c):clips;}}),g=createGame('leather',321);g.phase='walking';
 return {a,g,ctx,nodes,clips,loads:()=>loads,hits:()=>nodes.filter(n=>n.kind==='source')};
}
async function ready(){const h=fixture();await h.a.prepare(h.ctx);h.a.update(h.ctx,h.g,true);return h;}
const land=(surface='asphalt',side=0,extra={})=>({type:'land',surface,side,...extra});
test('muted/menu/unlocked states allocate and fetch nothing; standing enabled creates no buzz or loop',async()=>{
 const h=fixture();h.a.update(h.ctx,h.g,false);h.g.phase='ready';h.a.update(h.ctx,h.g,true);h.g.phase='walking';h.a.update(null,h.g,true);
 assert.equal(h.nodes.length,0);assert.equal(h.loads(),0);
 await h.a.prepare(h.ctx);for(let i=0;i<200;i++){h.g.time=i;h.a.update(h.ctx,h.g,true);}
 assert.equal(h.loads(),1);assert.equal(h.hits().length,0);assert.ok(h.a.isActive());
});
test('each physical contact selects a recorded material and pans to the correct shoe',async()=>{
 for(const [surface,group] of [['dry','pavement'],['asphalt','pavement'],['stone','stone'],['gravel','gravel'],['water','water'],['metal','metal'],['mud','mud'],['clay','mud'],['cement','gravel'],['tar','pavement'],['algae','pavement'],['oil','pavement'],['gum','pavement'],['poop','mud']]){
  const h=await ready();h.a.update(h.ctx,h.g,true,[land(surface,1)]);assert.match(h.hits()[0].buffer.name,new RegExp('^'+group));assert.ok(h.nodes.filter(n=>n.kind==='pan').every(n=>n.pan.value>0));h.a.stop();
 }
 const h=await ready();h.a.update(h.ctx,h.g,true,[land()]);assert.ok(h.nodes.filter(n=>n.kind==='pan').every(n=>n.pan.value<0));
});
test('successive steps do not repeat a take and do not consume gameplay randomness',async()=>{
 const h=await ready(),before=JSON.stringify(h.g),names=[];
 for(let i=0;i<20;i++){h.a.update(h.ctx,h.g,true,[land()]);const last=h.hits().at(-1);names.push(last.buffer.name);last.onended();}
 assert.ok(names.every((n,i)=>!i||n!==names[i-1]));assert.equal(JSON.stringify(h.g),before);
});
test('mute, finish and a new walk stop every active voice; unloaded impacts are never replayed',async()=>{
 for(const action of ['mute','finish','new']){
  const h=await ready();h.a.update(h.ctx,h.g,true,[land('mud')]);const old=h.hits();
  if(action==='finish')h.g.phase='finished';if(action==='new'){h.g=createGame();h.g.phase='walking';}
  h.a.update(h.ctx,h.g,action!=='mute');assert.ok(old.every(n=>n.disconnected&&n.stops.length===2));assert.equal(h.a.status().voices,0);
 }
 let resolve;const h=fixture(()=>new Promise(r=>resolve=r));const pending=h.a.prepare(h.ctx);await Promise.resolve();
 h.a.update(h.ctx,h.g,true,[land()]);resolve(h.clips);await pending;h.a.update(h.ctx,h.g,true);assert.equal(h.hits().length,0);
});
test('mixed edge contacts, landing force and puddle depth preserve a subtle physical mix',async()=>{
 const play=async(force,depth,fraction)=>{const h=await ready();h.a.update(h.ctx,h.g,true,[land('water',0,{force,contacts:[{surface:'water',fraction,depth}]})]);return h;};
 const soft=await play(.5,3,1),firm=await play(1.4,3,1),deep=await play(1,24,1),edge=await play(1,24,.04);
 const volume=h=>Math.max(...h.nodes.filter(n=>n.kind==='gain').slice(1).flatMap(n=>n.gain.values));
 assert.ok(volume(firm)>volume(soft)*2);assert.ok(volume(edge)<volume(deep)*.3);assert.ok(deep.hits()[0].stops[0]>firm.hits()[0].stops[0]+.1);
});
test('splash deduplication, positional paper, impact and bounded overlapping voices',async()=>{
 const h=await ready(),splash={type:'splash',surface:'water',side:0,intensity:1};
 h.a.update(h.ctx,h.g,true,[land('water'),splash]);assert.equal(h.hits().length,1);
 h.a.update(h.ctx,h.g,true,[splash,{type:'paper',x:700,force:1},{type:'bump',side:1,obstacle:'barrier',force:1},{type:'wings',x:100}]);
 assert.equal(h.hits().length,5);for(let i=0;i<30;i++)h.a.update(h.ctx,h.g,true,[land('water')]);assert.equal(h.a.status().voices,12);h.a.stop();assert.equal(h.a.status().voices,0);
});
test('missing audio remains silent and optional; all retained recordings and credits ship',async()=>{
 const h=fixture(async()=>{throw Error('offline');});await h.a.prepare(h.ctx);h.a.update(h.ctx,h.g,true,[land()]);assert.equal(h.hits().length,0);
 for(const [group,n] of Object.entries(RECORDINGS))for(let i=0;i<n;i++)assert.ok(existsSync(new URL(`../assets/audio/${group}-${i}.mp3`,import.meta.url)));
 const source=readFileSync(new URL('../ambience.js',import.meta.url),'utf8');assert.doesNotMatch(source,/createOscillator|createBuffer\(|\.loop\s*=/);
 assert.match(readFileSync(new URL('../assets/audio/credits.txt',import.meta.url),'utf8'),/swuing[\s\S]*EminYILDIRIM[\s\S]*Eelke/);
});
test('automatic home steps and wipes play only during arrival, then stop at the result',async()=>{
 const h=await ready();h.g.phase='finished';h.g.arrival={done:false};
 h.a.update(h.ctx,h.g,true,[{type:'wipe',side:0},{type:'home-step',side:1,surface:'wood'}]);
 assert.match(h.hits()[0].buffer.name,/^paper/);assert.match(h.hits()[1].buffer.name,/^pavement/);
 h.g.arrival.done=true;h.a.update(h.ctx,h.g,true);assert.equal(h.a.status().voices,0);assert.equal(h.a.isActive(),false);
});
