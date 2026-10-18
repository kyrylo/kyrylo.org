import test from 'node:test';
import assert from 'node:assert/strict';
import {legRows,legContains} from '../denim.js';
import {footPose,cameraTarget} from '../render.js';
import {createGame,SHOES,takeStep,advance} from '../model.js';

test('turning an ankle leaves the thigh fabric anchored while the cuff follows the shoe',()=>{
 const shoe=SHOES.leather,pose={x:400,y:350,sx:1,sy:1,angle:0};
 const a=legRows(pose,shoe,0,0,450,720),b=legRows({...pose,angle:.24},shoe,0,0,450,720);
 assert.deepEqual(a.at(-1),b.at(-1),'the thigh must not rotate about the ankle');
 for(const edge of ['left','right']){
  const before=a[20][edge],after=b[20][edge];
  assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<1,'upper fabric stays attached to the thigh');
 }
 const cuff={x:(b[0].left.x+b[0].right.x)/2,y:(b[0].left.y+b[0].right.y)/2};
 assert.ok(Math.abs(cuff.x-(pose.x-shoe.length*.17*Math.sin(.24)))<1e-9);
 assert.ok(Math.abs(cuff.y-(pose.y+shoe.length*.17*Math.cos(.24)))<1e-9);
});

test('cloth remains continuous and never folds inside out through real steps and different viewports',()=>{
 const area=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 for(const [width,height] of [[320,568],[390,844],[1280,720],[1440,480]]){
  const g=createGame('leather',321);g.phase='walking';const scale=width/(width<600?760:900),viewH=height/scale,meshes=[[],[]];
  for(let step=0;step<6;step++){
   assert.ok(takeStep(g,{x:450+(g.active?35:-35)+Math.sin(step)*70,y:Math.max(...g.feet.map(f=>f.y))+150}));
   for(let n=0;n<200&&g.mode!=='idle';n++){
    advance(g,1/120);const cam=cameraTarget(g,viewH,scale),center=(g.feet[0].x+g.feet[1].x)/2;
    for(const f of g.feet){
     const pose=footPose(g,f,viewH-f.y+cam,false),rows=legRows(pose,SHOES.leather,f.side,f.z,center,viewH,0,meshes[f.side]);
     assert.deepEqual(rows,legRows(pose,SHOES.leather,f.side,f.z,center,viewH),'reusing the previous frame must not leave stale cloth coordinates');
     for(let i=0;i<rows.length-1;i++){
      const a=rows[i],b=rows[i+1];
      assert.ok(area(a.left,a.right,b.left)>0,`${width} × ${height}: lower cloth face ${i}`);
      assert.ok(area(a.right,b.right,b.left)>0,`${width} × ${height}: upper cloth face ${i}`);
     }
    }
   }
  }
 }
});

test('leg hits follow curved cloth while nearby pavement stays available for walking',()=>{
 for(const side of [0,1])for(const angle of [-.24,0,.24]){
  const rows=legRows({x:side?490:410,y:350,sx:1,sy:1,angle},SHOES.leather,side,0,450,720);
  for(const index of [1,6,12,18,23]){
   const {left,right}=rows[index];
   assert.ok(legContains(rows,(left.x+right.x)/2,(left.y+right.y)/2));
   assert.equal(legContains(rows,left.x-15,left.y),false);
   assert.equal(legContains(rows,right.x+15,right.y),false);
  }
  assert.equal(legContains(rows,450,300),false);
 }
});
