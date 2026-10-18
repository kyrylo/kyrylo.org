import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,MATERIALS,advance,takeStep,condition,setShoeMask,shoeHeights,waterRinse,RINSE_DEPTH} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
const sum=a=>a.reduce((n,x)=>n+x,0);
const tick=(g,seconds,fps=120)=>{for(let i=0;i<Math.round(seconds*fps);i++)advance(g,1/fps);};
function ground(g,type,depth=8,extra={}){
 g.street=indexStreet({...g.street,obstacles:[],patches:type==='dry'?[]:[{id:0,type,x:450,y:5000,rx:1000,ry:12000,depth,seed:4,cos:1,sin:0,...extra}]});
 g.feet.forEach(f=>f.contactPose='');
}
function step(g,target,fps=120){
 assert.ok(takeStep(g,target||{x:g.active?480:420,y:Math.max(...g.feet.map(f=>f.y))+130}));
 tick(g,1,fps);
 assert.equal(g.mode,'idle');
}
function dirty(type='mud',count=6){
 const g=createGame('leather',321);g.phase='walking';setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:1000,bestY:1000,angle:0}));
 ground(g,type,type==='tar'?3:8);for(let n=0;n<count;n++)step(g);return g;
}
test('rinsing has a shallow sweet spot and no benefit beyond the soaking depth',()=>{
 assert.equal(waterRinse(0),0);assert.equal(waterRinse(RINSE_DEPTH.full),1);assert.equal(waterRinse(5),1);
 assert.ok(waterRinse(9)>0&&waterRinse(9)<1);assert.equal(waterRinse(RINSE_DEPTH.soak),0);assert.equal(waterRinse(35),0);
});
test('a shallow-water landing removes some mud and clumps while retaining bound stains',()=>{
 const g=dirty(),before=condition(g),mass=sum(g.feet[0].deposits);
 ground(g,'water',5);step(g);step(g);
 assert.ok(condition(g)>before+3,`${before} -> ${condition(g)}`);
 assert.ok(condition(g)<before+18,'one pair of rinses is a modest recovery');
 assert.ok(sum(g.feet[0].deposits)<mass);
 for(const f of g.feet){assert.ok(f.sole.some(z=>z.stain>0));for(let i=0;i<f.stain.length;i++)assert.ok(f.stain[i]+1e-6>=f.permanentStain[i]);}
});
test('tar and oil resist rinsing much more than loose grit and mud',()=>{
 const gains={};
 for(const type of ['mud','gravel','clay','tar','oil','gum','cement','algae']){
  const g=dirty(type),before=condition(g);ground(g,'water',5);step(g);step(g);gains[type]=condition(g)-before;
  if(['tar','oil','gum'].includes(type))assert.ok(g.feet.some(f=>f.sole.some(z=>z.stainType===type)),'water preserves the remaining pigment colour');
 }
 assert.ok(gains.mud>3&&gains.gravel>3,JSON.stringify(gains));
 assert.ok(gains.tar<.5&&gains.oil<.5&&gains.gum<=0,JSON.stringify(gains));
 assert.ok(gains.clay>gains.tar+2&&gains.algae>gains.oil+2,JSON.stringify(gains));
});
test('deep water soaks the shoe higher and adds dirt instead of rinsing',()=>{
 const shallow=dirty('mud',2),deep=dirty('mud',2),clean=condition(deep);
 for(const [g,depth] of [[shallow,5],[deep,24]]){ground(g,'water',depth);step(g);step(g);}
 assert.ok(condition(shallow)>clean);assert.ok(condition(deep)<clean);
 const highWet=g=>g.feet.reduce((total,f)=>total+f.wetness.reduce((n,v,i)=>n+(shoeHeights(g,f)[i]>10?v:0),0),0);
 assert.ok(highWet(deep)>highWet(shallow)+100);
});
test('a toe rinse leaves the heel, high upper and opposite shoe alone',()=>{
 const g=dirty(),f=g.feet[g.active],other=g.feet[1-g.active],otherClean=condition(g,other.side);
 const before=[...f.stain],sole=f.sole.map(z=>z.stain),target={x:f.x,y:Math.max(...g.feet.map(f=>f.y))+130};
 ground(g,'water',5,{x:target.x,y:target.y+28,rx:35,ry:15});step(g,target);
 assert.ok(f.sole.slice(0,2).some((z,i)=>z.stain<sole[i]));
 for(let i=2;i<8;i++)assert.ok(f.sole[i].stain>=sole[i]-1e-6);
 for(let i=0;i<f.stain.length;i++)if(shoeHeights(g,f)[i]>5)assert.ok(f.stain[i]>=before[i]-1e-6);
 assert.equal(condition(g,other.side),otherClean);
});
test('the shallow edge cannot rinse one part of a shoe that is also in deep water',()=>{
 const g=dirty(),before=condition(g),f=g.feet[g.active],target={x:f.x,y:Math.max(...g.feet.map(f=>f.y))+130};
 ground(g,'water',24,{x:target.x,y:target.y+30,rx:45,ry:70});step(g,target);
 assert.ok(f.contactWaterDepth>=RINSE_DEPTH.soak);assert.ok(condition(g)<=before);
});
test('waiting in water gives no repeated rinse, and dry walking cannot reset bound stains',()=>{
 const g=dirty();ground(g,'water',5);const before=condition(g);tick(g,8);assert.ok(condition(g)<=before);
 step(g);step(g);const rinsed=condition(g);ground(g,'dry');tick(g,30);assert.ok(condition(g)<=rinsed,'drying never awards a second rinse');
 for(const f of g.feet)assert.ok(f.sole.every(z=>z.permanentStain>0));
});
test('rinsed soles leave weaker muddy tracks, and soaking then drying leaves the waterline stain',()=>{
 const states=[];
 for(const rinse of [false,true]){
  const g=dirty();ground(g,rinse?'water':'dry',5);step(g);step(g);ground(g,'dry');step(g);
  states.push(g.prints.at(-1).zones.reduce((n,z)=>n+z.dirt,0));
 }
 assert.ok(states[1]<states[0]);
 const g=dirty();ground(g,'water',24);step(g);step(g);const clean=condition(g),wet=sum(g.feet[0].wetness);ground(g,'dry');tick(g,35);
 assert.equal(condition(g),clean);assert.ok(sum(g.feet[0].wetness)<wet*.1);
});
test('rinsing, bound pigment and soaking are deterministic at 30, 60 and 120 FPS',()=>{
 const states=[30,60,120].map(fps=>{
  const g=dirty();ground(g,'water',5);step(g,undefined,fps);step(g,undefined,fps);ground(g,'water',24);step(g,undefined,fps);
  return g.feet.map(f=>({stain:[...f.stain],fixed:[...f.permanentStain],deposits:[...f.deposits],wetness:[...f.wetness],sole:f.sole}));
 });
 assert.deepEqual(states[0],states[1]);assert.deepEqual(states[1],states[2]);
});
