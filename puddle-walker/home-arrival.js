// Porch coordinates are shared by the painted mat and the arrival animation.
// World y increases toward the house; porch image y increases toward the street.
export const HOME = { porchTop:420, mat:{x:335,y:359,width:230,height:113}, threshold:243, inside:350 };
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
export function onWelcomeMat(foot,finishY) {
  const m=HOME.mat,y=finishY+HOME.porchTop-foot.y;
  return foot.z===0 && foot.x>=m.x+14 && foot.x<=m.x+m.width-14 && y>=m.y && y<=m.y+m.height;
}

// This is a presentation after the race, never another dirt/physics simulation.
// Keep the actual stains, wetness, jeans and race result exactly as they arrived.
export function beginHomeArrival(g,finishY,{reduced=false}={}) {
  const matY=finishY+HOME.porchTop-HOME.mat.y-HOME.mat.height/2;
  const poses=g.feet.map(f=>({x:f.x,y:f.y,angle:f.angle})),segments=[];
  let duration=0;
  const add=(side,to,stage,seconds)=>{
    const from={...poses[side]},length=Math.hypot(to.x-from.x,to.y-from.y);
    const span=seconds??(.24+length/1000);
    segments.push({side,from,to,start:duration,duration:span,stage});duration+=span;
    poses[side]={...to};
  };
  // An outside-lane finish still gets home. Approach one foot at a time, with
  // modest lateral steps and the inner foot leading, so the legs never cross.
  let side=(poses[0].x+poses[1].x)/2<450?1:0;
  for(let n=0;n<16;n++,side=1-side){
    const f=poses[side],support=poses[1-side],wantedX=side?480:420;
    let x=f.x+clamp(wantedX-f.x,-110,110);
    x=side?Math.max(x,support.x+36):Math.min(x,support.x-36);
    const y=f.y+clamp(matY-f.y,-180,180),to={x,y,angle:0};
    if(Math.hypot(x-f.x,y-f.y)>.1||Math.abs(f.angle)>.001)add(side,to,'gather');
    if(poses.every((p,i)=>Math.abs(p.x-(i?480:420))<.1&&Math.abs(p.y-matY)<.1&&p.angle===0))break;
  }
  for(const side of [0,1])add(side,{...poses[side]},'wipe',reduced?.18:.94);
  for(const [side,forward] of [[0,110],[1,200],[0,325],[1,HOME.inside]]){
    add(side,{x:side?480:420,y:finishY+forward,angle:0},'enter',.39);
  }
  const state={elapsed:0,duration,segments,stage:'gather',side:null,roll:0,fade:0,wiped:[0,0],matY,finishY,reduced,done:false};
  g.preview=null;g.arrival=state;return state;
}

export function advanceHomeArrival(g,seconds) {
  const a=g.arrival;if(!a||a.done)return true;
  const before=a.elapsed;
  a.elapsed=Math.min(a.duration,a.elapsed+clamp(seconds,0,.1));
  for(const segment of a.segments){
    const {side,from,to,start,duration,stage}=segment,end=start+duration,f=g.feet[side];
    if(a.elapsed<start)break;
    if(before<end&&a.elapsed>=end){
      Object.assign(f,to,{z:0});
      if(stage==='wipe')a.wiped[side]=1;
      else g.events.push({type:'home-step',side,surface:to.y>a.finishY+HOME.threshold?'wood':'concrete'});
    }
    if(a.elapsed>=end)continue;
    const t=clamp((a.elapsed-start)/duration,0,1),ease=smooth(t);
    a.stage=stage;a.side=side;a.roll=0;
    f.x=from.x+(to.x-from.x)*ease;f.y=from.y+(to.y-from.y)*ease;f.angle=from.angle+(to.angle-from.angle)*ease;
    if(stage==='wipe'){
      // Two short sole scrapes within the mat. The other shoe bears the weight.
      const wave=Math.sin(t*Math.PI*4);
      if(!a.reduced){f.y+=wave*16;f.z=Math.max(0,wave)*2.5;a.roll=wave*.2;}
      a.wiped[side]=t;
      for(const stroke of [.125,.625])if(before<start+duration*stroke&&a.elapsed>=start+duration*stroke)g.events.push({type:'wipe',side});
    }else{
      f.z=Math.sin(t*Math.PI)*(a.reduced?7:23);
      a.roll=a.reduced?0:Math.cos(t*Math.PI)*.55;
    }
    break;
  }
  a.fade=smooth(clamp((a.elapsed-(a.duration-.58))/.58,0,1));
  if(a.elapsed>=a.duration){a.stage='done';a.side=null;a.roll=0;a.done=true;}
  return a.done;
}
