import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,indexStreet,boundary,puddleDepth,surfaceAt,takeStep,advance,condition} from '../model.js';
import {fractureRadius} from '../road-ground.js';
const settle=g=>{for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);assert.equal(g.mode,'idle');};
test('fractured potholes keep every formerly dry edge clear, with gravel lips around smaller wet centres',()=>{
 for(let seed=1;seed<=32;seed++){
  const g=createGame('leather',seed),pools=g.street.patches.filter(p=>p.fracturedPool);assert.equal(pools.length,9);
  for(const p of pools){
   const rim=g.street.patches.find(q=>q.underlay&&q.craterKey===p.craterKey);assert.ok(rim);
   const before={...rim,edgeCuts:undefined};assert.ok(p.rx<rim.rx&&p.ry<rim.ry);
   for(let angle=0;angle<Math.PI*2;angle+=.07){
    const radius=boundary(p,angle)*.999,lx=Math.cos(angle)*p.rx*radius,ly=Math.sin(angle)*p.ry*radius;
    assert.ok(puddleDepth(rim,p.x+lx*p.cos-ly*p.sin,p.y+lx*p.sin+ly*p.cos)>0,'every wet pocket stays inside its gravel crater');
   }
   for(let a=-Math.PI*2;a<Math.PI*2;a+=.13){
    assert.ok(fractureRadius(p,a)>=.87&&fractureRadius(p,a)<=1);
    assert.ok(Math.abs(fractureRadius(p,a)-fractureRadius(p,a+Math.PI*2))<1e-12);
    const r=boundary(before,a)+.01,lx=Math.cos(a)*rim.rx*r,ly=Math.sin(a)*rim.ry*r,x=rim.x+lx*rim.cos-ly*rim.sin,y=rim.y+lx*rim.sin+ly*rim.cos;
    assert.equal(puddleDepth(rim,x,y),0);assert.equal(puddleDepth(p,x,y),0);
   }
  }
 }
});
test('a gravel lip creates grit contact, while stepping into its centre creates wet contact',()=>{
 for(const material of ['gravel','water']){
  const g=createGame('leather',321),p=g.street.patches.find(p=>p.fracturedPool&&p.y>4000&&p.y<8000),rim=g.street.patches.find(q=>q.underlay&&q.craterKey===p.craterKey);
  // Isolate the damaged surface to inspect its material boundary, independently
  // of the adjacent parked car and other street dressing.
  g.street=indexStreet({...g.street,obstacles:[],patches:[p,rim]});g.phase='walking';
  let target={x:p.x,y:p.y};
  if(material==='gravel'){
   outer:for(let y=p.y-p.ry;y<=p.y+p.ry;y+=3)for(let x=p.x-p.rx*1.15;x<=p.x+p.rx*1.15;x+=3){
    if(surfaceAt(g,x,y).type==='gravel'&&puddleDepth(p,x,y)===0){target={x,y};break outer;}
   }
  }
  assert.equal(surfaceAt(g,target.x,target.y).type,material);
  g.feet.forEach((f,i)=>Object.assign(f,{x:target.x+i*60,y:target.y-120,bestY:target.y-120}));
  assert.ok(takeStep(g,target));settle(g);
  assert.ok(condition(g)<100);assert.ok(g.events.some(e=>e.type==='land'&&e.contacts.some(c=>c.surface===material)));
  assert.ok(g.groundContacts.some(m=>m.kind===material));
 }
});

test('road damage keeps a distinct substrate in the opening, repair zone and low corner',()=>{
 const g=createGame('leather',321);
 const styles=g.street.districts.map(d=>new Set(d.street.patches.filter(p=>p.groundField&&!p.roadDecay).map(p=>p.groundStyle)));
 assert.deepEqual([...styles[0]],['rubble']);assert.deepEqual([...styles[2]],['subbase']);assert.deepEqual([...styles[3]],['silt']);
 assert.equal(g.street.patches.filter(p=>p.workBed&&p.craterRim).length,6);
});

test('repair water sits inside chipped utility cuts and leaves each barrier approach dry',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed);
  for(const district of g.street.districts){
   const local=district.street;
   for(const bed of local.patches.filter(p=>p.workBed)){
    const pool=local.patches.find(p=>p.workPool&&p.encounter===bed.encounter);
    assert.ok(pool&&bed.underlay);
    const rail=local.obstacles.find(o=>o.type==='barrier'&&Math.abs(o.y-(bed.y-125))<.001);
    assert.ok(rail);
    for(let a=0;a<Math.PI*2;a+=.025){
     const r=boundary(pool,a)*.999,x=pool.x+Math.cos(a)*pool.rx*r,y=pool.y+Math.sin(a)*pool.ry*r;
     assert.ok(puddleDepth(bed,x,y)>0,'standing water stays inside the cut');
     const edge=boundary(bed,a);
     assert.ok(edge<=1.155,'cut fits the shared contact broad phase');
     assert.ok(bed.y+Math.sin(a)*bed.ry*edge>rail.y+rail.halfLength,'damage starts behind the rail');
    }
    const cutGame={...g,street:indexStreet({...local,obstacles:[],patches:[bed,pool]})};
    assert.equal(surfaceAt(cutGame,bed.x,bed.y+bed.ry*.6).type,'gravel');
    assert.equal(surfaceAt(cutGame,pool.x,pool.y).type,'water');
    assert.equal(surfaceAt(cutGame,bed.x,rail.y-40).type,'dry');
   }
  }
 }
});

test('the garage crater has separate wet pockets with a gritty, physically dirty ridge between them',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed),rim=g.street.patches.find(p=>p.underlay&&p.craterKey?.startsWith('1:1:')),pools=g.street.patches.filter(p=>p.fracturedPool&&p.craterKey===rim.craterKey);
  assert.equal(pools.length,2);assert.equal(surfaceAt(g,rim.x,rim.y).type,'gravel');
  for(const p of pools)assert.equal(surfaceAt(g,p.x,p.y).type,'water');
 }
});
