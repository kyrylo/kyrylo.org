import {performance} from 'node:perf_hooks';
import {readFileSync} from 'node:fs';
import before from './unculled-model.mjs';
import * as after from '../model.js';
const route=JSON.parse(readFileSync(new URL('../_notes/designed-route-audit.json',import.meta.url))).find(r=>r.seed===321).route;
const times={aim:[[],[]],walk:[[],[]]};
for(let run=0;run<7;run++)for(const mode of ['aim','walk'])for(const i of run%2?[1,0]:[0,1]){
 const model=[before,after][i],g=model.createGame('leather',321);g.phase='walking';const t=performance.now();
 if(mode==='aim'){
  g.feet.forEach((f,i)=>{f.x=420+i*60;f.y=1420-i*20;});
  for(let n=0;n<3000;n++)model.planStep(g,{x:450+Math.sin(n*.03)*220,y:1550+Math.cos(n*.03)*110});
 }else for(const p of route){model.takeStep(g,p);for(let n=0;n<240&&g.mode!=='idle';n++){model.advance(g,1/120);g.events.length=0;}}
 if(run)times[mode][i].push(performance.now()-t);
}
const median=a=>{a=[...a].sort((x,y)=>x-y);return(a[2]+a[3])/2;};
console.log(JSON.stringify(Object.fromEntries(Object.entries(times).map(([k,v])=>[k,{beforeMs:median(v[0]),afterMs:median(v[1]),reduction:1-median(v[1])/median(v[0]),samples:v}])),null,2));
