// Offline adversarial checks. Geometry scans are conservative whole-pair checks;
// model/controller tests separately replay recovery with the full contact physics.
import {createGame,planStep,takeStep,advance,indexStreet,SHOES,ROAD,footPoint,nearby} from '../model.js';
const settle=g=>{for(let n=0;n<240&&g.mode!=='idle';n++)advance(g,1/120);g.events.length=0;};
function penetration(g,p){let worst=0;const s=SHOES[g.shoeId];for(const o of nearby(g.street,p.y).obstacles)for(const along of [-.32,0,.32]){const q=footPoint(p,0,along*s.length),x=Math.max(0,Math.abs(q.x-o.x)-(o.halfWidth||0)),y=Math.max(0,Math.abs(q.y-o.y)-(o.halfLength||0));worst=Math.max(worst,(o.halfWidth?0:o.r)+s.width*.48-Math.hypot(x,y));}return worst;}
function hasClearMove(g){const orig=g.active;for(const side of [0,1]){g.active=side;const f=g.feet[side],front=Math.max(...g.feet.map(f=>f.y));for(const y of [f.y,f.y-90,f.y+12,f.y+24,f.y+60,f.y+120,f.y+180,front+24,front+100,front+200])for(let x=135;x<=765;x+=12){const p=planStep(g,{x,y});if(!p?.valid||Math.hypot(p.x-f.x,p.y-f.y)<8)continue;let clear=true;for(let n=1;n<=24&&clear;n++){const t=n/24;clear=penetration(g,{x:f.x+(p.x-f.x)*t,y:f.y+(p.y-f.y)*t,angle:p.angle})<.15;}if(clear){g.active=orig;return true;}}}g.active=orig;return false;}
const failures=[],invalidStances=[];let runs=0;
for(const seed of [1,42,321,9182]){
 const street=createGame('leather',seed).street;
 for(const obstacle of street.obstacles.filter(o=>['barrier','car','bollard'].includes(o.type))){
  const back=obstacle.y-(obstacle.halfLength||obstacle.r)-120;
  for(let lane=150;lane<=750;lane+=60){
   const g=createGame('leather',seed);g.street=indexStreet({...street,patches:[]});g.mask=g.mask.map(()=>0);g.phase='walking';
   g.feet.forEach((f,i)=>{f.x=lane+(i?15:-15);f.y=back-i*20;f.bestY=f.y;});if(g.feet.some(f=>penetration(g,f)>0))continue;
   if(!takeStep(g,{x:lane+(g.active?15:-15),y:back+210}))continue;settle(g);
   if(takeStep(g,{x:lane+(g.active?15:-15),y:back+300}))settle(g);
   runs++;
   if(g.mode!=='idle'||g.feet[1].x-g.feet[0].x<26.9||g.feet.some(f=>!Number.isFinite(f.x+f.y)||f.x<ROAD.left+SHOES.leather.width-.1||f.x>ROAD.right-SHOES.leather.width+.1||penetration(g,f)>.2))invalidStances.push({seed,lane,obstacle:obstacle.type,feet:g.feet.map(f=>({x:f.x,y:f.y}))});
   const movable=hasClearMove(g);if(!movable){failures.push({seed,obstacle:obstacle.type,oy:obstacle.y,feet:g.feet.map(f=>({x:f.x,y:f.y,angle:f.angle})),active:g.active});if(failures.length<4)console.error('TRAP',JSON.stringify(failures.at(-1)));}
  }
 }
}
// A standing pair occupies a conservative 96 × 76 world-unit rectangle.
// Flood backwards from the finish, permitting only sideways/forward travel.
// Every free horizontal component must connect to the next row toward home.
let streets=0,positions=0;const pockets=[];
const seeds=[...Array.from({length:64},(_,i)=>i),9182,100023,2147483647,4294967295];
for(const seed of seeds){
 const g=createGame('leather',seed),xs=Array.from({length:57},(_,i)=>170+i*10);
 let ahead=xs.map(()=>true);
 for(let y=20240;y>=240;y-=20){
  const free=xs.map(x=>!nearby(g.street,y).obstacles.some(o=>{
   const dx=Math.max(0,Math.abs(x-o.x)-48-(o.halfWidth||0));
   const dy=Math.max(0,Math.abs(y-o.y)-38-(o.halfLength||0));
   return o.halfWidth?dx===0&&dy===0:Math.hypot(dx,dy)<o.r;
  }));
  const reach=xs.map(()=>false);
  for(let i=0;i<xs.length;){
   if(!free[i]){i++;continue;}let end=i;while(end+1<xs.length&&free[end+1])end++;
   const exit=ahead.slice(i,end+1).some(Boolean);
   for(let j=i;j<=end;j++){positions++;reach[j]=exit;if(!exit&&pockets.length<20)pockets.push({seed,x:xs[j],y});}
   i=end+1;
  }
  ahead=reach;
 }
 streets++;
}
console.log(JSON.stringify({badApproaches:runs,immobile:failures,invalidStances,geometry:{streets,standingPairPositions:positions,pockets}},null,2));
if(failures.length||pockets.length||invalidStances.length)process.exitCode=1;
