import { MATERIALS, GRID, clamp } from './model.js?v=perf-61';

// A stable material field at sprite resolution. Grain does not crawl when the
// foot flexes; only moisture and the amount of physically deposited material change.
const W=96,H=224,names=Object.keys(MATERIALS);
const smooth=t=>t*t*(3-2*t);
const hash=(x,y,seed)=>{const n=Math.sin(x*127.1+y*311.7+seed*74.7)*43758.5453;return n-Math.floor(n);};
// Each field samples the same lattice many times. Hash its corners once.
function noiseField(scaleX,scaleY,seed){
 const width=Math.ceil(W/scaleX)+1,height=Math.ceil(H/scaleY)+1,values=new Float64Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)values[y*width+x]=hash(x,y,seed);
 return (px,py)=>{
  const x=px/scaleX,y=py/scaleY,ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy),i=iy*width+ix;
  return (values[i]*(1-u)+values[i+1]*u)*(1-v)+(values[i+width]*(1-u)+values[i+width+1]*u)*v;
 };
}
// The physics grid and sprite size never change. Reuse their interpolation map.
const sampleMap=Array.from({length:W*H},(_,p)=>{
 const x=clamp((p%W+.5)/4-.5,0,GRID.width-1),y=clamp((Math.floor(p/W)+.5)/4-.5,0,GRID.height-1);
 const ix=Math.floor(x),iy=Math.floor(y);
 return {i:iy*GRID.width+ix,j:Math.min(iy+1,GRID.height-1)*GRID.width+ix,dx:ix<GRID.width-1?1:0,u:x-ix,v:y-iy,cell:Math.round(y)*GRID.width+Math.round(x)};
});
function sample(a,p){
 const {i,j,dx,u,v}=sampleMap[p];
 return (a[i]*(1-u)+a[i+dx]*u)*(1-v)+(a[j]*(1-u)+a[j+dx]*u)*v;
}
export function createShoeWear(terrain,cleanSprites){
 const layer=document.createElement('canvas');layer.width=W;layer.height=H;
 const c=layer.getContext('2d'),film=c.createImageData(W,H),body=c.createImageData(W,H),relief=new Float32Array(W*H);
 const photo=document.createElement('canvas');photo.width=W;photo.height=H;
 const pc=photo.getContext('2d',{willReadFrequently:true});
 if(terrain)pc.drawImage(terrain,terrain.width*.7,0,terrain.width*.25,terrain.height*.5,0,0,W,H);
 const earth=terrain?pc.getImageData(0,0,W,H).data:null;
 const fields=[0,1].map(side=>{
  const broad=noiseField(8,11,side+5),small=noiseField(3.1,4.3,side+9),detail=noiseField(2.1,2.7,side+17);
  const coarse=new Float32Array(W*H),fine=new Float32Array(W*H),grain=new Float32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x;coarse[i]=broad(x,y)*.68+small(x,y)*.32;
   fine[i]=detail(x,y);grain[i]=hash(x,y,side+23);
  }
  // Recover shallow seams and creases from this exact sneaker photograph.
  // A low spot gathers pigment only if the surrounding shoe actually got dirty.
  const pixels=cleanSprites[side].getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  const cavity=new Float32Array(W*H),luma=new Float32Array(W*H);
  for(let i=0;i<luma.length;i++)luma[i]=(pixels[i*4]+pixels[i*4+1]+pixels[i*4+2])/3;
  for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){
   const i=y*W+x;if(pixels[i*4+3]<200||luma[i]<115)continue;
   const surrounding=(luma[i-2]+luma[i+2]+luma[i-W*2]+luma[i+W*2]+luma[i-W-1]+luma[i+W+1])/6;
   cavity[i]=clamp((surrounding-luma[i]-2)/27,0,1);
  }
  return {coarse,fine,grain,cavity};
 });
 const rowLeft=new Int16Array(GRID.height),rowRight=new Int16Array(GRID.height);
 const pixelLeft=new Int16Array(H),pixelRight=new Int16Array(H);
 return function paint(target,f){
  if(!f.spatter.length&&!f.stain.some(amount=>amount>=.003))return;
  const {coarse,fine,grain,cavity}=fields[f.side],fd=film.data,bd=body.data;
  fd.fill(0);bd.fill(0);relief.fill(0);
  // Most real stains occupy a small rim or toe. Only visit sprite columns
  // that can interpolate a visible stained cell; retain the exact same pixels.
  rowLeft.fill(GRID.width);rowRight.fill(-1);
  for(let i=0;i<f.stain.length;i++)if(f.stain[i]>=.003){
   const row=Math.floor(i/GRID.width),col=i%GRID.width;
   rowLeft[row]=Math.min(rowLeft[row],col);rowRight[row]=Math.max(rowRight[row],col);
  }
  for(let y=0;y<H;y++){
   const map=sampleMap[y*W],a=Math.floor(map.i/GRID.width),b=Math.floor(map.j/GRID.width);
   pixelLeft[y]=Math.max(0,Math.min(rowLeft[a],rowLeft[b])*4-3);
   pixelRight[y]=Math.min(W-1,Math.max(rowRight[a],rowRight[b])*4+6);
  }
  for(let y=0;y<H;y++)for(let x=pixelLeft[y];x<=pixelRight[y];x++){
   const p=y*W+x,k=p*4;
   const amount=sample(f.stain,p);if(amount<.003)continue;
   let cell=sampleMap[p].cell;
   // Interpolated edge coverage must inherit a dirty neighbour's pigment,
   // rather than uninitialised black from just beyond the contact mask.
   if(f.stain[cell]<amount*.25){for(const n of [cell-1,cell+1,cell-GRID.width,cell+GRID.width])if(n>=0&&n<f.stain.length&&f.stain[n]>f.stain[cell])cell=n;}
   const wet=sample(f.wetness,p),mass=sample(f.deposits,p);
   for(let channel=0;channel<3;channel++){
    const pigment=f.tint[cell*3+channel];
    fd[k+channel]=clamp(pigment+(1-wet)*14-wet*16+(grain[p]-.5)*13,0,255);
   }
   // Diffuse absorbed pigment, with pores showing through the film.
   fd[k+3]=Math.min(220,amount*205*(.65+fine[p]*.35+cavity[p]*.7)*(1+wet*.15));
   if(mass<.009)continue;
   // Water and oil have no raised deposits. Deforming and shading clay for
   // every wet pixel was expensive work whose result was immediately discarded.
   const type=names[f.depositTypes[cell]],color=MATERIALS[type].color;
   const tx=f.smearX[cell],ty=f.smearY[cell],stretch=Math.hypot(tx,ty),sx=clamp(Math.round(x-tx*5),0,W-1),sy=clamp(Math.round(y-ty*5),0,H-1);
   const cluster=coarse[p]*(1-stretch*.35)+coarse[sy*W+sx]*stretch*.35;
   const gum=type==='gum',grit=type==='gravel',threshold=.7-Math.min(.45,mass*.7);
   const broken=clamp((cluster-threshold+.1+cavity[p]*mass*.18)/.24,0,1),coverage=smooth(broken)*clamp(mass*5,0,1);
   const density=grit?coverage*(grain[p]>.68?1:.12):coverage;
   const moisture=gum?.45:wet,dry=1-moisture;
   for(let channel=0;channel<3;channel++){
    const photographed=earth&&['mud','poop','gravel'].includes(type)?(earth[k+channel]-90)*.55:0;
    bd[k+channel]=clamp(color[channel]+dry*22-moisture*23+photographed+(fine[p]-.5)*(gum?8:18)+(grain[p]-.5)*10-cavity[p]*12,0,255);
   }
   // Connected, torn-edged clay deposits instead of a regular necklace of dots.
   bd[k+3]=density*(grit?190:145+mass*100);
   relief[p]=density*mass*(.55+fine[p]*.45);
  }
  for(let y=1;y<H-1;y++)for(let x=Math.max(1,pixelLeft[y]);x<=Math.min(W-2,pixelRight[y]);x++){
   const p=y*W+x,k=p*4;if(!bd[k+3])continue;
   const wet=sample(f.wetness,p);
   const slope=(relief[p-1]-relief[p+1])*.65+(relief[p-W]-relief[p+W]);
   const shadow=clamp(slope*85,-28,26),glint=Math.max(0,slope-.06)*wet*105;
   const cell=sampleMap[p].cell,clay=['mud','poop'].includes(names[f.depositTypes[cell]]);
   const cracked=clay&&wet<.18&&relief[p]>.13&&Math.abs(fine[p]-.5)<.021;
   for(let channel=0;channel<3;channel++)bd[k+channel]=clamp(bd[k+channel]+shadow+glint-(cracked?23:0),0,255);
  }
  c.putImageData(film,0,0);target.globalCompositeOperation='multiply';target.drawImage(layer,0,0);target.globalCompositeOperation='source-over';
  c.putImageData(body,0,0);target.drawImage(layer,0,0);
  for(const spot of f.spatter){
   const x=spot.u*W,y=spot.v*H,r=Math.max(.24,spot.r*W),wet=f.wetness[spot.cell],color=MATERIALS[spot.type].color;
   target.globalCompositeOperation='multiply';
   target.fillStyle=`rgba(${color.map(v=>Math.round(v+12*(1-wet))).join(',')},${spot.type==='water'?.22:.58})`;
   target.beginPath();target.ellipse(x,y,r,r*.8,spot.u*11,0,Math.PI*2);target.fill();
   if(spot.type==='mud'&&r>.55){target.fillStyle='rgba(47,36,23,.28)';target.fillRect(x-r*.25,y-r*.15,.35,.35);}
   target.globalCompositeOperation='source-over';
  }
  // Sparse reflections follow the wet film. Oil retains a low sheen after water dries.
  for(let i=0;i<f.stain.length;i++){
   if(f.stain[i]<.015)continue;const wet=f.wetness[i],oil=f.tint[i*3]<55&&f.tint[i*3+2]>f.tint[i*3]*.85;
   if((wet>.18||oil)&&hash(i,3,f.side)>.8){
    const x=(i%GRID.width+.5)*4,y=(Math.floor(i/GRID.width)+.5)*4;
    target.strokeStyle=`rgba(217,225,213,${Math.min(.22,oil?f.stain[i]*.2:wet*.15)})`;target.lineWidth=.5;
    target.beginPath();target.moveTo(x-.8,y);target.lineTo(x+1.1,y-.4);target.stroke();
   }
  }
 };
}
