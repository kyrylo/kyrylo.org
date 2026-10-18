import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,MATERIALS,advance,condition,takeStep} from '../model.js';
const tick=(g,s,fps=120)=>{for(let i=0;i<Math.round(s*fps);i++)advance(g,1/fps);};
const sum=a=>a.reduce((n,v)=>n+v,0);
function fixture(type='dry',extra={}){
 const g=createGame('leather',91);g.phase='walking';g.feet.forEach((f,i)=>{f.x=420+i*60;f.y=1000-i*20;f.bestY=f.y;f.angle=0;});
 g.street=indexStreet({...g.street,patches:type==='dry'?[]:[{id:0,type,x:420,y:1000,rx:35,ry:60,depth:12,seed:4,cos:1,sin:0,dirt:MATERIALS[type].dirt,...extra}],obstacles:[],clutter:[]});return g;
}
function step(g,fps=120){const f=g.feet[g.active];assert.ok(takeStep(g,{x:f.x,y:Math.max(...g.feet.map(f=>f.y))+100}));tick(g,1,fps);}
function drop(g,r,x=420){g.particles.push({x,y:1000,z:55,vx:0,vy:0,vz:-30,r,type:'mud',life:.1,alive:true});tick(g,.4);}

test('a fine droplet keeps its true contact position and its dirt cost follows area',()=>{
 const small=fixture(),large=fixture();drop(small,.15);drop(large,.6);
 assert.equal(small.feet[0].spatter.length,1);assert.equal(large.feet[0].spatter.length,1);
 const a=small.feet[0].spatter[0],b=large.feet[0].spatter[0];assert.equal(a.u,.5);assert.equal(a.v,.5);assert.equal(b.r/a.r,4);
 const ratio=(100-condition(large))/(100-condition(small));assert.ok(ratio>15&&ratio<17);assert.ok(condition(large)>99.9);
});
test('airborne droplets that miss the shoe cannot create spots on its upper',()=>{
 const g=fixture();drop(g,.5,455);assert.equal(g.feet[0].spatter.length,0);assert.equal(condition(g),100);
});
test('mud sheds small clods on later dry steps while permanent stains remain',()=>{
 const g=fixture('mud');tick(g,4);step(g);tick(g,2);
 assert.ok(g.crumbs.length>0);assert.ok(g.crumbs.every(c=>c.type==='mud'&&c.r<2));
 const clean=condition(g),before=sum(g.feet[0].deposits);
 for(let i=0;i<6;i++)step(g);
 assert.ok(sum(g.feet[0].deposits)<before);assert.equal(condition(g),clean);
});
test('water, oil and sticky gum never shed fake clay clumps',()=>{
 for(const type of ['water','oil','gum']){const g=fixture(type);tick(g,3);for(let i=0;i<4;i++)step(g);assert.equal(g.crumbs.length,0,type);}
});
test('standing in water cannot leave floating mud clumps',()=>{
 const g=fixture('mud');tick(g,3);g.street=indexStreet({...g.street,patches:[{...g.street.patches[0],type:'water',dirt:MATERIALS.water.dirt,rx:500,ry:2000}]});
 step(g);step(g);assert.equal(g.crumbs.length,0);
});
test('shed material freezes on pause, expires, and is identical across frame rates',()=>{
 const outcomes=[30,60,120].map(fps=>{const g=fixture('mud');tick(g,3,fps);for(let i=0;i<5;i++)step(g,fps);return g;});
 assert.deepEqual(outcomes[0].crumbs,outcomes[1].crumbs);assert.deepEqual(outcomes[1].crumbs,outcomes[2].crumbs);
 const g=outcomes[0],before=JSON.stringify(g.crumbs);g.phase='paused';tick(g,80);assert.equal(JSON.stringify(g.crumbs),before);g.phase='walking';tick(g,80);assert.equal(g.crumbs.length,0);
});
