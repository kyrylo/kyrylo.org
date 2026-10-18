import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,setShoeMask,takeStep,advance,condition} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {createLooseDebris,updateLooseDebris,debrisPose} from '../loose-debris.js';
function fixture(type=0,wet=false){
 const g=createGame('leather',321);g.phase='walking';setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:860-i*20,bestY:860-i*20}));
 const clutter=[{x:424,y:1010,type,angle:.2,size:8}];
 const patches=wet?[{id:0,type:'water',x:424,y:1010,rx:70,ry:70,depth:1,seed:4,cos:1,sin:0,dirt:.42}]:[];
 g.street=indexStreet({...g.street,patches,clutter,obstacles:[],parking:[]});return {g,scene:createLooseDebris(g)};
}
function land(g,scene,fps=120){
 assert.ok(takeStep(g,{x:420,y:1000}));
 for(let i=0;i<fps;i++){advance(g,1/fps);updateLooseDebris(scene,g);}
}
test('only an actual grounded sole contact moves loose litter; a pass overhead does nothing',()=>{
 const {g,scene}=fixture();g.feet[0].x=424;g.feet[0].y=1010;g.feet[0].z=25;
 updateLooseDebris(scene,g);assert.equal(scene.items[0].motion,null);
 Object.assign(g.feet[0],{x:420,y:860,z:0});land(g,scene);
 const item=scene.items[0],pose=debrisPose(item,g.time);assert.equal(item.hits,1);assert.ok(item.pressure>.25);
 assert.ok(Math.hypot(pose.x-item.x,pose.y-item.y)>1);
 const before=JSON.stringify(item);for(let i=0;i<20;i++)updateLooseDebris(scene,g);assert.equal(JSON.stringify(item),before);
});
test('a missed leaf and an empty part of the mirrored shoe silhouette stay undisturbed',()=>{
 for(const emptyMask of [false,true]){
  const {g}=fixture();if(emptyMask)setShoeMask(g,SHOE_MASK.map((_,i)=>i===0));else g.street.clutter[0].x=455;
  const scene=createLooseDebris(g);land(g,scene);assert.equal(scene.items[0].hits,0);assert.equal(scene.items[0].motion,null);
 }
});
test('damp leaves move less and stay lower than dry leaves; crushed paper retains its folds',()=>{
 const dry=fixture(),wet=fixture(0,true);land(dry.g,dry.scene);land(wet.g,wet.scene);
 const a=dry.scene.items[0],b=wet.scene.items[0],distance=item=>Math.hypot(item.motion.tx-item.motion.x,item.motion.ty-item.motion.y);
 assert.ok(distance(b)<distance(a));assert.ok(b.motion.height<a.motion.height);assert.ok(b.wet>.3);
 const paper=fixture(5);land(paper.g,paper.scene);const item=paper.scene.items[0],pose=debrisPose(item,paper.g.time+10);
 assert.ok(item.pressure>.25);assert.deepEqual(debrisPose(item,paper.g.time+100),pose);
});
test('pebbles bounce twice and then settle without perpetual rolling',()=>{
 const {g,scene}=fixture(6);land(g,scene);const item=scene.items[0],m=item.motion;
 const v=Math.sqrt(2*900*m.height),flight=2*v/900;
 assert.ok(debrisPose(item,m.at+flight*.5).z>0);
 assert.ok(debrisPose(item,m.at+flight).z<1e-10);
 assert.ok(debrisPose(item,m.at+flight*1.14).z>0);
 assert.equal(debrisPose(item,m.at+m.duration).z,0);
 assert.deepEqual(debrisPose(item,m.at+1),debrisPose(item,m.at+100));
});
test('litter is cosmetic, frame-rate independent and reproducible on a fresh street',()=>{
 const run=fps=>{const {g,scene}=fixture(6);land(g,scene,fps);const before=JSON.stringify(g),clean=condition(g),random=g.random();
  updateLooseDebris(scene,g);assert.equal(JSON.stringify(g),before);assert.equal(condition(g),clean);
  return {item:scene.items[0],pose:debrisPose(scene.items[0],g.time),random};};
 assert.deepEqual(run(30),run(120));assert.deepEqual(run(60),run(120));
 const {g}=fixture();assert.deepEqual(createLooseDebris(g),createLooseDebris(g));assert.equal(createLooseDebris(g).items[0].hits,0);
});
test('pause freezes scenery; reduced motion keeps the settled result without hopping',()=>{
 const {g,scene}=fixture(6);land(g,scene);const item=scene.items[0];
 g.phase='paused';const time=scene.time;g.time+=10;updateLooseDebris(scene,g);assert.equal(scene.time,time);
 const pose=debrisPose(item,item.motion.at+.01,true);assert.equal(pose.z,0);assert.equal(pose.x,item.motion.tx);assert.equal(pose.y,item.motion.ty);
});
test('deep-water litter and verge decoration stay baked; walking-lane litter has one identity',()=>{
 const {g}=fixture();g.street.clutter.push({x:80,y:1010,type:0,size:7,angle:0},{x:440,y:1010,type:4,size:7,angle:0});
 const dry=createLooseDebris(g);assert.equal(dry.items.length,1);assert.ok(dry.sources.has(g.street.clutter[0]));
 g.street.patches=[{id:0,type:'water',x:424,y:1010,rx:70,ry:70,depth:20,seed:4,cos:1,sin:0,dirt:.42}];indexStreet(g.street);
 assert.equal(createLooseDebris(g).items.length,0);
});

test('displaced gravel makes a smaller second bounce; soft clods do not',async()=>{
 const {groundPiecePose}=await import('../ground-effects.js');
 const piece={x:420,y:1000,vx:25,vy:10,lift:52,spin:.2},flight=piece.lift*2/260;
 const first=groundPiecePose(piece,flight*.5,'gravel'),second=groundPiecePose(piece,flight*1.14,'gravel');
 assert.ok(first.z>second.z&&second.z>0);assert.equal(groundPiecePose(piece,flight*1.14,'mud').z,0);
 assert.ok(groundPiecePose(piece,flight,'gravel').z<1e-10);
 assert.deepEqual(groundPiecePose(piece,10,'gravel'),groundPiecePose(piece,100,'gravel'));
 assert.equal(groundPiecePose(piece,flight*.5,'gravel',true).z,0);
});

test('a loose stone pushed into deeper water sinks instead of floating on its surface',()=>{
 const {g}=fixture(6);g.street.patches=[{id:0,type:'water',x:443,y:1010,rx:16,ry:50,depth:20,seed:4,cos:1,sin:0,dirt:.42}];indexStreet(g.street);
 const scene=createLooseDebris(g);assert.equal(scene.items.length,1);
 g.lastLanding={x:411,y:1010,angle:0,side:0,at:1,vx:650,vy:0,force:1.4};g.time=1;updateLooseDebris(scene,g);
 const item=scene.items[0];assert.ok(item.motion);assert.ok(item.motion.sink);assert.equal(debrisPose(item,3).opacity,0);
});
