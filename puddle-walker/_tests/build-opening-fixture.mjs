// Local QA only: real input and rendering with isolated records.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"window.addEventListener('error',e=>console.error(e.error||e.message));const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"if(qaSection){canvas.dataset.qaTargets=JSON.stringify(qaTargets.map(p=>({...p,screen:renderer.screenPoint(p)})));canvas.dataset.qaClean=String(condition(game));}\n    const target = game.preview, screen =");
controller+=`
let qaSection=null,qaTargets=[];
const qaControls=document.createElement('div');qaControls.style.cssText='position:fixed;bottom:18px;left:12px;right:12px;z-index:20;display:flex;gap:8px';document.body.append(qaControls);
for(const [label,kind] of [['Downpipe crossing','doorstep'],['Wet access posts','slalom']]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:10px;background:#f5f2e9;color:#292a25';qaControls.append(b);
 b.onclick=()=>{
  reset(true);qaSection=game.street.sections.find(s=>s.kind===kind);const s=qaSection,mirror=s.line[0].x<s.gap;
  game.active=kind==='doorstep'?0:mirror?1:0;
  game.feet.forEach((f,i)=>{f.x=s.line[0].x+(i?30:-30);f.y=s.y-(kind==='doorstep'?225:260);f.bestY=f.y;});
  if(kind==='doorstep')qaTargets=[-40,70,180,240].map((dy,i)=>{const x=dy<=90?s.gap:s.gap+(450-s.gap)*(dy-90)/150;return {x:x+(i%2?30:-30),y:s.y+dy};});
  else qaTargets=[[500,-100],[560,30],[410,70],[470,110],[410,260],[470,320]].map(([x,dy])=>({x:s.gap+(mirror?-1:1)*(x-485),y:s.y+dy}));
  canvas.dataset.qaSection=JSON.stringify(s);start();game.preview=null;inputMode='keyboard';renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaControls.hidden=true;
 };
 if(new URL(location.href).searchParams.get('encounter')===kind)b.onclick();
}
`;
write('_qa-opening.html',read('index.html').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-opening.js?$1"'));
write('_qa-opening.js',controller);
write('_qa-opening-phone.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening street · phone check</title><style>html,body{margin:0;background:#252820}iframe{display:block;width:390px;height:844px;border:0}</style><iframe title="Phone game preview" src="./_qa-opening.html"></iframe>');
