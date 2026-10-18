// Local QA only: real game rendering and input, isolated player records.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"if(qaSection){canvas.dataset.qaTargets=JSON.stringify(qaTargets.map(p=>({...p,screen:renderer.screenPoint(p)})));canvas.dataset.qaClean=String(condition(game));}\n    const target = game.preview, screen =");
controller+=`
let qaSection=null,qaTargets=[];
const qaControls=document.createElement('div');qaControls.style.cssText='position:fixed;bottom:18px;left:12px;right:12px;z-index:20;display:flex;gap:8px';document.body.append(qaControls);
for(const [label,kind] of [['Final fork','fork'],['Final S-turn','works-in']]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:10px;background:#f5f2e9;color:#292a25';qaControls.append(b);
 b.onclick=()=>{
  reset(true);qaSection=game.street.sections.find(s=>s.stage===4&&s.kind===kind);
  const s=qaSection,mirror=s.gap<450,across=x=>mirror?900-x:x;
  game.active=kind==='fork'?0:mirror?1:0;
  game.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y+(kind==='fork'?-240:80);f.bestY=f.y;});
  if(kind==='fork')qaTargets=[-100,40,90,265,300].map((dy,i)=>({x:s.gap+(i%2?30:-30),y:s.y+dy}));
  else{const next=game.street.sections.find(p=>p.stage===4&&p.kind==='works-out');qaTargets=[[460,190],[490,250],[330,340],[360,390],[250,next.y-s.y+50],[310,next.y-s.y+120]].map(([x,dy])=>({x:across(x),y:s.y+dy}));}
  canvas.dataset.qaSection=JSON.stringify(s);start();game.preview=null;inputMode='keyboard';renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaControls.hidden=true;
 };
}
`;
write('_qa-finale.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-finale.js?v=44"'));
write('_qa-finale.js',controller);
write('_qa-finale-phone.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Final street · phone check</title><style>html,body{margin:0;background:#252820}iframe{display:block;width:390px;height:844px;border:0}</style><iframe title="Phone game preview" src="./_qa-finale.html"></iframe>');
