// Replay actual routes through the production controller and shoe renderer.
// The preview uses isolated records and never edits the player's best time.
import {readFileSync,writeFileSync,copyFileSync,readdirSync} from 'node:fs';
import {walkCarelessly} from './straight-course.mjs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const [seed,lane,stride]=[321,450,65].map((fallback,i)=>Number(process.argv[i+2]??fallback));
if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||lane<150||lane>750||stride<30||stride>70||![lane,stride].every(Number.isFinite))throw new RangeError('Expected seed, lane (150–750), and stride (30–70)');
for(const name of readdirSync(root))if(/\.(js|css)$/.test(name))copyFileSync(new URL(name,root),new URL(name,out));
const read=p=>readFileSync(new URL(p,root),'utf8');
const careful=JSON.parse(read('_notes/designed-route-audit.json')).find(r=>r.seed===seed)?.route;
const routes=[['Walk straight',walkCarelessly(seed,stride,lane,true).placements]];
if(careful)routes.push(['Walk carefully',careful]);
let controller=read('game.js').replace('let game = createGame(),',`let game = createGame('leather',${seed}),`);
// Accelerated replay displays the elapsed simulated walk, not playback speed.
controller=controller.replace('createRaceClock(() => performance.now())','createRaceClock(() => game.time * 1000)');
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaBar=document.createElement('nav');qaBar.setAttribute('aria-label','Balance previews');qaBar.style.cssText='position:fixed;bottom:10px;left:10px;z-index:20;display:flex;gap:8px';document.body.append(qaBar);
for(const [label,route] of ${JSON.stringify(routes)}){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:10px;background:white;border:1px solid #aaa';qaBar.append(b);
 b.onclick=()=>{qaBar.hidden=true;reset(true);start();let i=0;
  function play(){const p=route[i++];if(!p)return;takeStep(game,p);for(let t=0;t<240&&game.mode!=='idle';t++)advance(game,1/120);game.events.length=0;needsPaint=true;hud();if(game.phase==='finished'){finish();return;}requestAnimationFrame(play);}requestAnimationFrame(play);
 };
}
`;
writeFileSync(new URL('_qa-balance.html',out),read('index.html').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-balance.js?$1"'));
writeFileSync(new URL('_qa-balance.js',out),controller);
