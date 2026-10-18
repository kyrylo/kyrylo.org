import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,shoeContainsPoint} from '../model.js';
import {createStreetMotion,updateStreetMotion,updateTennisBall} from '../street-motion.js';
function setup(){const g=createGame('leather',321);g.phase='walking';g.street=indexStreet({...g.street,patches:[],obstacles:[]});g.feet.forEach((f,i)=>{f.x=450+i*60;f.y=3100;});const s=createStreetMotion([],65,0,0,{x:104,y:3395,direction:1});return{g,s,b:s.ball};}
test('front-yard ball rolls into view once, slows naturally, and never changes player state',()=>{
 const{g,s,b}=setup();updateStreetMotion(s,g);assert.equal(b.started,false);g.feet.forEach(f=>f.y=3200);
 const before=JSON.stringify(g);updateStreetMotion(s,g);assert.equal(JSON.stringify(g),before);assert.equal(b.started,true);
 for(let i=1;i<=60;i++){g.time=i/10;updateStreetMotion(s,g);}assert.ok(b.x>200&&b.x<230);assert.ok(b.roll>10);assert.ok(Math.hypot(b.vx,b.vy)<.3);
});
test('a planted shoe nudges the ball away while an airborne shoe passes over it',()=>{
 for(const z of [0,35]){const{g,b}=setup(),f=g.feet[0];Object.assign(f,{y:3395,x:450,z,vx:100});Object.assign(b,{x:455,y:3395,started:true});const before=JSON.stringify(g);
 updateTennisBall(b,g,1/60);assert.equal(JSON.stringify(g),before);assert.equal(b.nudges,z?0:1);if(!z){assert.ok(b.vx>0);assert.equal(shoeContainsPoint(g,f,b.x,b.y),false);}}
});
test('ball bounces off furniture and curbs without becoming a collision obstacle',()=>{
 const{g,b}=setup();g.street.obstacles=[{x:500,y:3395,halfWidth:30,halfLength:30}];Object.assign(b,{x:460,y:3395,vx:150,started:true});updateTennisBall(b,g,.1);assert.ok(b.x<=462);assert.ok(b.vx<0);
 g.street.obstacles=[];Object.assign(b,{x:803,y:3395,vx:150});updateTennisBall(b,g,.1);assert.equal(b.x,806);assert.ok(b.vx<0);
});
test('reduced motion leaves the yard ball still and a retry creates a fresh encounter',()=>{
 const{g,s,b}=setup();g.reduced=true;g.feet.forEach(f=>f.y=3395);g.time=2;updateStreetMotion(s,g);assert.equal(b.started,false);assert.equal(b.x,104);assert.equal(setup().b.nudges,0);
});
