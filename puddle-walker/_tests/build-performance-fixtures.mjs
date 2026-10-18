// Isolated browser fixtures; never publish these or write to a player's records.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8'),write=(path,text)=>writeFileSync(new URL(path,out),text);
const version=read('game.js').match(/\?v=([^']+)/)[1];
write('_qa-performance.html',read('_tests/browser-benchmark.html').replaceAll('denim-50',version));
write('_qa-wear-equivalence.html',read('_tests/wear-equivalence.html'));
write('_qa-old-wear.js',read('_tests/reference-shoe-wear.js').replace('../model.js','./model.js'));
const args=process.argv.slice(2),immediate=args.includes('--immediate');
const route=JSON.parse(read(args.find(arg=>!arg.startsWith('--'))||'_notes/designed-route-audit.json')).find(r=>r.seed===321).route;
write('_qa-race-performance.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,`src="./_qa-race-performance.js?v=${version}"`));
write('_qa-race-render.js',read('render.js').replace('if(!chunks.has(b))metrics.visibleMisses++;','if(!chunks.has(b)){metrics.visibleMisses++;(metrics.missingTiles||=[]).push(b);}'));
let controller=read('game.js').replace("'./render.js?","'./_qa-race-render.js?").replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)},qaCpu=[],qaIntervals=[];\nconst $ =");
controller=controller.replace("$('start').disabled = false;","$('start').disabled = false; canvas.dataset.readyMs=performance.now().toFixed(1);");
controller=controller.replace("if (game.phase === 'walking') { times.push(performance.now() - t);", "if (game.phase === 'walking') { const cpu=performance.now()-t;qaCpu.push(cpu);qaIntervals.push(elapsed);times.push(cpu);");
controller+=`
const qaButton=document.createElement('button');qaButton.textContent='Run 100 m performance check';qaButton.style.cssText='position:fixed;bottom:5px;left:5px;z-index:20;color:#292a25;background:#f5f2e9;padding:8px';document.body.append(qaButton);
const qaIdleFrames=[];let qaPrevious=0,qaWarmup=0;qaButton.disabled=true;
function idleCadence(now){if(qaPrevious&&++qaWarmup>15)qaIdleFrames.push(now-qaPrevious);qaPrevious=now;if(qaIdleFrames.length<90)requestAnimationFrame(idleCadence);else qaButton.disabled=false;}requestAnimationFrame(idleCadence);
const qaReport=document.createElement('pre');qaReport.id='qa-report';qaReport.hidden=true;document.body.append(qaReport);
qaButton.onclick=()=>{qaButton.hidden=true;start();const route=${JSON.stringify(route)};let i=0;inputMode='keyboard';function play(){
 if(game.phase==='finished'){
  const stats=values=>{const s=[...values].sort((a,b)=>a-b);return {mean:+(s.reduce((a,b)=>a+b,0)/s.length).toFixed(2),p95:+s[Math.floor(s.length*.95)].toFixed(2),max:+s.at(-1).toFixed(2)};};
  qaReport.textContent=JSON.stringify({done:true,idleFps:+(1000/(qaIdleFrames.reduce((a,b)=>a+b,0)/qaIdleFrames.length)).toFixed(1),steps:game.steps,splits:race.splits(),metres:progress(game)*ROAD.metres,clean:condition(game),time:race.elapsed(),cpu:stats(qaCpu),interval:stats(qaIntervals),fps:+(1000/(qaIntervals.reduce((a,b)=>a+b,0)/qaIntervals.length)).toFixed(1),frames:qaCpu.length,slowCpuFrames:qaCpu.filter(x=>x>16.7).length,generatedChunks:renderer.metrics.generated,prefetched:renderer.metrics.prefetched,visibleMisses:renderer.metrics.visibleMisses,missingTiles:renderer.metrics.missingTiles,warmLongestSlice:renderer.metrics.warmLongestSlice,initializationLongestSlice:renderer.metrics.initializationLongestSlice,startupLongestSlice:renderer.metrics.startupLongestSlice,cacheMiB:renderer.metrics.cacheBytes/1048576,assets:renderer.assetsReady,readyMs:canvas.dataset.readyMs});return;
 }
 if(game.phase==='walking'&&game.mode==='idle'&&i<route.length)requestStep(route[i++]);requestAnimationFrame(play);
}requestAnimationFrame(play);};
`;
if(immediate)controller=controller.replace('}requestAnimationFrame(idleCadence);','}')+'\nqaButton.disabled=false;qaButton.click();\n';
write('_qa-race-performance.js',controller);
// The synchronous control drains the identical terrain painter in one callback.
// Compare pixels with incremental preparation and measure callback budgets.
const synchronous=read('render.js').replace(/  function warmNext\(g\) \{[\s\S]*?(?=  async function prime)/,`  function warmNext(g) {
 if(warmJob!==null||document.hidden||g.phase==='finished'||!window.requestIdleCallback)return;
 const next=Math.floor((camera+viewH)/CHUNK)+1;
 if(chunks.has(next)||next>Math.floor((ROAD.finish+viewH+400)/CHUNK))return;
 warmJob=window.requestIdleCallback(()=>{warmJob=null;if(ref!==g)return;tile(next);metrics.prefetched++;});
 }
`);
write('_qa-sync-render.js',synchronous);
write('_qa-terrain-budget.html',read('_tests/terrain-budget.html').replaceAll('small-discoveries-121',version));

write('_qa-denim-equivalence.html',read('_tests/denim-equivalence.html').replaceAll('small-discoveries-121',version));
write('_qa-terrain-prefetch.html',read('_tests/terrain-prefetch.html').replaceAll('small-discoveries-121',version));
