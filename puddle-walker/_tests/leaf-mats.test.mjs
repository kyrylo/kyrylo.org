// Isolated encounter geometry; full weathered-course balance is checked separately.
import {createEncounterGame as createGame} from './encounter-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {indexStreet,surfaceAt,takeStep,planStep,advance,condition,setShoeMask} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {coverCourse} from './cover-course.mjs';

function fixture(seed=321,careful=true){
 const g=createGame('leather',seed),course=coverCourse(g,careful);
 g.phase='walking';g.active=course.active;setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:course.s.y-350,bestY:course.s.y-350}));
 return {g,...course};
}
function step(g,p){
 const plan=planStep(g,p);assert.ok(plan?.valid);assert.equal(plan.blocked,false);assert.ok(takeStep(g));
 for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);
 assert.equal(g.mode,'idle');assert.ok(!g.events.some(e=>e.type==='bump'));
}

test('leaf-clogged covers retain bare iron, and the gutter pile leaves the longer path clear',()=>{
 const mirrors=new Set();
 for(let seed=1;seed<=40;seed++){
  const {g,s,covers,targets}=fixture(seed);mirrors.add(s.gap>450);
  const mats=g.street.patches.filter(p=>p.leafMat);assert.equal(mats.length,3);
  assert.equal(mats.filter(p=>p.onCover).length,2);
  for(const cover of covers)assert.equal(surfaceAt(g,cover.x,cover.y).type,'metal');
  for(const p of mats)assert.equal(surfaceAt(g,p.x,p.y).type,'mud');
  assert.equal(surfaceAt(g,targets[1].x,targets[1].y).type,'metal');
  for(let i=1;i<s.line.length;i++)for(let t=0;t<=1;t+=.1){
   const a=s.line[i-1],b=s.line[i],x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
   for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,x+dx,y+dy).type,'dry');
  }
 }
 assert.equal(mirrors.size,2);
});
test('only material deposited on a cover overrides iron; the flooded ground underneath stays below it',()=>{
 const {g,covers}=fixture(),cover=covers[1],leaves=g.street.patches.find(p=>p.onCover&&p.y===cover.y);
 for(const onCover of [false,true]){
  const patch={...leaves,onCover};g.street=indexStreet({...g.street,patches:[cover,patch],obstacles:[]});
  assert.equal(surfaceAt(g,leaves.x,leaves.y).type,onCover?'mud':'metal');
  assert.equal(surfaceAt(g,cover.x,cover.y).type,'metal');
 }
});
test('the bare half rewards a placed foot while aiming at every cover centre soils the heel',()=>{
 for(let seed=1;seed<=40;seed++){
  for(const careful of [true,false]){
   const {g,s,targets}=fixture(seed,careful);
   for(const p of targets)step(g,p);
   assert.ok(g.feet.every(f=>f.y>s.y+330));
   if(careful)assert.ok(condition(g)>99.9,`seed ${seed}: bare iron ${condition(g)}`);
   else{
    assert.ok(condition(g)<99.8,`seed ${seed}: centre aim ${condition(g)}`);
    assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='mud')));
   }
  }
 }
});
test('wet leaf litter presses into a muddy footprint and transfers residue without splashing like a pond',()=>{
 const {g,targets}=fixture(321,false);
 step(g,targets[0]);g.events.length=0;g.rings.length=0;g.particles.length=0;
 step(g,targets[1]);
 assert.ok(g.groundContacts.some(m=>m.patch.leafMat&&m.kind==='mud'&&m.pieces.length));
 assert.ok(g.feet.some(f=>f.sole.some(z=>z.stainType==='mud'&&z.stain>0)));
 assert.ok(!g.events.some(e=>e.type==='splash'&&e.surface==='mud'));
 for(const p of targets.slice(2))step(g,p);
 assert.ok(g.prints.some(p=>p.zones.some(z=>z.type==='mud'&&z.dirt>0)));
});
test('a missed clean half can still reach the far bank without restarting or moving backwards',()=>{
 for(const seed of [1,42,321,9182])for(const offset of [-24,0,24]){
  const {g,s,targets}=fixture(seed,false);
  targets[1].x+=offset;
  for(const p of targets){const before=g.feet[g.active].y;step(g,p);assert.ok(g.feet[p.side].y>=before);}
  assert.ok(g.feet.every(f=>f.y>s.y+330));assert.ok(Number.isFinite(condition(g)));
 }
});
