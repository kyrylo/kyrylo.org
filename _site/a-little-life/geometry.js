/* Shared construction for the illustration. No canvas or DOM dependencies. */
(function (root, build) {
  const geometry = build();
  if (typeof module === 'object' && module.exports) module.exports = geometry;
  else root.LittleLifeGeometry = geometry;
})(globalThis, () => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const mix = (a,b,t) => a+(b-a)*t;
  const pointMix = (a,b,t) => a.map((v,i)=>mix(v,b[i],t));
  const add = (a,b) => [a[0]+b[0],a[1]+b[1]];
  const sub = (a,b) => [a[0]-b[0],a[1]-b[1]];
  const mul = (a,s) => [a[0]*s,a[1]*s];
  const length = a => Math.hypot(...a);
  const unit = a => mul(a,1/(length(a)||1));
  const smooth = t => {t=clamp(t);return t*t*(3-2*t);};
  const during = (t,a,b) => smooth((t-a)/(b-a));
  // Blocking is expressed in body-sized units, not viewport columns. The
  // walking order stays legible: elders, parents, partner, you, next generation.
  // Each change has a cause in the story; nobody crosses through another body.
  function stage(t) {
    const me=50+16*during(t,12,19)-66*during(t,25,34);
    // A child lets go to follow a friend. Later the parents make room for a
    // partner, while remaining a couple rather than separate cast members.
    const mom=me-39-37*during(t,14,22)-44*during(t,24,30);
    const dad=mix(mom-48,me-112,during(t,46,49));
    const grandpa=dad-65,grandma=grandpa-65;
    const friend=me+64+50*(1-during(t,6,9))+75*during(t,20,24.2);
    const love=me-54-14*(1-during(t,28,31));
    // The child first holds YOUR hand, then ventures ahead. In old age they
    // come back alongside you. After the farewell they continue forward,
    // leaving your star clearly separate from the living generation.
    const child=me+36+8*during(t,35,49)+22*during(t,49,56)
      -18*during(t,60,65)+42*during(t,70,75);
    const little=child+37+16*(1-during(t,67,70));
    return {grandma,grandpa,mom,dad,friend,love,child,little,me};
  }
  // Integral of a smooth change in walking cadence: slowing down must not
  // jump the legs to another phase of their cycle.
  function paceIntegral(t,start,duration) {
    const u=clamp((t-start)/duration);
    return duration*(u*u*u-.5*u*u*u*u)+Math.max(0,t-start-duration);
  }
  // Dimensions and garment profiles depend on growth, not walking phase.
  // Bound the growth cache; old profiles are released with their dimensions.
  const dimensionCache=new Map(),torsoCache=new WeakMap();
  function solveJoint(a,b,upper,lower,bend=1) {
    const delta=sub(b,a),distance=length(delta),u=distance?mul(delta,1/distance):[0,1];
    const d=clamp(distance,Math.abs(upper-lower)+.001,upper+lower-.001);
    const along=(upper*upper-lower*lower+d*d)/(2*d);
    const across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
    return {root:a,joint:add(a,[u[0]*along-u[1]*across,u[1]*along+u[0]*across]),end:add(a,mul(u,d)),upper,lower};
  }
  function dimensions(young=0,kind='me') {
    const key=kind+':'+young,cached=dimensionCache.get(key);
    if(cached){dimensionCache.delete(key);dimensionCache.set(key,cached);return cached;}
    const broad=kind==='dad'||kind==='grandpa';
    const d={leg:mix(73,66,young),torso:mix(49,45,young),head:mix(24,30,young),
      upperArm:mix(25,23,young),lowerArm:mix(24,22,young),
      back:mix(broad?9:8,8.5,young),chest:mix(broad?13:11.5,11,young),
      waist:mix(broad?9.8:8.3,12,young),seat:mix(8,8.5,young),belly:mix(broad?11:9.5,12,young),
      palm:mix(4.2,4,young),gripOffset:mix(4.2,4,young)*.72,sleeve:mix(4.6,4.2,young),thigh:mix(6,5.7,young)};
    dimensionCache.set(key,d);if(dimensionCache.size>32)dimensionCache.delete(dimensionCache.keys().next().value);return d;
  }
  const bezier=(points,t)=>{
    const u=1-t;return [0,1].map(i=>u*u*u*points[0][i]+3*u*u*t*points[1][i]+3*u*t*t*points[2][i]+t*t*t*points[3][i]);
  };
  function torso(r,hem) {
    const d=r.d,top=-d.torso,span=hem-top,backChest=Math.min(11,span*.45);
    let profiles=torsoCache.get(d);if(!profiles){profiles=new Map();torsoCache.set(d,profiles);}
    if(profiles.has(hem))return profiles.get(hem);
    // Back and front are different anatomical contours in the sagittal plane.
    // The head, shoulder, chest, waist and seat all face the direction of travel.
    const neckBack=[-3.6,top-5],neckFront=[5,top-5];
    const back=[
      [neckBack,[-7,top-4],[-d.back,top+3],[-d.back,top+backChest]],
      [[-d.back,top+backChest],[-d.back-.5,top+span*.50],[-d.seat+1.5,top+span*.78],[-d.seat,hem]]
    ];
    const front=[
      [neckFront,[8,top-1],[d.chest+.4,top+4],[d.chest,top+12]],
      [[d.chest,top+12],[d.waist,top+span*.65],[d.belly+.5,hem-span*.20],[d.belly,hem-.3]]
    ];
    const frontSamples=new Map();
    const frontAt=(y,inset=0)=>{
      const cached=frontSamples.get(y);if(cached)return[cached[0]-inset,cached[1]];
      const curve=front[y<=front[0][3][1]?0:1];let lo=0,hi=1;
      for(let i=0;i<18;i++){const t=(lo+hi)/2,u=1-t,cy=u*u*u*curve[0][1]+3*u*u*t*curve[1][1]+3*u*t*t*curve[2][1]+t*t*t*curve[3][1];if(cy<y)lo=t;else hi=t;}
      const q=bezier(curve,(lo+hi)/2);frontSamples.set(y,q);return[q[0]-inset,q[1]];
    };
    const profile={back,front,neckBack,neckFront,frontAt};profiles.set(hem,profile);return profile;
  }
  function foot(phase,side,young,elderly) {
    const u=((phase/TAU+(side===1?0:.5))%1+1)%1,stance=.62;
    const stride=mix(mix(12,8.5,Number(elderly)),10,young);
    if(u<stance)return {u,point:[mix(stride,-stride,u/stance),-2],planted:true};
    const t=(u-stance)/(1-stance);
    return {u,point:[mix(-stride,stride,smooth(t)),-2-Math.sin(t*Math.PI)*6],planted:false};
  }
  function pose({young=0,kind='me',elderly=false,phase=0,lean=0}) {
    const d=dimensions(young,kind),feet=[foot(phase,-1,young,elderly),foot(phase,1,young,elderly)];
    const upper=d.leg*.51,lower=d.leg*.49;
    // A single pelvis supports both legs. The longest stance determines its height.
    const pelvisY=Math.max(...feet.map((f,i)=>f.point[1]-Math.sqrt((d.leg-.25)**2-(f.point[0]-(i?2:-2))**2)));
    const pelvis=[0,pelvisY],co=Math.cos(lean),si=Math.sin(lean);
    const body=p=>[p[0]*co-p[1]*si,pelvisY+p[0]*si+p[1]*co];
    const inverse=p=>{const q=sub(p,pelvis);return[q[0]*co+q[1]*si,-q[0]*si+q[1]*co];};
    const hips=[body([-2,0]),body([2,0])];
    const legs=hips.map((hip,i)=>({...solveJoint(hip,feet[i].point,upper,lower,-1),foot:feet[i]}));
    // In profile the visible shoulder sits below the neck, not on the chest's
    // forward contour. Keep a small depth offset for the hidden shoulder.
    const shoulders=[body([-1,-d.torso+4]),body([1,-d.torso+3])];
    return {d,pelvis,body,inverse,hips,legs,shoulders,neck:body([1,-d.torso-4]),young,elderly,phase,lean};
  }
  const world = (s,p) => [s.x+p[0]*s.scale,s.y+p[1]*s.scale];
  const local = (s,p) => [(p[0]-s.x)/s.scale,(p[1]-s.y)/s.scale];
  function backTouch(a,b) {
    const contact=world(b,b.rig.body([-b.rig.d.back-1,-b.rig.d.torso+16]));
    const direction=unit([.92,-.38]),wrist=sub(contact,mul(direction,a.rig.d.gripOffset*a.scale));
    const reach=(a.rig.d.upperArm+a.rig.d.lowerArm)*a.scale*.97;
    return length(sub(wrist,world(a,a.rig.shoulders[1])))<=reach?{contact,wrist,direction}:null;
  }
  function arm(r,side,{wave=0,cane=false,target=null,amount=0}={}) {
    const i=side===1?1:0,a=r.shoulders[i],d=r.d;
    const swing=Math.sin(r.phase)*mix(8,4,Number(r.elderly))*side;
    let wrist=r.body([side*7+swing,-d.torso+d.upperArm+d.lowerArm+1]);
    if(cane)wrist=pointMix(wrist,r.body([22,-d.torso+35]),Number(cane));
    wrist=pointMix(wrist,r.body([24+Math.sin(r.phase*1.5)*2,-d.torso-22]),wave);
    if(target)wrist=pointMix(wrist,target,amount);
    const solved=solveJoint(a,wrist,d.upperArm,d.lowerArm,side);
    return {...solved,side,wrist:solved.end,handDirection:unit(sub(solved.end,solved.joint))};
  }
  function circleIntersectionTarget(a,b,ra,rb,preferred) {
    const delta=sub(b,a),d=length(delta);
    if(d>ra+rb||d<.001)return null;
    const inside=(p,s,r)=>length(sub(p,s))<=r+.00001;
    if(inside(preferred,a,ra)&&inside(preferred,b,rb))return preferred;
    const project=(p,s,r)=>add(s,mul(sub(p,s),Math.min(1,r/(length(sub(p,s))||1))));
    const pa=project(preferred,a,ra),pb=project(preferred,b,rb),candidates=[];
    if(inside(pa,b,rb))candidates.push(pa);if(inside(pb,a,ra))candidates.push(pb);
    if(d>=Math.abs(ra-rb)){
      const along=(ra*ra-rb*rb+d*d)/(2*d),h=Math.sqrt(Math.max(0,ra*ra-along*along)),u=mul(delta,1/d),m=add(a,mul(u,along));
      candidates.push(add(m,[-u[1]*h,u[0]*h]),add(m,[u[1]*h,-u[0]*h]));
    }
    return candidates.sort((p,q)=>length(sub(p,preferred))-length(sub(q,preferred)))[0]||null;
  }
  function grip(a,b) {
    const sa=world(a,a.rig.shoulders[1]),sb=world(b,b.rig.shoulders[0]);
    // The palms meet at contact; the wrists are distinct and point into the grip.
    const da=unit([.9,.45]),db=unit([.2,-1]);
    const oa=mul(da,a.rig.d.gripOffset*a.scale),ob=mul(db,b.rig.d.gripOffset*b.scale);
    const ca=add(sa,oa),cb=add(sb,ob);
    const ra=(a.rig.d.upperArm+a.rig.d.lowerArm)*a.scale*.97;
    const rb=(b.rig.d.upperArm+b.rig.d.lowerArm)*b.scale*.97;
    const preferred=[mix(sa[0],sb[0],.52),mix(sa[1]+ra*.85,sb[1]-rb*.5,.68)];
    const contact=circleIntersectionTarget(ca,cb,ra,rb,preferred);
    return contact?{contact,a:{wrist:sub(contact,oa),direction:da},b:{wrist:sub(contact,ob),direction:db}}:null;
  }
  function ribbon(a,e,b,widths) {
    const u=unit(sub(e,a)),v=unit(sub(b,e)),n=[-u[1],u[0]],m=[-v[1],v[0]];
    const middle=mul(add(n,m),1/Math.max(1,1+n[0]*m[0]+n[1]*m[1]));
    return {left:[add(a,mul(n,widths[0])),add(e,mul(middle,widths[1])),add(b,mul(m,widths[2]))],
      right:[sub(a,mul(n,widths[0])),sub(e,mul(middle,widths[1])),sub(b,mul(m,widths[2]))]};
  }
  // One shallow oblique projection is used by every architectural prop.
  const project = (x,y,z=0) => [x+.55*z,y-.28*z];
  function house() {
    const v={};
    for(const [name,x,y,z] of [
      ['fl',30,126,0],['fr',112,126,0],['br',112,126,48],['bl',30,126,48],
      ['el',30,65,0],['er',112,65,0],['ebl',30,65,48],['ebr',112,65,48],
      ['ridge',71,30,0],['backRidge',71,30,48],
      ['roofLeft',24,68,-5],['roofRight',118,68,-5],['roofRidge',71,27,-5],
      ['roofBackLeft',24,68,53],['roofBackRight',118,68,53],['roofBackRidge',71,27,53]
    ])v[name]=project(x,y,z);
    const faces=[['side',['fr','br','ebr','er']],['front',['fl','fr','er','ridge','el']],
      ['roofLeft',['roofLeft','roofRidge','roofBackRidge','roofBackLeft']],
      ['roofRight',['roofRidge','roofRight','roofBackRight','roofBackRidge']]];
    const edgeMap=new Map();
    for(const [,names]of faces)names.forEach((name,i)=>{const next=names[(i+1)%names.length],key=[name,next].sort().join(':');if(!edgeMap.has(key))edgeMap.set(key,[v[name],v[next]]);});
    return {vertices:v,faces:faces.map(([name,names])=>({name,names,points:names.map(n=>v[n])})),edges:[...edgeMap.values()]};
  }
  return {clamp,mix,pointMix,add,sub,mul,length,unit,stage,paceIntegral,solveJoint,dimensions,torso,foot,pose,world,local,backTouch,arm,grip,ribbon,project,house};
});
