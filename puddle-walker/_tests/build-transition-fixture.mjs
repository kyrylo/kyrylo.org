// Local QA only; run the real controller with isolated records and native input.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"if(qaTargets.length){canvas.dataset.qaTargets=JSON.stringify(qaTargets.map(p=>({...p,screen:renderer.screenPoint(p)})));canvas.dataset.qaClean=String(condition(game));}\n    const target = game.preview, screen =");
controller+=`
let qaTargets=[];
const qaButton=document.createElement('button');qaButton.textContent='Low road into home stretch';qaButton.style.cssText='position:fixed;bottom:18px;left:12px;z-index:20;padding:10px;background:#f5f2e9;color:#292a25';document.body.append(qaButton);
qaButton.onclick=()=>{
 reset(true);const s=game.street.sections.find(s=>s.stage===3&&s.kind==='diagonal'),crown=game.street.sections.find(s=>s.stage===4),at=x=>s.gap<450?900-x:x;
 game.active=0;game.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y-115;f.bestY=f.y;});
 const centres=[[700,45],[680,145],[625,250],[625,310],[525,390],[525,445],[450,500],[450,540]].map(([x,dy])=>({x:at(x),y:s.y+dy}));
 for(const dy of [-100,-60,10])centres.push({x:crown.line[0].x,y:crown.line[0].y+dy});
 qaTargets=centres.map((p,i)=>({x:p.x+(i%2?30:-30),y:p.y}));
 start();game.preview=null;inputMode='keyboard';renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaButton.hidden=true;
};
`;
write('_qa-transition.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-transition.js?v=47"'));
write('_qa-transition.js',controller);
write('_qa-transition-phone.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Low road exit · phone check</title><style>html,body{margin:0;background:#252820}iframe{display:block;width:390px;height:844px;border:0}</style><iframe title="Phone game preview" src="./_qa-transition.html"></iframe>');
