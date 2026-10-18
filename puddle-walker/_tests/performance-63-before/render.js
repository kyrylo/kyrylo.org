import { VEHICLES, vehicleLineup } from './vehicles.js?v=perf-62';
import { SHOE_CROP, SHOE_MASK } from './sprite-data.js?v=perf-62';
import { createDenim, legRows } from './denim.js?v=perf-62';
import { createShoeWear } from './shoe-wear.js?v=perf-62';
import { ROAD, PAVEMENT, SHOES, MATERIALS, boundary, randomSource, condition, predictedTarget, surfaceAt, footPoint, clamp, puddleDepth, DISTRICT_LENGTH, CAR } from './model.js?v=perf-62';
import { createNeighborhood } from './neighborhood.js?v=perf-62';
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
const CHUNK = 768, MAX_CHUNKS = 5;
export function footPose(g, f, sy, reduced) {
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
export async function createRenderer(canvas, inspection, resultInspection = null, menuInspection = null) {
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }), inspect = inspection.getContext('2d');
  const lens = makeCanvas(160, 160), lensContext = lens.getContext('2d', {alpha:false});
  const [shoeImage, asphalt, atlas, denim, terrain, carImage, waterImage, bushImage, neighborhoodAtlas, lifeAtlas, awakeCat, doorstepDetails, pavingImage, ...extraCars] = await Promise.all(['white-sneaker.webp', 'asphalt.webp', 'street-props.webp', 'denim.webp', 'terrain.webp', 'parked-car.webp', 'puddle-water.webp', 'roadside-bush.webp', 'neighborhood-props.webp', 'street-life.webp', 'awake-cat.webp', 'doorstep-details.webp', 'concrete-paving.webp', ...VEHICLES.slice(1).map(v=>v.asset)].map(p => loadImage('./assets/' + p)));
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
  if (menuInspection) {
    const mc = menuInspection.getContext('2d');
    mc.clearRect(0, 0, menuInspection.width, menuInspection.height);
    for (const side of [0, 1]) mc.drawImage(cleanSprites[side], side ? 197 : 55, side ? 60 : 32, 108, 252);
  }
  const paintShoeWear=createShoeWear(terrain,cleanSprites);
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
    carSprites.set(vehicle.id,sprite);
  }
  let fleet=new Map();
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
      c.fillStyle = type === 'wet' ? '#202b29' : rgba(type, 1); c.fillRect(0, 0, 96, 224);
      printSprites.set(key, sprite);
    }
    return printSprites.get(key);
  }
  const propSprites = [];
  const grassSurface=terrain?makeCanvas(512,512):null;
  if(grassSurface)grassSurface.getContext('2d').drawImage(terrain,terrain.width/2,terrain.height/2,terrain.width/2,terrain.height/2,0,0,512,512);
  if (atlas) for (let i = 0; i < 4; i++) {
    const c = makeCanvas(256, 256); c.getContext('2d').drawImage(atlas, (i % 2) * atlas.width / 2, Math.floor(i / 2) * atlas.height / 2, atlas.width / 2, atlas.height / 2, 0, 0, 256, 256); propSprites.push(c);
  }
  const bushSprite = makeCanvas(256, 256);
  if (bushImage) bushSprite.getContext('2d').drawImage(bushImage, 0, 0, 256, 256);
  const texture = makeCanvas(384, 384), tc = texture.getContext('2d');
  if (asphalt) tc.drawImage(asphalt, 0, 0, 384, 384); else { tc.fillStyle = '#626461'; tc.fillRect(0, 0, 384, 384); }
  tc.fillStyle = '#55595b22'; tc.fillRect(0, 0, 384, 384);
  const grass = makeCanvas(256, 256), gc = grass.getContext('2d'), gr = randomSource(877);
  gc.fillStyle = '#475331'; gc.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16000; i++) {
    const x = gr() * 256, y = gr() * 256, h = 2 + gr() * 8;
    gc.strokeStyle = ['#617747', '#71834d', '#91a064', '#384d30', '#a8aa6b', '#4e653b'][i % 6]; gc.lineWidth = .45 + gr() * .6;
    gc.beginPath(); gc.moveTo(x, y); gc.lineTo(x + (gr() - .5) * 3, y - h); gc.stroke();
  }
  if (grassSurface) { gc.globalAlpha = .9; gc.drawImage(grassSurface, 0, 0, 256, 256); gc.globalAlpha = 1; }
  // Photographic concrete keeps the pores, mineral variation and fine flush
  // joints at street scale, without painted bevels around every slab.
  const paving = makeCanvas(720, 720), pc = paving.getContext('2d');
  pc.fillStyle = '#92938d'; pc.fillRect(0, 0, 720, 720);
  if (pavingImage) pc.drawImage(pavingImage, 0, 0, 720, 720);
  const curbing = makeCanvas(120, 120), cc = curbing.getContext('2d');
  cc.fillStyle = '#96988e'; cc.fillRect(0, 0, 120, 120);
  if (pavingImage) cc.drawImage(pavingImage, pavingImage.width*.02, pavingImage.height*.02, pavingImage.width*.12, pavingImage.height*.12, 0, 0, 120, 120);
  const neighborhood = createNeighborhood(neighborhoodAtlas, paving, texture, lifeAtlas, bushSprite, awakeCat, doorstepDetails, curbing);
  // The destination belongs to the street: a worn coir mat and a painted door,
  // set beyond the finish so the entire playable apron remains clear.
  const doorstep = makeCanvas(420,360), entrance = doorstep.getContext('2d'), homeGrain = randomSource(1918);
  entrance.fillStyle='#14221c40';entrance.fillRect(39,25,348,178);
  entrance.fillStyle=entrance.createPattern(paving,'repeat');entrance.fillRect(36,18,348,168);
  entrance.strokeStyle='#424e454a';entrance.lineWidth=1;entrance.strokeRect(36.5,18.5,347,167);
  entrance.fillStyle='#273c35';entrance.fillRect(54,10,312,50);
  const doorLight=entrance.createLinearGradient(0,10,0,60);doorLight.addColorStop(0,'#65786a');doorLight.addColorStop(.45,'#3c584b');doorLight.addColorStop(1,'#1d332c');
  entrance.fillStyle=doorLight;entrance.fillRect(61,14,298,39);
  entrance.strokeStyle='#bac1a133';entrance.lineWidth=1;entrance.strokeRect(68,19,125,25);entrance.strokeRect(220,19,131,25);
  entrance.fillStyle='#ac9660';entrance.fillRect(202,28,6,13);
  entrance.fillStyle='#c8c0a7';entrance.fillRect(59,58,302,7);
  entrance.fillStyle='#24312b40';entrance.fillRect(59,65,302,3);
  entrance.shadowColor='#1c261b55';entrance.shadowBlur=4;entrance.shadowOffsetY=3;
  entrance.fillStyle='#4c4636';entrance.beginPath();entrance.roundRect(91,218,238,99,3);entrance.fill();entrance.shadowColor='transparent';
  entrance.fillStyle='#a58a59';entrance.fillRect(96,223,228,89);
  for(let n=0;n<1900;n++){entrance.fillStyle=n%2?'#e0c58a55':'#4a402944';entrance.fillRect(96+homeGrain()*228,223+homeGrain()*89,.5+homeGrain()*1.5,1+homeGrain()*2);}
  entrance.strokeStyle='#504a36bb';entrance.lineWidth=2;entrance.strokeRect(104,231,212,73);
  entrance.fillStyle='#3d4130';entrance.font='italic 29px Georgia';entrance.textAlign='center';entrance.fillText('hello again',210,277);
  const paintDenim = createDenim(denim);
  const barrierSprites=new Map();
  const chunks = new Map(), paths = new Map(), liquidGroups = new Map(), revisions = [-1, -1], paintedAt = [-1,-1];
  const soleStains=[new Float64Array(8),new Float64Array(8)],soleTypes=[[],[]];
  let ref, camera = 0, viewH = 800, scale = 1, offset = 0, rect, dpr = 1, lastInspection = '', lastResultInspection = '', lastResize = 0, preparedAt = -1, warmJob = null;
  const metrics = { chunks: 0, cacheBytes: 0, generated: 0, prefetched: 0, visibleMisses: 0, warmMilliseconds: 0, solePaints: 0 };
  function pathFor(p) {
    if (paths.has(p.id)) return paths.get(p.id);
    const path = new Path2D();
    for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2, r = boundary(p, a), x = Math.cos(a) * p.rx * r, y = -Math.sin(a) * p.ry * r; if (!i) path.moveTo(x, y); else path.lineTo(x, y); }
    path.closePath(); paths.set(p.id, path); return path;
  }
  function paintPatch(c, p, sy) {
    c.save(); c.translate(p.x, sy); c.rotate(-Math.atan2(p.sin, p.cos));
    const path = pathFor(p), rand = randomSource(Math.floor(p.seed * 1000));
    if (p.type === 'metal' && propSprites[0]) { c.drawImage(propSprites[0], -p.rx * 1.14, -p.ry * 1.14, p.rx * 2.28, p.ry * 2.28); c.restore(); return; }
    if (p.type === 'poop' && propSprites[3]) { c.drawImage(propSprites[3], -p.rx * 1.5, -p.ry * 1.5, p.rx * 3, p.ry * 3); c.restore(); return; }
    if (p.type === 'gum') {
      c.shadowColor = '#161b1e80'; c.shadowBlur = 2; c.shadowOffsetY = 1;
      c.fillStyle = '#c6a8ac'; c.fill(path); c.shadowColor = 'transparent'; c.clip(path);
      for (let i = 0; i < 18; i++) { c.fillStyle = i % 2 ? '#e5cdd250' : '#685b5640'; c.fillRect((rand() - .5) * p.rx * 2, (rand() - .5) * p.ry * 2, 1 + rand() * 4, 2); }
      c.restore(); return;
    }
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
        const size=.35+rand()*(p.workBed?1.7:1.05),h=size*(.55+rand()*.55);
        c.fillStyle='#252c2840';c.fillRect(x+.35,y+.45,size*1.7,h*1.4);
        c.fillStyle=palette[i%palette.length];c.beginPath();c.moveTo(x-size,y-h*.4);c.lineTo(x+size*.35,y-h);c.lineTo(x+size,y+h*.25);c.lineTo(x-size*.3,y+h);c.closePath();c.fill();
        if(i%5===0){c.fillStyle='#d2c7aa66';c.fillRect(x-size*.35,y-h*.65,size*.6,.35);}
      }
      c.restore(); return;
    }
    c.restore();
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
    for (const p of ref.street.patches.filter(p => p.type === type)) {
      const ex = (p.rx * Math.abs(p.cos) + p.ry * Math.abs(p.sin)) * 1.16, ey = (p.rx * Math.abs(p.sin) + p.ry * Math.abs(p.cos)) * 1.16;
      const group = { patches: [p], x0: p.x - ex, x1: p.x + ex, y0: p.y - ey, y1: p.y + ey };
      for (let i = 0; i < groups.length; i++) {
        const other = groups[i];
        if (group.x1 < other.x0 || group.x0 > other.x1 || group.y1 < other.y0 || group.y0 > other.y1 || !other.patches.some(q => liquidTouches(p, q))) continue;
        group.patches.push(...other.patches); group.x0 = Math.min(group.x0, other.x0); group.x1 = Math.max(group.x1, other.x1); group.y0 = Math.min(group.y0, other.y0); group.y1 = Math.max(group.y1, other.y1); groups.splice(i, 1); i = -1;
      }
      groups.push(group);
    }
    liquidGroups.set(type, groups); return groups;
  }
  function paintLiquids(c, type, top, bottom) {
    const groups = connectedLiquid(type).filter(g => g.y1 > bottom - 16 && g.y0 < top + 16);
    if (!groups.length) return;
    // Shallow water lies ON the asphalt: translucent sky reflections, visible aggregate,
    // silt and a dark wet fringe. No raised-bank photographs or cast puddle shadows.
    const layer = makeCanvas(900, CHUNK + 32), lc = layer.getContext('2d');
    for (const group of groups) {
      const thinFilm=type==='oil'&&group.patches.some(p=>p.garageRunoff);
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
      c.save(); c.translate(0, -16); c.shadowColor = '#101b2466'; c.shadowBlur = 5;
      c.fillStyle = '#15242d35'; c.fill(union); c.restore();
      lc.save(); lc.clip(union);
      const reflection = lc.createLinearGradient(group.x0, y0, group.x1, y0 + height);
      if (type === 'oil') {
        reflection.addColorStop(0, thinFilm?'#26323870':'#263238a8'); reflection.addColorStop(.45, thinFilm?'#53626b35':'#53626b86'); reflection.addColorStop(1, thinFilm?'#26312d85':'#26312dbb');
      } else {
        reflection.addColorStop(0, type === 'mud' ? '#8c887276' : '#afc0c9b5');
        reflection.addColorStop(.36, type === 'mud' ? '#7c807066' : '#9aafb8a0');
        reflection.addColorStop(.7, '#687d8670'); reflection.addColorStop(1, '#344b5455');
      }
      lc.fillStyle = reflection; lc.fillRect(group.x0, y0, group.x1 - group.x0, height);
      if (waterImage) {
        lc.globalAlpha = thinFilm?.28:.93;
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
      lc.restore();
    }
    c.drawImage(layer, 0, -16);
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

  function paintWaterMotion(g, screenY, reduced) {
    if (!waterImage || reduced) return;
    const time = g.time;
    for (const group of connectedLiquid('water')) {
      if (screenY(group.y0) < 0 || screenY(group.y1) > viewH) continue;
      if (!group.motionPath) {
        const union = new Path2D();
        for (const p of group.patches) {
          for (let i = 0; i <= 72; i++) {
            const a = i / 72 * Math.PI * 2, radius = boundary(p, a), x = Math.cos(a) * p.rx * radius, y = Math.sin(a) * p.ry * radius;
            const wx = p.x + x * p.cos - y * p.sin, wy = -p.y - x * p.sin - y * p.cos;
            if (!i) union.moveTo(wx, wy); else union.lineTo(wx, wy);
          }
          union.closePath();
        }
        group.motionPath = union;
      }
      const x = group.x0, y = -group.y1, w = group.x1 - x, h = group.y1 - group.y0;
      const phase = group.patches[0].seed;
      ctx.save(); ctx.translate(0, screenY(0)); ctx.clip(group.motionPath);
      // Displace the reflected image, never the waterline or the asphalt beneath it.
      ctx.globalAlpha = .24;
      ctx.drawImage(waterImage, x + Math.sin(time * .43 + phase) * 2, y + Math.sin(time * .37 + phase) * 1.4, w, h);
      for (let i = 0; i < 3; i++) {
        const bandY = y + ((time * 7 + i * h / 3 + phase * 19) % h), bandH = 9 + i * 3;
        ctx.save(); ctx.beginPath(); ctx.rect(x, bandY, w, bandH); ctx.clip(); ctx.globalAlpha = .12;
        ctx.drawImage(waterImage, x + Math.sin(time * 1.4 + i + phase) * 4, y + 1.5, w, h); ctx.restore();
      }
      ctx.globalAlpha = 1;
      // Drops falling from the wet shrubs disturb only the actual water surface.
      for (const p of group.patches) {
        const age = (time + p.seed) % (2.6 + p.seed % 2); if (age > 1) continue;
        const px = p.x + p.rx * .22, py = -p.y + p.ry * .12;
        for (let ring = 0; ring < 2; ring++) {
          const a = age - ring * .13; if (a < 0) continue;
          ctx.strokeStyle = `rgba(228,238,235,${(1 - age) * (ring ? .17 : .28)})`; ctx.lineWidth = .7;
          ctx.beginPath(); ctx.ellipse(px, py, 2 + a * 28, 1 + a * 17, 0, 0, Math.PI * 2); ctx.stroke();
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
    if (chunks.has(index)) return chunks.get(index);
    const tile = makeCanvas(900, CHUNK), c = tile.getContext('2d', { alpha: false }), top = (index + 1) * CHUNK, bottom = index * CHUNK, rand = randomSource(ref.street.seed + index * 1117);
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
          const transition=c.createLinearGradient(0,top-district.offset,0,top-district.offset-180);
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
    for (let i = 0; i < 30; i++) {
      let x = 115 + rand() * 675, y = rand() * CHUNK; c.beginPath(); c.moveTo(x, y);
      for (let j = 0; j < 6; j++) { x += (rand() - .5) * 15; y += 5 + rand() * 10; c.lineTo(x, y); }
      c.strokeStyle = '#20262a40'; c.lineWidth = .7; c.stroke();
    }
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
    for (const type of ['water', 'mud', 'oil']) paintLiquids(c, type, top, bottom);
    for (const p of ref.street.patches) if (!MATERIALS[p.type].liquid && p.y + Math.max(p.rx, p.ry) * 1.3 > bottom && p.y - Math.max(p.rx, p.ry) * 1.3 < top) paintPatch(c, p, top - p.y);
    // Flush stone aprons give both ends a clean, believable place to stand.
    for (const finish of [false, true]) {
      const edge = finish ? PAVEMENT.finishStart : PAVEMENT.startEnd;
      const low = finish ? Math.max(bottom, edge) : bottom;
      const high = finish ? top : Math.min(top, edge);
      if (high <= low) continue;
      c.save(); c.translate(0, top); c.scale(1, -1);
      c.beginPath(); c.rect(0, low, 900, high - low); c.clip();
      c.fillStyle = c.createPattern(paving, 'repeat'); c.fillRect(0, low, 900, high - low);
      // A flat edging course meets the asphalt, without a step to jump over.
      const borderY = finish ? edge : edge - 22;
      c.fillStyle = c.createPattern(curbing, 'repeat'); c.fillRect(0, borderY, 900, 22);
      c.fillStyle = '#41484040'; c.fillRect(0, edge - .6, 900, 1.2);
      for (let x = 90; x < 900; x += 180) { c.fillStyle = '#4d554238'; c.fillRect(x, borderY, 1, 22); }
      // Small inset grass beds stay entirely outside the playable pavement.
      const bedY = finish ? edge + 90 : edge - 390;
      for (const x of [-34, 812]) {
        c.fillStyle = '#636d5d'; c.beginPath(); c.roundRect(x - 3, bedY - 3, 125, 306, 15); c.fill();
        c.fillStyle = c.createPattern(curbing, 'repeat'); c.beginPath(); c.roundRect(x, bedY, 119, 300, 12); c.fill();
        c.save(); c.beginPath(); c.roundRect(x + 7, bedY + 7, 105, 286, 7); c.clip();
        c.fillStyle = c.createPattern(grass, 'repeat'); c.fillRect(x + 7, bedY + 7, 105, 286);
        c.strokeStyle = '#25362380'; c.lineWidth = 6; c.strokeRect(x + 7, bedY + 7, 105, 286); c.restore();
      }
      c.restore();
    }
    neighborhood.paintVerge(c, ref.street, top, bottom);
    for (const o of ref.street.obstacles) if (o.type === 'bush' && Math.abs(o.y - (top + bottom) / 2) < CHUNK / 2 + 100) {
      const sy = top - o.y, half = o.bed / 2;
      c.fillStyle = '#222b23'; c.fillRect(o.x - half - 5, sy - half - 5, o.bed + 10, o.bed + 10);
      c.fillStyle = c.createPattern(curbing, 'repeat'); c.fillRect(o.x - half, sy - half, o.bed, o.bed);
      c.fillStyle = '#504735'; c.fillRect(o.x - half + 7, sy - half + 7, o.bed - 14, o.bed - 14);
      for (let n = 0; n < 140; n++) ellipse(c, o.x + (rand() - .5) * (o.bed - 15), sy + (rand() - .5) * (o.bed - 15), 1 + rand() * 3, 1 + rand(), ['#82704c', '#343c29', '#657146'][n % 3]);
      c.strokeStyle = '#50574d38'; c.lineWidth = .7; c.strokeRect(o.x - half, sy - half, o.bed, o.bed);
      // Low shrubs sit inside their beds, with contact shadows and no overhead canopy.
      c.save(); c.translate(o.x, sy); c.rotate(o.seed);
      c.shadowColor = '#101d1b80'; c.shadowBlur = 5; c.shadowOffsetX = 2; c.shadowOffsetY = 3;
      const radius = o.spread * 1.1;
      if (bushImage) c.drawImage(bushSprite, -radius, -radius, radius * 2, radius * 2);
      c.restore();
    }
    neighborhood.paintGround(c, ref.street, top, bottom);
    // The garage overflow comes from a leaf-clogged curb drain. Its frame sits
    // outside the walking lane, so the visible dry tip remains a usable exit.
    for(const p of ref.street.patches){
      if(!p.garageRunoff||Math.abs(p.y-(top+bottom)/2)>CHUNK/2+55)continue;
      const x=p.gutterSide?838:62,sy=top-p.y;
      const wear=randomSource(Math.floor(p.seed*773));
      c.save();c.translate(x,sy);c.fillStyle='#2d3433';c.fillRect(-27,-39,54,78);
      const steel=c.createLinearGradient(-25,-37,25,37);
      steel.addColorStop(0,'#6b7067');steel.addColorStop(.4,'#3f4947');steel.addColorStop(1,'#7c7b69');
      c.fillStyle=steel;c.fillRect(-25,-37,50,74);c.fillStyle='#171f21';c.fillRect(-21,-33,42,66);
      for(let n=0;n<8;n++){
        const y=-29+n*8;c.fillStyle=steel;c.fillRect(-21,y,42,3);
        c.fillStyle='#b5b4a235';c.fillRect(-21,y,42,.6);
      }
      for(let n=0;n<500;n++){
        c.fillStyle=['#bdc1ae21','#0f191d50','#77634445'][n%3];
        c.fillRect(-25+wear()*50,-37+wear()*74,.4+wear()*.8,.4+wear()*1.3);
      }
      for(const x of [-23,23])for(const y of [-34,34]){ellipse(c,x,y,1.2,1.2,'#202b2b');c.fillStyle='#a2a58c55';c.fillRect(x-.6,y-.6,1,.4);}
      for(let n=0;n<7;n++)rainLeaf(c,-14+n*4,24+Math.sin(n*2)*4,3+n%2,n*1.9,['#655337','#847246','#a18a56'][n%3]);
      c.restore();
    }
    for (const item of ref.street.clutter) {
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
    for (let y = 980 + Math.ceil((bottom - 980) / 1560) * 1560; y < top + 70; y += 1560) {
      if (y < 800 || y > ROAD.finish - 400) continue;
      const district=ref.street.districts?.find(d=>y>=d.offset&&y<d.offset+DISTRICT_LENGTH);
      const x = (district?.street.parkingSide ?? ref.street.parkingSide) ? 766 : 110;
      c.fillStyle = '#20282b'; c.fillRect(x - 18, top - y - 38, 36, 76); c.strokeStyle = '#969b91'; c.lineWidth = 2;
      for (let n = 0; n < 9; n++) { c.beginPath(); c.moveTo(x - 15, top - y - 33 + n * 8); c.lineTo(x + 15, top - y - 33 + n * 8); c.stroke(); }
      const debris=randomSource(ref.street.seed+Math.floor(y));
      for(let n=0;n<11;n++)rainLeaf(c,x+(debris()-.5)*39,top-y-30+debris()*19,2.3+debris()*3.4,debris()*6.28,['#514b31','#777047','#856b3e'][n%3]);
      c.fillStyle='#b7b39766';for(let n=0;n<14;n++)c.fillRect(x+(debris()-.5)*42,top-y-42+debris()*8,.5+debris(),.7);
    }
    if(ROAD.finish+380>bottom&&ROAD.finish+20<top)c.drawImage(doorstep,240,top-ROAD.finish-380);
    // A slim brass threshold identifies the finish without a painted game label.
    if(ROAD.finish>=bottom-4&&ROAD.finish<=top+4){
      c.fillStyle='#88774c';c.fillRect(300,top-ROAD.finish-2,300,4);
      c.fillStyle='#d7c592';c.fillRect(300,top-ROAD.finish-2,300,1);
      c.fillStyle='#5e5d47';c.font='10px Georgia';c.textAlign='center';c.fillText('100 m',450,top-ROAD.finish+17);
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
    if(warmJob!==null||document.hidden||g.phase==='finished'||!window.requestIdleCallback)return;
    const next=Math.floor((camera+viewH)/CHUNK)+1;
    if(chunks.has(next)||next>Math.floor((ROAD.finish+400)/CHUNK))return;
    warmJob=window.requestIdleCallback(deadline=>{
      warmJob=null;
      // A busy browser keeps the synchronous fallback. Do no background work
      // after a retry or tab switch, or at the expense of the next animation frame.
      if(ref!==g||g.phase==='finished'||document.hidden||deadline.timeRemaining()<10)return;
      if(!chunks.has(next)){const start=performance.now();tile(next);metrics.warmMilliseconds+=performance.now()-start;metrics.prefetched++;}
    });
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
        const lump=['mud','poop','gum'].includes(zone.stainType),r=lump?1+zone.stain*3:.5+zone.stain;
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
    ctx.save();ctx.translate(pose.x,pose.y);
    paintDenim(ctx,g,f,legRows({...pose,x:0,y:0},SHOES[g.shoeId],f.side,f.z,center-pose.x,viewH-pose.y,breath));
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
      if(warmJob!==null){window.cancelIdleCallback?.(warmJob);warmJob=null;}
      ref = g; fleet=vehicleLineup(g.street); chunks.clear();barrierSprites.clear(); paths.clear(); liquidGroups.clear(); revisions.fill(-1); paintedAt.fill(-1); soleStains.forEach(a=>a.fill(-1)); camera = 0; lastInspection = lastResultInspection = ''; metrics.generated = metrics.prefetched = metrics.visibleMisses = metrics.warmMilliseconds = metrics.solePaints = 0;
    }
    neighborhood.update(g);
    resize(now);
    const targetCam = cameraTarget(g,viewH,scale);
    if (fresh) camera = targetCam;
    camera += (targetCam - camera) * (reduced ? 1 : 1 - Math.exp(-dt * 10));
  }
  function render(g, now, dt, reduced = false) {
    prepare(g, now, dt, reduced);
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
    for (const car of g.street.parking || []) {
      const y = screenY(car.y); if (y < -car.length / 2 - 30 || y > viewH + car.length / 2 + 30) continue;
      ctx.save(); ctx.translate(car.x, y); ctx.rotate(car.angle);
      const sprite=carSprites.get(fleet.get(car));
      if (sprite) ctx.drawImage(sprite, -car.width / 2 - 20, -car.length / 2 - 20, car.width + 40, car.length + 40); ctx.restore();
    }
    const visibleObjects = g.street.obstacles.filter(o => Math.abs(o.y - (camera + viewH / 2)) < viewH / 2 + 250);
    for (const o of visibleObjects) {
      const y = screenY(o.y);
      if(o.type==='barrier')ctx.drawImage(barrierSprite(o),o.x-o.halfWidth-30,y-45);
      if (o.type === 'bollard' && propSprites[2]) { ellipse(ctx, o.x + 9, y + 9, o.r * 1.1, o.r, '#18242a66'); ctx.drawImage(propSprites[2], o.x - o.r * 1.58, y - o.r * 1.58, o.r * 3.16, o.r * 3.16); }
    }
    for (const p of g.prints) {
      const y = screenY(p.y); if (y < -50 || y > viewH + 60) continue;
      const age = g.time - p.born, wetFade = Math.max(0, 1 - age / 22) ** 1.4, dirtFade = Math.max(0, 1 - age / 90) ** .6;
      ctx.save(); ctx.translate(p.x, y); ctx.rotate(p.angle);
      p.zones.forEach((zone, i) => {
        const col = i % 2, row = Math.floor(i / 2), x = (col / 2 - .5) * p.width, y = (row / 4 - .5) * p.length;
        for (const [type, strength] of [['wet', zone.wet * wetFade * .86], [zone.type, zone.dirt * dirtFade * .9]]) {
          if (strength < .02) continue;
          ctx.globalAlpha = strength;
          ctx.drawImage(printSprite(type, p.side), col * 48, row * 56, 48, 56, x, y, p.width / 2, p.length / 4);
        }
      });
      const water=p.zones.reduce((sum,z)=>sum+z.wet,0)/8*wetFade;
      if(water>.12){
        // A few beads fall off the edge of a wet sole; they dry with its print.
        for(let n=0;n<3;n++){
          const x=(n===1?.58:-.58+n*.12)*p.width,y=(.17+n*.19)*p.length;
          const world=footPoint(p,x,-y),surface=surfaceAt(g,world.x,world.y);
          if(MATERIALS[surface.type].liquid&&surface.depth>.3)continue;
          ctx.globalAlpha=water*(.47-n*.07);ellipse(ctx,x,y,1.3+n*.35,1+n*.25,'#26352e');
          ctx.globalAlpha=water*.15;ellipse(ctx,x-.35,y-.35,.45,.3,'#d0d8ce');
        }
      }
      ctx.restore();
    }
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
    for (const r of g.rings) {
      ctx.save(); ctx.translate(r.patch.x, screenY(r.patch.y)); ctx.rotate(-Math.atan2(r.patch.sin, r.patch.cos)); ctx.clip(pathFor(r.patch)); ctx.rotate(Math.atan2(r.patch.sin, r.patch.cos));
      ctx.strokeStyle = `rgba(225,233,234,${(1 - r.age / 1.5) * .45})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(r.x - r.patch.x, -(r.y - r.patch.y), r.radius, r.radius * .78, 0, 0, 6.28); ctx.stroke(); ctx.restore();
    }
    // Tiny drifting surface glints; no per-frame filters or full-world repaints.
    for (const p of g.street.patches) {
      const y = screenY(p.y); if (y < -p.ry || y > viewH + p.ry || !MATERIALS[p.type].liquid) continue;
      const t = reduced ? .4 : (g.time * .15 + p.seed) % 1;
      ctx.strokeStyle = `rgba(231,240,240,${(1 - t) * .16})`; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(p.x, y, 4 + t * 18, 2 + t * 9, 0, 0, 6.28); ctx.stroke();
    }
    if (g.phase === 'walking' && (g.preview || g.mode === 'charging')) {
      const target = g.preview || predictedTarget(g), s = SHOES[g.shoeId];
      // A faint shoe at the chosen landing is enough to aim. No labels, reach
      // diagrams or surface ratings are painted over the street.
      ctx.save();
      ctx.translate(target.x, screenY(target.y)); ctx.rotate(target.angle ?? 0);
      ctx.globalAlpha = target.valid === false || target.blocked ? .12 : .38;
      ctx.drawImage(cleanSprites[g.active], -s.width/2, -s.length/2, s.width, s.length);
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
      if (f.sticky > .1 && f.z > 3 && f.z < 45) { ctx.strokeStyle = rgba(f.stickyType, .75); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(f.x - 6, y - f.z * .48 + 20); ctx.quadraticCurveTo(f.x + 6, y + 16, f.x - 3, y + 23); ctx.stroke(); }
    }
    neighborhood.paintAir(ctx, g, screenY, reduced, viewH);
    for (const p of g.particles) { ellipse(ctx, p.x + 4, screenY(p.y) + 2, p.r, p.r * .5, '#14233225'); ellipse(ctx, p.x, screenY(p.y) - p.z * .65, p.r, p.r * 1.2, rgba(p.type, .85)); }
    if (g.precisionAim && g.preview && g.phase === 'walking' && g.mode === 'idle') {
      // Copy only the small landing area before drawing the lens, avoiding feedback.
      const target = g.preview, color = '#f5efcf', diameter = rect.width < 600 ? 108 : 126;
      const px = (target.x - offset) * scale, py = screenY(target.y) * scale;
      const sourceSize = Math.max(SHOES[g.shoeId].length * scale * 1.25, diameter / 2);
      lensContext.fillStyle = '#535d55'; lensContext.fillRect(0, 0, 160, 160);
      lensContext.drawImage(canvas, (px - sourceSize / 2) * dpr, (py - sourceSize / 2) * dpr, sourceSize * dpr, sourceSize * dpr, 0, 0, 160, 160);
      const radius = diameter / 2, x = clamp(px, radius + 14, rect.width - radius - 14);
      const y = clamp(py - radius - 80, radius + 90, rect.height - radius - 45);
      ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = '#f4ffdb70'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(x, y + radius); ctx.lineTo(px, py - 22); ctx.stroke(); ctx.setLineDash([]);
      ctx.shadowColor = '#10271d65'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#fffbed'; ctx.beginPath(); ctx.arc(x, y, radius + 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(lens, x - radius, y - radius, diameter, diameter); ctx.restore();
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    const key = g.shoeId + '-' + revisions.join('-') + '-' + g.active;
    if (key !== lastInspection) {
      inspect.clearRect(0, 0, 360, 220);
      // Match the in-world proportions and wearer-side order; avoid the narrow, widely spaced HUD pair.
      for (const f of g.feet) { inspect.save(); inspect.translate(f.side ? 238 : 122, 110); shoe(inspect, f, 77, 177); inspect.restore(); }
      lastInspection = key; inspection.setAttribute('aria-label', `Left shoe ${condition(g, 0).toFixed(1)}% clean; right shoe ${condition(g, 1).toFixed(1)}% clean. Upper, rim and tread contamination included.`);
    }
    if (resultInspection && g.phase === 'finished' && lastResultInspection !== key) {
      const resultContext = resultInspection.getContext('2d');
      resultContext.clearRect(0, 0, resultInspection.width, resultInspection.height);
      resultContext.drawImage(inspection, 0, 0, resultInspection.width, resultInspection.height);
      resultInspection.setAttribute('aria-label', `Your shoes after the walk. Left ${condition(g, 0).toFixed(1)}% clean; right ${condition(g, 1).toFixed(1)}% clean.`);
      lastResultInspection = key;
    }
    warmNext(g);
  }
  function worldPoint(clientX, clientY) {
    const box = rect || canvas.getBoundingClientRect();
    return { x: (clientX - box.left) / scale + offset, y: viewH - (clientY - box.top) / scale + camera };
  }
  function screenPoint(point) {
    const box = rect || canvas.getBoundingClientRect();
    return { x: box.left + (point.x - offset) * scale, y: box.top + (viewH - point.y + camera) * scale };
  }
  return { prepare, render, worldPoint, screenPoint, mask, metrics, takeSceneEvents:neighborhood.takeEvents, wildlifeState:neighborhood.wildlifeState, sceneState:neighborhood.sceneState, vehicleState:()=>[...fleet].map(([car,id])=>({id,x:car.x,y:car.y,side:car.side})), invalidateSize: () => { rect = null; preparedAt = -1; }, assetsReady: Boolean(shoeImage && asphalt && atlas && denim && terrain && carImages.every(Boolean) && waterImage && bushImage && neighborhoodAtlas && lifeAtlas && awakeCat && doorstepDetails && pavingImage) };
}
