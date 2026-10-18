import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as model from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {recordRinse,rinsePose} from '../ground-effects.js';

const mark=(coverage=1,kind='water',side=0,born=1)=>({kind,side,born,life:2.8,x:420,y:1000,seed:17,
 zones:[coverage,0,0,0,0,0,0,0],points:[{zone:0,x:412,y:1020}]});
test('washed pigment follows the touched zone and splits between adjoining puddles without duplicating mass',()=>{
 const a=mark(.25),b=mark(.75),dry=mark(1,'gravel'),other=mark(1,'water',1),old=mark(1,'water',0,0);
 const g={groundContacts:[old,a,b,dry,other]},f={side:0,landedAt:1};
 recordRinse(g,f,0,.4,[100,60,30]);recordRinse(g,f,0,.2,[40,90,45]);
 assert.ok(Math.abs(a.wash[0].mass-.15)<1e-12);assert.ok(Math.abs(b.wash[0].mass-.45)<1e-12);
 for(const m of [a,b]){m.wash[0].color.forEach((c,i)=>assert.ok(Math.abs(c-[80,70,35][i])<1e-12));assert.equal(m.wash.filter(Boolean).length,1);assert.equal(m.life,5.6);}
 for(const m of [dry,other,old])assert.equal(m.wash,undefined);
});
test('no removed dirt or no water contact produces no invented wash cloud',()=>{
 const m=mark(),g={groundContacts:[m]},f={side:0,landedAt:1};
 recordRinse(g,f,0,0,[100,60,30]);recordRinse(g,f,7,.2,[100,60,30]);assert.equal(m.wash,undefined);
 const absent={groundContacts:[]};recordRinse(absent,f,0,.5,[100,60,30]);assert.equal(absent.groundContacts.length,0);
});
test('a wisp diffuses and fades at its original contact, expires, and has no travel with reduced motion',()=>{
 const m=mark();recordRinse({groundContacts:[m]},{side:0,landedAt:1},0,.2,[100,60,30]);const w=m.wash[0];
 const early=rinsePose(m,w,.3),late=rinsePose(m,w,3);
 assert.ok(late.rx>early.rx&&late.ry>early.ry);assert.ok(late.alpha<early.alpha);
 assert.ok(Math.hypot(late.x-w.x,late.y-w.y)<7);
 assert.equal(rinsePose(m,w,5.6),null);assert.equal(rinsePose(m,w,-1),null);assert.equal(rinsePose(m,{...w,mass:.001},1),null);
 const {alpha:a,...first}=rinsePose(m,w,.3,true),{alpha:b,...second}=rinsePose(m,w,3,true);
 assert.deepEqual(first,second);assert.ok(b<a);
});

const file=new URL('../model.js',import.meta.url);
const without='const discardRinse=()=>{};\n'+readFileSync(file,'utf8').replace(/recordRinse\(g,f,/g,'discardRinse(g,f,')
 .replace(/from '([^']+)'/g,(_,path)=>`from '${new URL(path,file).href}'`);
const reference=await import('data:text/javascript;base64,'+Buffer.from(without).toString('base64'));
function ground(m,g,type,depth){
 g.street=m.indexStreet({...g.street,obstacles:[],patches:type==='dry'?[]:[{id:0,type,x:450,y:5000,rx:1000,ry:12000,depth,seed:4,cos:1,sin:0}]});
 g.feet.forEach(f=>f.contactPose='');
}
function run(m,type,depth=5,fps=120){
 const g=m.createGame('leather',321);m.setShoeMask(g,SHOE_MASK);g.phase='walking';
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:1000,bestY:1000,angle:0}));
 const step=()=>{assert.ok(m.takeStep(g,{x:g.active?480:420,y:Math.max(...g.feet.map(f=>f.y))+130}));for(let n=0;n<fps;n++)m.advance(g,1/fps);};
 ground(m,g,type,8);step();step();ground(m,g,'water',depth);step();step();
 return g;
}
test('real mud, clay, cement and algae rinses leave their own pigment; deep immersion gives no wash cloud',()=>{
 for(const type of ['mud','clay','cement','algae']){
  const g=run(model,type),clouds=g.groundContacts.flatMap(m=>m.wash?.filter(Boolean)||[]);
  assert.ok(clouds.length>0&&clouds.some(w=>w.mass>.005),type);
  const largest=clouds.toSorted((a,b)=>b.mass-a.mass)[0],color=model.MATERIALS[type].color;
  largest.color.forEach((c,i)=>assert.ok(Math.abs(c-color[i])<5,`${type}: actual washed pigment`));
  assert.equal(run(model,type,24).groundContacts.some(m=>m.wash),false);
 }
});
test('wash feedback preserves exact movement, stains, wetness, footprints, splash events and random state',()=>{
 for(const type of ['mud','clay','cement','algae','tar','oil','gum']){
  const a=run(model,type),b=run(reference,type);
  for(const key of ['feet','steps','mode','phase','prints','particles','rings','events','crumbs'])assert.deepEqual(a[key],b[key],`${type}: ${key}`);
  assert.equal(model.condition(a),reference.condition(b));assert.equal(a.random(),b.random());
 }
});
test('wash mass, colour and placement are identical at 30, 60 and 120 FPS',()=>{
 const samples=[30,60,120].map(fps=>run(model,'clay',5,fps).groundContacts);
 assert.deepEqual(samples[0],samples[1]);assert.deepEqual(samples[1],samples[2]);
});
