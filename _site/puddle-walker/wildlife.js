import { randomSource } from './model.js?v=footprint-perf-131';

export function createWildlife(street) {
  const rand = randomSource(street.seed ^ 0x42697264);
  return {
    birds: [1010, 1055, 2920].map((y, i) => ({
      x: i === 2 ? 550 + rand() * 55 : 320 + i * 48 + rand() * 20,
      y, angle: (rand() - .5) * 1.3, phase: rand() * 6.28,
      escapeAt: null, direction: 0, waddler:i===2, walk:null,
    })), events: [],
  };
}

export function updateWildlife(life, game) {
  if (game.phase !== 'walking') return;
  for (const bird of life.birds) {
    if (bird.escapeAt !== null) continue;
    const pose=bird.walk?groundPose(bird,game.time,game.reduced):bird;
    const nearest = game.feet.reduce((a, b) => Math.hypot(a.x - pose.x, a.y - pose.y) < Math.hypot(b.x - pose.x, b.y - pose.y) ? a : b);
    const distance=Math.hypot(nearest.x-pose.x,nearest.y-pose.y);
    // The solitary pigeon first tries three officious little steps. A close
    // shoe still sends it straight into the air; it can never be trodden on.
    if(bird.waddler&&!game.reduced&&distance>=105){
      if(!bird.walk&&distance<275){
        const dx=(bird.x-nearest.x)/distance*54,dy=(bird.y-nearest.y)/distance*54;
        const clear=[0,.5,1].every(t=>!(game.street.obstacles||[]).some(o=>
          Math.hypot(Math.max(0,Math.abs(bird.x+dx*t-o.x)-(o.halfWidth||0)),Math.max(0,Math.abs(bird.y+dy*t-o.y)-(o.halfLength||0)))<(o.halfWidth?0:o.r)+24));
        if(clear){bird.walk={at:game.time,dx,dy};continue;}
      }
      if(bird.walk&&(game.time-bird.walk.at<1.05||distance>=200))continue;
    }
    if(distance>=(bird.walk?200:175))continue;
    bird.escapeAt = game.time;
    bird.flightX=pose.x;bird.flightY=pose.y;
    bird.direction = pose.x < (game.feet[0].x + game.feet[1].x) / 2 ? -1 : 1;
    life.events.push({type:'wings', x:pose.x, y:pose.y});
  }
}

function groundPose(bird,time,reduced){
  const walk=bird.walk;
  if(!walk)return {x:bird.x,y:bird.y,z:0,flying:false,visible:true,
    angle:bird.angle+(reduced?0:Math.sin(time*1.3+bird.phase)*.08),bob:0,
    peck:reduced?0:Math.max(0,Math.sin(time*2.6+bird.phase))**12};
  const age=Math.max(0,time-walk.at);
  const steps=Math.min(3,age/.35),whole=Math.floor(steps),part=steps-whole;
  const stride=reduced?1:(whole+part*part*(3-2*part))/3;
  const moving=!reduced&&age<1.05,target=Math.atan2(walk.dx,walk.dy);
  const turn=Math.atan2(Math.sin(target-bird.angle),Math.cos(target-bird.angle));
  const heading=bird.angle+turn*(reduced?1:Math.min(1,age/.18));
  // Feet pause between strides; the body rolls gently over the planted foot.
  return {x:bird.x+walk.dx*stride,y:bird.y+walk.dy*stride,z:0,flying:false,visible:true,
    angle:heading+(reduced?0:moving?Math.sin(steps*Math.PI)*.055:Math.sin(time*1.3+bird.phase)*.08),
    bob:moving?Math.sin(part*Math.PI)**2*1.3:0,
    peck:reduced||moving?0:Math.max(0,Math.sin(time*2.6+bird.phase))**12};
}

export function birdPose(bird, time, reduced = false) {
  if (bird.escapeAt === null) return groundPose(bird,time,reduced);
  const age = Math.max(0, time - bird.escapeAt);
  return {
    x:(bird.flightX??bird.x) + bird.direction * (age * 160 + age * age * 160),
    y:(bird.flightY??bird.y) + age * 145, z:Math.min(150, age * age * 230),
    angle:bird.direction * .85, flying:true, visible:!reduced && age < 1.8,
    wings:.4 + Math.abs(Math.sin(age * 22)) * .6, peck:0,
  };
}
