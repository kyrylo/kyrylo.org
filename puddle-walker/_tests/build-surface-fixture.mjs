import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,out),s);
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaBar=document.createElement('nav');qaBar.style.cssText='position:fixed;bottom:5px;left:180px;z-index:20;display:flex;gap:8px';document.body.append(qaBar);
const qaReport=document.createElement('pre');qaReport.id='qa-report';qaReport.hidden=true;document.body.append(qaReport);
let qaBoat=null,qaRoute=[],qaIndex=0;
for(const label of ['Approach paper boat','Step on boat','Step off boat','Hide controls']){
 const button=document.createElement('button');button.textContent=label;button.style.cssText='background:#fff;color:#222;padding:10px';qaBar.append(button);
 button.onclick=()=>{
  if(label==='Hide controls'){qaBar.hidden=true;return;}
  if(label==='Approach paper boat'){
   reset(true);renderer.prepare(game,performance.now(),1,true);qaBoat=renderer.sceneState().boats[0];
   game.feet.forEach((f,i)=>Object.assign(f,{x:qaBoat.x+i*60,y:qaBoat.y-130-i*20,bestY:qaBoat.y-130-i*20}));
   start();inputMode='keyboard';renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();
  }else if(qaBoat){
   qaRoute=label==='Step on boat'?[{x:qaBoat.x,y:qaBoat.y}]:[{x:qaBoat.x+60,y:qaBoat.y+65},{x:qaBoat.x,y:qaBoat.y+115}];qaIndex=0;
  }
 };
}
function qaTick(){
 if(qaIndex<qaRoute.length&&game.mode==='idle')requestStep(qaRoute[qaIndex++]);
 qaReport.textContent=JSON.stringify({phase:game.phase,mode:game.mode,steps:game.steps,boats:renderer.sceneState()?.boats,marks:game.groundContacts.map(m=>({kind:m.kind,zones:m.zones,slipX:m.slipX,slipY:m.slipY})),prints:game.prints.length,clean:condition(game),assets:renderer.assetsReady});
 requestAnimationFrame(qaTick);
}requestAnimationFrame(qaTick);
`;
write('_qa-surfaces.html',read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-surfaces.js?v=66"'));
write('_qa-surfaces.js',controller);
write('_qa-surface-gallery.html',read('_tests/surface-gallery.html'));
