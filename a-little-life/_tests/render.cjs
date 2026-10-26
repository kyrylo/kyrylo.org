/* Run with @napi-rs/canvas available through NODE_PATH. Writes QA images only. */
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('node:assert/strict');
const{createCanvas,GlobalFonts,Path2D}=require('@napi-rs/canvas');global.Path2D=Path2D;
for(const font of ['Georgia.ttf','Georgia Italic.ttf']){const p='/System/Library/Fonts/Supplemental/'+font;if(fs.existsSync(p))GlobalFonts.registerFromPath(p,'Georgia');}
const app=require('../drawing.js'),G=require('../geometry.js');app.setCanvasFactory(createCanvas);
const out=process.argv[2]||path.join(os.tmpdir(),'little-life-structure');fs.mkdirSync(out,{recursive:true});
const evidence={frames:[],figures:[],pairs:[]};
function components(canvas){const w=canvas.width,h=canvas.height,pixels=canvas.getContext('2d').getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h),groups=[];let total=0;
 for(let i=0;i<w*h;i++){if(seen[i]||pixels[i*4+3]<32)continue;let head=0,tail=1;queue[0]=i;seen[i]=1;
  while(head<tail){const n=queue[head++],x=n%w,y=Math.floor(n/w);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const xx=x+dx,yy=y+dy,k=yy*w+xx;if(xx<0||xx>=w||yy<0||yy>=h||seen[k]||pixels[k*4+3]<32)continue;seen[k]=1;queue[tail++]=k;}}
  groups.push(tail);total+=tail;
 }groups.sort((a,b)=>b-a);return{total,largest:groups[0]||0,other:groups.slice(1),fraction:(groups[0]||0)/(total||1)};
}
const sheet=createCanvas(1800,650),sc=sheet.getContext('2d');sc.fillStyle='#f5f2eb';sc.fillRect(0,0,1800,650);sc.fillStyle='#454841';sc.font='16px Georgia';
for(let row=0;row<2;row++)for(let i=0;i<app.inspect.people.length;i++){
 const p=app.inspect.people[i],s=app.inspect.states(1176,580,Math.max(0,p.start+4)).find(s=>s.p.id===p.id)||app.inspect.state(p);
 Object.assign(s,{x:0,y:0,scale:1,young:row,alpha:1,ageing:0,elderly:0});s.rig=G.pose({young:row,kind:p.kind,phase:1.6});
 const cv=createCanvas(280,390),x=cv.getContext('2d');x.translate(140,350);x.scale(2,2);app.inspect.renderFigure(x,s,{},true);
 const cmp=components(cv);assert(cmp.fraction>.997,`${p.id}/${row} has detached construction pieces ${JSON.stringify(cmp)}`);evidence.figures.push({id:p.id,young:row,connected:cmp.fraction});
 sc.drawImage(cv,i*200,30+row*320,200,390*200/280);sc.fillText(p.name,i*200+12,20+row*320);
}
fs.writeFileSync(path.join(out,'construction.png'),sheet.toBuffer('image/png'));
for(const t of [3,39.5,48,74]){
 const states=Object.fromEntries(app.inspect.states(1176,580,t).map(s=>[s.p.id,s]));const ids=t<10?['mom','me']:t>70?['child','little']:['me','child'];const a=states[ids[0]],b=states[ids[1]],grip=G.grip(a,b);assert(grip);
 const cv=createCanvas(900,850),x=cv.getContext('2d');const offset=a.x-55,top=a.y-180*a.scale;
 for(const[s,key,hand]of[[a,'right',grip.a],[b,'left',grip.b]]){x.save();x.translate((s.x-offset)*4,(s.y-top)*4);x.scale(s.scale*4,s.scale*4);app.inspect.renderFigure(x,s,{[key]:{...hand,amount:1}});x.restore();}
 const cmp=components(cv);assert(cmp.fraction>.997,`Grip disconnected at ${t}: ${JSON.stringify(cmp)}`);evidence.pairs.push({t,connected:cmp.fraction});fs.writeFileSync(path.join(out,`grip-${t}.png`),cv.toBuffer('image/png'));
}
for(const[w,h,dpr]of[[292,420,2],[347,420,2],[704,430,1],[1176,580,2]]){
 const cv=createCanvas(w*dpr,h*dpr),x=cv.getContext('2d');x.scale(dpr,dpr);
 const contact=createCanvas(4*w,4*h),cx=contact.getContext('2d');
 const times=[0,3,7.5,13,15,29.5,37.8,39.5,44,48,53,56,61,67.5,70.5,74];
 for(const[tIndex,t]of times.entries()){
  app.draw(x,w,h,t);assert.equal(x.globalAlpha,1);const p=x.getImageData(0,0,w*dpr,h*dpr).data;
  for(let y=0;y<h*dpr;y++)for(const xx of [0,1,w*dpr-2,w*dpr-1])assert.equal(p[(y*w*dpr+xx)*4+3],0,'Visible canvas edge');
  const column=tIndex%4,row=Math.floor(tIndex/4);cx.save();cx.translate(column*w,row*h);app.paintPaper(cx,w,h,t);cx.drawImage(cv,0,0,w,h);cx.restore();
 }
 app.draw(x,w,h,39.5);const first=cv.toBuffer('image/png');app.draw(x,w,h,74);app.draw(x,w,h,39.5);assert(first.equals(cv.toBuffer('image/png')),'Non-deterministic seek');
 evidence.frames.push({w,h,dpr,frames:times.length,deterministic:true});fs.writeFileSync(path.join(out,`contact-${w}.png`),contact.toBuffer('image/png'));
}
const props=createCanvas(1320,500),px=props.getContext('2d');px.fillStyle='#f5f2eb';px.fillRect(0,0,1320,500);
for(const[name,i]of[['house',0],['bridge',1],['bench',2]]){const a=app.inspect.assets()[name];px.drawImage(a.el,20+i*440,40,Math.min(410,a.w*2.5),a.h*2.5);}
fs.writeFileSync(path.join(out,'props.png'),props.toBuffer('image/png'));
// Stable artwork caches must stay bounded through growth, seeking and resizing,
// and clearing them must not change the frame that is subsequently rendered.
const check=createCanvas(694,840),checkContext=check.getContext('2d');checkContext.scale(2,2);
app.draw(checkContext,347,420,74.5);const cachedFrame=check.toBuffer('image/png');
evidence.caches=app.cacheStats;assert(evidence.caches.heads>0&&evidence.caches.heads<=36);assert(evidence.caches.hatches>0&&evidence.caches.hatches<=32);
app.invalidate();for(const key of ['heads','hatches','labels'])assert.equal(app.cacheStats[key],0,`${key} survived invalidation`);
app.draw(checkContext,347,420,74.5);assert(cachedFrame.equals(check.toBuffer('image/png')),'Cache rebuild changed the artwork');
app.setCanvasFactory(createCanvas);for(const key of ['heads','hatches','labels'])assert.equal(app.cacheStats[key],0,`${key} survived a canvas factory change`);
fs.writeFileSync(path.join(out,'render-results.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
