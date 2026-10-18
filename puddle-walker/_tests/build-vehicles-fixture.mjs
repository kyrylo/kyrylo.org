import {readFileSync,writeFileSync} from 'node:fs';
import {VEHICLES} from '../vehicles.js';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller="import {vehicleLineup,VEHICLES} from './vehicles.js?v=cars-59';\n"+controller;
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qa=document.createElement('nav');qa.setAttribute('aria-label','Car previews');qa.style.cssText='position:fixed;bottom:8px;left:8px;right:8px;z-index:20;display:flex;flex-wrap:wrap;gap:6px';document.body.append(qa);
for(const [index,[car,id]] of [...vehicleLineup(game.street)].entries()){
 const button=document.createElement('button');button.textContent=(index+1)+' · '+VEHICLES.find(v=>v.id===id).name;button.style.cssText='padding:8px;background:#fff;color:#222;border:1px solid #777';qa.append(button);
 button.onclick=()=>{reset(true);const car=game.street.parking[index];game.feet.forEach((f,i)=>{f.x=420+i*60;f.y=car.y-180-i*20;f.bestY=f.y;});game.blockIndex=Math.min(4,Math.floor((car.y-ROAD.start)/4000));start();renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qa.hidden=true;canvas.dataset.vehicles=JSON.stringify(renderer.vehicleState());};
}
`;
writeFileSync(new URL('_qa-vehicles.html',out),read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-vehicles.js?v=cars-59"'));
writeFileSync(new URL('_qa-vehicles.js',out),controller);
const cards=VEHICLES.map(v=>`<figure><div class="bay"><img src="./assets/${v.asset}" alt="${v.name}" style="${v.insets?'height:358px;width:241px;margin-top:-15px;':''}"></div><figcaption>${v.name}</figcaption></figure>`).join('');
writeFileSync(new URL('_qa-fleet.html',out),`<!doctype html><html><head><meta charset="utf-8"><title>Puddle Walker · parked cars</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#1e2926;color:#f4f0db;font:14px system-ui}main{padding:32px 24px;max-width:1400px;margin:auto}h1{font-size:22px;letter-spacing:-.5px;margin:0 0 8px}p{margin:0 0 28px;color:#bec7ba;font-size:13px}.fleet{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}figure{margin:0;flex:1;min-width:170px;max-width:250px}.bay{height:340px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(#10251c18,#10251c18),url('./assets/asphalt.webp');border:1px solid #d4c9a84d}.bay img{display:block;height:315px;width:auto;filter:drop-shadow(5px 7px 5px #0b121b80)}figcaption{padding-top:12px;text-align:center;font-size:12px;letter-spacing:.4px}</style></head><body><main><h1>Puddle Walker</h1><p>Five different neighbours. Five different cars.</p><div class="fleet">${cards}</div></main></body></html>`);
