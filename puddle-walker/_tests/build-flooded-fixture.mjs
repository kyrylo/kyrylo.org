// Local-only staging controls for the real renderer and input controller.
import {readFileSync,writeFileSync} from 'node:fs';
import {createGame} from '../model.js';
import {coverCourse} from './cover-course.mjs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
const bareCoverTargets=coverCourse(createGame('leather',321)).targets;
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"if(qaSection){canvas.dataset.qaTargets=JSON.stringify(qaTargets.map(p=>({...p,screen:renderer.screenPoint(p)})));canvas.dataset.qaClean=String(condition(game));}\n    const target = game.preview, screen =");
controller+=`
let qaSection=null,qaTargets=[];
const qaBareCoverTargets=${JSON.stringify(bareCoverTargets)};
const qaControls=document.createElement('div');qaControls.style.cssText='position:fixed;bottom:18px;left:12px;right:12px;z-index:20;display:flex;gap:8px;flex-wrap:wrap';document.body.append(qaControls);
for(const [label,mode] of [['Roadbed approach','approach'],['First flooded crossing','pair'],['First dry route','pair-detour'],['Leaf-covered shortcut','staggered'],['Dry detour','detour']]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:10px;background:#f5f2e9;color:#292a25';qaControls.append(b);
 b.onclick=()=>{
  reset(true);const first=['pair','approach','pair-detour'].includes(mode),detour=mode.endsWith('detour');
  qaSection=game.street.sections.find(s=>s.stage===3&&s.coverPattern===(first?'pair':'staggered'));
  const covers=game.street.patches.filter(p=>p.type==='metal'&&Math.abs(p.y-qaSection.y)<180).sort((a,b)=>a.y-b.y);
  const x=detour?qaSection.gap:450,back=first?310:350;
  game.feet.forEach((f,i)=>{f.x=x+(i?30:-30);f.y=qaSection.y-back;f.bestY=f.y;});
  game.active=detour?0:covers[0].x>450?1:0;
  qaTargets=detour?first?Array.from({length:7},(_,i)=>({x:qaSection.gap+(i%2?30:-30),y:qaSection.y-210+i*100})):qaSection.line:first?[...covers.map(p=>({x:p.x,y:p.y})),{x:covers.at(-2).x,y:qaSection.y+300},{x:covers.at(-1).x,y:qaSection.y+360}]:qaBareCoverTargets;
  if(mode==='approach'){
   const exit=game.street.sections.filter(s=>s.stage===2).at(-1).line.at(-1),end=qaSection.y-325;
   game.feet.forEach((f,i)=>{f.x=exit.x+(i?30:-30);f.y=exit.y-i*20;f.bestY=f.y;});
   const setup=Array.from({length:4},(_,i)=>{const y=Math.min(end,exit.y+(i+1)*120),t=(y-exit.y)/(end-exit.y);return {x:exit.x+(450-exit.x)*t+((game.active+i)%2?30:-30),y};});
   qaTargets.unshift(...setup);
  }
  qaTargets=qaTargets.map((p,i)=>({...p,side:(game.active+i)%2}));
  canvas.dataset.qaSection=JSON.stringify(qaSection);start();game.preview=null;inputMode='keyboard';renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaControls.hidden=true;
 };
}
`;
write('_qa-flooded.html',read('index.html').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-flooded.js?$1"'));
write('_qa-flooded.js',controller);
write('_qa-flooded-phone.html','<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flooded street · phone check</title><style>html,body{margin:0;background:#252820}iframe{display:block;width:390px;height:844px;border:0}</style><iframe title="Phone game preview" src="./_qa-flooded.html"></iframe>');
