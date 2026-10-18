import test from 'node:test';
import assert from 'node:assert/strict';
import before from './unculled-model.mjs';
import * as after from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';

// New cosmetic drag metadata does not change the underlying residue transfer.
const state=(model,g)=>({events:g.events,prints:g.prints.map(({force,slipX,slipY,...print})=>print),crumbs:g.crumbs,clean:model.condition(g),score:model.score(g),feet:g.feet.map(f=>Object.fromEntries(Object.entries(f).filter(([key])=>!['contactPose','contactLoads','contactDepths','contactTypes','contactWaterDepth','heights'].includes(key))))});
function fixture(model,{shoe='leather',side=0,y=1000,type,mask=SHOE_MASK}){
 const g=model.createGame(shoe,321);g.phase='walking';g.active=side;
 model.setShoeMask(g,mask);
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:y-130-i*10,bestY:y-130-i*10}));
 const angle=.6,p={id:0,type,x:420+side*60+12,y:y+20,rx:26,ry:13,cos:Math.cos(angle),sin:Math.sin(angle),depth:18,dirt:model.MATERIALS[type||'dry'].dirt,seed:13};
 g.street=model.indexStreet({seed:321,patches:type?[p]:[],obstacles:[],clutter:[]});return g;
}
function land(model,g,target){
 assert.ok(model.takeStep(g,target));
 for(let n=0;n<120;n++)model.advance(g,1/120);
 assert.equal(g.mode,'idle');assert.ok(g.events.some(e=>e.type==='land'));
}
test('sound blends and footprints stay exact at paving seams and rotated partial contacts',()=>{
 const cases=[...['water','mud','oil','gum','poop','gravel','metal'].map(type=>({y:1000,type})),
  ...[after.PAVEMENT.startEnd,after.PAVEMENT.finishStart].flatMap(seam=>[-70,-20,0,20,70].map(d=>({y:seam+d})))];
 for(const shoe of Object.keys(after.SHOES))for(const side of [0,1])for(const c of cases){
  const games=[before,after].map(model=>fixture(model,{...c,shoe,side}));
  for(const [i,model] of [before,after].entries())land(model,games[i],{x:420+side*60+(side?12:-12),y:c.y});
  assert.deepEqual(state(after,games[1]),state(before,games[0]),JSON.stringify({shoe,side,...c}));
 }
});
test('replacing a warmed asymmetric shoe silhouette updates both feet without stale contacts',()=>{
 const games=[before,after].map(model=>fixture(model,{type:'mud'}));
 const narrow=SHOE_MASK.map((on,i)=>on&&i%after.GRID.width>8);
 for(const [i,model] of [before,after].entries()){
  land(model,games[i],{x:420,y:1000});
  model.setShoeMask(games[i],narrow);
  land(model,games[i],{x:480,y:1080});
  model.setShoeMask(games[i],SHOE_MASK);
  land(model,games[i],{x:420,y:1160});
 }
 assert.deepEqual(state(after,games[1]),state(before,games[0]));
});
