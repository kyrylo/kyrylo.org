import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,MATERIALS,takeStep,advance,condition,setShoeMask,shoeHeights,ROAD,surfaceAt} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
const types=['clay','tar','cement','algae'];
function field(type){
 const g=createGame('leather',321);g.phase='walking';setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:900,bestY:900,angle:0}));
 const depth=type==='tar'?3.5:8;
 g.street=indexStreet({...g.street,obstacles:[],patches:[{id:0,type,x:450,y:1050,rx:350,ry:250,depth,cos:1,sin:0,seed:4}]});
 return g;
}
function step(g,x=420,y=1040){
 assert.ok(takeStep(g,{x,y}));for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);assert.equal(g.mode,'idle');
}
test('each district contaminates the surviving route with its own material, without adding solid traps',()=>{
 for(const seed of [1,42,321,9182,77,65535]){
  const g=createGame('leather',seed),spills=g.street.patches.filter(p=>p.contaminant);
  assert.equal(spills.length,65);
  for(const type of types)assert.ok(spills.some(p=>p.type===type));
  for(const p of spills){
   assert.ok(!p.solid);assert.ok(p.flatResidue&&p.surfaceFilm);
   assert.ok(p.y>540&&p.y<ROAD.finish-120);
  }
  for(const b of g.street.bins.values())assert.ok(b.patches.length<25,'local contact queries stay bounded');
 }
});
test('new contaminants leave their own stains, raised residue, impressions and surface audio events',()=>{
 for(const type of types){
  const g=field(type);step(g);
  assert.ok(condition(g)<90,`${type}: a direct landing must matter`);
  const f=g.feet[0];assert.ok(f.deposits.some(n=>n>0),type);
  assert.ok(f.sole.some(z=>z.stainType===type&&z.stain>0));
  assert.ok(g.groundContacts.some(p=>p.kind===type));
  assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface===type)));
  assert.ok([...f.stain,...f.deposits,...f.tint].every(Number.isFinite));
 }
});
test('clay and cement shed real crumbs, tar clings, and algae changes landing grip',()=>{
 const games=Object.fromEntries(types.map(type=>{const g=field(type);step(g);return [type,g];}));
 assert.ok(games.tar.feet[0].sticky>.8);
 assert.ok(MATERIALS.algae.grip<MATERIALS.oil.grip);
 for(const type of ['clay','cement'])assert.ok(games[type].groundContacts.some(p=>p.pieces.length>0));
 assert.ok(games.tar.groundContacts.every(p=>!p.pieces.length));
 const shifts=Object.fromEntries(Object.entries(games).map(([type,g])=>[type,Math.hypot(g.groundContacts[0].slipX,g.groundContacts[0].slipY)]));
 assert.ok(shifts.algae>shifts.cement,JSON.stringify(shifts));
});
test('stronger pigment respects the contact height and never paints the laces from the ground',()=>{
 for(const type of types){
  const g=field(type),f=g.feet[0];f.y=1040;f.bestY=f.y;
  for(let n=0;n<120;n++)advance(g,1/120);
  const heights=shoeHeights(g,f),limit=type==='tar'?3:8;
  for(let i=0;i<f.stain.length;i++)if(heights[i]>limit)assert.equal(f.stain[i],0,`${type}/${i}`);
 }
});
test('after a bad landing all four contaminants allow forward recovery and leave coloured footprints',()=>{
 for(const type of types){
  const g=field(type);step(g);
  const old=condition(g),before=g.feet[0].y;
  g.street=indexStreet({...g.street,patches:[]});g.feet.forEach(f=>f.contactPose='');
  step(g,480,1160);step(g,420,1280);
  assert.ok(g.feet.every(f=>f.y>before));assert.ok(!g.events.some(e=>e.type==='bump'));
  assert.ok(g.prints.some(p=>p.zones.some(z=>z.type===type&&z.dirt>.1)),type);
  assert.ok(condition(g)<=old,'leaving a spill does not reset the score');
  assert.equal(surfaceAt(g,420,1280).type,'dry');
 }
});
