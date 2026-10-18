// Replay existing authored-route witnesses after physics changes, without replanning.
import {readFileSync,writeFileSync} from 'node:fs';
import {STRETCH,createGame,takeStep,advance,condition,progress,score} from '../model.js';
const path=new URL('../_notes/designed-route-audit.json',import.meta.url),routes=JSON.parse(readFileSync(path,'utf8'));
for(const result of routes){
 const g=createGame('leather',result.seed);g.phase='walking';
 for(const p of result.route){if(!takeStep(g,p))throw new Error(`Invalid placement, seed ${result.seed}`);for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);}
 Object.assign(result,{finished:g.phase==='finished',metres:progress(g)*100,clean:condition(g),steps:g.steps,medals:g.blocks.filter(b=>b.clean).length,bestFlow:g.bestFlow,points:score(g),crossings:g.crossings});
 if(!result.finished||result.clean<99||result.medals!==STRETCH.count)throw new Error(`Route regression: ${JSON.stringify({...result,route:undefined})}`);
 console.log({...result,route:undefined});
}
writeFileSync(path,JSON.stringify(routes,null,2)+'\n');
