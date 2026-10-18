import {shoeContainsPoint,surfaceAt,MATERIALS} from './model.js?v=light-materials-135';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Decoration has its own state: water can move a boat without moving the player's shoes.
export function createStreetMotion(boats, x, side, phase, ball=null, duck=null, snail=null, dandelion=null, snack=null, balloon=null, helper=null) {
  return {
    lastTime:0,phase,events:[],
    cat:{x, y:1900, lastNear:-99, wake:0},
    ball:ball?{...ball,vx:0,vy:0,roll:0,wet:0,started:false,nudges:0,trail:[],lastTrail:0}:null,
    duck:duck?{...duck,angle:.2,nudges:0,nudgedAt:-99,kickX:0,kickY:0,contact:false,pressed:0,ripples:new WeakSet()}:null,
    snail:snail?{...snail,distance:0,shy:0,lastNear:-99}:null,
    dandelion:dandelion?{...dandelion,burstAt:null}:null,
    thief:snack?{...snack,direction:snack.x<450?-1:1,startedAt:null,escapeAt:null,stolen:false,flightX:null,flightY:null,flightAngle:0}:null,
    balloon:balloon?{...balloon,nudgedAt:null}:null,
    helper:helper?{...helper,noddedAt:null}:null,
    boats:boats.map(boat => ({...boat, dx:0, dy:0, roll:0, vx:0, vy:0, spin:0, crushedAt:null, crush:null, ripples:new WeakSet()})),
    butterflies:[1630, 3480].map((y, i) => ({x:x + (side ? -8 : 8), y, direction:side ? -1 : 1, phase:phase + i * 3.1, startledAt:null}))
  };
}
export function updateStreetMotion(scene, game) {
  const elapsed = clamp(game.time - scene.lastTime, 0, .1); scene.lastTime = game.time;
  if (game.phase !== 'walking') return;
  if(scene.thief)updateBiscuitThief(scene.thief,game,scene.events);
  const helper=scene.helper;
  if(helper&&helper.noddedAt===null&&!game.reduced&&game.feet.some(f=>
    f.z<=30&&Math.hypot(f.vx||0,f.vy||0)>55&&Math.hypot(f.x-helper.x,f.y-helper.y)<140))helper.noddedAt=game.time;
  const balloon=scene.balloon;
  // Just the passing wake of a low, moving shoe. The tethered balloon is
  // scenery, so it never pushes a foot, adds dirt or changes the race clock.
  if(balloon&&balloon.nudgedAt===null&&!game.reduced&&game.feet.some(f=>
    f.z<=30&&Math.hypot(f.vx||0,f.vy||0)>55&&Math.hypot(f.x-balloon.x,f.y-balloon.y)<135))balloon.nudgedAt=game.time;
  const flower=scene.dandelion;
  // A passing shoe stirs a few loose seeds. Standing beside the plant, or
  // merely scrolling it into view, never produces an endless particle emitter.
  if(flower&&flower.burstAt===null&&!game.reduced&&game.feet.some(f=>
    f.z<=30&&Math.hypot(f.vx||0,f.vy||0)>55&&Math.hypot(f.x-flower.x,f.y-flower.y)<86))flower.burstAt=game.time;
  if(scene.snail){
    const snail=scene.snail,pose=snailPose(snail);
    if(game.feet.some(f=>f.z<=10&&Math.hypot(f.x-pose.x,f.y-pose.y)<135))snail.lastNear=game.time;
    const hiding=game.time-snail.lastNear<1.2;
    snail.shy+=((hiding?1:0)-snail.shy)*(1-Math.exp(-elapsed*(hiding?12:2.3)));
    // A tiny, finite journey toward a fallen leaf, leaving a silver trail.
    // It stops while tucked in and never enters the walkable street.
    if(!game.reduced&&game.feet.some(f=>Math.abs(f.y-snail.y)<450))snail.distance=Math.min(14,snail.distance+elapsed*.42*(1-snail.shy));
  }
  if(scene.duck)updateFloatingDuck(scene.duck,game,elapsed);
  if(scene.ball&&!game.reduced)updateTennisBall(scene.ball,game,elapsed);
  const cat = scene.cat;
  if (game.feet.some(f => Math.hypot(f.x - cat.x, f.y - cat.y) < 400)) cat.lastNear = game.time;
  const alert = game.time - cat.lastNear < 3.2;
  cat.wake += ((alert ? 1 : 0) - cat.wake) * (1 - Math.exp(-elapsed * (alert ? 5 : 1.8)));
  for (const boat of scene.boats) {
    if(boat.crushedAt!==null)continue;
    const pose=boatPose(boat,game.time,scene.phase,game.reduced),co=Math.cos(pose.angle),si=Math.sin(pose.angle);
    for(const foot of game.feet){
      if(!(foot.z<=4)||Math.hypot(foot.x-pose.x,foot.y-pose.y)>55)continue;
      let contacts=0;
      // Sample the paper hull against the actual mirrored shoe silhouette.
      // A shoe swinging over it, or passing beside it, cannot crush the boat.
      for(const [x,y] of [[0,0],[-10,0],[10,0],[-5,-5],[5,-5],[-5,5],[5,5]]){
        if(shoeContainsPoint(game,foot,pose.x+x*co-y*si,pose.y-x*si-y*co))contacts++;
      }
      if(!contacts)continue;
      boat.crushedAt=game.time;boat.crush={...pose,side:foot.side,shoeAngle:foot.angle,
        pressure:contacts/7,soil:foot.coverage||0,material:foot.dirtSource||'mud'};
      boat.vx=boat.vy=boat.spin=0;
      scene.events.push({type:'paper',x:pose.x,y:pose.y,side:foot.side,force:.5+contacts/7});
      break;
    }
    if(boat.crushedAt!==null)continue;
    for (const ring of game.rings) {
      if (boat.ripples.has(ring)) continue;
      const dx = boat.x - ring.x, dy = boat.y - ring.y, distance = Math.hypot(dx, dy);
      if (distance > 110 || distance > ring.radius + 16) continue;
      boat.ripples.add(ring);
      const force = clamp(ring.strength, 0, 2) * (1 - distance / 130);
      boat.vx += dx / Math.max(1, distance) * force * 22;
      boat.vy += dy / Math.max(1, distance) * force * 22;
      boat.spin += (dx >= 0 ? 1 : -1) * force * .65;
    }
    // Damped buoyancy: small ripples rock the paper hull, then it settles in place.
    const steps = Math.ceil(elapsed * 120), dt = steps ? elapsed / steps : 0;
    for (let i = 0; i < steps; i++) {
      boat.vx += (-boat.dx * 10 - boat.vx * 3.5) * dt;
      boat.vy += (-boat.dy * 10 - boat.vy * 3.5) * dt;
      boat.spin += (-boat.roll * 24 - boat.spin * 3.6) * dt;
      boat.dx = clamp(boat.dx + boat.vx * dt, -12, 12);
      boat.dy = clamp(boat.dy + boat.vy * dt, -12, 12);
      boat.roll = clamp(boat.roll + boat.spin * dt, -.22, .22);
    }
  }
  for (const butterfly of scene.butterflies) {
    if (butterfly.startledAt !== null && game.time - butterfly.startledAt < 9) continue;
    if (game.feet.some(f => Math.hypot(f.x - butterfly.x, f.y - butterfly.y) < 205)) butterfly.startledAt = game.time;
  }
}
function updateBiscuitThief(thief,game,events){
  if(thief.escapeAt!==null)return;
  const pose=biscuitThiefPose(thief,game.time,game.reduced);
  const startled=game.feet.some(f=>f.z<=30&&Math.hypot(f.x-pose.x,f.y-pose.y)<105);
  if(thief.startedAt===null&&!game.reduced&&game.feet.some(f=>f.y>thief.y-360&&f.y<thief.y+160))thief.startedAt=game.time;
  const age=thief.startedAt===null?-1:game.time-thief.startedAt;
  if(age>=1.55)thief.stolen=true;
  if(!startled&&(game.reduced||age<1.85))return;
  // Scheduled take-off uses the exact story time, not the first rendered frame
  // after it. A close shoe can interrupt the attempt before the biscuit is taken.
  const at=startled?game.time:thief.startedAt+1.85,launch=biscuitThiefPose(thief,at,game.reduced);
  thief.escapeAt=at;thief.flightX=launch.x;thief.flightY=launch.y;thief.flightAngle=launch.angle;
  events.push({type:'wings',x:launch.x,y:launch.y,encounter:'biscuit-thief'});
}
export function biscuitThiefPose(thief,time,reduced=false){
  const age=thief.startedAt===null?-1:Math.max(0,time-thief.startedAt),carrying=thief.stolen||age>=1.55;
  if(thief.escapeAt!==null){
    const flight=Math.max(0,time-thief.escapeAt),turn=clamp(flight/.22,0,1);
    return {x:thief.flightX+thief.direction*(flight*180+flight*flight*180),y:thief.flightY+flight*80,
      z:Math.min(150,flight*flight*220),angle:thief.flightAngle+(thief.direction*.95-thief.flightAngle)*turn,
      wings:.4+Math.abs(Math.sin(flight*22))*.6,bob:0,peck:0,flying:true,visible:!reduced&&flight<1.8,
      carrying:thief.stolen,stage:thief.stolen?'escaped-with-biscuit':'startled'};
  }
  const walk=clamp((age-.35)/.75,0,1)*3,whole=Math.floor(walk),part=walk-whole;
  const progress=(whole+part*part*(3-2*part))/3;
  const peck=age>=1.1&&age<1.55?Math.sin((age-1.1)/.45*Math.PI)**2:0;
  return {x:thief.x,y:thief.y-76+progress*50,z:0,
    angle:reduced?0:age>=0&&age<.35?Math.sin(age/.35*Math.PI*2)*.2:0,
    bob:reduced?0:Math.sin(part*Math.PI)**2*1.2,peck:reduced?0:peck*1.8,
    flying:false,visible:true,carrying,stage:age<0?'waiting':age<.35?'looking':age<1.1?'sneaking':age<1.55?'pecking':'holding'};
}
export function doorstepBalloonPose(balloon,time,reduced=false){
  const age=balloon.nudgedAt===null?-1:Math.max(0,time-balloon.nudgedAt);
  const wake=!reduced&&age>=0&&age<3.2?Math.sin(age*7)*Math.exp(-age*1.5)*10:0;
  const breeze=reduced?0:Math.sin(time*.8+balloon.phase)*2.5;
  return {x:balloon.x+balloon.direction*(breeze+wake),y:balloon.y+42,
    lift:reduced?55:55+Math.sin(time*1.1+balloon.phase)*1.6-wake*.15,
    angle:reduced?-.08:-.08+balloon.direction*(breeze+wake)*.012,
    anchorX:balloon.x-balloon.direction*7,anchorY:balloon.y-16,
    nudged:balloon.nudgedAt!==null,sway:wake};
}
export function workshopHelperPose(helper,time,reduced=false){
  const age=helper.noddedAt===null?-1:Math.max(0,time-helper.noddedAt);
  const wobble=!reduced&&age>=0&&age<3?Math.sin(age*13)*Math.exp(-age*1.7):0;
  return {x:helper.x+wobble*2.8,y:helper.y,angle:.07+wobble*.22,
    anchorX:helper.x,anchorY:helper.y-18,nodded:helper.noddedAt!==null,wobble};
}
export const DANDELION_SEEDS=[3,8,13,18,23,28,33,38];
export function dandelionSeedOrigin(index){
  const angle=index*2.4,radius=2+Math.sqrt(index/39)*6.5;
  return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
}
export function dandelionPose(flower,time,reduced=false){
  const age=flower.burstAt===null?-1:Math.max(0,time-flower.burstAt);
  return {x:flower.x,y:flower.y,spent:flower.burstAt!==null,
    lean:reduced?0:Math.sin(time*1.2+flower.y)*.6+(age<0?0:Math.sin(age*7)*Math.exp(-age*3)*flower.direction*3),
    seedsVisible:!reduced&&age>=0&&age<4.8};
}
export function dandelionSeedPose(flower,time,index){
  if(flower.burstAt===null)return null;
  const age=time-flower.burstAt;if(age<0||age>=4.8)return null;
  const origin=dandelionSeedOrigin(DANDELION_SEEDS[index]),birthLean=Math.sin(flower.burstAt*1.2+flower.y)*.6;
  return {x:flower.x+birthLean+origin.x+flower.direction*(age*(12+index*1.6)+Math.sin(age*1.8+index)*age*2),
    y:flower.y-origin.y+age*(10+index*.8)+Math.sin(age*1.3+index)*age*2,
    z:Math.sin(age/4.8*Math.PI)*(12+index*.9),angle:Math.sin(age*1.5+index)*.35,
    alpha:Math.min(1,(4.8-age)/1.2)};
}
export function snailPose(snail){
  const t=snail.distance/14;
  return {x:snail.x+snail.direction*snail.distance,y:snail.y+Math.sin(t*Math.PI)*1.5,
    angle:snail.direction*Math.PI/2,shy:snail.shy,distance:snail.distance};
}
export function floatingDuckPose(duck,time,reduced=false){
  const age=Math.max(0,time-duck.nudgedAt),kick=reduced?0:(1-Math.exp(-age*12))*Math.exp(-age*1.8);
  return {x:duck.x+duck.kickX*kick+(reduced?0:Math.sin(time*.8)*1.2),y:duck.y+duck.kickY*kick,
    angle:duck.angle+(reduced?0:Math.sin(time*.9)*.035+duck.kickX*kick*.012),squash:reduced?0:duck.pressed};
}
function updateFloatingDuck(duck,game,dt){
  const pose=floatingDuckPose(duck,game.time,game.reduced);
  const contact=game.feet.find(f=>f.z<=5&&Math.hypot(f.x-pose.x,f.y-pose.y)<52&&
    [[0,0],[-7,0],[7,0],[0,10],[0,-10]].some(([x,y])=>shoeContainsPoint(game,f,pose.x+x,pose.y+y)));
  if(contact&&!duck.contact){
    const dx=duck.x-contact.x,dy=duck.y-contact.y,length=Math.hypot(dx,dy)||1;
    duck.kickX=dx/length*14;duck.kickY=dy/length*14;duck.nudgedAt=game.time;duck.nudges++;
  }
  duck.contact=Boolean(contact);duck.pressed+=((contact?.48:0)-duck.pressed)*(1-Math.exp(-dt*16));
  if(!contact)for(const ring of game.rings){
    if(duck.ripples.has(ring))continue;
    const dx=duck.x-ring.x,dy=duck.y-ring.y,length=Math.hypot(dx,dy);
    if(length>110||length>ring.radius+18)continue;
    duck.ripples.add(ring);const force=clamp(ring.strength,0,2)*(1-length/130);
    duck.kickX=dx/Math.max(1,length)*force*11;duck.kickY=dy/Math.max(1,length)*force*11;duck.nudgedAt=game.time;
  }
}
// A little front-yard encounter. The ball reacts to shoes and street furniture;
// the player's physics and contamination never react to this decoration.
export function updateTennisBall(ball,game,elapsed){
  if(!ball.started){
    if(!game.feet.some(f=>f.y>ball.y-260&&f.y<ball.y+100))return;
    ball.started=true;ball.vx=ball.direction*125;ball.vy=-18;
  }
  for(const f of game.feet){
    if(f.z>10||Math.hypot(ball.x-f.x,ball.y-f.y)>55)continue;
    const touches=()=>[[0,0],[-7,0],[7,0],[0,-7],[0,7]].some(([dx,dy])=>shoeContainsPoint(game,f,ball.x+dx,ball.y+dy));
    if(!touches())continue;
    const dx=ball.x-f.x,dy=ball.y-f.y,d=Math.hypot(dx,dy),nx=d?dx/d:ball.direction,ny=d?dy/d:0;
    for(let i=0;i<48&&touches();i++){ball.x+=nx;ball.y+=ny;}
    const speed=Math.min(160,42+Math.hypot(f.vx||0,f.vy||0)*.35);
    ball.vx=nx*speed;ball.vy=ny*speed;ball.nudges++;
  }
  const contact=surfaceAt(game,ball.x,ball.y),liquid=MATERIALS[contact.type].liquid;
  if(liquid&&contact.depth>.5)ball.wet=Math.min(1,ball.wet+elapsed*3);
  else ball.wet=Math.max(0,ball.wet-elapsed*.07);
  const drag=liquid?2.8:1.05,decay=Math.exp(-drag*elapsed);
  const dx=ball.vx*(1-decay)/drag,dy=ball.vy*(1-decay)/drag;
  ball.x+=dx;ball.y+=dy;ball.roll+=Math.hypot(dx,dy)/8;
  ball.vx*=decay;ball.vy*=decay;
  if(ball.x<94||ball.x>806){ball.x=clamp(ball.x,94,806);ball.vx*=-.45;}
  for(const o of game.street.obstacles){
    let px=clamp(ball.x,o.x-(o.halfWidth||0),o.x+(o.halfWidth||0)),py=clamp(ball.y,o.y-(o.halfLength||0),o.y+(o.halfLength||0));
    let ox=ball.x-px,oy=ball.y-py,d=Math.hypot(ox,oy);const r=8+(o.halfWidth?0:o.r||0);
    if(d>=r)continue;
    // Resolve an entry past a rectangle's edge to its nearest outside face.
    if(!d&&o.halfWidth){
      const sx=ball.x<o.x?-1:1,sy=ball.y<o.y?-1:1;
      if(o.halfWidth-Math.abs(ball.x-o.x)<o.halfLength-Math.abs(ball.y-o.y)){px=o.x+sx*o.halfWidth;ox=sx;oy=0;}
      else{py=o.y+sy*o.halfLength;ox=0;oy=sy;}d=1;
    }
    const nx=d?ox/d:ball.direction,ny=d?oy/d:0;
    ball.x=px+nx*r;ball.y=py+ny*r;
    const incoming=ball.vx*nx+ball.vy*ny;if(incoming<0){ball.vx-=incoming*1.5*nx;ball.vy-=incoming*1.5*ny;}
  }
  if(ball.wet>.1&&!liquid&&Math.hypot(dx,dy)>.2&&game.time-ball.lastTrail>.12){
    ball.trail.push({x:ball.x,y:ball.y,at:game.time,wet:ball.wet});ball.lastTrail=game.time;
    if(ball.trail.length>18)ball.trail.shift();
  }
  while(ball.trail.length&&game.time-ball.trail[0].at>12)ball.trail.shift();
}
export function boatPose(boat, time, phase, reduced = false) {
  if(boat.crush)return {x:boat.crush.x,y:boat.crush.y,angle:boat.crush.angle};
  if (reduced) return {x:boat.x, y:boat.y, angle:boat.angle};
  const drift = Math.sin(time * .7 + phase);
  return {x:boat.x + drift * 2 + boat.dx, y:boat.y + boat.dy, angle:boat.angle + drift * .035 + boat.roll};
}
export function butterflyPose(butterfly, time, reduced = false) {
  if (reduced) return {x:butterfly.x, y:butterfly.y, angle:0, wings:.7, height:0};
  const age = butterfly.startledAt === null ? 99 : time - butterfly.startledAt;
  const startled = age >= 0 && age < 8;
  const cycle = (time + butterfly.phase) % 12;
  const orbit = cycle < 5 ? 0 : Math.sin(Math.PI * (cycle - 5) / 7) ** 1.2;
  const alarm = startled ? Math.sin(Math.PI * clamp(age / 8, 0, 1)) ** .6 : 0;
  const flight = orbit + alarm * (1 - orbit);
  const t = time + butterfly.phase;
  return {
    x:butterfly.x + butterfly.direction * flight * (26 + Math.sin(t * 2.3) * 15 + alarm * 34),
    y:butterfly.y + flight * (Math.sin(t * 1.5) * 25 + alarm * 55),
    angle:Math.sin(t * 1.9) * flight * .8,
    wings:flight > .05 ? .15 + Math.abs(Math.sin(t * 21)) * .85 : .55 + Math.sin(t * 1.3) * .15,
    height:flight * 9 + alarm * 15
  };
}
