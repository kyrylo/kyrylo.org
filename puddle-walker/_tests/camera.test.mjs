import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraTarget,footPose} from '../render.js';
import {SHOES,createGame} from '../model.js';

test('both whole shoes and their touch areas stay on screen through long and gathered stances',()=>{
 for(const [width,height] of [[320,568],[390,844],[768,1024],[1280,720],[1440,480],[1440,600]])for(const shoeId of Object.keys(SHOES))for(const spread of [0,20,52,120,217.7])for(const lead of [0,1]){
  const scale=width/(width<600?760:900),viewH=height/scale;
  const g={shoeId,feet:[{y:9000},{y:9000}]};g.feet[lead].y+=spread;
  const cam=cameraTarget(g,viewH,scale);
  for(const f of g.feet){
   const center=(viewH-f.y+cam)*scale,heel=center+SHOES[shoeId].length*.5*scale;
   assert.ok(heel<=height-24,`${width} × ${height}, spread ${spread}: heel must stay grabbable`);
   assert.ok(center-SHOES[shoeId].length*.5*scale>0,'leading shoe stays visible too');
  }
 }
});
test('normal stance retains the existing camera composition and the opening never scrolls below zero',()=>{
 const g={shoeId:'leather',feet:[{y:260},{y:240}]};
 assert.equal(cameraTarget(g,720/(1280/900),1280/900),160);
 g.feet.forEach(f=>f.y=0);assert.equal(cameraTarget(g,720,1),0);
});
test('contact recoil points away from the obstacle, stays small, and settles without moving the simulated foot',()=>{
 for(const [nx,ny] of [[0,-1],[1,0],[-.6,.8]]){
  const g=createGame(),f=g.feet[0];f.bump={at:1,nx,ny,force:.8};const original=JSON.stringify(f);
  g.time=1;const rest=footPose(g,f,500,false);assert.equal(rest.x,f.x);assert.equal(rest.y,500);
  g.time=1.075;const contact=footPose(g,f,500,false),dx=contact.x-f.x,dy=500-contact.y;
  assert.ok(dx*nx+dy*ny>0);assert.ok(Math.hypot(dx,dy)<3);
  assert.deepEqual(footPose(g,f,500,false),contact,'painting twice cannot accumulate recoil');
  g.time=1.3;assert.deepEqual(footPose(g,f,500,false),rest);assert.equal(JSON.stringify(f),original);
 }
});
test('reduced motion suppresses collision recoil while retaining actual shoe position and lift',()=>{
 const g=createGame(),f=g.feet[0];g.time=1.08;f.z=12;
 const rest=footPose(g,f,500,true);f.bump={at:1,nx:0,ny:-1,force:1};
 assert.deepEqual(footPose(g,f,500,true),rest);assert.equal(rest.y,500-12*.48);
});
