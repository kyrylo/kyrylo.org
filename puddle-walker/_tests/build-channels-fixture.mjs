// Local QA only; both routes use the real renderer/controller and native input.
import {readFileSync,writeFileSync} from 'node:fs';
import {createGame} from '../model.js';
import {channelCourse} from './channel-course.mjs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
const routes=[true,false].map(direct=>channelCourse(createGame('leather',321),direct));
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"if(qaTargets.length){canvas.dataset.qaTargets=JSON.stringify(qaTargets.map(p=>({...p,screen:renderer.screenPoint(p)})));canvas.dataset.qaClean=String(condition(game));}\n    const target = game.preview, screen =");
controller+=`
let qaTargets=[];
const qaControls=document.createElement('div');qaControls.style.cssText='position:fixed;bottom:18px;left:12px;z-index:20;display:flex;gap:8px';document.body.append(qaControls);
const qaCourses=${JSON.stringify(routes)};
for(const [i,label] of ['Cross both channels','Weave around the ends'].entries()){
 const button=document.createElement('button');button.textContent=label;button.style.cssText='padding:10px;background:#f5f2e9;color:#292a25';qaControls.append(button);
 button.onclick=()=>{
  reset(true);const course=qaCourses[i];game.active=0;
  game.feet.forEach((f,n)=>{f.x=course.start.x+(n?30:-30);f.y=course.start.y;f.bestY=f.y;});
  qaTargets=course.targets.map((p,n)=>({x:p.x+(n%2?30:-30),y:p.y}));
  canvas.dataset.qaCrossingSteps=String(course.crossingSteps);
  start();game.preview=null;inputMode='keyboard';renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaControls.hidden=true;
 };
}
`;
write('_qa-channels.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-channels.js?v=48"'));
write('_qa-channels.js',controller);
write('_qa-channels-phone.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Two channels · phone check</title><style>html,body{margin:0;background:#252820}iframe{display:block;width:390px;height:844px;border:0}</style><iframe title="Phone game preview" src="./_qa-channels.html"></iframe>');
