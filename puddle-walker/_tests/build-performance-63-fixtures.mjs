import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
const source=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,source),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
mkdirSync(new URL('_qa-before-63/',out),{recursive:true});
for(const name of readdirSync(source))if(name.endsWith('.js'))write('_qa-before-63/'+name,read(name).replaceAll('perf-63','perf-62'));
for(const name of ['render.js','neighborhood.js'])write('_qa-before-63/'+name,read('_tests/performance-63-before/'+name));
const update=s=>s.replaceAll('perf-61','perf-63').replaceAll('_qa-before-61','_qa-before-63').replaceAll('garage-60','perf-62');
write('_qa-paired-63.html',update(read('_tests/paired-performance.html')));
console.log('Built paired renderer timing comparison.');
