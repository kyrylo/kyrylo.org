import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,MATERIALS,takeStep,advance,condition,stainAt} from '../model.js';
const tick=(g,seconds,fps=120)=>{for(let n=0;n<Math.round(seconds*fps);n++)advance(g,1/fps);};
function fixture(type='dry',extra={}){
 const g=createGame('leather',123);g.phase='walking';
 g.feet.forEach((f,i)=>{f.y=1000-i*20;f.bestY=f.y;f.angle=0;});
 const p={id:0,type,x:420,y:1000,rx:27,ry:58,depth:12,seed:2,cos:1,sin:0,dirt:MATERIALS[type].dirt,...extra};
 g.street=indexStreet({seed:123,patches:type==='dry'?[]:[p],obstacles:[],clutter:[]});return g;
}
function step(g,fps=120){
 const f=g.feet[g.active];assert.ok(takeStep(g,{x:f.x,y:Math.max(...g.feet.map(f=>f.y))+100}));
 tick(g,1,fps);assert.equal(g.mode,'idle');return f;
}
const strength=p=>p.zones.reduce((n,z)=>n+z.wet+z.dirt,0);

test('clean soles and stains confined to the upper leave no tracks on dry pavement',()=>{
 for(const stained of [false,true]){const g=fixture();if(stained)stainAt(g,g.feet[0],420,1025,8,5,'mud');for(let i=0;i<6;i++)step(g);assert.equal(g.prints.length,0);}
});
test('a wet foot leaves a correctly placed print after stepping out of a puddle; the dry foot does not',()=>{
 const g=fixture('water');tick(g,.2);const f=step(g);
 assert.equal(g.prints.length,1);const p=g.prints[0];
 assert.equal(p.side,0);assert.equal(p.x,f.x);assert.equal(p.y,f.y);assert.equal(p.angle,f.angle);
 assert.ok(p.zones.some(z=>z.wet>.6));
 step(g);assert.equal(g.prints.length,1);tick(g,2);assert.equal(g.prints.length,1,'standing still does not stamp repeatedly');
});
test('mud stays brown on subsequent dry landings and sheds without cleaning permanent shoe stains',()=>{
 const g=fixture('mud');tick(g,.2);step(g);tick(g,3);
 const clean=condition(g);const first=g.prints[0];assert.ok(first.zones.every(z=>z.type==='mud'));
 step(g);step(g);const second=g.prints.at(-1);
 assert.equal(second.side,0);assert.ok(second.zones.every(z=>z.type==='mud'));assert.ok(strength(second)<strength(first)*.7);
 assert.equal(condition(g),clean,'sole transfer does not improve the cleanliness score');
 for(let i=0;i<18;i++)step(g);
 const count=g.prints.length;step(g);step(g);assert.equal(g.prints.length,count,'finite residue eventually stops leaving visible marks');
});
test('dipping only the toe transfers only toe tread',()=>{
 const g=fixture('mud',{y:1030,ry:10,rx:35,depth:5});tick(g,.2);step(g);
 const p=g.prints[0];assert.ok(p.zones.slice(0,2).some(z=>z.dirt>.1));assert.ok(p.zones.slice(2).every(z=>z.dirt===0&&z.wet===0));
});
test('dry grit leaves dusty tracks without giving the sole water',()=>{
 const g=fixture('gravel',{depth:3});tick(g,.2);step(g);
 assert.ok(g.prints[0].zones.some(z=>z.dirt>.2&&z.type==='gravel'));assert.ok(g.prints[0].zones.every(z=>z.wet===0));
});
test('water never supports floating tread marks',()=>{
 const g=fixture('water',{x:450,rx:300,ry:700});tick(g,.2);step(g);step(g);assert.equal(g.prints.length,0);
});
test('footprint evaporation and residue drying freeze while paused; wet prints expire before dirt',()=>{
 const wet=fixture('metal',{depth:2}),mud=fixture('mud');
 for(const g of [wet,mud]){tick(g,.2);step(g);g.phase='paused';const before=JSON.stringify([g.time,g.prints,g.feet.map(f=>f.sole)]);tick(g,100);assert.equal(JSON.stringify([g.time,g.prints,g.feet.map(f=>f.sole)]),before);g.phase='walking';tick(g,24);}
 assert.equal(wet.prints.length,0);assert.equal(mud.prints.length,1);tick(mud,70);assert.equal(mud.prints.length,0);
});
test('residue and footprint transfer agree at 30, 60 and 120 FPS',()=>{
 const outcomes=[30,60,120].map(fps=>{const g=fixture('mud');tick(g,.2,fps);for(let i=0;i<5;i++)step(g,fps);return g.prints;});
 for(const prints of outcomes.slice(1))assert.deepEqual(prints,outcomes[0]);
});
