import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../model.js';
import {createNeighborhood} from '../neighborhood.js';
const source=readFileSync(new URL('./performance-63-before/neighborhood.js',import.meta.url),'utf8').replace(/from '\.\/([^']+)'/g,(_,path)=>`from '${new URL('../'+path,import.meta.url).href}'`);
const {createNeighborhood:before}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('reused scenery views retain reactions, ripple identity and world positions across all districts',()=>{
 const g=createGame('leather',321),old=before(),next=createNeighborhood();g.phase='walking';
 const oldScenes=()=>({wildlife:old.wildlifeState(),scene:old.sceneState(),events:old.takeEvents()});
 // The yard ball and bath toy have their own regression tests; existing reactions stay identical.
 const newScenes=()=>{const {balls,ducks,snails,dandelions,thieves,balloons,helpers,...scene}=next.sceneState();return{wildlife:next.wildlifeState(),scene,events:next.takeEvents().filter(e=>e.encounter!=='biscuit-thief')};};
 old.update(g);next.update(g);assert.deepEqual(newScenes(),oldScenes());
 const boats=next.sceneState().boats;
 for(let frame=1;frame<=900;frame++){
  g.time=frame/60;
  const district=Math.floor((frame-1)/180),local=(frame-1)%180,boat=boats[district];
  const y=g.street.districts[district].offset+900+local*14;
  g.feet.forEach((f,i)=>{f.x=local<80?350+i*35:75+i*30;f.y=y-i*30;});
  if(local===90&&boat)g.rings.push({x:boat.x-20,y:boat.y,radius:1,strength:1.3});
  for(const ring of g.rings)ring.radius+=3;
  if(local===150)g.rings=[];
  old.update(g);next.update(g);
  assert.deepEqual(newScenes(),oldScenes(),'frame '+frame);
 }
 const fresh=createGame('leather',42);old.update(fresh);next.update(fresh);
 assert.deepEqual(newScenes(),oldScenes(),'reset cannot retain previous local positions');
});
