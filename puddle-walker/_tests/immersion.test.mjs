import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../model.js';
import {createNeighborhood} from '../neighborhood.js';
import {createWildlife,updateWildlife,birdPose} from '../wildlife.js';
import {createStreetMotion,updateStreetMotion,boatPose,butterflyPose} from '../street-motion.js';

test('a splash rocks the paper boat once, then buoyancy settles it without affecting the walk',()=>{
 const g=createGame(),s=createStreetMotion([{x:450,y:900,angle:0}],65,0,0),b=s.boats[0];g.phase='walking';
 const ring={x:430,y:900,radius:20,strength:1};g.rings.push(ring);const before=JSON.stringify(g);
 updateStreetMotion(s,g);const impulse=b.vx;assert.ok(impulse>0);assert.equal(JSON.stringify(g),before);
 updateStreetMotion(s,g);assert.equal(b.vx,impulse,'one impulse per ripple, even across repeated paints');
 g.time=.1;updateStreetMotion(s,g);assert.ok(b.dx>0&&b.roll>0);
 g.rings=[];for(let n=2;n<=1200;n++){g.time=n/120;updateStreetMotion(s,g);}
 assert.ok(Math.abs(b.dx)<.001&&Math.abs(b.roll)<.001,'boat comes to rest');
});
test('decorations freeze on pause and reduced motion has no bobbing or flight',()=>{
 const g=createGame(),s=createStreetMotion([{x:450,y:900,angle:.1}],65,0,0);g.phase='paused';
 g.rings=[{x:445,y:900,radius:30,strength:2}];g.feet.forEach(f=>{f.x=65;f.y=1630;});g.time=5;updateStreetMotion(s,g);
 assert.equal(s.boats[0].vx,0);assert.equal(s.cat.wake,0);assert.equal(s.butterflies[0].startledAt,null);
 assert.deepEqual(boatPose(s.boats[0],5,0,true),boatPose(s.boats[0],90,0,true));
 assert.deepEqual(butterflyPose(s.butterflies[0],5,true),butterflyPose(s.butterflies[0],90,true));
});
test('cat wakes to approaching footsteps and settles after they pass; butterfly flight starts continuously',()=>{
 const g=createGame(),s=createStreetMotion([],65,0,1),b=s.butterflies[0];g.phase='walking';
 g.feet.forEach(f=>{f.x=200;f.y=1630;});g.time=.1;
 const before=butterflyPose(b,g.time);updateStreetMotion(s,g);
 assert.equal(b.startledAt,.1);assert.deepEqual(butterflyPose(b,g.time),before);
 for(let i=2;i<=30;i++){g.time=i/10;updateStreetMotion(s,g);}
 assert.ok(s.cat.wake>.99);assert.ok(butterflyPose(b,g.time).height>10);
 g.feet.forEach(f=>{f.y=3000;});for(let i=31;i<=160;i++){g.time=i/10;updateStreetMotion(s,g);}
 assert.ok(s.cat.wake<.001);assert.equal(b.startledAt,.1,'does not repeatedly startle a distant butterfly');
});

test('pigeons react once to nearby shoes, fly away from them, and leave gameplay state untouched',()=>{
 const g=createGame('leather',321),life=createWildlife(g.street),bird=life.birds[0];g.phase='walking';
 updateWildlife(life,g);assert.equal(life.events.length,0);
 g.feet.forEach(f=>{f.x=bird.x+80;f.y=bird.y-60;});g.time=4;
 const original=JSON.stringify(g);updateWildlife(life,g);const count=life.events.length;
 assert.ok(count>0);assert.equal(bird.escapeAt,4);assert.equal(bird.direction,-1);
 assert.equal(JSON.stringify(g),original);
 updateWildlife(life,g);assert.equal(life.events.length,count,'no repeated flutter events');
 const pose=birdPose(bird,4.7);assert.ok(pose.flying&&pose.visible&&pose.z>0&&pose.x<bird.x);
 assert.equal(birdPose(bird,6).visible,false);
});
test('paused birds stay put and reduced motion removes flight animation',()=>{
 const g=createGame('leather',321),life=createWildlife(g.street),bird=life.birds[0];
 g.feet.forEach(f=>{f.x=bird.x;f.y=bird.y;});g.phase='paused';updateWildlife(life,g);assert.equal(bird.escapeAt,null);
 assert.deepEqual(birdPose(bird,1,true),birdPose(bird,100,true));
 g.phase='walking';updateWildlife(life,g);assert.equal(birdPose(bird,g.time+.1,true).visible,false);
});
test('wildlife is reproducible on a retry and flight is independent of render cadence',()=>{
 const run=fps=>{const g=createGame('leather',42),life=createWildlife(g.street),bird=life.birds[0];g.phase='walking';g.feet.forEach(f=>{f.x=bird.x+20;f.y=bird.y-20;});updateWildlife(life,g);
  for(let i=1;i<=fps;i++){g.time=i/fps;updateWildlife(life,g);}return {pose:birdPose(bird,g.time),events:life.events};};
 assert.deepEqual(run(30),run(120));
 const a=createWildlife(createGame('leather',42).street),b=createWildlife(createGame('leather',42).street);assert.deepEqual(a,b);assert.ok(b.birds.every(bird=>bird.escapeAt===null));
});

test('later neighborhoods react at world coordinates without waking the whole street',()=>{
 const g=createGame('leather',321),n=createNeighborhood();g.phase='walking';n.update(g);
 assert.equal(n.sceneState().districts,5);assert.equal(n.wildlifeState().length,15);
 const bird=n.wildlifeState().find(b=>b.y>16000);g.feet.forEach(f=>{f.x=bird.x;f.y=bird.y-30;});
 const before=JSON.stringify(g);n.update(g);assert.equal(JSON.stringify(g),before);
 assert.ok(n.wildlifeState().filter(b=>b.fled).every(b=>b.y>16000));
 assert.ok(n.takeEvents().every(e=>e.y>16000));
 const cat=n.sceneState().cats[4];g.feet.forEach(f=>{f.x=cat.x;f.y=cat.y;});
 for(let i=1;i<20;i++){g.time=i/10;n.update(g);}
 assert.ok(n.sceneState().cats[4].wake>.99);assert.ok(n.sceneState().cats.slice(0,4).every(c=>c.wake===0));
});
test('a ripple in the last neighborhood pushes its boat once and leaves earlier boats still',()=>{
 const outcomes=[];
 for(const keep of [false,true]){
  const g=createGame('leather',321),n=createNeighborhood();g.phase='walking';n.update(g);
  const boat=n.sceneState().boats.at(-1);g.rings=[{x:boat.x-20,y:boat.y,radius:40,strength:1}];n.update(g);
  if(!keep)g.rings=[];
  for(let i=1;i<=20;i++){g.time=i/120;n.update(g);}
  const boats=n.sceneState().boats;assert.ok(boats.at(-1).dx>0);assert.ok(boats.slice(0,-1).every(b=>b.dx===0));outcomes.push(boats);
 }
 assert.deepEqual(outcomes[0],outcomes[1]);
});
