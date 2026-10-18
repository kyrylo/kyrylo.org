import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,setShoeMask,selectFoot,takeStep,advance,condition,surfaceAt} from '../model.js';
import {SHOE_MASK} from '../sprite-data.js';
const witnesses=JSON.parse(readFileSync(new URL('../_notes/branch-routes.json',import.meta.url),'utf8'));
function step(g,p){selectFoot(g,p.side);assert.ok(takeStep(g,p));for(let i=0;i<240&&g.mode!=='idle';i++)advance(g,1/120);assert.equal(g.mode,'idle');assert.ok(!g.events.some(e=>e.type==='bump'));g.events=[];}
test('both pothole branches are reachable from the same entry and rejoin without a restart',()=>{
 for(const w of witnesses){
  const g=createGame('leather',w.seed);g.phase='walking';setShoeMask(g,SHOE_MASK);
  const s=g.street.sections.find(s=>s.stage===w.stage&&s.kind==='fork');assert.equal(s.choice,'around-the-pothole');
  g.feet.forEach((f,i)=>Object.assign(f,{x:450+(i?28:-28),y:s.y-255,bestY:s.y-255}));
  for(const p of w.route)step(g,p);
  assert.ok(g.feet.every(f=>f.y>s.y+300));assert.ok(condition(g)>70,`${w.seed}/${w.stage}/${w.branch}: viable exit`);
 }
});
test('the cover shortcut crosses the real full street and the wider bank remains a choice',()=>{
 for(const seed of [1,42,321,9182]){
  const g=createGame('leather',seed);g.phase='walking';setShoeMask(g,SHOE_MASK);
  const s=g.street.sections.find(s=>s.choice==='covers-or-bank');assert.ok(s);
  const covers=g.street.patches.filter(p=>p.type==='metal'&&Math.abs(p.y-s.y)<150&&Math.abs(p.x-450)<70).sort((a,b)=>a.y-b.y),active=covers[0].x<450?0:1;
  g.feet.forEach((f,i)=>Object.assign(f,{x:410+i*80,y:s.y-270,bestY:s.y-270}));
  for(const p of [...covers.map((p,i)=>({...p,side:(active+i)%2})),{x:active?490:410,y:s.y+280,side:active},{x:active?410:490,y:s.y+320,side:1-active}])step(g,p);
  assert.ok(condition(g)>90);assert.ok(g.feet.every(f=>f.y>s.y+260));
  assert.equal(surfaceAt(g,s.gap,s.y).dirt,0);assert.equal(surfaceAt(g,450,s.y).type,'water','the shortcut still requires placing shoes on actual covers');
 }
});
test('choices are occasional, repeatable and retain the deep middle obstacle',()=>{
 for(const seed of [1,42,321,9182,13,77]){
  const g=createGame('leather',seed),choices=g.street.sections.filter(s=>s.choice);assert.equal(choices.length,3);
  assert.deepEqual(g.street,createGame('leather',seed).street);
  for(const s of choices.filter(s=>s.kind==='fork')){assert.equal(surfaceAt(g,(s.lanes[0]+s.lanes[1])/2,s.y).type,'water');assert.ok(s.lanes[1]-s.lanes[0]>300);}
 }
});
