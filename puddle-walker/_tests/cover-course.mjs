// Offline witness for the later flooded shortcut, shared by checks and preview.
export function coverCourse(g,careful=true){
 const s=g.street.sections.find(s=>s.coverPattern==='staggered');
 const covers=g.street.patches.filter(p=>p.type==='metal'&&Math.abs(p.y-s.y)<180&&Math.abs(p.x-450)<60).sort((a,b)=>a.y-b.y);
 const active=covers[0].x>450?1:0;
 const targets=covers.map(p=>{
  const leaves=g.street.patches.find(q=>q.leafMat&&q.onCover&&Math.abs(q.y-p.y)<1);
  return {x:p.x-(careful&&leaves?Math.sign(leaves.x-p.x)*18:0),y:p.y};
 });
 targets.push({x:covers[1].x,y:s.y+335},{x:covers[2].x,y:s.y+370});
 return {s,covers,active,targets:targets.map((p,i)=>({...p,side:(active+i)%2}))};
}
