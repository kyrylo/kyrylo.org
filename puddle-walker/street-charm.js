import {randomSource} from './model.js?v=footprint-perf-131';
import {DANDELION_SEEDS,dandelionSeedOrigin} from './street-motion.js?v=footprint-perf-131';
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};

export const PINWHEEL={x:18,y:-62,size:37};
export function pinwheelPose(time,seed,reduced=false){
  const phase=(seed%997)/997*Math.PI*2;
  // Integrate a gentle gust, rather than adding an angle on every paint. The
  // wheel slows almost to rest, catches the breeze, and always turns forward.
  const angle=reduced?phase:phase+time*1.25-.96/.7*(Math.sin(time*.7+phase)-Math.sin(phase));
  return {angle,tilt:reduced?0:Math.sin(time*.7+phase)*.018};
}

export function createPinwheelSprite(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const c=canvas.getContext('2d');c.translate(48,48);
  const colors=[['#c98673','#e4b69c','#975949'],['#b4bda4','#d5d9ba','#7e9275'],['#c6ae65','#e5d393','#a18b4e'],['#7d9a9c','#b6c6bd','#587b7b']];
  // Folded, slightly rain-softened paper. Light and dark triangles reveal the
  // folds; a plain four-point star would read as a game pickup.
  for(let i=0;i<4;i++){
    c.save();c.rotate(i*Math.PI/2);const [base,light,dark]=colors[i];
    const paper=c.createLinearGradient(-34,-34,2,3);paper.addColorStop(0,light);paper.addColorStop(.6,base);paper.addColorStop(1,dark);
    c.fillStyle=paper;c.beginPath();c.moveTo(-2,1);c.lineTo(-36,-34);c.lineTo(1,-35);c.quadraticCurveTo(15,-20,2,3);c.closePath();c.fill();
    c.fillStyle=dark;c.beginPath();c.moveTo(-2,1);c.lineTo(-36,-34);c.quadraticCurveTo(-20,-22,-18,-6);c.quadraticCurveTo(-13,5,-2,1);c.fill();
    c.strokeStyle=light+'a0';c.lineWidth=.8;c.beginPath();c.moveTo(-34,-33);c.lineTo(0,-34);c.quadraticCurveTo(10,-23,2,-3);c.stroke();
    c.strokeStyle='#ebe1c340';c.lineWidth=.6;c.beginPath();c.moveTo(-29,-29);c.lineTo(-4,-3);c.stroke();
    c.fillStyle='#534d3430';c.fillRect(-3,-34,2,3);c.restore();
  }
  oval(c,1,1,4.2,4.2,'#4f5948');oval(c,0,0,3.3,3.3,'#b6ae86');oval(c,-.8,-1,1.1,1.1,'#e8dec0');
  const shadow=document.createElement('canvas');shadow.width=shadow.height=96;
  const shade=shadow.getContext('2d');shade.drawImage(canvas,0,0);shade.globalCompositeOperation='source-in';shade.fillStyle='#26382338';shade.fillRect(0,0,96,96);
  return {paper:canvas,shadow};
}

export function paintPinwheelStake(c){
  const {x,y}=PINWHEEL;c.save();c.lineCap='round';
  c.strokeStyle='#273b303c';c.lineWidth=2.5;c.beginPath();c.moveTo(27,-13);c.lineTo(x+5,y+18);c.stroke();
  c.strokeStyle='#8f7c52';c.lineWidth=2;c.beginPath();c.moveTo(25,-16);c.lineTo(x,y);c.stroke();
  c.strokeStyle='#d1be8b';c.lineWidth=.6;c.beginPath();c.moveTo(24.6,-18);c.lineTo(x-.5,y+1);c.stroke();
  for(const yy of [-28,-46]){c.strokeStyle='#736b48';c.lineWidth=.7;c.beginPath();c.moveTo(23+(yy+28)*.15,yy);c.lineTo(25+(yy+28)*.15,yy);c.stroke();}c.restore();
}

export function paintRainyChalk(c,seed){
  const r=randomSource(seed^0x6368616c);c.save();c.translate(0,-16);
  // A child's earnest solution to bad weather: even the cloud wears wellies.
  const stroke=(color,draw,width=1.6)=>{
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.setLineDash([3,.8,5,.45]);
    for(let i=0;i<3;i++){c.save();c.translate(i*.28,-i*.23);c.globalAlpha=.28;c.lineDashOffset=i*3;c.beginPath();draw(c);c.stroke();c.restore();}
  };
  stroke('#ede7cf',p=>{p.moveTo(-22,5);p.bezierCurveTo(-41,8,-43,-12,-27,-15);p.bezierCurveTo(-32,-35,-5,-39,2,-24);p.bezierCurveTo(15,-36,34,-26,31,-13);p.bezierCurveTo(46,-9,42,9,27,7);p.quadraticCurveTo(5,13,-22,5);p.closePath();},2);
  stroke('#e1dcc1',p=>{p.moveTo(-9,-10);p.lineTo(-8,-7);p.moveTo(11,-10);p.lineTo(12,-7);p.moveTo(-7,-1);p.quadraticCurveTo(2,7,11,-2);});
  for(const x of [-16,16]){
    stroke('#e3d9bb',p=>{p.moveTo(x,11);p.lineTo(x-1,23);});
    const sign=x<0?-1:1;
    stroke('#dbc16e',p=>{p.moveTo(x-sign*6,23);p.lineTo(x+sign*6,23);p.lineTo(x+sign*6,36);p.quadraticCurveTo(x+sign*17,36,x+sign*17,44);p.lineTo(x-sign*6,44);p.closePath();},2.3);
    stroke('#d8bd72',p=>{p.moveTo(x-5,27);p.lineTo(x+4,27);},1);
  }
  for(const [x,y] of [[-34,20],[34,23],[-35,38],[35,43]])stroke('#a9c1bc',p=>{p.moveTo(x,y);p.lineTo(x-2,y+6);},1.4);
  stroke('#9ab4b1',p=>{p.moveTo(-37,55);p.bezierCurveTo(-25,48,-11,61,0,54);p.bezierCurveTo(11,48,24,59,38,53);},1.7);
  // Broken pigment settles in the paving pores, as on the other chalk marks.
  c.setLineDash([]);c.globalAlpha=.15;for(let i=0;i<50;i++)oval(c,(r()-.5)*75,-34+r()*94,.3+r()*.4,.4,i%2?'#ded4ac':'#b1c5b6');
  c.restore();
}

export function paintHouseKeyFob(c){
  c.save();c.strokeStyle='#a7ad94';c.lineWidth=.8;
  c.beginPath();c.ellipse(2,30,9,2.8,-.5,0,Math.PI*2);c.stroke();
  c.translate(13,31);c.rotate(.2);c.shadowColor='#2631245e';c.shadowBlur=1.4;c.shadowOffsetY=1.3;
  c.fillStyle='#856247';c.beginPath();c.moveTo(-9,-5);c.lineTo(0,-14);c.lineTo(10,-5);c.lineTo(9,10);c.lineTo(-8,10);c.closePath();c.fill();c.shadowColor='transparent';
  const wood=c.createLinearGradient(-8,-4,9,7);wood.addColorStop(0,'#d2af79');wood.addColorStop(.55,'#b28b59');wood.addColorStop(1,'#9d744c');
  c.fillStyle=wood;c.beginPath();c.moveTo(-8,-5);c.lineTo(0,-12);c.lineTo(9,-5);c.lineTo(8,9);c.lineTo(-7,9);c.closePath();c.fill();
  c.strokeStyle='#78604055';c.lineWidth=.45;for(const x of [-5,-1,4]){c.beginPath();c.moveTo(x,-4);c.bezierCurveTo(x-1,0,x+1,4,x,8);c.stroke();}
  c.fillStyle='#9c5545';c.beginPath();c.moveTo(0,5);c.bezierCurveTo(-10,-1,-2,-6,0,-2);c.bezierCurveTo(3,-6,10,-1,0,5);c.fill();
  oval(c,0,-8,1.7,1.7,'#67553c');c.strokeStyle='#b8b9a1';c.lineWidth=.9;c.beginPath();c.ellipse(-4,-10,6,2.7,.4,0,Math.PI*2);c.stroke();
  c.restore();
}

export function createDoorstepBalloonSprite(){
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=128;
  const c=canvas.getContext('2d');c.scale(2,2);c.translate(24,29);
  // A slightly tired latex balloon, not a perfect circle. Its broad soft
  // highlight follows the skin; the little face was drawn with a felt pen.
  const skin=c.createRadialGradient(-7,-10,1,1,0,28);
  skin.addColorStop(0,'#db9b85');skin.addColorStop(.35,'#c87865');skin.addColorStop(.75,'#a65349');skin.addColorStop(1,'#793d3b');
  c.fillStyle=skin;c.beginPath();c.moveTo(1,25);c.bezierCurveTo(-4,18,-18,13,-18,-5);c.bezierCurveTo(-20,-30,13,-33,18,-11);c.bezierCurveTo(24,9,7,17,1,25);c.fill();
  c.strokeStyle='#efd1b65c';c.lineWidth=.65;c.beginPath();c.moveTo(-16,-4);c.bezierCurveTo(-18,-18,-9,-23,-3,-23);c.stroke();
  const shine=c.createRadialGradient(-7,-13,0,-7,-13,9);shine.addColorStop(0,'#fff0d55c');shine.addColorStop(1,'#fff0d500');oval(c,-7,-13,9,12,shine);
  c.strokeStyle='#e3ae9066';c.lineWidth=.45;
  for(const x of [-3,0,3]){c.beginPath();c.moveTo(1,23);c.quadraticCurveTo(x,18,x*1.8,15);c.stroke();}
  c.fillStyle='#985044';c.beginPath();c.moveTo(0,24);c.lineTo(-2,30);c.quadraticCurveTo(2,28,4,30);c.lineTo(2,24);c.fill();
  oval(c,1,24,2.2,1.3,'#793f35');
  // Unequal eyes and a crooked grin keep the joke small and handmade.
  c.strokeStyle='#523e367d';c.lineWidth=1.2;c.lineCap='round';
  c.beginPath();c.moveTo(-7,-5);c.lineTo(-6.5,-2);c.moveTo(6,-7);c.lineTo(7,-3);c.stroke();
  c.beginPath();c.moveTo(-7,4);c.bezierCurveTo(-1,12,6,10,10,1);c.stroke();
  oval(c,12,7,1.2,2.6,'#e0a18a36');return canvas;
}

export function paintDoorstepBalloon(c,sprite,pose,screenY){
  const x=pose.x,y=screenY(pose.y)-pose.lift,ax=pose.anchorX,ay=screenY(pose.anchorY);
  c.save();c.lineCap='round';
  // Rotate the knot with the balloon, so the string always meets it.
  const knotX=x-Math.sin(pose.angle)*24,knotY=y+Math.cos(pose.angle)*24;
  c.strokeStyle='#e3d2afc4';c.lineWidth=.7;c.beginPath();c.moveTo(ax,ay);
  c.bezierCurveTo(ax+pose.sway*.4,ay-21,knotX-5,knotY+19,knotX,knotY);c.stroke();
  c.strokeStyle='#bba989';c.lineWidth=.65;c.beginPath();c.ellipse(ax,ay,3,1.3,-.2,0,Math.PI*2);c.stroke();
  c.translate(x,y);c.rotate(pose.angle);c.drawImage(sprite,-24,-29,48,64);c.restore();
}

export function paintRainyPartyCrown(c,seed){
  const r=randomSource(seed^0x70617274);c.save();c.translate(-2,28);c.rotate(.16);
  c.shadowColor='#24362952';c.shadowBlur=1.5;c.shadowOffsetY=1.5;
  const paper=c.createLinearGradient(-20,-8,20,10);paper.addColorStop(0,'#b7a475');paper.addColorStop(.4,'#d3bc82');paper.addColorStop(1,'#a18d60');
  c.fillStyle=paper;c.beginPath();c.moveTo(-23,7);c.lineTo(-24,-6);c.lineTo(-14,0);c.lineTo(-9,-13);c.lineTo(-1,-2);c.lineTo(7,-12);c.lineTo(15,-2);c.lineTo(23,-7);c.lineTo(22,9);c.quadraticCurveTo(0,14,-23,7);c.fill();c.shadowColor='transparent';
  c.strokeStyle='#eadbb36b';c.lineWidth=.65;c.beginPath();c.moveTo(-21,5);c.quadraticCurveTo(0,11,20,7);c.stroke();
  c.fillStyle='#e0cfa5';c.beginPath();c.moveTo(4,-7);c.lineTo(7,-12);c.lineTo(10,-8);c.lineTo(7,-4);c.closePath();c.fill();
  c.strokeStyle='#897b575e';c.beginPath();c.moveTo(4,-7);c.lineTo(10,-8);c.moveTo(-10,-10);c.lineTo(-5,8);c.stroke();
  for(const [x,y,color] of [[-16,2,'#a6705f'],[-3,3,'#6d8d85'],[13,2,'#a6705f']])oval(c,x,y,1.4,1.7,color);
  // A rain-softened edge, paper fibres, and a little stain on the paving.
  c.strokeStyle='#7c75584d';c.lineWidth=1.4;c.beginPath();c.moveTo(-22,7);c.quadraticCurveTo(-8,12,2,11);c.stroke();
  for(let i=0;i<28;i++)oval(c,-21+r()*42,3+r()*5,.25,.35,i%2?'#f0dfb24d':'#6a64462f');c.restore();
}

export function paintWorkshopHelperBody(c,seed){
  const r=randomSource(seed^0x68656c70);c.save();c.translate(14,74);c.lineCap='round';
  // Old bolts for feet, copper wire arms, and a spanner far too big for him.
  c.shadowColor='#192c2366';c.shadowBlur=1.5;c.shadowOffsetY=1.5;
  for(const x of [-7,7]){
    c.strokeStyle='#687c75';c.lineWidth=4;c.beginPath();c.moveTo(x,10);c.lineTo(x,22);c.stroke();
    c.strokeStyle='#b5b8a3';c.lineWidth=.6;
    for(let y=13;y<22;y+=2){c.beginPath();c.moveTo(x-2,y);c.lineTo(x+2,y-1);c.stroke();}
    c.fillStyle=x<0?'#75877c':'#8b8165';c.beginPath();c.roundRect(x-5,21,10,6,1);c.fill();
  }
  c.shadowColor='transparent';c.strokeStyle='#796044';c.lineWidth=2.3;
  c.beginPath();c.moveTo(-11,-5);c.quadraticCurveTo(-24,1,-21,10);c.moveTo(11,-6);c.quadraticCurveTo(19,-5,22,-16);c.stroke();
  c.strokeStyle='#d3b08a';c.lineWidth=.7;c.beginPath();c.moveTo(-12,-6);c.quadraticCurveTo(-25,0,-22,8);c.moveTo(12,-7);c.quadraticCurveTo(18,-7,21,-16);c.stroke();
  for(const x of [-11,11])oval(c,x,-5,2.4,2.2,'#a9ae98');
  c.strokeStyle='#a78b64';c.lineWidth=1.4;c.beginPath();c.ellipse(-21,11,3,4,-.3,.2,5.8);c.stroke();
  c.save();c.translate(24,-12);c.rotate(.28);
  c.strokeStyle='#61766e';c.lineWidth=4;c.beginPath();c.moveTo(0,-15);c.lineTo(0,17);c.stroke();
  c.strokeStyle='#b1beb0';c.lineWidth=1;c.beginPath();c.moveTo(-1,-14);c.lineTo(-1,16);c.stroke();
  c.strokeStyle='#8d9f93';c.lineWidth=2.9;c.beginPath();c.arc(0,-18,5.5,-.45,Math.PI+.45);c.stroke();
  oval(c,0,19,4.2,5.1,'#8a9d8e');oval(c,0,19,2,2.7,'#3b5145');
  c.strokeStyle='#d6d5ba80';c.lineWidth=.6;c.beginPath();c.arc(-.5,18.5,3.1,2.8,4.8);c.stroke();c.restore();
  c.strokeStyle='#ab8b61';c.lineWidth=1.4;c.beginPath();c.ellipse(22,-14,3.1,3.6,.1,0,Math.PI*2);c.stroke();
  c.shadowColor='#1e30285e';c.shadowBlur=1.5;c.shadowOffsetY=1.6;
  const tin=c.createLinearGradient(-13,0,13,0);tin.addColorStop(0,'#67786b');tin.addColorStop(.2,'#c2c4ad');tin.addColorStop(.55,'#9eac98');tin.addColorStop(1,'#526b60');
  c.fillStyle=tin;c.beginPath();c.roundRect(-13,-13,26,29,4);c.fill();c.shadowColor='transparent';
  c.strokeStyle='#e0ddc18c';c.lineWidth=.75;c.beginPath();c.roundRect(-11.5,-11.5,23,25,3);c.stroke();
  // A faded sardine label: curled paper edge, a little fish and exposed tin.
  c.fillStyle='#b18c58';c.fillRect(-10,-7,20,16);c.fillStyle='#d7c39a';c.fillRect(-10,-5,20,9);
  c.save();c.translate(-1,0);c.rotate(-.15);oval(c,0,0,5,2.3,'#607e7c');
  c.fillStyle='#607e7c';c.beginPath();c.moveTo(3,0);c.lineTo(7,-3);c.lineTo(7,3);c.closePath();c.fill();oval(c,-3.1,-.3,.4,.4,'#e7d6b2');c.restore();
  c.fillStyle='#d3c6a1';c.beginPath();c.moveTo(6,5);c.lineTo(10,4);c.lineTo(10,9);c.closePath();c.fill();
  for(let i=0;i<18;i++)oval(c,-11+r()*22,-11+r()*24,.3+r()*.4,.35,i%2?'#ebe3ba3d':'#415a4c32');
  c.strokeStyle='#4b675979';c.lineWidth=.55;c.beginPath();c.moveTo(-8,10);c.lineTo(-2,11);c.moveTo(10,-9);c.lineTo(9,-4);c.stroke();c.restore();
}

export function createWorkshopHelperHead(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const c=canvas.getContext('2d');c.scale(2,2);c.translate(24,24);c.lineCap='round';
  c.strokeStyle='#8f9277';c.lineWidth=1.1;c.beginPath();c.moveTo(-9,-8);c.quadraticCurveTo(-15,-18,-8,-20);c.stroke();
  oval(c,-8,-20,2.5,2.2,'#a86c54');oval(c,-8.6,-20.7,.7,.6,'#dfbb8b');
  c.shadowColor='#172d235b';c.shadowBlur=1;c.shadowOffsetY=1.4;
  const metal=c.createLinearGradient(-14,-9,14,10);metal.addColorStop(0,'#c1c5af');metal.addColorStop(.38,'#9cae9a');metal.addColorStop(1,'#637d70');
  c.fillStyle=metal;c.beginPath();c.roundRect(-15,-11,30,23,3);c.fill();c.shadowColor='transparent';
  c.strokeStyle='#dddcc080';c.lineWidth=.65;c.strokeRect(-13,-9,26,18);
  for(const [x,y,size,color] of [[-6,-2,5.8,'#788f84'],[7,-3,4.5,'#ae9565']]){
    oval(c,x+.5,y+1,size,size,'#334f4075');oval(c,x,y,size,size,color);oval(c,x,y,size*.5,size*.5,'#293e34');
    c.strokeStyle='#e0d9b188';c.lineWidth=.6;c.beginPath();c.arc(x,y,size-.8,3.4,5.2);c.stroke();
  }
  // A crooked smile and mismatched fasteners, rather than a pristine face.
  c.strokeStyle='#385345';c.lineWidth=.8;c.beginPath();c.moveTo(-6,7);c.quadraticCurveTo(0,10,7,6);c.stroke();
  for(const [x,y] of [[-12,-7],[12,8]]){oval(c,x,y,1,1,'#4a6555');c.strokeStyle='#c8ceb1';c.lineWidth=.4;c.beginPath();c.moveTo(x-.7,y+.2);c.lineTo(x+.7,y-.2);c.stroke();}
  c.strokeStyle='#59725b6b';c.lineWidth=.5;c.beginPath();c.moveTo(-2,-8);c.lineTo(4,-7);c.moveTo(-12,4);c.lineTo(-10,5);c.stroke();return canvas;
}

export function paintWorkshopHelperHead(c,sprite,pose,screenY){
  const x=pose.x,y=screenY(pose.y),ax=pose.anchorX,ay=screenY(pose.anchorY);
  const neckX=x-Math.sin(pose.angle)*11,neckY=y+Math.cos(pose.angle)*11;
  c.save();c.lineCap='round';c.strokeStyle='#a5b39b';c.lineWidth=.85;c.beginPath();c.moveTo(ax,ay);
  for(let i=1;i<=6;i++){const t=i/7;c.lineTo(ax+(neckX-ax)*t+(i%2?2:-2),ay+(neckY-ay)*t);}c.lineTo(neckX,neckY);c.stroke();
  c.translate(x,y);c.rotate(pose.angle);c.drawImage(sprite,-24,-24,48,48);c.restore();
}

export function createSnailSprite(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const c=canvas.getContext('2d');c.scale(2,2);c.translate(16,16);
  oval(c,1,4,5.4,10.5,'#22332938');
  const foot=c.createLinearGradient(-4,0,4,0);foot.addColorStop(0,'#535d4a');foot.addColorStop(.35,'#8b9279');foot.addColorStop(1,'#56664e');
  c.fillStyle=foot;c.beginPath();c.moveTo(-3,-6);c.quadraticCurveTo(-6,3,-2,10);c.lineTo(0,14);c.quadraticCurveTo(5,4,3,-6);c.closePath();c.fill();
  oval(c,.5,1,7,7.5,'#273d2b66');
  const shell=c.createRadialGradient(-2.5,-3,1,0,0,8);shell.addColorStop(0,'#c1a572');shell.addColorStop(.45,'#a08151');shell.addColorStop(.8,'#796540');shell.addColorStop(1,'#4c4b30');
  oval(c,0,0,6.6,7.2,shell);
  c.strokeStyle='#594d3099';c.lineWidth=.65;c.beginPath();
  for(let i=0;i<=72;i++){const a=i/72*Math.PI*4.5,r=.35+i/72*5.8,x=Math.cos(a)*r,y=Math.sin(a)*r*1.07;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
  c.strokeStyle='#e2c89b66';c.lineWidth=.35;c.beginPath();c.ellipse(-.4,-.5,5.8,6.1,0,3.4,5.3);c.stroke();
  for(let i=0;i<17;i++){const a=i*2.4;oval(c,Math.cos(a)*5.8,Math.sin(a)*6.2,.35,.5,i%2?'#5d503b7a':'#e1c19166');}
  oval(c,-2,-3.4,.65,1.1,'#f0e1b780');return canvas;
}

export function paintSnail(c,sprite,x,y,angle,shy){
  const out=1-shy;c.save();c.translate(x,y);c.rotate(angle);
  const neck=-5-out*5;c.fillStyle='#798773';
  c.beginPath();c.ellipse(0,neck,2+out,2.7+out,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#758570';c.lineWidth=.8;c.lineCap='round';
  for(const sign of [-1,1]){
    c.beginPath();c.moveTo(sign*1.5,neck-1);c.quadraticCurveTo(sign*(1.8+out),neck-1-out*2,sign*(1.5+out*2),neck-1-out*5);c.stroke();
    oval(c,sign*(1.5+out*2),neck-1-out*5,.5,.6,'#354d38');
  }
  // The shell occludes the retracted head, rather than shrinking with it.
  c.drawImage(sprite,-16,-16,32,32);c.restore();
}

export function paintSnailLeaf(c,x,y){
  c.save();c.translate(x,y);c.rotate(-.25);
  c.fillStyle='#667944';c.beginPath();c.moveTo(-9,0);c.bezierCurveTo(-5,-5,4,-5,9,0);c.lineTo(6,2);c.quadraticCurveTo(3,-.8,2,3);c.quadraticCurveTo(-4,5,-9,0);c.fill();
  c.strokeStyle='#b3b47a80';c.lineWidth=.5;c.beginPath();c.moveTo(-8,0);c.quadraticCurveTo(0,-.7,8,0);c.moveTo(-1,0);c.lineTo(2,-3);c.moveTo(-4,0);c.lineTo(-1,2);c.stroke();c.restore();
}

export function paintCrossword(c,seed){
  const r=randomSource(seed^0x70617072);c.save();c.translate(-8,69);c.rotate(.07);
  c.shadowColor='#21312650';c.shadowBlur=1.5;c.shadowOffsetY=1.5;
  c.fillStyle='#c8bea0';c.beginPath();c.moveTo(-28,-29);c.lineTo(25,-29);c.lineTo(28,23);c.lineTo(20,29);c.lineTo(-27,28);c.closePath();c.fill();c.shadowColor='transparent';
  const paper=c.createLinearGradient(-25,-25,27,28);paper.addColorStop(0,'#e7dfc4');paper.addColorStop(.8,'#d9ceb0');paper.addColorStop(1,'#b8ac8d');c.fillStyle=paper;c.fillRect(-26,-27,51,51);
  c.fillStyle='#687263';c.font='5px Georgia';c.textAlign='left';c.fillText('THE DAILY PUZZLE',-22,-19);
  // The optimistic answer is SUN; the rest can wait until after the rain.
  const blocked=new Set([0,4,8,12,16,20,24]),cell=7,left=-21,top=-15;
  c.strokeStyle='#72776588';c.lineWidth=.45;
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const n=row*5+col,x=left+col*cell,y=top+row*cell;
    if(blocked.has(n)){c.fillStyle='#626957';c.fillRect(x,y,cell,cell);}else c.strokeRect(x,y,cell,cell);
  }
  c.fillStyle='#68736b';c.font='6px monospace';c.textAlign='center';
  for(const [i,letter] of [...'SUN'].entries())c.fillText(letter,left+(i+1)*cell+3.4,top+5.7);
  c.font='3px sans-serif';c.fillText('1',left+8.2,top+2.5);c.fillText('2',left+1.2,top+9.5);
  c.strokeStyle='#8c6d4433';c.lineWidth=1;c.beginPath();c.arc(19,-16,11,.45,4.8);c.stroke();
  c.fillStyle='#efe4c9';c.beginPath();c.moveTo(19,23);c.lineTo(28,23);c.lineTo(20,29);c.closePath();c.fill();
  c.strokeStyle='#958c7266';c.lineWidth=.5;c.beginPath();c.moveTo(19,23);c.lineTo(20,29);c.stroke();
  for(let i=0;i<40;i++){c.fillStyle=i%2?'#615e4820':'#fcf2d620';c.fillRect(-25+r()*49,-26+r()*48,.5,.5);}
  c.restore();
  // A short, sharpened pencil: exposed wood, graphite tip, chipped paint and
  // a dented ferrule. It is left alongside the page, rather than over the grid.
  c.save();c.translate(30,69);c.rotate(-.17);c.shadowColor='#25332460';c.shadowBlur=1;c.shadowOffsetX=1;c.shadowOffsetY=1;
  c.fillStyle='#a17b3e';c.fillRect(-1.8,-20,3.6,33);c.shadowColor='transparent';c.fillStyle='#d1b66a';c.fillRect(-1,-20,1.2,33);
  c.fillStyle='#c7ae7c';c.beginPath();c.moveTo(-1.8,13);c.lineTo(1.8,13);c.lineTo(0,20);c.closePath();c.fill();c.fillStyle='#494d41';c.beginPath();c.moveTo(-.6,18);c.lineTo(.6,18);c.lineTo(0,20);c.closePath();c.fill();
  c.fillStyle='#9da792';c.fillRect(-1.9,-23,3.8,5);c.fillStyle='#ae8177';c.fillRect(-1.7,-26,3.4,3.5);c.strokeStyle='#51675988';c.lineWidth=.4;for(const yy of [-22,-20]){c.beginPath();c.moveTo(-1.7,yy);c.lineTo(1.7,yy);c.stroke();}c.restore();
}

export function paintTeaSteam(c,x,y,time,reduced=false){
  if(reduced)return;
  c.save();c.translate(x,y);c.lineCap='round';c.strokeStyle='#edf0d6';
  for(const [mx,my,phase] of [[-16,-7,0],[15,20,1.8]])for(let i=0;i<2;i++){
    const t=((time*.27+phase+i*.5)%1+1)%1,drift=Math.sin(time*.7+phase+i)*2;
    c.globalAlpha=Math.sin(t*Math.PI)*.17;c.lineWidth=.7+(1-t)*.5;
    c.beginPath();c.moveTo(mx+drift*.3,my-3-t*12);c.bezierCurveTo(mx-3+drift,my-7-t*13,mx+4+drift,my-11-t*14,mx+drift,my-16-t*15);c.stroke();
  }
  c.restore();
}

export function paintDandelionRoot(c,x,y,direction,seed){
  const r=randomSource(seed^0x77697368);c.save();c.translate(x-direction*4,y+17);
  // The rosette really grows out of a joint, not out of immaculate asphalt.
  c.strokeStyle='#293c3299';c.lineWidth=1;c.beginPath();c.moveTo(-16,9);c.lineTo(-4,4);c.lineTo(1,-3);c.lineTo(9,-8);c.lineTo(13,-17);c.stroke();
  for(let i=0;i<7;i++){
    c.save();c.rotate(i*2.4);const length=10+r()*5;
    const green=c.createLinearGradient(0,0,0,-length);green.addColorStop(0,'#344c2e');green.addColorStop(.55,'#697e45');green.addColorStop(1,'#8f9d60');
    c.fillStyle=green;c.beginPath();c.moveTo(0,1);c.lineTo(-2,-3);c.lineTo(-4,-5);c.lineTo(-1.8,-6);c.lineTo(-3,-9);c.lineTo(-.8,-10);c.lineTo(0,-length);c.lineTo(2,-10);c.lineTo(1,-8);c.lineTo(3.5,-6);c.lineTo(1.5,-5);c.lineTo(2.5,-2);c.closePath();c.fill();
    c.strokeStyle='#b1bc7b66';c.lineWidth=.4;c.beginPath();c.moveTo(0,0);c.lineTo(0,-length+1);c.stroke();c.restore();
  }
  // An unopened bud gives the puffball a living plant to belong to.
  c.strokeStyle='#728755';c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-11,-6,-10,-13);c.stroke();
  oval(c,-10,-13,2.3,3.1,'#4e693c');oval(c,-10.5,-14,1,1.9,'#9da769');c.restore();
}

export function createDandelionSprites(){
  return [false,true].map(spent=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const c=canvas.getContext('2d');c.scale(2,2);c.translate(16,16);
    const halo=c.createRadialGradient(0,0,1,0,0,11);halo.addColorStop(0,'#d4d4af24');halo.addColorStop(.65,'#ecebd32b');halo.addColorStop(1,'#ecebd300');oval(c,0,0,11,11,halo);
    oval(c,0,0,2,2,'#8c9366');
    for(let i=0;i<40;i++){
      if(spent&&DANDELION_SEEDS.includes(i))continue;
      const p=dandelionSeedOrigin(i);
      c.strokeStyle=i%3?'#e9e8cc8c':'#fffae2bb';c.lineWidth=.35;c.beginPath();c.moveTo(0,0);c.lineTo(p.x,p.y);c.stroke();
      c.save();c.translate(p.x,p.y);c.rotate(i*2.4);c.strokeStyle='#f3efdaae';c.lineWidth=.4;c.beginPath();
      for(let n=-2;n<=2;n++){c.moveTo(0,0);c.lineTo(n*.7,-1.5+Math.abs(n)*.3);}c.stroke();c.restore();
    }
    return canvas;
  });
}

export function paintDandelion(c,sprites,x,y,lean,direction,spent){
  c.save();c.lineCap='round';c.strokeStyle='#72804e';c.lineWidth=1.15;
  c.beginPath();c.moveTo(x-direction*4,y+17);c.quadraticCurveTo(x+lean*.3-direction*3,y+3,x+lean,y);c.stroke();
  c.strokeStyle='#b4be7e88';c.lineWidth=.4;c.beginPath();c.moveTo(x-direction*4-.5,y+16);c.quadraticCurveTo(x+lean*.3-direction*3-.5,y+3,x+lean-.5,y);c.stroke();
  c.fillStyle='#23362819';c.beginPath();c.ellipse(x+5+lean,y+12,9,5,0,0,Math.PI*2);c.fill();
  c.drawImage(sprites[spent?1:0],x+lean-16,y-16,32,32);c.restore();
}

export function paintFloatingSeed(c,x,y,angle,alpha){
  c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=alpha;
  c.strokeStyle='#e6e0c6';c.lineWidth=.45;c.beginPath();c.moveTo(0,2);c.lineTo(0,-3);
  for(let i=-2;i<=2;i++){c.moveTo(0,-3);c.lineTo(i*1.4,-6+Math.abs(i)*.65);}c.stroke();
  oval(c,0,2.5,.5,1.4,'#998767');c.restore();
}

export function paintLadybirdPebble(c){
  c.save();c.translate(26,94);c.rotate(.3);c.shadowColor='#28352966';c.shadowBlur=1.5;c.shadowOffsetY=1.5;
  oval(c,0,0,9.5,7.5,'#8c8e78');c.shadowColor='transparent';
  const red=c.createRadialGradient(-3,-3,1,0,0,10);red.addColorStop(0,'#b47659');red.addColorStop(.65,'#98513f');red.addColorStop(1,'#704334');
  oval(c,-.5,-.6,8.4,6.5,red);oval(c,6,-1,3.3,4.6,'#354039');
  c.strokeStyle='#343a30';c.lineWidth=.8;c.beginPath();c.moveTo(-8.4,-.2);c.quadraticCurveTo(-1,-1,5,-1);c.stroke();
  for(const [x,y] of [[-4,-3.3],[1,-3.9],[-4,2.5],[1.5,2.3]])oval(c,x,y,1.2,1.3,'#343b31');
  for(const [x,y] of [[7,-3],[7.5,.5]]){oval(c,x,y,1,1.1,'#ddd7b9');oval(c,x+.35,y+.2,.4,.5,'#303d32');}
  // Chipped paint exposes the pebble, so this reads as a child's gift.
  for(const [x,y] of [[-7,2],[-2,5],[2,-6]])oval(c,x,y,1,.55,'#b4ad8c');
  c.strokeStyle='#d6b69266';c.lineWidth=.6;c.beginPath();c.ellipse(-1,-1,7.5,5.5,0,3.5,4.8);c.stroke();c.restore();
}

export function paintSandbagSeaside(c,seed){
  const r=randomSource(seed^0x73656173);c.save();c.translate(-7,75);c.lineCap='round';
  // Spilled flood-defence sand has become somebody's tiny seaside. It stays
  // on the sandbag apron, baked with the paving rather than becoming a hazard.
  const stain=c.createRadialGradient(0,4,5,0,4,36);stain.addColorStop(0,'#6f63474d');stain.addColorStop(.7,'#8e7c4c20');stain.addColorStop(1,'#8e7c4c00');
  oval(c,0,4,36,29,stain);
  for(let i=0;i<210;i++){
    const a=r()*Math.PI*2,d=Math.sqrt(r()),x=Math.cos(a)*34*d,y=4+Math.sin(a)*27*d;
    oval(c,x,y,.35+r()*.7,.3+r()*.5,i%3?'#b4a17569':'#645b3e57');
  }
  // The moat is a shallow, irregular ring with an uncut sand bridge at the
  // near edge. Dark saturated banks and a broken sky glint show actual water.
  const ring=(width,color,offset=0)=>{
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();
    for(let i=0;i<=48;i++){
      const a=.78+i/48*5.35,rr=1+Math.sin(a*3+.4)*.035+Math.sin(a*7)*.025;
      const x=Math.sin(a)*(27+offset)*rr,y=Math.cos(a)*(22+offset)*rr+3;
      i?c.lineTo(x,y):c.moveTo(x,y);
    }c.stroke();
  };
  ring(5,'#5a5d4780');ring(3.3,'#677e754f');ring(.65,'#d2d7bb55',-1.2);
  const sand=c.createLinearGradient(-20,-17,18,18);sand.addColorStop(0,'#c0af83');sand.addColorStop(.48,'#a99566');sand.addColorStop(1,'#827248');
  // The short walls have finger marks and uneven crenellations, with their
  // own low shadows. They are little heaps, not flawless masonry blocks.
  for(const [x,y,w,h] of [[-16,-10,31,6],[-17,-8,6,20],[11,-8,6,15],[-14,9,25,6]]){
    c.shadowColor='#34473266';c.shadowBlur=1.2;c.shadowOffsetX=1;c.shadowOffsetY=2;
    c.fillStyle=sand;c.beginPath();c.roundRect(x,y,w,h,2);c.fill();c.shadowColor='transparent';
    c.strokeStyle='#d8c59b80';c.lineWidth=.65;c.beginPath();c.moveTo(x+2,y+.5);c.lineTo(x+w-2,y+.5);c.stroke();
  }
  for(const [x,y] of [[-10,-10],[-1,-10],[8,-10],[-17,-1],[-17,7],[13,-1],[-7,10],[3,10]]){
    oval(c,x,y,2.4,2.4,'#bba879');oval(c,x+.6,y+1,1.4,1,'#786c4980');
  }
  const turret=(x,y,size)=>{
    c.shadowColor='#38482b5c';c.shadowBlur=1.4;c.shadowOffsetX=1.4;c.shadowOffsetY=2;
    const side=c.createLinearGradient(x-size,0,x+size,0);side.addColorStop(0,'#8e7c50');side.addColorStop(.4,'#bdab7c');side.addColorStop(1,'#85754b');
    c.fillStyle=side;c.beginPath();c.moveTo(x-size,y-4);c.lineTo(x-size+1,y+5);c.quadraticCurveTo(x,y+9,x+size-1,y+5);c.lineTo(x+size,y-4);c.fill();c.shadowColor='transparent';
    oval(c,x,y-4,size,size*.68,'#c2b084');oval(c,x,y-4,size*.65,size*.42,'#8e805b');
    c.strokeStyle='#ddcba174';c.lineWidth=.55;c.beginPath();c.ellipse(x,y-4,size-.4,size*.62,0,Math.PI,Math.PI*2);c.stroke();
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;oval(c,x+Math.cos(a)*size*.83,y-4+Math.sin(a)*size*.53,1.5,1.3,'#b8a574');}
  };
  turret(-14,-8,5.5);turret(14,-8,5.5);turret(-14,10,5);
  // The fourth tower has slumped into the moat. A few clumps and a fan of
  // wet grains tell the small disaster without an alert or special effect.
  for(let i=0;i<30;i++){const a=r()*Math.PI*2,d=r();oval(c,14+Math.cos(a)*8*d,12+Math.sin(a)*6*d,.4+r()*1.4,.35+r(),i%2?'#aa9869':'#807447');}
  oval(c,12,10,3.5,2.5,'#b4a173');oval(c,16,15,2.7,1.8,'#8d8157');
  for(let i=0;i<100;i++){
    const x=(r()-.5)*31,y=(r()-.5)*23;
    if(Math.abs(x)<10&&Math.abs(y)<7)continue;
    oval(c,x,y,.25+r()*.4,.25,i%2?'#ead6a755':'#5b553b50');
  }
  // The keep is a single bucket mould, crowned by a leaf on a cocktail stick.
  turret(0,0,7);
  c.strokeStyle='#776044';c.lineWidth=1;c.beginPath();c.moveTo(0,-4);c.lineTo(-2,-24);c.stroke();
  c.strokeStyle='#d1ba83';c.lineWidth=.4;c.beginPath();c.moveTo(-.4,-5);c.lineTo(-2.4,-23);c.stroke();
  c.save();c.translate(-2,-22);c.rotate(-.2);c.fillStyle='#77834c';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(6,-5,13,-1);c.lineTo(10,2);c.lineTo(12,3);c.quadraticCurveTo(5,6,0,4);c.closePath();c.fill();
  c.strokeStyle='#b4b778a6';c.lineWidth=.45;c.beginPath();c.moveTo(0,2);c.lineTo(11,1);c.moveTo(5,1.5);c.lineTo(7,-1);c.stroke();c.restore();
  // A scuffed toy bucket lies on its side. Its moulded rim and wire handle
  // make it read differently from the terracotta pots elsewhere on the walk.
  c.save();c.translate(34,-25);c.rotate(.48);c.shadowColor='#243c2b66';c.shadowBlur=1.4;c.shadowOffsetY=1.5;
  const plastic=c.createLinearGradient(-9,0,9,0);plastic.addColorStop(0,'#98594b');plastic.addColorStop(.35,'#cc9170');plastic.addColorStop(1,'#995647');
  c.fillStyle=plastic;c.beginPath();c.moveTo(-6,-8);c.quadraticCurveTo(0,-11,6,-8);c.lineTo(9,8);c.quadraticCurveTo(0,12,-9,8);c.closePath();c.fill();c.shadowColor='transparent';
  oval(c,0,7,9.5,3.7,'#d49c79');oval(c,0,7,7.7,2.4,'#785440');oval(c,1,7.4,5.3,1.3,'#ac9366');
  c.strokeStyle='#a4afa0';c.lineWidth=.85;c.beginPath();c.moveTo(-9,5);c.bezierCurveTo(-19,19,19,19,9,5);c.stroke();
  c.strokeStyle='#e2b990a1';c.lineWidth=.6;c.beginPath();c.moveTo(-5,-5);c.lineTo(-6,0);c.moveTo(4,1);c.lineTo(5,4);c.stroke();
  c.fillStyle='#e1bb8c99';c.beginPath();c.arc(0,-2,2.5,0,Math.PI*2);c.fill();c.restore();
  // The matching short spade has sand left in its scoop and a hollow grip.
  c.save();c.translate(34,9);c.rotate(-.3);c.shadowColor='#23392a60';c.shadowBlur=1;c.shadowOffsetY=1.2;
  c.strokeStyle='#6b9590';c.lineWidth=2.5;c.beginPath();c.moveTo(0,-7);c.lineTo(0,6);c.stroke();
  c.strokeStyle='#91b0a0';c.lineWidth=1.4;c.beginPath();c.roundRect(-3,-12,6,5,1.5);c.stroke();
  c.fillStyle='#7eaaa0';c.beginPath();c.moveTo(-4,5);c.lineTo(4,5);c.lineTo(3,13);c.quadraticCurveTo(0,16,-3,13);c.closePath();c.fill();c.shadowColor='transparent';
  oval(c,.4,10,2.1,2.7,'#b2a06c');c.strokeStyle='#bfd1b280';c.lineWidth=.5;c.beginPath();c.moveTo(-3,6);c.lineTo(-2.4,12);c.stroke();c.restore();
  c.restore();
}

export function paintPawRepair(c,seed){
  const r=randomSource(seed^0x70617773);c.save();c.translate(0,70);
  c.fillStyle='#5d685955';c.beginPath();c.moveTo(-37,-24);c.lineTo(30,-22);c.lineTo(37,-16);c.lineTo(36,25);c.lineTo(-34,26);c.lineTo(-39,18);c.closePath();c.fill();
  const cement=c.createLinearGradient(-31,-22,31,26);cement.addColorStop(0,'#9a9d88');cement.addColorStop(.55,'#868d7a');cement.addColorStop(1,'#7b8471');
  c.fillStyle=cement;c.beginPath();c.moveTo(-35,-22);c.lineTo(29,-20);c.lineTo(35,-15);c.lineTo(34,23);c.lineTo(-32,24);c.lineTo(-37,17);c.closePath();c.fill();
  c.strokeStyle='#ccd1b42b';c.lineWidth=.65;
  for(const y of [-16,-9,7,16]){c.beginPath();c.moveTo(-30,y);c.quadraticCurveTo(0,y-3,30,y-1);c.stroke();}
  for(let i=0;i<100;i++){c.fillStyle=i%2?'#d1ceb52c':'#48574527';c.fillRect(-32+r()*63,-18+r()*38,.5+r()*.5,.4);}
  // Four little dents, with a raised damp lip catching the light: someone
  // tested this repair before it was ready. No decorative dirt on the route.
  for(const [i,[x,y]] of [[-23,13],[-8,6],[4,-2],[19,-9]].entries()){
    c.save();c.translate(x,y);c.rotate(.85+(i%2?-.15:.15));
    for(const [px,py,rx,ry] of [[0,1,3,2.5],[-3,-2,1,1.5],[-1,-3.7,1,1.4],[1.4,-3.6,1,1.4],[3.3,-1.9,1,1.4]]){
      oval(c,px,py+.65,rx+.35,ry+.35,'#c0c4a875');oval(c,px,py,rx,ry,'#4f604b9c');oval(c,px+.2,py+.5,rx*.65,ry*.55,'#78887066');
    }c.restore();
  }
  c.restore();
}

// Calibrated to the 512 x 1024 van photograph. This is baked into its sprite
// once, in the reachable, road-facing half of the bonnet, clear of the glass.
export function paintVanMessage(c){
  const r=randomSource(0x77617368);c.save();c.shadowColor='transparent';c.shadowOffsetX=c.shadowOffsetY=0;
  c.translate(345,76);c.rotate(.055);
  c.save();c.beginPath();c.ellipse(0,0,76,46,0,0,Math.PI*2);c.clip();
  c.save();c.scale(76,46);
  const dust=c.createRadialGradient(-.08,-.02,.08,0,0,1);
  dust.addColorStop(0,'#9789757a');dust.addColorStop(.4,'#a2937a65');dust.addColorStop(.75,'#998b7028');dust.addColorStop(1,'#998b7000');
  c.fillStyle=dust;c.fillRect(-1,-1,2,2);c.restore();
  for(let i=0;i<420;i++){
    const x=(r()-.5)*148,y=(r()-.5)*88,fade=Math.max(0,1-Math.hypot(x/76,y/46));
    c.globalAlpha=fade;c.fillStyle=i%3?'#655f4f45':'#ebe4cf4a';c.fillRect(x,y,.5+r()*.7,.4+r()*.6);
  }
  c.globalAlpha=1;
  // Thin rain tracks and a half-wiped palm smudge surround the finger strokes.
  c.strokeStyle='#ddd9c832';c.lineWidth=1.1;
  for(const x of [-55,-33,37,51]){c.beginPath();c.moveTo(x,-35);c.bezierCurveTo(x-3,-18,x+3,9,x-1,35);c.stroke();}
  c.restore();
  const letters=[
    [[-45,-22],[-42,-4],[-36,-16],[-30,-3],[-27,-22]],
    [[-20,-4],[-14,-23],[-7,-4]], [[-18,-11],[-10,-12]],
    [[10,-21],[3,-23],[-1,-19],[0,-14],[8,-12],[10,-7],[6,-3],[-1,-5]],
    [[17,-23],[18,-4]], [[31,-22],[30,-3]], [[18,-13],[30,-14]],
    [[-21,24],[-21,6],[-14,16],[-7,6],[-6,25]],
    [[14,6],[2,7],[3,25],[15,24]], [[3,15],[12,15]],
  ];
  c.lineCap='round';c.lineJoin='round';
  for(const [width,color,offset] of [[4,'#82786124',.7],[2.7,'#e4e1d5bd',0]]){
    c.save();c.translate(offset,offset);c.strokeStyle=color;c.lineWidth=width;c.beginPath();
    for(const line of letters)line.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();
  }
  // A tiny hopeful umbrella, drawn with the same dusty fingertip.
  c.strokeStyle='#e7e3d4a3';c.lineWidth=2.1;c.beginPath();c.moveTo(24,13);c.quadraticCurveTo(35,-4,45,13);
  c.quadraticCurveTo(40,10,35,13);c.quadraticCurveTo(29,10,24,13);c.moveTo(35,13);c.lineTo(35,25);c.quadraticCurveTo(30,31,28,25);c.stroke();
  c.restore();
}

export function paintBoatWorkshop(c,seed){
  const r=randomSource(seed^0x666f6c64);c.save();
  // A partly folded square: one flap still lies open, with pencilled creases
  // and a damp corner. Its scale matches the finished paper boat above it.
  c.save();c.translate(5,8);c.rotate(.13);c.shadowColor='#1c302c55';c.shadowBlur=1.5;c.shadowOffsetY=1.2;
  c.fillStyle='#bbbca6';c.beginPath();c.moveTo(-21,-19);c.lineTo(21,-19);c.lineTo(21,20);c.lineTo(-21,20);c.closePath();c.fill();c.shadowColor='transparent';
  const paper=c.createLinearGradient(-20,-19,21,20);paper.addColorStop(0,'#e7e3cc');paper.addColorStop(.6,'#d5d4bd');paper.addColorStop(1,'#a4ab96');
  c.fillStyle=paper;c.fillRect(-20,-18,40,37);
  c.strokeStyle='#6b8d9b30';c.lineWidth=.5;for(let y=-11;y<19;y+=6){c.beginPath();c.moveTo(-19,y);c.lineTo(20,y);c.stroke();}
  c.fillStyle='#c0c3aa';c.beginPath();c.moveTo(-20,-18);c.lineTo(0,2);c.lineTo(-20,3);c.closePath();c.fill();
  c.fillStyle='#f0ead4';c.beginPath();c.moveTo(21,-18);c.lineTo(0,2);c.lineTo(21,3);c.closePath();c.fill();
  c.strokeStyle='#7a82666b';c.lineWidth=.55;c.beginPath();c.moveTo(-20,3);c.lineTo(21,3);c.moveTo(0,2);c.lineTo(0,18);c.stroke();
  c.strokeStyle='#f1edda8a';c.beginPath();c.moveTo(1,1);c.lineTo(20,-17);c.stroke();
  c.fillStyle='#89968135';c.beginPath();c.moveTo(11,19);c.quadraticCurveTo(5,9,20,9);c.lineTo(20,19);c.fill();c.restore();
  // Instructions someone drew themselves; the little hulls are different at
  // each stage. An old washer keeps the scrap from following the other boats.
  c.save();c.translate(-3,69);c.rotate(-.08);c.shadowColor='#24382c50';c.shadowBlur=1.2;c.shadowOffsetY=1;
  c.fillStyle='#d7ceb1';c.beginPath();c.moveTo(-35,-19);c.lineTo(33,-20);c.lineTo(35,16);c.lineTo(27,21);c.lineTo(-34,19);c.closePath();c.fill();c.shadowColor='transparent';
  c.fillStyle='#54767a';c.font='5.8px monospace';c.textAlign='center';c.fillText('PUDDLE CLUB',-3,-11);
  c.strokeStyle='#547680c4';c.lineWidth=.8;c.lineJoin='round';
  c.beginPath();c.moveTo(-28,-4);c.lineTo(-15,-4);c.lineTo(-15,8);c.lineTo(-28,8);c.closePath();c.moveTo(-28,-4);c.lineTo(-15,8);c.stroke();
  c.beginPath();c.moveTo(-6,7);c.lineTo(1,-4);c.lineTo(9,7);c.closePath();c.moveTo(1,-4);c.lineTo(1,7);c.stroke();
  c.beginPath();c.moveTo(17,4);c.lineTo(31,4);c.lineTo(27,10);c.lineTo(21,10);c.closePath();c.moveTo(21,4);c.lineTo(25,-4);c.lineTo(27,4);c.stroke();
  for(const x of [-11,13]){c.beginPath();c.moveTo(x-1,2);c.lineTo(x+2,2);c.lineTo(x,0);c.moveTo(x+2,2);c.lineTo(x,4);c.stroke();}
  c.font='4px monospace';for(const [i,x] of [-22,1,24].entries())c.fillText(i+1,x,15);
  c.fillStyle='#ebe2c7';c.beginPath();c.moveTo(27,15);c.lineTo(35,16);c.lineTo(27,21);c.fill();
  for(let i=0;i<55;i++){c.fillStyle=i%2?'#776f5230':'#faf0cc30';c.fillRect(-32+r()*64,-17+r()*33,.45,.5);}
  oval(c,-28,-15,4.8,4.6,'#565b4959');oval(c,-29,-16,4.6,4.4,'#899280');oval(c,-29,-16,2.4,2.3,'#d7ceb1');
  c.strokeStyle='#c6c6a980';c.lineWidth=.5;c.beginPath();c.arc(-29,-16,3.7,3.2,5.3);c.stroke();c.restore();
  // Wax crayon with a torn paper wrapper, a worn point and a little blue dust.
  c.save();c.translate(-31,7);c.rotate(-.22);c.shadowColor='#24362a66';c.shadowBlur=1;c.shadowOffsetY=1;
  c.fillStyle='#4b777d';c.fillRect(-2,-14,4,26);c.beginPath();c.moveTo(-2,-14);c.lineTo(0,-20);c.lineTo(2,-14);c.fill();c.shadowColor='transparent';
  c.fillStyle='#c0c6ad';c.beginPath();c.moveTo(-2,-7);c.lineTo(2,-9);c.lineTo(2,8);c.lineTo(-2,9);c.fill();
  c.strokeStyle='#647d72';c.lineWidth=.5;for(const y of [-4,0,4]){c.beginPath();c.moveTo(-1,y);c.lineTo(1,y-.5);c.stroke();}c.restore();
  for(let i=0;i<8;i++)oval(c,-34+r()*8,25+r()*8,.35+r()*.45,.4,'#4e7d7a70');
  c.restore();
}

// These are small physical objects, painted into cached scenery, not overlays.
export function paintCatKeepsakes(c,x,y,side){
  const outward=side?1:-1,r=randomSource(0x6d6f7573);c.save();c.translate(x+outward*12,y+68);
  // A small homemade mouse lies on the welcome mat, its chewed shoelace
  // tail loose behind it. All of it belongs to cached ground.
  c.save();c.rotate(outward*.45);
  c.strokeStyle='#26392b45';c.lineWidth=2;c.beginPath();c.moveTo(1,7);c.bezierCurveTo(4,15,15,9,13,18);c.quadraticCurveTo(12,26,5,24);c.stroke();
  c.strokeStyle='#baa98e';c.lineWidth=1.35;c.beginPath();c.moveTo(0,6);c.bezierCurveTo(3,14,14,8,12,17);c.quadraticCurveTo(11,25,4,23);c.stroke();
  c.strokeStyle='#e1d4b572';c.lineWidth=.45;c.beginPath();c.moveTo(0,6);c.bezierCurveTo(3,14,14,8,12,17);c.stroke();
  // A missing aglet leaves three frayed threads at the tip.
  c.strokeStyle='#c1b294';c.lineWidth=.4;for(const [dx,dy] of [[-3,-1],[-2,2],[-4,1]]){c.beginPath();c.moveTo(4,23);c.lineTo(4+dx,23+dy);c.stroke();}
  c.shadowColor='#20352768';c.shadowBlur=1.4;c.shadowOffsetX=1;c.shadowOffsetY=1.5;
  const cloth=c.createRadialGradient(-3,-2,1,0,1,13);cloth.addColorStop(0,'#b7b6a2');cloth.addColorStop(.6,'#969e90');cloth.addColorStop(1,'#68796b');
  c.fillStyle=cloth;c.beginPath();c.moveTo(-1,-14);c.bezierCurveTo(-8,-8,-12,1,-7,8);c.bezierCurveTo(-2,14,9,10,9,4);c.bezierCurveTo(10,-2,3,-11,-1,-14);c.fill();c.shadowColor='transparent';
  c.save();c.beginPath();c.moveTo(-1,-14);c.bezierCurveTo(-8,-8,-12,1,-7,8);c.bezierCurveTo(-2,14,9,10,9,4);c.bezierCurveTo(10,-2,3,-11,-1,-14);c.clip();
  for(let i=0;i<90;i++){const px=(r()-.5)*21,py=-13+r()*26;c.strokeStyle=i%2?'#e0d9bf42':'#435e4b37';c.lineWidth=.35;c.beginPath();c.moveTo(px,py);c.lineTo(px+.6,py+1.1);c.stroke();}c.restore();
  // A teal fabric patch is blanket-stitched over the much-loved seam.
  c.save();c.translate(2,4);c.rotate(-.2);c.fillStyle='#648781';c.beginPath();c.roundRect(-3.5,-3,7,7,1);c.fill();
  c.strokeStyle='#d8caa4';c.lineWidth=.45;for(let n=-2;n<=2;n+=2){c.beginPath();c.moveTo(n,-3.7);c.lineTo(n,-2);c.moveTo(n,3);c.lineTo(n,4.5);c.moveTo(-4,n);c.lineTo(-2.4,n);c.moveTo(2.4,n);c.lineTo(4,n);c.stroke();}c.restore();
  c.strokeStyle='#516b5987';c.lineWidth=.55;c.setLineDash([1.2,1.1]);c.beginPath();c.moveTo(-1,-8);c.quadraticCurveTo(-2,1,-1,8);c.stroke();c.setLineDash([]);
  // One ear has folded over. A sewn button and a thread eye are mismatched.
  oval(c,-4,-7,3.2,4,'#828f7d');oval(c,-4.4,-7.2,2.1,2.7,'#bd9e94');
  c.fillStyle='#a0a48d';c.beginPath();c.moveTo(2,-9);c.quadraticCurveTo(10,-10,6,-3);c.quadraticCurveTo(2,-4,2,-9);c.fill();
  c.strokeStyle='#d1c8ad';c.lineWidth=.45;c.beginPath();c.moveTo(3,-8);c.quadraticCurveTo(7,-7,5,-4);c.stroke();
  oval(c,-3,-10,1.1,1.1,'#394f41');oval(c,-3.2,-10.2,.25,.25,'#d4d1b2');
  c.strokeStyle='#394f41';c.lineWidth=.55;c.beginPath();c.moveTo(1,-10);c.lineTo(2,-9);c.moveTo(2,-10);c.lineTo(1,-9);c.stroke();
  oval(c,-1,-13.2,1.4,1.1,'#a88072');
  c.strokeStyle='#d6ceb17a';c.lineWidth=.35;for(const [dx,dy] of [[-5,-2],[-5,0],[5,-2],[5,0]]){c.beginPath();c.moveTo(-1,-12);c.lineTo(-1+dx,-12+dy);c.stroke();}
  c.restore();
  // A torn corner of packing tissue, caught between mat and cardboard.
  c.save();c.translate(-outward*20,-10);c.rotate(-.2);c.fillStyle='#dad2b8b3';c.beginPath();c.moveTo(-4,-6);c.lineTo(4,-4);c.lineTo(3,0);c.lineTo(6,3);c.lineTo(1,4);c.lineTo(-3,2);c.closePath();c.fill();
  c.strokeStyle='#8a8d735c';c.lineWidth=.4;c.beginPath();c.moveTo(-2,-4);c.lineTo(1,2);c.lineTo(4,3);c.stroke();c.restore();c.restore();
}

export function paintCatWaterBowl(c,x,y){
  c.save();c.translate(x,y);c.shadowColor='#20392b66';c.shadowBlur=1.3;c.shadowOffsetY=1.5;
  oval(c,0,0,11,9,'#657e72');c.shadowColor='transparent';
  const enamel=c.createLinearGradient(-10,-8,10,8);enamel.addColorStop(0,'#e0dbc0');enamel.addColorStop(.5,'#aebba4');enamel.addColorStop(1,'#718f81');
  oval(c,-.3,-.6,10.3,8.3,enamel);oval(c,0,-1,8,6.2,'#53766c');oval(c,-.1,-1.3,7.1,5.4,'#a6b9a1');
  // The fish belongs to the bowl's glaze, seen through shallow clear water.
  oval(c,-.7,-1,2.5,1.2,'#587f7870');c.fillStyle='#587f7870';c.beginPath();c.moveTo(1,-1);c.lineTo(3,-2.5);c.lineTo(3,.4);c.fill();
  const water=c.createLinearGradient(-6,-5,6,4);water.addColorStop(0,'#c7d5bd47');water.addColorStop(1,'#598b873b');oval(c,0,-1,7,5.2,water);
  c.strokeStyle='#ecedd373';c.lineWidth=.65;c.beginPath();c.ellipse(-.6,-1.8,6.4,4.4,0,3.4,4.8);c.stroke();
  c.strokeStyle='#e7dcb98a';c.lineWidth=.65;c.beginPath();c.ellipse(-.3,-.6,9.2,7.4,0,3.5,5.2);c.stroke();
  c.fillStyle='#526f63';c.beginPath();c.moveTo(7.6,4.1);c.lineTo(8.8,3);c.lineTo(9.2,4.5);c.lineTo(7.7,5.6);c.fill();
  oval(c,-8.5,-3.8,.7,.45,'#5a7562');c.restore();
}

export function paintShoeBox(c,x,y,front=false){
  c.save();c.translate(x,y);
  if(!front){
    c.shadowColor='#17271c55';c.shadowBlur=3;c.shadowOffsetY=3;
    c.fillStyle='#876445';c.fillRect(-46,-49,92,99);c.shadowColor='transparent';
    c.fillStyle='#bd996d';c.fillRect(-45,-48,90,94);
    c.fillStyle='#694e36';c.fillRect(-41,-43,82,85);
    // Crumpled tissue just peeks out around its new occupant.
    c.fillStyle='#d5cfb8';c.beginPath();
    for(const [i,[px,py]] of [[-38,-38],[-19,-42],[-4,-35],[16,-41],[38,-36],[35,-12],[40,7],[33,35],[12,31],[-8,38],[-36,32],[-34,8],[-40,-9]].entries())i?c.lineTo(px,py):c.moveTo(px,py);
    c.closePath();c.fill();c.strokeStyle='#8b88704a';c.lineWidth=.7;
    for(const [px,py] of [[-34,-34],[33,-31],[-31,29],[28,31]]){c.beginPath();c.moveTo(px,py);c.lineTo(px*.6,py*.5);c.stroke();}
    c.strokeStyle='#e4c69499';c.lineWidth=1;c.strokeRect(-44.5,-47.5,89,95);
    const r=randomSource(4319);c.strokeStyle='#5f503632';c.lineWidth=.5;
    for(let i=0;i<18;i++){const yy=-44+r()*81;c.beginPath();c.moveTo(-45,yy);c.lineTo(-42,yy+1);c.stroke();}
    c.fillStyle='#7b5d3a55';c.beginPath();c.moveTo(35,46);c.lineTo(44,41);c.lineTo(44,48);c.closePath();c.fill();
    // Three claw scores expose pale cardboard fibres along the outer rim.
    for(const yy of [-26,-21,-16]){
      c.strokeStyle='#6e553b9e';c.lineWidth=.85;c.beginPath();c.moveTo(-45,yy);c.lineTo(-39,yy+4);c.stroke();
      c.strokeStyle='#e6cda080';c.lineWidth=.5;c.beginPath();c.moveTo(-45,yy+.8);c.lineTo(-39,yy+4.8);c.stroke();
    }
  }else{
    // The front lip sits over the photograph, so the cat is IN the box.
    c.fillStyle='#ae875b';c.fillRect(-46,37,92,13);c.fillStyle='#ddbc84';c.fillRect(-45,37,90,1.4);
    c.fillStyle='#e3d9bc';c.fillRect(-24,39,43,9);c.fillStyle='#514b3b';c.font='600 7px sans-serif';c.textAlign='left';c.textBaseline='alphabetic';c.fillText('SHOES',-21,46);
    c.font='7px monospace';c.fillText('43',22,46);
    for(let i=0;i<7;i++)c.fillRect(-39+i*1.5,40,i%3?.6:1,6);
  }
  c.restore();
}

export function createBiscuitSprite(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const c=canvas.getContext('2d');c.translate(32,32);c.scale(2,2);paintBiscuit(c);return canvas;
}
function paintBiscuit(c){
  c.save();c.rotate(-.17);
  c.shadowColor='#29302155';c.shadowBlur=1.5;c.shadowOffsetY=1;
  c.fillStyle='#b98443';c.beginPath();
  // A bite is cut into the outline, leaving the original napkin visible.
  c.moveTo(-10,-8);c.quadraticCurveTo(-12,8,-7,10);c.lineTo(9,9);c.lineTo(11,4);
  c.quadraticCurveTo(5,5,6,0);c.quadraticCurveTo(1,-1,4,-5);c.quadraticCurveTo(0,-8,4,-10);c.lineTo(-7,-10);c.closePath();c.fill();c.shadowColor='transparent';
  c.strokeStyle='#e2ba79';c.lineWidth=1;c.beginPath();c.moveTo(-7,-7);c.lineTo(-8,6);c.lineTo(7,6);c.stroke();
  for(const px of [-5,-1])for(const py of [-5,0,5])oval(c,px,py,.6,.8,'#785b35aa');
  c.restore();
}
export function paintBiscuitCrumbs(c,x,y,seed){
  const r=randomSource(seed);c.save();c.translate(x,y);c.rotate(-.17);
  for(let i=0;i<8;i++)oval(c,9+r()*13,-8+r()*19,.35+r()*.8,.4+r()*.5,i%2?'#c59c61':'#8d6e42');
  c.restore();
}

export function paintBootPlanter(c,x,y,seed){
  const r=randomSource(seed^0x626f6f74);c.save();c.translate(x,y);c.rotate(.28);
  c.shadowColor='#1c2a205c';c.shadowBlur=2;c.shadowOffsetY=2;
  // A child's old welly, seen from above: round toe, narrow ankle, open cuff.
  c.fillStyle='#273d33';c.beginPath();c.moveTo(-13,23);c.bezierCurveTo(-18,6,-19,-18,-12,-28);c.bezierCurveTo(-5,-39,12,-33,15,-24);c.bezierCurveTo(20,-9,13,7,14,23);c.quadraticCurveTo(0,33,-13,23);c.fill();c.shadowColor='transparent';
  const rubber=c.createLinearGradient(-15,-12,17,12);rubber.addColorStop(0,'#46634d');rubber.addColorStop(.3,'#718568');rubber.addColorStop(.65,'#4f6a50');rubber.addColorStop(1,'#344d3b');
  c.fillStyle=rubber;c.beginPath();c.moveTo(-11,22);c.bezierCurveTo(-15,3,-17,-18,-10,-26);c.bezierCurveTo(-3,-34,10,-29,12,-22);c.bezierCurveTo(16,-8,11,9,12,22);c.quadraticCurveTo(0,29,-11,22);c.fill();
  c.strokeStyle='#b5bf8c77';c.lineWidth=.8;c.beginPath();c.moveTo(-12,-7);c.bezierCurveTo(-15,-27,-4,-32,7,-26);c.stroke();
  c.strokeStyle='#263c2f6b';c.lineWidth=.9;for(const yy of [-9,-6]){c.beginPath();c.moveTo(-12,yy);c.quadraticCurveTo(-1,yy-3,11,yy+1);c.stroke();}
  // Scraped rubber and old mud remain around the sole, below the foliage.
  for(let i=0;i<27;i++){const a=r()*Math.PI*2;oval(c,Math.cos(a)*12,-8+Math.sin(a)*22,.5+r()*.8,.4+r()*.5,i%3?'#a7a0807a':'#283c3091');}
  oval(c,0,15,14,12,'#8a9873');oval(c,0,15,11.5,9,'#293d2d');oval(c,0,16,9.5,7.4,'#493e2b');
  for(let i=0;i<35;i++)oval(c,(r()-.5)*16,11+r()*11,.4+r()*.5,.4,i%2?'#887554':'#312d21');
  c.fillStyle='#84916b';c.fillRect(-3,25,6,5);c.fillStyle='#354c35';c.fillRect(-1.5,26,3,3);
  for(const [lx,ly,a] of [[-8,10,-.7],[7,6,.8],[-5,21,-2.1],[10,18,2.3]]){
    c.save();c.translate(lx,ly);c.rotate(a);oval(c,0,0,3,8,'#465f36');oval(c,-.6,-.7,2.3,7,'#738553');c.strokeStyle='#a1ac6d80';c.lineWidth=.5;c.beginPath();c.moveTo(0,5);c.lineTo(0,-6);c.stroke();c.restore();
  }
  for(const [fx,fy,size] of [[-9,4,5.5],[8,19,4.8],[3,-5,6]]){
    c.strokeStyle='#52673d';c.lineWidth=1;c.beginPath();c.moveTo(0,16);c.quadraticCurveTo(fx-4,fy+8,fx,fy);c.stroke();
    c.save();c.translate(fx,fy);c.shadowColor='#23362580';c.shadowBlur=1;c.shadowOffsetY=1;
    for(let i=0;i<8;i++){c.save();c.rotate(i*Math.PI/4+.2);oval(c,0,-size*.65,size*.29,size*.65,i%2?'#e4dfc7':'#f3ecd7');c.restore();}
    c.shadowColor='transparent';oval(c,0,0,2.1,2.1,'#b79a45');oval(c,-.4,-.5,1.3,1.2,'#d9bb65');c.restore();
  }
  c.restore();
}

export function paintLittleRoadworks(c,x,y,seed){
  const r=randomSource(seed^0x746f7973);c.save();c.translate(x,y);
  // Two tiny tyre tracks lead to a sand-filled toy tipper. All of this is on
  // the paved doorstep, beside the grown-up's plans, never a new road hazard.
  c.save();c.rotate(-.18);c.strokeStyle='#5e523a48';c.lineWidth=2.3;c.setLineDash([1.3,2]);
  for(const xx of [-12,12]){c.beginPath();c.moveTo(xx,8);c.bezierCurveTo(xx-1,20,xx+5,32,xx+2,45);c.stroke();}c.restore();
  for(let i=0;i<52;i++){const a=r()*Math.PI*2,d=r();oval(c,22+Math.cos(a)*13*d,24+Math.sin(a)*16*d,.5+r()*1.3,.4+r()*.7,i%3?'#ab936764':'#514a3670');}
  c.save();c.rotate(-.18);c.shadowColor='#17281f60';c.shadowBlur=2;c.shadowOffsetY=2;
  for(const xx of [-13,13])for(const yy of [-12,12]){
    c.fillStyle='#29312a';c.beginPath();c.roundRect(xx-3.7,yy-5.5,7.4,11,2);c.fill();
  }
  c.shadowColor='transparent';c.fillStyle='#7f6333';c.fillRect(-13,-20,26,45);
  const cab=c.createLinearGradient(-12,0,12,0);cab.addColorStop(0,'#b58838');cab.addColorStop(.35,'#e1bb64');cab.addColorStop(1,'#b08941');
  c.fillStyle=cab;c.beginPath();c.roundRect(-12,-21,24,15,2);c.fill();
  c.fillStyle='#536c68';c.fillRect(-9,-19,18,5);c.fillStyle='#b0c5ae80';c.fillRect(-8,-18,16,1.3);
  c.fillStyle='#e4c982';c.fillRect(-11,-22,4,1.8);c.fillRect(7,-22,4,1.8);
  c.fillStyle='#b4543b';c.beginPath();c.roundRect(-12,-4,24,29,2);c.fill();
  c.fillStyle='#df8f64';c.fillRect(-11,-4,22,2);c.fillRect(-11,-3,2,26);c.fillStyle='#773c2d';c.fillRect(9,-2,2,26);c.fillRect(-9,21,18,3);
  c.fillStyle='#625039';c.fillRect(-8,0,16,20);
  for(let i=0;i<64;i++)oval(c,-7+r()*14,1+r()*18,.5+r(),.4+r()*.6,i%3?'#ac9468':'#d1b783');
  c.strokeStyle='#eee1b485';c.lineWidth=.6;c.beginPath();c.moveTo(-10,7);c.lineTo(-10,13);c.moveTo(4,-10);c.lineTo(8,-10);c.stroke();
  c.fillStyle='#c6b899';c.fillRect(-15,-12,1.5,2);c.fillRect(13.5,11,1.5,2);c.restore();
  // A kitchen teaspoon is the excavator. Its bowl still carries a little sand.
  c.save();c.translate(29,32);c.rotate(-.55);c.shadowColor='#15241c66';c.shadowBlur=1;c.shadowOffsetY=1;
  c.strokeStyle='#9aab9e';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(0,3);c.lineTo(0,17);c.stroke();
  oval(c,0,-3,4.5,7,'#aeb9a6');c.shadowColor='transparent';oval(c,.6,-2,3,5,'#66766a');oval(c,.6,-1,2.2,3.5,'#b59a6b');c.strokeStyle='#e0dfbc';c.lineWidth=.55;c.beginPath();c.moveTo(-.6,5);c.lineTo(-.6,16);c.stroke();c.restore();
  c.restore();
}

export function paintHomeKeepsakes(c){
  // Someone smaller, with much less concern for clean floors, got home first.
  for(let i=0;i<7;i++){
    const x=510+i*4+(i%2?3:-3),y=211-i*16;
    c.save();c.translate(x,y);c.rotate(.15);c.globalAlpha=.6-i*.055;
    oval(c,0,1,2.7,2.2,'#5f513b');
    for(const [px,py] of [[-3,-1],[-1,-3],[1.3,-3],[3,-1]])oval(c,px,py,.95,1.2,'#5f513b');c.restore();
  }
  // One lost striped sock, gently folded beside the waiting clogs.
  c.save();c.translate(560,78);c.rotate(.25);c.shadowColor='#17261d50';c.shadowBlur=2;c.shadowOffsetY=2;
  const cloth=c.createLinearGradient(-8,-3,16,5);cloth.addColorStop(0,'#a59e8b');cloth.addColorStop(.28,'#ded6c0');cloth.addColorStop(.65,'#c9c1ab');cloth.addColorStop(1,'#a7a08a');
  c.fillStyle=cloth;c.beginPath();c.moveTo(-8,-17);c.lineTo(6,-18);c.lineTo(6,2);c.quadraticCurveTo(18,4,15,12);c.quadraticCurveTo(12,18,1,14);c.lineTo(-7,7);c.closePath();c.fill();c.shadowColor='transparent';
  c.strokeStyle='#a36a64';c.lineWidth=2;for(const y of [-13,-9]){c.beginPath();c.moveTo(-7,y);c.lineTo(5,y-.5);c.stroke();}
  c.strokeStyle='#f3e9cf70';c.lineWidth=.65;for(let x=-5;x<5;x+=2){c.beginPath();c.moveTo(x,-16);c.lineTo(x,5);c.stroke();}
  c.strokeStyle='#756f5a65';c.beginPath();c.moveTo(-5,6);c.quadraticCurveTo(5,4,11,11);c.moveTo(-6,-2);c.quadraticCurveTo(-1,1,5,-1);c.stroke();
  c.strokeStyle='#f3ebd369';c.beginPath();c.moveTo(-5,7);c.quadraticCurveTo(5,5,10,12);c.stroke();c.restore();
}

export function createDuckSprite(){
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=112;
  const c=canvas.getContext('2d');c.translate(48,60);
  // A scuffed bath toy seen from above: a low oval body, raised head and bill.
  const body=c.createRadialGradient(-10,-12,3,3,5,35);body.addColorStop(0,'#f1d16a');body.addColorStop(.55,'#dfb948');body.addColorStop(1,'#a57a2e');
  c.fillStyle=body;c.beginPath();c.moveTo(-19,-17);c.bezierCurveTo(-38,-4,-27,30,-7,34);c.quadraticCurveTo(6,46,12,31);c.bezierCurveTo(39,24,30,-10,18,-17);c.closePath();c.fill();
  c.strokeStyle='#ab873c';c.lineWidth=1;c.beginPath();c.ellipse(-12,10,9,18,-.3,.2,5.2);c.stroke();
  c.strokeStyle='#f2d78980';c.beginPath();c.ellipse(-13,8,8,15,-.3,2.2,4.7);c.stroke();
  oval(c,1,-14,18,13,'#8b682d45');
  const head=c.createRadialGradient(-6,-28,2,0,-22,23);head.addColorStop(0,'#f8dd7b');head.addColorStop(.7,'#e4bc4b');head.addColorStop(1,'#af832f');oval(c,0,-23,18,20,head);
  oval(c,0,-41,12,6,'#a86a30');oval(c,-1,-43,11,5,'#db9450');c.strokeStyle='#f7c581';c.beginPath();c.moveTo(-8,-44);c.quadraticCurveTo(0,-47,7,-44);c.stroke();
  for(const x of [-12,12]){oval(c,x,-30,2.8,3.4,'#3c3829');oval(c,x-.7,-31,1,1,'#e9e7cb');}
  c.strokeStyle='#b18a3d55';c.lineWidth=.65;c.beginPath();c.moveTo(2,-6);c.quadraticCurveTo(4,12,2,29);c.stroke();
  const r=randomSource(718);for(let i=0;i<24;i++)oval(c,(r()-.5)*34,r()*27,.3+r()*.35,.4,i%2?'#f8e3a64d':'#705a302b');
  return canvas;
}
