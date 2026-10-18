import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,advance,condition,setShoeMask} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {createDenimWear,updateDenimWear} from '../denim-wear.js';
const max=(w,key)=>Math.max(...w.hem.map(b=>b[key]),0);
function ground(g,type,depth=24){
 g.street=indexStreet({...g.street,obstacles:[],patches:type==='dry'?[]:[{id:0,type,x:450,y:5000,rx:1000,ry:12000,depth,seed:4,cos:1,sin:0}]});
 g.feet.forEach(f=>f.contactPose='');
}
function game(type='dry',depth=24){const g=createGame('leather',321);g.phase='walking';setShoeMask(g,SHOE_MASK);g.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:1000,bestY:1000,angle:0}));ground(g,type,depth);return g;}
function soak(g,w,seconds){for(let i=0;i<seconds*60;i++){advance(g,1/60);updateDenimWear(w,g,g.feet[w.side]);}}
function age(g,w,seconds){for(let i=0;i<seconds*10;i++){g.time+=.1;updateDenimWear(w,g,g.feet[w.side]);}}

test('deep mud saturates hems, while cosmetic updates leave shoes, score and random stream unchanged',()=>{
 const g=game('mud'),control=game('mud'),w=createDenimWear(0);
 for(let i=0;i<300;i++){advance(g,1/60);advance(control,1/60);updateDenimWear(w,g,g.feet[0]);}
 assert.ok(max(w,'wet')>.95);assert.ok(max(w,'soil')>.6);assert.ok(max(w,'height')>80);
 assert.equal(condition(g),condition(control));assert.deepEqual(g.feet,control.feet);assert.equal(g.random(),control.random());
});
test('water wets cloth without brown mud; shallow water cannot reach a cuff',()=>{
 for(const depth of [5,24]){const g=game('water',depth),w=createDenimWear(0);soak(g,w,4);assert.equal(max(w,'soil'),0);assert.equal(w.spots.length,0);if(depth===5)assert.equal(max(w,'wet'),0);else assert.ok(max(w,'wet')>.95);}
});
test('a clean foothold in deep water keeps the hem dry, and a lifted foot cannot soak',()=>{
 const g=game('water'),f=g.feet[0],w=createDenimWear(0);
 g.street=indexStreet({...g.street,patches:[...g.street.patches,{id:1,type:'stone',x:f.x,y:f.y,rx:60,ry:80,depth:1,seed:3,cos:1,sin:0}]});
 age(g,w,4);assert.equal(max(w,'wet'),0);
 ground(g,'water');f.z=30;age(g,w,4);assert.equal(max(w,'wet'),0);
});
test('cloth dries gradually but mud and granular residue remain in the fibers',()=>{
 const g=game('clay'),w=createDenimWear(0);soak(g,w,5);const soil=max(w,'soil'),wet=max(w,'wet');
 ground(g,'dry');age(g,w,60);assert.ok(max(w,'wet')<wet*.3);assert.equal(max(w,'soil'),soil);assert.ok(w.hem.every(b=>b.type==='clay'));
});
test('a clean shoe never creates a heavily soiled trouser leg from a nearby splash',()=>{
 const g=game(),f=g.feet[0],w=createDenimWear(0);f.jeans.push({x:.2,y:.6,r:7,type:'mud',opacity:.8});updateDenimWear(w,g,f);
 assert.equal(w.spots.length,0);assert.equal(max(w,'soil'),0);
 f.sole.forEach(z=>{z.stain=.8;z.wet=.9;z.dirt=.8;});g.time=.2;f.jeans.push({x:-.2,y:.5,r:7,type:'mud',opacity:.8});updateDenimWear(w,g,f);
 assert.ok(w.spots.some(s=>s.soil>.7&&s.wet>.5&&s.y>100));
 const other=createDenimWear(1);updateDenimWear(other,g,g.feet[1]);assert.equal(other.spots.length,0);
});
test('dry stained soles do not keep inventing new mud splashes after their loose dirt has shed',()=>{
 const g=game(),f=g.feet[0],w=createDenimWear(0);f.coverage=.9;f.dirtSource='mud';f.sole.forEach(z=>{z.stain=.9;z.dirt=0;});
 for(let i=0;i<20;i++){g.time=i;f.landedAt=i;updateDenimWear(w,g,f);}
 assert.equal(w.spots.length,0);
});
test('immersed cloth rinses loose mud more than grease, leaving high splashes untouched',()=>{
 const remaining={};for(const type of ['mud','tar']){
 const g=game('water'),f=g.feet[0],w=createDenimWear(0);w.hem.forEach(b=>{b.soil=.8;b.type=type;b.height=90;});w.spots.push({x:48,y:210,rx:5,ry:8,type,soil:.8,wet:0,seed:1});
 age(g,w,8);remaining[type]=max(w,'soil');assert.equal(w.spots[0].soil,.8);
 }assert.ok(remaining.mud<remaining.tar*.4);
});
test('visual history and repaint work stay bounded during repeated dirty landings',()=>{
 const g=game(),f=g.feet[0],w=createDenimWear(0);f.coverage=.9;f.sole.forEach(z=>{z.stain=.9;z.wet=.8;});
 for(let i=0;i<400;i++){g.time=i*.11;f.jeans.push({x:Math.sin(i)*.3,y:(i%7)/10,r:5,type:'mud',opacity:.8});if(f.jeans.length>70)f.jeans.shift();updateDenimWear(w,g,f);}
 assert.equal(w.spots.length,84);assert.ok(max(w,'soil')<=1);const revision=w.revision;for(let i=0;i<100;i++)updateDenimWear(w,g,f);assert.equal(w.revision,revision);
});

test('cached cloth revisions notice a new pigment or replaced splash even at the same wetness',()=>{
 const g=game(),f=g.feet[0],w=createDenimWear(0);
 const update=()=>{g.time+=.11;updateDenimWear(w,g,f);return w.revision;};
 const initial=update();assert.equal(update(),initial,'unchanged clean cloth sleeps');
 w.hem[0].height=40;w.hem[0].soil=.5;w.hem[0].type='clay';
 const clay=update();assert.ok(clay>initial);assert.equal(update(),clay);
 w.hem[0].type='tar';const tar=update();assert.ok(tar>clay,'colour changes repaint the same hem');
 w.spots.push({x:30,y:40,rx:4,ry:6,type:'mud',soil:.5,wet:0,seed:1});
 const first=update();assert.ok(first>tar);assert.equal(update(),first);
 w.spots[0]={...w.spots[0],x:70,seed:2};
 assert.ok(update()>first,'replacing the oldest capped splash must repaint even when counts and amounts match');
});
