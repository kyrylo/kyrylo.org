import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),output=new URL('../../_site/puddle-walker/',import.meta.url);
const page=readFileSync(new URL('index.html',root),'utf8').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-neighborhood.js?$1"');
let controller=readFileSync(new URL('game.js',root),'utf8').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaBar=document.createElement('nav');qaBar.setAttribute('aria-label','Section previews');qaBar.style.cssText='position:fixed;bottom:4px;left:5%;right:5%;z-index:20;display:flex;gap:6px;flex-wrap:wrap;font:11px system-ui';document.body.append(qaBar);
for(const [index,label,local] of [[0,'No. 12',560],[1,'Jo’s garage',560],[1,'Garage inlet',2490],[2,'The repair crew',560],[3,'The low corner',560],[4,'Home again',560],[0,'Residential verge',1000],[0,'Pavement fittings',1330],[0,'Front gate',1740],[0,'Street entrance',20],[0,'Garage boundary',3970],[1,'Works boundary',3970],[2,'Low corner boundary',3970],[3,'Home boundary',3970],[4,'Home doorstep',3910]]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:8px;border:1px solid #999;background:#fff;color:#333';qaBar.append(b);
 b.onclick=()=>{reset(true);const d=game.street.districts[index];game.feet.forEach((f,i)=>{f.x=420+i*60;f.y=d.offset+local-i*20;f.bestY=f.y;});game.blockIndex=index;start();renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaBar.hidden=true;};
}
`;
writeFileSync(new URL('_qa-neighborhood.html',output),page);writeFileSync(new URL('_qa-neighborhood.js',output),controller);
