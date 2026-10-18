import { MATERIALS, GRID, clamp } from './model.js?v=light-materials-135';

// A stable material field at sprite resolution. Grain does not crawl when the
// foot flexes; only moisture and the amount of physically deposited material change.
const W=96,H=224,names=Object.keys(MATERIALS);
const materials=names.map(type=>({color:MATERIALS[type].color,gum:type==='gum'||type==='tar',grit:type==='gravel',
 photographed:['mud','poop','gravel'].includes(type)||MATERIALS[type].earthy,clay:['mud','poop','clay','cement'].includes(type)}));
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
// Bilinear sampling is separable. Each physics row supplies four sprite rows;
// compute its horizontal interpolation once, preserving double precision and
// the original arithmetic order. Small axis tables replace per-pixel objects.
const sampleX=Array.from({length:W},(_,p)=>{
 const x=clamp((p+.5)/4-.5,0,GRID.width-1),i=Math.floor(x);
 return {i,dx:i<GRID.width-1?1:0,u:x-i,cell:Math.round(x)};
});
const sampleY=Array.from({length:H},(_,p)=>{
 const y=clamp((p+.5)/4-.5,0,GRID.height-1),i=Math.floor(y);
 return {i,j:Math.min(i+1,GRID.height-1),v:y-i,cell:Math.round(y)*GRID.width};
});
const nearestCell=Uint16Array.from({length:W*H},(_,p)=>sampleY[Math.floor(p/W)].cell+sampleX[p%W].cell);
export function createShoeWear(...args){
 const steps=createShoeWearSteps(...args);let result;
 do{result=steps.next();}while(!result.done);
 return result.value;
}
export function* createShoeWearSteps(terrain,cleanSprites){
 const layer=document.createElement('canvas');layer.width=W;layer.height=H;
 const c=layer.getContext('2d'),film=c.createImageData(W,H),body=c.createImageData(W,H),relief=new Float32Array(W*H);
 const photo=document.createElement('canvas');photo.width=W;photo.height=H;
 const pc=photo.getContext('2d',{willReadFrequently:true});
 if(terrain)pc.drawImage(terrain,terrain.width*.7,0,terrain.width*.25,terrain.height*.5,0,0,W,H);
 const earth=terrain?pc.getImageData(0,0,W,H).data:null;
 const fields=[];
 for(const side of [0,1]){
  const broad=noiseField(8,11,side+5),small=noiseField(3.1,4.3,side+9),detail=noiseField(2.1,2.7,side+17);
  const coarse=new Float32Array(W*H),fine=new Float32Array(W*H),grain=new Float32Array(W*H);
  for(let y=0;y<H;y++){
   for(let x=0;x<W;x++){
   const i=y*W+x;coarse[i]=broad(x,y)*.68+small(x,y)*.32;
   fine[i]=detail(x,y);grain[i]=hash(x,y,side+23);
   }
   if(y%16===15)yield;
  }
  // Recover shallow seams and creases from this exact sneaker photograph.
  // A low spot gathers pigment only if the surrounding shoe actually got dirty.
  const pixels=cleanSprites[side].getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
  // The final upper is clipped to this photograph. Do not shade transparent
  // margins; keep a one-pixel halo for the neighbouring clay-relief samples.
  const left=new Int16Array(H).fill(W),right=new Int16Array(H).fill(-1);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(pixels[(y*W+x)*4+3]){
   for(let row=Math.max(0,y-1);row<=Math.min(H-1,y+1);row++){
    left[row]=Math.min(left[row],Math.max(0,x-1));right[row]=Math.max(right[row],Math.min(W-1,x+1));
   }
  }
  const glints=new Uint8Array(GRID.width*GRID.height);
  for(let i=0;i<glints.length;i++)glints[i]=hash(i,3,side)>.8;
  const cavity=new Float32Array(W*H),luma=new Float32Array(W*H);
  for(let i=0;i<luma.length;i++)luma[i]=(pixels[i*4]+pixels[i*4+1]+pixels[i*4+2])/3;
  for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){
   const i=y*W+x;if(pixels[i*4+3]<200||luma[i]<115)continue;
   const surrounding=(luma[i-2]+luma[i+2]+luma[i-W*2]+luma[i+W*2]+luma[i-W-1]+luma[i+W+1])/6;
   cavity[i]=clamp((surrounding-luma[i]-2)/27,0,1);
  }
  // These depend only on the photograph and fixed grain, never shoe condition.
  const inkGrain=new Float64Array(W*H),dampGrain=new Float64Array(W*H),pigmentGrain=new Float64Array(W*H);
  for(let p=0;p<W*H;p++){inkGrain[p]=.65+fine[p]*.35+cavity[p]*.7;dampGrain[p]=.8+fine[p]*.2+cavity[p]*.35;pigmentGrain[p]=(grain[p]-.5)*13;}
  fields.push({coarse,fine,grain,cavity,inkGrain,dampGrain,pigmentGrain,left,right,glints});
  yield;
 }
 const rowLeft=new Int16Array(GRID.height),rowRight=new Int16Array(GRID.height);
 const pixelLeft=new Int16Array(H),pixelRight=new Int16Array(H);
 const neededLeft=new Int16Array(GRID.height),neededRight=new Int16Array(GRID.height);
 const stainRows=new Float64Array(GRID.height*W),wetRows=new Float64Array(GRID.height*W),massRows=new Float64Array(GRID.height*W);
 const neighbours=new Int16Array(GRID.width*GRID.height),stretchByCell=new Float64Array(GRID.width*GRID.height),pixelWet=new Float64Array(W*H);
 const smearX=new Int16Array(GRID.width*GRID.height),smearY=new Int16Array(GRID.width*GRID.height);
 return function paint(target,f){
  if(!f.spatter.length&&!f.stain.some(amount=>amount>=.003)&&!f.wetness.some(amount=>amount>=.03))return;
  const {coarse,fine,grain,cavity,inkGrain,dampGrain,pigmentGrain,left,right,glints}=fields[f.side],fd=film.data,bd=body.data;
  // Rinsed leather and water have no raised material. Bilinear interpolation
  // cannot exceed its largest input, so skip the entire deposit preparation
  // when no cell can reach the shader's existing visibility threshold.
  const deposits=f.deposits.some(mass=>mass>=.009);
  let hasFilm=false,hasBody=false;
  fd.fill(0);if(deposits){bd.fill(0);relief.fill(0);}
  // Most real stains occupy a small rim or toe. Only visit sprite columns
  // that can interpolate a visible stained cell; retain the exact same pixels.
  rowLeft.fill(GRID.width);rowRight.fill(-1);
  for(let i=0;i<f.stain.length;i++)if(f.stain[i]>=.003||f.wetness[i]>=.03){
   const row=Math.floor(i/GRID.width),col=i%GRID.width;
   rowLeft[row]=Math.min(rowLeft[row],col);rowRight[row]=Math.max(rowRight[row],col);
  }
  neededLeft.fill(W);neededRight.fill(-1);
  for(let y=0;y<H;y++){
   const {i:a,j:b}=sampleY[y];
   pixelLeft[y]=Math.max(left[y],Math.min(rowLeft[a],rowLeft[b])*4-3);
   pixelRight[y]=Math.min(right[y],Math.max(rowRight[a],rowRight[b])*4+6);
   if(pixelLeft[y]>pixelRight[y])continue;
   neededLeft[a]=Math.min(neededLeft[a],pixelLeft[y]);neededLeft[b]=Math.min(neededLeft[b],pixelLeft[y]);
   neededRight[a]=Math.max(neededRight[a],pixelRight[y]);neededRight[b]=Math.max(neededRight[b],pixelRight[y]);
  }
  for(let y=0;y<GRID.height;y++)for(let x=neededLeft[y];x<=neededRight[y];x++){
   const {i,dx,u}=sampleX[x],a=y*GRID.width+i,b=a+dx,p=y*W+x,weight=1-u;
   stainRows[p]=f.stain[a]*weight+f.stain[b]*u;
   wetRows[p]=f.wetness[a]*weight+f.wetness[b]*u;
   if(deposits)massRows[p]=f.deposits[a]*weight+f.deposits[b]*u;
  }
  // Resolve pigment neighbours and smear lengths once per physics cell, rather
  // than allocating and searching the same neighbours for every sprite pixel.
  for(let cell=0;cell<f.stain.length;cell++){
   let best=cell;
   if(cell>0&&f.stain[cell-1]>f.stain[best])best=cell-1;
   if(cell+1<f.stain.length&&f.stain[cell+1]>f.stain[best])best=cell+1;
   if(cell>=GRID.width&&f.stain[cell-GRID.width]>f.stain[best])best=cell-GRID.width;
   if(cell+GRID.width<f.stain.length&&f.stain[cell+GRID.width]>f.stain[best])best=cell+GRID.width;
   neighbours[cell]=best;
   if(deposits){
    stretchByCell[cell]=Math.hypot(f.smearX[cell],f.smearY[cell]);
    // Smear coordinates are bounded Float32 values. Round their offset once
    // instead of repeating the same rounding at every integer sprite pixel.
    smearX[cell]=Math.round(-f.smearX[cell]*5);smearY[cell]=Math.round(-f.smearY[cell]*5);
   }
  }
  for(let y=0;y<H;y++){
   const row=sampleY[y],v=row.v,weight=1-v,top=row.i*W,bottom=row.j*W;
   for(let x=pixelLeft[y];x<=pixelRight[y];x++){
    const p=y*W+x,k=p*4,a=top+x,b=bottom+x;
    const amount=stainRows[a]*weight+stainRows[b]*v,wet=wetRows[a]*weight+wetRows[b]*v;if(amount<.003&&wet<.03)continue;
    let cell=nearestCell[p];
    // Interpolated edge coverage must inherit a dirty neighbour's pigment,
    // rather than uninitialised black from just beyond the contact mask.
    if(f.stain[cell]<amount*.25)cell=neighbours[cell];
    // Moisture is visible even on rinsed white leather. It follows the actual
    // waterline, darkens seams, and fades independently from bound dirt pigment.
    const ink=Math.min(220,amount*205*inkGrain[p]*(1+wet*.15));
    const damp=wet*52*dampGrain[p]*(1-ink/255),alpha=ink+damp;
    fd[k+3]=alpha;
    if(fd[k+3]){
     // Share the moisture calculation across RGB; keep the arithmetic order
     // and clamped-byte rounding of the original material shader.
     const tint=cell*3,dryLight=(1-wet)*14,wetShade=wet*16,grit=pigmentGrain[p];
     fd[k]=(clamp(f.tint[tint]+dryLight-wetShade+grit,0,255)*ink+142*damp)/alpha;
     fd[k+1]=(clamp(f.tint[tint+1]+dryLight-wetShade+grit,0,255)*ink+154*damp)/alpha;
     fd[k+2]=(clamp(f.tint[tint+2]+dryLight-wetShade+grit,0,255)*ink+151*damp)/alpha;
     hasFilm=true;
    }
    if(!deposits)continue;
    const mass=massRows[a]*weight+massRows[b]*v;
    if(mass<.009)continue;
    pixelWet[p]=wet;
    // Water and oil have no raised deposits. Deforming and shading clay for
    // every wet pixel was expensive work whose result was immediately discarded.
    const material=materials[f.depositTypes[cell]],{color,gum,grit}=material;
    const stretch=stretchByCell[cell],sx=clamp(x+smearX[cell],0,W-1),sy=clamp(y+smearY[cell],0,H-1);
    const cluster=coarse[p]*(1-stretch*.35)+coarse[sy*W+sx]*stretch*.35;
    const threshold=.7-Math.min(.45,mass*.7);
    const broken=clamp((cluster-threshold+.1+cavity[p]*mass*.18)/.24,0,1),coverage=smooth(broken)*clamp(mass*5,0,1);
    const density=grit?coverage*(grain[p]>.68?1:.12):coverage;
    // Connected, torn-edged clay deposits instead of a regular necklace of dots.
    bd[k+3]=density*(grit?190:145+mass*100);
    relief[p]=density*mass*(.55+fine[p]*.45);
    // Invisible deposits still contribute relief to their neighbours, but
    // transparent RGB never reaches the shoe. Skip only that colour work.
    if(!bd[k+3])continue;
    const moisture=gum?.45:wet,dryLight=(1-moisture)*22,wetShade=moisture*23;
    const photographed=earth&&material.photographed,detail=(fine[p]-.5)*(gum?8:18),grainShade=(grain[p]-.5)*10,crease=cavity[p]*12;
    bd[k]=clamp(color[0]+dryLight-wetShade+(photographed?(earth[k]-90)*.55:0)+detail+grainShade-crease,0,255);
    bd[k+1]=clamp(color[1]+dryLight-wetShade+(photographed?(earth[k+1]-90)*.55:0)+detail+grainShade-crease,0,255);
    bd[k+2]=clamp(color[2]+dryLight-wetShade+(photographed?(earth[k+2]-90)*.55:0)+detail+grainShade-crease,0,255);
    hasBody=true;
   }
  }
  if(hasBody)for(let y=1;y<H-1;y++)for(let x=Math.max(1,pixelLeft[y]);x<=Math.min(W-2,pixelRight[y]);x++){
   const p=y*W+x,k=p*4;if(!bd[k+3])continue;
   const wet=pixelWet[p];
   const slope=(relief[p-1]-relief[p+1])*.65+(relief[p-W]-relief[p+W]);
   const shadow=clamp(slope*85,-28,26),glint=Math.max(0,slope-.06)*wet*105;
   const cell=nearestCell[p],clay=materials[f.depositTypes[cell]].clay;
   const cracked=clay&&wet<.18&&relief[p]>.13&&Math.abs(fine[p]-.5)<.021;
   const crack=cracked?23:0;
   bd[k]=clamp(bd[k]+shadow+glint-crack,0,255);
   bd[k+1]=clamp(bd[k+1]+shadow+glint-crack,0,255);
   bd[k+2]=clamp(bd[k+2]+shadow+glint-crack,0,255);
  }
  // Pure water/oil has no raised clay layer; a transparent upload and composite
  // still makes the browser synchronize a canvas. Skip only fully empty layers.
  // Keep the blend pass for isolated droplets too: it preserves the browser's
  // premultiplied-alpha rounding before their translucent edges are drawn.
  if(hasFilm||f.spatter.length){c.putImageData(film,0,0);target.globalCompositeOperation='multiply';target.drawImage(layer,0,0);target.globalCompositeOperation='source-over';}
  if(hasBody){c.putImageData(body,0,0);target.drawImage(layer,0,0);}
  for(const spot of f.spatter){
   const x=spot.u*W,y=spot.v*H,r=Math.max(.24,spot.r*W),wet=f.wetness[spot.cell],color=MATERIALS[spot.type].color;
   target.globalCompositeOperation='multiply';
   target.fillStyle=`rgba(${color.map(v=>Math.round(v+12*(1-wet))).join(',')},${(spot.type==='water'?.22:.58)*(spot.opacity??1)})`;
   target.beginPath();target.ellipse(x,y,r,r*.8,spot.u*11,0,Math.PI*2);target.fill();
   if(spot.type==='mud'&&r>.55){target.fillStyle='rgba(47,36,23,.28)';target.fillRect(x-r*.25,y-r*.15,.35,.35);}
   target.globalCompositeOperation='source-over';
  }
  // Sparse reflections follow the wet film. Oil retains a low sheen after water dries.
  for(let i=0;i<f.stain.length;i++){
   const wet=f.wetness[i];if(f.stain[i]<.015&&wet<.18)continue;const oil=f.stain[i]>=.015&&f.tint[i*3]<55&&f.tint[i*3+2]>f.tint[i*3]*.85;
   if((wet>.18||oil)&&glints[i]){
    const x=(i%GRID.width+.5)*4,y=(Math.floor(i/GRID.width)+.5)*4;
    target.strokeStyle=`rgba(217,225,213,${Math.min(.22,oil?f.stain[i]*.2:wet*.15)})`;target.lineWidth=.5;
    target.beginPath();target.moveTo(x-.8,y);target.lineTo(x+1.1,y-.4);target.stroke();
   }
  }
 };
}
