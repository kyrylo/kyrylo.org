import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,planStep,suggestStep,takeStep,advance,condition,surfaceAt,ROAD} from '../model.js';
const settle=g=>{for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);assert.equal(g.mode,'idle');};

test('forks offer two real branches while the direct exit still needs precise footwork',()=>{
 const orders=new Set();
 for(let seed=1;seed<=60;seed++){
  const g=createGame('leather',seed);orders.add(g.street.sections.map(s=>s.kind+Math.round(s.gap)).join(','));
  const fork=g.street.sections.find(s=>s.kind==='fork');
  for(const x of fork.lanes)assert.ok(x>ROAD.left+50&&x<ROAD.right-50);
  let clean=0,dirty=0;
  for(let y=fork.y-180;y<=fork.y+200;y+=15)for(let dx=-42;dx<=42;dx+=14){
   const surface=surfaceAt(g,fork.gap+dx,y);if(surface.dirt>.1)dirty++;else clean++;
  }
  assert.ok(clean>25,`seed ${seed}: readable dry landing pockets remain`);
  assert.ok(dirty>25,`seed ${seed}: following the former clean lane now soils shoes`);
  for(const dx of [-32,32])for(const dy of [-35,0,35])
   assert.equal(surfaceAt(g,fork.lanes.find(x=>x!==fork.gap)+dx,fork.y+dy).dirt,0,'the alternative branch is genuinely usable');
 }
 assert.ok(orders.size>=4,'new streets change the approach and exit lines');
});
test('no fixed straight lane bypasses the street without water or a solid obstacle',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed);
  for(let x=150;x<=750;x+=20){
   let challenged=false;
   for(let y=650;y<ROAD.finish-200;y+=20){
    if(surfaceAt(g,x,y).depth>3||g.street.obstacles.some(o=>o.type==='car'&&Math.abs(x-o.x)<o.halfWidth+17&&Math.abs(y-o.y)<o.halfLength+30)){challenged=true;break;}
   }
   assert.ok(challenged,`seed ${seed}: x=${x} cannot bypass all encounters`);
  }
 }
});
test('careless straight-ahead walking cannot clear the course',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed);g.phase='walking';
  for(let i=0;i<200&&g.phase==='walking';i++){if(!takeStep(g,suggestStep(g)))break;settle(g);}
  assert.ok(g.phase!=='finished'||condition(g)<95,`seed ${seed}: straight walking cleared the course`);
 }
});
test('a careful stride crosses a narrow runnel while landing in it gets dirty',()=>{
 const cross=landingY=>{
  const g=createGame('leather',42);g.phase='walking';
  g.street=indexStreet({...g.street,obstacles:[],patches:[{id:0,type:'water',x:420,y:1090,rx:80,ry:24,depth:6,dirt:.42,seed:2,cos:1,sin:0}]});
  g.feet.forEach((f,i)=>{f.y=1000-i*20;f.bestY=f.y;});
  assert.ok(takeStep(g,{x:420,y:landingY}));settle(g);return g;
 };
 const over=cross(1180),inWater=cross(1090);
 assert.equal(condition(over),100);assert.equal(over.crossings,1);assert.ok(over.events.some(e=>e.type==='clean'&&e.crossed));
 assert.ok(condition(inWater)<99.9);assert.equal(inWater.crossings,0);assert.ok(over.stylePoints>0);
});
test('a crossing must start dry and cannot be earned by ordinary open-road steps',()=>{
 for(const wet of [false,true]){
  const g=createGame('leather',42);g.phase='walking';g.feet.forEach((f,i)=>{f.y=1000-i*20;f.bestY=f.y;});
  g.street=indexStreet({...g.street,obstacles:[],patches:wet?[{id:0,type:'water',x:420,y:1000,rx:45,ry:70,depth:8,dirt:.42,seed:2,cos:1,sin:0}]:[]});
  assert.ok(takeStep(g,{x:420,y:1180}));settle(g);assert.equal(g.crossings,0);
 }
});
test('manhole shortcut has metal contact over the water and lower grip than the detour',()=>{
 const g=createGame('leather',42),s=g.street.sections.find(s=>s.kind==='drain');
 const centre=surfaceAt(g,450,s.y),edge=surfaceAt(g,s.gap,s.y);
 assert.equal(centre.type,'metal');assert.equal(edge.type,'dry');assert.ok(centre.grip<edge.grip);
 assert.equal(surfaceAt(g,530,s.y).type,'water','missing the metal exposes the shoe to water');
});
test('access posts force a change of line instead of allowing two straight foot swings',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.kind==='slalom');g.phase='walking';
  g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y-150-i*20;});
  const blocked=[0,1].map(side=>{g.active=side;return planStep(g,{x:g.feet[side].x,y:s.y+40}).blocked;});
  assert.ok(blocked.some(Boolean),`seed ${seed}: steering must matter`);
 }
});
