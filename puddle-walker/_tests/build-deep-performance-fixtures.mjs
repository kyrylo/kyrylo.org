// Private QA only. Before editing: node this-file.mjs capture
// After editing: node this-file.mjs. Remove _site/puddle-walker/_qa-* after QA.
import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
if(process.argv[2]==='capture'){
 const before=new URL('_qa-before-129/',out);mkdirSync(before,{recursive:true});
 for(const file of readdirSync(root))if(file.endsWith('.js'))copyFileSync(new URL(file,root),new URL(file,before));
}else{
 const version=readFileSync(new URL('game.js',root),'utf8').match(/\?v=([^']+)/)[1];
 for(const name of ['shoe-pixels','district-performance','startup-performance','denim-wear-performance']){
  const source=readFileSync(new URL(`_tests/${name}.html`,root),'utf8').replaceAll('deep-perf-129',version);
  writeFileSync(new URL(`_qa-${name}.html`,out),source);
 }
 const terrain=readFileSync(new URL('_tests/terrain-budget.html',root),'utf8').replace("'./_qa-sync-render.js'","'./_qa-before-129/render.js'").replaceAll('small-discoveries-121',version);
 writeFileSync(new URL('_qa-terrain-budget.html',out),terrain);
}
