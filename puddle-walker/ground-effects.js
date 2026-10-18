// Contact marks use their own deterministic grain. Drawing never consumes the
// physics random stream, and only a touchdown allocates new surface detail.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const life={water:2.8,mud:75,oil:32,gravel:110,gum:180,poop:180,metal:14,clay:105,tar:180,cement:150,algae:65};
const colors={water:'#c9d9d1',mud:'#4b3421',oil:'#1d2629',gravel:'#6d6554',gum:'#aa7d85',poop:'#49321f',metal:'#344442',clay:'#824b2b',tar:'#211e1a',cement:'#aaa797',algae:'#394a27'};

export function recordGroundContact(g,f,shoe,samples){
  g.lastLanding={x:f.x,y:f.y,side:f.side,angle:f.angle,at:g.time,
    vx:f.vx,vy:f.vy,force:g.landingForce||1};
  const groups=new Map();
  for(const sample of samples){
    if(!sample.patch||sample.depth<=.3||!life[sample.type])continue;
    let group=groups.get(sample.patch);
    if(!group){group={patch:sample.patch,kind:sample.type,zones:Array(8).fill(0),points:[],depth:0};groups.set(sample.patch,group);}
    group.zones[sample.zone]+=.25;group.points.push(sample);group.depth+=sample.depth;
  }
  for(const group of groups.values()){
    const depth=group.depth/group.points.length,force=clamp(g.landingForce||1,.5,1.4);
    const mark={...group,x:f.x,y:f.y,angle:f.angle,side:f.side,width:shoe.width,length:shoe.length,
      born:g.time,life:group.kind==='mud'?Math.max(8,75-depth*2):life[group.kind],depth,force,
      seed:group.patch.seed+g.steps*73+f.side*31,slipX:0,slipY:0,pieces:[]};
    if(['mud','gravel','poop','clay','cement'].includes(mark.kind)){
      const count=Math.min(16,Math.ceil(group.points.length*.45*force));
      for(let i=0;i<count;i++){
        const n=mark.seed+i*19,point=group.points[Math.floor(noise(n)*group.points.length)];
        const dx=point.x-f.x,dy=point.y-f.y,d=Math.hypot(dx,dy)||1;
        const speed=(mark.kind==='gravel'?16:8)*(1+noise(n+1)*2)*force;
        mark.pieces.push({x:point.x,y:point.y,vx:dx/d*speed,vy:dy/d*speed,
          lift:(mark.kind==='gravel'?35:20)*(1+noise(n+2)),r:(mark.kind==='gravel'?.45:.7)+noise(n+3)*.8,spin:noise(n+4)*6.28});
      }
    }
    g.groundContacts.push(mark);
    if(mark.kind==='gum'||mark.kind==='poop'){
      const previous=g.pressedPatches.get(mark.patch)||0;
      // A heel grazing the edge only compresses a little of the original lump.
      const touched=group.points.length*shoe.width*shoe.length/32;
      g.pressedPatches.set(mark.patch,Math.min(1,previous+touched/(Math.PI*mark.patch.rx*mark.patch.ry)*force));
    }
  }
  if(g.groundContacts.length>110)g.groundContacts.splice(0,g.groundContacts.length-110);
}
// The cloud is the pigment that actually left the shoe. Reuse the landing's
// masked contact points, sharing a tread zone between adjoining puddles.
export function recordRinse(g,f,zone,mass,color,offset=0){
  if(!(mass>0))return;
  let coverage=0,first=g.groundContacts.length-1;
  for(;first>=0;first--){
    const mark=g.groundContacts[first];if(mark.born<f.landedAt-1e-6)break;
    if(mark.side!==f.side||mark.kind!=='water'||!mark.zones[zone])continue;
    coverage+=mark.zones[zone];
  }
  if(!coverage)return;
  for(let i=first+1;i<g.groundContacts.length;i++){
    const mark=g.groundContacts[i];if(mark.side!==f.side||mark.kind!=='water'||!mark.zones[zone])continue;
    if(!mark.wash)mark.wash=Array(8).fill(null);
    let wash=mark.wash[zone];
    if(!wash){
      const points=mark.points.filter(p=>p.zone===zone);
      wash=mark.wash[zone]={x:points.reduce((n,p)=>n+p.x,0)/points.length,
        y:points.reduce((n,p)=>n+p.y,0)/points.length,mass:0,color:[0,0,0],seed:mark.seed+zone*19};
    }
    const added=mass*mark.zones[zone]/coverage,total=wash.mass+added;
    for(let c=0;c<3;c++)wash.color[c]=(wash.color[c]*wash.mass+color[offset+c]*added)/total;
    wash.mass=total;mark.life=Math.max(mark.life,5.6);
  }
}
export function rinsePose(mark,wash,age,reduced=false){
  if(!wash||wash.mass<.005||age<0||age>=5.6)return null;
  const spread=reduced?.6:1-Math.exp(-age*.9),fade=(1-age/5.6)**1.6;
  const dx=wash.x-mark.x,dy=wash.y-mark.y,distance=Math.hypot(dx,dy)||1;
  return {x:wash.x+dx/distance*spread*6,y:wash.y+dy/distance*spread*6,
    rx:(4+spread*12)*(.9+noise(wash.seed+1)*.2),ry:(6+spread*12)*(.85+noise(wash.seed+2)*.3),angle:noise(wash.seed)*Math.PI,
    alpha:(1-Math.exp(-wash.mass*8))*.55*fade};
}
// Bake soft, irregular wisps once per touched zone, never per animation frame.
// Weak keys release their small canvases with the expired contact marks.
const rinseSprites=new WeakMap();
function rinseSprite(wash){
  let sprite=rinseSprites.get(wash);if(sprite)return sprite;
  sprite=document.createElement('canvas');sprite.width=sprite.height=64;
  const c=sprite.getContext('2d'),color=wash.color.map(v=>Math.round(v)).join(',');
  for(let i=0;i<3;i++){
    const x=26+noise(wash.seed+i*11)*12,y=25+noise(wash.seed+i*17)*14,r=17+noise(wash.seed+i*23)*10;
    const cloud=c.createRadialGradient(x,y,0,x,y,r);
    cloud.addColorStop(0,`rgba(${color},.7)`);cloud.addColorStop(.4,`rgba(${color},.4)`);cloud.addColorStop(1,`rgba(${color},0)`);
    c.fillStyle=cloud;c.fillRect(0,0,64,64);
  }
  rinseSprites.set(wash,sprite);return sprite;
}
export function settleGroundContact(g,f){
  for(let i=g.groundContacts.length-1;i>=0;i--){
    const mark=g.groundContacts[i];if(mark.born<f.landedAt-1e-6)break;
    if(mark.side===f.side){mark.slipX=f.x-mark.x;mark.slipY=f.y-mark.y;}
  }
}
export function ageGroundContacts(g){
  g.groundContacts=g.groundContacts.filter(mark=>g.time-mark.born<mark.life);
}
export function groundPiecePose(piece,age,kind,reduced=false){
  const flight=piece.lift*2/260,bounce=kind==='gravel'?.28:0,second=flight*bounce;
  const firstTime=Math.min(Math.max(0,age),flight),secondTime=clamp(age-flight,0,second);
  const settle=1-Math.exp(-Math.max(0,age-flight-second)*12);
  const travel=firstTime+secondTime*.35+settle*.07;
  const z=age<flight?Math.max(0,piece.lift*firstTime-130*firstTime*firstTime):
    Math.max(0,piece.lift*bounce*secondTime-130*secondTime*secondTime);
  return {x:piece.x+piece.vx*travel,y:piece.y+piece.vy*travel,z:reduced?0:z,
    angle:piece.spin+(reduced?0:(firstTime+secondTime*.7)*8)};
}
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function stamp(c,mark,sprite,alpha,dx=0,dy=0){
  for(let i=0;i<8;i++){
    const amount=mark.zones[i];if(!amount)continue;
    const col=i%2,row=Math.floor(i/2);
    c.globalAlpha=alpha*amount;
    c.drawImage(sprite,col*48,row*56,48,56,(col/2-.5)*mark.width+dx,(row/4-.5)*mark.length+dy,mark.width/2,mark.length/4);
  }
}
export function paintGroundContacts(c,g,screenY,height,printSprite,pathFor,reduced=false,clipSurface=(c,p)=>c.clip(pathFor(p))){
  for(const mark of g.groundContacts||[]){
    const y=screenY(mark.y);if(y< -90||y>height+90)continue;
    const age=g.time-mark.born,fade=clamp((mark.life-age)/Math.min(10,mark.life),0,1);
    const p=mark.patch,wet=mark.kind==='water',oil=mark.kind==='oil';
    c.save();
    // An edge contact leaves a partial impression, never a full shoe floating
    // across the dry half of a puddle or over a neighbouring drain cover.
    c.translate(p.x,screenY(p.y));c.rotate(-Math.atan2(p.sin,p.cos));clipSurface(c,p);
    c.rotate(Math.atan2(p.sin,p.cos));c.translate(mark.x-p.x,p.y-mark.y);c.rotate(mark.angle);
    if(wet&&mark.wash)for(const wash of mark.wash){
      const pose=rinsePose(mark,wash,age,reduced);if(!pose)continue;
      const dx=pose.x-mark.x,dy=mark.y-pose.y,co=Math.cos(mark.angle),si=Math.sin(mark.angle);
      c.save();c.translate(dx*co+dy*si,-dx*si+dy*co);c.rotate(pose.angle);
      c.globalAlpha=pose.alpha;c.drawImage(rinseSprite(wash),-pose.rx,-pose.ry,pose.rx*2,pose.ry*2);c.restore();
    }
    if(!wet){
      const sprite=printSprite(mark.kind,mark.side),pressure=.3+mark.force*.23;
      // Pressed ridges catch light on one edge; the groove itself stays dark.
      if(mark.kind!=='metal')stamp(c,mark,printSprite('relief',mark.side),fade*.19,-.7,-.8);
      stamp(c,mark,sprite,fade*pressure);
      const slide=Math.hypot(mark.slipX,mark.slipY),co=Math.cos(mark.angle),si=Math.sin(mark.angle);
      const dx=mark.slipX*co-mark.slipY*si,dy=-mark.slipX*si-mark.slipY*co;
      if(slide>1.5)for(let i=1;i<=3;i++)stamp(c,mark,sprite,fade*pressure*(.22-i*.035),dx*i/3,dy*i/3);
      if(oil){
        for(let i=0;i<3;i++){
          c.globalAlpha=fade*.16;c.strokeStyle=['#638e9b','#ab9a67','#7d6e98'][i];c.lineWidth=.65;
          c.beginPath();c.ellipse(0,0,mark.width*(.44+i*.035),mark.length*(.43+i*.018),0,.1,Math.PI*1.8);c.stroke();
        }
      }
    }
    // Tiny trapped bubbles and squeezed beads follow actual wet contact points.
    c.restore();
    if(['water','mud','oil','metal','clay','cement','algae'].includes(mark.kind)&&age<2.8){
      for(let i=0;i<Math.min(7,mark.points.length);i++){
        const point=mark.points[(i*7)%mark.points.length],n=mark.seed+i*11;
        const delay=noise(n)*.35,t=Math.max(0,age-delay),a=Math.max(0,1-t/2.2);
        if(age<delay||!a)continue;
        c.save();c.globalAlpha=a*.42;c.strokeStyle=mark.kind==='mud'?'#b3a084':'#d4e0db';c.lineWidth=.5;
        c.beginPath();c.ellipse(point.x,screenY(point.y),.6+noise(n+1)*1.1+t*.45,.5+noise(n+1)*.7,0,0,Math.PI*2);c.stroke();c.restore();
      }
    }
    for(const piece of mark.pieces){
      const pose=groundPiecePose(piece,age,mark.kind,reduced),x=pose.x,yy=screenY(pose.y);
      c.save();c.globalAlpha=fade;
      oval(c,x+.6,yy+.8,piece.r*1.3,piece.r*.65,'#18201b55');
      c.translate(x,yy-pose.z*.65);c.rotate(pose.angle);
      c.fillStyle=colors[mark.kind];c.beginPath();c.moveTo(-piece.r,-piece.r*.3);c.lineTo(piece.r*.1,-piece.r*.8);c.lineTo(piece.r,piece.r*.2);c.lineTo(-piece.r*.2,piece.r*.7);c.closePath();c.fill();
      c.strokeStyle=mark.kind==='gravel'?'#d0c4a6aa':'#b49b7366';c.lineWidth=.35;c.beginPath();c.moveTo(-piece.r*.6,-piece.r*.3);c.lineTo(piece.r*.1,-piece.r*.65);c.stroke();c.restore();
    }
  }
}
export function paintStickyThreads(c,g,screenY){
  for(const mark of g.groundContacts||[]){
    if(mark.kind!=='gum'&&mark.kind!=='poop'&&mark.kind!=='tar')continue;
    const f=g.feet[mark.side];if(f.z<3||f.z>42||Math.abs(f.landedAt-mark.born)>1e-6)continue;
    const reach=Math.hypot(f.x-mark.x,f.y-mark.y);if(reach>64)continue;
    const opacity=(1-reach/70)*(1-f.z/48);
    for(let i=0;i<Math.min(3,mark.points.length);i++){
      const point=mark.points[(i*11)%mark.points.length];
      const x=point.x+(f.x-mark.x),y=screenY(point.y+f.y-mark.y)-f.z*.48;
      c.save();c.strokeStyle=mark.kind==='gum'?'#c9a2a6':mark.kind==='tar'?'#29251f':'#5c402a';c.globalAlpha=opacity;
      c.lineWidth=Math.max(.35,1.4-f.z*.025);c.beginPath();c.moveTo(point.x,screenY(point.y));
      c.quadraticCurveTo((point.x+x)/2+2,screenY(point.y)+2,x,y);c.stroke();c.restore();
    }
  }
}
