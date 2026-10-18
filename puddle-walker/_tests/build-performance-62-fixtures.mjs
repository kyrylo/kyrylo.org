// Temporary browser checks. Outputs stay in _site and never touch player records.
import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
const source=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,source),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
mkdirSync(new URL('_qa-before-62/',out),{recursive:true});
for(const name of readdirSync(source))if(name.endsWith('.js'))write('_qa-before-62/'+name,read(name).replaceAll('perf-62','perf-61'));
for(const name of ['model.js','render.js','shoe-wear.js'])write('_qa-before-62/'+name,read('_tests/performance-62-before/'+name));
let old=read('_tests/performance-62-before/render.js');
old=old.replace('warmMilliseconds: 0 }','warmMilliseconds: 0, solePaints: 0 }').replace('revisions[f.side] = f.revision;','metrics.solePaints++; revisions[f.side] = f.revision;');
write('_qa-before-62/render.js',old);
const update=s=>s.replaceAll('perf-61','perf-62').replaceAll('_qa-before-61','_qa-before-62').replaceAll('garage-60','perf-61');
write('_qa-paired-62.html',update(read('_tests/paired-performance.html')).replace('clean:old.condition(games[0])','clean:old.condition(games[0]),solePaints:renderers[0].metrics.solePaints').replace('clean:next.condition(games[1])','clean:next.condition(games[1]),solePaints:renderers[1].metrics.solePaints'));
write('_qa-wear-62.html',update(read('_tests/wear-equivalence-61.html')).replace('./_qa-old-wear-60.js','./_qa-before-62/shoe-wear.js'));
write('_qa-sole-62.html',read('_tests/sole-cache-equivalence.html'));
console.log('Built paired timing, shoe-wear and sole-cache browser checks.');
