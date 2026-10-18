// Offline witness: ordinary foot placements, with no in-game route assistance.
export function stoneCourse(g){
 const s=g.street.sections.find(s=>s.kind==='stepping-stones'),stones=g.street.patches.filter(p=>p.steppingStone).sort((a,b)=>a.stoneOrder-b.stoneOrder);
 const mirror=stones[1].x<450,at=x=>mirror?900-x:x,outer=mirror?0:1,targets=[];
 const add=(side,x,y)=>targets.push({side,x:at(x),y:s.y+y});
 if(g.active!==outer)add(1-outer,420,-170);
 add(outer,480,g.active===outer?-170:-145);add(1-outer,430,g.active===outer?-145:-120);
 for(let i=1;i<4;i++)targets.push({side:i%2?outer:1-outer,x:stones[i].x,y:stones[i].y});
 add(1-outer,440,275);
 add(outer,610,345);add(1-outer,580,375);
 return {s,stones,targets};
}
