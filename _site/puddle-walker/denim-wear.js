import {MATERIALS,SHOES,footPoint,surfaceAt,clamp} from './model.js?v=light-materials-135';

// Cosmetic cloth history has its own noise and clock. It never consumes the
// simulation's random stream, changes a sole, or participates in cleanliness.
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const earthy=type=>['mud','clay','cement','poop','gravel'].includes(type);
// Weak ownership lets discarded walks and the oldest capped splashes be freed.
const paintStates=new WeakMap(),grainShapes=new WeakMap();
export function createDenimWear(side){
  return {side,time:null,landing:-10,seen:new WeakSet(),spots:[],hem:Array.from({length:7},(_,i)=>({x:8+i*13,wet:0,soil:0,height:0,type:'mud'})),revision:0};
}
function addSpot(w,mark,soil,wet,seed){
  if(soil<.006&&wet<.03)return;
  w.spots.push({...mark,soil,wet,seed});
  // Keep the oldest grime in the hem instead of an unbounded decal history.
  if(w.spots.length>84){const old=w.spots.shift(),band=w.hem[Math.min(6,Math.max(0,Math.floor(old.x/14)))];if(old.soil>band.soil*.3)band.type=old.type;band.soil=Math.min(.92,band.soil+old.soil*.025);}
}
export function updateDenimWear(w,g,f){
  if(w.time!==null&&g.time-w.time<.095)return w;
  const dt=w.time===null?0:clamp(g.time-w.time,0,.5);w.time=g.time;
  let shoeSoil=f.coverage||0,shoeWet=0,shoeLoad=0;
  for(const z of f.sole){shoeSoil=Math.max(shoeSoil,z.stain||0);shoeWet=Math.max(shoeWet,z.wet||0);shoeLoad=Math.max(shoeLoad,z.dirt||0);}
  // The same shoe must show evidence of the contact before its trouser leg
  // gets pigmented. Clean shallow water darkens denim without painting mud on it.
  const pigment=clamp((shoeSoil-.015)*2,0,1);
  const hemDrying=Math.exp(-dt/42),spotDrying=Math.exp(-dt/34),oilDrying=Math.exp(-dt/120);
  for(const band of w.hem)band.wet*=hemDrying;
  for(const spot of w.spots)spot.wet*=spot.type==='oil'?oilDrying:spotDrying;
  for(const mark of f.jeans){
    if(w.seen.has(mark))continue;w.seen.add(mark);
    const seed=mark.x*830+mark.y*371+mark.r*127+f.side*113;
    const type=mark.type,water=type==='water',strength=clamp(mark.r/6,.15,1.4);
    const soil=water?pigment*.025:mark.opacity*pigment*(earthy(type)?1.05:.75);
    addSpot(w,{x:48+mark.x*91,y:14+mark.y*245,rx:2.5+strength*8,ry:3+strength*12,type},soil,water?Math.max(.22,shoeWet)*.9:shoeWet*.65,seed);
  }
  const shoe=SHOES[g.shoeId];
  if(f.z<7){
    // Actual heel samples: a clean stepping stone inside a puddle keeps the
    // cuff dry. A wet toe alone cannot soak the back of the trouser leg.
    for(let i=0;i<w.hem.length;i++){
      const band=w.hem[i],point=footPoint(f,(i/6-.5)*shoe.width*.76,-shoe.length*.22);
      const contact=surfaceAt(g,point.x,point.y),mat=MATERIALS[contact.type];
      const immersion=mat.liquid?clamp((contact.depth-f.z-8)/17,0,1):0;
      if(!immersion)continue;
      const wet=1-Math.exp(-dt*(2.5+immersion*4));
      band.wet+=(1-band.wet)*wet;
      band.height=Math.max(band.height,15+immersion*98+noise(i+f.side*71)*15);
      if(contact.type!=='water'){
        const amount=dt*immersion*pigment*(earthy(contact.type)?1.2:.6);
        if(amount>0){band.soil=Math.min(.94,band.soil+(1-band.soil)*amount);band.type=contact.type;}
      }else{
        // Only immersed cloth rinses. Higher dried splashes survive a shallow dip.
        band.soil*=Math.exp(-dt*immersion*(MATERIALS[band.type].rinse||0)*.4);
        for(const spot of w.spots)if(spot.y<band.height&&Math.abs(spot.x-band.x)<10){spot.soil*=Math.exp(-dt*immersion*(MATERIALS[spot.type].rinse||0)*.25);spot.wet=Math.max(spot.wet,band.wet*.8);}
      }
    }
  }
  if(f.landedAt!==w.landing){
    w.landing=f.landedAt;
    // Heel flicks are low and sparse; gravel dust and sticky residue do not
    // produce the tall splashes of a deep puddle.
    const type=f.dirtSource;
    if(f.landedAt>=0&&pigment>.03&&shoeLoad>.025&&MATERIALS[type]?.dirt&&type!=='water'){
      const seed=f.landedAt*173+f.side*37,liquid=MATERIALS[type].liquid;
      for(let i=0;i<5;i++){
        const n=seed+i*17;
        addSpot(w,{x:8+noise(n)*80,y:4+noise(n+1)*(liquid?60:22),rx:1+noise(n+2)*4,ry:2+noise(n+3)*(liquid?9:3),type},pigment*shoeLoad*(earthy(type)?.3:.18),shoeWet*.6,n);
      }
    }
  }
  // Quantized wetness keeps drying out of the per-frame texture paint path.
  // Compare the same quantized values without allocating strings and temporary
  // arrays ten times a second for every spot on both legs.
  let state=paintStates.get(w);
  if(!state){state={values:new Float64Array((7+84)*3).fill(NaN),types:[],length:-1};paintStates.set(w,state);}
  let changed=state.length!==w.spots.length,at=0;
  const remember=value=>{if(state.values[at]!==value){changed=true;state.values[at]=value;}at++;};
  for(let i=0;i<w.hem.length;i++){
    const b=w.hem[i];remember(Math.round(b.wet*24));remember(Math.round(b.soil*40));remember(Math.round(b.height));
    if(state.types[i]!==b.type){changed=true;state.types[i]=b.type;}
  }
  for(const s of w.spots){remember(Math.round(s.wet*20));remember(Math.round(s.soil*40));remember(s.seed);}
  state.length=w.spots.length;
  if(changed)w.revision++;
  return w;
}
function bloom(c,x,y,rx,ry,color,alpha){
  if(alpha<.005)return;
  c.save();c.translate(x,y);c.scale(Math.max(1,rx),Math.max(1,ry));
  const fill=c.createRadialGradient(0,0,.15,0,0,1);fill.addColorStop(0,`rgba(${color},${alpha})`);fill.addColorStop(.63,`rgba(${color},${alpha*.82})`);fill.addColorStop(1,`rgba(${color},0)`);
  c.fillStyle=fill;c.fillRect(-1,-1,2,2);c.restore();
}
function residue(c,s,x=s.x,y=s.y,rx=s.rx,ry=s.ry,seed=s.seed){
  const {type,soil,wet}=s;if(soil<.008)return;
  const color=MATERIALS[type].color,dry=1-clamp(wet,0,1),grease=type==='oil'||type==='tar';
  const grit=earthy(type);
  let shape=grainShapes.get(s);
  if(!shape||shape.seed!==seed||shape.grit!==grit){
    const points=new Float64Array(15*5);
    for(let i=0;i<15;i++){
      const n=seed+i*11,a=noise(n)*Math.PI*2,j=i*5;
      points[j]=Math.cos(a);points[j+1]=Math.sin(a);points[j+2]=Math.sqrt(noise(n+1));
      points[j+3]=.25+noise(n+2)*.55;points[j+4]=grit?1+noise(n+3)*2.2:.6+noise(n+3);
    }
    shape={seed,grit,points};grainShapes.set(s,shape);
  }
  const tone=color.map(v=>Math.round(v*(.72+dry*.38))).join(',');
  bloom(c,x,y,rx*1.22,ry*1.15,tone,soil*.65);
  // Fibrous, irregular deposits follow the cloth, with dry granular edges.
  for(let i=0;i<15;i++){
    const j=i*5,p=shape.points,d=p[j+2],px=x+p[j]*rx*d,py=y+p[j+1]*ry*d;
    c.fillStyle=`rgba(${tone},${soil*p[j+3]})`;
    const size=p[j+4];
    c.fillRect(px,py,size,grease?size*2.3:size*.7);
    if(grit&&i%3===0){c.fillStyle=`rgba(209,192,153,${soil*dry*.3})`;c.fillRect(px,py,size,.55);}
  }
  if(grease){c.strokeStyle=`rgba(151,158,148,${soil*.13})`;c.lineWidth=.6;c.beginPath();c.moveTo(x-rx*.4,y);c.lineTo(x-rx*.2,y+ry*.6);c.stroke();}
}
export function paintDenimWear(c,w){
  c.save();
  for(let i=0;i<w.hem.length;i++){
    const b=w.hem[i],h=b.height;
    if(!h)continue;
    // Overlapping wet lobes make an uneven capillary edge above a saturated hem.
    bloom(c,b.x,5,17,h+13,'4,20,31',b.wet*.67);
    bloom(c,b.x+3,h*.55,12,h*.52,'6,24,36',b.wet*.22);
    residue(c,b,b.x,5,17,h,i*53+w.side*109);
    if(b.soil>.08){c.strokeStyle=`rgba(${MATERIALS[b.type].color.join(',')},${b.soil*(1-b.wet)*.25})`;c.lineWidth=.7;c.beginPath();c.moveTo(b.x-6,h*.83);c.quadraticCurveTo(b.x,h*.94,b.x+7,h*.79);c.stroke();}
  }
  for(const s of w.spots){
    bloom(c,s.x,s.y,s.rx*1.7,s.ry*1.35,'5,22,34',s.wet*.55);
    if(s.wet>.2)bloom(c,s.x+1,s.y-s.ry*.7,s.rx*.5,s.ry*.9,'5,22,34',s.wet*.2);
    residue(c,s);
  }
  c.restore();
}
