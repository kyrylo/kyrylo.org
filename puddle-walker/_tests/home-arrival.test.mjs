import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME,onWelcomeMat,beginHomeArrival,advanceHomeArrival} from '../home-arrival.js';
import {ROAD,createGame,condition} from '../model.js';
import {footPose} from '../render.js';
function fixture(x=450){
  const g=createGame('leather',42);g.phase='finished';
  g.feet.forEach((f,i)=>{Object.assign(f,{x:x+(i?30:-30),y:ROAD.finish+(i?-175:-25),angle:i?.13:-.17});f.coverage=.7;f.stain.fill(.7);f.wetness.fill(.4);f.sole.forEach(z=>{z.stain=.8;z.dirt=.7;z.wet=.3;});});
  return g;
}
const dirt=g=>JSON.stringify(g.feet.map(f=>({stain:f.stain,wetness:f.wetness,sole:f.sole,jeans:f.jeans,coverage:f.coverage,revision:f.revision})));
test('mat contact matches the painted coir and requires a planted shoe',()=>{
  const m=HOME.mat,foot={x:m.x+m.width/2,y:ROAD.finish+HOME.porchTop-m.y-m.height/2,z:0};
  assert.ok(onWelcomeMat(foot,ROAD.finish));
  for(const patch of [{x:330},{x:570},{y:ROAD.finish-53},{y:ROAD.finish+62},{z:1}])assert.equal(onWelcomeMat({...foot,...patch},ROAD.finish),false);
});
test('both shoes wipe twice, keep their side, and enter the doorway without changing dirt or the race',()=>{
  for(const x of [150,450,750]){
    const g=fixture(x),before=dirt(g),time=g.time,steps=g.steps,a=beginHomeArrival(g,ROAD.finish),stages=new Set();
    const initial=g.feet.map(f=>[f.x,f.y,f.z]);advanceHomeArrival(g,0);assert.deepEqual(g.feet.map(f=>[f.x,f.y,f.z]),initial);
    for(let n=0;n<1500&&!a.done;n++){
      const stage=a.stage,side=a.side,planted=g.feet.map(f=>({x:f.x,y:f.y,z:f.z}));advanceHomeArrival(g,1/120);stages.add(a.stage);
      assert.ok(g.feet[1].x-g.feet[0].x>=35.999);assert.ok(g.feet.filter(f=>f.z>0).length<=1,'one planted support at all times');
      if(a.stage==='wipe'){
        assert.ok(onWelcomeMat({...g.feet[a.side],z:0},ROAD.finish));
        if(stage==='wipe'&&side===a.side)assert.deepEqual({x:g.feet[1-a.side].x,y:g.feet[1-a.side].y,z:g.feet[1-a.side].z},planted[1-a.side]);
      }
    }
    assert.ok(a.done);assert.deepEqual(stages,new Set(['gather','wipe','enter','done']));
    assert.deepEqual(a.wiped,[1,1]);assert.equal(a.fade,1);
    for(const side of [0,1])assert.equal(g.events.filter(e=>e.type==='wipe'&&e.side===side).length,2);
    assert.ok(g.feet.every(f=>f.x>=400&&f.x<=500&&f.y-31>ROAD.finish+HOME.threshold&&f.z===0));
    assert.equal(dirt(g),before);assert.equal(g.time,time);assert.equal(g.steps,steps);assert.equal(condition(g),30.000000000000004);
    const end=JSON.stringify(g.feet),events=g.events.length;advanceHomeArrival(g,10);assert.equal(JSON.stringify(g.feet),end);assert.equal(g.events.length,events);
  }
});
test('arrival timing and poses agree at 30, 60 and 120 Hz',()=>{
  const states=[];
  for(const fps of [30,60,120]){const g=fixture();beginHomeArrival(g,ROAD.finish);for(let n=0;n<fps*3;n++)advanceHomeArrival(g,1/fps);states.push(g);}
  for(const g of states.slice(1))for(let i=0;i<2;i++)for(const key of ['x','y','z','angle'])assert.ok(Math.abs(states[0].feet[i][key]-g.feet[i][key])<.00001);
});
test('a suspended frame cannot skip the ending and reduced motion has no back-and-forth scrub',()=>{
  const g=fixture(),a=beginHomeArrival(g,ROAD.finish,{reduced:true});advanceHomeArrival(g,30);assert.equal(a.elapsed,.1);assert.equal(a.done,false);
  let sawWipe=false;
  for(let i=0;i<1000&&!a.done;i++){
    advanceHomeArrival(g,1/120);
    if(a.stage==='wipe'){sawWipe=true;assert.equal(g.feet[a.side].y,a.matY);assert.equal(g.feet[a.side].z,0);assert.equal(a.roll,0);}
    for(const f of g.feet){const pose=footPose(g,f,100,true);assert.ok(Number.isFinite(pose.y));}
  }
  assert.ok(sawWipe&&a.done);
});
