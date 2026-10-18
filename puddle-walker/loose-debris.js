import {ROAD,MATERIALS,surfaceAt,shoeContainsPoint} from './model.js?v=instant-menu-132';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const leafColors=['#93733f','#857445','#a38b57','#4b5e34'];
const wetAt=(g,x,y)=>{const s=surfaceAt(g,x,y);return MATERIALS[s.type].liquid?clamp(s.depth/2,0,1):s.type==='metal'?.6:0;};

export function createLooseDebris(g){
  const items=[],sources=new Set();
  for(const source of g.street.clutter){
    if(source.type===4||source.x<ROAD.left+8||source.x>ROAD.right-8)continue;
    const surface=surfaceAt(g,source.x,source.y);
    // Deep-water litter stays in the baked water scene. Only loose material on
    // the walking surface can be displaced by the sole.
    if(MATERIALS[surface.type].liquid&&surface.depth>1.5)continue;
    items.push({...source,source,wet:wetAt(g,source.x,source.y),pressure:0,hits:0,motion:null});sources.add(source);
  }
  return {street:g.street,items,sources,time:g.time,lastLanding:null};
}

export function debrisPose(item,time,reduced=false){
  const m=item.motion;if(!m)return {x:item.x,y:item.y,z:0,angle:item.angle,opacity:1};
  const age=Math.max(0,time-m.at),t=reduced?1:clamp(age/m.duration,0,1),ease=1-(1-t)**3;
  let z=0;
  if(!reduced&&t<1){
    if(item.type===6){
      const v=Math.sqrt(2*900*m.height),flight=2*v/900,second=age-flight;
      z=age<flight?v*age-450*age*age:Math.max(0,v*.28*second-450*second*second);
    }else z=Math.sin(t*Math.PI)*m.height;
  }
  return {x:m.x+(m.tx-m.x)*ease,y:m.y+(m.ty-m.y)*ease,z,
    angle:m.angle+m.turn*ease,opacity:m.sink?1-ease:1};
}

export function updateLooseDebris(scene,g){
  if(g.phase!=='walking')return;
  scene.time=g.time;
  const land=g.lastLanding;if(!land||land.at===scene.lastLanding)return;
  scene.lastLanding=land.at;
  for(const item of scene.items){
    if(Math.abs(item.x-land.x)>145||Math.abs(item.y-land.y)>155)continue;
    const pose=debrisPose(item,land.at);
    if(pose.opacity<.05||Math.abs(pose.x-land.x)>45||Math.abs(pose.y-land.y)>55)continue;
    const co=Math.cos(pose.angle),si=Math.sin(pose.angle);
    const w=item.type===5?5:item.type===6?item.size/4:item.size*.32;
    const h=item.type===5?5:item.type===6?item.size/4:item.size*.65;
    let touched=0;
    for(const [x,y] of [[0,0],[-w,0],[w,0],[0,-h],[0,h]])
      if(shoeContainsPoint(g,land,pose.x+x*co+y*si,pose.y-x*si+y*co))touched++;
    if(!touched)continue;
    const fraction=touched/5,force=clamp(land.force,.5,1.4),speed=Math.hypot(land.vx,land.vy);
    const dx=pose.x-land.x,dy=pose.y-land.y,distance=Math.hypot(dx,dy)||1;
    let nx=dx/distance*.7+land.vx/Math.max(1,speed)*.3,ny=dy/distance*.7+land.vy/Math.max(1,speed)*.3;
    if(Math.hypot(nx,ny)<.01){nx=land.side?1:-1;ny=.25;}
    const normal=Math.hypot(nx,ny);nx/=normal;ny/=normal;
    const wet=wetAt(g,pose.x,pose.y),edge=1-fraction*.65;
    const travel=(item.type===6?12:item.type===5?19:14)*force*edge*(.7+Math.min(1,speed/650))*(1-wet*.82);
    const tx=clamp(pose.x+nx*travel,Math.max(ROAD.left+2,item.x-96),Math.min(ROAD.right-2,item.x+96));
    const ty=clamp(pose.y+ny*travel,item.y-96,item.y+96),landing=surfaceAt(g,tx,ty);
    item.wet=Math.max(wet,wetAt(g,tx,ty));item.pressure=clamp(item.pressure+fraction*force*.7,0,1);item.hits++;
    const height=(item.type===6?4.5:item.type===5?2.5:1.8)*force*edge*(1-wet);
    const duration=item.type===6?2*Math.sqrt(2*height/900)*1.28+.16:.3+travel*.012;
    item.motion={at:land.at,x:pose.x,y:pose.y,angle:pose.angle,tx,ty,height,duration,
      turn:(nx>=0?1:-1)*(item.type===6?1.5:.65)*edge*(1-wet*.9),
      sink:item.type===6&&MATERIALS[landing.type].liquid&&landing.depth>item.size/3};
  }
}

// A few small sprites carry veins, folds, grit and contact shadows. Their
// geometry is baked once; walking only changes position, angle and compression.
export function createDebrisPainter(){
  const sprites=new Map();
  function sprite(type,pressed,wet){
    const key=`${type}:${pressed}:${wet}`;if(sprites.has(key))return sprites.get(key);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=72;
    const c=canvas.getContext('2d');c.scale(3,3);c.translate(12,12);
    if(type<4){
      const path=new Path2D('M0 -10 C3 -8 5 -5 5.5 -2 L5 -.8 L6 .2 L5 2.3 L4.8 3.9 L3.5 5 L2.5 7 L1 8 L0 10 C-3 7 -5 4 -4.8 1 L-5.5 -.3 L-4.5 -1.7 C-4.6 -5 -2 -8 0 -10 Z');
      c.save();c.translate(.5,.7);c.fillStyle='#17231f50';c.fill(path);c.restore();
      c.fillStyle=leafColors[type];c.fill(path);
      c.save();c.clip(path);
      const shade=c.createLinearGradient(-5,-3,5,3);shade.addColorStop(0,wet?'#192b2266':'#302e2a40');shade.addColorStop(.48,'#ead09a20');shade.addColorStop(1,'#302e292a');c.fillStyle=shade;c.fillRect(-10,-11,20,22);
      c.strokeStyle='#3b402744';c.lineWidth=.22;
      for(let y=-7;y<8;y+=3){c.beginPath();c.moveTo(0,y+2);c.lineTo(-5,y-1);c.moveTo(0,y+2);c.lineTo(5,y-1);c.stroke();}
      if(pressed){c.strokeStyle='#302e2159';c.lineWidth=.4;c.beginPath();c.moveTo(-4,-1);c.lineTo(1,2);c.lineTo(3,4);c.stroke();}
      for(let i=0;i<85;i++){c.fillStyle=i%3?'#3b33232e':'#d4bb7a40';c.fillRect(Math.sin(i*17.1)*6,Math.cos(i*7.7)*10,.25,.35);}
      c.restore();c.strokeStyle='#3d3b2970';c.lineWidth=.35;c.beginPath();c.moveTo(0,-9);c.quadraticCurveTo(-.8,1,.5,11);c.stroke();
    }else if(type===5){
      const path=new Path2D(pressed?'M-5.5 -5 L-1 -5.7 L.3 -4.9 L4.8 -3.8 L6 -1.1 L4.5 1.4 L5 4.9 L1.5 5.2 L0 4.6 L-4.8 3.6 L-4.2 .7 Z':'M-5 -6 L7 -3 L5 7 L-5 4 Z');
      c.save();c.translate(.5,.7);c.fillStyle='#1b252344';c.fill(path);c.restore();
      c.fillStyle=wet?'#989990':'#c0bfb3';c.fill(path);c.save();c.clip(path);
      const shade=c.createLinearGradient(-4,-5,4,5);shade.addColorStop(0,'#f7f1db29');shade.addColorStop(.45,'#4b514721');shade.addColorStop(.6,'#f8f2df21');shade.addColorStop(1,'#4b514718');c.fillStyle=shade;c.fillRect(-7,-7,14,14);
      c.strokeStyle='#787f764d';c.lineWidth=.4;for(let y=-3;y<4;y+=1.5){c.beginPath();c.moveTo(-3,y);c.lineTo(3,y+.2);c.stroke();}
      c.strokeStyle='#f0ebd94c';c.lineWidth=.45;c.beginPath();c.moveTo(-4,-5);c.lineTo(0,0);c.lineTo(5,-2);c.stroke();
      if(pressed){c.fillStyle='#646d633a';c.beginPath();c.moveTo(0,0);c.lineTo(5,-2);c.lineTo(2,5);c.closePath();c.fill();c.strokeStyle='#f2ecdc52';c.beginPath();c.moveTo(-4,3);c.lineTo(0,0);c.lineTo(2,5);c.stroke();}
      for(let i=0;i<65;i++){c.fillStyle=i%2?'#41493d1a':'#fff6de25';c.fillRect(Math.sin(i*9.3)*7,Math.cos(i*17.7)*7,.2,.3);}c.restore();
    }else{
      c.fillStyle='#17211c55';c.beginPath();c.ellipse(.7,1,3.5,2.4,0,0,Math.PI*2);c.fill();
      const shade=c.createLinearGradient(-2,-2,2,3);shade.addColorStop(0,wet?'#808477':'#b1b1a1');shade.addColorStop(1,wet?'#5f655c':'#898f81');c.fillStyle=shade;c.beginPath();c.moveTo(-3,-1);c.lineTo(-1,-2.6);c.lineTo(2,-2);c.lineTo(3.4,.8);c.lineTo(.5,2.6);c.lineTo(-2,1.8);c.closePath();c.fill();
      c.fillStyle='#d4d3bd40';c.beginPath();c.moveTo(-3,-1);c.lineTo(-1,-2.6);c.lineTo(2,-2);c.lineTo(.1,.2);c.closePath();c.fill();
    }
    sprites.set(key,canvas);return canvas;
  }
  return (c,scene,screenY,height,reduced=false)=>{
    if(!scene)return;
    for(const item of scene.items){
      const originY=screenY(item.y);if(originY< -120||originY>height+120)continue;
      const pose=debrisPose(item,scene.time,reduced),y=screenY(pose.y);if(y< -20||y>height+20||pose.opacity<.01)continue;
      const size=item.type===5?24:item.size*2.4,pressed=item.pressure>.25;
      c.save();c.globalAlpha=pose.opacity;
      if(pose.z>0){c.fillStyle='#15241c25';c.beginPath();c.ellipse(pose.x+.7,y+.8,size*.24,size*.15,pose.angle,0,Math.PI*2);c.fill();}
      c.translate(pose.x,y-pose.z*.65);c.rotate(pose.angle);
      if(item.type!==6)c.scale(1+item.pressure*.08,1-item.pressure*.13);
      c.drawImage(sprite(item.type,pressed,item.wet>.3),-size/2,-size/2,size,size);c.restore();
    }
  };
}
