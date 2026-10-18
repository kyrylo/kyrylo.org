import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,indexStreet,advance,takeStep,condition,setShoeMask} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {walkCarelessly} from './straight-course.mjs';

const settle=g=>{for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);assert.equal(g.mode,'idle');};
const step=g=>{assert.ok(takeStep(g,{x:g.active?480:420,y:Math.max(...g.feet.map(f=>f.y))+130}));settle(g);};
function field(type,depth=12){
 const g=createGame('leather',321);g.phase='walking';setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{y:1000-i*20,bestY:1000-i*20,angle:0}));
 g.street=indexStreet({...g.street,obstacles:[],patches:type==='dry'?[]:[{id:0,type,x:450,y:5000,rx:1000,ry:10000,cos:1,sin:0,seed:4,depth}]});
 return g;
}

test('fast mostly straight walks fully soil the pair early, with only modest recovery before home',t=>{
 for(const seed of [1,42,321,9182]){
  const {g,zeroAt}=walkCarelessly(seed,65,450,true);
  t.diagnostic(JSON.stringify({seed,zeroAt,clean:g.feet.map((_,i)=>condition(g,i))}));
  assert.equal(g.phase,'finished');
  // A late shallow puddle can rinse loose residue, even on a careless walk.
  // The pair must still become completely dirty early and arrive badly stained.
  for(let side=0;side<2;side++)assert.ok(condition(g,side)<20);
  assert.ok(zeroAt>5&&zeroAt<35,`seed ${seed}: careless walking should ruin the pair in the first third`);
 }
});
test('outside lanes and short or long strides cannot bypass the dirt by staying mostly straight',t=>{
 for(const [seed,lane,stride] of [[13,210,65],[77,270,65],[13,630,65],[77,690,65],[7,450,55],[27,450,70]]){
  const {g,zeroAt}=walkCarelessly(seed,stride,lane,true);
  t.diagnostic(JSON.stringify({seed,lane,stride,zeroAt,clean:g.feet.map((_,i)=>condition(g,i))}));
  assert.equal(g.phase,'finished');for(let side=0;side<2;side++)assert.ok(condition(g,side)<20);
  assert.ok(zeroAt>5&&zeroAt<40,`${seed}/${lane}/${stride}: dirt accumulates before home`);
 }
});
test('long strides through the easiest remaining lane and along the gutters still fully soil the pair',()=>{
 for(const [seed,lane] of [[77,270],[31,150],[65535,750]]){
  const {g,zeroAt}=walkCarelessly(seed,70,lane,true);
  assert.equal(g.phase,'finished');assert.equal(condition(g,0),0);assert.equal(condition(g,1),0);
  assert.ok(zeroAt>5&&zeroAt<40);
 }
});
test('the longest dirty strides retain their greater landing pressure instead of capping early',()=>{
 const outcomes=[190,208].map(stride=>{
  const g=field('mud',5);g.feet.forEach(f=>Object.assign(f,{y:1000,bestY:1000}));
  assert.ok(takeStep(g,{x:420,y:1000+stride}));
  for(let i=0;i<240&&g.mode==='flight';i++)advance(g,1/120);
  assert.equal(g.mode,'settling');
  return g.feet[0].sole.reduce((sum,z)=>sum+z.stain,0)/8;
 });
 assert.ok(outcomes[1]>outcomes[0]*1.04,'a heavier landing presses more pigment into the tread');
});
test('careful full-distance routes still qualify for clean races with the actual sneaker silhouette',()=>{
 const witnesses=JSON.parse(readFileSync(new URL('../_notes/designed-route-audit.json',import.meta.url),'utf8'));
 for(const w of witnesses){
  const g=createGame('leather',w.seed);g.phase='walking';setShoeMask(g,SHOE_MASK);
  for(const p of w.route){if(g.phase==='finished')break;assert.ok(takeStep(g,p));settle(g);}
  assert.equal(g.phase,'finished');assert.ok(condition(g)>=95,`seed ${w.seed}: careful route ${condition(g)}`);
 }
});
test('successive deep-water landings add tread stains instead of retaining only the worst previous step',()=>{
 const g=field('water',18);step(g);step(g);const first=condition(g);
 assert.ok(first<85&&first>60,'one deep landing per shoe soaks the upper but does not ruin the entire pair');
 const stains=g.feet.map(f=>f.sole.map(z=>z.stain));
 for(let i=0;i<8;i++)step(g);
 assert.ok(condition(g)<first-10);
 g.feet.forEach((f,i)=>f.sole.forEach((z,j)=>assert.ok(z.stain>stains[i][j])));
});
test('mud is harsher than dirty water, grit remains distinct, and dry pavement stays clean',()=>{
 const values={};
 for(const type of ['mud','water','gravel','dry','metal']){
  const g=field(type);for(let i=0;i<6;i++)step(g);values[type]=condition(g);
 }
 assert.ok(values.mud<values.water);assert.ok(values.water<values.gravel);
 assert.equal(values.dry,100);assert.ok(values.metal>99.5);
});
test('soaked tread can become fully dirty without painting above the physical waterline',()=>{
 const g=field('mud',5);for(let i=0;i<40;i++)step(g);
 assert.equal(condition(g),0);
 for(const f of g.feet)for(let i=0;i<f.stain.length;i++)if(f.heights[i]>12)assert.equal(f.stain[i],0);
});
test('walking from a puddle onto grit collects more dirt and leaves stronger dusty prints than dried soles',()=>{
 const outcomes=[];
 for(const drying of [0,70]){
  const g=field('water',6);step(g);step(g);
  const gravel={...g.street.patches[0],type:'gravel',depth:3};
  g.street=indexStreet({...g.street,patches:[]});
  for(let i=0;i<(2+drying)*120;i++)advance(g,1/120);
  const clean=condition(g);
  g.street=indexStreet({...g.street,patches:[gravel]});g.feet.forEach(f=>f.contactPose='');
  step(g);step(g);
  outcomes.push({loss:clean-condition(g),residue:g.prints.at(-1).zones.reduce((n,z)=>n+z.dirt,0)});
 }
 assert.ok(outcomes[0].loss>outcomes[1].loss*1.2,'wet tread presses in more dust');
 assert.ok(outcomes[0].residue>outcomes[1].residue*1.2,'extra collected dust also transfers to the road');
});
test('a damp toe only increases gravel pickup in the wet tread areas',()=>{
 const dry=field('gravel',3),wet=field('gravel',3);
 wet.feet[0].sole.slice(0,2).forEach(z=>z.wet=1);
 for(const g of [dry,wet])for(let i=0;i<12;i++)advance(g,1/120);
 for(let side=0;side<2;side++)for(let i=0;i<8;i++){
  const a=wet.feet[side].sole[i],b=dry.feet[side].sole[i];
  if(side===0&&i<2){assert.ok(a.stain>b.stain*1.5);assert.ok(a.dirt>b.dirt*1.5);}
  else{assert.equal(a.stain,b.stain);assert.equal(a.dirt,b.dirt);}
 }
});
test('wet soles do not invent dirt on clean pavement or stepping stones',()=>{
 for(const type of ['dry','stone']){
  const g=field(type,3);g.feet.forEach(f=>f.sole.forEach(z=>z.wet=1));
  for(let i=0;i<6;i++)step(g);
  assert.equal(condition(g),100);assert.ok(g.prints.length>0);
  assert.ok(g.prints.every(p=>p.zones.every(z=>z.dirt===0)));
 }
});
