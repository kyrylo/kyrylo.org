import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,selectFoot,planStep,takeStep,advance,progress,score,condition,recoveryBarrier,recoverFooting,SHOES,ROAD,GATHER_REACH,MATERIALS} from '../model.js';
import {stageBarrierTrap} from './barrier-trap.mjs';
function settle(g){for(let i=0;i<300&&g.mode!=='idle';i++)advance(g,1/120);assert.equal(g.mode,'idle');}
function move(g,side,x,y){if(g.active!==side)assert.ok(selectFoot(g,side));assert.ok(takeStep(g,{x,y}),JSON.stringify({side,x,y,feet:g.feet.map(f=>[f.x,f.y]),preview:g.preview}));settle(g);}
function empty(){const g=createGame('leather',321);g.phase='walking';g.street=indexStreet({...g.street,patches:[],obstacles:[]});return g;}

test('Make room recovers real corner and middle collisions at every repair rail',()=>{
 let runs=0;
 for(const seed of [1,42,321,9182])for(const shoe of Object.keys(SHOES)){
  const source=createGame(shoe,seed);
  for(const rail of source.street.obstacles.filter(o=>o.type==='barrier'))for(const kind of ['corner','middle']){
   const g=createGame(shoe,seed);stageBarrierTrap(g,rail,kind);
   assert.ok(g.events.some(e=>e.type==='bump'));assert.ok(recoveryBarrier(g));
   const before=progress(g),points=g.stylePoints,blocks=g.blockPoints,street=g.street;
   g.events.length=0;let attempts=0;
   while(recoveryBarrier(g)&&attempts++<10){
    assert.ok(recoverFooting(g),`seed ${seed}, ${shoe}, ${kind}, rail ${rail.y}`);
    assert.equal(g.mode,'flight');
    for(let n=0;n<250&&g.mode!=='idle';n++){
     advance(g,1/120);assert.ok(progress(g)>=before-1e-9);
     assert.ok(g.feet.some(f=>f.z===0),'one foot stays planted');
     assert.ok(g.feet[0].x+26.9<=g.feet[1].x);
    }
   }
   assert.ok(attempts<=6);assert.equal(recoveryBarrier(g),null);assert.equal(g.street,street);
   assert.equal(g.stylePoints,points);assert.equal(g.blockPoints,blocks);
   assert.ok(!g.events.some(e=>e.type==='bump'),'recovery must clear the real collision shape');
   for(let i=0;i<4;i++)move(g,g.active,g.feet[g.active].x,Math.max(...g.feet.map(f=>f.y))+150);
   assert.ok(g.feet.every(f=>f.y>rail.y+rail.halfLength+80));runs++;
  }
 }
 assert.equal(runs,144);
});
test('Make room preserves contamination and still collects dirt at its landing',()=>{
 const g=createGame('leather',321),rail=g.street.obstacles.find(o=>o.type==='barrier');stageBarrierTrap(g,rail);
 for(const f of g.feet){f.stain.fill(.2);f.coverage=.156;f.sole.forEach(s=>s.stain=.2);}
 const before=condition(g),masks=g.feet.map(f=>f.stain),time=g.time;
 g.street=indexStreet({...g.street,patches:[{id:0,type:'mud',x:450,y:rail.y,rx:500,ry:400,depth:8,dirt:MATERIALS.mud.dirt,seed:2,cos:1,sin:0}]});
 assert.ok(recoverFooting(g));settle(g);
 assert.ok(g.time>time);assert.ok(condition(g)<before);
 assert.ok(g.feet.every((f,i)=>f.stain===masks[i]));
});
test('diagonal barrier approaches cannot leave recovery short of its minimum sidestep',()=>{
 for(const shoe of Object.keys(SHOES))for(const rail of createGame(shoe,321).street.obstacles.filter(o=>o.type==='barrier')){
  const g=createGame(shoe,321);g.phase='walking';
  const sign=rail.x<450?1:-1,edge=rail.x+sign*rail.halfWidth;
  g.feet.forEach((f,i)=>{f.x=edge-sign*125+(i?30:-30);f.y=rail.y-rail.halfLength-110-i*20;f.bestY=f.y;});
  for(let i=0;i<3;i++){assert.ok(takeStep(g,{x:g.feet[g.active].x-90,y:rail.y+200}));settle(g);}
  assert.ok(recoveryBarrier(g));let placements=0;
  while(recoveryBarrier(g)&&placements++<10){
   assert.ok(recoverFooting(g),`${shoe}, rail ${rail.y}, placement ${placements}`);settle(g);
  }
  assert.equal(recoveryBarrier(g),null);assert.ok(placements<=7);
  for(let i=0;i<4;i++)move(g,g.active,g.feet[g.active].x,Math.max(...g.feet.map(f=>f.y))+150);
  assert.ok(g.feet.every(f=>f.y>rail.y+rail.halfLength+80));
 }
});
test('recovery is unavailable away from a barrier, during a swing, or outside a walk',()=>{
 const g=empty();assert.equal(recoverFooting(g),false);
 const stuck=createGame('leather',321),rail=stuck.street.obstacles.find(o=>o.type==='barrier');stageBarrierTrap(stuck,rail);
 for(const phase of ['ready','paused','finished']){stuck.phase=phase;assert.equal(recoveryBarrier(stuck),null);assert.equal(recoverFooting(stuck),false);}
 stuck.phase='walking';assert.ok(recoverFooting(stuck));assert.equal(recoverFooting(stuck),false);
});

test('switching weight preserves the feet, dirt, progress, score',()=>{
 const g=empty();g.feet[0].coverage=.07;
 const before=JSON.stringify(g.feet),points=score(g),distance=progress(g);
 for(let i=0;i<20;i++)assert.ok(selectFoot(g));
 assert.equal(JSON.stringify(g.feet),before);assert.equal(score(g),points);assert.equal(progress(g),distance);assert.equal(g.steps,0);
 for(const phase of ['ready','paused','finished']){g.phase=phase;assert.equal(selectFoot(g),false);}
 g.phase='walking';takeStep(g,{x:420,y:410});assert.equal(selectFoot(g),false);settle(g);assert.ok(selectFoot(g));
});
test('small sidesteps work without allowing backward movement or stationary score farming',()=>{
 const g=empty(),before=progress(g),points=score(g);
 move(g,0,408,260);move(g,1,492,240);
 assert.equal(progress(g),before);assert.equal(score(g),points);
 assert.equal(planStep(g,{x:g.feet[g.active].x,y:g.feet[g.active].y}).valid,false);
 assert.equal(planStep(g,{x:390,y:g.feet[g.active].y-1}).valid,false);
});
test('a curb-side foot trapped behind a car can shift weight and escape in either direction',()=>{
 for(const mirror of [false,true])for(const shoe of ['leather','canvas','knit']){
  const g=createGame(shoe,321);g.phase='walking';
  const car=g.street.obstacles.find(o=>o.type==='car');
  // Use the real car dimensions, mirrored against the other curb.
  const x=v=>mirror?900-v:v;
  g.street=indexStreet({...g.street,patches:[],obstacles:[{...car,x:x(car.x)}]});
  const near=ROAD.left+SHOES[shoe].width,y=car.y-car.halfLength-34;
  for(const f of g.feet){f.x=x(near+(mirror?1-f.side:f.side)*27);f.y=y;f.bestY=y;}
  const trapped=mirror?1:0,free=1-trapped;g.active=trapped;
  assert.equal(planStep(g,{x:g.feet[trapped].x,y:y+150}).blocked,true);
  assert.equal(planStep(g,{x:x(300),y}).valid,false,'the planted partner leaves no sideways room');
  const before=progress(g);move(g,free,x(285),y);move(g,trapped,x(250),y);
  move(g,free,x(285),y+170);move(g,trapped,x(250),y+290);
  assert.ok(progress(g)>before);assert.ok(g.feet.every(f=>f.y>car.y-car.halfLength+60));
  assert.ok(g.feet[0].x+26.9<=g.feet[1].x);
 }
});
test('every generated repair barrier has a playable sideways recovery for all shoe types',()=>{
 for(const seed of [1,42,321,9182])for(const shoe of ['leather','canvas','knit']){
  const source=createGame(shoe,seed);
  for(const rail of source.street.obstacles.filter(o=>o.type==='barrier')){
   const g=createGame(shoe,seed);g.phase='walking';
   const right=rail.x<450,edge=rail.x+(right?rail.halfWidth:-rail.halfWidth),sign=right?1:-1,outer=right?1:0,inner=1-outer;
   const y=rail.y-rail.halfLength-SHOES[shoe].length*.32-SHOES[shoe].width*.48-2;
   g.feet[outer].x=edge-sign*35;g.feet[inner].x=edge-sign*62;
   for(const f of g.feet){f.y=y;f.bestY=y;}g.active=inner;
   const before=progress(g);move(g,outer,edge+sign*70,y);move(g,inner,edge+sign*35,y);
   move(g,outer,edge+sign*70,y+120);move(g,inner,edge+sign*35,y+150);
   assert.ok(progress(g)>before,`seed ${seed}, ${shoe}, barrier at ${rail.y}`);
   assert.ok(g.feet.every(f=>f.y>rail.y+rail.halfLength));
  }
 }
});

test('a fully stretched stance at either end of every repair rail can gather and escape with ordinary steps',()=>{
 for(const seed of [0,1,42,321,9182,100023,2147483647,4294967295])for(const shoe of Object.keys(SHOES)){
  const source=createGame(shoe,seed);
  for(const rail of source.street.obstacles.filter(o=>o.type==='barrier')){
   const g=createGame(shoe,seed);g.phase='walking';
   const sign=rail.x<450?1:-1,edge=rail.x+sign*rail.halfWidth,free=sign===1?1:0,trapped=1-free;
   // Reach this awkward stance through real colliding steps, not teleports into a rail.
   g.feet.forEach(f=>{f.x=edge+sign*(f.side===free?20:-10);f.y=rail.y-rail.halfLength-100;f.bestY=f.y;});
   move(g,trapped,g.feet[trapped].x,rail.y+100);
   move(g,free,g.feet[free].x,rail.y+500);
   assert.ok(g.feet[free].y-g.feet[trapped].y>210);
   assert.equal(planStep(g,{x:g.feet[trapped].x,y:rail.y+500}).blocked,true);
   selectFoot(g,free);
   assert.equal(planStep(g,{x:edge+sign*80,y:g.feet[free].y}).valid,false,'a stretched leg has no sideways reach left');
   const before=progress(g),points=g.stylePoints;
   const p=planStep(g,{x:edge+sign*80,y:g.feet[free].y-90});
   assert.ok(p.gathering&&p.valid&&!p.blocked,`seed ${seed}, ${shoe}, rail ${rail.y}`);
   assert.ok(takeStep(g));
   for(let n=0;n<240&&g.mode!=='idle';n++){advance(g,1/120);assert.ok(progress(g)>=before-1e-10);}
   assert.equal(g.mode,'idle');assert.equal(g.stylePoints,points);
   move(g,trapped,edge+sign*45,g.feet[trapped].y);
   move(g,trapped,edge+sign*45,rail.y+230);
   move(g,free,edge+sign*80,rail.y+350);
   assert.ok(g.feet.every(f=>f.y>rail.y+rail.halfLength+70));
   assert.ok(progress(g)>before);assert.ok(g.feet[0].x+26.9<=g.feet[1].x);
  }
 }
});
test('gathering is short, cannot move behind the planted foot and cannot ratchet the walk backwards',()=>{
 const g=empty();g.feet[0].y=400;g.feet[1].y=300;g.feet.forEach(f=>f.bestY=f.y);
 const before=progress(g);
 assert.equal(planStep(g,{x:420,y:299}).valid,false);
 assert.equal(planStep(g,{x:420,y:400-GATHER_REACH-1}).valid,false);
 move(g,0,420,300);assert.equal(progress(g),before);
 for(let n=0;n<10;n++){
  selectFoot(g);assert.equal(planStep(g,{x:g.feet[g.active].x,y:299}).valid,false);
 }
 const stretched=empty();stretched.feet[0].y=460;stretched.feet[1].y=260;
 assert.equal(planStep(stretched,{x:420,y:339}).valid,false);
 assert.ok(planStep(stretched,{x:420,y:340}).valid);
});
test('gathering and re-extending the same foot cannot farm points, flow, medals',()=>{
 const g=empty();g.feet.forEach((f,i)=>{f.y=1000-i*100;f.bestY=f.y;});
 const points=score(g),before=progress(g);
 for(let n=0;n<12;n++){move(g,0,420,900);move(g,0,420,1000);}
 assert.equal(score(g),points);assert.equal(progress(g),before);assert.equal(g.flowDistance,0);assert.equal(g.blockPoints,0);
});
test('a gathering shoe still collides with furniture and gets dirty on its new landing',()=>{
 const g=empty();g.feet[0].y=1100;g.feet[1].y=1000;g.feet.forEach(f=>f.bestY=f.y);
 g.street=indexStreet({...g.street,patches:[{id:0,type:'mud',x:420,y:1010,rx:35,ry:45,depth:12,dirt:MATERIALS.mud.dirt,seed:2,cos:1,sin:0}]});
 move(g,0,420,1010);assert.ok(g.feet[0].coverage>0);assert.ok(g.prints.length>0||g.feet[0].sole.some(s=>s.dirt>0));
 const blocked=empty();blocked.feet[0].y=1100;blocked.feet[1].y=1000;blocked.feet.forEach(f=>f.bestY=f.y);
 blocked.street=indexStreet({...blocked.street,obstacles:[{id:0,type:'bollard',solid:true,x:420,y:1040,r:17,height:100}]});
 move(blocked,0,420,1000);assert.ok(blocked.events.some(e=>e.type==='bump'));assert.ok(blocked.feet[0].y>1070);
});
test('slippery gathering landings never slide behind the planted foot or lose progress',()=>{
 for(const shoe of Object.keys(SHOES)){
  const g=createGame(shoe,321);g.phase='walking';g.feet[0].y=1100;g.feet[1].y=1000;g.feet.forEach(f=>f.bestY=f.y);
  g.street=indexStreet({...g.street,obstacles:[],patches:[{id:0,type:'oil',x:420,y:1000,rx:80,ry:140,depth:5,dirt:MATERIALS.oil.dirt,seed:2,cos:1,sin:0}]});
  const before=progress(g);assert.ok(takeStep(g,{x:420,y:1000}));
  for(let n=0;n<240&&g.mode!=='idle';n++){advance(g,1/120);assert.ok(progress(g)>=before);}
  assert.equal(g.mode,'idle');assert.ok(g.feet[0].y>=1000);
 }
});
