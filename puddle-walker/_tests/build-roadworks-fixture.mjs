// Local QA only; use the real controller and isolate player records.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"if(qaSection){canvas.dataset.qaTargets=JSON.stringify(qaTargets.map(p=>({...p,screen:renderer.screenPoint(p)})));canvas.dataset.qaClean=String(condition(game));}\n    const target = game.preview, screen =");
controller+=`
let qaSection=null,qaTargets=[];
const qaControls=document.createElement('div');qaControls.style.cssText='position:fixed;bottom:18px;left:12px;right:12px;z-index:20;display:flex;gap:8px';document.body.append(qaControls);
for(const [label,first] of [['First work-zone exit',true],['Second work-zone spill',false]]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:10px;background:#f5f2e9;color:#292a25';qaControls.append(b);
 b.onclick=()=>{
  reset(true);const works=game.street.sections.filter(s=>s.stage===2&&s.kind.startsWith('works'));qaSection=works[first?1:2];const s=qaSection,mirror=first?s.gap<450:s.gap>450,at=x=>mirror?900-x:x;
  game.active=first?(mirror?1:0):(mirror?0:1);
  game.feet.forEach((f,i)=>{f.x=s.gap+(i?30:-30);f.y=s.y+(first?70:80);f.bestY=f.y;});
  const route=first?[[480,180],[510,245],[330,325],[360,385],[170,490],[230,555],[170,705],[230,825]]:[[420,190],[390,250],[570,350],[540,390],[670,works[3].y-s.y+50],[610,works[3].y-s.y+120],[670,works[3].y-s.y+285],[610,works[3].y-s.y+325]];
  qaTargets=route.map(([x,dy],i)=>({x:at(x),y:s.y+dy,side:(game.active+i)%2}));canvas.dataset.qaSection=JSON.stringify(s);start();game.preview=null;inputMode='keyboard';renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaControls.hidden=true;
 };
}
`;
write('_qa-roadworks.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-roadworks.js?v=46"'));
write('_qa-roadworks.js',controller);
write('_qa-roadworks-phone.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roadworks · phone check</title><style>html,body{margin:0;background:#252820}iframe{display:block;width:390px;height:844px;border:0}</style><iframe title="Phone game preview" src="./_qa-roadworks.html"></iframe>');
