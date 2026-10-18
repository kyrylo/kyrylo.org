import {readFileSync,writeFileSync} from 'node:fs';
import {stageBarrierTrap} from './barrier-trap.mjs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"canvas.dataset.qaForward=JSON.stringify(renderer.screenPoint({x:game.feet[game.active].x,y:Math.max(...game.feet.map(f=>f.y))+150}));canvas.dataset.qaClean=String(condition(game));\n    const target = game.preview, screen =");
controller+=`
${stageBarrierTrap.toString()}
const qaControls=document.createElement('div');qaControls.style.cssText='position:fixed;bottom:18px;left:12px;z-index:20;display:flex;gap:8px';document.body.append(qaControls);
for(const [label,kind] of [['Catch a corner','corner'],['Pin both feet against the rail','middle']]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:10px;background:#f5f2e9;color:#292a25';qaControls.append(b);
 b.onclick=()=>{
  reset(true);const rail=game.street.obstacles.find(o=>o.type==='barrier');stageBarrierTrap(game,rail,kind);
  game.events.length=0;clearInput();start();inputMode='keyboard';
  canvas.dataset.qaBarrier=JSON.stringify(rail);renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaControls.hidden=true;
 };
}
`;
write('_qa-recovery.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-recovery.js?v=49"'));
write('_qa-recovery.js',controller);
write('_qa-recovery-phone.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Barrier recovery · phone check</title><style>html,body{margin:0;background:#252820}iframe{display:block;width:390px;height:844px;border:0}</style><iframe title="Phone game preview" src="./_qa-recovery.html"></iframe>');
