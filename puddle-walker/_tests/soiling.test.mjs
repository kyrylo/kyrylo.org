import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,MATERIALS,GRID,advance,condition,shoeHeights,stainAt,emitSplash,surfaceAt,setShoeMask} from '../model.js';
const tick=(g,s,fps=120)=>{for(let i=0;i<Math.round(s*fps);i++)advance(g,1/fps);};
function ground(type='water',depth=5){
 const g=createGame('leather',91);g.phase='walking';g.feet.forEach((f,i)=>{f.y=1000;f.x=420+i*60;f.angle=0;});
 g.street=indexStreet({seed:91,patches:[{id:0,type,x:450,y:1000,rx:450,ry:450,depth,seed:4,cos:1,sin:0,dirt:MATERIALS[type].dirt}],obstacles:[],clutter:[]});return g;
}
const sum=a=>a.reduce((s,n)=>s+n,0);

test('shallow water wets the rim and tread while leaving the raised toe box and laces untouched',()=>{
 const g=ground('water',5);tick(g,3);
 for(const f of g.feet){const heights=shoeHeights(g,f);assert.ok(sum(f.stain)>0);assert.ok(f.sole.some(z=>z.stain>0));
  for(let i=0;i<f.stain.length;i++)if(heights[i]>5)assert.equal(f.stain[i],0);
  assert.equal(sum(f.deposits),0,'water leaves a film, not solid clumps');}
 assert.ok(condition(g)<100);
});
test('deeper standing water reaches more of the upper, but never paints above its waterline',()=>{
 const shallow=ground('water',4),deep=ground('water',24);tick(shallow,2);tick(deep,2);
 assert.ok(sum(deep.feet[0].stain)>sum(shallow.feet[0].stain)*3);
 assert.ok(condition(deep)<condition(shallow));
 const f=deep.feet[0],h=shoeHeights(deep,f);for(let i=0;i<h.length;i++)if(h[i]>24)assert.equal(f.stain[i],0);
});
test('mud builds solid deposits where it contacts the shoe; oil stays a smooth dark film',()=>{
 const mud=ground('mud',8),oil=ground('oil',8);tick(mud,4);tick(oil,4);
 assert.ok(sum(mud.feet[0].deposits)>.1);assert.equal(sum(oil.feet[0].deposits),0);
 for(const g of [mud,oil]){const f=g.feet[0],h=shoeHeights(g,f);for(let i=0;i<h.length;i++)if(h[i]>8)assert.equal(f.stain[i],0);}
});
test('sticky litter and dry grit contaminate the tread and low rim instead of the laces or jeans',()=>{
 for(const type of ['gum','poop','gravel']){
  const g=ground(type,18);tick(g,3);const f=g.feet[0],h=shoeHeights(g,f);
  assert.ok(f.sole.every(z=>z.stain>0));assert.ok(condition(g)<100);assert.equal(f.jeans.length,0);
  for(let i=0;i<h.length;i++)if(h[i]>4)assert.equal(f.stain[i],0,type);
 }
});
test('a splash reaches the upper only when a falling droplet actually crosses its height',()=>{
 const g=ground('water',4),f=g.feet[0],h=shoeHeights(g,f);emitSplash(g,f,surfaceAt(g,f.x,f.y),300);
 for(let i=0;i<h.length;i++)if(h[i]>12)assert.equal(f.stain[i],0,'initial lateral sheet stays low');
 // One droplet directly above the vamp: it cannot stain before reaching the upper.
 g.street=indexStreet({seed:91,patches:[],obstacles:[],clutter:[]});g.particles=[{x:f.x,y:f.y,z:55,vx:0,vy:0,vz:-30,r:1,type:'water',life:.1,alive:true}];
 const i=28*GRID.width+12,before=f.stain[i];tick(g,.05);assert.equal(f.stain[i],before);
 tick(g,.3);assert.ok(f.stain[i]>before);assert.equal(g.particles.length,0);
});
test('drying removes wet shine without cleaning permanent upper or tread dirt',()=>{
 const g=ground('mud',7);tick(g,2);g.street=indexStreet({seed:91,patches:[],obstacles:[],clutter:[]});
 const f=g.feet[0],clean=condition(g),wet=sum(f.wetness),clumps=sum(f.deposits);tick(g,35);
 assert.ok(sum(f.wetness)<wet*.1);assert.equal(condition(g),clean);assert.equal(sum(f.deposits),clumps);
});
test('height fields follow mirrored outer contours without treating a collar opening as a low sole edge',()=>{
 const g=ground(),mask=Array(GRID.width*GRID.height).fill(0);
 for(let y=0;y<GRID.height;y++)for(let x=2;x<20;x++)if(!(y>38&&y<48&&x>7&&x<15))mask[y*GRID.width+x]=1;
 setShoeMask(g,mask);const left=shoeHeights(g,g.feet[0]),right=shoeHeights(g,g.feet[1]);
 for(let y=0;y<GRID.height;y++)for(let x=0;x<GRID.width;x++)assert.equal(left[y*GRID.width+x],right[y*GRID.width+GRID.width-x-1]);
 assert.ok(left[42*GRID.width+7]>15);assert.ok(left[42*GRID.width+2]<2);
});
test('residue, height-aware stains and drying stay identical at 30, 60 and 120 FPS',()=>{
 const states=[30,60,120].map(fps=>{const g=ground('mud',10);emitSplash(g,g.feet[0],surfaceAt(g,420,1000),350);tick(g,2,fps);return g.feet.map(f=>[...f.stain,...f.deposits,...f.wetness,...f.sole.map(z=>z.stain)]);});
 assert.deepEqual(states[0],states[1]);assert.deepEqual(states[1],states[2]);
});

test('touching mud along one side cannot soil the opposite edge or the other foot',()=>{
 const g=ground('mud',6);Object.assign(g.street.patches[0],{x:410,rx:9});indexStreet(g.street);tick(g,3);
 const f=g.feet[0];assert.ok(sum(f.stain)>0);assert.equal(condition(g,1),100);
 for(let i=0;i<f.stain.length;i++)if(i%GRID.width>GRID.width*.7)assert.equal(f.stain[i],0);
});
test('fresh mud can build raised clumps on an already fully stained patch',()=>{
 const g=ground(),f=g.feet[0];stainAt(g,f,f.x,f.y,8,100,'water');
 assert.equal(sum(f.deposits),0);const before=sum(f.stain);stainAt(g,f,f.x,f.y,8,5,'mud');
 assert.ok(sum(f.deposits)>1);assert.ok(sum(f.stain)>=before);assert.ok(f.stain.every(v=>v<=1));
});

test('contact keeps mud visibly wet until the foot leaves it, then moisture decays',()=>{
 const g=ground('mud',8);tick(g,1);const f=g.feet[0],i=f.stain.findIndex(n=>n>.01);assert.ok(i>=0);
 assert.ok(f.wetness[i]>.9);tick(g,10);assert.ok(f.wetness[i]>.9);
 g.street=indexStreet({seed:91,patches:[],obstacles:[],clutter:[]});tick(g,35);assert.ok(f.wetness[i]<.09);
});
test('a slide records its direction in shoe coordinates and the smear remains attached afterward',()=>{
 const g=ground(),f=g.feet[0];f.vx=120;f.vy=0;f.angle=0;stainAt(g,f,f.x,f.y,8,2,'mud');
 const i=f.stain.findIndex(n=>n>.05);assert.ok(f.smearX[i]>0);assert.equal(f.smearY[i],0);
 const x=f.smearX[i];f.angle=Math.PI/2;f.vx=f.vy=0;g.street=indexStreet({seed:91,patches:[],obstacles:[],clutter:[]});tick(g,1);assert.equal(f.smearX[i],x);
});
test('sediment loading varies across the contacted rim without rerolling while standing still',()=>{
 const g=ground('mud',8);tick(g,.2);const f=g.feet[0],loads=f.contactLoads.filter((n,i)=>f.stain[i]>0);
 assert.ok(Math.max(...loads)-Math.min(...loads)>.4);const before=[...f.contactLoads];tick(g,.2);assert.deepEqual([...f.contactLoads],before);
});
