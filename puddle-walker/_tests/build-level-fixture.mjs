import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),output=new URL('../../_site/puddle-walker/',import.meta.url);
const verified=JSON.parse(readFileSync(new URL('_notes/designed-route-audit.json',root),'utf8')).find(r=>r.seed===321).route;
let page=readFileSync(new URL('index.html',root),'utf8').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-levels.js?v=37"');
let controller=readFileSync(new URL('game.js',root),'utf8').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`\nconst controls=document.createElement('div');controls.style.cssText='position:fixed;top:160px;left:5%;right:5%;z-index:20;display:flex;flex-wrap:wrap;gap:6px';document.body.append(controls);
for(const [label,kind,stage] of [['Doorsteps','doorstep',0],['Parked cars','squeeze',1],['Roadworks','works-in',2],['The low road','drain-chain',3],['Home stretch','crown',4]]){
 const button=document.createElement('button');button.textContent=label;button.style.cssText='padding:8px';controls.append(button);
 button.onclick=()=>{reset(true);const section=game.street.sections.find(s=>s.kind===kind&&s.stage===stage);game.feet.forEach((f,i)=>{f.x=(kind==='diagonal'?section.lanes[0]:kind==='crown'?section.line[0].x:['double-runoff','drain-chain'].includes(kind)?450:section.gap)+(i?30:-30);f.y=section.y-(kind==='diagonal'?115:kind==='drain-chain'?310:kind==='double-runoff'?265:kind==='crown'?210:120)-(['drain-chain','diagonal'].includes(kind)?0:i*20);f.bestY=f.y;});if(kind==='drain-chain'){const first=game.street.patches.find(p=>p.type==='metal'&&Math.abs(p.y-section.y+100)<1);game.active=first.x>450?1:0;}start();renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();controls.hidden=true;verifyButton.hidden=true;};
}\n`;
controller+=`
const verifyButton=document.createElement('button');verifyButton.textContent='Validate full route';verifyButton.style.cssText='position:fixed;bottom:8px;left:12px;z-index:20;padding:8px';document.body.append(verifyButton);
verifyButton.onclick=()=>{reset(true);start();controls.hidden=true;verifyButton.hidden=true;const route=${JSON.stringify(verified)};let index=0;const play=()=>{const p=route[index++];if(!p)return;takeStep(game,p);for(let i=0;i<240&&game.mode!=='idle';i++)advance(game,1/120);game.events.length=0;needsPaint=true;hud();if(game.phase==='finished'){finish();return;}requestAnimationFrame(play);};requestAnimationFrame(play);};
`;
writeFileSync(new URL('_qa-levels.html',output),page);writeFileSync(new URL('_qa-levels.js',output),controller);
