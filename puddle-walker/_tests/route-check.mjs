// Compare a fast walker who only avoids solid objects with the authored clean route.
import {readFileSync} from 'node:fs';
import {createGame,setShoeMask,takeStep,advance,condition} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
import {walkCarelessly} from './straight-course.mjs';
const witnesses=JSON.parse(readFileSync(new URL('../_notes/designed-route-audit.json',import.meta.url),'utf8'));
const runs=[];
for(const w of witnesses){
 const careless=walkCarelessly(w.seed,65,450,true);
 const g=createGame('leather',w.seed);g.phase='walking';setShoeMask(g,SHOE_MASK);
 for(const p of w.route){if(!takeStep(g,p))throw new Error('Rejected careful step');for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);}
 runs.push({seed:w.seed,careless:{phase:careless.g.phase,clean:condition(careless.g),steps:careless.g.steps,fullyDirtyAt:careless.zeroAt},careful:{phase:g.phase,clean:condition(g),steps:g.steps}});
}
console.log(JSON.stringify({runs},null,2));
if(runs.some(r=>r.careless.phase!=='finished'||r.careless.clean!==0||r.careful.phase!=='finished'||r.careful.clean<99))process.exitCode=1;
