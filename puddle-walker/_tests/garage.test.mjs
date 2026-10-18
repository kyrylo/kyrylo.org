import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,takeStep,advance,condition,surfaceAt,setShoeMask,puddleDepth} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {createEncounterGame} from './encounter-fixture.mjs';
import {garageCourse,wheelRutCourse} from './garage-course.mjs';

function setup(seed,direct,active){
 const g=createEncounterGame('leather',seed),course=garageCourse(g,direct);g.phase='walking';g.active=active;
 g.feet.forEach((f,i)=>Object.assign(f,{x:course.start.x+(i?30:-30),y:course.start.y,bestY:course.start.y}));
 return {g,...course};
}
function move(g,p){
 const foot=g.feet[g.active],before=foot.y;
 assert.ok(takeStep(g,{x:p.x+(g.active?30:-30),y:p.y}));
 for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);
 assert.equal(g.mode,'idle');assert.ok(foot.y>before,'each step advances');
 assert.ok(!g.events.some(e=>e.type==='bump'),'no clipped bumper');
}
test('the garage overflow has a clean three-step crossing with either foot leading',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const {g,section,targets,crossingSteps}=setup(seed,true,active);
  assert.equal(crossingSteps,3);
  for(const p of targets.slice(0,crossingSteps))move(g,p);
  assert.equal(condition(g),100,`seed ${seed}, foot ${active}`);
  assert.ok(g.feet.every(f=>f.y>section.y+60));
 }
});
test('the dry detour and precise crossing both join the next car and runnel cleanly',()=>{
 for(let seed=1;seed<=40;seed++)for(const direct of [true,false])for(const active of [0,1]){
  const {g,next,targets}=setup(seed,direct,active);
  for(const p of targets)move(g,p);
  assert.equal(condition(g),100,`seed ${seed}, direct ${direct}, foot ${active}`);
  assert.ok(g.feet.every(f=>f.y>next.y+260));
 }
});
test('careless placement in the overflow transfers oil, while either bank fits a whole pair',()=>{
 for(let seed=1;seed<=40;seed++){
  const {g,section:s}=setup(seed,true,0);
  for(const y of [s.y-65,s.y+65])for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,450+dx,y+dy).type,'dry');
  move(g,{x:450,y:s.y});
  assert.ok(condition(g)<99.99,'the sheen has real contamination');
  assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='oil')));
 }
});

test('the first car has one broken wheel rut connecting its tyre to the close corridor',()=>{
 const sides=new Set();
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),{section:s,patch:p}=wheelRutCourse(g),car=g.street.parking.find(c=>Math.abs(c.y-s.y)<15);
  sides.add(car.side);assert.equal(g.street.patches.filter(p=>p.wheelRubble).length,1);
  assert.equal(p.y,car.y+275);assert.ok(p.rx>90&&p.ry<30);
  const tyre=car.x+(car.side?-1:1)*165;
  assert.ok(puddleDepth(p,tyre,p.y)>0,'broken asphalt meets the tyre');
  for(const dx of [-44,0,44])assert.equal(surfaceAt(g,s.gap+dx,p.y).type,'gravel');
  for(const dy of [-85,80])for(const dx of [-44,0,44])for(const end of [-31,0,31])
   assert.equal(surfaceAt(g,s.gap+dx,p.y+dy+end).type,'dry','each bank fits both shoes');
 }
 assert.equal(sides.size,2);
});
test('both shoes clear the broken wheel rut with two ordinary strides on either mirrored street',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createGame('leather',seed),course=wheelRutCourse(g);g.phase='walking';g.active=active;setShoeMask(g,SHOE_MASK);
  g.feet.forEach((f,i)=>Object.assign(f,{x:course.start.x+(i?30:-30),y:course.start.y,bestY:course.start.y}));
  for(const p of course.targets)move(g,p);
  assert.equal(condition(g),100,`seed ${seed}, leading foot ${active}`);
  assert.ok(g.feet.every(f=>f.y>course.patch.y+65));
 }
});
test('landing in the broken rut scatters grit and leaves dirty tread, with a forward recovery',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createGame('leather',seed),course=wheelRutCourse(g);g.phase='walking';g.active=active;setShoeMask(g,SHOE_MASK);
  g.feet.forEach((f,i)=>Object.assign(f,{x:course.start.x+(i?30:-30),y:course.start.y,bestY:course.start.y}));
  move(g,{x:course.start.x,y:course.patch.y});
  assert.ok(condition(g)<99.8);assert.ok(g.groundContacts.some(m=>m.patch.wheelRubble&&m.pieces.length));
  assert.ok(g.feet[active].sole.some(z=>z.stainType==='gravel'&&z.stain>0));
  for(const p of course.targets)move(g,p);
  assert.ok(g.feet.every(f=>f.y>course.patch.y+65));
  assert.ok(g.prints.some(p=>p.zones.some(z=>z.type==='gravel'&&z.dirt>0)));
 }
});
