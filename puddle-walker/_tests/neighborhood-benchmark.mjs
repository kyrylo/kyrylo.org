import {readFileSync} from 'node:fs';
import {createGame} from '../model.js';
import {createNeighborhood as after} from '../neighborhood.js';
const source=readFileSync(new URL('./performance-63-before/neighborhood.js',import.meta.url),'utf8').replace(/from '\.\/([^']+)'/g,(_,path)=>`from '${new URL('../'+path,import.meta.url).href}'`);
const {createNeighborhood:before}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function run(make){
 const g=createGame('leather',321),n=make();g.phase='walking';n.update(g);
 const start=performance.now();
 for(let frame=0;frame<30000;frame++){
  g.time=frame/60;
  for(let side=0;side<2;side++){g.feet[side].x=420+side*60;g.feet[side].y=260+(frame%1200)*16-side*20;}
  n.update(g);n.takeEvents();
 }
 return performance.now()-start;
}
run(before);run(after);
const times=[[],[]],makers=[before,after];
for(let round=0;round<6;round++)for(const i of (round%2?[1,0]:[0,1]))times[i].push(run(makers[i]));
const median=a=>{a=[...a].sort((a,b)=>a-b);return (a[2]+a[3])/2;};
const old=median(times[0]),next=median(times[1]);
console.log(JSON.stringify({updatesPerRound:30000,rounds:6,beforeMs:old,afterMs:next,reduction:1-next/old,samples:times},null,2));
