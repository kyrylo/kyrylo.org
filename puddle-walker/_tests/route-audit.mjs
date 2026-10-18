// Offline QA only: no route guidance or terrain classification is exposed in-game.
import {createGame,planStep,takeStep,advance,condition,score,progress,surfaceAt,SHOES,GRID,footPoint,nearby} from '../model.js';
export function guidedRun(seed){
 const g=createGame('leather',seed);g.phase='walking';let turns=0,stagnant=0;const route=[],recent=[];
 const planningMask=g.mask.map((v,i)=>v&&[2,5,8,11,14,17,20,23].includes(i%GRID.width)&&[2,8,14,20,26,32,38,44,50,54].includes(Math.floor(i/GRID.width)));
 const anchors=g.street.sections.flatMap(s=>s.line||[{x:s.kind==='runoff'&&s.stage<2?450:s.gap,y:s.y-100},{x:s.kind==='runoff'&&s.stage<2?450:s.gap,y:s.y+90}]);
 function laneAt(y){
  const next=anchors.findIndex(s=>s.y>y);if(next<0)return 450;if(next===0)return anchors[0].x;
  const a=anchors[next-1],b=anchors[next],t=Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y)));
  return a.x+(b.x-a.x)*t;
 }
 function candidates(state){
  state={...state,mask:planningMask};
  const front=Math.max(...state.feet.map(f=>f.y)),f=state.feet[state.active],shoe=SHOES[state.shoeId],list=[];
  const targets=[];
  for(const dy of [f.y-front,0,26,55,90,140,195])for(let x=150;x<=750;x+=24)targets.push({x,y:front+dy});
  for(const stone of state.street.patches.filter(p=>p.steppingStone&&p.y>front-75&&p.y<front+260)){
   for(const dx of stone.rx>70?[-30,0,30]:[0])targets.push({x:stone.x+dx,y:stone.y});
  }
  for(const target of targets){
   const p=planStep(state,target);if(!p?.valid)continue;
   let clearance=true;
   for(let n=0;n<=24&&clearance;n++){
    const t=n/24,pose={x:f.x+(p.x-f.x)*t,y:f.y+(p.y-f.y)*t,angle:p.angle};
    for(const o of nearby(state.street,pose.y).obstacles)for(const along of [-.32,0,.32]){
     const q=footPoint(pose,0,along*shoe.length),dx=Math.max(0,Math.abs(q.x-o.x)-(o.halfWidth||0)),dy=Math.max(0,Math.abs(q.y-o.y)-(o.halfLength||0));
     if(Math.hypot(dx,dy)<(o.halfWidth?0:o.r)+shoe.width*.48+9)clearance=false;
    }
   }
   let contact=0;
   for(const t of [.12,.25,.75,.9]){
    const px=f.x+(p.x-f.x)*t,py=f.y+(p.y-f.y)*t,lift=24*4*t*(1-t);
    for(const dx of [-shoe.width*.42,0,shoe.width*.42])for(const yy of [-shoe.length*.4,0,shoe.length*.4]){
     const ground=surfaceAt(state,px+dx,py+yy);contact+=Math.max(0,ground.depth-lift)*ground.dirt;
    }
   }
   // Do not endlessly shuffle between the same footholds at a decision point.
   const repeated=p.sideways&&recent.some(q=>q.side===state.active&&Math.hypot(q.x-p.x,q.y-p.y)<18);
   const desired=laneAt(p.y)+(state.active?29:-29),value=(p.y-front)*.72-Math.abs(p.x-desired)*1.35-contact*20-p.wetFraction*2400-p.risk*50-(p.blocked||!clearance?8000:0)-(repeated?600:0);
   list.push({p:{...p},value});
  }
  return list.sort((a,b)=>b.value-a.value);
 }
 while(g.phase==='walking'&&turns++<650&&stagnant<20){
  const before=progress(g);let best=null,bestValue=-Infinity;
  // One extra footfall avoids blindly taking a nice foothold whose exit is closed.
  for(const {p,value} of candidates(g).slice(0,7)){
   const next={...g,feet:g.feet.map(f=>f.side===g.active?{...f,x:p.x,y:p.y,angle:p.angle}:f),active:1-g.active,preview:null};
   const future=candidates(next)[0],total=value+(future?future.value*.85:-10000);
   if(total>bestValue){bestValue=total;best=p;}
  }
  if(!best)break;recent.push({x:best.x,y:best.y,side:g.active});if(recent.length>12)recent.shift();route.push({x:best.x,y:best.y});planStep(g,best);if(!takeStep(g))throw new Error(`Cannot commit ${JSON.stringify(best)}`);for(let i=0;i<180&&g.mode!=='idle';i++)advance(g,1/120);
  stagnant=progress(g)-before<.00001?stagnant+1:0;
 }
 return {seed,finished:g.phase==='finished',metres:+(progress(g)*100).toFixed(1),clean:+condition(g).toFixed(2),steps:g.steps,medals:g.blocks.filter(b=>b.clean).length,bestFlow:g.bestFlow,points:score(g),crossings:g.crossings,route};
}
if(process.argv[1]===new URL(import.meta.url).pathname){const results=[];for(const seed of (process.argv.slice(2).length?process.argv.slice(2).map(Number):[1,42,321,9182]))results.push(guidedRun(seed));console.log(JSON.stringify(results,null,2));}
