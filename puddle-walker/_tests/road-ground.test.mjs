import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,surfaceAt,puddleDepth,planStep,takeStep,advance,condition,ROAD} from '../model.js';
import {createEncounterGame} from './encounter-fixture.mjs';
import {groundEdge} from '../road-ground.js';
const laneAt=(line,y)=>{let n=line.findIndex(p=>p.y>y);if(n<0)return line.at(-1).x;if(!n)return line[0].x;const a=line[n-1],b=line[n];return a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y);};
const step=(g,x,y)=>{const p=planStep(g,{x,y});assert.ok(p.valid);assert.ok(takeStep(g));for(let i=0;i<250&&g.mode!=='idle';i++)advance(g,1/120);assert.equal(g.mode,'idle');};
test('road damage uses the same jagged edge for contact, including translated districts and chunk boundaries',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed),fields=g.street.patches.filter(p=>p.groundField&&!p.dirtRoad);assert.equal(fields.length,15);
  for(const p of fields)for(let y=-p.ry+1;y<p.ry;y+=7){
   const edge=p.x+groundEdge(p,y);
   assert.equal(puddleDepth(p,edge-p.bankSide*.1,p.y+y),0);
   assert.ok(puddleDepth(p,edge+p.bankSide*.1,p.y+y)>0);
   const local=g.street.districts.find(d=>p.y>=d.offset&&p.y<d.offset+4000),q=local.street.patches.find(q=>q.groundField&&q.seed===p.seed);
   assert.ok(Math.abs(puddleDepth(p,edge+p.bankSide*12,p.y+y)-puddleDepth(q,edge+p.bankSide*12,p.y+y-local.offset))<1e-9);
  }
 }
});
test('the underlying exposed roadbed has no clean straight line but room for both feet across mirrored streets',()=>{
 const mirrored=new Set();
 for(let seed=1;seed<=32;seed++){
  const g=createEncounterGame('leather',seed),s=g.street.sections.find(s=>s.stage===2&&s.ground);mirrored.add(s.line[1].x<450);
  for(let y=s.line[0].y;y<=s.line.at(-1).y;y+=10){
   const x=laneAt(s.line,y);
   for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,x+dx,y+dy).type,'dry',`seed ${seed}: whole-pair pocket ${y}`);
  }
  for(let x=140;x<=760;x+=10){
   let dirty=false;for(let y=s.line[0].y;y<=s.line.at(-1).y;y+=15)for(const dx of [-30,30])dirty ||=surfaceAt(g,x+dx,y).type!=='dry';
   assert.ok(dirty,`seed ${seed}, lane ${x}: should require steering`);
  }
 }
 assert.equal(mirrored.size,2);
});
test('ordinary forward steps cross the broken asphalt and roadbed cleanly with either leading foot',()=>{
 for(let seed=1;seed<=16;seed++)for(const active of [0,1])for(const stage of [0,2]){
  const g=createEncounterGame('leather',seed),s=g.street.sections.find(s=>s.stage===stage&&s.ground),from=s.line[0].y-80,to=s.line.at(-1).y+90;
  g.phase='walking';g.active=active;g.feet.forEach((f,i)=>Object.assign(f,{x:s.line[0].x+(i?30:-30),y:from,bestY:from}));
  for(let y=from+65;y<=to;y+=65)step(g,laneAt(s.line,y)+(g.active?30:-30),y);
  assert.ok(g.feet.every(f=>f.y>s.line.at(-1).y-50));assert.equal(condition(g),100,`seed ${seed}, stage ${stage}, leading ${active}`);
  assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});
test('entering either damaged surface soils the shoe and presses the matching material',()=>{
 for(const stage of [2])for(const side of [-1,1]){
  const g=createGame('leather',321),s=g.street.sections.find(s=>s.stage===stage&&s.ground),p=g.street.patches.find(p=>p.groundField&&p.bankSide===side&&Math.abs(p.y-s.y)<400);
  const y=p.y,x=p.x+groundEdge(p,0)+side*28;g.phase='walking';g.active=side<0?0:1;
  g.feet.forEach((f,i)=>Object.assign(f,{x:x+(i-g.active)*60,y:y-100,bestY:y-100}));
  step(g,x,y);assert.ok(condition(g)<100);assert.ok(g.groundContacts.some(m=>m.kind===p.type));
 }
});
test('a misplaced foot on either excavation shoulder can return to the winding route without backing up',()=>{
 for(let seed=1;seed<=16;seed++)for(const side of [-1,1])for(const fraction of [.3,.6]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===2&&s.ground);
  const p=g.street.patches.find(p=>p.groundStyle==='subbase'&&p.bankSide===side),y=s.line[0].y+(s.line.at(-1).y-s.line[0].y)*fraction;
  g.phase='walking';g.active=side<0?0:1;
  g.feet.forEach((f,i)=>{const misplaced=i===g.active;Object.assign(f,{
   x:misplaced?p.x+groundEdge(p,y-p.y)+side*28:laneAt(s.line,y)+(i?30:-30),
   y:misplaced?y:y-50,bestY:misplaced?y:y-50
  });});
  assert.ok(surfaceAt(g,g.feet[g.active].x,y).type!=='dry');
  for(let next=y+45;next<=s.line.at(-1).y+100;next+=65)step(g,laneAt(s.line,next)+(g.active?30:-30),next);
  assert.ok(g.feet.every(f=>f.y>s.line.at(-1).y-50),`seed ${seed}, bank ${side}: should rejoin and finish the bend`);
  assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});
test('damage stays out of the paved entrance and destination',()=>{
 const g=createGame('leather',321);for(const y of [ROAD.start,ROAD.finish])for(let x=140;x<=760;x+=20)assert.equal(surfaceAt(g,x,y).type,'dry');
});
