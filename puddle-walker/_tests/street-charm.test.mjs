import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,surfaceAt,SHOES,ROAD} from '../model.js';
import {createNeighborhood} from '../neighborhood.js';
import {createStreetMotion,updateStreetMotion,floatingDuckPose,snailPose,dandelionPose,dandelionSeedPose,DANDELION_SEEDS,biscuitThiefPose,doorstepBalloonPose,workshopHelperPose} from '../street-motion.js';
import {createWildlife,updateWildlife,birdPose} from '../wildlife.js';
import {pinwheelPose} from '../street-charm.js';
function fixture(){
  const g=createGame('leather',321);g.phase='walking';
  const scene=createStreetMotion([],65,0,0,null,{x:450,y:1000});
  return {g,scene,duck:scene.duck};
}
test('one bath toy belongs to real flood water, with space to bob and no changes to the course',()=>{
  for(let seed=1;seed<=30;seed++){
    const g=createGame('leather',seed),n=createNeighborhood(),before=JSON.stringify(g);n.update(g);
    const ducks=n.sceneState().ducks;assert.equal(ducks.length,1,'one encounter, not repeated props');
    const duck=ducks[0];assert.ok(duck.y>12000&&duck.y<16000);
    for(const [dx,dy] of [[0,0],[-20,0],[20,0],[0,-22],[0,22]])assert.equal(surfaceAt(g,duck.x+dx,duck.y+dy).type,'water');
    assert.equal(JSON.stringify(g),before);const retry=createNeighborhood();retry.update(createGame('leather',seed));assert.deepEqual(retry.sceneState().ducks,ducks);
  }
});
test('a planted sneaker gently compresses the duck once; a shoe above or beside it does not',()=>{
  const {g,scene,duck}=fixture();Object.assign(g.feet[0],{x:450,y:1000,z:20,angle:0});g.time=.1;updateStreetMotion(scene,g);assert.equal(duck.nudges,0);
  g.feet[0].z=0;g.feet[0].x+=SHOES.leather.width+20;g.time=.2;updateStreetMotion(scene,g);assert.equal(duck.nudges,0);
  g.feet[0].x=445;const original=JSON.stringify(g);
  updateStreetMotion(scene,g);assert.equal(duck.nudges,1);assert.equal(JSON.stringify(g),original);
  for(let i=3;i<20;i++){g.time=i/10;updateStreetMotion(scene,g);}assert.equal(duck.nudges,1);assert.ok(duck.pressed>.4);
  g.feet[0].y=1250;for(let i=20;i<=60;i++){g.time=i/10;updateStreetMotion(scene,g);}
  assert.ok(duck.pressed<.001);assert.ok(Math.abs(floatingDuckPose(duck,g.time).y-duck.y)<.01);
});
test('a passing ripple nudges the duck only once and paused decorations remain still',()=>{
  const {g,scene,duck}=fixture();g.rings=[{x:425,y:1000,radius:35,strength:1}];g.time=.1;
  g.phase='paused';updateStreetMotion(scene,g);assert.equal(duck.nudgedAt,-99);
  g.phase='walking';updateStreetMotion(scene,g);assert.equal(duck.nudgedAt,.1);
  g.time=.3;updateStreetMotion(scene,g);assert.equal(duck.nudgedAt,.1);assert.ok(floatingDuckPose(duck,.3).x>duck.x+1);
  assert.deepEqual(floatingDuckPose(duck,.3,true),floatingDuckPose(duck,8,true));
});
test('repeated render preparation cannot accelerate duck reactions',()=>{
  const run=repeat=>{const {g,scene,duck}=fixture();g.feet[0].x=445;g.feet[0].y=1000;for(let i=1;i<60;i++){g.time=i/60;for(let n=0;n<repeat;n++)updateStreetMotion(scene,g);}return {pose:floatingDuckPose(duck,g.time),nudges:duck.nudges};};
  assert.deepEqual(run(1),run(4));
});

function pigeonFixture(){
  const g=createGame('leather',321),life=createWildlife(g.street),bird=life.birds[2];g.phase='walking';
  // Isolate reaction tests from the street's unrelated, seeded barriers.
  g.street.obstacles=[];g.feet.forEach(f=>{f.x=bird.x;f.y=bird.y-230;});
  return {g,life,bird};
}
test('a solitary pigeon tries three short steps, then waits instead of endlessly sliding away',()=>{
  const {g,life,bird}=pigeonFixture(),before=JSON.stringify(g);updateWildlife(life,g);
  assert.ok(bird.walk);assert.equal(bird.escapeAt,null);assert.equal(life.events.length,0);
  assert.equal(JSON.stringify(g),before,'a visual encounter never changes the shoes or street');
  for(const time of [.35,.7,1.05])assert.ok(Math.abs(birdPose(bird,time).y-bird.y-54*time/1.05)<1e-8);
  g.time=2;updateWildlife(life,g);const settled=birdPose(bird,g.time);g.time=8;updateWildlife(life,g);
  assert.equal(birdPose(bird,g.time).y,settled.y);assert.equal(bird.walk.at,0);assert.equal(life.events.length,0);
});
test('a continued approach makes the pigeon fly from its current position, exactly once',()=>{
  const {g,life,bird}=pigeonFixture();updateWildlife(life,g);g.time=.45;
  const walking=birdPose(bird,g.time);g.feet.forEach(f=>{f.x=walking.x;f.y=walking.y-75;});
  updateWildlife(life,g);const flying=birdPose(bird,g.time);
  assert.ok(flying.flying);assert.equal(flying.x,walking.x);assert.equal(flying.y,walking.y);
  assert.deepEqual(life.events,[{type:'wings',x:walking.x,y:walking.y}]);
  updateWildlife(life,g);g.time+=.1;updateWildlife(life,g);assert.equal(life.events.length,1);
});
test('the pigeon flies instead of waddling through a solid object, and respects reduced motion',()=>{
  for(const reduced of [false,true]){
    const {g,life,bird}=pigeonFixture();g.reduced=reduced;g.feet.forEach(f=>f.y=bird.y-150);
    g.street.obstacles=[{x:bird.x,y:bird.y+30,halfWidth:35,halfLength:8}];
    g.phase='finished';updateWildlife(life,g);assert.equal(bird.walk,null);assert.equal(bird.escapeAt,null);
    g.phase='walking';updateWildlife(life,g);assert.equal(bird.walk,null);assert.equal(bird.escapeAt,0);
    if(reduced)assert.equal(birdPose(bird,.2,true).visible,false);
  }
});
test('pigeon steps depend on elapsed game time, not repeated paints or refresh rate',()=>{
  const run=(fps,repeats)=>{const {g,life,bird}=pigeonFixture();updateWildlife(life,g);
    for(let i=1;i<=fps*2;i++){g.time=i/fps;for(let n=0;n<repeats;n++)updateWildlife(life,g);}
    return {pose:birdPose(bird,g.time),walk:bird.walk,events:life.events};};
  assert.deepEqual(run(30,1),run(120,3));
});

test('the pinwheel catches gentle gusts without reversing, and stays still with reduced motion',()=>{
  for(const seed of [1,42,321,998]){
    let previous=pinwheelPose(0,seed).angle,slowest=Infinity,fastest=0;
    for(let frame=1;frame<=1800;frame++){
      const pose=pinwheelPose(frame/30,seed),speed=(pose.angle-previous)*30;
      assert.ok(speed>0&&speed<2.22);assert.ok(Math.abs(pose.tilt)<=.018);
      slowest=Math.min(slowest,speed);fastest=Math.max(fastest,speed);previous=pose.angle;
    }
    assert.ok(slowest<.3&&fastest>2.2,'wind slows down and picks back up');
    assert.deepEqual(pinwheelPose(0,seed,true),pinwheelPose(100,seed,true));
    const first=pinwheelPose(4,seed);pinwheelPose(100,seed);assert.deepEqual(pinwheelPose(4,seed),first,'a new walk cannot inherit accumulated rotation');
  }
});

test('one garden snail stays entirely outside the walking lane, including its whole journey',()=>{
  for(let seed=1;seed<=25;seed++){
    const g=createGame('leather',seed),n=createNeighborhood(),before=JSON.stringify(g);n.update(g);
    const snails=n.sceneState().snails;assert.equal(snails.length,1);assert.equal(JSON.stringify(g),before);
    const snail=snails[0];assert.ok(snail.y>2000&&snail.y<4000);
    for(const distance of [0,7,14]){
      const x=snail.x+Math.sign(snail.angle)*distance;
      assert.ok(x+16<ROAD.left||x-16>ROAD.right,'even the tail and feelers stay on the verge');
    }
  }
});
test('the snail retracts near grounded shoes, waits, then cautiously returns without changing gameplay',()=>{
  const g=createGame('leather',321),s=createStreetMotion([],65,0,0,null,null,{x:87,y:1000,direction:-1}),snail=s.snail;g.phase='walking';
  g.feet.forEach(f=>Object.assign(f,{x:135,y:1000,z:25}));g.time=.1;updateStreetMotion(s,g);assert.equal(snail.shy,0);
  g.feet[0].z=0;g.time=.2;const before=JSON.stringify(g);updateStreetMotion(s,g);assert.equal(JSON.stringify(g),before);
  for(let i=3;i<=15;i++){g.time=i/10;updateStreetMotion(s,g);}assert.ok(snail.shy>.999);
  const shyDistance=snail.distance;g.time=1.6;updateStreetMotion(s,g);assert.ok(snail.distance-shyDistance<.001,'tucked-in snail stops crawling');
  g.feet.forEach(f=>f.x=450);for(let i=17;i<=65;i++){g.time=i/10;updateStreetMotion(s,g);}assert.ok(snail.shy<.001);
  for(let i=66;i<=600;i++){g.time=i/10;updateStreetMotion(s,g);}assert.equal(snail.distance,14);assert.equal(snailPose(snail).x,73);
});
test('snail motion freezes outside a walk, respects reduced motion, and repeated paints cannot advance it',()=>{
  const g=createGame('leather',321),s=createStreetMotion([],65,0,0,null,null,{x:87,y:1000,direction:-1});
  g.feet.forEach(f=>Object.assign(f,{x:450,y:1000,z:0}));g.time=1;updateStreetMotion(s,g);assert.equal(s.snail.distance,0);
  g.phase='walking';g.reduced=true;g.time=1.1;updateStreetMotion(s,g);assert.equal(s.snail.distance,0);
  g.reduced=false;g.time=1.2;updateStreetMotion(s,g);const pose=snailPose(s.snail);assert.ok(pose.distance>0);
  for(let i=0;i<8;i++)updateStreetMotion(s,g);assert.deepEqual(snailPose(s.snail),pose);
  g.phase='finished';g.time=2;updateStreetMotion(s,g);assert.deepEqual(snailPose(s.snail),pose);
});

function flowerFixture(){
  const g=createGame('leather',321),s=createStreetMotion([],65,0,0,null,null,null,{x:86,y:1000,direction:1});
  g.phase='walking';Object.assign(g.feet[0],{x:145,y:1000,z:10,vx:0,vy:120});
  return {g,s,flower:s.dandelion};
}
test('one dandelion belongs to the garage paving joint, with its leaves and head outside the road',()=>{
  for(let seed=1;seed<=25;seed++){
    const g=createGame('leather',seed),n=createNeighborhood(),before=JSON.stringify(g);n.update(g);
    assert.equal(n.sceneState().dandelions.length,1);
    const flower=n.sceneState().dandelions[0],garage=n.sceneState().landmarks.find(l=>l.kind==='garage');
    assert.equal(flower.y,garage.y+91);assert.equal(Math.abs(flower.x-garage.x),31);
    assert.ok(flower.x+15<ROAD.left||flower.x-15>ROAD.right);assert.equal(JSON.stringify(g),before);
    const fresh=createNeighborhood();fresh.update(createGame('leather',seed));assert.deepEqual(fresh.sceneState().dandelions,n.sceneState().dandelions);
  }
});
test('only a nearby low moving shoe disturbs the seedhead, once per walk and without altering the game',()=>{
  const {g,s,flower}=flowerFixture();
  for(const change of [{z:80},{z:10,vy:0},{vy:120,x:300}]){
    Object.assign(g.feet[0],change);g.time+=.1;updateStreetMotion(s,g);assert.equal(flower.burstAt,null);
  }
  g.feet[0].x=145;g.time=.5;const before=JSON.stringify(g);updateStreetMotion(s,g);
  assert.equal(flower.burstAt,.5);assert.equal(JSON.stringify(g),before);
  for(let i=1;i<=100;i++){g.time=.5+i/10;updateStreetMotion(s,g);}
  assert.equal(flower.burstAt,.5);assert.equal(dandelionPose(flower,g.time).spent,true);
  assert.equal(dandelionPose(flower,g.time).seedsVisible,false);
  assert.equal(flowerFixture().flower.burstAt,null,'retry restores an untouched flower');
});
test('eight drifting seeds disperse and fade in bounded time, independent of paint frequency',()=>{
  const {g,s,flower}=flowerFixture();g.time=1;updateStreetMotion(s,g);
  assert.equal(DANDELION_SEEDS.length,8);assert.equal(new Set(DANDELION_SEEDS).size,8);
  for(let i=0;i<8;i++){
    const p=dandelionSeedPose(flower,3,i);
    for(let n=0;n<5;n++)assert.deepEqual(dandelionSeedPose(flower,3,i),p);
    assert.ok(p.x>flower.x&&Math.abs(p.x-flower.x)<100);assert.ok(p.z>0&&p.z<20);assert.equal(p.alpha,1);
    assert.ok(dandelionSeedPose(flower,5.7,i).alpha<.1);assert.equal(dandelionSeedPose(flower,5.81,i),null);
  }
  assert.equal(dandelionPose(flower,5.81).seedsVisible,false);
});
test('dandelions stay still in reduced motion and cannot release seeds before starting or after finishing',()=>{
  for(const phase of ['ready','finished']){const {g,s,flower}=flowerFixture();g.phase=phase;updateStreetMotion(s,g);assert.equal(flower.burstAt,null);}
  const {g,s,flower}=flowerFixture();g.reduced=true;g.time=1;updateStreetMotion(s,g);assert.equal(flower.burstAt,null);
  assert.deepEqual(dandelionPose(flower,1,true),dandelionPose(flower,100,true));
  g.reduced=false;g.time=2;updateStreetMotion(s,g);assert.equal(dandelionPose(flower,2.1,true).seedsVisible,false);
  assert.equal(dandelionPose(flower,2.1,true).lean,0);
});

function thiefFixture(){
  const g=createGame('leather',321),s=createStreetMotion([],65,0,0,null,null,null,null,{x:56,y:1000});
  g.phase='walking';g.feet.forEach(f=>Object.assign(f,{x:450,y:800,z:0}));
  return {g,s,thief:s.thief};
}
test('a single biscuit thief and its whole approach stay on the tea-break verge across street seeds',()=>{
  for(let seed=1;seed<=25;seed++){
    const g=createGame('leather',seed),n=createNeighborhood(),before=JSON.stringify(g);n.update(g);
    const thieves=n.sceneState().thieves;assert.equal(thieves.length,1);assert.equal(JSON.stringify(g),before);
    const bird=thieves[0],tea=n.sceneState().landmarks.find(l=>l.kind==='tea-break');
    assert.equal(bird.snack.x,tea.x+1);assert.equal(bird.snack.y,tea.y-43);assert.equal(bird.y,bird.snack.y-76);
    assert.ok(bird.x+12<ROAD.left||bird.x-12>ROAD.right);assert.equal(bird.stage,'waiting');
  }
});
test('the pigeon takes one biscuit, flies away once, and leaves the napkin empty without changing gameplay',()=>{
  const {g,s,thief}=thiefFixture();const before=JSON.stringify(g);updateStreetMotion(s,g);assert.equal(JSON.stringify(g),before);
  assert.equal(thief.startedAt,0);assert.equal(thief.stolen,false);
  g.time=1.3;updateStreetMotion(s,g);assert.equal(biscuitThiefPose(thief,g.time).stage,'pecking');
  g.time=1.6;updateStreetMotion(s,g);assert.equal(thief.stolen,true);assert.equal(biscuitThiefPose(thief,g.time).stage,'holding');
  g.time=2.1;updateStreetMotion(s,g);const flying=biscuitThiefPose(thief,g.time);
  assert.equal(thief.escapeAt,1.85);assert.ok(flying.visible&&flying.carrying&&flying.flying);assert.ok(flying.x<thief.x);
  assert.equal(s.events.filter(e=>e.encounter==='biscuit-thief').length,1);
  g.time=12;const done=JSON.stringify(g);for(let i=0;i<8;i++)updateStreetMotion(s,g);
  assert.equal(JSON.stringify(g),done);assert.equal(biscuitThiefPose(thief,g.time).visible,false);assert.equal(thief.stolen,true);
  assert.equal(s.events.filter(e=>e.encounter==='biscuit-thief').length,1);
});
test('a close grounded shoe interrupts the theft, leaving the biscuit and taking off continuously from the current perch',()=>{
  const {g,s,thief}=thiefFixture();updateStreetMotion(s,g);g.time=.8;
  const pose=biscuitThiefPose(thief,g.time);Object.assign(g.feet[0],{x:145,y:pose.y,z:60});
  updateStreetMotion(s,g);assert.equal(thief.escapeAt,null);
  g.feet[0].z=0;updateStreetMotion(s,g);const launch=biscuitThiefPose(thief,g.time);
  assert.equal(launch.x,pose.x);assert.equal(launch.y,pose.y);assert.equal(launch.angle,pose.angle);
  assert.equal(thief.stolen,false);assert.equal(launch.stage,'startled');
  g.time=8;updateStreetMotion(s,g);assert.equal(thief.stolen,false);assert.equal(biscuitThiefPose(thief,g.time).carrying,false);
});
test('the small theft is tied to game time, resets per walk, and honors phase and reduced motion',()=>{
  const run=(fps,repeats)=>{const {g,s,thief}=thiefFixture();updateStreetMotion(s,g);
    for(let i=1;i<=fps*3;i++){g.time=i/fps;for(let j=0;j<repeats;j++)updateStreetMotion(s,g);}
    return {pose:biscuitThiefPose(thief,3),events:s.events,stolen:thief.stolen};};
  assert.deepEqual(run(30,1),run(120,4));
  for(const phase of ['ready','finished']){const {g,s,thief}=thiefFixture();g.phase=phase;updateStreetMotion(s,g);assert.equal(thief.startedAt,null);}
  const {g,s,thief}=thiefFixture();g.reduced=true;g.time=10;updateStreetMotion(s,g);assert.equal(thief.startedAt,null);
  assert.deepEqual(biscuitThiefPose(thief,10,true),biscuitThiefPose(thief,100,true));
  Object.assign(g.feet[0],{x:145,y:924});updateStreetMotion(s,g);assert.equal(biscuitThiefPose(thief,10,true).visible,false);assert.equal(thief.stolen,false);
  const reset=thiefFixture().thief;assert.equal(reset.startedAt,null);assert.equal(reset.escapeAt,null);assert.equal(reset.stolen,false);
});

function balloonFixture(){
  const g=createGame('leather',321),s=createStreetMotion([],65,0,0,null,null,null,null,null,{x:62,y:1000,direction:1,phase:.7});
  g.phase='walking';Object.assign(g.feet[0],{x:145,y:1000,z:10,vx:0,vy:120});
  return {g,s,balloon:s.balloon};
}
test('one rainy party belongs to No. 28, with its balloon and tether outside the walking lane',()=>{
  for(let seed=1;seed<=25;seed++){
    const g=createGame('leather',seed),n=createNeighborhood(),before=JSON.stringify(g);n.update(g);
    const balloons=n.sceneState().balloons,tiles=n.sceneState().landmarks.find(l=>l.kind==='tiles');
    assert.equal(balloons.length,1);assert.ok(tiles.y>16000);
    const b=balloons[0];assert.equal(b.anchorX,tiles.x);assert.equal(b.anchorY,tiles.y+9);
    assert.equal(b.y,tiles.y+67);assert.equal(b.nudged,false);assert.equal(JSON.stringify(g),before);
    // Include the complete skin silhouette and maximum wake displacement.
    assert.ok(b.x+34<ROAD.left||b.x-34>ROAD.right);
  }
});
test('a low passing shoe stirs the tether once; standing, distant or airborne shoes do not',()=>{
  const {g,s,balloon}=balloonFixture();
  for(const change of [{z:80},{z:10,vy:0},{vy:120,x:300}]){
    Object.assign(g.feet[0],change);g.time+=.1;updateStreetMotion(s,g);assert.equal(balloon.nudgedAt,null);
  }
  g.feet[0].x=145;g.time=1;const before=JSON.stringify(g);updateStreetMotion(s,g);
  assert.equal(balloon.nudgedAt,1);assert.equal(JSON.stringify(g),before);assert.equal(s.events.length,0);
  for(let i=0;i<600;i++){g.time=1+i/60;updateStreetMotion(s,g);}
  assert.equal(balloon.nudgedAt,1);assert.equal(doorstepBalloonPose(balloon,g.time).sway,0);
  assert.equal(balloonFixture().balloon.nudgedAt,null);
});
test('the balloon follows a bounded continuous tether and settles independently of frame rate',()=>{
  const {g,s,balloon}=balloonFixture(),rest=doorstepBalloonPose(balloon,0);updateStreetMotion(s,g);
  assert.equal(doorstepBalloonPose(balloon,0).x,rest.x,'no position snap on first contact');
  let maximum=0;
  for(let i=0;i<=320;i++){
    const pose=doorstepBalloonPose(balloon,i/100);maximum=Math.max(maximum,Math.abs(pose.sway));
    assert.ok(Math.abs(pose.x-balloon.x)<13);assert.ok(pose.lift>51&&pose.lift<59);
    assert.equal(pose.anchorX,rest.anchorX);assert.equal(pose.anchorY,rest.anchorY);
  }
  assert.ok(maximum>6);assert.equal(doorstepBalloonPose(balloon,4).sway,0);
  const run=(fps,repeats)=>{const {g,s,balloon}=balloonFixture();updateStreetMotion(s,g);
    for(let i=1;i<=fps*4;i++){g.time=i/fps;for(let j=0;j<repeats;j++)updateStreetMotion(s,g);}
    return doorstepBalloonPose(balloon,4);};
  assert.deepEqual(run(30,1),run(120,4));
});
test('the rainy party stays still with reduced motion and cannot be nudged outside a walk',()=>{
  for(const phase of ['ready','finished']){const {g,s,balloon}=balloonFixture();g.phase=phase;updateStreetMotion(s,g);assert.equal(balloon.nudgedAt,null);}
  const {g,s,balloon}=balloonFixture();g.reduced=true;g.time=2;updateStreetMotion(s,g);
  assert.equal(balloon.nudgedAt,null);assert.deepEqual(doorstepBalloonPose(balloon,2,true),doorstepBalloonPose(balloon,100,true));
  g.reduced=false;updateStreetMotion(s,g);assert.equal(doorstepBalloonPose(balloon,2.2,true).sway,0);
});

function helperFixture(){
  const g=createGame('leather',321),s=createStreetMotion([],65,0,0,null,null,null,null,null,null,{x:69,y:1000});
  g.phase='walking';Object.assign(g.feet[0],{x:145,y:1000,z:10,vx:0,vy:120});
  return {g,s,helper:s.helper};
}
test('one little helper sits beside the repair toolbox, clear of the street on either verge',()=>{
  const sides=new Set();
  for(let seed=1;seed<=25;seed++){
    const g=createGame('leather',seed),n=createNeighborhood(),before=JSON.stringify(g);n.update(g);
    const helpers=n.sceneState().helpers,toolbox=n.sceneState().landmarks.find(l=>l.kind==='toolbox');
    assert.equal(helpers.length,1);const h=helpers[0];sides.add(h.x<450);
    assert.equal(h.anchorX,toolbox.x+14);assert.equal(h.y,toolbox.y-43);assert.equal(h.anchorY,toolbox.y-61);
    assert.ok(h.x+30<ROAD.left||h.x-30>ROAD.right);assert.equal(h.nodded,false);assert.equal(JSON.stringify(g),before);
  }
  assert.equal(sides.size,2);
});
test('only a nearby low moving shoe gives the workshop toy one springy nod, with no gameplay effect',()=>{
  const {g,s,helper}=helperFixture();
  for(const change of [{z:80},{z:10,vy:0},{vy:120,x:350}]){
    Object.assign(g.feet[0],change);g.time+=.1;updateStreetMotion(s,g);assert.equal(helper.noddedAt,null);
  }
  g.feet[0].x=145;g.time=1;const before=JSON.stringify(g),rest=workshopHelperPose(helper,1);updateStreetMotion(s,g);
  assert.equal(helper.noddedAt,1);assert.equal(JSON.stringify(g),before);assert.equal(s.events.length,0);
  const start=workshopHelperPose(helper,1);assert.equal(start.x,rest.x);assert.equal(start.angle,rest.angle);
  for(let i=0;i<=300;i++){
    g.time=1+i/100;updateStreetMotion(s,g);const h=workshopHelperPose(helper,g.time);
    assert.ok(Math.abs(h.x-helper.x)<3);assert.ok(Math.abs(h.angle-.07)<.23);assert.equal(h.anchorX,69);assert.equal(h.anchorY,982);
  }
  assert.equal(helper.noddedAt,1);assert.equal(workshopHelperPose(helper,4).wobble,0);assert.equal(helperFixture().helper.noddedAt,null);
});
test('the helper settles consistently across refresh rates and stays still outside a walk or with reduced motion',()=>{
  const run=(fps,repeats)=>{const {g,s,helper}=helperFixture();updateStreetMotion(s,g);
    for(let i=1;i<=fps*4;i++){g.time=i/fps;for(let n=0;n<repeats;n++)updateStreetMotion(s,g);}
    return workshopHelperPose(helper,4);};
  assert.deepEqual(run(30,1),run(120,4));
  for(const phase of ['ready','finished']){const {g,s,helper}=helperFixture();g.phase=phase;updateStreetMotion(s,g);assert.equal(helper.noddedAt,null);}
  const {g,s,helper}=helperFixture();g.reduced=true;updateStreetMotion(s,g);assert.equal(helper.noddedAt,null);
  assert.deepEqual(workshopHelperPose(helper,0,true),workshopHelperPose(helper,10,true));
  g.reduced=false;updateStreetMotion(s,g);assert.equal(workshopHelperPose(helper,.1,true).wobble,0);
});
