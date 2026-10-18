import test from 'node:test';
import assert from 'node:assert/strict';
import { ROAD, DISTRICT_LENGTH, DISTRICTS, districtAt, GRID, SHOES, MATERIALS, createGame, indexStreet, beginStep, aimStep, predictedTarget, releaseStep, cancelStep, advance, condition, progress, score, stainAt, emitSplash, surfaceAt, setShoeMask, footPoint, PAVEMENT, planStep, suggestStep, takeStep } from '../model.js';
const tick = (g, seconds, fps = 120) => { for (let n=0;n<Math.round(seconds*fps);n++) advance(g,1/fps); };
const patch = (type, x=420, y=1000, extra={}) => ({id:0,type,x,y,rx:80,ry:110,depth:20,dirt:MATERIALS[type].dirt,seed:2,cos:1,sin:0,...extra});
function fixture(type='dry', extra={}) { const g=createGame('leather',123); g.phase='walking'; g.feet[0].y=1000; g.feet[1].y=980; g.feet.forEach(f=>f.bestY=f.y); g.street=indexStreet({seed:123,patches:type==='dry'?[]:[patch(type,420,1000,extra)],obstacles:[],clutter:[]}); return g; }
function step(g, hold, vector={x:0,y:100}) { assert.equal(beginStep(g),true); aimStep(g,vector); tick(g,hold); releaseStep(g); tick(g,1.3); assert.equal(g.mode,'idle'); }
function cleanFoothold(g,section){
 // A clean point at the section centre used to pass even if a shoe would not
 // fit. The harder route moves its footholds: search real shoe-sized pockets.
 const candidates=[...g.street.patches.filter(p=>p.steppingStone&&Math.abs(p.y-section.y)<220),...(section.line||[])];
 for(const dy of [-150,-90,-30,30,90,150])for(const dx of [0,-24,24,-48,48,-72,72])candidates.push({x:section.gap+dx,y:section.y+dy});
 for(const p of candidates){
  if(p.x<ROAD.left+14||p.x>ROAD.right-14)continue;
  if(g.street.obstacles.some(o=>Math.abs(p.x-o.x)<(o.halfWidth||o.r)+15&&Math.abs(p.y-o.y)<(o.halfLength||o.r)+32))continue;
  if([-12,0,12].every(dx=>[-28,0,28].every(dy=>surfaceAt(g,p.x+dx,p.y+dy).dirt===0)))return p;
 }
 return null;
}

test('100m route has clean pavement at both ends and all required terrain and obstacles',()=>{
 const g=createGame('leather',42); assert.equal(ROAD.length/200,100);
 assert.equal(surfaceAt(g,g.feet[0].x,g.feet[0].y).type,'dry'); assert.equal(surfaceAt(g,450,ROAD.finish+100).type,'dry');
 const types=new Set(g.street.patches.map(p=>p.type)); for(const t of ['water','mud','oil','gum','poop','metal','gravel','stone','clay','tar','cement','algae']) assert.ok(types.has(t));
 for(const t of ['barrier','bollard']) assert.ok(g.street.obstacles.some(o=>o.type===t));
 assert.equal(g.street.sections.length,31);
 for(const section of g.street.sections) {
  assert.ok(cleanFoothold(g,section),'each encounter leaves a shoe-sized clean foothold');
  assert.ok(g.street.patches.some(p=>(MATERIALS[p.type].liquid||p.groundField)&&Math.abs(p.y-section.y)<100+p.ry),'each encounter has physical terrain within reach, including its near edge');
 }
 assert.ok(g.street.patches.every(p=>p.y>ROAD.start&&p.y<ROAD.finish));
 assert.ok(g.street.patches.filter(p=>p.type==='mud').every(p=>p.x<160||p.x>740||p.groundField||p.hoseSilt||p.bootprint||p.gardenSpill||p.leafMat),'mud belongs to gutters, washouts, tracked bootprints or a visible roadside source');
});
test('seeds reproduce a street but every new random seed changes obstacles and puddles',()=>{
 const a=createGame('leather',123),b=createGame('leather',123),c=createGame('leather',456);
 assert.deepEqual(a.street.patches,b.street.patches); assert.notDeepEqual(a.street.patches,c.street.patches); assert.notDeepEqual(a.street.obstacles,c.street.obstacles);
 const signatures=new Set(Array.from({length:20},()=>JSON.stringify(createGame().street.obstacles))); assert.equal(signatures.size,20);
});
test('charging only cocks the foot; release launches it and longer charge takes a longer stride',()=>{
 const short=fixture(),long=fixture(), support={...long.feet[1]};
 assert.ok(beginStep(long)); aimStep(long,{x:0,y:100}); tick(long,1.15); assert.ok(long.feet[0].y<1005); assert.ok(long.feet[0].z>10);
 assert.equal(long.feet[1].y,support.y); assert.equal(long.feet[1].x,support.x); releaseStep(long); tick(long,.2); assert.ok(long.feet[0].z>20); tick(long,1.1);
 step(short,.15); assert.ok(long.feet[0].y-short.feet[0].y>80); assert.equal(long.active,1);
});
test('aim vector chooses a direction without teleportation or unlimited reach',()=>{
 const g=fixture(); beginStep(g); aimStep(g,{x:-100000,y:100000}); tick(g,2);
 const p=predictedTarget(g); assert.ok(p.x<g.feet[0].x); assert.ok(p.y>g.feet[0].y); releaseStep(g); tick(g,1.3);
 const f=g.feet[0],s=g.feet[1]; assert.ok(Math.hypot((f.x-s.x)/185,(f.y-s.y)/220)<1.03); assert.ok(f.x>=ROAD.left&&f.x<=ROAD.right);
});
test('cancel and pause do not accidentally launch a charged step or accumulate dirt',()=>{
 const g=fixture('mud'); beginStep(g); tick(g,.5); cancelStep(g); assert.equal(g.feet[0].z,0); assert.equal(g.mode,'idle');
 g.phase='paused'; const before=JSON.stringify([g.time,g.feet[0].x,condition(g)]); tick(g,10); assert.equal(JSON.stringify([g.time,g.feet[0].x,condition(g)]),before);
});
test('stains accumulate locally with material-specific color rather than fixed damage',()=>{
 const g=fixture(),f=g.feet[0]; stainAt(g,f,f.x,f.y+25,5,2,'mud'); const first=condition(g,0); assert.ok(first<100&&first>90); assert.equal(condition(g,1),100);
 for(let i=0;i<100;i++) stainAt(g,f,f.x,f.y+25,5,2,'mud'); assert.ok(condition(g,0)>90);
 const mudIndex=f.stain.findIndex(n=>n>.01); assert.ok(f.tint[mudIndex*3]>f.tint[mudIndex*3+2]);
 const gum=fixture(); stainAt(gum,gum.feet[0],420,1025,5,2,'gum'); const gi=gum.feet[0].stain.findIndex(n=>n>.01); assert.ok(gum.feet[0].tint[gi*3+2]>100);
});
test('left/right silhouette masks mirror while world-space contact stays on the correct side',()=>{
 const g=fixture(); const mask=Array(GRID.width*GRID.height).fill(0); for(let y=0;y<GRID.height;y++)for(let x=GRID.width/2;x<GRID.width;x++)mask[y*GRID.width+x]=1; setShoeMask(g,mask);
 for(const f of g.feet){f.angle=0;stainAt(g,f,f.x+10,f.y,3,2);}
 assert.ok(condition(g,0)<100); assert.equal(condition(g,1),100);
});
test('water depth and fabric control absorption, dry ground stays clean',()=>{
 const shallow=fixture('water',{depth:3}),deep=fixture('water',{depth:25}),canvas=fixture('water',{depth:25}),dry=fixture(); canvas.shoeId='canvas';
 for(const g of [shallow,deep,canvas,dry])tick(g,2);
 assert.ok(condition(shallow)>condition(deep)); assert.ok(condition(deep)>condition(canvas)); assert.equal(condition(dry),100);
});
test('mud impact emits ballistic splashes, local marks and denim stains with bounded particles',()=>{
 const g=fixture('mud'),f=g.feet[0],water=surfaceAt(g,f.x,f.y);
 emitSplash(g,f,water,400); assert.ok(g.particles.length>10); assert.ok(f.jeans.length>0); assert.ok(condition(g,0)<100);
 for(let i=0;i<20;i++) emitSplash(g,f,water,400); assert.ok(g.particles.length<=260); assert.ok(f.jeans.length<=70);
 tick(g,3); assert.equal(g.particles.length,0); assert.ok(g.smears.length<=180);
});
test('gum and poop adhere to the foot and leave different visible residues',()=>{
 for(const type of ['gum','poop']) {const g=fixture(type,{rx:250,ry:250,depth:12}); step(g,.15); assert.ok(g.feet[0].sticky>.5); assert.equal(g.feet[0].stickyType,type); assert.ok(condition(g,0)<100);}
});
test('wet manholes and oil have less grip than dry asphalt; gum has more',()=>{
 const dry=surfaceAt(fixture(),420,1000).grip;
 assert.ok(surfaceAt(fixture('metal'),420,1000).grip<dry); assert.ok(surfaceAt(fixture('oil'),420,1000).grip<dry); assert.ok(surfaceAt(fixture('gum'),420,1000).grip>dry);
});
test('a launched toe cannot pass through a solid bollard',()=>{
 const g=fixture(); const obstacle={x:420,y:1110,r:38,height:300,type:'bollard',solid:true}; g.street.obstacles=[obstacle]; indexStreet(g.street);
 beginStep(g); tick(g,1.15); releaseStep(g); let collided=false;
 for(let i=0;i<180;i++){advance(g,1/120); if(g.events.some(e=>e.type==='bump'))collided=true;}
 assert.ok(collided); assert.ok(g.feet[0].y<obstacle.y); const toe=footPoint(g.feet[0],0,25); assert.ok(Math.hypot(toe.x-obstacle.x,toe.y-obstacle.y)>=obstacle.r+10);
});
test('fixed-step motion and dirt are consistent at 30, 60 and 120 FPS',()=>{
 const outcomes=[];for(const fps of [30,60,120]){const g=fixture('mud');beginStep(g);aimStep(g,{x:-30,y:100});tick(g,.8,fps);releaseStep(g);tick(g,1.2,fps);outcomes.push([g.feet[0].x,g.feet[0].y,condition(g)]);}
 for(let i=1;i<outcomes.length;i++)outcomes[0].forEach((v,k)=>assert.ok(Math.abs(v-outcomes[i][k])<.001));
});
test('a planted shoe on the welcome mat ends the walk exactly once',()=>{
 const g=fixture();g.feet[0].y=ROAD.finish-53;g.feet[1].y=ROAD.finish-180;tick(g,.1);assert.equal(g.phase,'walking');
 g.feet[0].y=ROAD.finish-40;tick(g,1);assert.equal(g.phase,'finished');assert.equal(progress(g),1);assert.equal(g.events.filter(e=>e.type==='finished').length,1);assert.equal(score(g),10000);
 const before=JSON.stringify(g.feet);tick(g,5);assert.equal(JSON.stringify(g.feet),before);
});
test('an outside approach or a long stride past the mat still reaches home',()=>{
 const g=fixture();g.feet.forEach((f,i)=>Object.assign(f,{x:200+i*60,y:ROAD.finish+20}));tick(g,.1);assert.equal(g.phase,'finished');
 const airborne=fixture();airborne.feet[0].y=ROAD.finish;airborne.feet[1].y=ROAD.finish-170;beginStep(airborne);tick(airborne,.1);assert.equal(airborne.phase,'walking');
});
test('spatial lookup stays local on a full route',()=>{
 const g=createGame('leather',44);let maximum=0;for(const bin of g.street.bins.values())maximum=Math.max(maximum,bin.patches.length+bin.obstacles.length);
 assert.ok(g.street.patches.length>=28);assert.ok(maximum<25);assert.ok(g.street.bins.size<100);
});

test('starting and finishing shoes stand entirely on clean pavement',()=>{
 for(const seed of [1,42,321]) {
  const g=createGame('leather',seed);
  for(const x of [ROAD.left,220,450,700,ROAD.right]) for(const y of [ROAD.start-45,ROAD.start+65,PAVEMENT.startEnd, PAVEMENT.finishStart,ROAD.finish-45,ROAD.finish+100]) {
   const surface=surfaceAt(g,x,y);
   assert.equal(surface.type,'dry'); assert.equal(surface.dirt,0); assert.equal(surface.depth,0);
  }
  g.phase='walking'; tick(g,2); assert.equal(condition(g),100);
  step(g,.2); assert.equal(condition(g),100); assert.equal(g.stylePoints,0,'safe entrance is not a source of streak points');
 }
});
test('planting never obstructs the street, parking changes sides, and paired posts leave an entrance',()=>{
 for(const seed of [42,321,9182]) {
  const g=createGame('leather',seed),bushes=g.street.obstacles.filter(o=>o.type==='bush'),posts=g.street.obstacles.filter(o=>o.type==='bollard');
  assert.equal(bushes.length,0,'vegetation belongs to the property edge, not street obstacles');
  assert.equal(g.street.parking.length,7);
  const cars=g.street.districts[1].street.parking;assert.equal(cars.length,3);assert.equal(cars[0].side,cars[2].side);assert.notEqual(cars[0].side,cars[1].side);
  assert.equal(posts.length,6);const entrance=posts.filter(o=>o.y===ROAD.start+630);assert.equal(entrance.length,2);assert.ok(entrance[1].x-entrance[0].x>300);
  assert.ok(posts.every(o=>o.x>ROAD.left&&o.x<ROAD.right));
 }
});


test('a clean forward landing earns a streak and dirt breaks it',()=>{
 const g=fixture(); suggestStep(g); takeStep(g); tick(g,1.2);
 assert.equal(g.chain,1); assert.ok(g.stylePoints>0); assert.ok(g.events.some(e=>e.type==='clean'));
 const target=g.feet[1]; g.street=indexStreet({seed:123,patches:[patch('mud',target.x,target.y+150,{rx:350,ry:450})],obstacles:[],clutter:[]});
 suggestStep(g); takeStep(g); tick(g,1.2); assert.equal(g.chain,0); assert.equal(g.bestChain,1);
});
test('shuffling backward cannot farm clean-step points',()=>{
 const g=fixture();
 step(g,.25,{x:0,y:-100}); step(g,.25,{x:0,y:-100}); assert.equal(g.stylePoints,0);
 g.feet.forEach(f=>f.bestY=2000); step(g,.5); assert.equal(g.stylePoints,0);
});
test('parked car body blocks feet along its full length',()=>{
 const g=fixture(); g.feet[0].x=400; g.feet[1].x=500;
 g.street.obstacles=[{type:'car',x:420,y:1190,r:100,ry:190,halfWidth:100,halfLength:190,height:220,solid:true}]; indexStreet(g.street);
 step(g,.8); const f=g.feet[0];
 assert.ok(f.x<=304||f.x>=536||f.y<=984||f.y>=1396,'shoe stays outside the car body');
});
test('every generated 100m course leaves a clean foothold in each encounter',()=>{
 for(let seed=1;seed<=50;seed++) {
  const g=createGame('leather',seed);
  for(const section of g.street.sections) assert.ok(cleanFoothold(g,section),`seed ${seed}, ${section.stage}/${section.kind}: clean foothold`);
  assert.equal(g.street.parking.length,7);
 }
});

test('direct placement lands on the selected dry footprint without charge timing',()=>{
 for(const delay of [0,.3,3]) {
  const g=fixture(),p=planStep(g,{x:390,y:1120}); tick(g,delay);
  assert.equal(g.feet[0].y,1000,'aiming does not move the foot');
  assert.ok(takeStep(g)); assert.equal(takeStep(g),false,'a stride cannot be queued accidentally');
  tick(g,1.2); assert.equal(g.steps,1); assert.equal(g.active,1);
  assert.ok(Math.hypot(g.feet[0].x-p.x,g.feet[0].y-p.y)<1,'dry landing matches its preview');
  assert.equal(condition(g),100);
 }
});
test('placement preview clamps unreachable clicks and keeps left and right feet on their own sides',()=>{
 const g=fixture();
 for(const active of [0,1]) for(const x of [-1000,420,450,480,2000]) {
  g.active=active;const p=planStep(g,{x,y:10000}),support=g.feet[1-active];
  assert.equal(p.limited,true);assert.ok(p.x>=ROAD.left&&p.x<=ROAD.right);
  assert.ok(active?p.x>=support.x+27:p.x<=support.x-27);
  assert.ok(Math.hypot((p.x-support.x)/185,(p.y-support.y)/220)<=1.001);
 }
 assert.equal(planStep(g,{x:NaN,y:1000}),null);
});
test('cancelled, paused and zero-length placement cannot launch a step',()=>{
 const g=fixture();planStep(g,g.feet[g.active]);assert.equal(takeStep(g),false);
 suggestStep(g);cancelStep(g);assert.equal(takeStep(g),false);
 suggestStep(g);g.phase='paused';assert.equal(takeStep(g),false);tick(g,1);assert.equal(g.steps,0);
});
test('direct placement warns about obstacles in the stride and still collides with them',()=>{
 const g=fixture();g.street.obstacles=[{type:'bollard',x:420,y:1090,r:18,height:90,solid:true}];indexStreet(g.street);
 const p=planStep(g,{x:420,y:1180});assert.equal(p.blocked,true);
 takeStep(g);tick(g,1.2);assert.ok(g.events.some(e=>e.type==='bump'));assert.ok(g.feet[0].y<1090);
 const bumps=g.events.filter(e=>e.type==='bump');assert.equal(bumps.length,1);
 assert.equal(bumps[0].side,0);assert.equal(bumps[0].obstacle,'bollard');assert.ok(bumps[0].force>0&&bumps[0].force<=1);
 assert.ok(g.feet[0].bump.ny<-.9);assert.ok(Math.abs(Math.hypot(g.feet[0].bump.nx,g.feet[0].bump.ny)-1)<1e-10);
 assert.equal(condition(g),100,'contact feedback does not invent dirt');
});
test('precise foot placement preserves local dirt and slipperier oil landings',()=>{
 const outcomes=[];
 for(const type of ['dry','water','oil']) {
  const g=fixture(type,{y:1120,rx:200,ry:200});const p=planStep(g,{x:390,y:1120});
  assert.equal(p.material,type);takeStep(g);tick(g,1.2);
  outcomes.push({error:Math.hypot(g.feet[0].x-p.x,g.feet[0].y-p.y),clean:condition(g)});
 }
 assert.equal(outcomes[0].clean,100);assert.ok(outcomes[1].clean<100);assert.ok(outcomes[2].clean<outcomes[1].clean);
 assert.ok(outcomes[2].error>outcomes[0].error);
});
test('direct placement is consistent at 30, 60 and 120 frames per second',()=>{
 const outcomes=[];
 for(const fps of [30,60,120]) {const g=fixture('water',{rx:250,ry:250});takeStep(g,{x:390,y:1120});tick(g,1.2,fps);outcomes.push([g.feet[0].x,g.feet[0].y,condition(g)]);}
 for(let i=1;i<outcomes.length;i++)outcomes[0].forEach((v,k)=>assert.ok(Math.abs(v-outcomes[i][k])<.001));
});
test('alternating long strides keep landing at the preview when the trailing foot starts behind',()=>{
 const g=fixture();
 for(let n=0;n<8;n++) {
  const side=g.active,p=suggestStep(g);takeStep(g);tick(g,1.2);
  assert.ok(Math.hypot(g.feet[side].x-p.x,g.feet[side].y-p.y)<1,`stride ${n+1} stays precise`);
 }
});

test('the landing preview catches a wet toe between the old nine sample points',()=>{
 const g=fixture();
 g.street=indexStreet({seed:123,patches:[patch('water',420,1155+SHOES.leather.length*.45,{rx:3,ry:3})],obstacles:[],clutter:[]});
 const target=planStep(g,{x:420,y:1155});
 assert.equal(target.material,'water'); assert.ok(target.risk>0);
 assert.ok(target.wetFraction>0&&target.wetFraction<.18,'small toe contact is a wet edge');
});
test('transparent parts of a shoe never produce false landing warnings',()=>{
 const g=fixture(); const mask=Array(GRID.width*GRID.height).fill(0);
 for(let y=20;y<36;y++)for(let x=9;x<15;x++)mask[y*GRID.width+x]=1;
 setShoeMask(g,mask);
 g.street=indexStreet({seed:123,patches:[patch('water',420,1155+SHOES.leather.length*.45,{rx:3,ry:3})],obstacles:[],clutter:[]});
 const target=planStep(g,{x:420,y:1155});
 assert.equal(target.material,'dry'); assert.equal(target.wetFraction,0);
});
test('soaking reports the affected foot and clears on dry ground or when lifted',()=>{
 const g=fixture('water',{rx:30}); const left=g.feet[0],right=g.feet[1];
 tick(g,.2); assert.equal(left.exposure,'water'); assert.equal(right.exposure,'dry');
 assert.equal(left.dirtSource,'water'); assert.ok(left.dirtAt>0); assert.equal(right.dirtAt,-10);
 left.z=40; tick(g,.1); assert.equal(left.exposure,'dry');
 left.z=0; left.y=1400; const clean=condition(g,0); tick(g,.2);
 assert.equal(left.exposure,'dry'); assert.equal(condition(g,0),clean);
});
test('splash stains retain their source without claiming ongoing ground contact',()=>{
 const g=fixture(),f=g.feet[1];
 stainAt(g,f,f.x,f.y,8,1,'oil');
 assert.equal(f.dirtSource,'oil'); assert.equal(f.dirtAt,g.time); assert.equal(f.exposure,'dry');
 assert.equal(g.feet[0].dirtSource,'dry');
});
test('a wet toe cannot earn a clean-step bonus even when most of the shoe is dry',()=>{
 const g=fixture();
 g.street=indexStreet({seed:123,patches:[patch('water',420,1155+SHOES.leather.length*.45,{rx:3,ry:3})],obstacles:[],clutter:[]});
 takeStep(g,{x:420,y:1155}); tick(g,1.2);
 assert.equal(g.steps,1); assert.equal(g.cleanSteps,0); assert.equal(g.stylePoints,0);
 assert.ok(condition(g,0)<100);
});


test('backtracking and negligible or stationary placements remain invalid for either foot',()=>{
 const g=fixture();
 for(const side of [0,1]) {
  g.active=side;const f=g.feet[side],support=g.feet[1-side],before=g.feet.map(f=>({x:f.x,y:f.y}));
  for(const x of [200,420,480,700])for(const y of [f.y-150,f.y-1]) {
   const p=planStep(g,{x,y});assert.equal(p.valid,false);assert.equal(p.backward,true);assert.equal(takeStep(g),false);
  }
  assert.equal(planStep(g,{x:f.x,y:Math.max(f.y,support.y)}).valid,false);
  assert.deepEqual(g.feet.map(f=>({x:f.x,y:f.y})),before);assert.equal(g.steps,0);
  const next=suggestStep(g);assert.equal(next.valid,true);assert.ok(next.y>Math.max(f.y,support.y)+24);
 }
});
test('a rejected backward step can be re-aimed forward without trapping the player',()=>{
 const g=fixture();assert.equal(takeStep(g,{x:400,y:900}),false);
 assert.equal(takeStep(g,{x:390,y:1140}),true);tick(g,1.2);
 assert.equal(g.steps,1);assert.ok(g.feet[0].y>1139);assert.equal(g.active,1);
});

 test('five independently seeded neighborhoods cover the full route without internal pavement aprons',()=>{
 const g=createGame('leather',42);
 assert.equal(g.street.districts.length,5);
 assert.equal(new Set(g.street.districts.map(d=>d.street.seed)).size,5);
 for(const key of ['patches','obstacles']) assert.equal(new Set(g.street[key].map(p=>p.id)).size,g.street[key].length);
 for(const d of g.street.districts){
  const sections=g.street.sections.filter(s=>s.y>=d.offset&&s.y<d.offset+DISTRICT_LENGTH);
  assert.equal(d.offset,ROAD.start+d.index*DISTRICT_LENGTH);assert.equal(d.profile,DISTRICTS[d.index]);
  assert.equal(sections.length,[7,6,6,5,7][d.index]);assert.ok(sections.at(-1).y>d.offset+3400);
  assert.equal(g.street.parking.filter(p=>p.y>=d.offset&&p.y<d.offset+DISTRICT_LENGTH).length,[1,3,1,0,2][d.index]);
  const wet=d.street.patches.find(p=>p.type==='water'&&p.x>160&&p.x<740);
  assert.equal(surfaceAt(g,wet.x,wet.y+d.offset).type,'water');
  if(!d.last)assert.equal(g.street.obstacles.filter(o=>o.type==='bollard'&&o.y===d.offset+DISTRICT_LENGTH-180).length,0);
 }
 g.feet.forEach((f,i)=>f.y=ROAD.start+4000+i*20);g.phase='walking';tick(g,.1);
 assert.equal(g.phase,'walking');assert.equal(progress(g),.2);
 });

test('district names change at the five 20m boundaries, including the exact finish',()=>{
 for(let i=0;i<5;i++){
  assert.equal(districtAt(ROAD.start+i*DISTRICT_LENGTH).id,DISTRICTS[i].id);
  assert.equal(districtAt(ROAD.start+(i+1)*DISTRICT_LENGTH-.01).id,DISTRICTS[i].id);
 }
 assert.equal(districtAt(ROAD.start-100),DISTRICTS[0]);
 assert.equal(districtAt(ROAD.finish+100),DISTRICTS[4]);
});

test('each district asks for a different kind of footwork on every street variation',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed),[doorsteps,parking,works,flooded,home]=g.street.districts.map(d=>d.street);
  assert.ok(doorsteps.patches.some(p=>p.type==='poop'&&p.x===450),'the opening has a small central litter hazard to place a shoe around');
  assert.equal(doorsteps.obstacles.filter(o=>o.type==='barrier').length,0,'the opening teaches foot placement before roadwork turns');
  assert.equal(parking.parking.length,3);assert.notEqual(parking.parking[0].side,parking.parking[1].side);
  assert.ok(parking.sections.filter(s=>s.kind==='squeeze').every(s=>parking.patches.some(p=>p.type==='oil'&&p.y<s.y&&p.y>s.y-400)),'engine drips complicate approaching each parked car');
  assert.equal(works.obstacles.filter(o=>o.type==='barrier').length,4);
  assert.equal(works.patches.filter(p=>p.workBed).length,4,'repair beds accompany the chicanes');
  assert.equal(flooded.parking.length,0);assert.equal(flooded.obstacles.filter(o=>o.type==='barrier').length,0);
  assert.ok(flooded.sections.some(s=>s.kind==='double-runoff'));assert.equal(flooded.sections.filter(s=>s.kind==='drain-chain').length,2);
  for(const kind of ['crown','drain-chain','fork','runoff','squeeze','works-in','works-out'])assert.ok(home.sections.some(s=>s.kind===kind),'the finale combines the learned choices');
 }
});

test('touchdown identifies concrete, asphalt and each physical surface for footsteps',()=>{
 for(const type of ['concrete','asphalt','water','mud','gravel','metal','oil','gum','poop','stone']){
  const g=fixture();const y=type==='concrete'?400:1120;
  if(type==='concrete')g.feet.forEach((f,i)=>{f.y=280-i*20;});
  if(!['concrete','asphalt'].includes(type))g.street=indexStreet({...g.street,patches:[patch(type,420,y,{rx:100,ry:120,depth:20})]});
  takeStep(g,{x:420,y});tick(g,1);
  const hits=g.events.filter(e=>e.type==='land');assert.equal(hits.length,1);
  assert.equal(hits[0].contacts[0].surface,type);assert.equal(hits[0].contacts[0].fraction,1);
 }
});
test('a toe touching water sounds wet even when the shoe centre lands on dry asphalt',()=>{
 const g=fixture();g.street=indexStreet({...g.street,patches:[patch('water',420,1153,{rx:10,ry:10,depth:15})]});
 takeStep(g,{x:420,y:1120});tick(g,1);
 const event=g.events.find(e=>e.type==='land');assert.equal(event.surface,'dry');
 const wet=event.contacts.find(c=>c.surface==='water'),dry=event.contacts.find(c=>c.surface==='asphalt');
 assert.ok(wet.fraction>0&&wet.fraction<.25);assert.ok(wet.depth>0);assert.ok(Math.abs(wet.fraction+dry.fraction-1)<1e-9);
});

test('the enlarged parked car blocks a step into its newly extended nose',()=>{
 for(const seed of [42,321]){
  const g=createGame('leather',seed);g.phase='walking';const car=g.street.obstacles.find(o=>o.type==='car');
  const direction=car.x<450?1:-1,x=car.x+direction*(car.halfWidth-5),front=car.y-car.halfLength;
  g.feet.forEach((f,i)=>{f.x=x+i*60;f.y=front-140-i*20;f.bestY=f.y;});
  const p=planStep(g,{x,y:front+30});assert.equal(p.blocked,true);
  takeStep(g);tick(g,1.2);const f=g.feet[0];
  assert.ok(Math.abs(f.x-car.x)>=car.halfWidth||Math.abs(f.y-car.y)>=car.halfLength);
 }
});
