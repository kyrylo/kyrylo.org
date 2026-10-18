import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,indexStreet,MATERIALS} from '../model.js';
import {prepareFootprintPixels} from '../footprints.js';

// Compare the new broad phase against sampling the whole street at every pixel.
const file=new URL('../footprints.js',import.meta.url),source=readFileSync(file,'utf8');
const broadPhase=/  \/\/ A print can include[\s\S]*?  const layers=/;
assert.ok(broadPhase.test(source));
const reference=source.replace('createSubmersionTest}', 'createSubmersionTest,surfaceAt}').replace(broadPhase,`  const submerged=(x,y)=>{const surface=surfaceAt(g,x,y);return MATERIALS[surface.type].liquid&&surface.depth>=.3;};\n  const layers=`)
 .replace(/from '([^']+)'/g,(_,path)=>`from '${new URL(path,file).href}'`);
const {prepareFootprintPixels:exhaustive}=await import('data:text/javascript;base64,'+Buffer.from(reference).toString('base64'));
const tread={width:24,height:56,data:new Uint8ClampedArray(24*56*4)};
for(let i=0;i<24*56;i++)tread.data[i*4+3]=i%5?170:255;
const print=(x,y,angle=0,slipX=0,slipY=0)=>({x,y,angle,side:0,width:27,length:62,born:0,life:90,slipX,slipY,
 zones:Array.from({length:8},(_,i)=>({wet:(i+1)/8,dirt:.6,type:i%2?'clay':'mud'}))});

test('culled footprint raster matches exhaustive sampling across all five districts',()=>{
 const g=createGame('leather',321);
 for(const section of g.street.sections.filter((_,i)=>i%3===0))for(const x of [160,450,740]){
  const p=print(x,section.y,.63,22,-14);
  assert.deepEqual(prepareFootprintPixels(g,p,tread),exhaustive(g,p,tread),`${x}, ${section.y}`);
 }
});
test('rotated prints, long slips and beads retain exact water, cover and contaminant clipping',()=>{
 const g=createGame('leather',321),patch=(type,x,y,rx,ry,angle,extra={})=>({type,x,y,rx,ry,cos:Math.cos(angle),sin:Math.sin(angle),depth:15,dirt:MATERIALS[type].dirt,seed:4,...extra});
 g.street=indexStreet({patches:[patch('water',440,1024,75,180,.8),patch('metal',450,1024,25,45,.3),
  patch('algae',449,1026,14,18,.1,{onCover:true}),patch('water',389,960,10,12,0)],obstacles:[]});
 for(const y of [960,1023,1025,1150])for(const angle of [0,.8,-1.5])for(const slip of [0,70]){
  const p=print(425,y,angle,slip,-slip*.7);
  assert.deepEqual(prepareFootprintPixels(g,p,tread),exhaustive(g,p,tread),`${y}, ${angle}, ${slip}`);
 }
});
