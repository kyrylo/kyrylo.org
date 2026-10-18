import test from 'node:test';
import assert from 'node:assert/strict';
import {ROAD,STRETCH,createGame,indexStreet,takeStep,planStep,suggestStep,advance,condition,flowMultiplier,flowRemaining,scoreBreakdown,FLOW_WINDOW,MATERIALS} from '../model.js';

function clearStreet(start=700){const g=createGame('leather',42);g.phase='walking';g.street=indexStreet({seed:42,patches:[],obstacles:[],clutter:[]});g.feet.forEach((f,i)=>{f.y=start-i*20;f.bestY=f.y;});return g;}
function tick(g,seconds){for(let i=0;i<Math.ceil(seconds*120);i++)advance(g,1/120);}
function step(g,forward=175){const f=g.feet[g.active],front=Math.max(...g.feet.map(f=>f.y));assert.ok(takeStep(g,{x:f.x,y:front+forward}));for(let i=0;i<200&&g.mode!=='idle';i++)advance(g,1/120);assert.equal(g.mode,'idle');}

test('clean progress builds flow, waiting expires it, and pausing preserves it',()=>{
 const g=clearStreet();for(let i=0;i<5;i++)step(g);assert.equal(flowMultiplier(g),3);assert.equal(g.bestFlow,3);
 const points=g.stylePoints,remaining=flowRemaining(g);g.phase='paused';tick(g,10);assert.equal(flowRemaining(g),remaining);assert.equal(g.stylePoints,points);
 g.phase='walking';tick(g,FLOW_WINDOW+.1);assert.equal(flowMultiplier(g),1);assert.equal(flowRemaining(g),0);assert.equal(g.stylePoints,points,'earned points stay banked');
 step(g);assert.equal(flowMultiplier(g),1);
});
test('committing before flow expires protects the combo through the landing animation',()=>{
 const g=clearStreet();for(let i=0;i<4;i++)step(g);const before=g.flowDistance;
 tick(g,FLOW_WINDOW-.15);assert.ok(takeStep(g,suggestStep(g)));const held=flowRemaining(g);assert.ok(held>0);
 tick(g,.25);assert.equal(flowRemaining(g),held);assert.equal(g.flowDistance,before);
 for(let i=0;i<120&&g.mode!=='idle';i++)advance(g,1/120);
 assert.ok(g.flowDistance>before);assert.equal(flowMultiplier(g),3);
});
test('tiny steps do not build a multiplier or score faster than real forward progress',()=>{
 const short=clearStreet(),long=clearStreet();for(let i=0;i<14;i++)step(short,25);for(let i=0;i<2;i++)step(long,175);
 assert.equal(flowMultiplier(short),1);assert.equal(flowMultiplier(long),1);
 assert.ok(short.stylePoints<=long.stylePoints+5,`${short.stylePoints} vs ${long.stylePoints}`);
});
test('pixel rounding at a short forward step does not reject an otherwise legal placement',()=>{
 const g=clearStreet(),minimum=Math.max(...g.feet.map(f=>f.y))+24;
 const p=planStep(g,{x:420,y:minimum-.3});assert.equal(p.valid,true);assert.ok(p.y>=minimum);
 assert.equal(planStep(g,{x:420,y:minimum-1}).valid,false);
});
test('dirt on the supporting shoe breaks flow even when the next shoe lands dry',()=>{
 const g=clearStreet();for(let i=0;i<3;i++)step(g);assert.equal(flowMultiplier(g),2);
 const support=g.feet[1-g.active];g.street.patches=[{id:0,type:'water',x:support.x,y:support.y,rx:22,ry:45,depth:20,dirt:MATERIALS.water.dirt,seed:2,cos:1,sin:0}];indexStreet(g.street);
 step(g);assert.equal(flowMultiplier(g),1);assert.equal(g.chain,0);assert.ok(condition(g)<100);
});
test('short placements land with less impact and a quieter contact event',()=>{
 const soft=clearStreet(),long=clearStreet();step(soft,60);step(long,190);
 assert.ok(soft.impact<long.impact*.65);
 assert.ok(soft.events.find(e=>e.type==='land').force<long.events.find(e=>e.type==='land').force);
 assert.equal(condition(soft),100);assert.equal(condition(long),100);
});
test('a soft placement into the same shallow puddle produces less splash and dirt',()=>{
 const land=front=>{const g=clearStreet(1000);g.feet[1].y=front;
  g.street.patches=[{id:0,type:'water',x:420,y:1200,rx:23,ry:45,depth:14,dirt:.42,seed:2,cos:1,sin:0}];indexStreet(g.street);
  assert.ok(takeStep(g,{x:420,y:1200}));while(g.mode!=='idle')advance(g,1/120);return g;
 };
 const soft=land(1140),long=land(1000);
 assert.ok(soft.events.find(e=>e.type==='splash').intensity<long.events.find(e=>e.type==='splash').intensity*.65);
 assert.ok(condition(soft)>condition(long));
});
test('a genuinely tight dry landing earns more than an open-road landing',()=>{
 const close=clearStreet(),open=clearStreet();
 close.street.patches=[{id:0,type:'water',x:448,y:875,rx:7,ry:20,depth:10,dirt:MATERIALS.water.dirt,seed:2,cos:1,sin:0}];indexStreet(close.street);
 step(close);step(open);assert.equal(condition(close),100);
 assert.ok(close.events.some(e=>e.type==='clean'&&e.precision));assert.ok(close.stylePoints>open.stylePoints*1.8);
});
test('five clean stretches award once and the receipt includes every medal',()=>{
 const g=clearStreet(260);g.feet[1].y=240;
 while(g.phase==='walking')step(g);
 assert.equal(g.blocks.filter(b=>b.clean).length,5);assert.equal(g.blockPoints,2000);
 const b=scoreBreakdown(g);assert.equal(b.total,b.cleanliness+b.footwork+b.stretches+b.finish+b.material);
 const before=g.blockPoints;tick(g,10);assert.equal(g.blockPoints,before);
});
test('a missed stretch can be followed by earned medals without magically cleaning the shoes',()=>{
 const g=clearStreet(260);g.feet[1].y=240;
 g.feet.forEach(f=>{f.coverage=.03;f.stain.fill(.03);});
 while(g.phase==='walking')step(g);
 assert.equal(g.blocks[0].clean,false);assert.ok(g.blocks.slice(1).every(b=>b.clean));
 assert.equal(g.blockPoints,1600);assert.equal(condition(g),97);
});
test('teleporting or standing beyond a checkpoint cannot create medal points',()=>{
 const g=clearStreet(ROAD.finish-30);g.feet[1].y=ROAD.finish-50;step(g);
 assert.equal(g.blockPoints,0);
});
test('four brisk placements finish within 1.75 seconds while keeping clearance and precise landings',()=>{
 const g=clearStreet(1000);const started=g.time;
 for(let n=0;n<4;n++){
  const side=g.active,p=suggestStep(g);assert.ok(takeStep(g));let peak=0;
  for(let i=0;i<180&&g.mode!=='idle';i++){advance(g,1/120);peak=Math.max(peak,g.feet[side].z);}
  assert.equal(g.mode,'idle');assert.ok(peak>16&&peak<45,`natural foot clearance: ${peak}`);
  assert.ok(Math.hypot(g.feet[side].x-p.x,g.feet[side].y-p.y)<1);
 }
 assert.ok(g.time-started<1.75,`four steps took ${g.time-started}s`);assert.equal(condition(g),100);
});

test('medals wait for both feet to cross each 20m district boundary',()=>{
 const g=clearStreet(260);g.feet[1].y=240;
 assert.equal(STRETCH.metres,20);
 while(g.phase==='walking'){
  step(g);
  const metres=Math.min(...g.feet.map(f=>f.y))-ROAD.start;
  assert.equal(g.blockIndex,g.phase==='finished'?5:Math.min(5,Math.floor(metres/STRETCH.length)));
  if(metres<STRETCH.length)assert.equal(g.blockPoints,0);
 }
 assert.equal(g.blockPoints,2000);assert.equal(g.blocks.length,5);
});
