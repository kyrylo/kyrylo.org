import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,MATERIALS,takeStep,advance,setShoeMask,shoeContainsPoint,condition} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {createStreetMotion,updateStreetMotion,boatPose} from '../street-motion.js';
import {createNeighborhood} from '../neighborhood.js';

function fixture(type,{y=1000,rx=45,ry=44,depth=10}={}){
 const g=createGame('leather',321);g.phase='walking';setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:860-i*20,bestY:860-i*20}));
 const p={id:0,type,x:420,y,rx,ry,depth,cos:1,sin:0,seed:4,dirt:MATERIALS[type].dirt};
 g.street=indexStreet({...g.street,patches:type==='dry'?[]:[p],obstacles:[],clutter:[],districts:undefined});return g;
}
function step(g,x=420,y=1000,fps=120){assert.ok(takeStep(g,{x,y}));for(let i=0;i<fps;i++)advance(g,1/fps);assert.equal(g.mode,'idle');}
test('a landing presses only the touched material; clean pavement never receives a fake muddy stamp',()=>{
 for(const type of ['dry','water','mud','oil','gravel','gum','poop','metal']){
  const g=fixture(type);step(g);
  if(type==='dry'){assert.equal(g.groundContacts.length,0);assert.equal(g.prints.length,0);continue;}
  assert.equal(g.groundContacts.length,1);const mark=g.groundContacts[0];assert.equal(mark.kind,type);
  assert.ok(mark.points.length>16);assert.ok(mark.zones.every(n=>n>=0&&n<=1));
  assert.equal(mark.pieces.length>0,['mud','gravel','poop'].includes(type));
  assert.equal(g.pressedPatches.size,Number(type==='gum'||type==='poop'));
  const count=g.groundContacts.length;for(let i=0;i<60;i++)advance(g,1/120);
  assert.equal(g.groundContacts.length,count,'standing still does not repeatedly stamp');
 }
});
test('a toe dip creates only a partial pressure mark and transfers only the wet part of its tread',()=>{
 const g=fixture('mud',{y:1025,rx:30,ry:10,depth:6});step(g);
 const mark=g.groundContacts[0];assert.ok(mark);assert.ok(mark.zones.slice(0,2).some(Boolean));
 assert.ok(mark.zones.slice(4).every(n=>n===0));
 step(g,480,1080);step(g,420,1160);
 assert.ok(g.prints.some(p=>p.side===0&&p.zones.slice(0,2).some(z=>z.dirt>0)));
});
test('surface deformation follows real settling slip, survives walking away, and resets with the street',()=>{
 const g=fixture('oil',{rx:120,ry:120});step(g);const mark=g.groundContacts[0];
 assert.ok(Math.hypot(mark.slipX,mark.slipY)>0);assert.equal(mark.x+mark.slipX,g.feet[0].x);
 step(g,480,1150);assert.ok(g.groundContacts.includes(mark));
 const next=createGame();assert.equal(next.groundContacts.length,0);assert.equal(next.pressedPatches.size,0);
});
test('water refills quickly, gritty impressions last longer, and cosmetic marks do not clean shoes',()=>{
 const outcomes=['water','gravel'].map(type=>{const g=fixture(type);step(g);const clean=condition(g);
  g.street=indexStreet({...g.street,patches:[]});for(let i=0;i<1200;i++)advance(g,1/120);
  assert.equal(condition(g),clean);return g.groundContacts.length;});
 assert.deepEqual(outcomes,[0,1]);
});
test('pressure, displaced grains and footprints are independent of display rate',()=>{
 const run=fps=>{const g=fixture('gravel');step(g,420,1000,fps);step(g,480,1100,fps);return {marks:g.groundContacts,prints:g.prints,clean:condition(g)};};
 assert.deepEqual(run(30),run(120));assert.deepEqual(run(60),run(120));
});
test('only grounded silhouette contact crushes paper; a pass overhead and a near miss leave it afloat',()=>{
 const g=fixture('water'),s=createStreetMotion([{x:420,y:1000,angle:0}],65,0,0),f=g.feet[0];
 Object.assign(f,{x:420,y:1000,z:20,angle:0});updateStreetMotion(s,g);assert.equal(s.boats[0].crushedAt,null);
 Object.assign(f,{x:465,z:0});g.time=.1;updateStreetMotion(s,g);assert.equal(s.boats[0].crushedAt,null);
 Object.assign(f,{x:420});assert.ok(shoeContainsPoint(g,f,420,1000));
 g.time=.2;updateStreetMotion(s,g);assert.equal(s.boats[0].crushedAt,.2);assert.equal(s.events.length,1);
 const pose=boatPose(s.boats[0],.2,0);f.x=600;g.rings=[{x:420,y:1000,radius:100,strength:2}];
 for(let i=3;i<60;i++){g.time=i/10;updateStreetMotion(s,g);}
 assert.deepEqual(boatPose(s.boats[0],6,0),pose);assert.equal(s.events.length,1,'paper never re-inflates or repeatedly crunches');
 assert.deepEqual(boatPose(s.boats[0],6,0,true),pose);
});
test('an empty corner of the shoe mask cannot crush a paper hull',()=>{
 const g=fixture('water'),s=createStreetMotion([{x:420,y:1000,angle:0}],65,0,0);
 const tiny=SHOE_MASK.map((_,i)=>i===0);setShoeMask(g,tiny);
 Object.assign(g.feet[0],{x:420,y:1000,z:0,angle:0});updateStreetMotion(s,g);
 assert.equal(s.boats[0].crushedAt,null);
});
test('paper crushing uses district world coordinates, emits once, and resets on a fresh street',()=>{
 const g=createGame('leather',321),n=createNeighborhood();g.phase='walking';setShoeMask(g,SHOE_MASK);n.update(g);
 const boats=n.sceneState().boats,boat=boats.at(-1);assert.ok(boat.y>16000);
 Object.assign(g.feet[0],{x:boat.x,y:boat.y,z:0});g.time=.2;n.update(g);
 assert.ok(n.sceneState().boats.at(-1).crushedAt!==undefined);assert.ok(n.sceneState().boats.slice(0,-1).every(b=>b.crushedAt===undefined));
 assert.equal(n.takeEvents().filter(e=>e.type==='paper').length,1);n.update(g);assert.equal(n.takeEvents().filter(e=>e.type==='paper').length,0);
 n.update(createGame('leather',321));assert.ok(n.sceneState().boats.every(b=>b.crushedAt===undefined));
});
