// Isolated encounter geometry; full weathered-course balance is checked separately.
import {createEncounterGame as createGame} from './encounter-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {indexStreet,ROAD,PAVEMENT,SHOES,planStep,takeStep,advance,condition,score,progress,surfaceAt} from '../model.js';
import {straightRun} from './straight-audit.mjs';
import {channelCourse} from './channel-course.mjs';
import {stoneCourse} from './stone-course.mjs';
import {coverCourse} from './cover-course.mjs';
function settle(g){for(let n=0;n<250&&g.mode!=='idle';n++)advance(g,1/120);assert.equal(g.mode,'idle');}
function move(g,x,y){const p=planStep(g,{x,y});assert.ok(p.valid);assert.ok(takeStep(g));settle(g);}

test('the staggered opening has a clean forward approach and exit with either leading foot',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createGame('leather',seed),s=g.street.sections[0];g.phase='walking';g.active=active;
  g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:s.y-280,bestY:s.y-280}));
  // Turn into the surviving asphalt, pass the unequal depressions, then
  // arrive at the shallow doorstep runnel with room for the trailing shoe.
  for(const dy of [-205,-130,-55,20,95,170,245]){
   const t=Math.min(1,(dy+280)/185),x=450+(s.gap-450)*t;
   move(g,x+(g.active?30:-30),s.y+dy);
  }
  assert.equal(condition(g),100,`seed ${seed}, leading foot ${active}`);
  assert.ok(!g.events.some(e=>e.type==='bump'));
  assert.ok(g.feet.every(f=>f.y>s.y+150));
 }
});

test('roadworks and the finale require real turns with no straight bypass',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),rails=g.street.obstacles.filter(o=>o.type==='barrier');assert.equal(rails.length,6);
  assert.ok(rails.slice(0,4).every(o=>o.y>ROAD.start+8000&&o.y<ROAD.start+12000),'the repair stretch owns the repeated chicanes');
  assert.ok(rails.slice(4).every(o=>o.y>ROAD.start+16000),'the finale combines earlier challenges');
  for(let n=0;n<6;n+=2){
   const pair=rails.slice(n,n+2);assert.ok(pair[1].y-pair[0].y>390,'room to change line');
   const clearAt=o=>o.x<450?[o.x+o.halfWidth+SHOES.leather.width,ROAD.right-SHOES.leather.width]:[ROAD.left+SHOES.leather.width,o.x-o.halfWidth-SHOES.leather.width];
   const [a,b]=pair.map(clearAt);assert.ok(a[1]<b[0]||b[1]<a[0],'successive openings require different lines');
   for(let x=135;x<=765;x+=5){
    assert.ok(g.street.obstacles.some(o=>o.halfWidth&&o.height>100&&Math.abs(o.y-pair[0].y)<900&&x>o.x-o.halfWidth-12&&x<o.x+o.halfWidth+12),`seed ${seed}, x=${x}: straight shortcut`);
   }
  }
 }
});
test('fixed-line walking cannot win across lanes and random streets',()=>{
 for(const seed of [1,42,321,9182,7761,100023])for(const x of [170,240,310,380,450,520,590,660,730]){
  const r=straightRun(seed,x);assert.ok(!r.finished,JSON.stringify(r));
 }
});
test('late runoff has a clean walking route around the wide channel',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.kind==='runoff'&&s.stage===2),lane=s.lanes[1];g.phase='walking';
  g.feet.forEach((f,i)=>{f.x=lane+(i?30:-30);f.y=s.y-120-i*20;f.bestY=f.y;});
  for(let n=0;n<3;n++)move(g,lane+(g.active?30:-30),Math.max(...g.feet.map(f=>f.y))+160);
  assert.equal(condition(g),100,`seed ${seed}`);assert.ok(g.feet.every(f=>f.y>s.y+180));
 }
});
test('a missed barrier approach can recover sideways without reversing or farming progress',()=>{
 const g=createGame('leather',321);g.phase='walking';g.street=indexStreet({seed:321,patches:[],clutter:[],obstacles:[{type:'barrier',solid:true,x:310,y:1000,halfWidth:220,halfLength:24,r:220,ry:24,height:165}]});
 g.feet.forEach((f,i)=>{f.x=420+i*60;f.y=940;f.bestY=f.y;});
 move(g,420,1140);assert.ok(g.events.some(e=>e.type==='bump'));
 const before=progress(g),points=score(g);
 // Move the right foot out first, then bring the left alongside it.
 g.active=1;move(g,630,Math.max(...g.feet.map(f=>f.y)));move(g,570,Math.max(...g.feet.map(f=>f.y)));
 assert.ok(progress(g)>=before);assert.ok(score(g)-points<5);
 move(g,630,1130);move(g,570,1260);assert.ok(g.feet.every(f=>f.y>1030));assert.equal(condition(g),100);
});
test('every valid sideways footprint can be committed again at its actual clamped position',()=>{
 const g=createGame('leather',42);g.phase='walking';g.street=indexStreet({seed:42,patches:[],obstacles:[],clutter:[]});
 for(const side of [0,1])for(const x of [150,300,390,420,450,480,510,600,750]){
  g.active=side;const front=Math.max(...g.feet.map(f=>f.y)),p=planStep(g,{x,y:front});
  if(!p.valid)continue;assert.equal(planStep(g,p).valid,true);assert.ok(p.y>=front);
 }
});

test('a trailing shoe may move sideways at its own height without reversing or farming points',()=>{
 const g=createGame('leather',42);g.phase='walking';g.street=indexStreet({seed:42,patches:[],obstacles:[],clutter:[]});
 g.feet.forEach((f,i)=>{f.y=1000+i*100;f.bestY=f.y;});
 const before=progress(g),points=score(g);move(g,390,1000);move(g,540,1100);
 assert.equal(progress(g),before);assert.equal(score(g),points);assert.ok(g.feet.every((f,i)=>f.y>=1000+i*100));
});

test('curved asphalt paths fit both whole shoes throughout the bend across random streets',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed);
  for(const s of g.street.sections.filter(s=>s.kind==='crown')){
   assert.ok(Math.abs(s.line.at(-1).x-s.line[0].x)>=(s.stage===0?120:130),'the exit requires steering');
   for(let i=1;i<s.line.length;i++)for(let t=0;t<=1;t+=.1){
    const a=s.line[i-1],b=s.line[i],x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    for(const dx of [-44,-30,0,30,44])for(const dy of [-30,0,30])assert.equal(surfaceAt(g,x+dx,y+dy).type,'dry',`seed ${seed}, stage ${s.stage}: whole pair fits the winding path`);
   }
  }
 }
});

test('the quieter homeward bend still needs steering and crosses cleanly with either leading foot',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===4&&s.kind==='crown');
  const lane=y=>{
   let n=s.line.findIndex(p=>p.y>y);if(n<0)return s.line.at(-1).x;if(!n)return s.line[0].x;
   const a=s.line[n-1],b=s.line[n];return a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y);
  };
  g.phase='walking';g.active=active;
  g.feet.forEach((f,i)=>Object.assign(f,{x:lane(s.y-230)+(i?30:-30),y:s.y-230,bestY:s.y-230}));
  for(let y=s.y-155;y<=s.y+235;y+=65)move(g,lane(y)+(g.active?30:-30),y);
  assert.equal(condition(g),100,`seed ${seed}, leading foot ${active}`);
  assert.ok(g.feet.every(f=>f.y>s.y+150));assert.ok(!g.events.some(e=>e.type==='bump'));
  if(active)continue;
  for(let x=170;x<=730;x+=10){
   let wet=false;
   // Include the body of each shoe: clear centres alone do not make a clean
   // straight route when the outer sole brushes a gutter or fractured lip.
   const edge=30+SHOES.leather.width*.4;
   for(let y=s.y-200;y<=s.y+240;y+=10)for(const dx of [-edge,-30,30,edge])wet ||=surfaceAt(g,x+dx,y).dirt>0;
   assert.ok(wet,`seed ${seed}, lane ${x}: holding one line must still cost cleanliness`);
  }
 }
});

function channelApproach(seed,direct,active){
 const g=createGame('leather',seed);g.active=active;const course=channelCourse(g,direct);g.phase='walking';
 g.feet.forEach((f,i)=>{f.x=course.start.x+(i?30:-30);f.y=course.start.y;f.bestY=f.y;});
 return {g,...course};
}
test('opposing channels have a five-step clean shortcut with either leading foot',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const {g,targets,crossingSteps,section}=channelApproach(seed,true,active);assert.equal(crossingSteps,5);
  for(const p of targets.slice(0,crossingSteps))move(g,p.x+(g.active?30:-30),p.y);
  assert.equal(condition(g),100,`seed ${seed}, foot ${active}`);assert.ok(g.feet.every(f=>f.y>section.y+215));
  assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});
test('the longer channel detour weaves through a dry refuge that fits both whole shoes',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const {g,targets,crossingSteps,section:s}=channelApproach(seed,false,active);assert.equal(crossingSteps,10);
  if(active===0)for(let i=1;i<s.line.length;i++)for(let t=0;t<=1;t+=.1){
   const a=s.line[i-1],b=s.line[i],x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
   for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,x+dx,y+dy).type,'dry');
  }
  for(const p of targets.slice(0,crossingSteps))move(g,p.x+(g.active?30:-30),p.y);
  assert.equal(condition(g),100,`seed ${seed}, foot ${active}`);assert.ok(g.feet.every(f=>f.y>s.y+235));
  assert.ok(Math.abs((g.feet[0].x+g.feet[1].x)/2-s.lanes[1])>400,'the detour changes sides');
 }
});
test('both channel routes connect to the stepping stones with either leading foot',()=>{
 for(let seed=1;seed<=40;seed++)for(const direct of [true,false])for(const active of [0,1]){
  const {g,targets,fork}=channelApproach(seed,direct,active);
  for(const p of targets){const foot=g.feet[g.active],before=foot.y;move(g,p.x+(g.active?30:-30),p.y);assert.ok(foot.y>=before);}
  for(const p of stoneCourse(g).targets){assert.equal(g.active,p.side);move(g,p.x,p.y);}
  assert.ok(condition(g)>99.99,`seed ${seed}, route ${direct}, foot ${active}`);
  assert.ok(!g.events.some(e=>e.type==='bump'));assert.ok(g.feet.every(f=>f.y>fork.y+250));
 }
});
test('the opposing runnels are physical water and close the former straight detour',()=>{
 for(let seed=1;seed<=40;seed++)for(const oldDetour of [true,false]){
  const {g,section:s}=channelApproach(seed,!oldDetour,0),y=s.y+(oldDetour?130:-230);
  if(oldDetour)g.feet.forEach(f=>{f.y=s.y+30;f.bestY=f.y;});
  move(g,g.feet[g.active].x,y);
  assert.ok(condition(g)<99.99);assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='water')));
  assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});

test('car routes fit a whole pair, with dry setup before the final bin trickle',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed);
  for(const s of g.street.sections.filter(s=>s.kind==='squeeze'))for(const lane of s.lanes){
   // The final outside lane now crosses a narrow leak. Its full dry setup is
   // before that strip; street-stories tests both complete strides beyond it.
   const y=s.story==='bin-day'&&lane===s.lanes[1]?g.street.districts[s.stage].offset+2540:s.y;
   for(const dx of [-44,-30,0,30,44])for(const dy of [-30,0,30]){
    assert.equal(surfaceAt(g,lane+dx,y+dy).type,'dry');
    assert.ok(!g.street.obstacles.some(o=>o.type==='car'&&Math.abs(o.x-lane-dx)<o.halfWidth&&Math.abs(o.y-y-dy)<o.halfLength));
   }
  }
 }
});

function parkingApproach(seed,pattern,outside=false){
 const g=createGame('leather',seed),s=g.street.sections.find(s=>s.parkingPattern===pattern);g.phase='walking';
 const x=outside?s.lanes[1]:s.line[0].x;
 // The first outside approach starts beyond the previous encounter's pinch;
 // putting its trailing heel inside that puddle is not a parking detour.
 const approach=outside&&pattern==='squeeze'?220:260;
 g.feet.forEach((f,i)=>{f.x=x+(i?30:-30);f.y=s.y-approach-i*20;f.bestY=f.y;});
 return {g,s};
}
function parkingLine(s,y){
 const n=s.line.findIndex(p=>p.y>y);if(n<0)return s.line.at(-1).x;if(n===0)return s.line[0].x;
 const a=s.line[n-1],b=s.line[n],t=(y-a.y)/(b.y-a.y);return a.x+(b.x-a.x)*t;
}
test('the three parking bays progress from a squeeze to a bend to a shallow crossing',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),bays=g.street.sections.filter(s=>s.stage===1&&s.kind==='squeeze');
  assert.deepEqual(bays.map(s=>s.parkingPattern),['squeeze','bend','crossing']);
  const bend=bays[1];assert.ok(Math.abs(bend.line.at(-1).x-bend.line[0].x)>=120);
  for(let i=1;i<bend.line.length;i++)for(let t=0;t<=1;t+=.1){
   const a=bend.line[i-1],b=bend.line[i],x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
   for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,x+dx,y+dy).type,'dry',`seed ${seed}: a whole pair fits the bend`);
  }
 }
});
test('the bowed parking corridor is clean with steering, while continuing the entry line collects shoulder grit',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1])for(const steer of [true,false]){
  const {g,s}=parkingApproach(seed,'bend');g.active=active;
  for(let n=0;n<7;n++){
   const y=Math.max(...g.feet.map(f=>f.y))+100,x=steer?parkingLine(s,y):s.line[0].x;
   move(g,x+(g.active?30:-30),y);
  }
  assert.ok(g.feet.every(f=>f.y>s.y+300));assert.ok(!g.events.some(e=>e.type==='bump'));
  if(steer)assert.equal(condition(g),100,`seed ${seed}: the intended bend stays clean`);
  else {
   assert.ok(condition(g)<99.9,`seed ${seed}: the curve must require steering`);
   assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='gravel')),'the worn shoulder has real gravel contact');
   assert.ok(g.groundContacts.some(m=>m.kind==='gravel'),'the shoe presses loose material into the shoulder');
  }
 }
});
test('all three parking variations retain a clean outside detour through the entire encounter',()=>{
 for(let seed=1;seed<=40;seed++)for(const pattern of ['squeeze','bend','crossing']){
  const {g,s}=parkingApproach(seed,pattern,true);
  for(let n=0;n<7;n++)move(g,s.lanes[1]+(g.active?30:-30),Math.max(...g.feet.map(f=>f.y))+100);
  assert.ok(g.feet.every(f=>f.y>s.y+300));assert.equal(condition(g),100,`seed ${seed}, ${pattern}: the detour remains clean`);
  assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});
test('the last parking runnel rewards deliberate ordinary strides and penalizes a foot placed in the water',()=>{
 for(let seed=1;seed<=40;seed++){
  const {g,s}=parkingApproach(seed,'crossing');
  move(g,g.feet[0].x,s.y-105);
  for(let n=0;n<5;n++)move(g,s.gap+(g.active?30:-30),Math.max(...g.feet.map(f=>f.y))+100);
  assert.ok(g.feet.every(f=>f.y>s.y+270));assert.equal(condition(g),100,`seed ${seed}: both shoes can cross cleanly`);
  const wet=parkingApproach(seed,'crossing');move(wet.g,wet.g.feet[0].x,wet.s.y-175);
  assert.ok(condition(wet.g)<99.99,'the runnel is physical water');
 }
});

test('staggered utility covers offer a precise shortcut and a dry outside route',()=>{
 for(let seed=1;seed<=40;seed++)for(const stage of [3,4]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.kind==='drain-chain'&&s.stage===stage),next=g.street.sections[g.street.sections.indexOf(s)+1];
  const stones=g.street.patches.filter(p=>p.type==='metal'&&Math.abs(p.y-s.y)<150&&Math.abs(p.x-450)<60).sort((a,b)=>a.y-b.y);
  assert.equal(stones.length,2);
  // Read the two real metal surfaces, then choose the matching leading foot.
  g.phase='walking';g.active=stones[0].x>450?1:0;
  g.feet.forEach((f,i)=>{f.x=420+i*60;f.y=s.y-310;f.bestY=f.y;});
  for(const f of g.feet)for(const dx of [-14,0,14])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,f.x+dx,f.y+dy).type,'dry','the previous encounter leaves a clean place to set up');
  for(const p of stones){move(g,p.x,p.y);assert.ok(g.events.some(e=>e.type==='land'&&e.surface==='metal'));g.events.length=0;}
  // Clear the whole heel: the old +275 target still dipped into the basin on
  // wider seeds, which the previous forgiving dirt balance barely counted.
  move(g,stones[0].x,s.y+300);move(g,stones[1].x,s.y+360);
  assert.ok(g.events.filter(e=>e.type==='land').every(e=>e.contacts.every(c=>c.surface==='asphalt')));
  assert.ok(g.feet.every(f=>f.y>s.y+270));assert.ok(condition(g)>99,`seed ${seed}, stage ${stage}: the covers have a walking exit that preserves the clean medal`);
  // The widest part of the basin has a full-pair bypass. Its rounded ends
  // connect to the previous and following turns, checked in full-route replays.
  for(let y=s.y-180;y<=s.y+180;y+=10)for(const dx of [-44,0,44])assert.equal(surfaceAt(g,s.gap+dx,y).type,'dry','the longer route has room for both shoes');
 }
});

test('a heel left in the shallow homeward margin gets damp while the full asphalt exit stays clean',()=>{
 const cross=exit=>{
  const g=createGame('leather',13),s=g.street.sections.find(s=>s.kind==='drain-chain'&&s.stage===4);
  const covers=g.street.patches.filter(p=>p.type==='metal'&&Math.abs(p.y-s.y)<150&&Math.abs(p.x-450)<60).sort((a,b)=>a.y-b.y);
  g.phase='walking';g.active=covers[0].x>450?1:0;
  g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:s.y-310,bestY:s.y-310}));
  for(const p of covers)move(g,p.x,p.y);g.events.length=0;
  move(g,covers[0].x,s.y+exit);move(g,covers[1].x,s.y+exit+60);return g;
 };
 const dipped=cross(275),clear=cross(300);
 assert.ok(dipped.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='water'&&c.fraction>0&&c.fraction<.3)));
 // The thin puddle margin now carries less sediment and can rinse an already
 // dirty heel. A clean shoe still picks up moisture and a trace of road water.
 assert.ok(condition(dipped)<condition(clear));assert.ok(condition(clear)>99.9);
 const wet=g=>g.feet.reduce((n,f)=>n+f.sole.reduce((s,z)=>s+z.wet,0),0);
 assert.ok(wet(dipped)>wet(clear));
});

test('the roadbed exit joins the first utility covers without touching water or loose grit',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===3&&s.coverPattern==='pair'),exit=g.street.sections.filter(s=>s.stage===2).at(-1).line.at(-1);
  const covers=g.street.patches.filter(p=>p.type==='metal'&&Math.abs(p.y-s.y)<180).sort((a,b)=>a.y-b.y),end=s.y-325;
  g.phase='walking';g.active=covers[0].x>450?1:0;
  g.feet.forEach((f,i)=>Object.assign(f,{x:exit.x+(i?30:-30),y:exit.y-i*20,bestY:exit.y-i*20}));
  for(let i=1;i<=4;i++){
   const y=Math.min(end,exit.y+i*120),t=(y-exit.y)/(end-exit.y);
   move(g,exit.x+(450-exit.x)*t+(g.active?30:-30),y);
  }
  for(const p of covers)move(g,p.x,p.y);
  move(g,covers[0].x,s.y+300);move(g,covers[1].x,s.y+360);
  assert.ok(g.feet.every(f=>f.y>s.y+270));
  assert.ok(condition(g)>99.8,`seed ${seed}: only the damp iron transfers a little grime`);
  assert.ok(g.events.filter(e=>e.type==='land').every(e=>e.contacts.every(c=>['asphalt','metal'].includes(c.surface))));
  assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});

test('the actual roadbed exit leaves a clean four-step setup before the first flooded basin',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createGame('leather',seed),last=g.street.sections.filter(s=>s.stage===2).at(-1),first=g.street.sections.find(s=>s.stage===3);g.phase='walking';
  // The damaged road now continues past its section centre. Start at the
  // actual final waypoint instead of placing the shoes inside the gravel.
  const exit=last.line.at(-1),start=exit.y,end=first.y-325;g.active=active;
  g.feet.forEach((f,i)=>{f.x=exit.x+(i?30:-30);f.y=start-i*20;f.bestY=f.y;});
  for(let n=0;n<4;n++){
   const y=Math.min(end,Math.max(...g.feet.map(f=>f.y))+120),x=exit.x+(450-exit.x)*(y-start)/(end-start);
   move(g,x+(g.active?30:-30),y);
  }
  assert.equal(condition(g),100);assert.ok(g.feet.every(f=>f.y>first.y-450&&f.y<first.y-320));
  assert.ok(!g.events.some(e=>e.type==='bump'));
  for(const x of [406,420,450,480,494])for(const y of [first.y-355,first.y-325,first.y-295])assert.equal(surfaceAt(g,x,y).type,'dry','there is room to choose the leading foot');
 }
});
function coverApproach(seed){
 const g=createGame('leather',seed),course=coverCourse(g),{s,active}=course;
 g.phase='walking';g.active=active;
 g.feet.forEach((f,i)=>{f.x=420+i*60;f.y=s.y-350;f.bestY=f.y;});
 return {g,...course};
}
test('the low road introduces two generous covers before three smaller staggered placements',()=>{
 const sides=new Set();
 for(let seed=1;seed<=40;seed++){
  const {g,s,covers}=coverApproach(seed),intro=g.street.sections.find(s=>s.stage===3&&s.kind==='drain-chain');
  const first=g.street.patches.filter(p=>p.type==='metal'&&Math.abs(p.y-intro.y)<150);
  assert.equal(first.length,2);assert.equal(covers.length,3);assert.ok(first.every(p=>p.rx>covers[0].rx));
  assert.equal(covers[0].x,covers[2].x);assert.notEqual(covers[0].x,covers[1].x);sides.add(g.active);
  for(const p of covers)assert.equal(surfaceAt(g,p.x,p.y).type,'metal');
  for(const [a,b] of [[covers[0],covers[1]],[covers[1],covers[2]]])assert.equal(surfaceAt(g,(a.x+b.x)/2,(a.y+b.y)/2).type,'water','a misplaced foot still meets the real flooded basin');
 }
 assert.equal(sides.size,2,'mirrored streets require either leading foot');
});
test('bare iron on all three covers and the far bank are reachable with ordinary alternating steps',()=>{
 for(let seed=1;seed<=40;seed++){
  const {g,s,targets}=coverApproach(seed);
  for(const p of targets){
   assert.ok(takeStep(g,p));
   for(let n=0;n<240&&g.mode!=='idle';n++){advance(g,1/120);assert.ok(g.feet.some(f=>f.z===0),'the other shoe remains planted');}
   assert.equal(g.mode,'idle');assert.ok(g.feet[0].x+26.9<=g.feet[1].x);
  }
  assert.deepEqual(g.events.filter(e=>e.type==='land').map(e=>e.surface),['metal','metal','metal','dry','dry']);
  assert.ok(g.feet.every(f=>f.y>s.y+330));assert.ok(condition(g)>99.9,`seed ${seed}: wet covers preserve the clean-stretch budget`);
  assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});
test('the longer flooded basin has a clean bending detour for either leading foot',()=>{
 for(let seed=1;seed<=40;seed++)for(const stride of [100,120])for(const active of [0,1]){
  const {g,s}=coverApproach(seed);g.active=active;
  for(let i=1;i<s.line.length;i++)for(let t=0;t<=1;t+=.1){
   const a=s.line[i-1],b=s.line[i],x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
   for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,x+dx,y+dy).dirt,0,'the whole pair fits the clean bend');
  }
  g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y-350-i*20;f.bestY=f.y;});
  for(let n=0;n<(stride===120?8:9);n++){
   const y=Math.max(...g.feet.map(f=>f.y))+stride;move(g,parkingLine(s,y)+(g.active?30:-30),y);
  }
  assert.equal(condition(g),100,`seed ${seed}, stride ${stride}, foot ${active}: the moving heel also clears the water`);
  assert.ok(g.feet.every(f=>f.y>s.y+350));assert.ok(!g.events.some(e=>e.type==='bump'));
  const next=g.street.sections[g.street.sections.indexOf(s)+1];assert.ok(next.y-Math.max(...g.feet.map(f=>f.y))>200,'room to prepare for the diagonal channel');
 }
});
test('the gutter overflow has real contact on the old outside line',()=>{
 for(let seed=1;seed<=40;seed++){
  const {g,s}=coverApproach(seed);g.active=s.gap>450?1:0;
  g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y+180;f.bestY=f.y;});
  move(g,s.gap+(g.active?30:-30),s.y+340);
  assert.ok(condition(g)<99.99,`seed ${seed}: placing the outer shoe in the overflow picks up water`);
 }
});

test('diagonal runoff has clean walking routes on either slope, with real water between them',()=>{
 const slopes=new Set();
 for(let seed=1;seed<=40;seed++)for(const stage of [1,3]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.kind==='diagonal'&&s.stage===stage),lane=s.lanes[1];g.phase='walking';
  const seam=g.street.patches.find(p=>p.repairSeam&&p.y===s.y);slopes.add(Math.sign(seam.sin));assert.ok(Math.abs(seam.sin)>.25);
  g.feet.forEach((f,i)=>{f.x=lane+(i?30:-30);f.y=s.y-115;f.bestY=f.y;});
  if(stage===1)for(let n=0;n<3;n++)move(g,lane+(g.active?30:-30),Math.max(...g.feet.map(f=>f.y))+160);
  else for(const [x,dy] of [[700,45],[680,145],[625,250]])move(g,(lane<450?900-x:x)+(g.active?30:-30),s.y+dy);
  assert.equal(condition(g),100,`seed ${seed}, stage ${stage}`);
 }
 assert.equal(slopes.size,2,'new streets reverse the slope, not just its decoration');
 const g=createGame('leather',42),s=g.street.sections.find(s=>s.kind==='diagonal');g.phase='walking';
 g.feet.forEach((f,i)=>{f.x=s.lanes[0]+(i?30:-30);f.y=s.y-115;f.bestY=f.y;});move(g,g.feet[0].x,s.y);assert.ok(condition(g)<99.8,'landing inside the runnel has a real cleanliness cost');
});

test('the low-road exit leaves room for both shoes throughout its inward turn',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===3&&s.kind==='diagonal');
  assert.equal(g.street.patches.filter(p=>p.lowRoadExit).length,1);
  for(let i=1;i<s.line.length;i++)for(let t=0;t<=1;t+=.1){
   const a=s.line[i-1],b=s.line[i],x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
   for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,x+dx,y+dy).type,'dry',`seed ${seed}: the turn fits both shoes`);
  }
 }
});
test('the low road connects cleanly into either home-stretch curve with either leading foot',()=>{
 const arrangements=new Set();
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===3&&s.kind==='diagonal'),crown=g.street.sections.find(s=>s.stage===4),at=x=>s.gap<450?900-x:x;
  arrangements.add(`${s.gap<450}:${crown.line[0].x<450}`);g.phase='walking';g.active=active;
  g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y-115;f.bestY=f.y;});
  const targets=[[700,45],[680,145],[625,250],[625,310],[525,390],[525,445],[450,500],[450,540]].map(([x,dy])=>({x:at(x),y:s.y+dy}));
  for(const dy of [-100,-60,10])targets.push({x:crown.line[0].x,y:crown.line[0].y+dy});
  for(const p of targets){const foot=g.feet[g.active],before=foot.y;move(g,p.x+(g.active?30:-30),p.y);assert.ok(foot.y>before);}
  assert.equal(condition(g),100,`seed ${seed}, foot ${active}: both shoes reach the home-stretch approach cleanly`);
  assert.ok(!g.events.some(e=>e.type==='bump'));assert.ok(g.feet.every(f=>f.y>crown.line[0].y-80));
 }
 assert.equal(arrangements.size,4);
});
test('continuing along the old outside exit collects real gutter water',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===3&&s.kind==='diagonal');g.phase='walking';g.active=s.gap>450?1:0;
  g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y+170;f.bestY=f.y;});
  move(g,g.feet[g.active].x,s.y+350);
  assert.ok(condition(g)<99.99);assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='water')));assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});

test('the last repair turn has room to change line and a clean central landing onto the apron',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),last=g.street.sections.at(-1),previous=g.street.sections.at(-2);
  assert.ok(last.y-previous.y>=480);assert.equal(last.line.at(-1).x,450);
  for(const x of [225,675])assert.equal(surfaceAt(g,x,PAVEMENT.finishStart-60).type,'water','gutter pools make the final outside lines wet');
  for(let y=PAVEMENT.finishStart-35;y<=ROAD.finish+40;y+=15)for(const x of [406,420,450,480,494])assert.equal(surfaceAt(g,x,y).type,'dry');
  g.phase='walking';g.feet.forEach((f,i)=>{f.x=420+i*60;f.y=PAVEMENT.finishStart-15;f.bestY=f.y;});
  move(g,420,g.feet[0].y+160);assert.equal(g.phase,'finished');assert.equal(condition(g),100);
 }
});

test('the final fork has a visible compost spill and two clean crossings for either leading foot',()=>{
 for(let seed=1;seed<=40;seed++)for(const direct of [true,false])for(const active of [0,1]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===4&&s.kind==='fork');
  const fan=g.street.patches.find(p=>p.washout);assert.ok(fan.rx>60&&fan.ry<32);assert.equal(fan.type,'mud');
  const x=direct?s.gap:s.lanes.find(x=>x!==s.gap);g.phase='walking';g.active=active;
  g.feet.forEach((f,i)=>{f.x=x+(i?30:-30);f.y=s.y-240;f.bestY=f.y;});
  for(const dy of [-100,40,90,265,300])move(g,x+(g.active?30:-30),s.y+dy);
  assert.equal(condition(g),100,`seed ${seed}, branch ${direct}, foot ${active}: both shoes cross cleanly`);
  assert.ok(g.feet.every(f=>f.y>s.y+260));assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});
test('a foot placed in the final garden spill picks up wet compost',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===4&&s.kind==='fork');g.phase='walking';
  g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y+90;f.bestY=f.y;});
  move(g,g.feet[g.active].x,s.y+181);
  assert.ok(condition(g)<99.99);assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='mud')));
 }
});
test('the last parked car feeds a dry landing beyond the first final barrier',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===4&&s.kind==='works-in');g.phase='walking';g.active=active;
  g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y-150;f.bestY=f.y;});
  for(const dy of [20,80])move(g,s.gap+(g.active?30:-30),s.y+dy);
  assert.equal(condition(g),100);assert.ok(!g.events.some(e=>e.type==='bump'));
  assert.ok(g.feet.every(f=>f.y>s.y+19));
 }
});
test('the final S-turn has six clean forward placements with room for the trailing shoe',()=>{
 const mirrored=new Set();
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),[a,b]=g.street.sections.filter(s=>s.stage===4&&s.kind.startsWith('works'));
  const mirror=a.gap<450,across=x=>mirror?900-x:x;mirrored.add(mirror);g.phase='walking';g.active=mirror?1:0;
  g.feet.forEach((f,i)=>{f.x=a.gap+(i?30:-30);f.y=a.y+80;f.bestY=f.y;});
  for(const [x,dy] of [[460,190],[490,250],[330,340],[360,390],[250,b.y-a.y+50],[310,b.y-a.y+120]]){
   const foot=g.feet[g.active],before=foot.y;move(g,across(x),a.y+dy);assert.ok(foot.y>before,'each placement moves its shoe forward');
  }
  assert.equal(condition(g),100,`seed ${seed}`);assert.ok(g.feet.every(f=>f.y>b.y+40));
  assert.ok(!g.events.some(e=>e.type==='bump'));assert.equal(g.street.patches.filter(p=>p.workBed&&p.y>a.y-100).length,2);
 }
 assert.equal(mirrored.size,2);
});

test('the opening runnel has a dry setup, follows the first puddle, and clears with either foot leading',()=>{
 for(let seed=1;seed<=40;seed++)for(const active of [0,1]){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.kind==='doorstep'),first=g.street.sections[0];
  assert.equal(s.line[0].x,first.gap,'the first two encounters share an approach');
  for(const [x,y] of [[s.line[0].x,s.y-225],[s.gap,s.y-30]])for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,x+dx,y+dy).type,'dry');
  g.phase='walking';g.active=active;g.feet.forEach((f,i)=>{f.x=s.line[0].x+(i?30:-30);f.y=s.y-225;f.bestY=f.y;});
  for(const dy of [-40,70,180,240]){
   const x=dy<=90?s.gap:s.gap+(450-s.gap)*(dy-90)/150;move(g,x+(g.active?30:-30),s.y+dy);
  }
  assert.equal(condition(g),100,`seed ${seed}, foot ${active}`);assert.ok(g.feet.every(f=>f.y>s.y+175));assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});
test('stepping into the shallow opening runnel wets the sole',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.kind==='doorstep');g.phase='walking';
  g.feet.forEach((f,i)=>{f.x=s.line[0].x+(i?30:-30);f.y=s.y-225;f.bestY=f.y;});
  move(g,g.feet[0].x,s.y-150);
  assert.ok(condition(g)<100);assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='water')));
 }
});
test('the opening posts have a clean six-step weave through both wet sockets',()=>{
 const mirrors=new Set();
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.kind==='slalom'),mirror=s.line[0].x<s.gap;mirrors.add(mirror);
  g.phase='walking';g.active=mirror?1:0;g.feet.forEach((f,i)=>{f.x=s.line[0].x+(i?30:-30);f.y=s.y-260;f.bestY=f.y;});
  for(const [x,dy] of [[500,-100],[560,30],[410,70],[470,110],[410,260],[470,320]])move(g,s.gap+(mirror?-1:1)*(x-485),s.y+dy);
  assert.equal(condition(g),100,`seed ${seed}`);assert.ok(!g.events.some(e=>e.type==='bump'));assert.ok(g.feet.every(f=>f.y>s.y+250));
 }
 assert.equal(mirrors.size,2);
});
test('brushing a wet post socket collects water without inventing a solid collision',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.kind==='slalom'),p=g.street.patches.find(p=>p.postPool),dir=p.x<s.gap?1:-1,x=p.x+dir*40;
  g.phase='walking';g.active=dir>0?0:1;g.feet.forEach((f,i)=>{f.x=x+(i-g.active)*60;f.y=p.y-120;f.bestY=f.y;});
  move(g,x,p.y);assert.ok(condition(g)<100);assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});

test('the first roadworks exit leaves a whole-pair turning pocket before the car',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===2&&s.kind==='works-out');
  assert.equal(g.street.patches.filter(p=>p.workExit).length,1);
  for(const y of [s.y+200,s.y+235,s.y+270])for(const dx of [-44,0,44])for(const dy of [-31,0,31])assert.equal(surfaceAt(g,450+dx,y+dy).type,'dry','both shoes fit while turning');
 }
});
test('the first work-zone exit connects cleanly around the car and the next runoff',()=>{
 const mirrors=new Set();
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.find(s=>s.stage===2&&s.kind==='works-out'),next=g.street.sections.find(s=>s.stage===2&&s.kind==='runoff'),mirror=s.gap<450,at=x=>mirror?900-x:x;
  mirrors.add(mirror);g.phase='walking';g.active=mirror?1:0;g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y+70;f.bestY=f.y;});
  for(const [x,dy] of [[480,180],[510,245],[330,325],[360,385],[170,490],[230,555],[170,705],[230,825]]){
   const foot=g.feet[g.active],before=foot.y;move(g,at(x),s.y+dy);assert.ok(foot.y>before,'every placement moves its shoe forward');
  }
  assert.equal(condition(g),100,`seed ${seed}`);assert.ok(!g.events.some(e=>e.type==='bump'));assert.ok(g.feet.every(f=>f.y>next.y+170));
 }
 assert.equal(mirrors.size,2);
});
test('the second work zone has a clean turn between muddy bootprints and over its exit runoff',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),[s,last]=g.street.sections.filter(s=>s.stage===2&&s.kind.startsWith('works')).slice(2),mirror=s.gap>450,at=x=>mirror?900-x:x;
  assert.equal(g.street.patches.filter(p=>p.workSpill).length,1);g.phase='walking';g.active=mirror?0:1;
  g.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y+80;f.bestY=f.y;});
  // Place the rear foot between prints, then gather to the right of the next
  // rail before crossing. Cutting diagonally from the old stance clips it.
  for(const [x,dy] of [[420,190],[330,230],[570,350],[540,390],[670,470],[610,490],[670,last.y-s.y+50],[610,last.y-s.y+120],[670,last.y-s.y+285],[610,last.y-s.y+325]])move(g,at(x),s.y+dy);
  assert.equal(condition(g),100,`seed ${seed}`);assert.ok(!g.events.some(e=>e.type==='bump'));assert.ok(g.feet.every(f=>f.y>last.y+260));
 }
});
test('the loose aggregate in the second turn soils a shoe placed on it',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),s=g.street.sections.filter(s=>s.stage===2&&s.kind==='works-in')[1],p=g.street.patches.find(p=>p.workSpill),mirror=s.gap>450,at=x=>mirror?900-x:x;
  g.phase='walking';g.active=mirror?0:1;g.feet.forEach((f,i)=>{f.x=at(390+(mirror?1-i:i)*60);f.y=s.y+150;f.bestY=f.y;});
  move(g,p.x,p.y);assert.ok(condition(g)<100);assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface==='gravel')));assert.ok(!g.events.some(e=>e.type==='bump'));
 }
});


test('repair aggregate thins toward the gap while both ends retain real grit contact',()=>{
 for(let seed=1;seed<=40;seed++){
  const depths=[];
  for(const end of [-1,1]){
   const g=createGame('leather',seed),p=g.street.patches.find(p=>p.workSpill),x=p.x+end*p.spillSide*p.rx*.5;
   // Isolate the deposited material, keeping its real mirrored contour. Equal
   // approaches distinguish the shallow tip from the deeper excavation side.
   g.street=indexStreet({...g.street,patches:[p],obstacles:[]});g.phase='walking';
   g.feet.forEach((f,i)=>Object.assign(f,{x:x+i*60,y:p.y-100,bestY:p.y-100}));
   move(g,x,p.y);
   const contact=g.events.find(e=>e.type==='land').contacts.find(c=>c.surface==='gravel');
   assert.ok(contact);depths.push(contact.depth);assert.ok(condition(g)<100);
   assert.ok(g.groundContacts.some(m=>m.kind==='gravel'));
  }
  assert.ok(depths[1]>depths[0]*1.4,`seed ${seed}: the leading edge is thinner`);
 }
});
