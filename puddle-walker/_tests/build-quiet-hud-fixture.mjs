// Real game renderer/controller, frozen immediately after contact. No player records.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller="import {surfaceAt} from './model.js?v=quiet-76';\n"+controller;
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};let qaFrozen=false,qaTime=0;\nconst $ =");
controller=controller.replace('createRaceClock(() => performance.now())','createRaceClock(() => qaTime)');
controller=controller.replace('const t = performance.now(); advance(game, dt);','const t = performance.now(); if(!qaFrozen)advance(game, dt);');
controller+=`
const qaBar=document.createElement('nav');qaBar.style.cssText='position:fixed;bottom:10px;right:10px;z-index:30;display:flex;gap:5px';document.body.append(qaBar);
const qaReport=document.createElement('pre');qaReport.id='qa-report';qaReport.hidden=true;document.body.append(qaReport);
for(const label of ['Toe graze','Full step','Finish walk','Hide controls']){
 const button=document.createElement('button');button.textContent=label;button.style.cssText='padding:10px;background:#fff;color:#222';qaBar.append(button);
 button.onclick=()=>{
  if(label==='Hide controls'){qaBar.hidden=true;return;}
  if(label==='Finish walk'){
   qaFrozen=true;clearInput();
   for(let i=0;i<120&&game.mode!=='idle';i++)advance(game,1/120);
   game.feet.forEach((f,i)=>Object.assign(f,{x:420+i*60,y:ROAD.finish-80-i*20,bestY:ROAD.finish-80-i*20}));
   game.preview=null;game.events.length=0;qaTime=58420;
   for(let n=0;n<5&&game.phase!=='finished';n++){
    suggestStep(game);takeStep(game);for(let i=0;i<100&&game.mode!=='idle'&&game.phase!=='finished';i++)advance(game,1/120);
   }
   if(game.phase!=='finished')throw new Error('Fixture did not cross the finish');
   game.events.length=0;finish();renderer.prepare(game,performance.now(),1,true);needsPaint=true;
   qaReport.textContent=JSON.stringify({phase:game.phase,clean:condition(game),time:race.elapsed(),seed:game.street.seed,assets:renderer.assetsReady});return;
  }
  qaFrozen=true;qaTime=0;reset(true);const p=game.street.patches.find(p=>p.id===15);
  let y=p.y;
  if(label==='Toe graze'){y=p.y-p.ry*1.2;while(surfaceAt(game,p.x,y).depth<1&&y<p.y)y+=.25;y-=17;}
  game.feet.forEach((f,i)=>Object.assign(f,{x:p.x+i*60,y:y-140-i*20,bestY:y-140-i*20}));
  game.steps=8;start();inputMode='keyboard';game.preview=null;
  const accepted=takeStep(game,{x:p.x,y});
  for(let i=0;i<120&&game.mode==='flight';i++)advance(game,1/120);
  const landing={x:game.feet[0].x,y:game.feet[0].y,centre:surfaceAt(game,game.feet[0].x,game.feet[0].y).type};
  for(let i=0;i<(label==='Full step'?32:8);i++)advance(game,1/120);
  game.events.length=0;qaTime=24350;renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();
  qaReport.textContent=JSON.stringify({label,accepted,landing,rings:game.rings.map(r=>({x:r.x,y:r.y,rx:r.rx,ry:r.ry,strength:r.strength,type:r.patch.type})),particles:game.particles.length,clean:condition(game),assets:renderer.assetsReady});
 };
}
`;
write('_qa-quiet.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-quiet.js?v=76"'));
write('_qa-quiet.js',controller);
