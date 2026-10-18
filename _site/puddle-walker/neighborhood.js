import {paintPaving,paintCurb,paintServiceCover,paintPlantingBed} from './street-surfaces.js?v=instant-menu-132';
import { districtDetails, paintDistrictDetails, createDistrictSprites, detailApron } from './district-details.js?v=instant-menu-132';
import { NEIGHBORHOOD_CROPS } from './sprite-data.js?v=instant-menu-132';
import { randomSource, ROAD, PAVEMENT, DISTRICT_LENGTH, surfaceAt } from './model.js?v=instant-menu-132';
import { createWildlife, updateWildlife, birdPose } from './wildlife.js?v=instant-menu-132';
import { createStreetMotion, updateStreetMotion, boatPose, butterflyPose, floatingDuckPose, snailPose, dandelionPose, dandelionSeedPose, DANDELION_SEEDS, biscuitThiefPose, doorstepBalloonPose, workshopHelperPose } from './street-motion.js?v=instant-menu-132';
import { paintShoeBox, paintCatKeepsakes, paintCatWaterBowl, createDuckSprite, createPinwheelSprite, PINWHEEL, pinwheelPose, createSnailSprite, paintSnail, paintTeaSteam, createDandelionSprites, paintDandelion, paintFloatingSeed, createBiscuitSprite, createDoorstepBalloonSprite, paintDoorstepBalloon, createWorkshopHelperHead, paintWorkshopHelperHead } from './street-charm.js?v=instant-menu-132';

// Small neighborhood scenes use their own seed, so decoration never changes a route.
export function createNeighborhood(atlas, paving, asphalt, lifeAtlas, shrub, awakeCat, details, curbing = paving, everydayAtlas, soil = asphalt) {
  const detailSprites=createDistrictSprites(everydayAtlas);
  const assets = [atlas, asphalt, lifeAtlas, shrub, awakeCat, details, curbing, detailSprites, soil];
  const sprites = []; let previous, blocks = [];
  function prepare(street) {
    if (previous === street) return;
    previous = street;
    blocks = (street.districts || [{offset:0,index:0,first:true,last:true,street}]).map(d =>
      ({...d, renderer:createNeighborhoodBlock(...assets,sprites,d), rings:new WeakMap(), game:null}));
  }
  function localGame(block, game) {
    // Scenery only reads position, time and ripples. Keep a small local view
    // instead of copying every property of both shoes and the game per frame.
    const view=block.game||={street:block.street,time:0,phase:'ready',feet:[{x:0,y:0},{x:0,y:0}],rings:[]};
    view.time=game.time;view.phase=game.phase;view.shoeId=game.shoeId;view.mask=game.mask;
    for(let i=0;i<2;i++){
      const source=game.feet[i],foot=view.feet[i];
      foot.x=source.x;foot.y=source.y-block.offset;foot.z=source.z;foot.angle=source.angle;foot.side=source.side;
      foot.coverage=source.coverage;foot.dirtSource=source.dirtSource;
      foot.vx=source.vx;foot.vy=source.vy;
    }
    view.rings.length=0;
    for(const source of game.rings){
      let ring = block.rings.get(source);
      if (!ring) {ring={};block.rings.set(source,ring);}
      // Stable identities ensure each ripple pushes a paper boat only once.
      ring.x=source.x;ring.y=source.y-block.offset;ring.radius=source.radius;ring.strength=source.strength;
      view.rings.push(ring);
    }
    return view;
  }
  function ground(method,c,street,top,bottom) {
    prepare(street);
    for(const b of blocks)if(top>b.offset&&(b.last||bottom<b.offset+DISTRICT_LENGTH))
      b.renderer[method](c,b.street,top-b.offset,bottom-b.offset);
  }
  function* groundSteps(c,street,top,bottom){
    prepare(street);
    for(const b of blocks)if(top>b.offset&&(b.last||bottom<b.offset+DISTRICT_LENGTH))
      yield* b.renderer.paintGroundSteps(c,b.street,top-b.offset,bottom-b.offset);
  }
  function life(method,c,game,screenY,reduced,height) {
    prepare(game.street);
    for(const b of blocks){
      // Include an ample margin for birds in flight and butterflies at an edge.
      // Off-screen scenes still update, so returning never resets their motion.
      if(screenY(b.offset)<-400||screenY(b.offset+DISTRICT_LENGTH)>height+400)continue;
      b.renderer[method](c,b.game||localGame(b,game),y=>screenY(y+b.offset),reduced,height);
    }
  }
  return {
    paintVerge:(...args)=>ground('paintVerge',...args),paintGround:(...args)=>ground('paintGround',...args),paintGroundSteps:groundSteps,
    paintLife:(...args)=>life('paintLife',...args),paintAir:(...args)=>life('paintAir',...args),
    update(game,reduced=false){prepare(game.street);for(const b of blocks){b.game=localGame(b,game);b.game.reduced=reduced;b.renderer.update(b.game);}},
    takeEvents(){return blocks.flatMap(b=>b.renderer.takeEvents().map(e=>({...e,y:e.y+b.offset})));},
    wildlifeState(){return blocks.flatMap(b=>b.renderer.wildlifeState().map(bird=>({...bird,y:bird.y+b.offset})));},
    sceneState(){
      const states=blocks.map(b=>({offset:b.offset,state:b.renderer.sceneState()})).filter(b=>b.state);
      const cats=states.map(b=>({...b.state.cat,y:b.state.cat.y+b.offset}));
      return states.length?{cat:cats[0],cats,districts:states.length,helpers:states.filter(b=>b.state.helper).map(b=>({...b.state.helper,y:b.state.helper.y+b.offset,anchorY:b.state.helper.anchorY+b.offset})),balloons:states.filter(b=>b.state.balloon).map(b=>({...b.state.balloon,y:b.state.balloon.y+b.offset,anchorY:b.state.balloon.anchorY+b.offset})),thieves:states.filter(b=>b.state.thief).map(b=>({...b.state.thief,y:b.state.thief.y+b.offset,snack:{x:b.state.thief.snack.x,y:b.state.thief.snack.y+b.offset}})),dandelions:states.filter(b=>b.state.dandelion).map(b=>({...b.state.dandelion,y:b.state.dandelion.y+b.offset})),snails:states.filter(b=>b.state.snail).map(b=>({...b.state.snail,y:b.state.snail.y+b.offset})),ducks:states.filter(b=>b.state.duck).map(b=>({...b.state.duck,y:b.state.duck.y+b.offset})),balls:states.filter(b=>b.state.ball).map(b=>({...b.state.ball,y:b.state.ball.y+b.offset})),landmarks:states.flatMap(b=>b.state.landmarks.map(item=>({...item,y:item.y+b.offset}))),boats:states.flatMap(b=>b.state.boats.map(boat=>({...boat,y:boat.y+b.offset})))}:null;
    }
  };
}
function createNeighborhoodBlock(atlas, asphalt, lifeAtlas, shrub, awakeCat, details, curbing, detailSprites, soil, sprites, district) {
  const kind=district.profile?.id || 'doorsteps', domestic=kind==='doorsteps'||kind==='home';
  const floorStart=district.first?PAVEMENT.startEnd-district.offset:0;
  const floorEnd=district.last?PAVEMENT.finishStart-district.offset:DISTRICT_LENGTH;
  const localFinish=ROAD.finish-district.offset;
  if (!sprites.length) {
  for (const [image, offset] of [[atlas, 0], [lifeAtlas, 4], [awakeCat, 6]]) if (image) for (let i = 0; i < 4; i++) {
    if (image === awakeCat && i !== 2) continue;
    const source = document.createElement('canvas'); source.width = source.height = 384;
    const c = source.getContext('2d');
    c.drawImage(image, i % 2 * image.width / 2, Math.floor(i / 2) * image.height / 2, image.width * (image === awakeCat ? .54 : .5), image.height / 2, 0, 0, 384, 384);
    sprites[offset + i] = {source, ...NEIGHBORHOOD_CROPS[offset + i], aspect:image === awakeCat ? 1.08 : 1};
  }
  // The hose and umbrella need different crop heights; keep their complete
  // silhouettes instead of slicing this photographic sheet into equal squares.
  if (details) for (const [i, box] of [[9,[0,0,.55,.445]],[10,[.55,0,.45,.445]],[11,[0,.445,.5,.555]],[12,[.5,.5,.5,.5]]]) {
    const source = document.createElement('canvas'); source.width = source.height = 384;
    const c = source.getContext('2d'), [x,y,w,h] = box;
    c.drawImage(details,x*details.width,y*details.height,w*details.width,h*details.height,0,0,384,384);
    sprites[i] = {source, ...NEIGHBORHOOD_CROPS[i], aspect:w/h};
  }
  }
  let previous, layout;
  function scene(street) {
    if (previous === street) return layout;
    previous = street;
    const rand = randomSource(street.seed ^ 0x70f10a), side = 1 - street.parkingSide;
    const water = street.patches.filter(p => p.type === 'water' && p.rx > 85 && p.y > 2200 && p.y < 2900);
    const puddle = water[Math.floor(rand() * water.length)];
    layout = {side, x:side ? 835 : 65, phase:rand() * 6.28, wildlife:createWildlife(street), boats:puddle ? [{x:puddle.x, y:puddle.y, angle:(rand() - .5) * .7}] : []};
    layout.landmarks = districtDetails(street,district);
    layout.pinwheel = layout.landmarks.find(item=>item.kind==='seedlings');
    layout.tea = layout.landmarks.find(item=>item.kind==='tea-home');
    layout.aprons = layout.landmarks.map(detailApron);
    // One forgotten bath toy in real water, safely clear of covers and banks.
    // Its own selection never consumes gameplay or existing scenery randomness.
    let duck=null;
    if(kind==='flooded')for(const p of [...street.patches].filter(p=>p.type==='water'&&!p.roadDecay&&p.rx>65&&p.y>700&&p.y<3500).sort((a,b)=>Math.abs(a.y-2500)-Math.abs(b.y-2500))){
      for(const dx of [-.35,.35,0]){
        const x=p.x+p.rx*dx,y=p.y;
        if([[0,0],[-24,0],[24,0],[0,-28],[0,28]].every(([ox,oy])=>{const ground=surfaceAt({street},x+ox,y+oy);return ground.type==='water'&&ground.depth>2;})&&!layout.boats.some(b=>Math.hypot(b.x-x,b.y-y)<65)){duck={x,y};break;}
      }
      if(duck)break;
    }
    const garden=layout.landmarks.find(item=>item.kind==='garden'),inward=garden?.x<450?-1:1;
    const snail=garden?{x:garden.x-inward*32,y:garden.y+82,direction:inward}:null;
    const garage=layout.landmarks.find(item=>item.kind==='garage'),toward=garage?.x<450?1:-1;
    const dandelion=garage?{x:garage.x+toward*31,y:garage.y+91,direction:toward}:null;
    const teaBreak=layout.landmarks.find(item=>item.kind==='tea-break'),snack=teaBreak?{x:teaBreak.x+1,y:teaBreak.y-43}:null;
    const tiles=layout.landmarks.find(item=>item.kind==='tiles'),inwardBalloon=tiles?.x<450?1:-1;
    const balloon=tiles?{x:tiles.x+inwardBalloon*7,y:tiles.y+25,direction:inwardBalloon,phase:(tiles.seed%997)/997*Math.PI*2}:null;
    const toolbox=layout.landmarks.find(item=>item.kind==='toolbox'),helper=toolbox?{x:toolbox.x+14,y:toolbox.y-43}:null;
    layout.motion = createStreetMotion(layout.boats, layout.x, side, layout.phase,kind==='doorsteps'?{x:layout.x+(side?-39:39),y:3395,direction:side?-1:1}:null,duck,snail,dandelion,snack,balloon,helper);
    return layout;
  }
  function sprite(c, index, x, y, size, angle = 0, shadow = true, breath = 1) {
    const s = sprites[index]; if (!s) return;
    const scale = size / Math.max(s.width * s.aspect, s.height), w = s.width * s.aspect * scale, h = s.height * scale;
    c.save(); c.translate(x, y); c.rotate(angle); c.scale(breath, 1);
    if (shadow) { c.shadowColor = '#17221d60'; c.shadowBlur = 3; c.shadowOffsetX = 2; c.shadowOffsetY = 3; }
    c.drawImage(s.source, s.x, s.y, s.width, s.height, -w / 2, -h / 2, w, h); c.restore();
  }
  function chalk(c, draw, color) {
    c.save(); c.strokeStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let n = 0; n < 3; n++) {
      c.lineWidth = 1.2 + n * .3; c.globalAlpha = .22; c.setLineDash([4, .8, 7, .5]); c.lineDashOffset = n * 4;
      c.save(); c.translate(n * .25, -n * .3); c.beginPath(); draw(c); c.stroke(); c.restore();
    }
    c.restore();
  }
  function hopscotch(c, x, y) {
    c.save(); c.translate(x, y);
    const cells = [[0,129],[-23,86],[23,86],[0,43],[-23,0],[23,0]];
    cells.forEach(([cx,cy], i) => {
      chalk(c, p => {p.moveTo(cx-21,cy-20);p.lineTo(cx+20,cy-21);p.lineTo(cx+21,cy+21);p.lineTo(cx-20,cy+20);p.closePath();}, i%2 ? '#f0d7b2' : '#d5e2df');
      c.fillStyle = '#eee3c28c'; c.font = 'italic 21px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(i+1,cx,cy);
    });
    // A child's sun beside the chalk game, softened by the rain.
    chalk(c, p => p.arc(77, 92, 13, 0, Math.PI*2), '#e9d689');
    for (let i=0;i<8;i++) {const a=i*Math.PI/4;chalk(c,p=>{p.moveTo(77+Math.cos(a)*18,92+Math.sin(a)*18);p.lineTo(77+Math.cos(a)*24,92+Math.sin(a)*24);},'#e9d689');}
    chalk(c,p=>{p.moveTo(72,88);p.lineTo(72,90);p.moveTo(82,88);p.lineTo(82,90);p.moveTo(71,95);p.quadraticCurveTo(77,102,83,95);},'#e9d689');
    c.restore();
  }
  function mat(c, x, y, right, seed) {
    c.save(); c.translate(x,y); c.rotate(right ? -Math.PI/2 : Math.PI/2);
    c.shadowColor='#17232066';c.shadowBlur=2;c.shadowOffsetY=2;
    c.fillStyle='#3e392f';c.fillRect(-47,-29,94,58);c.shadowColor='transparent';
    c.fillStyle='#987547';c.fillRect(-44,-26,88,52);
    const rand=randomSource(seed);
    for(let i=0;i<1200;i++){c.fillStyle=i%2?'#d4b78050':'#423c303a';c.fillRect(-44+rand()*88,-26+rand()*52,.6+rand(),.6+rand());}
    c.strokeStyle='#4e4539';c.lineWidth=1.2;c.strokeRect(-39,-21,78,42);
    c.font='italic bold 19px Georgia';c.fillStyle='#3c3b30';c.textAlign='center';c.textBaseline='middle';c.fillText('hello',0,0);c.restore();
  }
  function paw(c,x,y,angle) {
    c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#59635c35';
    c.beginPath();c.ellipse(0,1.5,2.7,2.2,0,0,Math.PI*2);c.fill();
    for(const [px,py] of [[-3,-1.5],[-1.1,-3.2],[1.2,-3.2],[3,-1.4]]){c.beginPath();c.ellipse(px,py,1,1.3,0,0,Math.PI*2);c.fill();}c.restore();
  }
  function tennisBall(c,x,y,roll=0,wet=0) {
    c.save();c.translate(x,y);c.shadowColor='#15251e60';c.shadowBlur=2;c.shadowOffsetY=2;
    const light=c.createRadialGradient(-3,-3,1,0,0,9);light.addColorStop(0,'#c2c77b');light.addColorStop(.65,'#929d4c');light.addColorStop(1,'#596533');
    c.fillStyle=light;c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.fill();c.shadowColor='transparent';
    c.rotate(roll);c.strokeStyle='#e6dec09c';c.lineWidth=1.1;c.beginPath();c.moveTo(-5,-6);c.bezierCurveTo(4,-3,-3,4,5,6);c.stroke();
    c.fillStyle='#33452b29';for(let i=0;i<14;i++){const a=i*2.4,r=2+i%5;c.fillRect(Math.cos(a)*r,Math.sin(a)*r,.6,.8);}
    if(wet){c.fillStyle=`rgba(25,43,35,${wet*.28})`;c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.fill();}c.restore();
  }
  function paintVerge(c,street,top,bottom) {
    const s=scene(street),low=Math.max(bottom,floorStart),high=Math.min(top,floorEnd);
    if(high<=low)return;
    c.save();c.translate(0,top);c.scale(1,-1);
    // Both frontages share a continuous pavement. Parking lay-bys interrupt
    // only their own side, rather than moving the sidewalk with each district.
    for(const side of [0,1]){
      const left=side?796:0,edge=side?796:104;
      const bays=street.parking.filter(b=>b.side===side).map(b=>({low:b.y-b.length/2-50,high:b.y+b.length/2+50}));
      c.save();c.beginPath();c.rect(left,low,104,high-low);
      for(const bay of bays){const a=Math.max(low,bay.low),b=Math.min(high,bay.high);if(b>a)c.rect(left,a,104,b-a);}
      c.clip('evenodd');
      c.save();c.translate(0,-district.offset);
      paintPaving(c,curbing,left,low+district.offset,104,high-low,kind,street.seed,side?808:-4);
      const drives=s.aprons.filter(a=>a.x===left).map(a=>({low:a.low+district.offset,high:a.high+district.offset}));
      if(domestic&&side===s.side)drives.push({low:1530+district.offset,high:2070+district.offset},{low:3100+district.offset,high:3580+district.offset});
      const wash=street.patches.find(p=>p.dirtRoad);
      if(wash&&side===(wash.washSide>0?1:0))drives.push({low:wash.y-150+district.offset,high:wash.y+150+district.offset});
      paintCurb(c,curbing,edge,low+district.offset,high+district.offset,side,kind,street.seed,drives);
      c.restore();
      // A narrow brick soldier course belongs to the familiar home frontages.
      if(domestic){
        const bx=side?808:83;
        for(let row=Math.floor((low+district.offset)/25);row<=(high+district.offset)/25;row++){
          const y=row*25-district.offset,r=randomSource(street.seed+row*23);
          c.fillStyle=['#88745d','#9c866c','#797365','#a38f72'][Math.floor(r()*4)];c.fillRect(bx,y,9,24);
          c.fillStyle='#d9c3a135';c.fillRect(bx+.7,y+1,.6,22);c.fillStyle='#3b423752';c.fillRect(bx,y,9,.7);
        }
      }
      // A transverse stone course marks a change of frontage, so different
      // slab sizes meet at a real joint rather than stopping mid-flag.
      if(!district.first&&low<=0&&high>0){
        c.fillStyle=c.createPattern(curbing,'repeat');c.fillRect(left,0,104,8);
        c.fillStyle='#293b335c';c.fillRect(left,0,104,1);
        c.fillStyle='#d5cfb85c';c.fillRect(left,7,104,.7);
        for(let x=left+26;x<left+104;x+=26){c.fillStyle='#4f5b4970';c.fillRect(x,0,.7,8);}
      }
      // Utility lids belong to the paving, with room around them for people
      // and doorsteps. Keep them out of parking recesses and existing scenes.
      if(domestic&&side!==s.side)for(const y of [1480,2850]){
        if(y<low-28||y>high+28||s.aprons.some(a=>a.x===left&&y>a.low-30&&y<a.high+30))continue;
        c.save();c.translate(0,y);c.scale(1,-1);paintServiceCover(c,curbing,left+52,0,street.seed+y);c.restore();
      }
      // End stones turn into the parking recess; the asphalt edge is deliberate.
      for(const bay of bays)for(const y of [bay.low-8,bay.high]){
        if(y+8<low||y>high)continue;
        c.fillStyle=c.createPattern(curbing,'repeat');c.fillRect(left,y,104,8);
        c.fillStyle='#d7d2b75e';c.fillRect(left,y+6,104,.8);
        c.fillStyle='#26372d60';c.fillRect(left,y,104,1);
        for(let x=left+26;x<left+104;x+=26){c.fillStyle='#58604e77';c.fillRect(x,y,.8,8);}
      }
      c.restore();
    }
    // Planting has its own narrow bed along the property line. It no longer
    // replaces the entire sidewalk between gates or cuts across the paving.
    // Plain paving rounds off each frontage before its next neighbour starts.
    // Beds have their own ends instead of being chopped at district boundaries.
    const gardenGaps=domestic?[[floorStart+(district.first?0:170),1530],[2070,3100],[3580,floorEnd-(district.last?100:160)]]:[];
    const bedX=s.side?859:-8,plantX=s.side?882:18;
    for(const [a,b] of gardenGaps){
      const from=Math.max(low,a),to=Math.min(high,b);if(to<=from)continue;
      c.save();c.translate(0,-district.offset);
      paintPlantingBed(c,curbing,soil,bedX,a+district.offset,49,b-a,street.seed,{low:from+district.offset,high:to+district.offset});
      c.restore();
      for(let slot=Math.ceil(a/112);slot*112<b;slot++){
        const rand=randomSource(street.seed+slot*1777);if(rand()<.28)continue;
        const y=slot*112+14+(rand()-.5)*30,size=30+rand()*11;
        if(y<a+25||y>b-25||y<low-35||y>high+35)continue;
        if(s.aprons.some(a=>y>a.low-32&&y<a.high+32))continue;
        c.save();c.translate(plantX+(rand()-.5)*4,y);c.rotate(rand()*6.28);c.shadowColor='#17281b50';c.shadowBlur=2;
        if(shrub){
          c.drawImage(shrub,-size*.62,-size*.48,size,size*.88);
          c.rotate(1.3);c.drawImage(shrub,-size*.1,-size*.18,size*.58,size*.65);
        }c.restore();
      }
    }
    c.restore();
  }
  function paintGround(...args){for(const unused of paintGroundSteps(...args)){}}
  function* paintGroundSteps(c,street,top,bottom) {
    const s=scene(street), x=s.x, direction=s.side ? -1 : 1;
    if(!domestic){
      const left=s.side?778:0;
      if(kind==='parking')for(const [i,center] of [1100,2180,3200].entries()){
        if(center<bottom-160||center>top+160)continue;
        const y=top-center;
        c.fillStyle='#283332';c.fillRect(left+5,y-143,110,286);
        const metal=c.createLinearGradient(left+10,0,left+108,0);metal.addColorStop(0,'#707975');metal.addColorStop(.5,'#a4aaa0');metal.addColorStop(1,'#515e5a');
        c.fillStyle=metal;c.fillRect(left+10,y-138,100,276);
        c.fillStyle='#263e3945';for(let a=-130;a<135;a+=12)c.fillRect(left+12,y+a,96,2);
        c.fillStyle='#d8d1b980';c.font='bold 23px Georgia';c.textAlign='center';c.fillText(String(3+i),left+60,y+8);
        c.fillStyle='#38463f';c.fillRect(left+48,y+92,25,5);
      }
      if(kind==='works')for(const center of [850,2100,3350]){
        if(center<bottom-90||center>top+90)continue;
        const y=top-center;
        c.save();c.shadowColor='#12201a70';c.shadowBlur=4;c.shadowOffsetY=4;
        c.fillStyle='#6d6049';c.fillRect(x-36,y-62,72,124);c.shadowColor='transparent';
        for(let a=-54;a<58;a+=18){c.fillStyle=a%3?'#a9997c':'#897a5f';c.fillRect(x-35,y+a,70,12);}
        for(let i=0;i<4;i++){c.fillStyle=['#84887e','#a0a397','#7a8177','#b0b0a0'][i];c.fillRect(x-29+i*2,y-38+i*2,54,72);c.fillStyle='#5f696080';c.fillRect(x-29+i*2,y+32+i*2,54,2);}
        c.restore();
      }
      // The middle frontage opens onto the silt source, rather than putting a
      // decorative wall across the unsealed entrance.
      if(kind==='flooded')for(const center of [960,3430]){
        if(center<bottom-90||center>top+90)continue;
        const y=top-center,rand=randomSource(street.seed+center);
        c.fillStyle='#354238';c.fillRect(x-40,y-74,80,148);
        c.fillStyle='#7b8874';for(let row=0;row<8;row++)for(let col=0;col<3;col++)c.fillRect(x-38+col*26+(row%2?7:0),y-70+row*18,22,14);
        c.fillStyle='#233a2860';for(let i=0;i<45;i++)c.fillRect(x-38+rand()*76,y-70+rand()*140,2+rand()*4,2+rand()*3);
      }
      yield;
      for(const item of s.landmarks)if(item.y+item.height/2>=bottom&&item.y-item.height/2<=top){paintDistrictDetails(c,[item],district,top,bottom,curbing,detailSprites);yield;}
      return;
    }
    // Recessed paved garden entrances sit along the unparked side of the street.
    for(const [center,length,number] of [[1800,540,12],[3340,480,14]]) {
      if(center+length/2<bottom||center-length/2>top)continue;
      const left=s.side ? 796 : 0, y=top-center-length/2;
      c.save();
      c.save();c.translate(0,top+district.offset);c.scale(1,-1);
      paintPaving(c,curbing,left,center-length/2+district.offset,104,length,kind,street.seed,s.side?808:-4);
      paintCurb(c,curbing,s.side?796:104,center-length/2+district.offset,center+length/2+district.offset,s.side,kind,street.seed,[{low:center-length/2+district.offset,high:center+length/2+district.offset}]);
      c.restore();
      c.fillStyle='#5b675c';c.fillRect(s.side?884:0,y,16,length);
      // Gate sill and a small enamel house number, viewed from directly above.
      c.fillStyle=c.createPattern(curbing,'repeat');c.fillRect(s.side?878:10,top-center-46,12,92);
      c.fillStyle='#293f39';c.fillRect(s.side?865:19,top-center-29,17,58);
      // Weathered gate hardware: a latch, screw heads and a tiny brass doorbell.
      const gx=s.side?875:25;
      c.fillStyle='#78857b';c.fillRect(gx-2,top-center-19,4,38);
      c.fillStyle='#d1c7a6';c.fillRect(gx-5,top-center-2,10,4);
      c.fillStyle='#a79669';c.fillRect(s.side?889:4,top-center+62,7,13);
      c.fillStyle='#34463c';c.beginPath();c.arc(s.side?892.5:7.5,top-center+68,1.6,0,6.28);c.fill();
      c.save();c.translate(s.side?889:11,top-center-65);c.rotate(s.side?-Math.PI/2:Math.PI/2);
      c.fillStyle='#e2ddc7';c.fillRect(-12,-8,24,16);c.fillStyle='#354a41';c.font='bold 11px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(number+district.index*4,0,0);c.restore();
      c.restore();
      mat(c,x,top-center,s.side,street.seed+number);
      yield;
    }
    const flowers=[{x,y:1630,size:76},{x:x+direction*9,y:2030,size:59},{x,y:3270,size:74},{x:x+direction*10,y:3480,size:62},...(district.first?[{x:88,y:488,size:66}]:[]),...(district.last?[{x:812,y:localFinish-80,size:69}]:[])];
    for(const f of flowers)if(f.y>bottom-70&&f.y<top+70){
      sprite(c,0,f.x,top-f.y,f.size,f.y*.031);
      // A few fallen petals make the flowers belong to the paving.
      const rand=randomSource(street.seed+f.y);
      for(let n=0;n<7;n++){const a=rand()*6.28,r=f.size*.42+rand()*12;c.save();c.translate(f.x+Math.cos(a)*r,top-f.y+Math.sin(a)*r);c.rotate(a);c.fillStyle=n%3?'#ce929683':'#e6dabc9a';c.beginPath();c.ellipse(0,0,1.3,2.7,0,0,6.28);c.fill();c.restore();}
    }
    yield;
    if(1715>bottom-80&&1715<top+80)sprite(c,1,x,top-1715,67,s.side?.3:-.5);
    // Everyday objects stay on the recessed doorsteps, clear of the walking lane.
    if(1972>bottom-45&&1972<top+45)sprite(c,9,x-direction*8,top-1972,65,s.side?.22:-.22);
    if(1812>bottom-45&&1812<top+45)sprite(c,10,x+direction*31,top-1812,52,s.side?-.12:.12);
    if(3348>bottom-65&&3348<top+65)sprite(c,11,s.side?875:25,top-3348,106,s.side?-.08:.08);
    if(1578>bottom-35&&1578<top+35)sprite(c,12,x+direction*32,top-1578,43,s.side?.12:-.12);
    // Damp rubber leaves two small irregular marks beside the boots.
    if(1858>bottom-20&&1858<top+20){
      c.save();c.fillStyle='#343d3334';
      for(const dx of [-7,7]){c.beginPath();c.ellipse(x+direction*31+dx,top-1858,4.5,9,dx*.01,0,6.28);c.fill();}c.restore();
    }
    const bowlY=district.first?1960:1930;
    if(bowlY>bottom-40&&bowlY<top+40){
      const bx=x+direction*38,by=top-bowlY;
      if(district.first)paintCatWaterBowl(c,bx,by);
      else {c.save();c.fillStyle='#666b62';c.beginPath();c.ellipse(bx,by,11,9,0,0,6.28);c.fill();c.fillStyle='#c6c7b4';c.beginPath();c.ellipse(bx,by-1,9,7,0,0,6.28);c.fill();c.fillStyle='#819b9c';c.beginPath();c.ellipse(bx,by-1,7,5,0,0,6.28);c.fill();c.restore();}
    }
    for(let i=0;i<8;i++){const y=(district.first?1846:1900)-i*15;if(y<bottom-10||y>top+10)continue;paw(c,x+direction*(35+Math.sin(i*.7)*12)+(i%2?3:-3),top-y,direction*.4);}
    if(district.first&&1900>bottom-60&&1900<top+60)paintShoeBox(c,x,top-1900);
    if(district.first&&1900>bottom-100&&1900<top+100)paintCatKeepsakes(c,x,top-1900,s.side);
    if(!s.motion.ball&&3395>bottom-15&&3395<top+15)tennisBall(c,x+direction*39,top-3395);
    yield;
    if(3160>bottom-90&&3160<top+90)sprite(c,7,x,top-3160,100,s.side?-.05:.05);
    if(1550>bottom-40&&1550<top+40){
      c.save();c.translate(x,top-1550);c.shadowColor='#20312660';c.shadowBlur=3;c.shadowOffsetY=3;
      c.fillStyle='#8f704c';c.fillRect(-24,-19,48,38);c.shadowColor='transparent';
      c.fillStyle='#b49468';c.fillRect(-23,-19,46,34);c.fillStyle='#d6bd8e';c.fillRect(-3,-19,6,34);
      c.strokeStyle='#6d583b80';c.lineWidth=.7;c.strokeRect(-23,-19,46,34);c.fillStyle='#e3dcc5';c.fillRect(5,-9,12,15);
      c.fillStyle='#7c7c6b';for(let i=0;i<4;i++)c.fillRect(7,-6+i*2,6+(i%2)*2,.5);c.restore();
    }
    if(district.first&&bottom<560&&top>290)hopscotch(c,262,top-495);
    if(district.last&&bottom<localFinish+160&&top>localFinish-20){
      c.save();c.translate(633,top-(localFinish+58));
      chalk(c,p=>{p.moveTo(0,13);p.bezierCurveTo(-34,-8,-15,-25,0,-10);p.bezierCurveTo(15,-25,34,-8,0,13);},'#d7a3a4');c.restore();
    }
    yield;
    for(const item of s.landmarks)if(item.y+item.height/2>=bottom&&item.y-item.height/2<=top){paintDistrictDetails(c,[item],district,top,bottom,curbing,detailSprites);yield;}
  }
  function paintBird(c,pose,screenY) {
    const y=screenY(pose.y), height=pose.z*.55;
    c.save();c.globalAlpha=pose.flying?Math.max(0,.18-pose.z*.001):.22;c.fillStyle='#172420';
    c.beginPath();c.ellipse(pose.x+3+pose.z*.15,y+3,12,18,pose.angle,0,6.28);c.fill();c.restore();
    if(pose.flying)sprite(c,5,pose.x,y-height,102,pose.angle,false,pose.wings);
    sprite(c,4,pose.x,y-height+pose.peck*2-(pose.bob||0),52,pose.angle,false);
  }
  function paintLife(c,game,screenY,reduced,viewHeight) {
    const {street,time}=game;
    const s=scene(street), catY=screenY(1900);
    if(s.motion.helper){
      const pose=workshopHelperPose(s.motion.helper,time,reduced),y=screenY(pose.y);
      if(y>-30&&y<viewHeight+30){
        sprites.helperHead ||= createWorkshopHelperHead();paintWorkshopHelperHead(c,sprites.helperHead,pose,screenY);
      }
    }
    if(s.motion.balloon){
      const pose=doorstepBalloonPose(s.motion.balloon,time,reduced),y=screenY(pose.y);
      if(y>-40&&y<viewHeight+40){
        c.save();c.fillStyle='#283a3018';c.beginPath();c.ellipse(pose.x+9,y+7,18,24,pose.angle,0,Math.PI*2);c.fill();c.restore();
      }
    }
    if(s.motion.thief){
      const thief=s.motion.thief,pose=biscuitThiefPose(thief,time,reduced),y=screenY(thief.y);
      if(!thief.stolen&&y>-20&&y<viewHeight+20){
        sprites.biscuit ||= createBiscuitSprite();c.drawImage(sprites.biscuit,thief.x-16,y-16,32,32);
      }
      if(pose.visible&&!pose.flying&&screenY(pose.y)>-45&&screenY(pose.y)<viewHeight+45)paintTeaGuest(c,pose,screenY);
    }
    if(s.motion.dandelion){
      const flower=s.motion.dandelion,pose=dandelionPose(flower,time,reduced),y=screenY(pose.y);
      if(y>-36&&y<viewHeight+36){
        sprites.dandelion ||= createDandelionSprites();
        paintDandelion(c,sprites.dandelion,pose.x,y,pose.lean,flower.direction,pose.spent);
      }
    }
    if(s.motion.snail){
      const snail=s.motion.snail,pose=snailPose(snail),y=screenY(pose.y);
      if(y>-24&&y<viewHeight+24){
        sprites.snail ||= createSnailSprite();
        c.save();c.strokeStyle='#d4dec83d';c.lineWidth=.8;c.beginPath();c.moveTo(snail.x,screenY(snail.y));
        c.quadraticCurveTo((snail.x+pose.x)/2,screenY(snail.y)-2,pose.x,y);c.stroke();c.restore();
        paintSnail(c,sprites.snail,pose.x,y,pose.angle,reduced?(pose.shy>.5?1:0):pose.shy);
      }
    }
    if(s.tea){const y=screenY(s.tea.y);if(y>-100&&y<viewHeight+100)paintTeaSteam(c,s.tea.x,y,time,reduced);}
    if(s.pinwheel){
      const item=s.pinwheel,x=item.x+PINWHEEL.x,y=screenY(item.y)+PINWHEEL.y;
      if(y>-40&&y<viewHeight+40){
        sprites.pinwheel ||= createPinwheelSprite();
        const pose=pinwheelPose(time,item.seed,reduced),size=PINWHEEL.size;
        c.save();c.translate(x+5,y+18);c.scale(1,.48);c.rotate(pose.angle);
        c.drawImage(sprites.pinwheel.shadow,-size/2,-size/2,size,size);c.restore();
        c.save();c.translate(x,y);c.rotate(pose.tilt);c.scale(1,.67);c.rotate(pose.angle);
        c.drawImage(sprites.pinwheel.paper,-size/2,-size/2,size,size);c.restore();
      }
    }
    if(s.motion.ball){
      const b=s.motion.ball,y=screenY(b.y);
      for(const p of b.trail){const sy=screenY(p.y);if(sy< -8||sy>viewHeight+8)continue;c.fillStyle=`rgba(24,39,33,${p.wet*.18*Math.max(0,1-(time-p.at)/12)})`;c.beginPath();c.ellipse(p.x,sy,4,2.5,b.roll,0,Math.PI*2);c.fill();}
      if(y> -15&&y<viewHeight+15)tennisBall(c,b.x,y,reduced?0:b.roll,b.wet);
    }
    const breath=reduced?1:1+Math.sin(time*1.7+s.phase)*.008;
    if(domestic&&catY>-65&&catY<viewHeight+65){
      const wake=reduced?(time-s.motion.cat.lastNear<3.2?1:0):s.motion.cat.wake;
      const size=district.first?75:86,cy=catY-(district.first?5:0);
      c.save();c.globalAlpha=1-wake;sprite(c,2,s.x,cy,size,s.side ? .18 : -.18,true,s.side?-breath:breath);
      c.globalAlpha=wake;sprite(c,8,s.x,cy,size,s.side ? .18 : -.18,true,s.side?-breath:breath);c.restore();
      if(district.first)paintShoeBox(c,s.x,catY,true);
    }
    if(s.motion.duck){
      const pose=floatingDuckPose(s.motion.duck,time,reduced),y=screenY(pose.y);
      if(y>-40&&y<viewHeight+40){
        sprites.duck ||= createDuckSprite();
        c.save();c.translate(pose.x,y);c.rotate(pose.angle);c.strokeStyle='#b8c9ac50';c.lineWidth=.65;
        c.beginPath();c.ellipse(0,4,16+pose.squash*5,20+pose.squash*9,0,0,Math.PI*2);c.stroke();
        c.fillStyle='#1e332a45';c.beginPath();c.ellipse(2,4,12,17,0,0,Math.PI*2);c.fill();
        c.scale(1+pose.squash*.15,1-pose.squash*.6);c.drawImage(sprites.duck,-18,-22.5,36,42);c.restore();
      }
    }
    for(const boat of s.motion.boats){
      const pose=boatPose(boat,time,s.phase,reduced),y=screenY(pose.y);if(y< -35||y>viewHeight+35)continue;
      if(boat.crush){
        paintCrushedBoat(c,boat,pose.x,y,time,reduced);continue;
      }
      c.save();c.strokeStyle='#dce6df35';c.lineWidth=.6;c.beginPath();c.ellipse(pose.x,y+2,20,9,pose.angle,0,6.28);c.stroke();c.restore();
      sprite(c,3,pose.x,y,29,pose.angle,false);
    }
    for(const bird of s.wildlife.birds){const pose=birdPose(bird,time,reduced),y=screenY(pose.y);if(pose.visible&&!pose.flying&&y>-45&&y<viewHeight+45)paintBird(c,pose,screenY);}
  }
  function paintCrushedBoat(c,boat,x,y,time,reduced){
    const age=time-boat.crushedAt,fold=reduced?1:Math.min(1,age/.18),pressure=boat.crush.pressure;
    c.save();c.translate(x,y);c.rotate(boat.crush.angle);
    // A waterlogged hull opens into overlapping, creased paper panels. The
    // original photograph remains underneath, now wider and almost flat.
    c.save();c.scale(1+fold*.25,1-fold*.58);sprite(c,3,0,0,29,0,false);c.restore();
    c.globalAlpha=fold;
    const polygon=(points,fill)=>{c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fillStyle=fill;c.fill();};
    polygon([[-18,2],[-8,-8],[3,-5],[17,3],[7,9],[-10,8]],'#192b2638');
    polygon([[-17,0],[-8,-8],[1,-5],[14,4],[4,7],[-11,5]],'#b5b7a3');
    polygon([[-17,0],[-5,-4],[4,7],[-11,5]],'#d1cdb7');
    polygon([[-8,-8],[1,-5],[16,2],[5,3]],'#e1deca');
    polygon([[1,-5],[5,3],[14,4],[8,7]],'#939b8b');
    c.save();c.globalAlpha=fold*.2;c.scale(1.7,.46);sprite(c,3,0,0,29,0,false);c.restore();
    c.strokeStyle='#5a645751';c.lineWidth=.55;
    for(const line of [[-17,0,5,3],[-8,-8,4,7],[-5,-4,14,4],[1,-5,8,7]]){c.beginPath();c.moveTo(line[0],line[1]);c.lineTo(line[2],line[3]);c.stroke();}
    c.strokeStyle='#f3eadb88';c.beginPath();c.moveTo(-8,-7);c.lineTo(4,2);c.lineTo(14,3);c.stroke();
    // Broken sole ribs dent the softened paper; dirty soles leave darker ribs.
    c.save();c.beginPath();c.moveTo(-14,0);c.lineTo(-7,-6);c.lineTo(13,3);c.lineTo(3,6);c.closePath();c.clip();
    c.rotate(boat.crush.shoeAngle-boat.crush.angle);c.strokeStyle=`rgba(65,61,43,${.12+pressure*.13+Math.min(.3,boat.crush.soil)})`;c.lineWidth=1.1;
    for(let j=-9;j<10;j+=3){c.beginPath();c.moveTo(-16,j);c.lineTo(0,j+2);c.lineTo(16,j-1);c.stroke();}c.restore();
    // Torn corners and a dark wet edge remain on the road, never re-inflating.
    polygon([[-15,5],[-19,6],[-16,8]],'#c5c3ad');polygon([[14,1],[19,2],[16,4]],'#c7c9b7');
    c.globalAlpha=fold*Math.max(0,1-age/2)*.4;c.strokeStyle='#d5dfd7';c.lineWidth=.7;c.beginPath();c.ellipse(0,1,18+age*10,9+age*5,0,0,6.28);c.stroke();c.restore();
  }
  function paintAir(c,game,screenY,reduced,viewHeight){
    const s=scene(game.street),time=game.time;
    if(s.motion.balloon){
      const pose=doorstepBalloonPose(s.motion.balloon,time,reduced),y=screenY(pose.y)-pose.lift;
      if(screenY(pose.anchorY)>-5&&y<viewHeight+35){
        sprites.balloon ||= createDoorstepBalloonSprite();paintDoorstepBalloon(c,sprites.balloon,pose,screenY);
      }
    }
    if(s.motion.thief){
      const pose=biscuitThiefPose(s.motion.thief,time,reduced),y=screenY(pose.y)-pose.z*.55;
      if(pose.visible&&pose.flying&&y>-100&&y<viewHeight+100)paintTeaGuest(c,pose,screenY);
    }
    const flower=s.motion.dandelion;
    if(flower&&dandelionPose(flower,time,reduced).seedsVisible)for(let i=0;i<DANDELION_SEEDS.length;i++){
      const p=dandelionSeedPose(flower,time,i),y=screenY(p.y)-p.z;
      if(y>-12&&y<viewHeight+12)paintFloatingSeed(c,p.x,y,p.angle,p.alpha);
    }
    for(const bird of s.wildlife.birds){const pose=birdPose(bird,time,reduced),y=screenY(pose.y)-pose.z*.55;if(pose.visible&&pose.flying&&y>-100&&y<viewHeight+100)paintBird(c,pose,screenY);}
    for(const butterfly of (domestic?s.motion.butterflies:[])){
      const pose=butterflyPose(butterfly,time,reduced),x=pose.x,y=screenY(pose.y)-pose.height;
      if(y< -30||y>viewHeight+30)continue;
      sprite(c,6,x,y,15,pose.angle,true,pose.wings);
    }
  }
  function paintTeaGuest(c,pose,screenY){
    paintBird(c,pose,screenY);
    if(pose.carrying){
      sprites.biscuit ||= createBiscuitSprite();
      c.save();c.translate(pose.x,screenY(pose.y)-pose.z*.55+pose.peck*2-pose.bob);c.rotate(pose.angle);
      c.drawImage(sprites.biscuit,-16,-44,32,32);c.restore();
    }
  }
  function update(game){const s=scene(game.street);updateWildlife(s.wildlife,game);updateStreetMotion(s.motion,game);}
  function takeEvents(){return layout?[...layout.wildlife.events.splice(0),...layout.motion.events.splice(0)]:[];}
  function wildlifeState(){return layout?.wildlife.birds.map(b=>({x:+b.x.toFixed(1),y:b.y,fled:b.escapeAt!==null}))||[];}
  function sceneState(){return layout ? {helper:layout.motion.helper?workshopHelperPose(layout.motion.helper,layout.motion.lastTime):null,balloon:layout.motion.balloon?doorstepBalloonPose(layout.motion.balloon,layout.motion.lastTime):null,cat:{...layout.motion.cat},thief:layout.motion.thief?{...biscuitThiefPose(layout.motion.thief,layout.motion.lastTime),snack:{x:layout.motion.thief.x,y:layout.motion.thief.y},stolen:layout.motion.thief.stolen}:null,dandelion:layout.motion.dandelion?{...dandelionPose(layout.motion.dandelion,layout.motion.lastTime),burstAt:layout.motion.dandelion.burstAt}:null,snail:layout.motion.snail?snailPose(layout.motion.snail):null,duck:layout.motion.duck?{...floatingDuckPose(layout.motion.duck,layout.motion.lastTime),nudges:layout.motion.duck.nudges}:null,ball:layout.motion.ball?{x:layout.motion.ball.x,y:layout.motion.ball.y,started:layout.motion.ball.started,nudges:layout.motion.ball.nudges}:null,landmarks:layout.landmarks,boats:layout.motion.boats.map(b=>({x:b.x,y:b.y,dx:b.dx,dy:b.dy,roll:b.roll,...(b.crush?{crushedAt:b.crushedAt,pressure:b.crush.pressure}: {})}))} : null;}
  return {paintVerge,paintGround,paintGroundSteps,paintLife,paintAir,update,takeEvents,wildlifeState,sceneState};
}
