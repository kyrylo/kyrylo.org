import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,surfaceAt,ROAD,PAVEMENT,planStep,takeStep,advance,condition,setShoeMask} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import reference from './unculled-model.mjs';
import {groundEdge} from '../road-ground.js';

test('failed shoulders cover most of every district, leaving the doorstep aprons clean',()=>{
 for(const seed of [1,42,321,9182,77,65535]){
  const g=createGame('leather',seed);
  assert.equal(g.street.patches.filter(p=>p.roadDecay).length,10);
  for(let stage=0;stage<5;stage++){
   let dirty=0,total=0;
   for(let y=640+stage*4000;y<Math.min(ROAD.finish-200,4240+stage*4000);y+=40)for(let x=130;x<780;x+=24){
    if(g.street.obstacles.some(o=>o.type==='car'&&Math.abs(x-o.x)<o.halfWidth&&Math.abs(y-o.y)<o.halfLength))continue;
    total++;if(surfaceAt(g,x,y).dirt>.1)dirty++;
   }
   assert.ok(dirty/total>.64&&dirty/total<.8,`${seed}/${stage}: dirt covers ${dirty/total}`);
  }
  for(const y of [PAVEMENT.startEnd-50,PAVEMENT.finishStart+50])for(let x=150;x<=750;x+=30)assert.equal(surfaceAt(g,x,y).type,'dry');
 }
});

test('the old straight parking bypass is muddy but still walkable on either side of the street',()=>{
 for(const seed of [1,42,321,9182,13,77]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.parkingPattern==='squeeze');
  g.phase='walking';setShoeMask(g,SHOE_MASK);
  g.feet.forEach((f,i)=>Object.assign(f,{x:s.lanes[1]+(i?30:-30),y:s.y-220-i*20,bestY:s.y-220-i*20}));
  for(let n=0;n<7;n++){
   assert.ok(takeStep(g,{x:s.lanes[1]+(g.active?30:-30),y:Math.max(...g.feet.map(f=>f.y))+100}));
   for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);
  }
  assert.ok(g.feet.every(f=>f.y>s.y+300));
  assert.ok(condition(g)<25,'the old easy detour now ruins the white tread');
  assert.ok(!g.events.some(e=>e.type==='bump'),'mud never becomes an invisible wall');
  assert.ok(g.groundContacts.some(p=>p.kind==='mud'),'steps press real impressions into the muddy shoulder');
 }
});

test('visible water, oil and raised footholds retain priority over the failed road underneath',()=>{
 const g=createGame('leather',321);
 for(const type of ['water','oil','metal','stone']){
  let checked=0;
  for(const p of g.street.patches.filter(p=>p.type===type&&!p.roadDecay&&!p.onCover)){
   const s=surfaceAt(g,p.x,p.y);
   if(s.patch===p){assert.equal(s.type,type);checked++;}
  }
  assert.ok(checked>0,type);
 }
});

test('shoulder culling preserves exact preview contact at jagged edges and rotated toes',()=>{
 for(const seed of [42,321]){
  const g=createGame('leather',seed);g.phase='walking';setShoeMask(g,SHOE_MASK);
  for(const p of g.street.patches.filter(p=>p.roadDecay))for(const t of [.15,.4,.65,.85]){
   const y=p.y-p.ry+t*p.ry*2,edge=p.x+groundEdge(p,y-p.y);
   if(edge<170||edge>730)continue;
   for(const offset of [-32,-8,8,32]){
    const x=edge+offset;
    g.feet.forEach((f,i)=>Object.assign(f,{x:x+i*60,y:y-130,bestY:y-130,angle:0}));g.active=0;
    for(const dx of [-30,0,30]){
     const target={x:x+dx,y},actual=planStep(g,target),expected=reference.planStep(g,target);
     assert.deepEqual(actual,expected,`${seed}/${p.bankSide}/${t}/${offset}/${dx}`);
    }
   }
  }
 }
});
