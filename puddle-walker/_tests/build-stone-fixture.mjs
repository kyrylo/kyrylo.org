// Real controller/renderer; only the starting position and QA controls differ.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller="import {stoneCourse} from './_qa-stone-course.js';\n"+controller;
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaBar=document.createElement('nav');qaBar.style.cssText='position:fixed;bottom:10px;right:10px;z-index:30;display:flex;gap:5px';document.body.append(qaBar);
const qaReport=document.createElement('pre');qaReport.id='qa-report';qaReport.hidden=true;document.body.append(qaReport);
let qaRoute=[],qaAuto=false,qaCpu=[],qaLast=0,qaIntervals=[];
function qaScene(){
 reset(true);const s=game.street.sections.find(s=>s.kind==='stepping-stones');
 game.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:s.y-260,bestY:s.y-260}));game.steps=150;start();inputMode='keyboard';game.preview=null;
 qaRoute=stoneCourse(game).targets;qaAuto=false;qaCpu=[];qaIntervals=[];renderer.prepare(game,performance.now(),1,true);needsPaint=true;
}
for(const label of ['Show crossing','Walk stones','Miss stone','Hide controls']){
 const button=document.createElement('button');button.textContent=label;button.style.cssText='padding:10px;background:#fff;color:#222';qaBar.append(button);
 button.onclick=()=>{
  if(label==='Hide controls'){qaBar.hidden=true;qaBar.style.display='none';return;}
  if(label==='Show crossing'){qaScene();return;}
  if(label==='Walk stones'){qaAuto=true;return;}
  qaScene();const route=[...qaRoute];for(const p of route.slice(0,2)){takeStep(game,p);for(let i=0;i<240&&game.mode!=='idle';i++)advance(game,1/120);}
  requestStep({x:340,y:route[2].y});qaRoute=route.slice(3);
 };
}
function qaFrame(now){
 if(qaLast&&game.phase==='walking')qaIntervals.push(now-qaLast);qaLast=now;
 if(qaAuto&&qaRoute.length&&game.mode==='idle')requestStep(qaRoute.shift());
 const next=qaRoute[0];qaReport.textContent=JSON.stringify({phase:game.phase,mode:game.mode,clean:condition(game),steps:game.steps,active:game.active,remaining:qaRoute.length,next:next?renderer.screenPoint(next):null,feet:game.feet.map(f=>({x:f.x,y:f.y,angle:f.angle})),contacts:game.groundContacts.map(m=>m.kind),footprints:game.prints.length,assets:renderer.assetsReady,cacheMiB:renderer.metrics.cacheBytes/1048576});
 requestAnimationFrame(qaFrame);
}requestAnimationFrame(qaFrame);
`;
write('_qa-stones.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-stones.js?v=79"'));
write('_qa-stones.js',controller);write('_qa-stone-course.js',read('_tests/stone-course.mjs'));
