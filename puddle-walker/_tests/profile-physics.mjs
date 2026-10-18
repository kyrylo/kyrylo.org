import {performance} from 'node:perf_hooks';
import {readFileSync} from 'node:fs';
import {createGame,planStep,takeStep,advance,condition} from '../model.js';
const route=JSON.parse(readFileSync(new URL('../_notes/designed-route-audit.json',import.meta.url))).find(r=>r.seed===321).route;
const results={};
for(const mode of ['aim','wet','route']){
 const t=performance.now();let ops=0;
 for(let run=0;run<5;run++){
  const g=createGame('leather',321);g.phase='walking';
  if(mode==='aim'){
   g.feet.forEach((f,i)=>{f.x=420+i*60;f.y=1420-i*20;});
   for(let n=0;n<3000;n++){planStep(g,{x:450+Math.sin(n*.03)*220,y:1550+Math.cos(n*.03)*110});ops++;}
  }else if(mode==='wet'){
   const p=g.street.patches.find(p=>p.type==='mud');g.feet.forEach((f,i)=>{f.x=p.x+i*25;f.y=p.y;});
   for(let n=0;n<7200;n++){advance(g,1/120);g.events.length=0;ops++;}
  }else for(const p of route){takeStep(g,p);for(let n=0;n<240&&g.mode!=='idle';n++){advance(g,1/120);g.events.length=0;ops++;}}
 }
 results[mode]={milliseconds:performance.now()-t,operations:ops};
}
console.log(JSON.stringify(results,null,2));
