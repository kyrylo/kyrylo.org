import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),output=new URL('../../_site/puddle-walker/',import.meta.url);
const route=JSON.parse(readFileSync(new URL('_notes/designed-route-audit.json',root),'utf8')).find(r=>r.seed===321).route;
const page=readFileSync(new URL('index.html',root),'utf8').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-footing.js?v=32"');
let controller=readFileSync(new URL('game.js',root),'utf8').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaBar=document.createElement('nav');qaBar.setAttribute('aria-label','Preview fixtures');qaBar.style.cssText='position:fixed;bottom:2px;left:35%;z-index:20;display:flex;gap:8px;font:11px system-ui';document.body.append(qaBar);
function fixtureButton(label,action){const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:5px;border:1px solid #aaa;background:#fff;color:#333';b.onclick=()=>{qaBar.hidden=true;action();};qaBar.append(b);}
fixtureButton('Trapped at the curb',()=>{reset(true);const car=game.street.obstacles.find(o=>o.type==='car');game.feet.forEach((f,i)=>{f.x=ROAD.left+SHOES.leather.width+i*27;f.y=car.y-car.halfLength-34;f.bestY=f.y;});start();renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();});
fixtureButton('Race the full street',()=>{reset(true);start();const route=${JSON.stringify(route)};let i=0;inputMode='keyboard';function play(){if(game.phase==='finished')return;if(game.phase==='walking'&&game.mode==='idle'&&i<route.length)requestStep(route[i++]);requestAnimationFrame(play);}requestAnimationFrame(play);});
fixtureButton('Preview timed finish',()=>{reset(true);start();const route=${JSON.stringify(route)};for(const p of route){takeStep(game,p);for(let t=0;t<240&&game.mode!=='idle';t++)advance(game,1/120);}finish();});
`;
writeFileSync(new URL('_qa-footing.html',output),page);writeFileSync(new URL('_qa-footing.js',output),controller);
