// Isolated entry points into the three authored parking encounters. All aiming,
// steps and contamination use the real controller; records stay in this fixture.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"if(qaTargets.length)canvas.dataset.qaTargets=JSON.stringify(qaTargets.map(p=>({...p,screen:renderer.screenPoint(p)})));\n    const target = game.preview, screen =");
controller+=`
let qaTargets=[];
const qaControls=document.createElement('div');qaControls.style.cssText='position:fixed;top:155px;left:16px;z-index:20;display:flex;gap:8px';document.body.append(qaControls);
for(const [pattern,label,outside] of [['squeeze','First bay'],['bend','Broken shoulder'],['bend','Outside detour',true],['crossing','Shallow crossing']]){
 const button=document.createElement('button');button.textContent=label;button.style.cssText='padding:10px;background:#f4f0e4;color:#26382c';qaControls.append(button);
 button.onclick=()=>{
  qaControls.hidden=true;reset(true);start();inputMode='keyboard';
  const s=game.street.sections.find(s=>s.stage===1&&s.parkingPattern===pattern),x=outside?s.lanes[1]:s.line[0].x;
  game.feet.forEach((f,i)=>{f.x=x+(i?30:-30);f.y=s.y-260-i*20;f.bestY=f.y;});
  game.events.length=0;clearInput();game.preview=null;race.start();
  renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();
  canvas.dataset.qaSection=JSON.stringify(s);
  qaTargets=Array.from({length:pattern==='crossing'?6:7},(_,i)=>{
   const y=s.y+(pattern==='crossing'?-105:-160)+i*100;
   let n=s.line.findIndex(p=>p.y>y);if(n<0)n=s.line.length-1;
   const a=s.line[Math.max(0,n-1)],b=s.line[n],t=a.y===b.y?0:Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y))),side=i%2;
   return {side,x:(outside?s.lanes[1]:a.x+(b.x-a.x)*t)+(side?30:-30),y};
  });
 };
}
`;
writeFileSync(new URL('_qa-parking.html',out),read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-parking.js?v=42"'));
writeFileSync(new URL('_qa-parking.js',out),controller);
writeFileSync(new URL('_qa-parking-mobile.html',out),`<!doctype html><html><head><meta charset="utf-8"><title>Parking encounters · 390 px</title><style>html,body{margin:0;background:#15221a}iframe{display:block;width:390px;height:844px;border:0;margin:auto}</style></head><body><iframe src="./_qa-parking.html" title="390 px parking preview"></iframe></body></html>`);
