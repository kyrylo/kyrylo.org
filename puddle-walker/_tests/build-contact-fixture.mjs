// Exercise the real controller at an authored rail, with isolated records.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const contactEvents = game.events.splice(0);',`const contactEvents = game.events.splice(0);
  for(const event of contactEvents)if(event.type==='bump')canvas.dataset.qaContact=JSON.stringify(event);`);
controller=controller.replace('canvas.dataset.targetValid =',"canvas.dataset.qaBlocked=String(Boolean(target?.blocked));\n    canvas.dataset.targetValid =");
controller+=`
const qaButton=document.createElement('button');qaButton.textContent='Approach repair rail';qaButton.style.cssText='position:fixed;top:155px;left:16px;z-index:20;padding:10px;background:#f4f0e4;color:#26382c';document.body.append(qaButton);
qaButton.onclick=()=>{
 qaButton.hidden=true;reset(true);start();inputMode='keyboard';
 const rail=game.street.obstacles.find(o=>o.type==='barrier'),sign=rail.x<450?1:-1,edge=rail.x+sign*rail.halfWidth,free=sign===1?1:0,trapped=1-free;
 game.feet.forEach(f=>{f.x=edge+sign*(f.side===free?20:-10);f.y=rail.y-rail.halfLength-100;f.bestY=f.y;});
 selectFoot(game,trapped);clearInput();aimAt({x:game.feet[trapped].x,y:rail.y+100});race.start();
 renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();
 canvas.dataset.qaCorner=JSON.stringify({edge,sign,free,trapped,y:rail.y});
};
`;
writeFileSync(new URL('_qa-contact.html',out),read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-contact.js?v=41"'));
writeFileSync(new URL('_qa-contact.js',out),controller);
writeFileSync(new URL('_qa-contact-mobile.html',out),`<!doctype html><html><head><meta charset="utf-8"><title>Foot contact · 390 px</title><style>html,body{margin:0;background:#15221a}iframe{display:block;width:390px;height:844px;border:0;margin:auto}</style></head><body><iframe src="./_qa-contact.html" title="390 px contact preview"></iframe></body></html>`);
