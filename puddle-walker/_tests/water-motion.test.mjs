import test from 'node:test';
import assert from 'node:assert/strict';
import {rippleProfile,reflectionFacets,reflectionSample} from '../water-motion.js';

const wave=(type='water',age=.3,strength=.8)=>({x:420,y:1000,rx:12,ry:30,angle:.23,age,strength,patch:{type}});
test('foot contact keeps its shape while the disturbance spreads outwards',()=>{
  const r=wave(),a=rippleProfile({...r,age:0}),b=rippleProfile(r);
  assert.equal(a.rx,12);assert.equal(a.ry,30);assert.ok(b.rx>a.rx&&b.ry>a.ry);
  assert.ok(b.ry>b.rx,'the initial sole imprint is not replaced by a generic circle');
});
test('mud and oil damp the same impact more quickly than rainwater',()=>{
  const water=rippleProfile(wave()),oil=rippleProfile(wave('oil')),mud=rippleProfile(wave('mud'));
  assert.ok(water.rx>oil.rx&&oil.rx>mud.rx);
  assert.ok(water.fade>oil.fade&&oil.fade>mud.fade);
  assert.ok(water.displacement>oil.displacement);
  assert.equal(rippleProfile(wave('mud',1)),null);assert.equal(rippleProfile(wave('oil',1.3)),null);
  assert.ok(rippleProfile(wave('water',1.3)));
});
test('toe grazes create weaker optical disturbances, not larger waves',()=>{
  const full=rippleProfile(wave()),toe=rippleProfile(wave('water',.3,.2));
  assert.equal(toe.rx,full.rx);assert.equal(toe.displacement,full.displacement/4);
  assert.equal(toe.fade,full.fade/4);
});
test('expired, future, zero-energy and reduced-motion waves do no drawing work',()=>{
  for(const r of [wave('water',1.5),wave('water',-1),wave('water',.3,0)])assert.equal(rippleProfile(r),null);
  assert.equal(rippleProfile(wave(),true),null);
  assert.equal(rippleProfile(wave('water',0)).fade,0);
});
test('refraction work stays on the thin wave front, with a bounded sample count',()=>{
  const r=wave(),p=rippleProfile(r),facets=reflectionFacets(r,p),c=Math.cos(r.angle),s=Math.sin(r.angle);
  assert.equal(facets.length,16);
  for(const f of facets){
    assert.ok(Math.hypot(f.dx,f.dy)<=2.8);
    for(const q of f.points){
      const dx=q.x-r.x,dy=q.y+r.y,x=dx*c+dy*s,y=-dx*s+dy*c;
      const outside=x*x/(p.rx+p.width)**2+y*y/(p.ry+p.width)**2;
      const inside=x*x/(p.rx-p.width)**2+y*y/(p.ry-p.width)**2;
      assert.ok(outside<=1.000001&&inside>=.999999,'no disturbance in the still centre or beyond the wave');
    }
  }
});
test('cropping retains world registration and never reads outside the photograph',()=>{
  const group={x0:350,x1:480,y0:940,y1:1040},r=wave();
  for(const angle of [0,.23,1.5,-2.9])for(const age of [.1,.8,1.4]){
    const w={...r,angle,age};for(const f of reflectionFacets(w,rippleProfile(w))){
      const sample=reflectionSample(group,f,768,512);if(!sample)continue;
      assert.ok(sample.sx>=-1e-8&&sample.sy>=-1e-8);
      assert.ok(sample.sx+sample.sw<=768+1e-8&&sample.sy+sample.sh<=512+1e-8);
      assert.ok(Math.abs(group.x0+sample.sx/768*130+f.dx-sample.x)<1e-8);
      assert.ok(Math.abs(-group.y1+sample.sy/512*100+f.dy-sample.y)<1e-8);
      assert.ok(Math.abs(sample.sw/sample.w-768/130)<1e-8,'no edge stretching');
    }
  }
  assert.equal(reflectionSample(group,{x0:0,x1:10,y0:0,y1:10,dx:1,dy:1},768,512),null);
});
test('sampling is repeatable, independent of frame history, and leaves physics untouched',()=>{
  const r=wave(),before=JSON.stringify(r),at=age=>{const w={...r,age};return reflectionFacets(w,rippleProfile(w));};
  const first=at(.4);for(let i=0;i<60;i++)at(i/60);
  assert.deepEqual(at(.4),first);assert.equal(JSON.stringify(r),before);
});
