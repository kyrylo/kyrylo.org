import {createGame,planStep,takeStep,advance,condition,progress} from '../model.js';
export function straightRun(seed,lane){
 const g=createGame('leather',seed);g.phase='walking';g.feet.forEach((f,i)=>{f.x=lane+(i?30:-30);});let stagnant=0,last=0;
 for(let n=0;n<260&&g.phase==='walking'&&stagnant<8;n++){
  const front=Math.max(...g.feet.map(f=>f.y));
  const p=planStep(g,{x:lane+(g.active?30:-30),y:front+205});
  if(!p?.valid||!takeStep(g))break;
  for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);
  const now=progress(g);stagnant=now-last<.0001?stagnant+1:0;last=now;
 }
 return {seed,lane,finished:g.phase==='finished',metres:+(progress(g)*100).toFixed(1),clean:+condition(g).toFixed(1)};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const rows=[];for(const seed of [1,42,321])for(const lane of [270,450,630])rows.push(straightRun(seed,lane));console.log(JSON.stringify(rows,null,2));
}
