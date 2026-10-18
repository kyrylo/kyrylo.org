// A deliberately careless walker: stay near one lane and avoid solid objects only.
// Two previous placements keep both foot swings clear at turns. No surface data
// enters the route cost; the full contact simulation decides how dirty it gets.
import {createGame,ROAD,planStep,takeStep,advance,condition,setShoeMask} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
function carelessCourse(g,stride=65,lane=450){
 const xs=Array.from({length:21},(_,i)=>150+i*30),ys=[];for(let y=325;y<ROAD.finish+stride*2;y+=stride)ys.push(y);
 const free=(x,y)=>!g.street.obstacles.some(o=>{
  const dx=Math.max(0,Math.abs(x-o.x)-50-(o.halfWidth||0)),dy=Math.max(0,Math.abs(y-o.y)-48-(o.halfLength||0));
  return o.halfWidth?dx===0&&dy===0:Math.hypot(dx,dy)<o.r;
 });
 const layers=[];let states=new Map([[10*21+10,{cost:0,a:10,b:10,previous:null}]]);
 const clear=(a,b,y0,y1)=>{for(let n=0;n<=8;n++){const t=n/8;if(!free(a+(b-a)*t,y0+(y1-y0)*t))return false;}return true;};
 for(let r=0;r<ys.length;r++){
  const next=new Map();
  for(const [key,state] of states)for(let j=Math.max(0,state.b-3);j<=Math.min(20,state.b+3);j++){
   if(!clear(xs[state.a],xs[j],r>1?ys[r-2]:240,ys[r]))continue;
   if(!clear(xs[state.b],xs[j],r?ys[r-1]:260,ys[r]))continue;
   const side=r%2?1:-1,dx=(xs[j]-xs[state.b])*side+60;if(dx<27||Math.hypot(dx/185,stride/220)>1)continue;
   const cost=state.cost+Math.abs(xs[j]-lane)*.05+Math.abs(xs[j]-xs[state.b])*.1,k=state.b*21+j;
   if(cost<(next.get(k)?.cost??Infinity))next.set(k,{cost,a:state.b,b:j,previous:key});
  }
  if(!next.size)throw new Error('No course '+ys[r]);layers.push(next);states=next;
 }
 let key=[...states].sort((a,b)=>a[1].cost-b[1].cost)[0][0],route=[];
 for(let r=ys.length-1;r>=0;r--){const state=layers[r].get(key);route.push({x:xs[state.b],y:ys[r]});key=state.previous;}
 route.reverse();
 return route;
}
export function walkCarelessly(seed,stride=65,lane=450,fast=false){
 const g=createGame('leather',seed);g.phase='walking';setShoeMask(g,SHOE_MASK);const route=carelessCourse(g,stride,lane),placements=[];let zeroAt=null;
 for(let r=0;r<route.length;r++){
  if(fast&&r+4<route.length&&route.slice(Math.max(0,r-2),r+5).every(p=>p.x===route[r].x)){
   const ahead=route[r+2],q=planStep(g,{x:ahead.x+(g.active?30:-30),y:ahead.y});if(q?.valid&&!q.blocked&&!q.limited)r+=2;
  }
  const p=route[r],target={x:p.x+(g.active?30:-30),y:p.y},plan=planStep(g,target);
  if(!plan.valid||plan.blocked)throw new Error(`bad ${seed} at ${p.y}: ${JSON.stringify(plan)}`);
  if(!takeStep(g,target))throw new Error('Rejected');
  placements.push(target);
  for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);
  if(g.events.some(e=>e.type==='bump'))throw new Error(`Bump ${p.y}`);g.events=[];
  if(zeroAt===null&&condition(g)===0)zeroAt=(p.y-240)/200;
  if(g.phase==='finished')break;
 }
 return {g,placements,zeroAt};
}
