import { districtDetails, paintDistrictDetails } from './district-details.js?v=perf-62';
import { NEIGHBORHOOD_CROPS } from './sprite-data.js?v=perf-62';
import { randomSource, ROAD, PAVEMENT, DISTRICT_LENGTH } from './model.js?v=perf-62';
import { createWildlife, updateWildlife, birdPose } from './wildlife.js?v=perf-62';
import { createStreetMotion, updateStreetMotion, boatPose, butterflyPose } from './street-motion.js?v=perf-62';

// Small neighborhood scenes use their own seed, so decoration never changes a route.
export function createNeighborhood(atlas, paving, asphalt, lifeAtlas, shrub, awakeCat, details, curbing = paving) {
  const assets = [atlas, paving, asphalt, lifeAtlas, shrub, awakeCat, details, curbing];
  const sprites = []; let previous, blocks = [];
  function prepare(street) {
    if (previous === street) return;
    previous = street;
    blocks = (street.districts || [{offset:0,index:0,first:true,last:true,street}]).map(d =>
      ({...d, renderer:createNeighborhoodBlock(...assets,sprites,d), rings:new WeakMap(), game:null}));
  }
  function localGame(block, game) {
    const rings = game.rings.map(source => {
      let ring = block.rings.get(source);
      if (!ring) {ring={};block.rings.set(source,ring);}
      return Object.assign(ring,source,{y:source.y-block.offset});
    });
    return {...game,street:block.street,feet:game.feet.map(f=>({...f,y:f.y-block.offset})),rings};
  }
  function ground(method,c,street,top,bottom) {
    prepare(street);
    for(const b of blocks)if(top>b.offset&&(b.last||bottom<b.offset+DISTRICT_LENGTH))
      b.renderer[method](c,b.street,top-b.offset,bottom-b.offset);
  }
  function life(method,c,game,screenY,reduced,height) {
    prepare(game.street);
    for(const b of blocks)b.renderer[method](c,b.game||localGame(b,game),y=>screenY(y+b.offset),reduced,height);
  }
  return {
    paintVerge:(...args)=>ground('paintVerge',...args),paintGround:(...args)=>ground('paintGround',...args),
    paintLife:(...args)=>life('paintLife',...args),paintAir:(...args)=>life('paintAir',...args),
    update(game){prepare(game.street);for(const b of blocks){b.game=localGame(b,game);b.renderer.update(b.game);}},
    takeEvents(){return blocks.flatMap(b=>b.renderer.takeEvents().map(e=>({...e,y:e.y+b.offset})));},
    wildlifeState(){return blocks.flatMap(b=>b.renderer.wildlifeState().map(bird=>({...bird,y:bird.y+b.offset})));},
    sceneState(){
      const states=blocks.map(b=>({offset:b.offset,state:b.renderer.sceneState()})).filter(b=>b.state);
      const cats=states.map(b=>({...b.state.cat,y:b.state.cat.y+b.offset}));
      return states.length?{cat:cats[0],cats,districts:states.length,landmarks:states.flatMap(b=>b.state.landmarks.map(item=>({...item,y:item.y+b.offset}))),boats:states.flatMap(b=>b.state.boats.map(boat=>({...boat,y:boat.y+b.offset})))}:null;
    }
  };
}
function createNeighborhoodBlock(atlas, paving, asphalt, lifeAtlas, shrub, awakeCat, details, curbing = paving, sprites, district) {
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
    layout.motion = createStreetMotion(layout.boats, layout.x, side, layout.phase);
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
  function tennisBall(c,x,y) {
    c.save();c.translate(x,y);c.shadowColor='#15251e60';c.shadowBlur=2;c.shadowOffsetY=2;
    const light=c.createRadialGradient(-3,-3,1,0,0,9);light.addColorStop(0,'#c2c77b');light.addColorStop(.65,'#929d4c');light.addColorStop(1,'#596533');
    c.fillStyle=light;c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.fill();c.shadowColor='transparent';
    c.strokeStyle='#e6dec09c';c.lineWidth=1.1;c.beginPath();c.moveTo(-5,-6);c.bezierCurveTo(4,-3,-3,4,5,6);c.stroke();c.restore();
  }
  function paintVerge(c,street,top,bottom) {
    const s=scene(street), low=Math.max(bottom,floorStart), high=Math.min(top,floorEnd);
    if(high<=low)return;
    const left=s.side?778:0, edge=s.side?778:117;
    c.save();c.translate(0,top);c.scale(1,-1);
    const floor=c.createPattern(paving,'repeat');floor.setTransform(new DOMMatrix([1,0,0,1,0,-district.offset]));
    c.fillStyle=floor;c.fillRect(left,low,122,high-low);
    c.fillStyle=c.createPattern(curbing,'repeat');c.fillRect(edge,low,5,high-low);
    c.fillStyle='#34453e35';c.fillRect(s.side?777:122,low,1,high-low);
    if(kind==='works'){
      c.fillStyle='#766f60';c.fillRect(left+8,low,104,high-low);
      const rand=randomSource(street.seed+Math.floor(bottom));
      for(let i=0;i<(high-low)*1.2;i++){c.fillStyle=i%3?'#c5bba840':'#242b2840';c.fillRect(left+10+rand()*100,low+rand()*(high-low),1+rand()*3,1+rand()*2);}
      c.fillStyle='#e2ad3f90';for(let y=Math.ceil(low/180)*180;y<high;y+=180)c.fillRect(edge-2,y,8,45);
    }else if(kind==='flooded'){
      c.fillStyle='#354d414a';c.fillRect(left+6,low,108,high-low);
      c.fillStyle='#273d3559';c.fillRect(edge+(s.side?5:-12),low,8,high-low);
      for(let y=Math.ceil(low/620)*620;y<high;y+=620){
        c.fillStyle='#1b292d';c.fillRect(left+40,y-32,48,64);
        c.strokeStyle='#8a97924d';c.lineWidth=3;
        for(let a=0;a<8;a++){c.beginPath();c.moveTo(left+43,y-28+a*8);c.lineTo(left+85,y-28+a*8);c.stroke();}
      }
    }else if(kind==='parking'){
      c.fillStyle='#48515b1c';c.fillRect(left+6,low,108,high-low);
      c.fillStyle='#dccca680';for(let y=Math.ceil(low/120)*120;y<high;y+=120)c.fillRect(edge-1,y,7,65);
    }
    // Low planting connects the doorways without suggesting a walkable bypass.
    const gardenGaps=domestic?[[floorStart,1530],[2070,3100],[3580,floorEnd]]:[];
    for(const [a,b] of gardenGaps){
      const from=Math.max(low,a),to=Math.min(high,b);if(to<=from)continue;
      c.fillStyle='#4b5039';c.fillRect(left+8,from,104,to-from);
      c.save();c.globalAlpha=.22;c.fillStyle=c.createPattern(asphalt,'repeat');c.fillRect(left+8,from,104,to-from);c.restore();
      for(let y=a+48;y<b;y+=94){
        if(y<low-65||y>high+65||street.obstacles.some(o=>o.type==='bush'&&Math.abs(o.x-s.x)<20&&Math.abs(o.y-y)<108))continue;
        const rand=randomSource(street.seed+Math.floor(y)),size=88+rand()*12;
        c.save();c.translate(s.x+(rand()-.5)*8,y);c.rotate(rand()*6.28);c.shadowColor='#17281b50';c.shadowBlur=3;
        if(shrub)c.drawImage(shrub,-size/2,-size/2,size,size);c.restore();
      }
    }
    for(let y=Math.floor(low/120)*120;y<high;y+=120){
      if(y<low)continue;c.fillStyle='#68726a85';c.fillRect(edge,y,5,1.6);
      if(y%360)continue;
      c.strokeStyle='#4e6443';c.lineWidth=1.3;
      for(let i=0;i<5;i++){c.beginPath();c.moveTo(edge+2,y);c.quadraticCurveTo(edge+(s.side?8:-5),y-2+i,edge+(s.side?9:-6)+i*.5,y-5+i*2);c.stroke();}
    }
    c.restore();
  }
  function paintGround(c,street,top,bottom) {
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
      if(kind==='flooded')for(const center of [960,2400,3430]){
        if(center<bottom-90||center>top+90)continue;
        const y=top-center,rand=randomSource(street.seed+center);
        c.fillStyle='#354238';c.fillRect(x-40,y-74,80,148);
        c.fillStyle='#7b8874';for(let row=0;row<8;row++)for(let col=0;col<3;col++)c.fillRect(x-38+col*26+(row%2?7:0),y-70+row*18,22,14);
        c.fillStyle='#233a2860';for(let i=0;i<45;i++)c.fillRect(x-38+rand()*76,y-70+rand()*140,2+rand()*4,2+rand()*3);
      }
      paintDistrictDetails(c,s.landmarks,district,top,bottom,paving);
      return;
    }
    // Recessed paved garden entrances sit along the unparked side of the street.
    for(const [center,length,number] of [[1800,540,12],[3340,480,14]]) {
      if(center+length/2<bottom||center-length/2>top)continue;
      const left=s.side ? 778 : 0, y=top-center-length/2;
      c.save();
      // Use the same world origin as the entrance and verge so paving joints
      // remain continuous across terrain chunks and through garden thresholds.
      const floor=c.createPattern(paving,'repeat');floor.setTransform(new DOMMatrix([1,0,0,-1,0,top+district.offset]));
      c.fillStyle=floor;c.fillRect(left,y,122,length);
      c.fillStyle=c.createPattern(curbing,'repeat');c.fillRect(s.side?778:117,y,5,length);
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
    }
    const flowers=[{x,y:1630,size:76},{x:x+direction*9,y:2030,size:59},{x,y:3270,size:74},{x:x+direction*10,y:3480,size:62},...(district.first?[{x:88,y:488,size:66}]:[]),...(district.last?[{x:812,y:localFinish-80,size:69}]:[])];
    for(const f of flowers)if(f.y>bottom-70&&f.y<top+70){
      sprite(c,0,f.x,top-f.y,f.size,f.y*.031);
      // A few fallen petals make the flowers belong to the paving.
      const rand=randomSource(street.seed+f.y);
      for(let n=0;n<7;n++){const a=rand()*6.28,r=f.size*.42+rand()*12;c.save();c.translate(f.x+Math.cos(a)*r,top-f.y+Math.sin(a)*r);c.rotate(a);c.fillStyle=n%3?'#ce929683':'#e6dabc9a';c.beginPath();c.ellipse(0,0,1.3,2.7,0,0,6.28);c.fill();c.restore();}
    }
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
    if(1930>bottom-40&&1930<top+40){
      const bx=x+direction*38,by=top-1930;
      c.save();c.fillStyle='#666b62';c.beginPath();c.ellipse(bx,by,11,9,0,0,6.28);c.fill();c.fillStyle='#c6c7b4';c.beginPath();c.ellipse(bx,by-1,9,7,0,0,6.28);c.fill();c.fillStyle='#819b9c';c.beginPath();c.ellipse(bx,by-1,7,5,0,0,6.28);c.fill();c.restore();
    }
    for(let i=0;i<8;i++){const y=1900-i*15;if(y<bottom-10||y>top+10)continue;paw(c,x+direction*(35+Math.sin(i*.7)*12)+(i%2?3:-3),top-y,direction*.4);}
    if(3395>bottom-15&&3395<top+15)tennisBall(c,x+direction*39,top-3395);
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
    paintDistrictDetails(c,s.landmarks,district,top,bottom,paving);
  }
  function paintBird(c,pose,screenY) {
    const y=screenY(pose.y), height=pose.z*.55;
    c.save();c.globalAlpha=pose.flying?Math.max(0,.18-pose.z*.001):.22;c.fillStyle='#172420';
    c.beginPath();c.ellipse(pose.x+3+pose.z*.15,y+3,12,18,pose.angle,0,6.28);c.fill();c.restore();
    if(pose.flying)sprite(c,5,pose.x,y-height,102,pose.angle,false,pose.wings);
    sprite(c,4,pose.x,y-height+pose.peck*2,52,pose.angle,false);
  }
  function paintLife(c,game,screenY,reduced,viewHeight) {
    const {street,time}=game;
    const s=scene(street), catY=screenY(1900);
    const breath=reduced?1:1+Math.sin(time*1.7+s.phase)*.008;
    if(domestic&&catY>-65&&catY<viewHeight+65){
      const wake=reduced?(time-s.motion.cat.lastNear<3.2?1:0):s.motion.cat.wake;
      c.save();c.globalAlpha=1-wake;sprite(c,2,s.x,catY,86,s.side ? .18 : -.18,true,s.side?-breath:breath);
      c.globalAlpha=wake;sprite(c,8,s.x,catY,86,s.side ? .18 : -.18,true,s.side?-breath:breath);c.restore();
    }
    for(const boat of s.motion.boats){
      const pose=boatPose(boat,time,s.phase,reduced),y=screenY(pose.y);if(y< -35||y>viewHeight+35)continue;
      c.save();c.strokeStyle='#dce6df35';c.lineWidth=.6;c.beginPath();c.ellipse(pose.x,y+2,20,9,pose.angle,0,6.28);c.stroke();c.restore();
      sprite(c,3,pose.x,y,29,pose.angle,false);
    }
    for(const bird of s.wildlife.birds){const pose=birdPose(bird,time,reduced),y=screenY(pose.y);if(pose.visible&&!pose.flying&&y>-45&&y<viewHeight+45)paintBird(c,pose,screenY);}
  }
  function paintAir(c,game,screenY,reduced,viewHeight){
    const s=scene(game.street),time=game.time;
    for(const bird of s.wildlife.birds){const pose=birdPose(bird,time,reduced),y=screenY(pose.y)-pose.z*.55;if(pose.visible&&pose.flying&&y>-100&&y<viewHeight+100)paintBird(c,pose,screenY);}
    for(const butterfly of (domestic?s.motion.butterflies:[])){
      const pose=butterflyPose(butterfly,time,reduced),x=pose.x,y=screenY(pose.y)-pose.height;
      if(y< -30||y>viewHeight+30)continue;
      sprite(c,6,x,y,15,pose.angle,true,pose.wings);
    }
  }
  function update(game){const s=scene(game.street);updateWildlife(s.wildlife,game);updateStreetMotion(s.motion,game);}
  function takeEvents(){return layout?.wildlife.events.splice(0)||[];}
  function wildlifeState(){return layout?.wildlife.birds.map(b=>({x:+b.x.toFixed(1),y:b.y,fled:b.escapeAt!==null}))||[];}
  function sceneState(){return layout ? {cat:{...layout.motion.cat},landmarks:layout.landmarks,boats:layout.motion.boats.map(b=>({x:b.x,y:b.y,dx:b.dx,dy:b.dy,roll:b.roll}))} : null;}
  return {paintVerge,paintGround,paintLife,paintAir,update,takeEvents,wildlifeState,sceneState};
}
