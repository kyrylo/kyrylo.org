import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,MATERIALS,surfaceAt,footPoint,condition} from '../model.js';
import {prepareFootprintPixels,wetPrintFade} from '../footprints.js';
const tread={width:24,height:56,data:new Uint8ClampedArray(24*56*4)};
for(let row=0;row<56;row++)for(let col=0;col<24;col++)tread.data[(row*24+col)*4+3]=col<8?55:col<16?145:255;
const patch=(type,x=420,y=1000,rx=30,ry=50,id=0)=>({id,type,x,y,rx,ry,depth:12,seed:4,cos:1,sin:0,dirt:MATERIALS[type].dirt});
function fixture(patches=[],extra={}){
 const g=createGame('leather',321);g.phase='walking';g.street=indexStreet({...g.street,patches,obstacles:[],clutter:[]});
 const p={x:420,y:1000,angle:.18,side:0,width:27,length:62,born:0,life:90,slipX:0,slipY:0,zones:Array.from({length:8},()=>({wet:1,dirt:.6,type:'mud'})),...extra};
 return {g,p};
}
const alphaSum=layer=>layer.reduce((n,v,i)=>n+(i%4===3?v:0),0);
test('thin wet films dry before thick tread while the deposited dirt remains',()=>{
 const {g,p}=fixture(),r=prepareFootprintPixels(g,p,tread);
 assert.ok(r.used.every(Boolean));
 assert.equal(wetPrintFade(6,0),0);assert.ok(wetPrintFade(6,1)>0);assert.ok(wetPrintFade(6,2)>wetPrintFade(6,1));
 assert.equal(wetPrintFade(13,1),0);assert.ok(wetPrintFade(13,2)>0);assert.equal(wetPrintFade(22,2),0);
 const visible=age=>r.layers.slice(0,3).reduce((n,l,i)=>n+alphaSum(l)*wetPrintFade(age,i),0);
 assert.ok(visible(0)>visible(6));assert.ok(visible(6)>visible(15));assert.equal(visible(22),0);
 assert.ok(alphaSum(r.layers[3])>0);
});
test('partial tread and its actual slip stay off the water, including a cover surrounded by water',()=>{
 for(const patches of [[patch('water',432)], [patch('water',420,1000,60,90),patch('metal',416,1005,9,18,1)]]){
  const {g,p}=fixture(patches,{slipX:12,slipY:8}),r=prepareFootprintPixels(g,p,tread);let dry=0,wet=0,cover=0;
  for(let row=0;row<r.height;row++)for(let col=0;col<r.width;col++){
   const point=footPoint(p,r.left+(col+.5)*r.worldWidth/r.width,-(r.top+(row+.5)*r.worldHeight/r.height));
   const surface=surfaceAt(g,point.x,point.y),at=(row*r.width+col)*4+3;
   const visible=r.layers.some(l=>l[at]>0);
   if(MATERIALS[surface.type].liquid&&surface.depth>=.3){assert.ok(!visible,'no floating tread');wet++;}
   else if(visible){dry++;if(surface.type==='metal')cover++;}
  }
  assert.ok(wet>100);assert.ok(dry>100);if(patches.length===2)assert.ok(cover>100,'dry cover still receives a print');
 }
});
test('submerged soles and clean pavement do not invent transferred marks',()=>{
 const submerged=fixture([patch('water',420,1000,100,120)]),r=prepareFootprintPixels(submerged.g,submerged.p,tread);
 assert.ok(r.layers.every(l=>alphaSum(l)===0));assert.equal(r.beads.length,0);
 const {g,p}=fixture([],{zones:Array.from({length:8},()=>({wet:0,dirt:0,type:'dry'}))});
 assert.ok(prepareFootprintPixels(g,p,tread).layers.every(l=>alphaSum(l)===0));
});
test('a toe-only transfer stays at the toe and dry grit never gains a water layer',()=>{
 const {g,p}=fixture([],{angle:0,zones:Array.from({length:8},(_,i)=>({wet:0,dirt:i<2?.6:0,type:'gravel'}))});
 const r=prepareFootprintPixels(g,p,tread);assert.deepEqual(r.used,[false,false,false,true]);
 for(let row=Math.ceil(r.height/4);row<r.height;row++)for(let col=0;col<r.width;col++)assert.equal(r.layers[3][(row*r.width+col)*4+3],0);
});
test('preparing tracks is deterministic and cannot alter shoe condition or the physics random stream',()=>{
 const {g,p}=fixture(),control=createGame('leather',321),clean=condition(g),before=JSON.stringify(p);
 const a=prepareFootprintPixels(g,p,tread),b=prepareFootprintPixels(g,p,tread);assert.deepEqual(a,b);
 assert.equal(condition(g),clean);assert.equal(JSON.stringify(p),before);assert.equal(g.random(),control.random());
});
