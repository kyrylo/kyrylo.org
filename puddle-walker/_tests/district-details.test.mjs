import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,ROAD,DISTRICT_LENGTH} from '../model.js';
import {districtDetails} from '../district-details.js';
import {createNeighborhood} from '../neighborhood.js';

test('every district has its own landmarks, with identical placement on retry',()=>{
 const g=createGame('leather',321),sets=g.street.districts.map(d=>districtDetails(d.street,d));
 assert.equal(new Set(sets.flat().map(p=>p.kind)).size,24);
 for(const d of g.street.districts)assert.deepEqual(districtDetails(d.street,d),districtDetails(d.street,d));
});
test('landmarks stay off the walking lane, clear of parked cars, and do not alter generated routes',()=>{
 for(let seed=1;seed<=40;seed++){
  const g=createGame('leather',seed),before=JSON.stringify(g);
  for(const d of g.street.districts)for(const p of districtDetails(d.street,d)){
   assert.ok(p.x+p.width/2<ROAD.left||p.x-p.width/2>ROAD.right);
   assert.ok(p.y-p.height/2>0&&p.y+p.height/2<DISTRICT_LENGTH);
   for(const bay of d.street.parking)if(Math.abs(bay.y-p.y)<570)assert.notEqual(p.x>450?1:0,bay.side);

  }
  assert.equal(JSON.stringify(g),before);
 }
});
test('neighborhood reports all twenty-four landmarks in world coordinates without changing physics',()=>{
 const g=createGame('leather',321),before=JSON.stringify(g),n=createNeighborhood();n.update(g);
 assert.equal(JSON.stringify(g),before);
 assert.equal(n.sceneState().landmarks.length,24);
 for(const d of g.street.districts){
  const local=districtDetails(d.street,d);
  for(const p of local)assert.ok(n.sceneState().landmarks.some(q=>q.kind===p.kind&&q.y===p.y+d.offset));
 }
});
