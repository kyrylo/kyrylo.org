// Review the real terrain and finish controller without touching player records.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const page=readFileSync(new URL('index.html',root),'utf8').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-home.js?$1"');
let controller=readFileSync(new URL('game.js',root),'utf8').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaBar=document.createElement('nav');qaBar.setAttribute('aria-label','Street review');qaBar.style.cssText='position:fixed;top:5px;left:24%;right:5px;flex-wrap:wrap;z-index:20;display:flex;gap:4px;font:11px system-ui';document.body.append(qaBar);
let qaWalking=false,qaArrival=[];
function scene(x,y){reset(true);game.feet.forEach((f,i)=>Object.assign(f,{x:x+(i?30:-30),y:y-i*20,bestY:y-i*20}));start();renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();}
for(const [label,run] of [
 ['Opening road',()=>scene(450,1050)],
 ['Gum contact',()=>{const p=game.street.patches.find(p=>p.type==='gum');scene(p.x+30,p.y-130);requestStep({x:p.x,y:p.y});}],
 ['Garage potholes',()=>{const p=game.street.patches.find(p=>p.craterKey?.startsWith('1:1:')&&p.underlay);scene(450,p.y-280);}],
 ['Manhole',()=>{const p=game.street.patches.find(p=>p.type==='metal');scene(450,p.y-110);}],
 ['Drains',()=>scene(450,game.street.districts[3].offset+1510)],
 ['Home',()=>scene(450,ROAD.finish-90)],
 ['Walk home',()=>{scene(450,ROAD.finish-90);qaWalking=true;qaArrival=[];}],
 ['Hide review controls',()=>{qaBar.style.display='none';qaReport.style.display='none';}]
]){const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:7px;border:1px solid #aaa;background:#fff;color:#333';b.onclick=run;qaBar.append(b);}
const qaReport=document.createElement('output');qaReport.id='qa-home-report';qaReport.style.cssText='position:fixed;bottom:2px;left:20%;z-index:20;background:white;color:black;font:10px monospace;max-width:70%;';document.body.append(qaReport);
function inspect(){
 if(qaWalking&&game.phase==='walking'&&game.mode==='idle')requestStep();
 if(qaWalking&&game.phase==='finished'){
   const state={phase:canvas.parentElement.dataset.phase,result:!$('result').hidden,time:$('race-time').textContent};
   if(qaArrival.at(-1)?.phase!==state.phase)qaArrival.push(state);
   if(!$('result').hidden)qaWalking=false;
 }
 qaReport.textContent=JSON.stringify({phase:game.phase,clean:condition(game),assets:renderer.assetsReady,arrival:qaArrival,pressed:[...game.pressedPatches].map(([p,amount])=>({type:p.type,amount})),cache:renderer.metrics,frameP95:canvas.dataset.frameP95});
 requestAnimationFrame(inspect);
}requestAnimationFrame(inspect);
`;
writeFileSync(new URL('_qa-home.html',out),page);writeFileSync(new URL('_qa-home.js',out),controller);
