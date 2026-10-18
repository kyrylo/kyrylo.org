// Isolated visual preview of roadside scenes; never touches player records.
import {readFileSync,writeFileSync,copyFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
for(const name of readdirSync(root))if(/\.(js|css)$/.test(name))copyFileSync(new URL(name,root),new URL(name,out));
copyFileSync(new URL('assets/everyday-details.webp',root),new URL('assets/everyday-details.webp',out));
const read=p=>readFileSync(new URL(p,root),'utf8');
const route=JSON.parse(read('_notes/designed-route-audit.json')).find(r=>r.seed===321).route;
const page=read('index.html').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-everyday.js?$1"');
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaBar=document.createElement('nav');qaBar.setAttribute('aria-label','Everyday details');qaBar.style.cssText='position:fixed;bottom:4px;left:5%;right:5%;z-index:20;display:flex;gap:6px;flex-wrap:wrap;font:11px system-ui';document.body.append(qaBar);
const qaRoute=${JSON.stringify(route)};
for(const [stage,y,label] of [[0,2280,'Garden hose'],[1,1660,'Oily tyre tracks'],[2,2600,'Muddy bootprints'],[1,1500,'Spare parts'],[2,2480,'Work gloves'],[3,2650,'Sandbags'],[4,1350,'Milk bottles'],[4,2970,'Newspaper'],[4,1980,'Spilled planter'],[4,2620,'Bin runoff']]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:8px;border:1px solid #999;background:#fff;color:#333';qaBar.append(b);
 b.onclick=()=>{reset(true);const d=game.street.districts[stage],n=qaRoute.reduce((best,p,i)=>i&&Math.abs((p.y+qaRoute[i-1].y)/2-(d.offset+y-180))<Math.abs((qaRoute[best].y+qaRoute[best-1].y)/2-(d.offset+y-180))?i:best,1);for(let i=n-1;i<=n;i++){const f=game.feet[i%2],p=qaRoute[i];Object.assign(f,{x:p.x,y:p.y,bestY:p.y});}game.active=(n+1)%2;game.blockIndex=stage;start();renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaBar.hidden=true;};
}
`;
writeFileSync(new URL('_qa-everyday.html',out),page);writeFileSync(new URL('_qa-everyday.js',out),controller);
