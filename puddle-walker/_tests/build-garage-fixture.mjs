// Isolated controller preview: native controls start real-time physics routes.
import {readFileSync,writeFileSync} from 'node:fs';
import {createGame} from '../model.js';
import {garageCourse,wheelRutCourse} from './garage-course.mjs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
const courses=[...[true,false].map(direct=>garageCourse(createGame('leather',321),direct)),...[true,false].map(direct=>wheelRutCourse(createGame('leather',321),direct))];
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaCourses=${JSON.stringify(courses)};
const qaControls=document.createElement('div');qaControls.style.cssText='position:fixed;bottom:16px;left:16px;z-index:20;display:flex;gap:8px';document.body.append(qaControls);
let qaCourse=null,qaIndex=0;
for(const [i,label] of ['Short crossing','Dry detour','Broken wheel rut','Outside first car'].entries()){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:10px;background:#f5f2e9;color:#292a25';qaControls.append(b);
 b.onclick=()=>{
  reset(true);qaCourse=qaCourses[i];qaIndex=0;game.active=0;
  game.feet.forEach((f,n)=>Object.assign(f,{x:qaCourse.start.x+(n?30:-30),y:qaCourse.start.y,bestY:qaCourse.start.y}));
  start();game.preview=null;inputMode='keyboard';renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();
  canvas.dataset.qaRoute=label;canvas.dataset.qaStatus='ready';
 };
 if(Number(new URL(location.href).searchParams.get('course'))===i&&new URL(location.href).searchParams.has('course'))b.onclick();
}
const walk=document.createElement('button');walk.textContent='Walk this route';walk.style.cssText='padding:10px;background:#f5f2e9;color:#292a25';qaControls.append(walk);
walk.onclick=()=>{
 if(!qaCourse)return;qaControls.hidden=true;canvas.dataset.qaStatus='walking';
 const tick=()=>{
  if(game.mode==='idle'){
   if(qaIndex===qaCourse.targets.length){canvas.dataset.qaStatus='complete';canvas.dataset.qaClean=condition(game);canvas.dataset.qaSteps=qaIndex;return;}
   const p=qaCourse.targets[qaIndex++];
   if(!takeStep(game,{x:p.x+(game.active?30:-30),y:p.y})){canvas.dataset.qaStatus='invalid';return;}
  }
  requestAnimationFrame(tick);
 };
 requestAnimationFrame(tick);
};
const hide=document.createElement('button');hide.textContent='Hide preview controls';hide.style.cssText=walk.style.cssText;qaControls.append(hide);hide.onclick=()=>{qaControls.hidden=true;};
`;
write('_qa-garage.html',read('index.html').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-garage.js?$1"'));
write('_qa-garage.js',controller);
