import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,districtAt,CAR} from '../model.js';
import {vehicleLineup,VEHICLES} from '../vehicles.js';

test('every street uses all five cars, without consecutive repeats or matching garage bays',()=>{
 for(let seed=1;seed<=80;seed++){
  const g=createGame('leather',seed),fleet=vehicleLineup(g.street),ids=[...fleet.values()];
  assert.equal(new Set(ids).size,5);
  for(let i=1;i<ids.length;i++)assert.notEqual(ids[i],ids[i-1]);
  const garage=[...fleet].filter(([car])=>districtAt(car.y).id==='parking');
  assert.equal(new Set(garage.map(([,id])=>id)).size,3);
  for(const [car,id] of fleet)if(districtAt(car.y).id==='works')assert.equal(id,'white-van');
 }
});
test('same-street retries preserve the lineup, while new streets vary the passenger cars',()=>{
 const arrangements=new Set();
 for(let seed=1;seed<=30;seed++){
  const a=createGame('leather',seed),b=createGame('leather',seed);
  const ids=[...vehicleLineup(a.street).values()];
  assert.deepEqual(ids,[...vehicleLineup(b.street).values()]);arrangements.add(ids.join(','));
 }
 assert.ok(arrangements.size>10);
});
test('choosing car models leaves collision bodies, parking bays and all gameplay state untouched',()=>{
 const g=createGame('leather',321),before=JSON.stringify(g);
 vehicleLineup(g.street);assert.equal(JSON.stringify(g),before);
 assert.ok(VEHICLES.every(v=>v.width<=CAR.width&&v.width>=2*CAR.halfWidth));
 assert.equal(vehicleLineup({seed:1,parking:[]}).size,0);
});
