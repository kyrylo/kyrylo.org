import {selectFoot,takeStep,advance} from '../model.js';
// Reach the troublesome stance through real blocked swings.
export function stageBarrierTrap(g,rail,kind='corner'){
 const sign=rail.x<450?1:-1,edge=rail.x+sign*rail.halfWidth,free=sign>0?1:0,trapped=1-free;
 g.phase='walking';
 g.feet.forEach(f=>{f.x=kind==='corner'?edge+sign*(f.side===free?20:-10):rail.x+(f.side?15:-15);f.y=rail.y-rail.halfLength-100;f.bestY=f.y;});
 for(const side of [trapped,free,trapped]){
  selectFoot(g,side);takeStep(g,{x:g.feet[side].x,y:rail.y+500});
  for(let n=0;n<250&&g.mode!=='idle';n++)advance(g,1/120);
 }
 return {sign,edge,free,trapped};
}
