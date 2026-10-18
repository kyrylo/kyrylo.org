import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,setShoeMask,MATERIALS,takeStep,advance,surfaceAt,emitSplash,condition} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';

const patch=(type,y=1000,ry=60,id=0)=>({id,type,x:420,y,rx:45,ry,depth:12,cos:1,sin:0,seed:4+id,dirt:MATERIALS[type].dirt});
function fixture(patches){
 const g=createGame('leather',321);g.phase='walking';setShoeMask(g,SHOE_MASK);
 g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:860-i*20,bestY:860-i*20}));
 g.street=indexStreet({...g.street,patches,obstacles:[],clutter:[],districts:undefined});return g;
}
function touchdown(g){
 assert.ok(takeStep(g,{x:420,y:1000}));
 for(let i=0;i<120&&g.mode==='flight';i++)advance(g,1/120);
 assert.equal(g.mode,'settling');return g.feet[0];
}
test('a toe entering water splashes at the wet toe even when the shoe centre is dry',()=>{
 const g=fixture([patch('water',1025,11)]),f=touchdown(g);
 assert.equal(surfaceAt(g,f.x,f.y).type,'dry');assert.equal(g.rings.length,1);assert.ok(g.particles.length>0);
 assert.ok(g.rings[0].y>f.y+15);assert.ok(g.rings[0].ry<12,'the first wave fits a toe, not an entire shoe');
 assert.ok(g.events.some(e=>e.type==='splash'&&e.surface==='water'));
 const count=g.events.filter(e=>e.type==='splash').length;
 for(let i=0;i<60;i++)advance(g,1/120);
 assert.equal(g.events.filter(e=>e.type==='splash').length,count,'standing does not repeat the impact');
});
test('a graze displaces less water and makes a weaker wave than a full landing',()=>{
 const toe=fixture([patch('water',1025,11)]),full=fixture([patch('water')]);touchdown(toe);touchdown(full);
 assert.ok(full.particles.length>toe.particles.length*2);
 assert.ok(full.rings[0].strength>toe.rings[0].strength*1.5);
 assert.ok(full.rings[0].ry>toe.rings[0].ry*2);
 assert.equal(toe.feet.reduce((n,f)=>n+f.jeans.length,0),0,'a shallow graze does not spray both trouser legs');
});
test('splash droplets originate inside the water that was actually struck',()=>{
 const p=patch('water',1017,30),g=fixture([p]),f=g.feet[0];Object.assign(f,{y:1000,angle:.23});
 emitSplash(g,f,surfaceAt(g,f.x,f.y),400);assert.ok(g.particles.length>0);
 for(const drop of g.particles){assert.equal(surfaceAt(g,drop.x,drop.y).patch,p);assert.equal(drop.type,'water');}
});
test('one landing across two liquids keeps their splash sources and materials separate',()=>{
 const g=fixture([patch('water',1022,16),patch('mud',982,15,1)]);touchdown(g);
 assert.deepEqual(new Set(g.rings.map(r=>r.patch.type)),new Set(['water','mud']));
 assert.deepEqual(new Set(g.particles.map(r=>r.type)),new Set(['water','mud']));
 for(const ring of g.rings)assert.equal(surfaceAt(g,ring.x,ring.y).patch,ring.patch);
});
test('dry pavement and untouched silhouette corners cannot emit phantom splashes',()=>{
 const dry=fixture([]);touchdown(dry);assert.equal(dry.particles.length,0);assert.equal(dry.rings.length,0);
 const g=fixture([patch('water')]);setShoeMask(g,SHOE_MASK.map((_,i)=>i===0));touchdown(g);
 assert.equal(g.particles.length,0);assert.equal(g.rings.length,0);
});
test('partial splash physics, staining and waves are independent of display rate',()=>{
 const run=fps=>{const g=fixture([patch('water',1025,11),patch('mud',982,15,1)]);takeStep(g,{x:420,y:1000});
  for(let i=0;i<fps;i++)advance(g,1/fps);
  return {rings:g.rings,particles:g.particles,clean:condition(g),stains:g.feet.map(f=>Array.from(f.stain)),jeans:g.feet.map(f=>f.jeans)};};
 assert.deepEqual(run(30),run(120));assert.deepEqual(run(60),run(120));
});
