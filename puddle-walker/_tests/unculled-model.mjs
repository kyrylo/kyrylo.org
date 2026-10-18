import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

// Exercise the current physics against an exhaustive candidate list. Keeping
// frozen copies of whole old games conflates performance with later balance
// and level changes. Only the broad-phase optimization is removed here.
const file=new URL('../model.js',import.meta.url);
const source=readFileSync(file,'utf8');
const culled=/function footprintPatches\(g, f\) \{[\s\S]*?\n\}\nexport function constrainTarget/;
assert.ok(culled.test(source),'footprint broad-phase must still be identifiable');
const reference=source.replace(culled,'function footprintPatches(g, f) { return nearby(g.street,f.y).patches; }\nexport function constrainTarget')
 .replace(/from '([^']+)'/g,(_,path)=>`from '${new URL(path,file).href}'`);
export default await import('data:text/javascript;base64,'+Buffer.from(reference).toString('base64'));
