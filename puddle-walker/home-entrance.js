import {randomSource} from './model.js?v=footprint-perf-131';
import {HOME} from './home-arrival.js?v=footprint-perf-131';
import {paintHomeKeepsakes} from './street-charm.js?v=footprint-perf-131';

// A permanent destination, baked into terrain tiles with the rest of the street.
// The mat ends the race; the open hall receives the automatic final steps.
export function* createHomeEntranceSteps(paving,shrub,asphalt,details){
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=540;
  const c=canvas.getContext('2d'),r=randomSource(2828),stone=c.createPattern(paving,'repeat');
  const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  // Broad, lightly worn front step. No fence or collision across the approach.
  box(212,172,476,330,'#18201b55');box(208,164,484,330,stone);
  box(208,164,484,330,'#c9c3a52b');
  box(208,490,484,4,'#3f493e88');box(208,494,484,2,'#c5c2ac66');
  // A glimpse of the hall through the open door, lit from inside.
  box(309,0,282,178,'#272a23');
  for(let x=318;x<586;x+=27){
    box(x,0,26,166,['#806647','#8e7350','#987b55','#756044'][Math.floor(r()*4)]);
    for(let n=0;n<16;n++){c.strokeStyle=n%2?'#302a1d20':'#e4bb7820';c.lineWidth=.5;c.beginPath();const xx=x+2+r()*23,yy=r()*160;c.moveTo(xx,yy);c.bezierCurveTo(xx+2,yy+18,xx-1,yy+28,xx+1,Math.min(166,yy+40));c.stroke();}
    box(x,45+r()*80,26,.6,'#403c2d55');
  }
  const hall=c.createLinearGradient(0,0,0,173);hall.addColorStop(0,'#17211cd9');hall.addColorStop(1,'#d8b87908');c.fillStyle=hall;c.fillRect(318,0,268,173);
  yield;
  // Exposed brick shoulders and pale stone caps give the entrance its scale.
  for(const [left,width] of [[0,307],[593,307]]){
    box(left,0,width,188,'#80786a');
    for(let row=0;row<7;row++)for(let col=-1;col<5;col++){
      const x=left+col*76+(row%2)*38,y=row*27;
      c.save();c.beginPath();c.rect(left,0,width,185);c.clip();
      box(x+1,y+1,73,24,['#827e6b','#797665','#908773','#6d7163','#8c806b'][Math.floor(r()*5)]);
      for(let n=0;n<45;n++)box(x+2+r()*71,y+2+r()*22,.5+r(),.5,n%2?'#c4b49944':'#283b3130');
      c.restore();
      yield;
    }
    box(left,183,width,19,'#5b6052');box(left,181,width,12,stone);box(left,181,width,12,'#d2c9ae44');box(left,202,width,7,'#17271f44');
  }
  // Door jamb, threshold, and a green door swung inward against the left wall.
  box(298,0,13,182,'#c6c1a9');box(589,0,13,182,'#c6c1a9');
  box(307,0,7,179,'#343e32');box(586,0,7,179,'#343e32');
  box(311,171,279,12,'#a29b82');box(311,171,279,2,'#e6d9b5');box(311,183,279,3,'#293c3155');
  c.save();c.transform(.31,-.94,.94,.31,313,162);
  box(0,0,153,15,'#182d25');box(0,0,153,10,'#355747');
  box(6,2,62,5,'#284637');box(78,2,67,5,'#284637');box(6,1,62,.7,'#a5b49855');box(78,1,67,.7,'#a5b49855');
  box(137,8,8,3,'#c8aa65');c.restore();
  // Soft interior light reaches just onto the rain-darkened stone threshold.
  const glow=c.createLinearGradient(0,178,0,283);glow.addColorStop(0,'#e8c58c24');glow.addColorStop(1,'#e8c58c00');
  c.fillStyle=glow;c.beginPath();c.moveTo(314,183);c.lineTo(590,183);c.lineTo(620,283);c.lineTo(283,283);c.closePath();c.fill();
  // Small enamel house number and a warm, shielded porch lamp.
  box(268,204,29,20,'#24372e');c.fillStyle='#e4dfc8';c.font='14px Georgia';c.textAlign='center';c.fillText('28',282.5,219);
  const light=c.createRadialGradient(614,212,2,614,212,70);light.addColorStop(0,'#ffe0a02c');light.addColorStop(1,'#ffe0a000');c.fillStyle=light;c.fillRect(544,142,140,140);
  box(604,200,20,13,'#243329');box(607,210,14,5,'#ecd29a');box(604,215,20,3,'#334035');
  paintHomeKeepsakes(c);
  yield;
  // The same rain gear seen along the street is waiting by the front door.
  // Reuse the photographic atlas, at sneaker scale, beyond the finish threshold.
  if(details){
    c.save();c.shadowColor='#17231d66';c.shadowBlur=3;c.shadowOffsetY=2;
    c.drawImage(details,details.width*.596,details.height*.065,details.width*.312,details.height*.375,520,104,58,70);
    c.drawImage(details,details.width*.173,details.height*.45,details.width*.165,details.height*.535,708,227,27,87);
    c.restore();
    // Damp droplets beneath the umbrella, clear of the playable approach.
    for(let i=0;i<11;i++){
      const x=714+r()*16,y=306+r()*12;
      c.fillStyle='#4b57472b';c.beginPath();c.ellipse(x,y,.8+r()*1.5,.5+r(),0,0,Math.PI*2);c.fill();
    }
  }
  // The familiar coir mat is the actual arrival point, without a racing stripe.
  c.shadowColor='#17231e66';c.shadowBlur=5;c.shadowOffsetY=3;
  const mat=HOME.mat;
  c.fillStyle='#413b2c';c.beginPath();c.roundRect(mat.x,mat.y,mat.width,mat.height,3);c.fill();c.shadowColor='transparent';
  box(340,364,220,103,'#a18a59');
  for(let n=0;n<4400;n++){
    box(341+r()*218,365+r()*101,.4+r(),1+r()*2,n%2?'#e0c78c66':'#463c2960');
    if(n%128===127)yield;
  }
  c.strokeStyle='#53462fcc';c.lineWidth=2;c.strokeRect(349,373,202,85);
  // The centre is brushed smooth by shoes; short loose fibres catch the edges.
  const matWear=c.createRadialGradient(450,416,8,450,416,89);matWear.addColorStop(0,'#e0c38720');matWear.addColorStop(1,'#e0c38700');c.fillStyle=matWear;c.fillRect(340,364,220,103);
  for(let n=0;n<90;n++){const x=342+r()*216,y=n%2?365:466;c.strokeStyle=n%3?'#c0a87470':'#66513860';c.lineWidth=.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+(r()-.5)*3,y+(n%2?-1:1)*(1+r()*3));c.stroke();}
  c.fillStyle='#413e2b';c.font='600 22px Georgia';c.textAlign='center';c.fillText('WELCOME',450,424);
  // Real foliage sits in weathered terracotta pots, outside the landing.
  for(const [x,y,size] of [[262,280,37],[638,295,32]]){
    c.save();c.translate(x,y);c.shadowColor='#18281c66';c.shadowBlur=9;c.shadowOffsetX=4;c.shadowOffsetY=6;
    const pot=c.createRadialGradient(-10,-12,2,0,0,size);pot.addColorStop(0,'#b18b65');pot.addColorStop(.75,'#805a3e');pot.addColorStop(1,'#574b36');
    c.fillStyle=pot;c.beginPath();c.arc(0,0,size,0,Math.PI*2);c.fill();c.shadowColor='transparent';
    c.fillStyle='#403c29';c.beginPath();c.arc(0,0,size-5,0,Math.PI*2);c.fill();
    if(shrub)c.drawImage(shrub,-size*1.28,-size*1.32,size*2.56,size*2.56);
    c.restore();
    yield;
  }
  // The roof is visible on tall phone viewports. Slate grain repeats, while
  // flashing, the window, chimney and gutter stay fixed to this one house.
  const roof=document.createElement('canvas');roof.width=900;roof.height=216;
  const rc=roof.getContext('2d');rc.fillStyle=rc.createPattern(asphalt||paving,'repeat');rc.fillRect(0,0,900,216);
  rc.fillStyle='#303a3cbe';rc.fillRect(0,0,900,216);
  for(let row=0;row<6;row++)for(let col=-1;col<14;col++){
    const x=col*72+(row%2)*36,y=row*36;
    rc.fillStyle=['#a8b0b209','#121f290c','#bbc0b706','#17252a06'][Math.floor(r()*4)];rc.fillRect(x+1,y+1,70,34);
    // Overlapping bottom edges are more visible than the tight vertical joins.
    rc.strokeStyle='#0e1b205f';rc.lineWidth=.8;rc.beginPath();rc.moveTo(x,y+35);rc.lineTo(x+17,y+35-r()*.8);rc.lineTo(x+41,y+35.4);rc.lineTo(x+72,y+35);rc.stroke();
    rc.fillStyle='#15232940';rc.fillRect(x,y, .6,35);
    rc.fillStyle='#c2c3b823';rc.fillRect(x+2,y+34,67,.5);
    for(let n=0;n<4;n++){
      const xx=x+5+r()*60,yy=y+3+r()*26;
      rc.strokeStyle='#c4c9bf12';rc.lineWidth=.4;rc.beginPath();rc.moveTo(xx,yy);rc.lineTo(xx+8+r()*15,yy+(r()-.5)*3);rc.stroke();
    }
    yield;
  }
  // Thin damp joints and lichen at the lower slate edges, baked once.
  for(let n=0;n<480;n++){
    const x=r()*900,y=Math.floor(r()*6)*36+31+r()*4;
    rc.fillStyle=n%3?'#9d9d6628':'#0c201c44';rc.fillRect(x,y,.5+r()*1.8,.5+r());
  }
  function paintRoof(c,eaveY){
    if(eaveY<=0)return;
    c.save();c.beginPath();c.rect(0,0,900,eaveY);c.clip();c.translate(0,eaveY);
    c.fillStyle=c.createPattern(roof,'repeat');c.fillRect(0,-eaveY,900,eaveY);
    // Water tracks collect below the window and chimney, not on every slate.
    for(const [x,y,w,length] of [[169,-472,135,460],[659,-785,100,770]]){
      const runoff=c.createLinearGradient(0,y,0,y+length);runoff.addColorStop(0,'#101c2412');runoff.addColorStop(1,'#17262c00');c.fillStyle=runoff;
      for(let band=0;band<4;band++){
        c.beginPath();c.moveTo(x+band*3,y);c.lineTo(x+w-band*3,y);c.bezierCurveTo(x+w+6,y+length*.3,x+w-15,y+length*.7,x+w-24,y+length);c.lineTo(x+19,y+length);c.bezierCurveTo(x+11,y+length*.7,x-9,y+length*.3,x+band*3,y);c.fill();
      }
    }
    // A recessed roof window with lead flashing, cool glass and soft sky light.
    c.save();c.translate(152,-660);c.shadowColor='#09171d66';c.shadowBlur=9;c.shadowOffsetX=5;c.shadowOffsetY=7;
    c.fillStyle='#505e60';c.fillRect(-10,-11,164,218);c.shadowColor='transparent';
    c.fillStyle='#9da29a66';c.fillRect(-10,-11,164,2);
    c.fillStyle='#233438';c.fillRect(-3,-3,150,202);
    const glass=c.createLinearGradient(0,0,144,196);glass.addColorStop(0,'#77928c');glass.addColorStop(.38,'#566f70');glass.addColorStop(1,'#1f343c');c.fillStyle=glass;c.fillRect(3,3,138,190);
    c.save();c.beginPath();c.rect(3,3,138,190);c.clip();
    for(const [x,y,rx,ry] of [[-2,45,112,38],[100,116,92,51]]){
      c.save();c.translate(x,y);c.scale(rx,ry);const cloud=c.createRadialGradient(0,0,.1,0,0,1);cloud.addColorStop(0,'#d0d1c53b');cloud.addColorStop(1,'#d0d1c500');c.fillStyle=cloud;c.fillRect(-1,-1,2,2);c.restore();
    }
    const wr=randomSource(2829);
    for(let n=0;n<75;n++){
      const x=wr()*144,y=wr()*196;c.strokeStyle=n%3?'#c0cebd21':'#152b3038';c.lineWidth=.4+wr()*.3;c.beginPath();c.moveTo(x,y);c.lineTo(x+.4,y+2+wr()*5);c.stroke();
    }
    c.restore();c.fillStyle='#16282d';c.fillRect(0,94,144,3);c.fillStyle='#adb5a866';c.fillRect(0,93,144,.7);
    c.strokeStyle='#bac0b470';c.lineWidth=1;c.strokeRect(.5,.5,143,195);
    c.fillStyle='#89918b';c.fillRect(-7,199,158,5);c.fillStyle='#182b3299';c.fillRect(-7,204,158,2);c.restore();
    // One modest brick chimney, with a soot-darkened terracotta flue.
    c.save();c.translate(646,-870);c.shadowColor='#09171c66';c.shadowBlur=12;c.shadowOffsetX=9;c.shadowOffsetY=12;
    c.fillStyle='#65706a';c.fillRect(-10,-10,117,111);c.shadowColor='transparent';
    c.fillStyle='#63564b';c.fillRect(-3,-3,103,97);
    for(let row=0;row<4;row++)for(let col=0;col<3;col++){
      c.fillStyle=['#8b7761','#786757','#99826b'][(row+col)%3];c.fillRect(col*33+1,row*23+1,31,21);
    }
    c.fillStyle='#b1ac96';c.fillRect(-5,-5,107,9);c.fillRect(-5,85,107,9);c.fillRect(-5,0,9,90);c.fillRect(93,0,9,90);
    c.fillStyle='#524b3e';c.fillRect(4,4,89,81);
    const flue=c.createRadialGradient(39,35,6,48,44,31);flue.addColorStop(0,'#b59a75');flue.addColorStop(.8,'#806448');flue.addColorStop(1,'#5a5141');
    c.fillStyle=flue;c.beginPath();c.arc(48,44,30,0,Math.PI*2);c.fill();c.fillStyle='#17201d';c.beginPath();c.arc(48,44,21,0,Math.PI*2);c.fill();
    c.strokeStyle='#c0ad8b88';c.lineWidth=1;c.beginPath();c.arc(48,44,28,3.5,5.5);c.stroke();c.restore();
    // A shallow zinc gutter catches rain and a few windblown leaves at the eave.
    c.fillStyle='#142128';c.fillRect(0,-17,900,17);
    const zinc=c.createLinearGradient(0,-17,0,0);zinc.addColorStop(0,'#84908a');zinc.addColorStop(.18,'#485855');zinc.addColorStop(.55,'#233533');zinc.addColorStop(1,'#697c72');c.fillStyle=zinc;c.fillRect(0,-16,900,14);
    c.fillStyle='#b2b9a65c';c.fillRect(0,-2,900,.8);
    for(let x=58;x<900;x+=151){c.fillStyle='#1d302c88';c.fillRect(x,-16,3,15);c.fillStyle='#a2ac9955';c.fillRect(x+1,-15,.7,13);}
    const gr=randomSource(2841);
    for(let n=0;n<23;n++){
      const x=gr()<.65?710+gr()*100:gr()*900,y=-12+gr()*7;
      c.fillStyle=['#7d734a','#969064','#50583c'][n%3];c.beginPath();c.ellipse(x,y,1+gr()*3,.6+gr(),gr()*3,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
  return {porch:canvas,paintRoof};
}

// Synchronous callers use the identical drawing sequence.
export function createHomeEntrance(...args){
  const steps=createHomeEntranceSteps(...args);let result;
  do{result=steps.next();}while(!result.done);
  return result.value;
}
