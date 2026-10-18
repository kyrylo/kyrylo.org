import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,surfaceAt,puddleDepth,takeStep,advance,condition,setShoeMask} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {districtDetails} from '../district-details.js';
import {createEncounterGame} from './encounter-fixture.mjs';

const settle=g=>{for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);assert.equal(g.mode,'idle');};
function doorstep(seed,active){
 // Isolate the downpipe's grit from later clay tongues; full-course tests retain both.
 const g=createEncounterGame('leather',seed),s=g.street.sections.find(s=>s.kind==='doorstep');
 g.phase='walking';g.active=active;setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{x:s.line[0].x+(i?30:-30),y:s.y-225,bestY:s.y-225}));
 return {g,s};
}
test('the opening runoff meets a visible downpipe and deposits grit on its far bank',()=>{
 const sides=new Set();
 for(let seed=1;seed<=40;seed++){
  const g=createEncounterGame('leather',seed),d=g.street.districts[0],pipe=districtDetails(d.street,d).find(p=>p.kind==='downpipe');
  const water=d.street.patches.find(p=>p.doorstepRunoff),grit=d.street.patches.find(p=>p.gutterGrit);
  sides.add(pipe.x>450);assert.equal(pipe.y,water.y);assert.equal(pipe.x>450,water.x>450);
  assert.equal(grit.x>450,water.x>450);assert.equal(grit.y-water.y,50);
  assert.ok(puddleDepth(water,pipe.x+(pipe.x>450?-39:39),pipe.y)>0);
  assert.equal(surfaceAt(g,grit.x,grit.y+d.offset).patch.gutterGrit,true);
 }
 assert.equal(sides.size,2);
});
test('a placed stride clears both runoff and grit with either foot leading',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const {g,s}=doorstep(seed,active);
  for(const dy of [-40,70,180,240]){
   const x=dy<=90?s.gap:s.gap+(450-s.gap)*(dy-90)/150;
   assert.ok(takeStep(g,{x:x+(g.active?30:-30),y:s.y+dy}));settle(g);
  }
  assert.equal(condition(g),100,`seed ${seed}, leading foot ${active}`);
  assert.ok(g.feet.every(f=>f.y>s.y+175));assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});
test('a short outer landing collects grit and leaves a footprint, but can still continue forward',()=>{
 for(let seed=1;seed<=40;seed++){
  const probe=createGame('leather',seed),grit=probe.street.patches.find(p=>p.gutterGrit),active=grit.x>450?1:0;
  const {g,s}=doorstep(seed,active);
  assert.ok(takeStep(g,{x:grit.x,y:grit.y}));settle(g);
  assert.ok(condition(g)<99.8);assert.ok(g.feet[active].sole.some(z=>z.stainType==='gravel'&&z.stain>0));
  assert.ok(g.groundContacts.some(m=>m.patch.gutterGrit&&m.pieces.length));
  for(const dy of [70,180,240]){
   const x=dy<=90?s.gap:dy<240?s.gap+(450-s.gap)*(dy-90)/150:450;
   const foot=g.feet[g.active],before=foot.y;
   assert.ok(takeStep(g,{x:x+(g.active?30:-30),y:s.y+dy}));settle(g);assert.ok(foot.y>before);
  }
  assert.ok(g.prints.some(p=>p.zones.some(z=>z.type==='gravel'&&z.dirt>0)));
  assert.ok(g.feet.every(f=>f.y>s.y+175));assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});

test('hose runoff starts at the neighbour’s verge and leaves the surviving road crown dry',()=>{
 for(let seed=1;seed<=32;seed++){
  const g=createEncounterGame('leather',seed),d=g.street.districts[0],hose=districtDetails(d.street,d).find(p=>p.kind==='hose');
  const water=d.street.patches.find(p=>p.hoseRunoff),silt=d.street.patches.find(p=>p.hoseSilt);
  assert.equal(water.y,hose.y);assert.equal(water.x>450,hose.x>450);assert.equal(surfaceAt(g,silt.x,silt.y+d.offset).type,'mud');
  const s=d.street.sections.find(s=>s.kind==='crown'),a=s.line[1],b=s.line[2],x=a.x+(b.x-a.x)*(water.y-a.y)/(b.y-a.y);
  for(const dx of [-44,0,44])assert.equal(surfaceAt(g,x+dx,water.y+d.offset).type,'dry');
 }
});
test('two oily tyre marks leave the first parked car without covering the outside lane',()=>{
 const mirrors=new Set();
 for(let seed=1;seed<=32;seed++){
  const g=createGame('leather',seed),d=g.street.districts[1],car=d.street.parking[0],tracks=d.street.patches.filter(p=>p.tyreTrack);
  mirrors.add(car.side);assert.equal(tracks.length,2);assert.equal(tracks[0].y,car.y+510);
  for(const p of tracks){assert.equal(p.type,'oil');assert.ok(p.ry<10);assert.equal(Math.sign(p.sin),car.side?-1:1);}
  const x=car.side?200:700;
  for(let y=tracks[0].y-140;y<=tracks[0].y+140;y+=20)for(const dx of [-40,40])assert.ok(tracks.every(p=>puddleDepth(p,x+dx,y)===0));
 }
 assert.equal(mirrors.size,2);
});
test('angled tyre marks and boot soles retain physical contact near their rotated ends',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed);
  for(const p of g.street.patches.filter(p=>p.tyreTrack||p.bootprint))for(const sign of [-1,1]){
   const lx=p.tyreTrack?sign*p.rx*.8:0,ly=p.bootprint?sign*p.ry*.75:0;
   const x=p.x+lx*p.cos-ly*p.sin,y=p.y+lx*p.sin+ly*p.cos;
   assert.ok(puddleDepth(p,x,y)>.3);assert.equal(surfaceAt(g,x,y).patch,p);
  }
 }
});
test('builders leave separate shoe-sized muddy prints instead of an impassable dirty strip',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed),prints=g.street.patches.filter(p=>p.bootprint);
  assert.equal(prints.length,5);assert.ok(prints.every(p=>p.rx===14&&p.ry===29&&p.depth<3));
  for(let i=1;i<prints.length;i++){
   const a=prints[i-1],b=prints[i],x=(a.x+b.x)/2,y=(a.y+b.y)/2;
   assert.ok(prints.every(p=>puddleDepth(p,x,y)===0));
  }
 }
});
test('tracked mud, oily tyre marks and silt stain a sneaker without a pond splash',()=>{
 for(const kind of ['bootprint','tyreTrack','hoseSilt','gardenSpill']){
  const g=createGame('leather',321),p=g.street.patches.find(p=>p[kind]);
  g.street=indexStreet({...g.street,patches:[p],obstacles:[]});g.phase='walking';setShoeMask(g,SHOE_MASK);
  g.feet.forEach((f,i)=>Object.assign(f,{x:p.x+i*60,y:p.y-140-i*20,bestY:p.y-140-i*20,angle:0}));
  assert.ok(takeStep(g,{x:p.x,y:p.y}));for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);
  assert.ok(condition(g)<99.9,kind);assert.equal(g.rings.length,0);assert.equal(g.particles.length,0);
  assert.ok(g.feet[0].sole.some(z=>z.stain>0&&z.stainType===p.type));
  assert.ok(!g.events.some(e=>e.type==='splash'));
 }
});
test('new street stories reproduce on retry and keep terrain lookup bounded',()=>{
 for(const seed of [1,42,321,9182]){
  const a=createGame('leather',seed),b=createGame('leather',seed);
  assert.deepEqual(a.street.patches,b.street.patches);
  assert.equal(a.street.sections.filter(s=>s.story).length,7);
  assert.ok([...a.street.bins.values()].every(bin=>bin.patches.length+bin.obstacles.length<25));
 }
});
test('home hazards join their visible sources and preserve the clean finish apron',()=>{
 for(let seed=1;seed<=32;seed++){
  const g=createGame('leather',seed),d=g.street.districts[4],props=districtDetails(d.street,d);
  const pot=props.find(p=>p.kind==='planter'),fan=d.street.patches.find(p=>p.washout),bin=props.find(p=>p.kind==='bin');
  assert.equal(pot.y,fan.y);assert.equal(pot.x>450,fan.x>450);
  const curb=pot.x>450?798:102;
  for(let x=Math.min(curb,fan.x);x<=Math.max(curb,fan.x);x+=10)
   assert.equal(surfaceAt(g,x,fan.y+d.offset).type,'mud','compost connects continuously to the planter');
  const leak=d.street.patches.filter(p=>p.binLeak);assert.equal(leak.length,2);
  assert.equal(bin.x>450,leak[0].x>450);assert.equal(bin.y,2600);
  const at=x=>bin.x>450?900-x:x;
  for(const x of [135,180,225,270,315]){
   const y=2600+(x-104)*40/241;
   assert.ok(leak.some(p=>puddleDepth(p,at(x),y)>.3));
  }
  for(const p of d.street.patches.filter(p=>p.binLeak||p.gardenSpill))assert.ok(p.y+p.ry*1.2<3800);
 }
});
test('the bin trickle can be crossed cleanly with either foot leading on either mirrored street',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createEncounterGame('leather',seed),d=g.street.districts[4],at=x=>d.street.parkingSide?900-x:x;
  g.phase='walking';g.active=active;setShoeMask(g,SHOE_MASK);
  const xs=d.street.parkingSide?[660,720]:[180,240];
  g.feet.forEach((f,i)=>Object.assign(f,{x:xs[i],y:d.offset+2540,bestY:d.offset+2540,angle:0}));
  for(let i=0;i<2;i++){
   // Bring the gutter-side shoe slightly inward on landing; the next patch of
   // silt is visible ahead, so finishing the stride matters as much as its start.
   assert.ok(takeStep(g,{x:at(Math.max(200,at(g.feet[g.active].x))),y:d.offset+2680+i*26}));
   for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);
   assert.equal(g.mode,'idle');
  }
  assert.equal(condition(g),100,`seed ${seed}, leading foot ${active}`);
  assert.ok(!g.events.some(e=>e.type==='bump'));
  assert.ok(g.feet.every(f=>f.y>d.offset+2670));
 }
});
test('landing in bin runoff wets the tread and carries dirty water onto the next dry step',()=>{
 const g=createEncounterGame('leather',321),d=g.street.districts[4],at=x=>d.street.parkingSide?900-x:x;
 g.phase='walking';setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{x:at(220)+i*60,y:d.offset+2500-i*20,bestY:d.offset+2500-i*20,angle:0}));
 assert.ok(takeStep(g,{x:at(220),y:d.offset+2620}));
 for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);
 assert.ok(condition(g)<99.9);assert.ok(g.feet[0].sole.some(z=>z.wet>0&&z.stain>0));
 assert.ok(g.groundContacts.some(m=>m.patch.binLeak));
 g.active=0;
 assert.ok(takeStep(g,{x:at(225),y:d.offset+2690}));
 for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);
 assert.ok(g.prints.some(p=>p.zones.some(z=>z.wet>0&&z.dirt>0)));
});
