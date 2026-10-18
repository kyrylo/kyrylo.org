import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,surfaceAt,puddleDepth,planStep,takeStep,advance,condition,setShoeMask} from '../model.js';
import {dirtRoadEdge} from '../road-ground.js';
import {SHOE_MASK} from '../sprite-data.js';
import {stoneCourse} from './stone-course.mjs';
import {createEncounterGame} from './encounter-fixture.mjs';
function fixture(seed=321,active=0,isolated=false){
 const g=(isolated?createEncounterGame:createGame)('leather',seed);g.phase='walking';g.active=active;setShoeMask(g,SHOE_MASK);
 const s=g.street.sections.find(s=>s.kind==='stepping-stones');
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:s.y-260,bestY:s.y-260}));return g;
}
function step(g,p){
 const plan=planStep(g,p);assert.ok(plan?.valid,JSON.stringify({p,plan}));assert.ok(!plan.blocked);assert.ok(takeStep(g));
 for(let n=0;n<240&&g.mode!=='idle';n++){advance(g,1/120);assert.ok(Number.isFinite(condition(g)));}
 assert.equal(g.mode,'idle');assert.ok(!g.events.some(e=>e.type==='bump'));return plan;
}
test('the whole shoe can cross mirrored stepping stones with either foot leading',()=>{
 const sides=new Set();
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=fixture(seed,active,true),{s,stones,targets}=stoneCourse(g);sides.add(stones[1].x>450);assert.equal(stones.length,4);
  for(const p of targets){assert.equal(g.active,p.side);const f=g.feet[g.active],before=f.y;step(g,p);assert.ok(f.y>=before);assert.ok(condition(g)>99.999,`seed ${seed}, foot ${active}: ${condition(g)}`);}
  assert.ok(g.feet.every(f=>f.y>s.y+330));assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='stone')));
  assert.equal(g.groundContacts.length,0,'clean rocks do not produce mud impressions');
 }
 assert.equal(sides.size,2);
});
test('the road is physically muddy across its width and has no straight clean lane',()=>{
 for(const seed of [1,42,321,9182]){
  const g=fixture(seed),p=g.street.patches.find(p=>p.dirtRoad),s=g.street.sections.find(s=>s.kind==='stepping-stones');
  for(let x=122;x<=778;x+=4){
   let dirty=0;for(let y=s.y-90;y<=s.y+180;y+=5)dirty+=surfaceAt(g,x,y).type==='mud';
   assert.ok(dirty>10,`seed ${seed}, x ${x}: no straight bypass`);
  }
  const district=g.street.districts[3],local=district.street.patches.find(q=>q.dirtRoad);
  for(let x=-p.rx+1;x<p.rx;x+=3)for(const end of [0,1]){
   const y=p.y+dirtRoadEdge(p,x,end),inside=end?-.1:.1;
   assert.ok(Math.abs(y-p.y)<p.ry,'the visible silt fan fits its spatial contact bounds');
   assert.equal(puddleDepth(p,p.x+x,y-inside),0);assert.ok(puddleDepth(p,p.x+x,y+inside)>0);
   assert.ok(Math.abs(puddleDepth(p,p.x+x,y+inside)-puddleDepth(local,p.x+x,y+inside-district.offset))<1e-8);
  }
 }
});
test('the thin edge of deposited silt soils a shoe less than the deep crossing',()=>{
 const clean=[];
 for(const inset of [4,60]){
  const g=fixture(),p=g.street.patches.find(p=>p.dirtRoad),x=210,y=p.y+dirtRoadEdge(p,x-p.x,0)+inset;
  g.street=indexStreet({...g.street,patches:[p],obstacles:[]});
  g.feet.forEach((f,i)=>Object.assign(f,{x:x+i*60,y:y-120,bestY:y-120}));
  step(g,{x,y});clean.push(condition(g));
  assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='mud')));
 }
 assert.ok(clean[0]<100,'even a thin silt fringe has real shoe contact');
 assert.ok(clean[0]>clean[1],'a shallow edge leaves less dirt than the full muddy bed');
});
test('the old straight stance shortcut gets muddy but still has a forward exit',()=>{
 for(const seed of [1,42,321,9182])for(const active of [0,1]){
  const g=fixture(seed,active),{s,stones,targets}=stoneCourse(g),at=x=>stones[1].x<450?900-x:x;
  // Follow the entrance, then keep the old narrow stance and reach for the
  // far bank. This used to skip the only turn without touching any mud.
  for(const p of targets.slice(0,-5))step(g,p);
  for(const [x,y] of [[475,75],[505,270],[475,375]])step(g,{x:at(x),y:s.y+y});
  assert.ok(condition(g)<99.9,`seed ${seed}, foot ${active}: the shortcut must cost cleanliness`);
  assert.ok(g.feet.every(f=>f.y>s.y+240),'a bad choice never traps the player');
 }
});
test('missing a stone makes mud lumps, stays finite, and allows forward recovery with dirty prints on stones',()=>{
 const g=fixture(),{targets}=stoneCourse(g);
 for(const p of targets.slice(0,2))step(g,p);
 step(g,{x:340,y:targets[2].y});assert.ok(condition(g)<99.9);assert.ok(g.groundContacts.some(m=>m.kind==='mud'&&m.pieces.length));
 assert.ok(g.feet.some(f=>f.deposits.some(n=>n>0)),'mud has thickness as well as colour');
 for(const p of targets.slice(3))step(g,p);
 assert.ok(g.prints.some(p=>surfaceAt(g,p.x,p.y).type==='stone'&&p.zones.some(z=>z.type==='mud'&&z.dirt>.1)));
 assert.ok(g.feet.every(f=>f.y>targets.at(-1).y-40));
});
test('an overhanging sole picks up mud even when the shoe centre is on the stone',()=>{
 const g=fixture(),{targets}=stoneCourse(g);for(const p of targets.slice(0,2))step(g,p);
 const target={x:targets[2].x-32,y:targets[2].y};assert.equal(surfaceAt(g,target.x,target.y).type,'stone');
 const p=step(g,target);assert.ok(p.wetFraction>0&&p.wetFraction<.7);assert.ok(condition(g)<100);
 assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='stone')&&e.contacts.some(c=>c.surface==='mud')));
});
test('a mistaken walk through the dirt road always has a forward exit',()=>{
 for(const seed of [1,42,321,9182])for(const centre of [180,330,450,570,720])for(const active of [0,1]){
  const g=fixture(seed,active),s=g.street.sections.find(s=>s.kind==='stepping-stones');
  g.feet.forEach((f,i)=>Object.assign(f,{x:centre+(i?30:-30)}));
  for(let y=s.y-180;y<s.y+380;y+=80)step(g,{x:centre+(g.active?30:-30),y});
  assert.ok(g.feet.every(f=>f.y>s.y+150));assert.ok(condition(g)<100);
 }
});
