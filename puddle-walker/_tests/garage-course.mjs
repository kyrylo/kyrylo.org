// Offline witnesses: take both options through the overflow and into the next bay.
export function garageCourse(game,direct){
 const section=game.street.sections.find(s=>s.kind==='garage-runoff');
 const next=game.street.sections.find(s=>s.parkingPattern==='crossing');
 const at=x=>section.gap<450?x:900-x;
 const centres=direct?[[-65,450],[65,450],[110,450]]:
   [[-100,340],[-70,290],[-30,230],[40,230],[65,330],[95,380],[155,350]];
 const crossingSteps=centres.length;
 if(direct)centres.push([155,370],[215,320]);
 const targets=centres.map(([dy,x])=>({x:at(x),y:section.y+dy}));
 targets.push({x:at(300),y:next.y-270},{x:next.gap,y:next.y-240});
 for(const dy of [-105,-65,75,140,270,330])targets.push({x:next.gap,y:next.y+dy});
 return {section,next,start:{x:450,y:section.y-135},targets,crossingSteps};
}

export function wheelRutCourse(game,direct=true){
 const section=game.street.sections.find(s=>s.parkingPattern==='squeeze');
 const patch=game.street.patches.find(p=>p.wheelRubble),y=patch.y-275;
 const x=direct?section.gap:section.lanes[1];
 return {section,patch,start:{x,y:y+190},targets:[350,375].map(dy=>({x,y:y+dy})),crossingSteps:2};
}
