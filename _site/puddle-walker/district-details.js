import {paintDrainGrate,paintPaving,paintCurb} from './street-surfaces.js?v=instant-menu-132';
import { randomSource, ROAD } from './model.js?v=instant-menu-132';
import {paintBiscuitCrumbs,paintBootPlanter,paintLittleRoadworks,paintPinwheelStake,paintRainyChalk,paintHouseKeyFob,paintSnailLeaf,paintCrossword,paintDandelionRoot,paintLadybirdPebble,paintPawRepair,paintBoatWorkshop,paintRainyPartyCrown,paintWorkshopHelperBody,paintSandbagSeaside} from './street-charm.js?v=instant-menu-132';

// Verge props stay outside the walking lane. Where a story spills onto the
// road, its position follows the matching physical patch in the route model.
const STORIES = {
  doorsteps: [['seedlings',780],['chalk',1360],['garden',2670],['hose',2280],['downpipe',1100]],
  parking: [['garage',680],['toolbox',1950],['tyres',2940],['spare-parts',1500]],
  works: [['plans',610],['tea-break',1540],['pipes',2860],['work-gloves',2480]],
  flooded: [['gauge',680],['drain',1770],['boats',3060],['sandbags',2650]],
  home: [['tiles',780],['tea-home',2440],['keys',3760],['milk',1350],['newspaper',2970],['planter',1980],['bin',2600]],
};
// Crops are measured against the 1536 x 1024 master. Prepare each photograph
// once; the six sprites are shared by every district and baked terrain chunk.
const DETAIL_CROPS = [[35,55,465,420],[530,96,470,370],[1060,52,450,425],[20,537,495,405],[580,525,380,415],[1060,533,458,409]];
const PHOTO_KINDS = ['hose','spare-parts','work-gloves','sandbags','milk','newspaper'];
export function createDistrictSprites(atlas) {
  if(!atlas)return [];
  const scale=atlas.width/1536;
  return DETAIL_CROPS.map(([x,y,w,h])=>{
    const sprite=document.createElement('canvas');sprite.width=160;sprite.height=Math.round(160*h/w);
    sprite.getContext('2d').drawImage(atlas,x*scale,y*scale,w*scale,h*scale,0,0,sprite.width,sprite.height);
    const silhouette=document.createElement('canvas');silhouette.width=sprite.width+16;silhouette.height=sprite.height+16;
    const mask=silhouette.getContext('2d');mask.drawImage(sprite,8,8);mask.globalCompositeOperation='source-in';mask.fillStyle='#14251e5c';mask.fillRect(0,0,silhouette.width,silhouette.height);
    const shade=document.createElement('canvas');shade.width=silhouette.width;shade.height=silhouette.height;
    const sc=shade.getContext('2d');sc.filter='blur(2.5px)';sc.drawImage(silhouette,0,0);
    return {image:sprite,shadow:shade};
  });
}
export function detailApron(item){
  const left=item.x<450;
  return {x:left?0:ROAD.right+4,width:ROAD.left-4,low:item.y-item.height/2,high:item.y+item.height/2,edge:left?ROAD.left-4:ROAD.right+4,side:left?1:-1};
}
export function districtDetails(street, district) {
  return (STORIES[district.profile?.id] || STORIES.doorsteps).map(([kind,y],i) => {
    const spill=kind==='planter'?street.patches.find(p=>p.gardenSpill&&p.washout):null;
    const runoff=kind==='downpipe'?street.patches.find(p=>p.doorstepRunoff):null;
    if(spill)y=spill.y;
    if(runoff)y=runoff.y;
    const bay=street.parking?.find(b=>Math.abs(b.y-y)<570);
    const source=spill||runoff;
    const side=source?(source.x>450?1:0):1-(bay?.side ?? street.parkingSide), x=side?845:55;
    return {kind,x,y,width:96,height:220,seed:(street.seed+i*173)>>>0};
  });
}
function oval(c,x,y,rx,ry,color) {c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function grain(c,rand,x,y,w,h,n=140) {
  for(let i=0;i<n;i++){c.fillStyle=i%3?'#f1e3c320':'#18211e25';c.fillRect(x+rand()*w,y+rand()*h,.5+rand()*1.5,.5+rand()*1.2);}
}
function shadow(c) {c.shadowColor='#17221e55';c.shadowBlur=3;c.shadowOffsetX=2;c.shadowOffsetY=3;}
function noShadow(c) {c.shadowColor='transparent';c.shadowOffsetX=c.shadowOffsetY=0;}
function mug(c,x,y,color='#c4d0bd') {
  shadow(c);oval(c,x,y,11,11,'#48534b');noShadow(c);
  c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.ellipse(x+11,y,5,6,0,0,6.28);c.stroke();
  oval(c,x,y,10,10,color);oval(c,x,y,7.6,7.6,'#b1a58b');
  const tea=c.createRadialGradient(x+2,y+2,.5,x,y,7);
  tea.addColorStop(0,'#846843');tea.addColorStop(.7,'#574632');tea.addColorStop(1,'#332f25');oval(c,x,y,6.5,6.5,tea);
  c.strokeStyle='#d0c9a55c';c.lineWidth=.55;c.beginPath();c.arc(x,y,5.5,3.7,5.2);c.stroke();
  c.strokeStyle='#e2d5b879';c.lineWidth=.8;c.beginPath();c.arc(x,y,8.8,3.5,5.3);c.stroke();
}
function pot(c,x,y,r,rand) {
  shadow(c);oval(c,x,y,r,r,'#765443');noShadow(c);
  const clay=c.createRadialGradient(x-r*.4,y-r*.5,1,x,y,r);clay.addColorStop(0,'#c29972');clay.addColorStop(.78,'#ac7956');clay.addColorStop(1,'#6e5140');
  oval(c,x-1,y-1,r-1,r-1,clay);oval(c,x-1,y-1,r-3,r-3,'#373b2c');
  for(let i=0;i<r*3;i++){const a=rand()*6.28,d=rand()*(r-4);oval(c,x+Math.cos(a)*d,y+Math.sin(a)*d,.4+rand()*.6,.4,i%2?'#766b4c':'#292e24');}
  const count=Math.max(8,Math.floor(r*.8));
  for(let i=0;i<count;i++){
    const a=i*2.4+(rand()-.5)*.4,l=r*(.45+rand()*.5);
    c.save();c.translate(x-1,y-1);c.rotate(a);
    const green=c.createLinearGradient(0,-3,0,4);green.addColorStop(0,'#879458');green.addColorStop(.45,'#687e45');green.addColorStop(1,'#354f32');
    oval(c,l*.45,0,l*.55,Math.max(1.5,l*.18),green);c.strokeStyle='#a5ae6c66';c.lineWidth=.35;c.beginPath();c.moveTo(0,0);c.lineTo(l*.9,0);c.stroke();c.restore();
  }
}
function tyre(c,x,y,r) {
  shadow(c);oval(c,x,y,r,r,'#25302c');noShadow(c);oval(c,x-1,y-1,r-2,r-2,'#3c4440');oval(c,x,y,r*.68,r*.68,'#1e2925');oval(c,x,y,r*.49,r*.49,'#777c70');
  c.strokeStyle='#aaa99a44';c.lineWidth=1.2;c.beginPath();c.arc(x-1,y-1,r-4,3.5,5.4);c.stroke();
  for(let i=0;i<24;i++){const a=i*Math.PI/12;c.save();c.translate(x,y);c.rotate(a);c.strokeStyle='#14221d80';c.beginPath();c.moveTo(r-3,-1);c.lineTo(r-8,1);c.stroke();c.restore();}
}
function boat(c,x,y,a,rand) {
  c.save();c.translate(x,y);c.rotate(a);shadow(c);c.fillStyle='#c8c6b7';c.beginPath();c.moveTo(-20,-4);c.lineTo(0,-15);c.lineTo(21,-3);c.lineTo(10,10);c.lineTo(-10,10);c.closePath();c.fill();noShadow(c);
  c.fillStyle='#e4e1d2';c.beginPath();c.moveTo(-19,-4);c.lineTo(0,0);c.lineTo(19,-3);c.lineTo(10,9);c.lineTo(-10,9);c.closePath();c.fill();
  c.fillStyle='#f1ecdb';c.beginPath();c.moveTo(-10,-5);c.lineTo(0,-14);c.lineTo(0,0);c.closePath();c.fill();
  c.strokeStyle='#7d847560';c.lineWidth=.6;c.beginPath();c.moveTo(-17,-2);c.lineTo(0,3);c.lineTo(17,-2);c.stroke();grain(c,rand,-13,1,24,6,14);
  c.fillStyle='#4c7784';c.font='6px monospace';c.textAlign='center';c.fillText('1',0,8);
  c.strokeStyle='#54758288';c.lineWidth=.7;c.beginPath();c.moveTo(-7,-5);c.lineTo(-1,-10);c.stroke();c.restore();
}
function leaf(c,x,y,a,color) {c.save();c.translate(x,y);c.rotate(a);oval(c,0,0,3,7,color);c.strokeStyle='#474c3360';c.lineWidth=.5;c.beginPath();c.moveTo(0,-5);c.lineTo(0,5);c.stroke();c.restore();}
function tool(c,x,y,a,spade=false) {
  c.save();c.translate(x,y);c.rotate(a);shadow(c);c.fillStyle='#a58a60';c.fillRect(-2,-25,4,30);noShadow(c);c.fillStyle='#8a8e80';c.fillRect(-1,2,2,13);
  if(spade){c.beginPath();c.moveTo(-7,10);c.lineTo(7,10);c.lineTo(5,26);c.quadraticCurveTo(0,33,-5,26);c.closePath();c.fill();}
  else for(let i=-1;i<=1;i++)c.fillRect(i*5-1,10,2,18);
  c.restore();
}
function apron(c,item,top,paving,kind,offset,seed) {
  const a=detailApron(item),y=top-a.high,h=a.high-a.low,r=randomSource(item.seed^0x51dab);
  // Recessed paving meets the off-screen property edge. Shared world texture
  // continues through it, instead of placing a coloured rectangle under a prop.
  c.save();c.beginPath();c.rect(a.x,y,a.width,h);c.clip();
  c.save();c.translate(0,top+offset);c.scale(1,-1);
  paintPaving(c,paving,a.x,a.low+offset,a.width,h,kind,seed,item.x<450?-4:808);
  paintCurb(c,paving,a.edge,a.low+offset,a.high+offset,item.x<450?0:1,kind,seed,[{low:a.low+offset,high:a.high+offset}]);
  c.restore();
  // Chipped joints and settled grit connect the apron to the curb. The marks
  // are generated in apron space, so crossing a terrain chunk cannot reset them.
  c.strokeStyle='#263d3340';c.lineWidth=.7;
  for(const yy of [y+.7,y+h-.7]){c.beginPath();c.moveTo(a.x,yy);c.lineTo(a.x+a.width,yy);c.stroke();}
  c.fillStyle='#28362f50';c.fillRect(a.edge-a.side*2.5,y,2.5,h);
  c.fillStyle='#d6d0b850';c.fillRect(a.edge-a.side*4,y,1,h);
  for(let n=0;n<55;n++){
    const yy=y+r()*h,x=a.edge-a.side*(3+r()*7),size=.4+r()*1.4;
    c.fillStyle=['#514d3c70','#b9ae8770','#4b5b3f66'][n%3];c.fillRect(x,yy,size,size*.7);
  }
  for(const end of [-1,1]){
    const yy=y+(end>0?h-1:1),xx=a.edge-a.side*(10+r()*13);
    c.strokeStyle='#25372f55';c.lineWidth=.65;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-a.side*4,yy-end*8);c.lineTo(xx-a.side*13,yy-end*13);c.lineTo(xx-a.side*16,yy-end*26);c.stroke();
  }
  if(kind==='flooded'||kind==='doorsteps'||kind==='home')for(let n=0;n<7;n++){
    const yy=y+8+r()*(h-16),x=a.edge-a.side*(4+r()*3);
    c.strokeStyle=n%2?'#53694485':'#84916069';c.lineWidth=.7;c.beginPath();c.moveTo(x,yy);c.quadraticCurveTo(x-a.side*4,yy-3,x-a.side*(3+r()*4),yy-6-r()*4);c.stroke();
  }
  c.restore();
}
function dampPatch(c,x,y,rx,ry,seed,color){
  c.save();c.translate(x,y);c.scale(rx,ry);c.beginPath();
  for(let i=0;i<=36;i++){const a=i/36*Math.PI*2,r=.86+.09*Math.sin(a*3+seed)+.05*Math.sin(a*7-seed);if(i)c.lineTo(Math.cos(a)*r,Math.sin(a)*r);else c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.clip();
  const fade=c.createRadialGradient(-.12,-.18,.05,0,0,1);fade.addColorStop(0,color+'44');fade.addColorStop(.55,color+'26');fade.addColorStop(1,color+'00');
  c.fillStyle=fade;c.fillRect(-1,-1,2,2);c.restore();
}
function everydayScene(c,item,r,sprites) {
  const index=PHOTO_KINDS.indexOf(item.kind),art=sprites?.[index],sprite=art?.image;
  if(index<0)return false;
  if(item.kind==='hose'){
    dampPatch(c,1,18,37,53,item.seed,'#263d36');
    c.strokeStyle='#2f453d40';c.lineWidth=1.5;c.beginPath();c.moveTo(24,26);c.bezierCurveTo(31,47,17,57,27,83);c.stroke();
    for(let n=0;n<12;n++)oval(c,24+(r()-.5)*16,34+r()*57,.7+r()*1.1,.5+r()*.7,'#203d353f');
    leaf(c,-23,67,.7,'#7b7754');
  }else if(item.kind==='spare-parts'){
    dampPatch(c,-3,12,39,38,item.seed,'#1b2c28');
    for(let n=0;n<3;n++){
      const x=-20+n*18,y=62+r()*12;
      oval(c,x+.8,y+1,3.2,3.2,'#1b272660');oval(c,x,y,2.8,2.8,'#8d9488');oval(c,x,y,1.3,1.3,'#344038');
    }
    c.strokeStyle='#1f2b2745';c.lineWidth=2;c.beginPath();c.moveTo(24,32);c.quadraticCurveTo(20,45,28,50);c.stroke();
  }else if(item.kind==='work-gloves'){
    paintPawRepair(c,item.seed);
    dampPatch(c,0,14,43,54,item.seed,'#c8b791');
    for(let n=0;n<50;n++)oval(c,(r()-.5)*73,25+r()*51,.5+r()*.6,.5,n%3?'#b8a38055':'#3d413b44');
    c.fillStyle='#a899704d';c.fillRect(-27,64,52,3);
  }else if(item.kind==='sandbags'){
    dampPatch(c,0,23,46,67,item.seed,'#25382c');
    for(let n=0;n<90;n++)oval(c,(r()-.5)*78,27+r()*49,.5+r()*1.1,.5+r()*.7,n%2?'#a693665b':'#35433270');
    for(let n=0;n<3;n++)leaf(c,-36+n*5,36+r()*12,r()*6.28,n%2?'#6e623c':'#817249');
  }else if(item.kind==='milk'){
    c.strokeStyle='#2b3e352e';c.lineWidth=1.2;
    for(const x of [-19,17]){c.beginPath();c.ellipse(x,65,8.5,8.5,0,.3,5.7);c.stroke();}
  }else if(item.kind==='newspaper'){
    dampPatch(c,1,12,43,40,item.seed,'#384035');
    c.strokeStyle='#9b896552';c.lineWidth=.7;c.beginPath();c.moveTo(-23,44);c.bezierCurveTo(-34,54,-11,66,-21,79);c.stroke();
  }
  if(sprite){
    const width=item.kind==='work-gloves'?76:item.kind==='milk'?74:87,height=width*sprite.height/sprite.width;
    c.save();c.rotate(item.kind==='newspaper'?-.08:item.kind==='work-gloves'?.1:0);
    const pad=width/20;
    c.drawImage(art.shadow,-width/2-pad+.6,-height/2-9-pad+1.1,width+pad*2,height+pad*2);
    c.drawImage(sprite,-width/2,-height/2-9,width,height);c.restore();
  }
  if(item.kind==='newspaper')paintCrossword(c,item.seed);
  if(item.kind==='sandbags')paintSandbagSeaside(c,item.seed);
  return true;
}
function paintItem(c,item,top,paving,kind,offset,sprites,seed) {
  apron(c,item,top,paving,kind,offset,seed);
  const r=randomSource(item.seed), y=top-item.y;
  c.save();c.translate(item.x,y);
  if(everydayScene(c,item,r,sprites)){c.restore();return;}
  switch(item.kind){
    case 'downpipe': {
      const toward=item.x<450?1:-1;
      dampPatch(c,toward*25,2,31,23,item.seed,'#34493c');
      // A weathered cast-iron shoe discharges through the curb. Its lip lines
      // up with the real water patch rather than painting a second fake stream.
      c.save();c.scale(toward,1);shadow(c);
      c.fillStyle='#34423b';c.beginPath();c.roundRect(-60,-13,100,26,5);c.fill();noShadow(c);
      const pipe=c.createLinearGradient(0,-12,0,12);
      pipe.addColorStop(0,'#8e9a8d');pipe.addColorStop(.25,'#647a6d');pipe.addColorStop(.6,'#3b5146');pipe.addColorStop(1,'#263c32');
      c.fillStyle=pipe;c.beginPath();c.roundRect(-61,-11,99,22,4);c.fill();
      for(const x of [-26,18]){
        c.fillStyle='#293c31';c.fillRect(x,-13,5,26);c.fillStyle='#96a08c91';c.fillRect(x, -12,1.2,24);
      }
      oval(c,38,0,5,12,'#a0a68d');oval(c,39,0,3.5,9,'#1e3027');
      c.strokeStyle='#d0d0ad5c';c.lineWidth=.7;c.beginPath();c.moveTo(-61,-7);c.lineTo(35,-7);c.stroke();
      grain(c,r,-61,-10,97,20,140);
      for(let i=0;i<11;i++)oval(c,-35+r()*64,(r()-.5)*17,.6+r()*1.5,.5+r(),i%2?'#a58a60a0':'#273c30aa');
      c.restore();break;
    }
    case 'seedlings':
      shadow(c);c.fillStyle='#6b634b';c.fillRect(-38,-31,76,70);noShadow(c);
      for(let i=0;i<4;i++){c.fillStyle='#a08a60';c.fillRect(-37,-30+i*20,74,4);}
      paintPinwheelStake(c);
      for(let row=0;row<2;row++)for(let col=0;col<3;col++){
        if(row===1&&col===1){
          // Someone has already accepted the invitation. Only the damp pot
          // ring and a few crumbs of compost remain in the middle of the crate.
          oval(c,0,14,9.3,9,'#3b423235');c.strokeStyle='#333c2a6b';c.lineWidth=1.1;c.beginPath();c.ellipse(0,14,8.8,8.6,0,.3,5.8);c.stroke();
          for(const [x,y] of [[-3,18],[4,11],[-6,23],[9,19]])oval(c,x,y,.7,.5,'#51472d');
        }else pot(c,-25+col*25,-16+row*30,10,r);
      }
      c.save();c.translate(0,65);c.rotate(-.04);c.fillStyle='#dbd1ae';c.fillRect(-36,-13,72,26);c.fillStyle='#4b5c43';c.font='10px Georgia';c.textAlign='center';c.fillText('take a plant',0,3);grain(c,r,-36,-13,72,26,100);c.restore();
      paintLadybirdPebble(c);
      break;
    case 'chalk':
      paintRainyChalk(c,item.seed);
      for(let i=0;i<5;i++){c.save();c.translate(-25+i*11,62+(i%2)*6);c.rotate((r()-.5)*.8);shadow(c);c.fillStyle=['#e3c68e','#c29391','#a7b8b5'][i%3];c.fillRect(-2,-10,4,17+r()*6);noShadow(c);c.restore();}
      break;
    case 'garden':
      pot(c,-17,-33,21,r);paintBootPlanter(c,21,4,item.seed);tool(c,-18,53,.15,true);tool(c,13,59,-.2);
      paintSnailLeaf(c,item.x<450?8:-8,-82);
      for(let i=0;i<18;i++)oval(c,(r()-.5)*60,20+r()*68,.6+r(),.8,'#4b483b75');
      break;
    case 'garage':
      shadow(c);c.fillStyle='#283c41';c.fillRect(-40,-61,80,122);noShadow(c);c.strokeStyle='#b7b29a';c.lineWidth=1;c.strokeRect(-36,-57,72,114);
      c.textAlign='center';c.fillStyle='#e0d8b6';c.font='bold 22px Georgia';c.fillText('JO’S',0,-17);c.font='10px sans-serif';c.fillText('REPAIRS',0,3);
      c.strokeStyle='#c1c0a4';c.lineWidth=2;c.beginPath();c.moveTo(-14,31);c.lineTo(14,17);c.stroke();c.beginPath();c.arc(16,15,6,.4,4.1);c.stroke();
      grain(c,r,-39,-60,78,120,450);paintDandelionRoot(c,(item.x<450?1:-1)*31,-91,item.x<450?1:-1,item.seed);break;
    case 'toolbox':
      shadow(c);c.fillStyle='#833f31';c.fillRect(-35,-44,70,70);noShadow(c);c.fillStyle='#343b34';c.fillRect(-31,-39,62,60);c.fillStyle='#a25c43';c.fillRect(-35,-58,70,13);
      for(let i=0;i<4;i++){c.strokeStyle=i%2?'#969e91':'#b9b4a3';c.lineWidth=2;c.beginPath();c.moveTo(-23+i*14,-30);c.lineTo(-17+i*13,15);c.stroke();}
      c.save();c.translate(-26,65);c.rotate(-.1);c.fillStyle='#d0c5a0';c.fillRect(-11,-17,22,34);grain(c,r,-11,-17,22,34,45);
      c.strokeStyle='#7b79636b';c.lineWidth=.6;for(let y=-11;y<12;y+=5){c.beginPath();c.moveTo(-7,y);c.lineTo(5-(y%3),y);c.stroke();}
      c.strokeStyle='#625d4b80';c.beginPath();c.moveTo(-9,12);c.lineTo(7,15);c.stroke();c.restore();
      paintWorkshopHelperBody(c,item.seed);break;
    case 'tyres':
      tyre(c,-2,-27,34);tyre(c,7,36,30);
      c.fillStyle='#7a8b83';c.fillRect(-38,12,6,72);c.fillStyle='#393e36';c.fillRect(-45,10,20,5);c.fillRect(-42,81,17,4);c.strokeStyle='#222f28';c.lineWidth=2;c.beginPath();c.moveTo(-33,78);c.bezierCurveTo(15,101,13,68,25,54);c.stroke();break;
    case 'plans':
      shadow(c);c.fillStyle='#d0c7a9';c.fillRect(-36,-66,72,119);noShadow(c);c.fillStyle='#ece4ca';c.fillRect(-34,-64,68,115);
      c.strokeStyle='#6b8e945c';c.lineWidth=.6;for(let i=-24;i<30;i+=12){c.beginPath();c.moveTo(i,-52);c.lineTo(i,40);c.stroke();}for(let i=-52;i<42;i+=12){c.beginPath();c.moveTo(-25,i);c.lineTo(25,i);c.stroke();}
      c.strokeStyle='#4f6b6f';c.lineWidth=1.5;c.strokeRect(-19,-30,38,48);c.beginPath();c.moveTo(-30,-4);c.lineTo(29,-4);c.stroke();
      c.fillStyle='#aa6846';c.fillRect(18,-45,3,66);oval(c,-23,38,7,5,'#777a69');c.fillStyle='#a3583f';c.font='8px monospace';c.textAlign='center';c.fillText('12 — 28',0,-45);grain(c,r,-34,-64,68,115,160);
      paintLittleRoadworks(c,-10,55,item.seed);break;
    case 'tea-break':
      shadow(c);c.fillStyle='#6c725d';c.fillRect(-35,-50,70,100);noShadow(c);c.strokeStyle='#b3ab8a';c.lineWidth=2;for(let i=-27;i<=27;i+=18)c.strokeRect(i,-48,13,96);
      c.fillStyle='#696f5b';c.fillRect(-27,-30,17,55);c.fillStyle='#b6b7a2';c.fillRect(-27,-33,17,10);c.fillRect(-27,20,17,5);
      mug(c,15,-11,'#d1c6a0');c.fillStyle='#ded4b3';c.fillRect(-11,36,33,18);grain(c,r,-11,36,33,18,50);paintBiscuitCrumbs(c,1,43,item.seed);break;
    case 'pipes':
      shadow(c);for(let i=0;i<3;i++){const x=-33+i*24;const g=c.createLinearGradient(x,0,x+20,0);g.addColorStop(0,'#695744');g.addColorStop(.4,'#bd9672');g.addColorStop(1,'#80684e');c.fillStyle=g;c.fillRect(x,-65,21,130);}
      noShadow(c);c.fillStyle='#434c4255';c.fillRect(-36,-31,75,5);c.fillRect(-36,38,75,5);grain(c,r,-34,-64,70,128,180);break;
    case 'gauge':
      c.fillStyle='#263b3440';c.fillRect(-45,-95,90,190);c.fillStyle='#d8d3bb';c.fillRect(-8,-81,25,162);c.fillStyle='#3d5148';c.font='8px monospace';c.textAlign='right';
      for(let i=0;i<16;i++){c.fillRect(-8,-75+i*10,i%5?7:12,1);if(i%5===0)c.fillText(String(15-i),14,-72+i*10);}
      c.fillStyle='#4f7b7055';c.fillRect(-8,14,25,67);c.strokeStyle='#5e74615c';c.lineWidth=3;c.beginPath();c.moveTo(-43,14);c.bezierCurveTo(-10,9,18,19,43,13);c.stroke();
      oval(c,-27,-41,13,13,'#344c43');oval(c,-27,-41,10,10,'#718278');oval(c,-27,-41,7,7,'#253d36');break;
    case 'drain':
      paintDrainGrate(c,56,86,Math.floor(item.seed));
      for(let i=0;i<9;i++)leaf(c,(r()-.5)*47,-35+r()*17,r()*6.28,['#8a7749','#706b42','#9b8753'][i%3]);
      c.strokeStyle='#4e68415e';c.lineWidth=1.2;for(let i=0;i<14;i++){const x=-31+r()*5,y=-43+r()*86;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-5,y+9,x+3,y+18);c.stroke();}break;
    case 'boats':
      for(let i=0;i<6;i++)leaf(c,(i%2?-1:1)*(30+r()*10),(r()-.5)*180,r()*6.28,i%2?'#857650':'#5a6845');
      paintBoatWorkshop(c,item.seed);boat(c,-11,-51,-.12,r);break;
    case 'tiles':
      c.fillStyle='#9b73553b';c.fillRect(-46,-108,92,216);c.strokeStyle='#6d695b6b';c.lineWidth=.8;
      for(let yy=-100;yy<110;yy+=27)for(let xx=-44;xx<44;xx+=29)c.strokeRect(xx,yy,28,26);
      pot(c,1,-25,25,r);c.fillStyle='#d5c19b';c.font='24px Georgia';c.textAlign='center';c.fillText('28',0,68);grain(c,r,-46,-108,92,216,280);paintRainyPartyCrown(c,item.seed);break;
    case 'planter': {
      const toward=item.x<450?1:-1;
      // A pot on its side: tapered body, dark open mouth and a chipped rim.
      c.save();c.rotate(-toward*Math.PI/2);shadow(c);
      const clay=c.createLinearGradient(-23,0,23,0);
      clay.addColorStop(0,'#75533c');clay.addColorStop(.32,'#c3946f');clay.addColorStop(.7,'#ae7652');clay.addColorStop(1,'#6b4b37');
      c.fillStyle=clay;c.beginPath();c.moveTo(-15,-25);c.quadraticCurveTo(0,-31,15,-25);c.lineTo(23,17);c.quadraticCurveTo(0,28,-23,17);c.closePath();c.fill();noShadow(c);
      oval(c,0,17,24,9,'#b18a65');oval(c,0,17,20,6,'#4a3c2a');oval(c,0,18,17,4,'#302f23');
      c.strokeStyle='#dbc4a581';c.lineWidth=1;c.beginPath();c.ellipse(-.5,16,22,8,0,Math.PI,Math.PI*2);c.stroke();
      c.fillStyle='#d0aa80';c.beginPath();c.moveTo(12,10);c.lineTo(17,14);c.lineTo(14,19);c.closePath();c.fill();
      grain(c,r,-14,-23,28,34,80);c.restore();
      for(let i=0;i<70;i++){
        const x=toward*(20+r()*30),y=(r()-.5)*36;
        oval(c,x,y,.5+r()*1.7,.4+r(),'#473b29b0');
      }
      for(const [x,y,a] of [[26,23,.3],[34,-27,-.7],[13,42,.9]]){
        c.save();c.translate(toward*x,y);c.rotate(a);shadow(c);c.fillStyle='#ac7956';
        c.beginPath();c.moveTo(-4,-6);c.lineTo(6,-3);c.lineTo(1,6);c.lineTo(-5,3);c.closePath();c.fill();noShadow(c);
        c.strokeStyle='#d2af87';c.lineWidth=.8;c.beginPath();c.moveTo(-4,-6);c.lineTo(6,-3);c.stroke();c.restore();
      }
      break;
    }
    case 'bin': {
      const toward=item.x<450?1:-1;
      dampPatch(c,toward*28,2,27,31,item.seed,'#45472c');
      c.strokeStyle='#4c503b5c';c.lineWidth=3;c.beginPath();c.moveTo(toward*24,3);c.bezierCurveTo(toward*34,-4,toward*42,4,toward*53,0);c.stroke();
      shadow(c);c.fillStyle='#1e2c27';c.beginPath();c.roundRect(-35,-57,70,115,6);c.fill();noShadow(c);
      for(const x of [-28,28]){c.fillStyle='#29312a';c.beginPath();c.roundRect(x-6,46,12,22,3);c.fill();c.fillStyle='#697365';c.fillRect(x-2,51,4,12);}
      const lid=c.createLinearGradient(-33,-52,33,48);
      lid.addColorStop(0,'#637568');lid.addColorStop(.25,'#758272');lid.addColorStop(.7,'#465e50');lid.addColorStop(1,'#2f493c');
      c.fillStyle=lid;c.beginPath();c.roundRect(-33,-55,66,105,5);c.fill();
      c.strokeStyle='#a1ad9166';c.lineWidth=1;c.beginPath();c.roundRect(-29,-51,58,96,4);c.stroke();
      c.strokeStyle='#233c2d85';c.lineWidth=2;for(const x of [-20,20]){c.beginPath();c.moveTo(x,-40);c.lineTo(x,36);c.stroke();}
      c.fillStyle='#293e32';c.fillRect(-18,-60,36,6);c.fillStyle='#82907a';c.fillRect(-15,-59,30,2);
      c.fillStyle='#d5d6b99c';c.font='15px sans-serif';c.textAlign='center';c.fillText('28',0,-6);
      grain(c,r,-31,-53,62,99,320);
      // A tied bag waits beside the bin, with creases pulled towards the knot.
      c.save();c.translate(-toward*9,83);shadow(c);
      const bag=c.createRadialGradient(-7,-6,2,0,0,24);bag.addColorStop(0,'#606963');bag.addColorStop(.45,'#353f38');bag.addColorStop(1,'#18291f');
      oval(c,0,0,24,19,bag);noShadow(c);c.strokeStyle='#8990875b';c.lineWidth=.65;
      for(let i=0;i<9;i++){const a=i*2.4;c.beginPath();c.moveTo(2,-3);c.quadraticCurveTo(Math.cos(a)*11,Math.sin(a)*6,Math.cos(a)*21,Math.sin(a)*16);c.stroke();}
      oval(c,2,-3,4,3,'#747d6b');c.fillStyle='#384d39';c.fillRect(1,-9,3,7);c.restore();break;
    }
    case 'tea-home':
      c.fillStyle='#c1a18160';c.fillRect(-43,-65,86,130);grain(c,r,-43,-65,86,130,250);
      shadow(c);c.fillStyle='#728075';c.beginPath();c.roundRect(-35,-38,70,91,9);c.fill();noShadow(c);c.strokeStyle='#c7c5af';c.lineWidth=1;c.strokeRect(-30,-33,60,81);
      c.strokeStyle='#394d3e35';c.lineWidth=.8;c.beginPath();c.arc(-17,25,10,.4,5.8);c.stroke();
      c.strokeStyle='#b5bc9c45';c.lineWidth=.5;c.beginPath();c.moveTo(-28,43);c.lineTo(-18,44);c.moveTo(27,-27);c.lineTo(28,-18);c.stroke();
      mug(c,-16,-7,'#d5c7aa');mug(c,15,20,'#b5c2ad');oval(c,13,-22,9,6,'#b49566');
      c.strokeStyle='#d9d2b5';c.lineWidth=.55;c.beginPath();c.moveTo(-12,-11);c.bezierCurveTo(-2,-22,7,-13,1,-1);c.stroke();
      shadow(c);c.fillStyle='#e1d5b5';c.fillRect(-2,-1,7,9);noShadow(c);c.fillStyle='#a86e56';c.fillRect(-1,3,5,2);
      break;
    case 'keys':
      shadow(c);c.fillStyle='#5a5140';c.fillRect(-41,-71,82,139);noShadow(c);c.fillStyle='#a58b60';c.fillRect(-38,-68,76,133);grain(c,r,-38,-68,76,133,700);
      c.strokeStyle='#524c3c';c.lineWidth=1.3;c.strokeRect(-32,-62,64,121);c.fillStyle='#464737';c.font='16px Georgia';c.textAlign='center';c.fillText('welcome',0,-17);c.fillText('home',0,4);
      c.strokeStyle='#bcac75';c.lineWidth=2;c.beginPath();c.arc(-7,38,7,0,6.28);c.stroke();c.beginPath();c.moveTo(-2,42);c.lineTo(10,57);c.lineTo(14,54);c.moveTo(6,51);c.lineTo(10,48);c.stroke();paintHouseKeyFob(c);break;
  }
  c.restore();
}
export function paintDistrictDetails(c,items,district,top,bottom,paving,sprites) {
  const kind=district.profile?.id;
  for(const item of items){
    if(item.y+item.height/2<bottom||item.y-item.height/2>top)continue;
    c.save();
    // Any shadow/leaf stays outside the walkable road. Props never pretend to be safe footholds.
    c.beginPath();c.rect(item.x<450?0:ROAD.right+4,0,item.x<450?ROAD.left-4:900-ROAD.right-4,top-bottom);c.clip();
    paintItem(c,item,top,paving,kind,district.offset||0,sprites,district.street?.seed??item.seed);c.restore();
  }
}
