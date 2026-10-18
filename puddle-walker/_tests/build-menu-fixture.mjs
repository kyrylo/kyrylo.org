// Visual QA uses the real menus/controller and an isolated in-memory best score.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),output=new URL('../../_site/puddle-walker/',import.meta.url);
const route=JSON.parse(readFileSync(new URL('_notes/designed-route-audit.json',root),'utf8')).find(r=>r.seed===321).route;
const page=readFileSync(new URL('index.html',root),'utf8').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-menus.js?$1"');
let controller=readFileSync(new URL('game.js',root),'utf8').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaBar=document.createElement('nav');qaBar.setAttribute('aria-label','Preview fixtures');qaBar.style.cssText='position:fixed;bottom:2px;right:8px;z-index:20;display:flex;gap:8px;font:11px system-ui';document.body.append(qaBar);
function fixtureButton(label, action){const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:3px;border:1px solid #aaa;background:#fff;color:#333';b.onclick=()=>{qaBar.hidden=true;action();};qaBar.append(b);}
fixtureButton('Preview clean finish',()=>{reset(true);start();const route=${JSON.stringify(route)};let i=0;function play(){const p=route[i++];if(!p)return;takeStep(game,p);for(let t=0;t<240&&game.mode!=='idle';t++)advance(game,1/120);game.events.length=0;needsPaint=true;hud();if(game.phase==='finished'){finish();return;}requestAnimationFrame(play);}requestAnimationFrame(play);});
fixtureButton('Preview muddy finish',()=>{reset(true);start();game.steps=184;game.crossings=6;game.bestFlow=2;game.feet.forEach(f=>{f.y=ROAD.finish;f.stain.fill(.5);f.sole.forEach(z=>z.stain=.5);f.coverage=.5;f.tint.fill(65);f.revision++;});game.phase='finished';finish();});
fixtureButton('Hide preview controls',()=>{});
`;
writeFileSync(new URL('_qa-menus.html',output),page);writeFileSync(new URL('_qa-menus.js',output),controller);
