import {createHomeEntranceSteps} from './home-entrance.js?v=lean-frames-134';
import {HOME} from './home-arrival.js?v=lean-frames-134';
import {rippleProfile,reflectionFacets,reflectionSample} from './water-motion.js?v=lean-frames-134';
import {createLooseDebris,updateLooseDebris,createDebrisPainter,debrisPose} from './loose-debris.js?v=lean-frames-134';
import {createFootprintPainter} from './footprints.js?v=lean-frames-134';
import {paintGroundBank,paintCrater,groundPath,paintSteppingStone,paintWashoutMouth,paintAggregateSpill} from './road-ground.js?v=lean-frames-134';
import {paintRoadWear,paintCurbDrain,paintPaving,paintPlantingBed} from './street-surfaces.js?v=lean-frames-134';
import { VEHICLES, vehicleLineup } from './vehicles.js?v=lean-frames-134';
import {paintVanMessage} from './street-charm.js?v=lean-frames-134';
import { SHOE_CROP, SHOE_MASK } from './sprite-data.js?v=lean-frames-134';
import { createDenim, legRows, legContains } from './denim.js?v=lean-frames-134';
import { createShoeWearSteps } from './shoe-wear.js?v=lean-frames-134';
import { ROAD, PAVEMENT, SHOES, MATERIALS, boundary, randomSource, condition, predictedTarget, surfaceAt, footPoint, clamp, puddleDepth, DISTRICT_LENGTH, CAR } from './model.js?v=lean-frames-134';
import { createNeighborhood } from './neighborhood.js?v=lean-frames-134';
import { paintGroundContacts, paintStickyThreads } from './ground-effects.js?v=lean-frames-134';
const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const loadImage = url => new Promise(resolve => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = url; });
const ellipse = (c, x, y, rx, ry, color) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); };
const rgba = (type, a) => `rgba(${MATERIALS[type]?.color.join(',') || '90,70,45'},${a})`;
function rainLeaf(c, x, y, size, angle, color) {
  c.save(); c.translate(x,y); c.rotate(angle);
  c.beginPath();c.moveTo(0,-size);c.bezierCurveTo(size*.9,-size*.5,size*.65,size*.6,0,size);
  c.bezierCurveTo(-size*.8,size*.4,-size*.65,-size*.7,0,-size);c.fillStyle=color;c.fill();
  c.strokeStyle='#282d2280';c.lineWidth=.45;c.beginPath();c.moveTo(0,-size*.8);c.lineTo(0,size*1.2);c.stroke();
  c.strokeStyle='#c6bc8c44';c.beginPath();c.moveTo(-size*.25,-size*.4);c.lineTo(0,-size*.7);c.stroke();c.restore();
}
// Posted tasks avoid the nested-timer minimum delay during initial baking.
// Close both ports after every yield; no channel keeps a discarded renderer alive.
function yieldTask(){
  return new Promise(resolve=>{
    const channel=new MessageChannel();
    channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve();};
    channel.port2.postMessage(null);
  });
}
const CHUNK = 768, MAX_CHUNKS = 5;
export function footPose(g, f, sy, reduced) {
  if(g.arrival){
    const roll=g.arrival.side===f.side?g.arrival.roll:0;
    return {x:f.x,y:sy-f.z*.48,angle:f.angle,sx:1+f.z/700,sy:1+f.z/1100-Math.abs(roll)*.13,roll};
  }
  const active = f.side === g.active, flight = active && g.mode === 'flight';
  const t = flight ? clamp(g.stepTime / f.flightDuration, 0, 1) : 0;
  const age = g.time - f.landedAt;
  const recoil = reduced ? 0 : age < .35 ? Math.sin(age * 28) * Math.exp(-age * 13) : 0;
  const bumpAge = f.bump ? (g.time - f.bump.at) / .22 : 1;
  const contact = reduced || bumpAge < 0 || bumpAge >= 1 ? 0 : Math.sin(bumpAge * Math.PI) * (1 - bumpAge) * f.bump.force;
  const roll = reduced ? 0 : (active && g.mode === 'charging' ? g.charge * .7 : flight ? Math.cos(t * Math.PI) * .85 : recoil * .3) + contact * .3;
  // The ankle yields a few millimetres away from the obstacle, then settles.
  // Only the painted pose moves: collision, stains and footing stay deterministic.
  return { x: f.x + (f.bump?.nx || 0) * contact * 4, y: sy - f.z * .48 + recoil * 2 - (f.bump?.ny || 0) * contact * 4, angle: f.angle, sx: 1 + f.z / 700 + recoil * .035, sy: 1 + f.z / 1100 - Math.abs(roll) * .13, roll };
}
export function cameraTarget(g, viewH, scale) {
  const meanY=(g.feet[0].y+g.feet[1].y)/2,rearY=Math.min(...g.feet.map(f=>f.y));
  // Leave the rear heel and a fingertip of room on screen, even at full stride.
  const heelRoom=SHOES[g.shoeId].length*.5+26/scale;
  return Math.max(0,Math.min(meanY-clamp(viewH*.13,90,120),rearY-heelRoom));
}
export async function createRenderer(canvas, inspection = null, resultInspection = null) {
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const lens = makeCanvas(160, 160), lensContext = lens.getContext('2d', {alpha:false});
  const [shoeImage, asphalt, atlas, denim, terrain, carImage, waterImage, bushImage, neighborhoodAtlas, lifeAtlas, awakeCat, doorstepDetails, pavingImage, everydayAtlas, ...extraCars] = await Promise.all(['white-sneaker.webp', 'asphalt.webp', 'street-props.webp', 'denim.webp', 'terrain.webp', 'parked-car.webp', 'puddle-water.webp', 'roadside-bush.webp', 'neighborhood-props.webp', 'street-life.webp', 'awake-cat.webp', 'doorstep-details.webp', 'concrete-paving.webp', 'everyday-details.webp', ...VEHICLES.slice(1).map(v=>v.asset)].map(p => loadImage('./assets/' + p)));
  // Give input and painting a turn between setup batches. The pixels and
  // seeded random order stay fixed; native canvas operations remain atomic.
  let artworkStart=performance.now(),initializationLongestSlice=0;
  const yieldArtwork=()=>{
    initializationLongestSlice=Math.max(initializationLongestSlice,performance.now()-artworkStart);
    return yieldTask().then(()=>{artworkStart=performance.now();});
  };
  async function prepareArtwork(steps){
    let result;
    do{
      result=steps.next();
      if(performance.now()-artworkStart>=4)await yieldArtwork();
    }while(!result.done);
    return result.value;
  }
  const crop = SHOE_CROP;
  // The photograph is a RIGHT sneaker (inner arch on image-left, toes pointing up).
  // Side 0 is the wearer's left foot. Share this mapping between sprites and contact masks.
  function drawShoePhoto(c, width, height, side) {
    c.save();
    if (side === 0) { c.translate(width, 0); c.scale(-1, 1); }
    c.drawImage(shoeImage, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    c.restore();
  }
  const mask = shoeImage ? SHOE_MASK : null;
  // Pre-sized sprites and static terrain tiles avoid large image resampling every frame.
  const sprites = [makeCanvas(96, 224), makeCanvas(96, 224)];
  const cleanSprites = [makeCanvas(96, 224), makeCanvas(96, 224)];
  for (let side = 0; side < 2; side++) {
    const c = cleanSprites[side].getContext('2d');
    if (shoeImage) drawShoePhoto(c, 96, 224, side);
    else ellipse(c, 48, 112, 43, 105, '#eee');
  }
  // Bake the warning tint once. Preserve the photo's silhouette and laces,
  // without filtering or compositing a new sprite while the player aims.
  const blockedSprites = cleanSprites.map(sprite => {
    const tinted = makeCanvas(96, 224), c = tinted.getContext('2d');
    c.drawImage(sprite, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = '#ed4039d9'; c.fillRect(0, 0, 96, 224);
    return tinted;
  });
  const paintShoeWear=await prepareArtwork(createShoeWearSteps(terrain,cleanSprites));
  await yieldArtwork();
  // Photograph-shaped contact shadows, baked at three softness levels. A
  // lifted foot casts a broader, lighter shadow without per-frame filtering.
  const shoeShadows=cleanSprites.map(sprite=>{
    const silhouette=makeCanvas(160,288),c=silhouette.getContext('2d');c.drawImage(sprite,32,32);
    c.globalCompositeOperation='source-in';c.fillStyle='#101b1b';c.fillRect(0,0,160,288);
    return [1,7,15].map(blur=>{const shadow=makeCanvas(160,288),sc=shadow.getContext('2d');sc.filter=`blur(${blur}px)`;sc.drawImage(silhouette,0,0);return shadow;});
  });
  // Five pre-sized photographs and shadows are baked once, shared by every bay.
  const carImages=[carImage,...extraCars],carSprites=new Map();
  const fallback=carImages.findIndex(Boolean);
  for(const [i,vehicle] of VEHICLES.entries()){
    const sourceIndex=carImages[i]?i:fallback;
    if(sourceIndex<0)continue;
    const image=carImages[sourceIndex],art=VEHICLES[sourceIndex];
    const sprite=makeCanvas(CAR.width+40,CAR.length+40),c=sprite.getContext('2d');
    const [left,top,right,bottom]=art.insets||[0,0,0,0];
    c.shadowColor='#0a192b80';c.shadowBlur=12;c.shadowOffsetX=10;c.shadowOffsetY=8;
    c.drawImage(image,left,top,image.width-left-right,image.height-top-bottom,
      20+(CAR.width-art.width)/2,20,art.width,CAR.length);
    if(art.id==='white-van'){
      c.save();c.translate(20+(CAR.width-art.width)/2,20);c.scale(art.width/512,CAR.length/1024);
      paintVanMessage(c);c.restore();
    }
    carSprites.set(vehicle.id,sprite);
    await yieldArtwork();
  }
  let fleet=new Map(),stickyPatches=[];
  const soles = cleanSprites.map(sprite => {
    const sole = makeCanvas(96, 224), c = sole.getContext('2d'); c.drawImage(sprite, 0, 0);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = '#bdbbb0'; c.fillRect(0, 0, 96, 224); return sole;
  });
  // A real outsole impression: rounded toe, inward arch, separate heel and worn
  // herringbone tread. Bake the grain once; prints need no per-frame pixel work.
  const tread = makeCanvas(96, 224), treadContext = tread.getContext('2d');
  {
    const c = treadContext, rand = randomSource(7331);
    c.scale(96 / 34, 224 / 78); c.translate(17, 39);
    const outline = new Path2D('M0 -38 C-12 -38 -17 -28 -16 -16 L-14 11 C-13 26 -13 37 -2 38 C9 39 12 32 11 22 C8 12 6 5 10 -6 C17 -20 17 -34 5 -38 Z');
    c.clip(outline); c.fillStyle = '#ffffff38'; c.fill(outline);
    c.strokeStyle = '#ffffffa0'; c.lineWidth = 1.2; c.stroke(outline);
    c.strokeStyle = '#fffffff0'; c.lineWidth = 2.4;
    for (let y = -33; y < 10; y += 5.8) {
      c.beginPath(); c.moveTo(-15, y); c.lineTo(-3, y + 3.5); c.moveTo(0, y + 3.5); c.lineTo(14, y - 1); c.stroke();
    }
    c.fillStyle = '#ffffffe8'; c.fillRect(-12, 19, 24, 17);
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = '#000';
    for (let y = 22; y < 37; y += 4.5) c.fillRect(-12, y, 25, 1.3);
    c.fillRect(-1, 18, 1.5, 20);
    for (let i = 0; i < 350; i++) { c.globalAlpha = .25 + rand() * .5; c.fillRect(rand() * 34 - 17, rand() * 78 - 39, .3 + rand() * .9, .3 + rand() * 1.4); }
  }
  const cleanSoles=soles.map(sole=>{const c=makeCanvas(96,224);c.getContext('2d').drawImage(sole,0,0);return c;});
  const printSprites = new Map();
  function printSprite(type, side) {
    const key = `${type}:${side}`;
    if (!printSprites.has(key)) {
      const sprite = makeCanvas(96, 224), c = sprite.getContext('2d');
      if (side === 1) { c.translate(96, 0); c.scale(-1, 1); }
      c.drawImage(tread, 0, 0); c.globalCompositeOperation = 'source-in';
      c.fillStyle = type === 'wet' ? '#202b29' : type === 'relief' ? '#d4c4a0' : rgba(type, 1); c.fillRect(0, 0, 96, 224);
      printSprites.set(key, sprite);
    }
    return printSprites.get(key);
  }
  const footprints=createFootprintPainter(printSprite);
  const paintDebris=createDebrisPainter();let looseDebris=null;
  const propSprites = [];
  if (atlas) for (let i = 0; i < 4; i++) {
    const c = makeCanvas(256, 256); c.getContext('2d').drawImage(atlas, (i % 2) * atlas.width / 2, Math.floor(i / 2) * atlas.height / 2, atlas.width / 2, atlas.height / 2, 0, 0, 256, 256); propSprites.push(c);
  }
  const bushSprite = makeCanvas(256, 256);
  if (bushImage) bushSprite.getContext('2d').drawImage(bushImage, 0, 0, 256, 256);
  const texture = makeCanvas(384, 384), tc = texture.getContext('2d');
  if (asphalt) tc.drawImage(asphalt, 0, 0, 384, 384); else { tc.fillStyle = '#626461'; tc.fillRect(0, 0, 384, 384); }
  tc.fillStyle = '#55595b22'; tc.fillRect(0, 0, 384, 384);
  // Fine aggregate and wet soil are prepared once and repeated in world space.
  const aggregate=makeCanvas(384,384),ac=aggregate.getContext('2d'),aggregateRand=randomSource(16767);
  ac.fillStyle='#817d6d';ac.fillRect(0,0,384,384);
  if(asphalt){ac.globalAlpha=.34;ac.drawImage(asphalt,0,0,384,384);ac.globalAlpha=1;}
  for(let i=0;i<18500;i++){
    const x=aggregateRand()*384,y=aggregateRand()*384,r=.35+aggregateRand()**3*3.3;
    ac.fillStyle=['#938f80','#707466','#a8a28d','#555c54','#87816e'][i%5];
    ac.beginPath();ac.moveTo(x-r,y);ac.lineTo(x-r*.15,y-r*.7);ac.lineTo(x+r,y-r*.25);ac.lineTo(x+r*.6,y+r*.65);ac.lineTo(x-r*.55,y+r*.8);ac.closePath();ac.fill();
    if(r>2){ac.fillStyle='#d7ceb055';ac.fillRect(x-r*.3,y-r*.45,r,.45);}
    if(i%512===511&&performance.now()-artworkStart>=4)await yieldArtwork();
  }
  await yieldArtwork();
  const soil=makeCanvas(768,768),sc=soil.getContext('2d');sc.fillStyle='#6c5b45';sc.fillRect(0,0,768,768);
  if(terrain){
    // Overlapping photographic samples keep the original grain scale without
    // the four-way mirrored puddles. Wrapped stamps make the atlas seamless.
    const sample=makeCanvas(224,224),pc=sample.getContext('2d'),soilRand=randomSource(78319);
    const feather=pc.createRadialGradient(112,112,50,112,112,112);feather.addColorStop(0,'#000');feather.addColorStop(1,'#0000');
    for(let y=0;y<768;y+=96)for(let x=0;x<768;x+=96){
      pc.clearRect(0,0,224,224);pc.save();pc.translate(112,112);pc.rotate(soilRand()*Math.PI*2);
      const span=terrain.width*.28,sx=terrain.width/2+soilRand()*(terrain.width/2-span),sy=soilRand()*(terrain.height/2-span);
      pc.drawImage(terrain,sx,sy,span,span,-140,-140,280,280);pc.restore();
      pc.globalCompositeOperation='destination-in';pc.fillStyle=feather;pc.fillRect(0,0,224,224);pc.globalCompositeOperation='source-over';
      const px=x+(soilRand()-.5)*38-112,py=y+(soilRand()-.5)*38-112;
      for(const dx of [-768,0,768])for(const dy of [-768,0,768])if(px+dx<768&&px+dx+224>0&&py+dy<768&&py+dy+224>0)sc.drawImage(sample,px+dx,py+dy);
      if(performance.now()-artworkStart>=4)await yieldArtwork();
    }
  }
  sc.fillStyle='#5c4c3224';sc.fillRect(0,0,768,768);
  await yieldArtwork();
  const rubble=makeCanvas(384,384),rc=rubble.getContext('2d');rc.drawImage(texture,0,0);rc.globalAlpha=.42;rc.drawImage(aggregate,0,0);rc.globalAlpha=1;
  const subbase=makeCanvas(384,384),bc=subbase.getContext('2d');bc.drawImage(aggregate,0,0);bc.fillStyle='#aa89562e';bc.fillRect(0,0,384,384);
  const bedGrain=randomSource(6068);
  for(let i=0;i<65;i++){
    const x=bedGrain()*384,y=bedGrain()*384,r=3+bedGrain()*6;
    const dust=bc.createRadialGradient(x,y,0,x,y,r*4);dust.addColorStop(0,i%2?'#bd9c6930':'#5d61502b');dust.addColorStop(1,'#a5977300');bc.fillStyle=dust;bc.fillRect(x-r*4,y-r*4,r*8,r*8);
    if(i%5===0){bc.fillStyle='#9d755080';bc.beginPath();bc.moveTo(x-r,y-r*.3);bc.lineTo(x+r*.4,y-r*.6);bc.lineTo(x+r,y+r*.5);bc.lineTo(x-r*.7,y+r);bc.closePath();bc.fill();}
    if(i%8===7&&performance.now()-artworkStart>=4)await yieldArtwork();
  }
  const groundPatterns={rubble:ctx.createPattern(rubble,'repeat'),subbase:ctx.createPattern(subbase,'repeat'),mud:ctx.createPattern(soil,'repeat'),asphalt:ctx.createPattern(texture,'repeat')};
  await yieldArtwork();
  const grass = makeCanvas(128, 128), gc = grass.getContext('2d'), gr = randomSource(877);
  gc.fillStyle = '#475331'; gc.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 4000; i++) {
    const x = gr() * 128, y = gr() * 128, h = 1.5 + gr() * 3.5;
    gc.strokeStyle = ['#617747', '#71834d', '#91a064', '#384d30', '#a8aa6b', '#4e653b'][i % 6]; gc.lineWidth = .45 + gr() * .6;
    gc.beginPath(); gc.moveTo(x, y); gc.lineTo(x + (gr() - .5) * 3, y - h); gc.stroke();
  }
  if (terrain) { gc.globalAlpha = .66; gc.drawImage(terrain,terrain.width/2,terrain.height/2,terrain.width/2,terrain.height/2,0,0,128,128); gc.globalAlpha = 1; }
  // Photographic concrete keeps the pores, mineral variation and fine flush
  // joints at street scale, without painted bevels around every slab.
  const paving = pavingImage || makeCanvas(120,120);
  if(!pavingImage){const c=paving.getContext('2d');c.fillStyle='#92938d';c.fillRect(0,0,120,120);}
  // Reuse the photograph for the porch. The sidewalk material uses the faces
  // of all 36 flags, without baking a second, conflicting set of grout lines.
  const curbing = makeCanvas(720,720), cc = curbing.getContext('2d');
  cc.fillStyle='#96988e';cc.fillRect(0,0,720,720);
  if(pavingImage)for(let row=0;row<6;row++)for(let col=0;col<6;col++){
    const w=pavingImage.width/6,h=pavingImage.height/6;
    cc.drawImage(pavingImage,col*w+4,row*h+4,w-8,h-8,col*120,row*120,120,120);
  }
  await yieldArtwork();
  groundPatterns.paving=ctx.createPattern(curbing,'repeat');
  const neighborhood = createNeighborhood(neighborhoodAtlas, paving, texture, lifeAtlas, bushSprite, awakeCat, doorstepDetails, curbing, everydayAtlas, soil);
  await yieldArtwork();
  // The finish is 100 metres away. Build its unchanged artwork incrementally
  // with the approaching terrain tile, not while the player waits to start.
  let doorstep=null,doorstepJob=null;
  function* prepareDoorstep(){
    while(!doorstep){
      const result=(doorstepJob??=createHomeEntranceSteps(paving,bushSprite,texture,doorstepDetails)).next();
      if(result.done){doorstep=result.value;doorstepJob=null;}
      else yield;
    }
  }
  const paintDenim = createDenim(denim);
  await yieldArtwork();
  const legHits = [], legMeshes=[[],[]];
  const barrierSprites=new Map(),gumSprites=new Map();
  const chunks = new Map(), tileJobs = new Map(), paths = new Map(), stoneClips = new Map(), liquidGroups = new Map(), revisions = [-1, -1], paintedAt = [-1,-1];
  const soleStains=[new Float64Array(8),new Float64Array(8)],soleTypes=[[],[]];
  let ref, camera = 0, viewH = 800, scale = 1, offset = 0, rect, dpr = 1, lastInspection = '', lastResultInspection = '', lastResize = 0, preparedAt = -1, warmJob = null;
  // Some browsers have no idle callback API. Still prepare the next tile in
  // short tasks between frames, rather than building it when it becomes visible.
  const hasIdleCallbacks=typeof window.requestIdleCallback==='function';
  const scheduleWarm=hasIdleCallbacks?fn=>window.requestIdleCallback(fn,{timeout:120}):fn=>setTimeout(()=>{
    const until=performance.now()+4;
    fn({timeRemaining:()=>Math.max(0,until-performance.now())});
  },0);
  const cancelWarm=hasIdleCallbacks?id=>window.cancelIdleCallback(id):id=>clearTimeout(id);
  const metrics = { initializationLongestSlice, chunks: 0, cacheBytes: 0, generated: 0, prefetched: 0, visibleMisses: 0, warmMilliseconds: 0, warmLongestSlice: 0, solePaints: 0, litterSprites: 0, litterCacheBytes: 0 };
  function pathFor(p) {
    if (paths.has(p.id)) return paths.get(p.id);
    if(p.groundField){const path=groundPath(p);paths.set(p.id,path);return path;}
    const path = new Path2D();
    for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2, r = boundary(p, a), x = Math.cos(a) * p.rx * r, y = -Math.sin(a) * p.ry * r; if (!i) path.moveTo(x, y); else path.lineTo(x, y); }
    path.closePath(); paths.set(p.id, path); return path;
  }
  function gumSprite(p) {
    if(gumSprites.has(p.id))return gumSprites.get(p.id);
    const w=Math.ceil(p.rx*2.4+8),h=Math.ceil(p.ry*2.4+8),sprite=makeCanvas(w*2,h*2),c=sprite.getContext('2d');
    c.scale(2,2);c.translate(w/2,h/2);
    const r=randomSource(Math.floor(p.seed*1000)),path=pathFor(p);
    const palette=[['#ad9c99','#8a7e79'],['#b4a49e','#8d817a'],['#aaa79d','#838176']][Math.floor(r()*3)];
    c.shadowColor='#111b1d75';c.shadowBlur=1.3;c.shadowOffsetY=.6;
    const body=c.createLinearGradient(0,-p.ry,0,p.ry);body.addColorStop(0,palette[0]);body.addColorStop(.65,palette[1]);body.addColorStop(1,'#686a5e');
    c.fillStyle=body;c.fill(path);c.shadowColor='transparent';c.clip(path);
    c.strokeStyle='#414b4440';c.lineWidth=1.1;c.stroke(path);
    // Dust settles into the gum; short, uneven folds keep the surface soft
    // without turning it into a patterned tile or a shiny piece of candy.
    for(let i=0;i<65;i++){
      const x=(r()-.5)*w,y=(r()-.5)*h,size=.25+r()*.65;
      c.fillStyle=['#343c367a','#d9ceb877','#746b5680'][i%3];c.fillRect(x,y,size,size*.8);
    }
    for(let i=0;i<4;i++){
      const x=(r()-.5)*p.rx,y=(r()-.5)*p.ry*1.35,length=p.rx*(.22+r()*.37);
      c.save();c.translate(x,y);c.rotate((r()-.5)*1.5);
      c.strokeStyle='#534c492f';c.lineWidth=.45+r()*.35;c.beginPath();c.moveTo(-length*.5,-.4);c.quadraticCurveTo(-length*.1,1.8,length*.5,0);c.stroke();
      c.strokeStyle='#e2d2c32b';c.lineWidth=.5;c.beginPath();c.moveTo(-length*.4,-1.2);c.quadraticCurveTo(0,.7,length*.3,-.6);c.stroke();c.restore();
    }
    const result={sprite,w,h};gumSprites.set(p.id,result);
    metrics.litterSprites=gumSprites.size;metrics.litterCacheBytes+=sprite.width*sprite.height*4;
    return result;
  }
  function paintPatch(c, p, sy, pressed=0) {
    if(p.groundField){paintGroundBank(c,p,sy,groundPatterns,randomSource(Math.floor(p.seed*1000)));return;}
    if(p.craterRim){paintCrater(c,p,sy,pathFor(p),groundPatterns,randomSource(Math.floor(p.seed*1000)));return;}
    c.save(); c.translate(p.x, sy); c.rotate(-Math.atan2(p.sin, p.cos));
    if(pressed)c.scale(1+pressed*.35,1-pressed*(p.type==='poop'?.55:.18));
    const path = pathFor(p), rand = randomSource(Math.floor(p.seed * 1000));
    if(p.contaminant){
      // The contact contour is also the visible edge. Texture is baked into the
      // street tile; no new particle system or per-frame noise for these spills.
      c.clip(path);
      const palettes={clay:['#956d45a6','#b39b70','#473e2c'],tar:['#24231fe8','#777363','#121914'],
        cement:['#96998ce8','#d0ceba','#62695e'],algae:['#3e502cd9','#7b8951','#293b22']};
      const [base,light,dark]=palettes[p.type];
      // A dense centre thins into the road grain at the waterline. Hard opaque
      // ovals looked like painted markers, especially across reflected water.
      c.save();c.scale(p.rx,p.ry);
      const pigment=MATERIALS[p.type].color.join(','),film=c.createRadialGradient(-.08,.05,.08,0,0,1.13);
      film.addColorStop(0,`rgba(${pigment},.94)`);film.addColorStop(.6,`rgba(${pigment},.8)`);
      film.addColorStop(.86,`rgba(${pigment},.48)`);film.addColorStop(1,`rgba(${pigment},.07)`);
      c.fillStyle=film;c.fillRect(-1.3,-1.3,2.6,2.6);c.restore();
      c.globalAlpha=.16;c.fillStyle=groundPatterns.mud;c.fill(path);c.globalAlpha=1;
      const grains=p.type==='tar'?85:p.type==='algae'?135:210;
      for(let i=0;i<grains;i++){
        const x=(rand()-.5)*p.rx*2.2,y=(rand()-.5)*p.ry*2.2,size=.35+rand()**2*(p.type==='clay'?2.9:1.4);
        c.globalAlpha=(.3+rand()*.45)*Math.max(0,1-Math.hypot(x/p.rx,y/p.ry)*.78);
        if(p.type==='algae'){
          c.strokeStyle=i%3?light:dark;c.lineWidth=.4+rand()*.8;c.beginPath();c.moveTo(x,y);
          c.quadraticCurveTo(x+3,y+2,x+7+rand()*8,y-2);c.stroke();
        }else{
          ellipse(c,x+.5,y+.8,size*1.2,size*.65,dark);
          ellipse(c,x,y,size,size*.55,i%3?base:light);
        }
      }
      c.globalAlpha=1;
      // Clay carries small dragged ridges; slurry dries pale around the edge;
      // bitumen has narrow, oily highlights instead of a blue water reflection.
      for(let i=0;i<7;i++){
        const x=(rand()-.5)*p.rx*1.6,y=(rand()-.5)*p.ry*1.5;
        c.globalAlpha=p.type==='tar'?.38:.22;c.strokeStyle=light;c.lineWidth=p.type==='clay'?1.4:.65;
        c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+9,y-2,x+18,y+3,x+26,y+1);c.stroke();
      }
      if(p.type==='cement'){
        c.globalAlpha=.22;c.strokeStyle=light;c.lineWidth=.7;c.setLineDash([2,5,1,7]);c.stroke(path);c.setLineDash([]);
        c.globalAlpha=.23;c.strokeStyle=dark;
        for(let i=0;i<8;i++){const x=(rand()-.5)*p.rx*1.6;c.beginPath();c.moveTo(x,p.ry*.6);c.lineTo(x+3,p.ry*.25);c.lineTo(x-2,p.ry*.05);c.stroke();}
      }
      c.restore();return;
    }
    if(p.leafMat){
      c.save();c.clip(path);c.scale(p.rx,p.ry);
      const silt=c.createRadialGradient(0,0,.1,0,0,1.1);
      silt.addColorStop(0,'#44422ac2');silt.addColorStop(.65,'#514a2da0');silt.addColorStop(1,'#62583a12');
      c.fillStyle=silt;c.fillRect(-1.2,-1.2,2.4,2.4);c.restore();
      // Flattened, overlapping leaves with wet veins and tiny grit. Keep their
      // tips inside the contact contour so the visible bare iron is usable.
      const count=p.onCover?Math.ceil(p.rx*p.ry/65):25;
      for(let i=0;i<count;i++){
        const a=rand()*Math.PI*2,r=Math.sqrt(rand()),size=3.2+rand()*2.8,angle=rand()*6.28;
        const x=Math.cos(a)*(p.rx*.8-size)*r,y=Math.sin(a)*(p.ry*.8-size)*r;
        c.save();c.translate(x,y);c.rotate(angle);c.scale(1,.8);
        rainLeaf(c,.5,.7,size,0,'#19271e55');
        rainLeaf(c,0,0,size,0,['#71613d','#625b39','#8a7348','#4c5234'][i%4]);
        c.strokeStyle='#c4bc8250';c.lineWidth=.4;c.beginPath();c.moveTo(-size*.25,0);c.lineTo(0,-size*.5);c.stroke();c.restore();
      }
      c.save();c.clip(path);
      for(let i=0;i<90;i++){
        c.fillStyle=i%3?'#262e2392':'#c4b68461';
        c.fillRect((rand()-.5)*p.rx*2,(rand()-.5)*p.ry*2,.35+rand(),.35+rand()*.7);
      }
      c.restore();c.restore();return;
    }
    if(p.gardenSpill){
      c.clip(path);c.globalAlpha=.64;c.fillStyle=groundPatterns.mud;c.fill(path);c.globalAlpha=1;
      c.save();c.scale(p.rx,p.ry);
      const soil=c.createRadialGradient(.15,0,.05,0,0,1.1);
      soil.addColorStop(0,'#332b20b0');soil.addColorStop(.7,'#4d3c2990');soil.addColorStop(1,'#59493408');
      c.fillStyle=soil;c.fillRect(-1.2,-1.2,2.4,2.4);c.restore();
      // Damp clods, pale perlite and fine roots distinguish potting compost
      // from road aggregate. All detail is baked once with the terrain.
      for(let i=0;i<260;i++){
        const x=(rand()-.5)*p.rx*2.2,y=(rand()-.5)*p.ry*2.2,size=.4+rand()**2*2.2;
        ellipse(c,x+.4,y+.6,size*1.2,size*.8,'#1f241f60');
        ellipse(c,x,y,size,size*.65,i%11===0?'#c5bda48a':['#4a3725d0','#6c5233b8','#302d21d9'][i%3]);
        if(i%8===0){c.strokeStyle='#ac91664c';c.lineWidth=.45;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+3,y-2,x+5,y+1);c.stroke();}
      }
      c.restore();return;
    }
    if(p.binLeak){
      c.clip(path);c.save();c.scale(p.rx,p.ry);
      const seep=c.createRadialGradient(0,0,.05,0,0,1.12);
      seep.addColorStop(0,'#514d2ba8');seep.addColorStop(.65,'#4c503b74');seep.addColorStop(1,'#38473716');
      c.fillStyle=seep;c.fillRect(-1.2,-1.2,2.4,2.4);c.restore();
      for(let i=0;i<90;i++){
        const x=(rand()-.5)*p.rx*2,y=(rand()-.5)*p.ry*2;
        ellipse(c,x,y,.3+rand()*.8,.25+rand()*.4,i%4?'#2431284a':'#bdc2a354');
      }
      c.strokeStyle='#b2bc9d42';c.lineWidth=.65;c.beginPath();
      c.ellipse(0,1,p.rx*.7,p.ry*.65,0,.15,2.2);c.stroke();
      c.restore();return;
    }
    if(p.gutterGrit){
      c.clip(path);c.save();c.scale(p.rx,p.ry);
      const deposit=c.createRadialGradient(0,-.18,.05,0,0,1.1);
      deposit.addColorStop(0,'#81785cba');deposit.addColorStop(.65,'#6b674d8c');deposit.addColorStop(1,'#64614e10');
      c.fillStyle=deposit;c.fillRect(-1.2,-1.2,2.4,2.4);c.restore();
      // Fine roof grit with a darker wet edge and scattered angular aggregate.
      // This is baked into the terrain; only actual foot contact moves grains.
      for(let i=0;i<240;i++){
        const x=(rand()-.5)*p.rx*2,y=(rand()-.5)*p.ry*2,size=.4+rand()**2*1.8;
        c.fillStyle=['#b1a58a9c','#4a4d3cca','#817961b0','#d3c6a282'][i%4];
        c.beginPath();c.moveTo(x-size,y);c.lineTo(x+.4,y-size*.8);c.lineTo(x+size,y+.3);c.lineTo(x-.3,y+size*.7);c.closePath();c.fill();
      }
      c.strokeStyle='#3c493a4a';c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,p.rx*.77,p.ry*.72,0,Math.PI*1.1,Math.PI*1.9);c.stroke();
      c.restore();return;
    }
    if(p.hoseSilt){
      c.clip(path);c.save();c.scale(p.rx,p.ry);
      const sediment=c.createRadialGradient(0,0,.1,0,0,1);
      sediment.addColorStop(0,'#58482bd4');sediment.addColorStop(.65,'#75613c92');sediment.addColorStop(1,'#75613c10');
      c.fillStyle=sediment;c.fillRect(-1.2,-1.2,2.4,2.4);c.restore();
      for(let i=0;i<150;i++){
        const x=(rand()-.5)*p.rx*2,y=(rand()-.5)*p.ry*2;
        c.fillStyle=i%3?'#b09c675a':'#352e2294';c.fillRect(x,y,.4+rand()*1.2,.5+rand());
      }
      c.restore();return;
    }
    if(p.tyreTrack){
      c.clip(path);c.fillStyle='#19251c4a';c.fill(path);
      // Oily tread darkens the aggregate; it does not reflect the sky like a
      // long blue puddle. Broken rubber marks and a faint sheen show its origin.
      c.lineWidth=1.8;
      for(let x=-p.rx;x<p.rx;x+=8){
        if(rand()<.18)continue;c.strokeStyle=rand()<.3?'#28312578':'#1520189c';
        c.beginPath();c.moveTo(x,-p.ry);c.lineTo(x+3.5,0);c.lineTo(x,p.ry);c.stroke();
      }
      for(let i=0;i<22;i++){
        const x=(rand()-.5)*p.rx*1.9,y=(rand()-.5)*p.ry*1.5;
        c.strokeStyle=['#a59a6542','#84739b36','#70918c40'][i%3];c.lineWidth=.6;
        c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+5,y-1,x+10+rand()*9,y+.5);c.stroke();
      }
      c.restore();return;
    }
    if(p.bootprint){
      c.clip(path);
      c.fillStyle='#66513778';c.fill(path);
      // Flat mud film with broken lug impressions, not another reflecting pool.
      for(let y=-p.ry;y<p.ry;y+=7){
        for(const side of [-1,1]){
          c.fillStyle=rand()>.25?'#4f402dba':'#6c583b8a';
          c.beginPath();c.moveTo(side*2,y);c.lineTo(side*12,y+2);c.lineTo(side*11,y+6);c.lineTo(side*2,y+4);c.closePath();c.fill();
        }
      }
      for(let i=0;i<90;i++){
        c.fillStyle=i%3?'#bcaa7945':'#362e2280';
        c.fillRect((rand()-.5)*p.rx*2,(rand()-.5)*p.ry*2,.4+rand()*1.1,.4+rand());
      }
      c.restore();return;
    }
    if(p.type==='stone'){paintSteppingStone(c,p,path,groundPatterns,rand);c.restore();return;}
    if (p.type === 'metal' && propSprites[0]) {
      // Keep the photographed iron face, but seat it flush in a narrow frame.
      // The atlas's thick bevel made the old cover read as a loose raised disc.
      ellipse(c,0,0,p.rx+2,p.ry+2,'#5a5c50');
      ellipse(c,0,0,p.rx+.6,p.ry+.6,'#1b2321');
      c.save();c.beginPath();c.ellipse(0,0,p.rx-1.3,p.ry-1.3,0,0,Math.PI*2);c.clip();
      c.drawImage(propSprites[0],39,46,182,178,-p.rx,-p.ry,p.rx*2,p.ry*2);
      ellipse(c,0,0,p.rx,p.ry,'#28342f35');c.restore();
      c.strokeStyle='#b0aa8b40';c.lineWidth=.6;c.beginPath();c.ellipse(0,0,p.rx+1,p.ry+1,0,.25,2.5);c.stroke();
      c.restore();return;
    }
    if (p.type === 'poop' && propSprites[3]) { c.drawImage(propSprites[3], -p.rx * 1.5, -p.ry * 1.5, p.rx * 3, p.ry * 3); c.restore(); return; }
    if (p.type === 'gum') {
      const {sprite,w,h}=gumSprite(p);c.drawImage(sprite,-w/2,-h/2,w,h);
      c.restore(); return;
    }
    if(p.workSpill){paintAggregateSpill(c,p,path,rand);c.restore();return;}
    if (p.type === 'gravel') {
      // Fine mineral grit settles into the existing asphalt. Keep grains at
      // shoe scale, with a dusty centre and scattered edges, rather than a
      // carpet of pale, equally sized stones. This is baked into terrain chunks.
      c.clip(path);
      c.save();c.scale(p.rx,p.ry);
      const dust=c.createRadialGradient(-.12,.08,.08,0,0,1.13);
      dust.addColorStop(0,'#aaa08a88');dust.addColorStop(.55,'#968c7359');dust.addColorStop(1,'#766c5500');
      c.fillStyle=dust;c.fillRect(-1.2,-1.2,2.4,2.4);c.restore();
      const count=Math.min(1100,Math.max(300,Math.floor(p.rx*p.ry*.34)));
      const palette=['#817d6f','#65665c','#a8a18d','#4d5149','#918b7a'];
      for(let i=0;i<count;i++){
        const x=(rand()-.5)*p.rx*2.3,y=(rand()-.5)*p.ry*2.3,r=Math.hypot(x/p.rx,y/p.ry);
        if(rand()>Math.max(0,1.15-r)*1.5)continue;
        const size=.35+rand()*1.05,h=size*(.55+rand()*.55);
        c.fillStyle='#252c2840';c.fillRect(x+.35,y+.45,size*1.7,h*1.4);
        c.fillStyle=palette[i%palette.length];c.beginPath();c.moveTo(x-size,y-h*.4);c.lineTo(x+size*.35,y-h);c.lineTo(x+size,y+h*.25);c.lineTo(x-size*.3,y+h);c.closePath();c.fill();
        if(i%5===0){c.fillStyle='#d2c7aa66';c.fillRect(x-size*.35,y-h*.65,size*.6,.35);}
      }
      c.restore(); return;
    }
    c.restore();
  }
  function clipSurface(c,p){
    c.clip(pathFor(p));if(!p.dirtRoad&&p.type!=='water')return;
    let clear=stoneClips.get(p.id);
    if(!clear){
      clear=new Path2D();clear.rect(-p.rx*2,-p.ry*2,p.rx*4,p.ry*4);
      for(const stone of ref.street.patches){
        if(p.dirtRoad?!stone.steppingStone:stone.type!=='stone'&&stone.type!=='metal')continue;
        const reach=(Math.max(p.rx,p.ry)+Math.max(stone.rx,stone.ry))*1.25;
        if(Math.abs(stone.x-p.x)>reach||Math.abs(stone.y-p.y)>reach)continue;
        const dx=stone.x-p.x,dy=p.y-stone.y,co=p.cos*stone.cos+p.sin*stone.sin,si=p.sin*stone.cos-p.cos*stone.sin;
        clear.addPath(pathFor(stone),new DOMMatrix([co,si,-si,co,dx*p.cos-dy*p.sin,dx*p.sin+dy*p.cos]));
      }
      stoneClips.set(p.id,clear);
    }
    // The preceding ground clip intersects this inverse stone mask. Mud waves
    // and rinsed pigment cannot draw through raised stones or drain covers.
    c.clip(clear,'evenodd');
  }
  function liquidTouches(a, b) {
    if (puddleDepth(a, b.x, b.y) > 0 || puddleDepth(b, a.x, a.y) > 0) return true;
    for (let i = 0; i < 40; i++) {
      const angle = i / 40 * Math.PI * 2;
      for (const [p, other] of [[a, b], [b, a]]) {
        const radius = boundary(p, angle), x = Math.cos(angle) * p.rx * radius, y = Math.sin(angle) * p.ry * radius;
        if (puddleDepth(other, p.x + x * p.cos - y * p.sin, p.y + x * p.sin + y * p.cos) > 0) return true;
      }
    }
    return false;
  }
  function connectedLiquid(type) {
    if (liquidGroups.has(type)) return liquidGroups.get(type);
    const groups = [];
    for (const p of ref.street.patches.filter(p => p.type === type && !p.groundField && !p.flatResidue && !p.binLeak)) {
      const ex = (p.rx * Math.abs(p.cos) + p.ry * Math.abs(p.sin)) * 1.16, ey = (p.rx * Math.abs(p.sin) + p.ry * Math.abs(p.cos)) * 1.16;
      const group = { patches: [p], surfaceFilm:Boolean(p.surfaceFilm), x0: p.x - ex, x1: p.x + ex, y0: p.y - ey, y1: p.y + ey };
      for (let i = 0; i < groups.length; i++) {
        const other = groups[i];
        if(group.surfaceFilm!==other.surfaceFilm)continue;
        if (group.x1 < other.x0 || group.x0 > other.x1 || group.y1 < other.y0 || group.y0 > other.y1 || !other.patches.some(q => liquidTouches(p, q))) continue;
        group.patches.push(...other.patches); group.x0 = Math.min(group.x0, other.x0); group.x1 = Math.max(group.x1, other.x1); group.y0 = Math.min(group.y0, other.y0); group.y1 = Math.max(group.y1, other.y1); groups.splice(i, 1); i = -1;
      }
      groups.push(group);
    }
    liquidGroups.set(type, groups); return groups;
  }
  function* paintLiquids(c, type, top, bottom, surfaceFilm=false) {
    const groups = connectedLiquid(type).filter(g => g.surfaceFilm===surfaceFilm && g.y1 > bottom - 16 && g.y0 < top + 16);
    if (!groups.length) return;
    // Shallow water lies ON the asphalt: translucent sky reflections, visible aggregate,
    // silt and a dark wet fringe. No raised-bank photographs or cast puddle shadows.
    const layer = makeCanvas(900, CHUNK + 32), lc = layer.getContext('2d');
    for (const group of groups) {
      const thinFilm=type==='oil'&&group.patches.some(p=>p.garageRunoff);
      const excavation=group.patches.every(p=>p.workPool);
      const shallow=type==='water'&&group.patches.every(p=>p.depth<=7);
      const union = new Path2D(), rand = randomSource(Math.floor(group.patches[0].seed * 1000));
      for (const p of group.patches) {
        for (let i = 0; i <= 72; i++) {
          const a = i / 72 * Math.PI * 2, radius = boundary(p, a), lx = Math.cos(a) * p.rx * radius, ly = Math.sin(a) * p.ry * radius;
          const x = p.x + lx * p.cos - ly * p.sin, y = top + 16 - p.y - lx * p.sin - ly * p.cos;
          if (!i) union.moveTo(x, y); else union.lineTo(x, y);
        }
        union.closePath();
      }
      const y0 = top + 16 - group.y1, height = group.y1 - group.y0;
      // Wet asphalt darkens under the meniscus; water does not cast a raised
      // sticker shadow outside its contact boundary.
      c.save();c.translate(0,-16);c.clip(union);c.strokeStyle='#1b2c304a';c.lineWidth=4;c.stroke(union);c.restore();
      lc.save(); lc.clip(union);
      const reflection = lc.createLinearGradient(group.x0, y0, group.x1, y0 + height);
      if (type === 'oil') {
        reflection.addColorStop(0, thinFilm?'#26323870':'#263238a8'); reflection.addColorStop(.45, thinFilm?'#53626b35':'#53626b86'); reflection.addColorStop(1, thinFilm?'#26312d85':'#26312dbb');
      } else {
        reflection.addColorStop(0, type === 'mud' ? '#8c887276' : '#afc0c9b5');
        reflection.addColorStop(.36, type === 'mud' ? '#7c807066' : '#9aafb8a0');
        reflection.addColorStop(.7, '#687d8670'); reflection.addColorStop(1, '#344b5455');
      }
      lc.globalAlpha=excavation?.55:shallow?.55:1;
      lc.fillStyle = reflection; lc.fillRect(group.x0, y0, group.x1 - group.x0, height);
      lc.globalAlpha=1;
      if (waterImage) {
        lc.globalAlpha = thinFilm?.28:excavation?.42:shallow?.38:.93;
        lc.drawImage(waterImage, group.x0, y0, group.x1 - group.x0, height);
        lc.globalAlpha = 1;
        lc.fillStyle = type === 'mud' ? '#76634535' : type === 'oil' ? '#16233165' : '#c1d0d513';
        lc.fillRect(group.x0, y0, group.x1 - group.x0, height);
      }
      // Submerged grit and road stains remain visible through the shallows.
      for (let i = 0; i < 110; i++) {
        const x = group.x0 + rand() * (group.x1 - group.x0), y = y0 + rand() * height;
        ellipse(lc, x, y, .3 + rand() * 1.5, .3 + rand() * .8, i % 3 ? '#25394020' : '#d5d9cc2b');
      }
      for (let i = 0; i < 5; i++) {
        const x = group.x0 + rand() * (group.x1 - group.x0), y = y0 + rand() * height;
        const cloud = lc.createRadialGradient(x, y, 0, x, y, 40 + rand() * 95);
        cloud.addColorStop(0, '#e4eced24'); cloud.addColorStop(1, '#e4eced00');
        lc.fillStyle = cloud; lc.fillRect(group.x0, y0, group.x1 - group.x0, height);
      }
      // A few subtle glints supplement the photographic reflections.
      for (let i = 0; i < 6; i++) {
        const x = group.x0 + rand() * (group.x1 - group.x0), y = y0 + rand() * height;
        lc.strokeStyle = type === 'oil' ? ['#b1a26d45', '#8c77af40', '#60a79e40'][i % 3] : '#dbe7e935'; lc.lineWidth = .5 + rand() * .6;
        lc.beginPath(); lc.ellipse(x, y, 9 + rand() * 35, 1 + rand() * 3, -.15, .2, 2.6); lc.stroke();
      }
      // Puddle edges still show road grain. The deeper bowl has a darker
      // centre, so players can read a rinsing margin without a HUD label.
      if(type==='water')for(const p of group.patches){
        if(p.depth<=7)continue;
        const shade=Math.min(.24,(p.depth-7)*.012);
        lc.save();lc.translate(p.x,top+16-p.y);lc.rotate(-Math.atan2(p.sin,p.cos));lc.scale(p.rx,p.ry);
        const bowl=lc.createRadialGradient(0,0,.08,0,0,.94);
        bowl.addColorStop(0,`rgba(22,39,43,${shade})`);bowl.addColorStop(.6,`rgba(28,44,47,${shade*.45})`);bowl.addColorStop(1,'rgba(28,44,47,0)');
        lc.fillStyle=bowl;lc.fillRect(-1,-1,2,2);lc.restore();
      }
      // A thin petrol film separates into elongated colours as the gutter
      // drains. Keep the asphalt visible and bake the sheen into the terrain.
      if(type==='oil')for(const p of group.patches.filter(p=>p.garageRunoff)){
        const film=randomSource(Math.floor(p.seed*171));
        for(let band=0;band<12;band++){
          const start=film()*Math.PI*2,span=.3+film()*.85,r=.35+film()*.6;
          lc.strokeStyle=['#8ba7ab42','#ac8bad40','#c1ae7b35'][band%3];lc.lineWidth=.6+film()*.9;
          lc.beginPath();
          for(let i=0;i<=20;i++){
            const a=start+i/20*span,wave=r+.09*Math.sin(a*5+p.seed)+.035*Math.sin(a*11);
            const x=p.x+Math.cos(a)*p.rx*wave,y=top+16-p.y+Math.sin(a)*p.ry*wave;
            if(!i)lc.moveTo(x,y);else lc.lineTo(x,y);
          }
          lc.stroke();
        }
      }
      lc.restore();yield;
    }
    c.drawImage(layer, 0, -16);yield;
    // Rain collects tiny leaves and a thin silt line along short stretches of
    // the waterline. These are baked into terrain, with no extra animation load.
    if(type==='water')for(const group of groups)for(const p of group.patches){
      if(p.rx<85)continue;
      const debris=randomSource(Math.floor(p.seed*977)+331),angle=debris()*Math.PI*2;
      const edge=a=>{const r=boundary(p,a)*.99,lx=Math.cos(a)*p.rx*r,ly=Math.sin(a)*p.ry*r;return{x:p.x+lx*p.cos-ly*p.sin,y:top-p.y-lx*p.sin-ly*p.cos};};
      c.save();c.strokeStyle='#6b60404d';c.lineWidth=1.3;c.beginPath();
      for(let n=0;n<=12;n++){const q=edge(angle+(n-6)*.024);if(n)c.lineTo(q.x,q.y);else c.moveTo(q.x,q.y);}c.stroke();
      for(let n=0;n<5;n++){const q=edge(angle+(debris()-.5)*.22);rainLeaf(c,q.x+(debris()-.5)*5,q.y+(debris()-.5)*5,2+debris()*2.4,debris()*6.28,['#635c39','#817247','#6d653d'][n%3]);}
      c.restore();
    }
  }

  function liquidMotionPath(group) {
    if(group.motionPath)return group.motionPath;
    const union=new Path2D();
    for(const p of group.patches){
      for(let i=0;i<=72;i++){
        const a=i/72*Math.PI*2,radius=boundary(p,a),x=Math.cos(a)*p.rx*radius,y=Math.sin(a)*p.ry*radius;
        const wx=p.x+x*p.cos-y*p.sin,wy=-p.y-x*p.sin-y*p.cos;
        if(!i)union.moveTo(wx,wy);else union.lineTo(wx,wy);
      }
      union.closePath();
    }
    group.motionPath=union;return union;
  }
  function paintWaterMotion(g, screenY, reduced) {
    if(!waterImage||reduced)return;
    for(const group of connectedLiquid('water')){
      if(screenY(group.y0)<0||screenY(group.y1)>viewH)continue;
      const x=group.x0,y=-group.y1,w=group.x1-x,h=group.y1-group.y0,phase=group.patches[0].seed;
      ctx.save();ctx.translate(0,screenY(0));ctx.clip(liquidMotionPath(group));
      // Calm reflections stay anchored. Only a faint breeze crosses the surface.
      for(let i=0;i<2;i++){
        const bandY=y+((g.time*4+i*h/2+phase*19)%h);
        const sample=reflectionSample(group,{x0:x,x1:x+w,y0:bandY,y1:bandY+5,dx:Math.sin(g.time*.7+i+phase),dy:.35},waterImage.width,waterImage.height);
        if(!sample)continue;ctx.globalAlpha=.055;
        ctx.drawImage(waterImage,sample.sx,sample.sy,sample.sw,sample.sh,sample.x,sample.y,sample.w,sample.h);
      }
      for(const r of g.rings){
        if(!group.patches.includes(r.patch))continue;
        const p=rippleProfile(r);if(!p||p.fade<.012)continue;
        const extent=Math.max(p.rx,p.ry)+p.width;
        if(screenY(r.y)+extent<0||screenY(r.y)-extent>viewH)continue;
        ctx.globalAlpha=p.fade*.62;
        for(const facet of reflectionFacets(r,p)){
          const sample=reflectionSample(group,facet,waterImage.width,waterImage.height);if(!sample)continue;
          ctx.save();ctx.beginPath();facet.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.clip();
          ctx.drawImage(waterImage,sample.sx,sample.sy,sample.sw,sample.sh,sample.x,sample.y,sample.w,sample.h);ctx.restore();
        }
      }
      ctx.globalAlpha=1;
      // Occasional drips stay inside the same shoreline as the reflected image.
      for(const p of group.patches){
        const age=(g.time+p.seed)%(2.6+p.seed%2);if(age>1)continue;
        const px=p.x+p.rx*.22,py=-p.y+p.ry*.12;
        for(let ring=0;ring<2;ring++){
          const a=age-ring*.13;if(a<0)continue;
          ctx.strokeStyle=`rgba(228,238,235,${(1-age)*(ring?.11:.19)})`;ctx.lineWidth=.6;
          ctx.beginPath();ctx.ellipse(px,py,2+a*28,1+a*17,0,0,Math.PI*2);ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function barrierSprite(o){
    const key=o.halfWidth+'-'+o.seed;if(barrierSprites.has(key))return barrierSprites.get(key);
    const w=o.halfWidth*2,c=makeCanvas(w+70,100),b=c.getContext('2d'),r=randomSource(o.seed*1000);
    b.translate(w/2+30,45);
    // Weighted rubber feet, galvanized frame, and a weathered reflective rail.
    b.fillStyle='#111e2355';b.beginPath();b.roundRect(-w/2+6,-11,w+10,36,10);b.fill();
    for(const x of [-w/2+28,w/2-28]){
      b.fillStyle='#10191466';b.beginPath();b.roundRect(x-16,-18,44,59,7);b.fill();
      const base=b.createLinearGradient(x-16,0,x+16,0);base.addColorStop(0,'#232726');base.addColorStop(.45,'#424742');base.addColorStop(1,'#202925');
      b.fillStyle=base;b.beginPath();b.roundRect(x-16,-23,32,47,5);b.fill();
      b.strokeStyle='#61655b66';b.lineWidth=1;b.stroke();
      for(const y of [-15,15]){b.fillStyle='#171f1c';b.fillRect(x-10,y,20,2);}
      b.fillStyle='#a5aaa0';b.fillRect(x-4,-19,8,37);b.fillStyle='#d5d4bf';b.fillRect(x-3,-19,2,37);
    }
    const rail=b.createLinearGradient(0,-13,0,14);rail.addColorStop(0,'#e6dfc9');rail.addColorStop(.17,'#c3c4b3');rail.addColorStop(.8,'#b1b5a9');rail.addColorStop(1,'#606d63');
    b.fillStyle=rail;b.beginPath();b.roundRect(-w/2,-14,w,28,3);b.fill();
    b.save();b.beginPath();b.rect(-w/2+4,-10,w-8,19);b.clip();b.fillStyle='#d5d2be';b.fillRect(-w/2,-10,w,19);
    for(let x=-w/2-30;x<w/2;x+=52){b.fillStyle='#a74f2e';b.beginPath();b.moveTo(x,-10);b.lineTo(x+25,-10);b.lineTo(x+8,9);b.lineTo(x-17,9);b.closePath();b.fill();}
    for(let n=0;n<280;n++){b.fillStyle=r()<.5?'#182b2233':'#f9f1d322';b.fillRect((r()-.5)*w,-10+r()*19,1+r()*4,.5+r()*1.4);}
    b.restore();b.fillStyle='#eee5ca80';b.fillRect(-w/2+3,-13,w-6,1);
    for(const x of [-w/2+10,w/2-10]){ellipse(b,x,0,3,3,'#4d574d');ellipse(b,x-.6,-.5,1.8,1.8,'#c7cbb7');}
    // Amber reflectors make the rail ends legible against wet asphalt.
    for(const x of [-w/2+28,w/2-28]){
      b.fillStyle='#26352d';b.fillRect(x-6,-31,12,14);
      ellipse(b,x,-30,8.5,8.5,'#574b2c');
      const lens=b.createRadialGradient(x-2,-33,1,x,-30,7);lens.addColorStop(0,'#f7d992');lens.addColorStop(.45,'#d99c32');lens.addColorStop(1,'#8f5d23');
      b.fillStyle=lens;b.beginPath();b.arc(x,-30,7,0,Math.PI*2);b.fill();
      b.strokeStyle='#f4dba14d';b.lineWidth=.7;for(const dy of [-3,0,3]){b.beginPath();b.moveTo(x-5,-30+dy);b.lineTo(x+5,-30+dy);b.stroke();}
    }
    barrierSprites.set(key,c);return c;
  }
  function tile(index) {
    if(chunks.has(index))return chunks.get(index);
    const job=tileJobs.get(index)||buildTile(index);
    // Startup or an unusually fast camera move can need a tile immediately.
    // Finish the same job, so a half-painted tile is never shown or rebuilt.
    while(!job.next().done){}
    tileJobs.delete(index);return chunks.get(index);
  }
  function* buildTile(index) {
    const tile = makeCanvas(900, CHUNK), c = tile.getContext('2d', { alpha: false }), top = (index + 1) * CHUNK, bottom = index * CHUNK;
    c.fillStyle = c.createPattern(texture, 'repeat'); c.fillRect(0, 0, 900, CHUNK);
    const sideLight = c.createLinearGradient(0, 0, 900, 0); sideLight.addColorStop(0, '#18202250'); sideLight.addColorStop(.4, '#fff2df08'); sideLight.addColorStop(1, '#121c2730'); c.fillStyle = sideLight; c.fillRect(0, 0, 900, CHUNK);
    // Neighborhood changes are baked into the same bounded terrain cache.
    const districtTints=['#b6a2830a','#2537471b','#544c3b21','#243c471e','#d8ba800c'];
    for(const district of ref.street.districts||[]){
      const low=Math.max(bottom,district.offset),high=Math.min(top,district.offset+DISTRICT_LENGTH);
      if(high<=low)continue;
      const tint=districtTints[district.index];
      if(tint){
        if(district.index){
          const transition=c.createLinearGradient(0,top-district.offset,0,top-district.offset-420);
          transition.addColorStop(0,districtTints[district.index-1]);transition.addColorStop(1,tint);c.fillStyle=transition;
        }else c.fillStyle=tint;
        c.fillRect(0,top-high,900,high-low);
      }
    }
    // The lane continues beyond the viewport; no decorative side walls.
    for (const bay of ref.street.parking || []) {
      if (Math.abs(bay.y - (top + bottom) / 2) > CHUNK / 2 + bay.length / 2 + 70) continue;
      c.save(); c.strokeStyle = '#d3ceac70'; c.lineWidth = 5; c.setLineDash([16, 7]);
      const edge = bay.x + (bay.side ? -1 : 1) * (CAR.halfWidth + 45), outer = bay.side ? 1120 : -220, sy = top - bay.y, halfBay = bay.length / 2 + 45;
      c.beginPath(); c.moveTo(outer, sy - halfBay); c.lineTo(edge, sy - halfBay); c.lineTo(edge, sy + halfBay); c.lineTo(outer, sy + halfBay); c.stroke(); c.restore();
    }
    yield;paintRoadWear(c,ref.street,top,bottom,groundPatterns.asphalt);yield;
    // A settled utility trench explains the diagonal runoff. Its rough tar
    // joints remain visible at the ends, without marking a recommended route.
    for(const p of ref.street.patches){
      if(!p.repairSeam||Math.abs(p.y-(top+bottom)/2)>CHUNK/2+180)continue;
      const r=randomSource(Math.floor(p.seed*1000)),length=p.rx*1.24;
      c.save();c.translate(p.x,top-p.y);c.rotate(-Math.atan2(p.sin,p.cos));
      c.fillStyle='#1b242930';c.beginPath();
      for(let i=0;i<=24;i++){const x=-length+i*length/12,y=-17+(r()-.5)*5;if(!i)c.moveTo(x,y);else c.lineTo(x,y);}
      for(let i=24;i>=0;i--)c.lineTo(-length+i*length/12,17+(r()-.5)*5);
      c.closePath();c.fill();
      for(const edge of [-17,17]){
        c.strokeStyle='#14202675';c.lineWidth=2.2;c.beginPath();
        for(let i=0;i<=32;i++){const x=-length+i*length/16,y=edge+(r()-.5)*4;if(!i)c.moveTo(x,y);else c.lineTo(x,y);}
        c.stroke();
      }
      for(let i=0;i<130;i++){const x=(r()-.5)*length*2,y=(r()-.5)*31;c.fillStyle=i%2?'#ccd0c921':'#0f1d2730';c.fillRect(x,y,.6+r()*1.4,.7+r());}
      c.restore();
    }
    for(const p of ref.street.patches)if(p.underlay&&p.y+Math.max(p.rx,p.ry)*1.3>bottom&&p.y-Math.max(p.rx,p.ry)*1.3<top){paintPatch(c,p,top-p.y);yield;}
    for (const type of ['water', 'mud', 'oil']) yield* paintLiquids(c, type, top, bottom);
    for (const p of ref.street.patches) if (!p.underlay && !p.contaminant && (p.groundField || p.flatResidue || p.binLeak || !MATERIALS[p.type].liquid) && (!MATERIALS[p.type].sticky || p.bakedSticky) && p.y + Math.max(p.rx, p.ry) * 1.3 > bottom && p.y - Math.max(p.rx, p.ry) * 1.3 < top) {paintPatch(c, p, top - p.y);yield;}
    // Fresh runoff and silt sit on top of exposed aggregate, matching their
    // contact priority. The broken shoulder must not hide a visible wet hazard.
    for(const type of ['mud','oil','water'])yield* paintLiquids(c,type,top,bottom,true);
    // Fresh contaminants sit on the road's wet films, below raised iron/stone.
    // One inverse mask per tile keeps their visible boundary honest at footholds.
    const spills=ref.street.patches.filter(p=>p.contaminant&&p.y+p.ry*1.4>bottom&&p.y-p.ry*1.4<top);
    if(spills.length){
      const clear=new Path2D();clear.rect(0,0,900,CHUNK);
      for(const p of ref.street.patches)if((p.type==='metal'||p.type==='stone')&&p.y+p.ry*1.4>bottom&&p.y-p.ry*1.4<top)
        clear.addPath(pathFor(p),new DOMMatrix([p.cos,-p.sin,p.sin,p.cos,p.x,top-p.y]));
      c.save();c.clip(clear,'evenodd');for(const p of spills){paintPatch(c,p,top-p.y);yield;}c.restore();
    }
    // Flush stone aprons give both ends a clean, believable place to stand.
    for (const finish of [false, true]) {
      const edge = finish ? PAVEMENT.finishStart : PAVEMENT.startEnd;
      const low = finish ? Math.max(bottom, edge) : bottom;
      const high = finish ? top : Math.min(top, edge);
      if (high <= low) continue;
      c.save(); c.translate(0, top); c.scale(1, -1);
      c.beginPath(); c.rect(0, low, 900, high - low); c.clip();
      paintPaving(c,curbing,0,low,900,high-low,finish?'home':'doorsteps',ref.street.seed,450-48);
      // A flat edging course meets the asphalt, without a step to jump over.
      const borderY = finish ? edge : edge - 22;
      c.fillStyle = c.createPattern(curbing, 'repeat'); c.fillRect(0, borderY, 900, 22);
      c.fillStyle = '#41484040'; c.fillRect(0, edge - .6, 900, 1.2);
      for (let x = 90; x < 900; x += 180) { c.fillStyle = '#4d554238'; c.fillRect(x, borderY, 1, 22); }
      // Small inset grass beds stay entirely outside the playable pavement.
      const bedY = finish ? edge + 90 : edge - 390;
      for (const x of [-34,812])paintPlantingBed(c,curbing,soil,x,bedY,119,300,ref.street.seed+x,{grass,low:Math.max(low,bedY),high:Math.min(high,bedY+300)});
      c.restore();
    }
    yield;neighborhood.paintVerge(c, ref.street, top, bottom);yield;
    yield* neighborhood.paintGroundSteps(c, ref.street, top, bottom);yield;
    for(const p of ref.street.patches)if(p.dirtRoad&&p.y+p.ry>bottom&&p.y-p.ry<top)
      paintWashoutMouth(c,p,top-p.y,groundPatterns,randomSource(Math.floor(p.seed*1000)^0x5a71));
    // The garage overflow comes from a leaf-clogged curb drain. Its frame sits
    // outside the walking lane, so the visible dry tip remains a usable exit.
    for(const p of ref.street.patches){
      if(!p.garageRunoff||Math.abs(p.y-(top+bottom)/2)>CHUNK/2+105)continue;
      const side=p.gutterSide,edge=side?796:104,x=side?788:112,sy=top-p.y;
      paintCurbDrain(c,curbing,edge,sy,side,Math.floor(p.seed*773));
      c.save();c.translate(x,sy);
      for(let n=0;n<7;n++)rainLeaf(c,-14+n*4,24+Math.sin(n*2)*4,3+n%2,n*1.9,['#655337','#847246','#a18a56'][n%3]);
      c.restore();
    }
    for (const item of ref.street.clutter) {
      if(looseDebris?.sources.has(item))continue;
      if (item.y < bottom - 20 || item.y > top + 20) continue;
      c.save(); c.translate(item.x, top - item.y); c.rotate(item.angle);
      if (item.type < 4) {
        c.beginPath(); c.moveTo(0, -item.size); c.bezierCurveTo(item.size * .8, -item.size * .6, item.size, item.size * .6, 0, item.size); c.bezierCurveTo(-item.size * .8, item.size * .5, -item.size * .7, -item.size * .4, 0, -item.size);
        c.fillStyle = ['#93733f', '#857445', '#a38b57', '#4b5e34'][item.type]; c.fill();
        c.strokeStyle = '#403d2b88'; c.lineWidth = .6; c.beginPath(); c.moveTo(0, -item.size); c.lineTo(0, item.size + 2); c.stroke();
      } else if (item.type === 4) { c.fillStyle = '#c7bba0'; c.fillRect(-1.4, -6, 2.8, 12); c.fillStyle = '#bd8755'; c.fillRect(-1.4, 3, 2.8, 4); }
      else if (item.type === 5) { c.fillStyle = '#a7a69a9a'; c.beginPath(); c.moveTo(-5, -6); c.lineTo(7, -3); c.lineTo(5, 7); c.lineTo(-5, 4); c.fill(); c.strokeStyle = '#e3d6bf66'; c.stroke(); }
      else ellipse(c, 0, 0, item.size / 3, item.size / 4, '#bbb7a26a');
      c.restore();
    }
    for (let y = 980 + Math.ceil((bottom - 105 - 980) / 1560) * 1560; y < top + 105; y += 1560) {
      if (y < 800 || y > ROAD.finish - 400) continue;
      const district=ref.street.districts?.find(d=>y>=d.offset&&y<d.offset+DISTRICT_LENGTH);
      const side=district?.street.parkingSide??ref.street.parkingSide,x=side?788:112;
      paintCurbDrain(c,curbing,side?796:104,top-y,side,ref.street.seed+Math.floor(y));
      const debris=randomSource(ref.street.seed+Math.floor(y));
      for(let n=0;n<11;n++)rainLeaf(c,x+(debris()-.5)*39,top-y-30+debris()*19,2.3+debris()*3.4,debris()*6.28,['#514b31','#777047','#856b3e'][n%3]);
      c.fillStyle='#b7b39766';for(let n=0;n<14;n++)c.fillRect(x+(debris()-.5)*42,top-y-42+debris()*8,.5+debris(),.7);
    }
    const roofY=top-ROAD.finish-HOME.porchTop;
    const porchVisible=ROAD.finish+420>bottom&&ROAD.finish-120<top;
    if(roofY>0||porchVisible){
      yield* prepareDoorstep();
      doorstep.paintRoof(c,roofY);
    }
    if(porchVisible){
      c.drawImage(doorstep.porch,0,roofY);
      c.fillStyle='#1d2a24';c.fillRect(0,roofY-3,900,3);
      c.fillStyle='#879084';c.fillRect(0,roofY-3,900,.7);
    }
    chunks.set(index, tile); metrics.generated++;
    // Very tall viewports can show more than five chunks. Never evict an on-screen
    // tile just to warm the next one; keep memory bounded by the actual viewport.
    const limit=Math.max(MAX_CHUNKS,Math.ceil(viewH/CHUNK)+2);
    if (chunks.size > limit) { let farthest, distance = -1; for (const key of chunks.keys()) { const d = Math.abs(key - (camera+viewH/2)/CHUNK); if (d > distance) { farthest = key; distance = d; } } chunks.delete(farthest); }
    metrics.chunks = chunks.size; metrics.cacheBytes = chunks.size * 900 * CHUNK * 4;
    return tile;
  }
  function warmNext(g) {
    if(warmJob!==null||document.hidden||g.phase==='finished')return;
    const next=Math.floor((camera+viewH)/CHUNK)+1;
    // Drop abandoned partial tiles after a camera jump; only one may be warming.
    for(const key of tileJobs.keys())if(key!==next)tileJobs.delete(key);
    // Tall phone views can already see well beyond the finish. Warm that
    // visible part of home too, rather than stopping at a desktop-sized apron.
    if(chunks.has(next)||next>Math.floor((ROAD.finish+viewH+400)/CHUNK))return;
    warmJob=scheduleWarm(deadline=>{
      warmJob=null;
      if(ref!==g||g.phase==='finished'||document.hidden||(!deadline.didTimeout&&deadline.timeRemaining()<3))return;
      if(chunks.has(next))return;
      const start=performance.now(),job=tileJobs.get(next)||buildTile(next);
      tileJobs.set(next,job);
      // Yield between complete paint operations. A whole detailed street tile
      // used to block input and animation in a single long idle callback.
      // A busy browser can starve idle work. Give timed-out callbacks a small
      // two-millisecond budget: one operation per frame falls behind on tall
      // phone screens, even when those operations are individually very cheap.
      const budget=deadline.didTimeout?2:4;
      do{
        if(job.next().done){tileJobs.delete(next);metrics.prefetched++;break;}
      }while(performance.now()-start<budget&&(deadline.didTimeout||deadline.timeRemaining()>2));
      const elapsed=performance.now()-start;
      metrics.warmMilliseconds+=elapsed;metrics.warmLongestSlice=Math.max(metrics.warmLongestSlice,elapsed);
    });
  }
  async function prime(g,reduced=false){
    // Finish the opening view and its first approaching tile before enabling
    // play. A tall viewport can sit just short of a tile boundary; that next
    // tile must not depend on the player waiting on the intro screen.
    // Yield between paint operations so loading stays responsive.
    prepare(g,performance.now(),1,reduced);
    const low=Math.floor(camera/CHUNK),high=Math.floor((camera+viewH)/CHUNK)+1;
    metrics.startupLongestSlice=0;
    for(let index=low;index<=high;index++){
      if(chunks.has(index))continue;
      const job=buildTile(index);let done=false;
      do{
        if(ref!==g)return false;
        const start=performance.now();
        do{done=job.next().done;}while(!done&&performance.now()-start<4);
        metrics.startupLongestSlice=Math.max(metrics.startupLongestSlice,performance.now()-start);
        if(!done)await yieldTask();
      }while(!done);
    }
    return true;
  }
  function updateShoe(g, f) {
    if (revisions[f.side] === f.revision) return;
    const c = sprites[f.side].getContext('2d'); c.clearRect(0, 0, 96, 224); c.drawImage(cleanSprites[f.side], 0, 0);
    if (g.shoeId !== 'leather') {
      c.globalCompositeOperation = 'source-atop'; c.strokeStyle = g.shoeId === 'knit' ? '#68766b30' : '#78816b18'; c.lineWidth = .65;
      for (let y = 4; y < 224; y += 3) { c.beginPath(); c.moveTo(0, y); c.lineTo(96, y + 6); c.stroke(); }
      c.globalCompositeOperation = 'source-over';
    }
    paintShoeWear(c,f);
    c.globalCompositeOperation='destination-in';c.drawImage(cleanSprites[f.side],0,0);c.globalCompositeOperation='source-over';
    // The underside carries sticky litter and tracked residue; the visible upper doesn't.
    // Drying changes the upper on every contact tick, but the sole photograph
    // only changes when a zone gains a new stain. Keep its raster until then.
    if(f.sole.some((zone,i)=>zone.stain!==soleStains[f.side][i]||zone.stainType!==soleTypes[f.side][i]))updateSole(f);
    revisions[f.side] = f.revision;
    paintedAt[f.side] = g.time;
  }
  function updateSole(f) {
    const noise=n=>{const v=Math.sin(n*127.1+f.side*311.7)*43758.5453;return v-Math.floor(v);};
    const sc=soles[f.side].getContext('2d');sc.clearRect(0,0,96,224);sc.drawImage(cleanSoles[f.side],0,0);
    sc.globalCompositeOperation='source-atop';
    f.sole.forEach((zone,i)=>{
      soleStains[f.side][i]=zone.stain;soleTypes[f.side][i]=zone.stainType;
      if(!zone.stain)return;
      const x=i%2*48,y=Math.floor(i/2)*56;
      sc.fillStyle=rgba(zone.stainType,Math.min(.94,zone.stain*1.7));sc.fillRect(x,y,48,56);
      for(let k=0;k<28;k++){
        const px=x+noise(i*50+k+300)*48,py=y+noise(i*50+k+600)*56;
        const lump=['mud','poop','gum','clay','tar','cement'].includes(zone.stainType),r=lump?1+zone.stain*3:.5+zone.stain;
        ellipse(sc,px,py,r,r*.7,rgba(zone.stainType,Math.min(.9,zone.stain*2)));
      }
    });
    sc.globalCompositeOperation='source-over';
    metrics.solePaints++;
  }
  function shoe(c, f, w, h, pose) {
    if (!pose) { c.drawImage(soles[f.side],-w/2,-h/2+2,w,h);c.drawImage(sprites[f.side], -w / 2, -h / 2, w, h); return; }
    // Heel-to-toe flex: deform the cached stained upper, keeping every mark attached.
    const heelLift = pose.roll * h * .09;
    c.drawImage(soles[f.side], -w / 2, -h / 2 + 1.6 + Math.abs(heelLift), w, h);
    for (let i = 0; i < 16; i++) {
      const v = i / 16, next = (i + 1) / 16;
      const bend = t => Math.sin(t * Math.PI) * heelLift;
      const y0 = -h / 2 + v * h + bend(v), y1 = -h / 2 + next * h + bend(next);
      c.drawImage(sprites[f.side], 0, i * 14, 96, 14, -w / 2, y0, w, y1 - y0 + .3);
    }
  }
  function drawLeg(g, f, pose, center, reduced) {
    const breath = reduced ? 0 : Math.sin(g.time * 1.8) * .65;
    // Keep the mesh near its own origin so translating a leg doesn't change
    // subpixel texture sampling or the antialiasing of its triangle joins.
    const rows=legRows({...pose,x:0,y:0},SHOES[g.shoeId],f.side,f.z,center-pose.x,viewH-pose.y,breath,legMeshes[f.side]);
    legHits.push({side:f.side,x:pose.x,y:pose.y,rows});
    ctx.save();ctx.translate(pose.x,pose.y);
    paintDenim(ctx,g,f,rows,viewH-pose.y);
    ctx.restore();
  }
  function resize(now) {
    if (now - lastResize < 200 && rect) return;
    rect = canvas.getBoundingClientRect(); lastResize = now;
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) { canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); }
    // Keep the whole playable width visible, including a route around every obstacle.
    const worldWidth = rect.width < 600 ? 760 : 900; offset = (900 - worldWidth) / 2; scale = rect.width / worldWidth; viewH = rect.height / scale;
  }
  function prepare(g, now, dt, reduced = false) {
    if (preparedAt === now && ref === g) return;
    preparedAt = now;
    const fresh = ref !== g;
    if (fresh) {
      legHits.length=0;
      if(warmJob!==null){cancelWarm(warmJob);warmJob=null;}
      ref = g; fleet=vehicleLineup(g.street);stickyPatches=g.street.patches.filter(p=>MATERIALS[p.type].sticky&&!p.bakedSticky); chunks.clear();tileJobs.clear();barrierSprites.clear();gumSprites.clear();metrics.litterSprites=metrics.litterCacheBytes=0; paths.clear();stoneClips.clear(); liquidGroups.clear(); revisions.fill(-1); paintedAt.fill(-1); soleStains.forEach(a=>a.fill(-1)); camera = 0; lastInspection = lastResultInspection = ''; metrics.generated = metrics.prefetched = metrics.visibleMisses = metrics.warmMilliseconds = metrics.warmLongestSlice = metrics.solePaints = 0;
    }
    if(looseDebris?.street!==g.street)looseDebris=createLooseDebris(g);
    updateLooseDebris(looseDebris,g);
    neighborhood.update(g,reduced);
    resize(now);
    const targetCam = cameraTarget(g,viewH,scale);
    if (fresh) camera = targetCam;
    camera += (targetCam - camera) * (reduced ? 1 : 1 - Math.exp(-dt * 10));
  }
  function render(g, now, dt, reduced = false) {
    prepare(g, now, dt, reduced);
    legHits.length=0;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -offset * dpr * scale, 0);
    const screenY = y => viewH - y + camera;
    const low = Math.floor(camera / CHUNK), high = Math.floor((camera + viewH) / CHUNK);
    for (let b = low; b <= high; b++) {
      // Adjacent tiles meet on device pixels, avoiding hairline gaps during camera motion.
      const pixels = dpr * scale, top = Math.round(screenY((b + 1) * CHUNK) * pixels) / pixels;
      const bottom = Math.round(screenY(b * CHUNK) * pixels) / pixels;
      if(!chunks.has(b))metrics.visibleMisses++;
      ctx.drawImage(tile(b), 0, top, 900, bottom - top);
    }
    paintWaterMotion(g, screenY, reduced);
    paintDebris(ctx,looseDebris,screenY,viewH,reduced);
    // Sticky litter cannot live in baked street tiles: its raised lump spreads
    // under a shoe and stays flattened after the player moves away.
    for(const p of stickyPatches){
      const y=screenY(p.y);if(y< -80||y>viewH+80)continue;
      paintPatch(ctx,p,y,g.pressedPatches?.get(p)||0);
    }
    for (const car of g.street.parking || []) {
      const y = screenY(car.y); if (y < -car.length / 2 - 30 || y > viewH + car.length / 2 + 30) continue;
      ctx.save(); ctx.translate(car.x, y); ctx.rotate(car.angle);
      const sprite=carSprites.get(fleet.get(car));
      if (sprite) ctx.drawImage(sprite, -car.width / 2 - 20, -car.length / 2 - 20, car.width + 40, car.length + 40); ctx.restore();
    }
    for (const o of g.street.obstacles) {
      if(Math.abs(o.y-(camera+viewH/2))>=viewH/2+250)continue;
      const y = screenY(o.y);
      if(o.type==='barrier')ctx.drawImage(barrierSprite(o),o.x-o.halfWidth-30,y-45);
      if (o.type === 'bollard' && propSprites[2]) { ellipse(ctx, o.x + 9, y + 9, o.r * 1.1, o.r, '#18242a66'); ctx.drawImage(propSprites[2], o.x - o.r * 1.58, y - o.r * 1.58, o.r * 3.16, o.r * 3.16); }
    }
    paintGroundContacts(ctx,g,screenY,viewH,printSprite,pathFor,reduced,clipSurface);
    footprints.paint(ctx,g,screenY,viewH);
    if(g.arrival){
      // A little of the arrival dirt stays in the coir. These marks are visual;
      // wiping cannot improve the already banked cleanliness result.
      const a=g.arrival,m=HOME.mat,top=screenY(ROAD.finish+HOME.porchTop-m.y);
      ctx.save();ctx.beginPath();ctx.rect(m.x+5,top+5,m.width-10,m.height-10);ctx.clip();ctx.lineCap='round';
      for(const f of g.feet){
        const rubbed=a.wiped[f.side],load=f.sole.reduce((worst,z)=>z.stain>worst.stain?z:worst,f.sole[0]);
        if(!rubbed||!load.stain)continue;
        ctx.strokeStyle=rgba(load.stainType,Math.min(.3,load.stain*.3)*rubbed);ctx.lineWidth=2.2;
        for(let i=0;i<7;i++){const x=(f.side?480:420)-10+i*3.2;ctx.beginPath();ctx.moveTo(x,screenY(a.matY)-21);ctx.lineTo(x+.8,screenY(a.matY)+18+rubbed*15);ctx.stroke();}
      }
      ctx.restore();
    }
    metrics.footprintCacheBytes=footprints.metrics.cacheBytes;
    metrics.footprintsPrepared=footprints.metrics.prepared;
    for (const smear of g.smears) { const y = screenY(smear.y); if (y > -20 && y < viewH + 20) ellipse(ctx, smear.x, y, smear.r, smear.r * .7, rgba(smear.type, smear.alpha)); }
    for(const piece of g.crumbs){
      const y=screenY(piece.y);if(y< -10||y>viewH+10)continue;
      const age=g.time-piece.born,wet=piece.wet*Math.exp(-age/18),fade=Math.min(1,(75-age)/12),color=MATERIALS[piece.type].color;
      ctx.save();ctx.translate(piece.x,y);ctx.rotate(piece.seed%6.28);ctx.globalAlpha=fade;
      ellipse(ctx,.35,.5,piece.r*1.1,piece.r*.65,'#151b1480');
      ctx.beginPath();for(let j=0;j<7;j++){const a=j/7*Math.PI*2,r=piece.r*(.75+.2*Math.sin(j*4.7+piece.seed));if(j)ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*.7);else ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r*.7);}ctx.closePath();
      ctx.fillStyle=`rgb(${color.map(v=>Math.round(v+(1-wet)*19-wet*13)).join(',')})`;ctx.fill();
      ellipse(ctx,-piece.r*.23,-piece.r*.23,piece.r*.36,piece.r*.13,`rgba(204,191,152,${.15+wet*.15})`);ctx.restore();
    }
    for(const r of g.rings){
      const p=rippleProfile(r,reduced);if(!p)continue;
      const y=screenY(r.y),extent=Math.max(p.rx,p.ry)+p.width;if(y< -extent||y>viewH+extent)continue;
      ctx.save();
      const group=!r.patch.groundField&&connectedLiquid(r.patch.type).find(group=>group.patches.includes(r.patch));
      if(group){
        // A wave can cross overlapping puddles without a false seam between them.
        ctx.translate(0,screenY(0));ctx.clip(liquidMotionPath(group));ctx.translate(r.x,-r.y);
      }else{
        ctx.translate(r.patch.x,screenY(r.patch.y));ctx.rotate(-Math.atan2(r.patch.sin,r.patch.cos));clipSurface(ctx,r.patch);ctx.rotate(Math.atan2(r.patch.sin,r.patch.cos));
        ctx.translate(r.x-r.patch.x,r.patch.y-r.y);
      }
      ctx.rotate(r.angle||0);
      ctx.lineWidth=.75;ctx.strokeStyle=`rgba(29,45,41,${p.fade*.24})`;ctx.beginPath();ctx.ellipse(0,.6,p.rx,p.ry,0,0,Math.PI*2);ctx.stroke();
      // Reflected light catches one face of a wave, rather than outlining it.
      ctx.strokeStyle=`rgba(225,233,234,${p.fade*.43})`;ctx.beginPath();ctx.ellipse(0,0,p.rx,p.ry,0,Math.PI*1.04,Math.PI*1.89);ctx.stroke();
      ctx.strokeStyle=`rgba(225,233,234,${p.fade*.16})`;ctx.beginPath();ctx.ellipse(0,0,p.rx,p.ry,0,.15,2.5);ctx.stroke();
      if(p.secondary){
        ctx.strokeStyle=`rgba(225,233,234,${p.fade*.16})`;ctx.beginPath();ctx.ellipse(0,0,Math.max(1,p.rx-6),Math.max(1,p.ry-5),0,Math.PI*1.08,Math.PI*1.84);ctx.stroke();
      }
      ctx.restore();
    }
    if (g.phase === 'walking' && (g.preview || g.mode === 'charging')) {
      const target = g.preview || predictedTarget(g), s = SHOES[g.shoeId];
      // Red means this move is invalid or crosses an obstacle. Dirt and water
      // remain ordinary footholds: the preview never rates their cleanliness.
      const blocked = target.valid === false || target.blocked;
      ctx.save();
      ctx.translate(target.x, screenY(target.y)); ctx.rotate(target.angle ?? 0);
      ctx.globalAlpha = blocked ? .6 : .38;
      ctx.drawImage((blocked ? blockedSprites : cleanSprites)[g.active], -s.width/2, -s.length/2, s.width, s.length);
      ctx.restore();
    }
    neighborhood.paintLife(ctx, g, screenY, reduced, viewH);
    const shift = reduced ? 0 : (g.mode === 'charging' ? (g.active ? -4 : 4) * g.charge : Math.sin(g.time * 1.8) * .7);
    const center = (g.feet[0].x + g.feet[1].x) / 2 + shift;
    // Contact can dirty both shoes on the same physics tick. Spread those two
    // raster jobs over adjacent frames; neither shoe waits more than one frame.
    // Initial and finished pairs are always painted together, in full detail.
    const staggerWear=g.phase==='walking'&&revisions.every(n=>n>=0)&&g.feet.every(f=>revisions[f.side]!==f.revision);
    const paintSide=paintedAt[0]===paintedAt[1]?g.active:paintedAt[0]<paintedAt[1]?0:1;
    for (const f of [...g.feet].sort((a, b) => a.z - b.z)) {
      if(!staggerWear||f.side===paintSide)updateShoe(g, f);
      const s = SHOES[g.shoeId], y = screenY(f.y), pose = footPose(g, f, y, reduced);
      ctx.save();ctx.translate(f.x+1.5+f.z*.12,y+1.5+f.z*.06);ctx.rotate(f.angle);
      const lift=clamp(f.z/38,0,2),low=Math.floor(lift),high=Math.min(2,low+1),blend=lift-low,opacity=.44-clamp(f.z/180,0,.2);
      for(const [level,weight] of [[low,1-blend],[high,blend]])if(weight){ctx.globalAlpha=opacity*weight;ctx.drawImage(shoeShadows[f.side][level],-s.width/2-s.width/3,-s.length/2-s.length/7,s.width*160/96,s.length*288/224);}
      ctx.restore();
      ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate(pose.angle); ctx.scale(pose.sx, pose.sy);
      if (f.side === g.active && ['ready', 'walking'].includes(g.phase) && g.mode !== 'flight') {
        ctx.strokeStyle = '#f5efcfaa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -5, s.width * .69, s.length * .55, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      }
      shoe(ctx, f, s.width, s.length, pose); ctx.restore();
      drawLeg(g, f, pose, center, reduced);
    }
    paintStickyThreads(ctx,g,screenY);
    neighborhood.paintAir(ctx, g, screenY, reduced, viewH);
    for (const p of g.particles) { ellipse(ctx, p.x + 4, screenY(p.y) + 2, p.r, p.r * .5, '#14233225'); ellipse(ctx, p.x, screenY(p.y) - p.z * .65, p.r, p.r * 1.2, rgba(p.type, .85)); }
    if (g.precisionAim && g.preview && g.phase === 'walking' && g.mode === 'idle') {
      // Copy only the small landing area before drawing the lens, avoiding feedback.
      const target = g.preview, blocked = target.valid === false || target.blocked;
      const color = blocked ? '#ed514a' : '#f5efcf', diameter = rect.width < 600 ? 108 : 126;
      const px = (target.x - offset) * scale, py = screenY(target.y) * scale;
      const sourceSize = Math.max(SHOES[g.shoeId].length * scale * 1.25, diameter / 2);
      lensContext.fillStyle = '#535d55'; lensContext.fillRect(0, 0, 160, 160);
      lensContext.drawImage(canvas, (px - sourceSize / 2) * dpr, (py - sourceSize / 2) * dpr, sourceSize * dpr, sourceSize * dpr, 0, 0, 160, 160);
      const radius = diameter / 2, x = clamp(px, radius + 14, rect.width - radius - 14);
      const y = clamp(py - radius - 80, radius + 90, rect.height - radius - 45);
      ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = blocked ? '#ed514aaa' : '#f4ffdb70'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(x, y + radius); ctx.lineTo(px, py - 22); ctx.stroke(); ctx.setLineDash([]);
      ctx.shadowColor = '#10271d65'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#fffbed'; ctx.beginPath(); ctx.arc(x, y, radius + 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(lens, x - radius, y - radius, diameter, diameter); ctx.restore();
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    const key = g.shoeId + '-' + revisions.join('-') + '-' + g.active;
    if (inspection && key !== lastInspection) {
      paintShoePair(inspection,g);
      lastInspection = key; inspection.setAttribute('aria-label', `Left shoe ${condition(g, 0).toFixed(1)}% clean; right shoe ${condition(g, 1).toFixed(1)}% clean. Upper, rim and tread contamination included.`);
    }
    if (resultInspection && g.phase === 'finished' && lastResultInspection !== key) {
      paintShoePair(resultInspection,g);
      resultInspection.setAttribute('aria-label', `Your shoes after the walk. ${condition(g).toFixed(1)}% clean.`);
      lastResultInspection = key;
    }
    warmNext(g);
    if(g.arrival?.fade){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=`rgba(255,255,255,${g.arrival.fade})`;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();}
  }
  function paintShoePair(target,g) {
    const c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);
    c.save();c.scale(target.width/360,target.height/220);
    for(const f of g.feet){c.save();c.translate(f.side?238:122,110);shoe(c,f,77,177);c.restore();}
    c.restore();
  }
  function worldPoint(clientX, clientY) {
    const box = rect || canvas.getBoundingClientRect();
    return { x: (clientX - box.left) / scale + offset, y: viewH - (clientY - box.top) / scale + camera };
  }
  function screenPoint(point) {
    const box = rect || canvas.getBoundingClientRect();
    return { x: box.left + (point.x - offset) * scale, y: box.top + (viewH - point.y + camera) * scale };
  }
  function legAtPoint(clientX,clientY) {
    const box=rect||canvas.getBoundingClientRect();
    const x=(clientX-box.left)/scale+offset,y=(clientY-box.top)/scale;
    // Follow paint order when a crossed stance overlaps the two legs.
    for(let i=legHits.length-1;i>=0;i--){
      const hit=legHits[i];
      if(legContains(hit.rows,x-hit.x,y-hit.y))return hit.side;
    }
    return null;
  }
  return { prime, prepare, render, worldPoint, screenPoint, legAtPoint, mask, metrics, takeSceneEvents:neighborhood.takeEvents, debrisState:()=>looseDebris?.items.filter(item=>item.hits).map(item=>({type:item.type,hits:item.hits,wet:item.wet,pressure:item.pressure,source:{x:item.x,y:item.y},pose:debrisPose(item,looseDebris.time)}))||[], wildlifeState:neighborhood.wildlifeState, sceneState:neighborhood.sceneState, vehicleState:()=>[...fleet].map(([car,id])=>({id,x:car.x,y:car.y,side:car.side})), invalidateSize: () => { rect = null; preparedAt = -1; }, assetsReady: Boolean(shoeImage && asphalt && atlas && denim && terrain && carImages.every(Boolean) && waterImage && bushImage && neighborhoodAtlas && lifeAtlas && awakeCat && doorstepDetails && pavingImage && everydayAtlas) };
}
