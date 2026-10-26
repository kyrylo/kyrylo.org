const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../geometry.js'),app=require('../drawing.js');
const dist=(a,b)=>G.length(G.sub(a,b));
function checkBone(b){assert(Math.abs(dist(b.root,b.joint)-b.upper)<1e-8);assert(Math.abs(dist(b.joint,b.end)-b.lower)<1e-8);}
test('shared pose keeps legs, ankles and torso attachments aligned through a complete walk',()=>{
 for(const young of [0,.25,.5,.75,1])for(const elderly of [false,true])for(let i=0;i<720;i++){
  const phase=i/720*Math.PI*2,r=G.pose({young,elderly,phase,lean:elderly?.035:Math.sin(phase)*.006});
  for(const [index,leg]of r.legs.entries()){checkBone(leg);assert(dist(leg.end,leg.foot.point)<1e-8,'Ankle lost foot target');assert(dist(leg.root,r.hips[index])<1e-8);if(leg.foot.planted)assert(Math.abs(leg.end[1]+2)<1e-8,'Sole not on ground');}
  for(const p of [r.neck,...r.shoulders,...r.hips])assert(dist(r.body(r.inverse(p)),p)<1e-8,'Body transform mismatch');
  for(const side of [-1,1])for(const wave of [0,.5,1])checkBone(G.arm(r,side,{wave,cane:elderly}));
 }
});
test('visible palm contact, not coincident wrists, connects every hand-holding sequence',()=>{
 for(const [w,h]of[[292,420],[347,420],[704,430],[1176,580]])for(let frame=0;frame<=1520;frame++){
  const t=frame/20,states=Object.fromEntries(app.inspect.states(w,h,t).map(s=>[s.p.id,s]));
  const pairs=t<14?[['mom','me']]:t>=37.8&&t<49?[['me','child']]:t>=70&&t<=76?[['child','little']]:[];
  for(const[aid,bid]of pairs){const a=states[aid],b=states[bid];assert(a&&b);const grip=G.grip(a,b);assert(grip,`Unreachable grip ${w}/${t}`);
   for(const[s,side,hand]of[[a,1,grip.a],[b,-1,grip.b]]){
    const arm=G.arm(s.rig,side,{target:G.local(s,hand.wrist),amount:1});checkBone(arm);
    const wrist=G.world(s,arm.wrist),contact=G.add(wrist,G.mul(hand.direction,s.rig.d.gripOffset*s.scale));
    assert(dist(wrist,hand.wrist)<1e-7);assert(dist(contact,grip.contact)<1e-7,'Visible palms do not meet');
    assert(s.rig.d.gripOffset<s.rig.d.palm,'Palms must overlap at their contact');
   }
   assert(dist(grip.a.wrist,grip.b.wrist)>1,'Two wrists collapsed onto one point');
  }
 }
});
test('pose and grip directions remain continuous across walking and growth',()=>{
 for(const [w,h]of[[292,420],[1176,580]]){
  let last={};
  for(let frame=0;frame<=4560;frame++){
   const states=app.inspect.states(w,h,frame/60),next={};
   for(const s of states){const p=last[s.p.id];if(p){for(const key of ['neck','pelvis'])assert(dist(s.rig[key],p.rig[key])<1,'Pose jumped');for(let i=0;i<2;i++)assert(dist(s.rig.legs[i].joint,p.rig.legs[i].joint)<3,'Knee flipped');}next[s.p.id]=s;}last=next;
  }
 }
});
test('story blocking preserves family relationships, clear bodies and continuous entrances',()=>{
 const order=['grandma','grandpa','dad','mom','love','me','child','little','friend'];
 for(const [w,h]of [[292,420],[347,420],[704,430],[1176,580]]){
  const unit=w<700?G.clamp(w/550,.62,1):G.clamp(w/1060,1,1.2);let previous={};
  for(let frame=0;frame<=4560;frame++){
   const t=frame/60,states=app.inspect.states(w,h,t),map=Object.fromEntries(states.map(s=>[s.p.id,s]));
   const visible=states.filter(s=>s.alpha>.1).sort((a,b)=>order.indexOf(a.p.id)-order.indexOf(b.p.id));
   for(let i=1;i<visible.length;i++)assert((visible[i].x-visible[i-1].x)/unit>=30,`Bodies cross or crowd at ${w}/${t}: ${visible[i-1].p.id}/${visible[i].p.id}`);
   for(const s of states){
    if(previous[s.p.id])assert(Math.abs(s.x-previous[s.p.id].x)/unit<.55,`Position jumps: ${s.p.id}/${t}`);
    if(s.alpha>.5)assert(s.x>20&&s.x<w-20,`Visible person lost beyond the scene: ${s.p.id}/${w}/${t}`);
   }
   if(t<43)assert((map.mom.x-map.dad.x)/unit<55,'Dad becomes disconnected from Mum');
   if((t>=1&&t<=6.5)||(t>=14.2&&t<=19.5)){
    const touch=G.backTouch(map.dad,map.mom);assert(touch,'Reassuring touch is unreachable');
    const arm=G.arm(map.dad.rig,1,{target:G.local(map.dad,touch.wrist),amount:1});checkBone(arm);
    const palm=G.add(G.world(map.dad,arm.wrist),G.mul(touch.direction,map.dad.rig.d.gripOffset*map.dad.scale));
    assert(dist(palm,touch.contact)<1e-7,'Hand floats above the back');
   }
   previous=map;
  }
  const lastChild=previous.child,heart=app.heartLayout(w,h);
  assert(lastChild.x-heart.x>heart.width*.3,'The next generation covers the last star');
 }
 assert(G.stage(56).child-G.stage(56).me>60,'The child never ventures ahead');
 assert(G.stage(65).child-G.stage(65).me<50,'The child never returns alongside the parent');
 assert(Math.abs((G.stage(76).little-G.stage(76).child)-(G.stage(0).me-G.stage(0).mom))<3,'The ending loses the opening hand-holding arrangement');
});
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8&&orient(c,d,a)*orient(c,d,b)<-1e-8;
test('profile torsos enclose both shoulders and keep clothing openings on the forward surface',()=>{
 const sample=q=>Array.from({length:21},(_,i)=>{const t=i/20,u=1-t;return[0,1].map(k=>u*u*u*q[0][k]+3*u*u*t*q[1][k]+3*u*t*t*q[2][k]+t*t*t*q[3][k]);});
 const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 for(const kind of ['dad','grandpa','dress','love','me','child'])for(const young of [0,.25,.5,.75,1]){
  const r=G.pose({kind,young,phase:1.6,lean:.03}),hem=['dress','love'].includes(kind)?-24:G.mix(2,-4,young),profile=G.torso(r,hem);
  const back=profile.back.flatMap(sample),front=profile.front.flatMap(sample),poly=[...back,...front.toReversed()];
  for(const curve of [back,front])for(let i=1;i<curve.length;i++)assert(curve[i][1]>=curve[i-1][1],'Torso doubles back vertically');
  for(const p of r.shoulders)assert(inside(r.inverse(p),poly),'Shoulder left the torso profile');
  for(let y=-r.d.torso+10;y<hem-1;y+=2){const opening=profile.frontAt(y,1.5);assert(Math.abs(opening[1]-y)<.001);assert(inside(opening,poly),'Clothing opening left the forward surface');assert(opening[0]>4,'Clothing opening drifted to the viewer-facing centre');}
  for(let i=0;i<poly.length;i++)for(let j=i+2;j<poly.length;j++){if(i===0&&j===poly.length-1)continue;assert(!crosses(poly[i],poly[(i+1)%poly.length],poly[j],poly[(j+1)%poly.length]),'Folded torso contour');}
 }
});
test('architectural planes have shared vertices and no folded polygons',()=>{
 const mesh=G.house();
 for(const f of mesh.faces){for(let i=0;i<f.points.length;i++){assert.strictEqual(f.points[i],mesh.vertices[f.names[i]]);for(let j=i+2;j<f.points.length;j++){if(i===0&&j===f.points.length-1)continue;assert(!crosses(f.points[i],f.points[(i+1)%f.points.length],f.points[j],f.points[(j+1)%f.points.length]),`Folded face ${f.name}`);}}}
 assert.strictEqual(mesh.faces.find(f=>f.name==='front').points[1],mesh.faces.find(f=>f.name==='side').points[0]);
 assert.deepEqual(G.sub(G.project(30,40,10),G.project(30,40,0)),[5.5,-2.799999999999997]);
});
