import {MATERIALS,footPoint,createSubmersionTest} from './model.js?v=light-materials-135';

const SCALE=2,MAX_BYTES=4*1024*1024,MAX_PRINTS=24;
const durations=[6,13,22];
const grain=(x,y)=>{let n=Math.imul(Math.floor(x*2),374761393)^Math.imul(Math.floor(y*2),668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
export const wetPrintFade=(age,layer)=>Math.max(0,1-Math.max(0,age)/durations[layer])**1.25;

// This is prepared once per visible print. A thin water film evaporates before
// the deeper tread grooves, while sediment stays behind as the water dries.
export function prepareFootprintPixels(g,p,tread){
  const co=Math.cos(p.angle),si=Math.sin(p.angle),sliding=Math.hypot(p.slipX||0,p.slipY||0)>1.5;
  const dragX=sliding?-(p.slipX*co-p.slipY*si)*.5:0;
  const dragY=sliding?-(-p.slipX*si-p.slipY*co)*.5:0;
  const left=-p.width/2+Math.min(0,dragX),top=-p.length/2+Math.min(0,dragY);
  const width=Math.ceil((p.width+Math.abs(dragX))*SCALE),height=Math.ceil((p.length+Math.abs(dragY))*SCALE);
  // A print can include a dragged heel and droplets outside the tread. Cull
  // once around that whole area, preserving covers and overlapping film priority.
  // On dry ground there is no need to query the road for every tread pixel.
  const localX=Math.max(Math.abs(left),Math.abs(left+width/SCALE),p.width*.7);
  const localY=Math.max(Math.abs(top),Math.abs(top+height/SCALE),p.length*.6);
  const rx=Math.abs(co)*localX+Math.abs(si)*localY,ry=Math.abs(si)*localX+Math.abs(co)*localY;
  const patches=g.street.patches.filter(q=>Math.abs(q.x-p.x)<=rx+(Math.abs(q.rx*q.cos)+Math.abs(q.ry*q.sin))*1.2&&
    Math.abs(q.y-p.y)<=ry+(Math.abs(q.rx*q.sin)+Math.abs(q.ry*q.cos))*1.2);
  const submerged=createSubmersionTest(patches);
  const layers=Array.from({length:4},()=>new Uint8ClampedArray(width*height*4)),used=[false,false,false,false];
  // Tread columns and rows repeat across the entire raster. Resolve them once,
  // instead of allocating two sample objects and rotating a point per pixel.
  const baseCols=new Int16Array(width).fill(-1),dragCols=new Int16Array(width).fill(-1);
  const baseZones=new Uint8Array(width),dragZones=new Uint8Array(width);
  for(let col=0;col<width;col++){
    const x=left+(col+.5)/SCALE,u=x/p.width+.5,dragU=(x-dragX)/p.width+.5;
    if(u>=0&&u<1){baseCols[col]=Math.floor(u*tread.width);baseZones[col]=Math.floor(u*2);}
    if(sliding&&dragU>=0&&dragU<1){dragCols[col]=Math.floor(dragU*tread.width);dragZones[col]=Math.floor(dragU*2);}
  }
  for(let row=0;row<height;row++){
   const y=top+(row+.5)/SCALE,v=y/p.length+.5,dragV=(y-dragY)/p.length+.5;
   const baseRow=v>=0&&v<1?Math.floor(v*tread.height)*tread.width:-1;
   const dragRow=sliding&&dragV>=0&&dragV<1?Math.floor(dragV*tread.height)*tread.width:-1;
   const baseZoneRow=Math.floor(v*4)*2,dragZoneRow=Math.floor(dragV*4)*2;
   for(let col=0;col<width;col++){
    const x=left+(col+.5)/SCALE;
    const base=baseRow>=0&&baseCols[col]>=0?tread.data[(baseRow+baseCols[col])*4+3]/255:0;
    const drag=dragRow>=0&&dragCols[col]>=0?tread.data[(dragRow+dragCols[col])*4+3]/255:0;
    if(!base&&!drag)continue;
    const baseZone=base?p.zones[baseZoneRow+baseZones[col]]:null,dragZone=drag?p.zones[dragZoneRow+dragZones[col]]:null;
    const wet=(base?base*baseZone.wet:0)+(drag?drag*dragZone.wet*.18:0);
    const baseDirt=base?base*baseZone.dirt:0,dragDirt=drag?drag*dragZone.dirt*.18:0;
    const dirt=baseDirt+dragDirt;if(wet<.01&&dirt<.01)continue;
    const wx=p.x+x*co-y*si,wy=p.y-x*si-y*co;
    // Sample the receiving surface, including dry covers inside water and the
    // real jagged banks. A rectangular tread zone must not float on a puddle.
    if(submerged(wx,wy))continue;
    const texture=grain(wx,wy),deposit=wet*(.8+texture*.35),at=(row*width+col)*4;
    if(wet>=.01){
      const layer=deposit<.3?0:deposit<.65?1:2,data=layers[layer];used[layer]=true;
      data[at]=31;data[at+1]=43;data[at+2]=39;data[at+3]=Math.min(1,wet)*(.76+texture*.2)*220;
    }
    if(dirt>=.01){
      const type=(baseDirt>=dragDirt?baseZone:dragZone).type,color=MATERIALS[type].color;
      const dust=(['mud','gravel','poop'].includes(type)||MATERIALS[type].earthy)?1:0,data=layers[3];used[3]=true;
      data[at]=color[0]+dust*22;data[at+1]=color[1]+dust*19;data[at+2]=color[2]+dust*14;
      data[at+3]=Math.min(1,dirt)*(.72+texture*.28)*230;
    }
   }
  }
  const water=p.zones.reduce((sum,z)=>sum+z.wet,0)/8,beads=[];
  if(water>.12)for(let n=0;n<3;n++){
    const x=(n===1?.58:-.58+n*.12)*p.width,y=(.17+n*.19)*p.length;
    const point=footPoint(p,x,-y);
    if(!submerged(point.x,point.y))beads.push({x,y,rx:1.3+n*.35,ry:1+n*.25,alpha:water*(.47-n*.07)});
  }
  return {width,height,left,top,worldWidth:width/SCALE,worldHeight:height/SCALE,layers,used,beads};
}

export function createFootprintPainter(printSprite){
  let street=null,frame=0;const sources=new Map(),cache=new Map();
  const metrics={cacheBytes:0,prepared:0};
  function prepare(g,p){
    if(!sources.has(p.side)){
      const c=document.createElement('canvas');c.width=48;c.height=112;
      const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(printSprite('wet',p.side),0,0,48,112);
      sources.set(p.side,ctx.getImageData(0,0,48,112));
    }
    const pixels=prepareFootprintPixels(g,p,sources.get(p.side));
    const sprites=pixels.layers.map((data,i)=>{
      if(!pixels.used[i])return null;
      const c=document.createElement('canvas');c.width=pixels.width;c.height=pixels.height;
      c.getContext('2d').putImageData(new ImageData(data,pixels.width,pixels.height),0,0);return c;
    });
    const {layers,used,...geometry}=pixels;
    const entry={...geometry,sprites,bytes:sprites.filter(Boolean).length*pixels.width*pixels.height*4};
    cache.set(p,entry);metrics.cacheBytes+=entry.bytes;metrics.prepared++;
    return entry;
  }
  function paint(c,g,screenY,height){
    if(street!==g.street){street=g.street;cache.clear();metrics.cacheBytes=0;metrics.prepared=0;}
    frame++;
    for(const p of g.prints){
      const y=screenY(p.y);if(y< -100||y>height+100)continue;
      const age=g.time-p.born,entry=cache.get(p)||prepare(g,p);
      entry.frame=frame;
      c.save();c.translate(p.x,y);c.rotate(p.angle);
      const draw=(layer,alpha)=>{
        if(!entry.sprites[layer]||alpha<.005)return;
        c.globalAlpha=alpha;c.drawImage(entry.sprites[layer],entry.left,entry.top,entry.worldWidth,entry.worldHeight);
      };
      draw(3,Math.max(0,1-age/90)**.6);
      for(let layer=0;layer<3;layer++)draw(layer,wetPrintFade(age,layer));
      for(const bead of entry.beads){
        const fade=wetPrintFade(age,1);if(fade<.005)break;
        c.globalAlpha=bead.alpha*fade;c.fillStyle='#26352e';c.beginPath();c.ellipse(bead.x,bead.y,bead.rx,bead.ry,0,0,Math.PI*2);c.fill();
      }
      c.restore();
    }
    // Keep visible tracks pinned, including a player repeatedly stepping in one
    // small area. Evicting them at a fixed byte limit would rebake every frame.
    // The model caps live prints at 90; offscreen history has a smaller budget.
    for(const [p,entry] of cache)if(g.time-p.born>=p.life||
      (entry.frame!==frame&&(cache.size>MAX_PRINTS||metrics.cacheBytes>MAX_BYTES))){
      cache.delete(p);metrics.cacheBytes-=entry.bytes;
    }
  }
  return {paint,metrics};
}
