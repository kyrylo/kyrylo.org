// Run build-deep-performance-fixtures.mjs capture before editing, then this.
// Alternate implementations on identical inputs; assert results before timing.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {readFileSync} from 'node:fs';
import * as before from '../../_site/puddle-walker/_qa-before-129/model.js';
import * as after from '../model.js';
import {prepareFootprintPixels as oldPrint} from '../../_site/puddle-walker/_qa-before-129/footprints.js';
import {prepareFootprintPixels as newPrint} from '../footprints.js';
import {SHOE_MASK} from '../sprite-data.js';

const tread={width:48,height:112,data:new Uint8ClampedArray(48*112*4)};
for(let y=0;y<112;y++)for(let x=0;x<48;x++){
 const on=SHOE_MASK[Math.floor(y/2)*24+Math.floor(x/2)];
 tread.data[(y*48+x)*4+3]=on?(x+y)%5?170:255:0;
}
const game=after.createGame('leather',321),prints=[];
for(const section of game.street.sections.filter((_,i)=>i%3===0))for(const x of [160,450,740]){
 prints.push({x,y:section.y,angle:.63,side:0,width:27,length:62,born:0,life:90,slipX:22,slipY:-14,
  zones:Array.from({length:8},(_,i)=>({wet:(i+1)/8,dirt:.6,type:i%2?'clay':'mud'}))});
}
for(const p of prints)assert.deepEqual(newPrint(game,p,tread),oldPrint(game,p,tread));
const points=[];
for(const s of game.street.sections)for(let y=-30;y<=30;y+=6)for(let x=160;x<=740;x+=10)points.push([x,s.y+y]);
for(const [x,y] of points)assert.deepEqual(after.surfaceAt(game,x,y),before.surfaceAt(game,x,y));
const route=JSON.parse(readFileSync(new URL('../_notes/designed-route-audit.json',import.meta.url))).find(r=>r.seed===321).route;
function walk(model,g){
 for(const p of route){model.takeStep(g,p);for(let n=0;n<240&&g.mode!=='idle';n++){model.advance(g,1/120);g.events.length=0;}}
 return {feet:g.feet,steps:g.steps,clean:model.condition(g),time:g.time,random:g.random()};
}
const completed=[before,after].map(model=>{
 const g=model.createGame('leather',321);g.phase='walking';model.setShoeMask(g,SHOE_MASK);return walk(model,g);
});
assert.deepEqual(completed[1],completed[0],'the same 100 m route must preserve every shoe cell and physics outcome');
const samples={footprints:[[],[]],surfaces:[[],[]],walk:[[],[]]};
for(let round=0;round<7;round++)for(const task of Object.keys(samples))for(const i of round%2?[1,0]:[0,1]){
 const model=[before,after][i],g=model.createGame('leather',321);g.phase='walking';model.setShoeMask(g,SHOE_MASK);
 const start=performance.now();
 if(task==='footprints')for(const p of prints)[oldPrint,newPrint][i](game,p,tread);
 else if(task==='surfaces')for(const [x,y] of points)model.surfaceAt(g,x,y);
 else walk(model,g);
 if(round)samples[task][i].push(performance.now()-start);
}
const median=a=>{const s=[...a].sort((a,b)=>a-b);return(s[2]+s[3])/2;};
console.log(JSON.stringify({equivalence:{footprints:prints.length,surfacePoints:points.length,walk:{steps:completed[0].steps,clean:completed[0].clean,identicalFeet:true}},
 tasks:Object.fromEntries(Object.entries(samples).map(([name,t])=>[name,{before:median(t[0]),after:median(t[1]),reductionPercent:100*(1-median(t[1])/median(t[0])),samples:t}]))},null,2));
