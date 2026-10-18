import {readFileSync,writeFileSync,copyFileSync,readdirSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
for(const name of readdirSync(root))if(/\.(js|css)$/.test(name))copyFileSync(new URL(name,root),new URL(name,out));
const page=readFileSync(new URL('index.html',root),'utf8').replace(/src="\.\/game\.js\?([^\"]+)"/,'src="./_qa-terrain.js?$1"');
let controller=readFileSync(new URL('game.js',root),'utf8').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller=controller.replace('const target = game.preview, screen =',"if(qaTargets.length)canvas.dataset.qaTargets=JSON.stringify(qaTargets.map(p=>({...p,screen:renderer.screenPoint(p)})));\n    const target = game.preview, screen =");
controller+='\n'+readFileSync(new URL('_tests/stone-course.mjs',root),'utf8').replace('export function','function');
controller+=`
let qaTargets=[];
const qaBar=document.createElement('nav');qaBar.setAttribute('aria-label','Terrain previews');qaBar.style.cssText='position:fixed;bottom:4px;left:5%;right:5%;z-index:20;display:flex;gap:6px;font:11px system-ui';document.body.append(qaBar);
for(const [index,label,seed] of [[0,'Crumbling asphalt'],[1,'Garage potholes'],[2,'Exposed roadbed'],[2,'Mirrored roadbed',42],[3,'Muddy washout'],[3,'Other bank',42],[4,'Homeward bend']]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:8px;border:1px solid #999;background:#fff;color:#333';qaBar.append(b);
 b.onclick=()=>{reset(true);if(seed){game=createGame('leather',seed);if(renderer.mask)setShoeMask(game,renderer.mask);}const s=game.street.sections.find(s=>s.stage===index&&(s.ground||index===1&&s.parkingPattern==='squeeze'||index===4&&s.kind==='crown'));const p=index===1?{x:s.gap,y:s.y-150}:s.line[0];game.feet.forEach((f,i)=>{f.x=p.x+(i?30:-30);f.y=p.y-70-i*20;f.bestY=f.y;});game.blockIndex=index;
  qaTargets=index===3?stoneCourse(game).targets:[];
  if(index===0||index===2||index===4)for(let y=p.y-5;y<=s.line.at(-1).y+90;y+=65){
   let n=s.line.findIndex(p=>p.y>y);if(n<0)n=s.line.length-1;
   const a=s.line[Math.max(0,n-1)],b=s.line[n],t=a.y===b.y?0:Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y))),side=qaTargets.length%2;
   qaTargets.push({side,x:a.x+(b.x-a.x)*t+(side?30:-30),y});
  }
  start();renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaBar.hidden=true;};
}
`;
controller+=`
const qaCourse=${JSON.stringify(JSON.parse(readFileSync(new URL('_notes/designed-route-audit.json',root),'utf8')).find(r=>r.seed===321).route)};
for(const [stage,type,label] of [[0,'clay','Tracked clay'],[1,'tar','Sticky tar'],[2,'cement','Cement slurry'],[3,'algae','Algae film']]){
 const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:8px;border:1px solid #999;background:#fff;color:#333';qaBar.append(b);
 b.onclick=()=>{reset(true);game=createGame('leather',321);if(renderer.mask)setShoeMask(game,renderer.mask);
  const p=game.street.patches.find(p=>p.contaminant&&p.type===type&&p.encounter===1);
  game.phase='walking';
  for(const target of qaCourse){if(target.y>p.y-150)break;takeStep(game,target);for(let n=0;n<240&&game.mode!=='idle';n++)advance(game,1/120);}
  game.events.length=0;
  start();renderer.prepare(game,performance.now(),1,true);needsPaint=true;hud();qaBar.hidden=true;};
}
`;
writeFileSync(new URL('_qa-terrain.html',out),page);writeFileSync(new URL('_qa-terrain.js',out),controller);
