import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createSubmersionTest,createSurfaceSampler,indexStreet,MATERIALS,PAVEMENT,surfaceAt} from '../model.js';

const patch=(type,extra={})=>({type,x:450,y:1000,rx:60,ry:90,cos:1,sin:0,depth:12,seed:4,...extra});
function compare(patches,points){
  const order=[...patches],g={street:indexStreet({patches,obstacles:[]})},submerged=createSubmersionTest(patches),sample=createSurfaceSampler(patches);
  for(const [x,y] of points){
    const surface=surfaceAt(g,x,y,patches);
    assert.deepEqual(sample(x,y),surface,`prepared contact at ${x}, ${y}`);
    assert.equal(submerged(x,y),Boolean(MATERIALS[surface.type].liquid)&&surface.depth>=.3,`${x}, ${y}: ${surface.type}`);
  }
  assert.deepEqual(patches,order,'preparation must not reorder shared street geometry');
}
test('prepared water clipping matches contact physics throughout every district',()=>{
  const g=createGame('leather',321),points=[];
  for(const s of g.street.sections)for(let y=-30;y<=30;y+=6)for(let x=160;x<=740;x+=10)points.push([x,s.y+y]);
  compare(g.street.patches,points);
});
test('covers, films, contaminants and equal-depth ties keep their contact priority',()=>{
  const points=[];for(let y=900;y<=1100;y+=4)for(let x=380;x<=520;x+=4)points.push([x,y]);
  const layers=[patch('mud',{roadDecay:true}),patch('water'),patch('gravel',{rx:50}),
    patch('oil',{surfaceFilm:true,rx:45}),patch('poop',{rx:35}),patch('tar',{contaminant:true,rx:30}),
    patch('metal',{rx:25}),patch('stone',{rx:20}),patch('algae',{onCover:true,rx:15})];
  for(let i=1;i<=layers.length;i++){
    compare(layers.slice(0,i),points);compare(layers.slice(0,i).reverse(),points);
  }
  compare([patch('water'),patch('gravel')],points);
  compare([patch('gravel'),patch('water')],points);
});
test('shallow water threshold and clean pavement edges stay exact',()=>{
  for(const y of [1000,PAVEMENT.startEnd,PAVEMENT.finishStart])for(const depth of [.299999,.3,.300001]){
    compare([patch('water',{y,depth})],[[450,y],[450,y-1],[450,y+1],[450.00001,y]]);
  }
  compare([],[[450,1000]]);compare([patch('metal')],[[450,1000]]);
});
