import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import before from './unculled-model.mjs';
import * as after from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
const meaningful=g=>({phase:g.phase,mode:g.mode,steps:g.steps,active:g.active,score:after.score(g),clean:after.condition(g),blocks:g.blocks,feet:g.feet.map(f=>Object.fromEntries(Object.entries(f).filter(([k])=>!['contactPose','contactLoads','contactDepths','contactTypes','contactWaterDepth','heights'].includes(k))))});

test('optimized contact checks preserve every footprint preview across the entire street',()=>{
 for(const seed of [1,42,321,9182]){
  const a=before.createGame('leather',seed),b=after.createGame('leather',seed);a.phase=b.phase='walking';
  before.setShoeMask(a,SHOE_MASK);after.setShoeMask(b,SHOE_MASK);
  for(const s of a.street.sections)for(const x of [160,290,450,610,740]){
   for(const g of [a,b])g.feet.forEach((f,i)=>{f.x=x+(i?30:-30);f.y=s.y-150-i*30;});
   for(const dx of [-100,0,100])assert.deepEqual(after.planStep(b,{x:x+dx,y:s.y}),before.planStep(a,{x:x+dx,y:s.y}));
  }
 }
});
test('rotated wet and solid surfaces produce identical dirt, wetness, deposits and sounds',()=>{
 for(const type of ['water','mud','oil','gum','poop','gravel','metal','clay','tar','cement','algae'])for(const shoe of Object.keys(after.SHOES))for(const angle of [0,.31,1.2]){
  const games=[before,after].map(model=>{
   const g=model.createGame(shoe,321);g.phase='walking';model.setShoeMask(g,SHOE_MASK);
   const p={id:0,type,x:450,y:1000,rx:72,ry:25,cos:Math.cos(angle),sin:Math.sin(angle),depth:18,dirt:after.MATERIALS[type].dirt,seed:13};
   g.street=model.indexStreet({seed:321,patches:[p],obstacles:[],clutter:[]});
   g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:1000,angle:.2-i*.4}));return g;
  });
  for(let n=0;n<240;n++){before.advance(games[0],1/120);after.advance(games[1],1/120);}
  assert.deepEqual(meaningful(games[1]),meaningful(games[0]),`${type}, ${shoe}, ${angle}`);
  assert.deepEqual(games[1].events,games[0].events);
 }
});
test('saved walks keep identical placements and shoe wear through arrival at the mat',()=>{
 for(const r of JSON.parse(readFileSync(new URL('../_notes/designed-route-audit.json',import.meta.url)))){
  const games=[before,after].map(m=>{const g=m.createGame('leather',r.seed);g.phase='walking';return g;});
  for(const p of r.route){
   if(games[0].phase==='finished'){assert.equal(games[1].phase,'finished');break;}
   for(const [i,m] of [before,after].entries()){
    assert.ok(m.takeStep(games[i],p));for(let n=0;n<240&&games[i].mode!=='idle';n++)m.advance(games[i],1/120);
    games[i].events.length=0;
   }
  }
  assert.deepEqual(meaningful(games[1]),meaningful(games[0]),`seed ${r.seed}`);
 }
});
