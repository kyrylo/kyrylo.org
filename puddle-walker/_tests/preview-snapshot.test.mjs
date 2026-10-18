import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,planStep,setShoeMask,indexStreet} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';

test('a stored landing forecast describes its original pose, shoe and street',()=>{
  const g=createGame('leather',321);g.phase='walking';setShoeMask(g,SHOE_MASK);
  for(const f of g.feet){f.y=1200;f.bestY=f.y;}
  const target={x:420,y:1370};
  const expected={...planStep(g,target)},pending=planStep(g,target);
  g.feet.forEach(f=>{f.x+=80;f.y+=200;});
  setShoeMask(g,SHOE_MASK.map((on,i)=>on&&i%24>12));g.shoeId='knit';
  g.street=indexStreet({patches:[],obstacles:[]});
  assert.deepEqual({...pending},expected);
  assert.deepEqual({...pending},expected,'repeated inspection keeps the same forecast');
});
