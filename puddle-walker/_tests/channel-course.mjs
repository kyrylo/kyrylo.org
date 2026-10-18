// Offline route witnesses shared by model checks and native-input QA fixtures.
export function channelCourse(game,direct){
 const section=game.street.sections.find(s=>s.kind==='double-runoff');
 const fork=game.street.sections.find(s=>s.stage===3&&s.kind==='stepping-stones');
 const across=x=>section.lanes[1]<450?900-x:x;
 const centres=direct?[[-130,450],[-100,450],[30,450],[220,450],[255,450]]:
  [[-150,700],[-110,700],[-60,590],[-30,540],[0,430],[30,380],[60,270],[90,230],[240,230],[280,230]];
 const crossingSteps=centres.length;
 // Gather on the dry approach, before the mud's broken edge.
 if(!direct){
  const inward=across(230)<450?1:0;
  if(game.active!==inward)centres.push([320,230]);
  for(let i=0;i<4;i++)centres.push([320,450]);
 }
 const targets=centres.map(([dy,x])=>({x:across(x),y:section.y+dy}));
 return {section,fork,targets,crossingSteps,start:{x:direct?450:section.lanes[1],y:section.y-335}};
}
