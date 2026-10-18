// Static street wear and ironwork. Drawn into the terrain cache, never per frame.
function random(seed){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function strokeCrack(c,points,width){
  const trace=()=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));};
  c.save();c.translate(.8,1);trace();c.strokeStyle='#b3b2a642';c.lineWidth=width+1;c.stroke();c.restore();
  trace();c.strokeStyle='#111c1eab';c.lineWidth=width;c.stroke();
}

function paintSettledUtility(c,section,top,asphalt,seed){
  const r=random(seed^0x5f47c19),w=190,low=-325,high=345,path=new Path2D();
  c.save();c.translate(450,top-section.y);
  // This older reinstated trench has sunk around its covers. Its asphalt is
  // still walkable; only the existing exposed rim and water soil the shoes.
  // Small chipped joints explain the basin without surrounding it in debris.
  const corners=[[-w+9,low],[-42,low+5],[w-12,low-3],[w,low+17],[w-5,high-9],[w-24,high],[-w+13,high-5],[-w,high-25]];
  const edges=[];
  for(let i=0;i<corners.length;i++){
    const a=corners[i],b=corners[(i+1)%corners.length],count=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/24)),edge=[];
    for(let n=0;n<count;n++){
      const t=n/count,p=[a[0]+(b[0]-a[0])*t+(n?(r()-.5)*3:0),a[1]+(b[1]-a[1])*t+(n?(r()-.5)*3:0)];
      if(!i&&!n)path.moveTo(...p);else path.lineTo(...p);edge.push(p);
    }
    edge.push(b);edges.push(edge);
  }
  path.closePath();c.save();c.clip(path);
  c.fillStyle=asphalt;c.fillRect(-w-5,low-5,w*2+10,high-low+10);
  c.fillStyle='#17272b28';c.fill(path);
  for(let n=0;n<650;n++){
    const x=(r()-.5)*w*2,y=low+r()*(high-low),size=.35+r();
    c.fillStyle=n%3?'#afb0a329':'#1924264a';c.fillRect(x,y,size,size*.7);
  }
  c.restore();
  // Weathered tar is broken into stretches, not a heavy rectangular border.
  for(const [i,edge] of edges.entries()){
    c.beginPath();edge.forEach(([x,y],n)=>n?c.lineTo(x,y):c.moveTo(x,y));
    c.strokeStyle=i===3||i===7?'#14232666':'#17272b46';c.lineWidth=i===3||i===7?1.25:.8;c.stroke();
  }
  // Fatigue grows from a few failed joints; the surrounding walking space
  // remains quiet. Fixed coordinates and seed keep every terrain tile joined.
  for(const [x,y,dx,dy] of [[-w,low+92,-1,-.3],[w-3,low+210,1,-.45],[-w+5,high-100,-1,.6],[w-24,high,.2,1]]){
    const line=[[x,y],[x+dx*9,y+dy*10],[x+dx*16+dy*3,y+dy*18-dx*3],[x+dx*27,y+dy*30]];
    strokeCrack(c,line,.65);
  }
  c.restore();
}

export function paintRoadWear(c,street,top,bottom,asphalt){
  c.save();c.beginPath();c.rect(108,top-20120,684,20120-540);c.clip();
  const settled=street.sections.find(s=>s.stage===3&&s.coverPattern==='pair');
  if(settled&&settled.y+390>bottom&&settled.y-390<top)paintSettledUtility(c,settled,top,asphalt,street.seed);
  // Stable world-sized panels continue over chunk joins. Repairs have different
  // aggregate, worn edges, and cracks growing out of their corners.
  for(let section=Math.floor((bottom-260)/560);section<=Math.ceil((top+260)/560);section++){
    const r=random(street.seed^Math.imul(section+73,7919)),y=section*560+260;
    if(y<650||y>20000||settled&&Math.abs(y-settled.y)<520)continue;
    const stage=Math.max(0,Math.min(4,Math.floor((y-240)/4000)));
    // Ordinary stretches get some breathing room. Most damage belongs near
    // existing failures and the work zone, rather than every few paving flags.
    const failure=street.patches.some(p=>(p.craterRim||p.groundField)&&Math.abs(p.y-y)<p.ry+160);
    if(r()>(failure ? .72 : [.28,.48,.68,.34,.22][stage]))continue;
    const x=180+r()*530;
    c.save();c.translate(x,top-y);
    // Utility cuts, hand-filled patches and worn repairs age differently.
    // Their outline and grain are fixed to the street seed, across tile joins.
    const style=section%3,width=style===0?65+r()*70:100+r()*160,height=style===0?170+r()*110:75+r()*135,patch=new Path2D();
    const corners=style===1
      ? [[-.5,-.28],[-.28,-.52],[.19,-.46],[.5,-.19],[.43,.3],[.16,.5],[-.37,.43],[-.54,.08]]
      : [[-.5,-.5],[0,-.5],[.5,-.5],[.5,0],[.5,.5],[0,.5],[-.5,.5],[-.5,0]];
    const points=corners.map(([px,py])=>[px*width+(r()-.5)*8,py*height+(r()-.5)*8]);
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      if(!i)patch.moveTo(...a);else patch.lineTo(...a);
      for(let t=1;t<6;t++)patch.lineTo(a[0]+(b[0]-a[0])*t/6+(r()-.5)*4,a[1]+(b[1]-a[1])*t/6+(r()-.5)*4);
    }
    patch.closePath();
    c.save();c.clip(patch);c.fillStyle=asphalt;c.fillRect(-width,-height,width*2,height*2);
    c.fillStyle=['#111d214d','#17212238','#968b6522'][style];c.fillRect(-width,-height,width*2,height*2);
    for(let n=0;n<400;n++){
      const px=(r()-.5)*width,py=(r()-.5)*height,s=.35+r()*1.2;
      c.fillStyle=n%3?'#adb0a132':'#111b1c70';c.fillRect(px,py,s,s*.7);
    }
    c.restore();c.strokeStyle=style===0?'#1420229c':'#14202261';c.lineWidth=style===0?1.5:.85;c.stroke(patch);
    c.save();c.translate(.5,.7);c.strokeStyle='#b1ac9233';c.lineWidth=.5;c.stroke(patch);c.restore();
    // Branches of fatigue cracking, rather than evenly scattered scratches.
    for(let branch=0;branch<(stage===2?3:2);branch++){
      const start=points[(branch*3+section%2+8)%8],angle=Math.atan2(start[1],start[0])+(r()-.5)*1.2;
      let px=start[0],py=start[1];const line=[[px,py]],length=30+r()*65;
      for(let n=1;n<=8;n++){px+=Math.cos(angle)*length/8+(r()-.5)*14;py+=Math.sin(angle)*length/8+(r()-.5)*14;line.push([px,py]);}
      strokeCrack(c,line,.8+r()*1.1);
      const fork=line[4],twig=[fork];let tx=fork[0],ty=fork[1];
      for(let n=0;n<4;n++){tx+=Math.cos(angle+.9)*13+(r()-.5)*10;ty+=Math.sin(angle+.9)*13+(r()-.5)*10;twig.push([tx,ty]);}
      strokeCrack(c,twig,.6);
    }
    // Connected, uneven fatigue fractures along the wheel track. Shared nodes
    // keep this a broken surface rather than a repeated honeycomb stamp.
    if(stage===2&&section%2===0){
      c.translate(width*.6,50);
      const nodes=Array.from({length:5},(_,row)=>Array.from({length:4},(_,col)=>[col*24+(r()-.5)*18+(row%2)*8,row*22+(r()-.5)*16]));
      for(let row=0;row<4;row++)for(let col=0;col<3;col++){
        const a=nodes[row][col],b=nodes[row][col+1],d=nodes[row+1][col];
        if(r()>.17)strokeCrack(c,[a,[(a[0]+b[0])/2+(r()-.5)*5,(a[1]+b[1])/2+(r()-.5)*7],b],.45+r()*.45);
        if(r()>.2)strokeCrack(c,[a,[(a[0]+d[0])/2+(r()-.5)*9,(a[1]+d[1])/2],d],.45+r()*.5);
      }
    }
    c.restore();
  }
  c.restore();
}

export function paintDrainGrate(c,width,height,seed=1){
  const r=random(seed),w=width/2,h=height/2;
  c.save();
  // A broken bedding edge makes the grate part of the street, not a loose plate.
  const bed=new Path2D(),corners=[[-w-3,-h-3],[w+3,-h-3],[w+3,h+3],[-w-3,h+3]];
  for(let side=0;side<4;side++){
    const a=corners[side],b=corners[(side+1)%4];
    if(!side)bed.moveTo(...a);else bed.lineTo(...a);
    for(let n=1;n<9;n++)bed.lineTo(a[0]+(b[0]-a[0])*n/9+(r()-.5)*2.3,a[1]+(b[1]-a[1])*n/9+(r()-.5)*2.3);
  }
  bed.closePath();c.fillStyle='#77786a';c.fill(bed);
  c.save();c.clip(bed);
  for(let n=0;n<160;n++){
    c.fillStyle=n%3?'#283b354d':'#c5bda36b';c.fillRect(-w-4+r()*(width+8),-h-4+r()*(height+8),.4+r(),.4+r());
  }
  c.restore();
  // A few settling cracks stay close to the mortar, outside the dark iron face.
  for(const [x,y,dx,dy] of [[-w-3,-h+8,-1,-.5],[w+3,h-9,1,.3],[-w+6,h+3,-.4,1]]){
    c.strokeStyle='#1d2c2b66';c.lineWidth=.55;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx*3,y+dy*4);c.lineTo(x+dx*7+dy,y+dy*7-dx);c.stroke();
  }
  c.fillStyle='#141d1e';c.beginPath();c.roundRect(-w,-h,width,height,1.5);c.fill();
  const iron=c.createLinearGradient(-w,-h,w,h);iron.addColorStop(0,'#5a5f5a');iron.addColorStop(.35,'#343d3b');iron.addColorStop(.7,'#414946');iron.addColorStop(1,'#292f2c');
  c.fillStyle=iron;c.fillRect(-w+2,-h+2,width-4,height-4);
  const edge=Math.max(4,width*.1),gap=Math.max(3.6,width*.08),rows=Math.floor((height-edge*2)/gap),inside=width-edge*2,face=new Path2D();
  face.rect(-w+2,-h+2,width-4,height-4);
  for(let row=0;row<rows;row++)for(const side of [-1,1]){
    const x=side<0?-w+edge:1.6,y=-h+edge+row*gap,slotWidth=inside/2-1.6,slotHeight=gap*.54;
    face.roundRect(x,y,slotWidth,slotHeight,.8);
    c.fillStyle='#0d181a';c.beginPath();c.roundRect(x,y,slotWidth,slotHeight,.8);c.fill();
    c.fillStyle='#8790846b';c.fillRect(x+.6,y+slotHeight,slotWidth-1,.55);
    c.fillStyle='#1a2424';c.fillRect(x,y+.6,slotWidth,.7);
  }
  c.strokeStyle='#a4a4934a';c.lineWidth=.7;c.strokeRect(-w+2.5,-h+2.5,width-5,height-5);
  // Pitting and oxidation belong on the bars. Keep the open slots dark so
  // embedded grit cannot flatten the holes into the surrounding metal.
  c.save();c.clip(face,'evenodd');
  for(let n=0;n<width*height*.16;n++){
    const x=-w+2+r()*(width-4),y=-h+2+r()*(height-4),size=.25+r()*.7;
    c.fillStyle=['#afa88a35','#171f225e','#855f3647','#505b5344'][n%4];c.fillRect(x,y,size,size*.7);
  }
  for(let n=0;n<9;n++){
    const x=(n%2?-1:1)*(w-edge*.6),y=(r()-.5)*(height-6),radius=1.5+r()*3;
    const rust=c.createRadialGradient(x,y,.3,x,y,radius);rust.addColorStop(0,'#a171466b');rust.addColorStop(1,'#80553800');c.fillStyle=rust;c.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  for(let n=0;n<14;n++){
    const x=(r()-.5)*(width-6),y=(r()-.5)*(height-6);
    c.strokeStyle=n%3?'#b9b9a83d':'#1628266b';c.lineWidth=.35+r()*.4;c.beginPath();c.moveTo(x,y);c.lineTo(x+1+r()*4,y-1-r()*2);c.stroke();
  }
  c.restore();
  for(const x of [-w+edge*.5,w-edge*.5])for(const y of [-h+edge*.5,h-edge*.5]){
    c.fillStyle='#151e1d';c.beginPath();c.arc(x,y,1.1,0,Math.PI*2);c.fill();c.strokeStyle='#9298865c';c.lineWidth=.5;c.beginPath();c.moveTo(x-.7,y);c.lineTo(x+.7,y);c.stroke();
  }
  c.restore();
}

// Pavement is laid in world-aligned courses. Repainting a doorway or a terrain
// chunk produces the same stones, including the partial flags at either edge.
export function paintPaving(c,texture,x,y,width,height,kind='doorsteps',seed=1,originX=0){
  const course=kind==='parking'?180:120,flag=96;
  c.save();c.beginPath();c.rect(x,y,width,height);c.clip();
  c.fillStyle=texture?c.createPattern(texture,'repeat'):'#98998e';c.fillRect(x,y,width,height);
  for(let row=Math.floor(y/course);row<=Math.floor((y+height)/course);row++){
    for(let col=Math.floor((x-originX)/flag);col<=Math.floor((x+width-originX)/flag);col++){
      const sx=originX+col*flag,sy=row*course,r=random(seed^Math.imul(row+801,1777)^Math.imul(col+43,7919)^Math.imul(Math.round(originX)+543,104729));
      r();r();
      const tone=r(),replaced=tone>.89;
      c.fillStyle=replaced?'#e3dfcc23':tone>.65?'#293b3b12':tone<.22?'#ddd1b317':'#73807307';
      c.fillRect(sx+1,sy+1,flag-2,course-2);
      if(kind==='home'){c.fillStyle='#c8ae8610';c.fillRect(sx+1,sy+1,flag-2,course-2);}
      // The slab face stays matte; only its chipped arris catches the light.
      c.fillStyle='#28322e62';c.fillRect(sx,sy,flag,1.3);c.fillRect(sx,sy,1.25,course);
      c.fillStyle='#e0ddc26b';c.fillRect(sx+1.4,sy+1.5,flag-2.6,.6);c.fillRect(sx+1.5,sy+1.5,.55,course-2.5);
      for(let n=0;n<9;n++){
        const px=sx+3+r()*(flag-6),py=sy+(n%2?course-1:1),size=.6+r()*2;
        c.fillStyle=n%2?'#41463753':'#c5c3ad69';c.fillRect(px,py,size,.5+r());
      }
      if(tone<.19){
        const cy=sy+18+r()*(course-35),points=[[sx,cy],[sx+11,cy+6],[sx+18,cy+3],[sx+34,cy+15],[sx+41,cy+27]];
        strokeCrack(c,points,.45);
      }
      if(kind==='flooded'){
        // Dampness and moss grow out of the joints, leaving the middle legible.
        const damp=c.createLinearGradient(0,sy,0,sy+20);damp.addColorStop(0,'#243e3547');damp.addColorStop(1,'#243e3500');
        c.fillStyle=damp;c.fillRect(sx,sy,flag,20);
        for(let n=0;n<28;n++){
          c.fillStyle=n%3?'#626c3b82':'#263e3370';c.fillRect(sx+r()*flag,sy+r()*4,.7+r()*2,.4+r()*1.7);
        }
      }
      if(kind==='parking'&&tone<.48){
        c.save();c.translate(sx+28+r()*35,sy+course/2);c.rotate(-.12+r()*.24);
        for(let n=0;n<5;n++){c.strokeStyle='#26302e18';c.lineWidth=1.5;c.beginPath();c.moveTo(n*2,-course*.4);c.bezierCurveTo(n*2-4,-15,n*2+5,15,n*2+2,course*.4);c.stroke();}
        c.restore();
      }
      if(kind==='works'&&tone<.16){
        // One lifted flag exposes compacted sub-base; a broken corner remains.
        c.fillStyle=texture?c.createPattern(texture,'repeat'):'#827963';c.fillRect(sx+2,sy+2,flag-4,course-4);
        c.fillStyle='#5f513db5';c.fillRect(sx+2,sy+2,flag-4,course-4);
        c.fillStyle='#31362e99';c.fillRect(sx+2,sy+2,flag-4,2);c.fillRect(sx+2,sy+2,2,course-4);
        for(let n=0;n<320;n++){
          const px=sx+4+r()*(flag-8),py=sy+4+r()*(course-8),size=.45+r()*2;
          c.fillStyle=['#ac9e816b','#3e3c307a','#88847180','#c1b19264'][n%4];c.beginPath();c.moveTo(px,py);c.lineTo(px+size,py-.5);c.lineTo(px+size*.7,py+size*.6);c.lineTo(px-.4,py+size*.4);c.fill();
        }
        c.save();c.beginPath();c.moveTo(sx+3,sy+course-3);c.lineTo(sx+3,sy+course-36);c.lineTo(sx+21,sy+course-24);c.lineTo(sx+34,sy+course-3);c.closePath();c.clip();
        c.fillStyle=texture?c.createPattern(texture,'repeat'):'#9c9c8e';c.fillRect(sx,sy+course-40,40,40);c.restore();
        c.strokeStyle='#d6cfb566';c.lineWidth=.7;c.beginPath();c.moveTo(sx+3,sy+course-36);c.lineTo(sx+21,sy+course-24);c.lineTo(sx+34,sy+course-3);c.stroke();
      }
    }
  }
  c.restore();
}

// Flush planting pockets use the same stone as the pavement. All grain and
// joints are fixed in world space, including beds crossing cached tiles.
export function paintPlantingBed(c,stone,soil,x,y,width,height,seed,{grass=null,low=y,high=y+height}={}){
  if(high<=low)return;
  const edge=7,ix=x+edge,iy=y+edge,iw=width-edge*2,ih=height-edge*2;
  c.save();c.beginPath();c.rect(x-1,low,width+2,high-low);c.clip();
  c.beginPath();c.roundRect(x,y,width,height,3);c.fillStyle=stone?c.createPattern(stone,'repeat'):'#9b9c8c';c.fill();
  c.strokeStyle='#37443958';c.lineWidth=.7;c.stroke();
  const ring=new Path2D();ring.roundRect(x,y,width,height,3);ring.roundRect(ix,iy,iw,ih,1.5);
  c.save();c.clip(ring,'evenodd');
  c.fillStyle='#d7d1b71c';c.fillRect(x,y,width,height);
  for(let row=Math.floor(low/76);row<=Math.floor(high/76);row++){
    const sy=row*76,r=random(seed^Math.imul(row+347,9973));
    for(const xx of [x,x+width-edge]){
      c.fillStyle='#46503e6b';c.fillRect(xx,sy,edge,.8);
      c.fillStyle='#d9d4bd6b';c.fillRect(xx,sy+1.1,edge,.5);
      for(let n=0;n<6;n++){
        c.fillStyle=n%2?'#b7b89a66':'#47513b4d';
        c.fillRect(xx+r()*edge,sy+r()*76,.5+r()*1.2,.6+r()*1.5);
      }
    }
  }
  for(let xx=x+width/2;xx<x+width-edge;xx+=60){
    c.fillStyle='#44503e70';c.fillRect(xx,y,.8,edge);c.fillRect(xx,y+height-edge,.8,edge);
  }
  c.restore();
  c.save();c.beginPath();c.roundRect(ix,iy,iw,ih,1.5);c.clip();
  c.fillStyle=soil?c.createPattern(soil,'repeat'):'#514b37';c.fillRect(ix,iy,iw,ih);
  c.fillStyle='#29332054';c.fillRect(ix,iy,iw,ih);
  if(grass){c.fillStyle=c.createPattern(grass,'repeat');c.fillRect(ix+1,iy+1,iw-2,ih-2);}
  // Recessed earth, with a soft shadow under the stone instead of a black frame.
  const shadow=c.createLinearGradient(ix,0,ix+7,0);shadow.addColorStop(0,'#1d2c2370');shadow.addColorStop(1,'#1d2c2300');
  c.fillStyle=shadow;c.fillRect(ix,iy,7,ih);
  const topShadow=c.createLinearGradient(0,iy+ih,0,iy+ih-6);topShadow.addColorStop(0,'#1d2c235c');topShadow.addColorStop(1,'#1d2c2300');
  c.fillStyle=topShadow;c.fillRect(ix,iy+ih-6,iw,6);
  for(let row=Math.floor(low/64);row<=Math.floor(high/64);row++){
    const r=random(seed^Math.imul(row+749,7919));
    for(let n=0;n<Math.ceil(iw*.48);n++){
      const px=ix+r()*iw,py=row*64+r()*64,size=.5+r()*1.6;
      // Mulch and a little settled grit; turf only sheds material at its margin.
      if(grass&&px>ix+4&&px<ix+iw-4)continue;
      c.fillStyle=['#9b87664d','#383d2b80','#beb08b4d','#71644280'][n%4];
      c.beginPath();c.ellipse(px,py,size*1.6,size*.55,r()*3,0,Math.PI*2);c.fill();
      if(n%9===0){
        c.strokeStyle='#b2a27664';c.lineWidth=.55;c.beginPath();c.moveTo(px,py);c.lineTo(px+2+r()*3,py+1+r()*2);c.stroke();
      }
    }
  }
  c.restore();
  // A few tiny plants live in mortar joints, not a uniform green outline.
  for(let row=Math.floor(low/76);row<=Math.floor(high/76);row++){
    const r=random(seed^Math.imul(row+493,1777));if(r()>.34)continue;
    const px=r()<.5?ix:ix+iw,py=row*76;
    if(py<iy+3||py>iy+ih-3)continue;
    c.strokeStyle='#66764f9c';c.lineWidth=.65;
    for(let n=0;n<3;n++){c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(px+(n-1)*2,py+2,px+(n-1)*3,py+3+r()*3);c.stroke();}
  }
  c.restore();
}

export function paintCurb(c,texture,edge,low,high,side,kind,seed,driveways=[]){
  const x=side?edge:edge-11,course=120;
  c.save();c.beginPath();c.rect(x-2,low,15,high-low);c.clip();
  c.fillStyle=texture?c.createPattern(texture,'repeat'):'#92948a';c.fillRect(x,low,11,high-low);
  for(let row=Math.floor(low/course);row<=Math.floor(high/course);row++){
    const y=row*course,r=random(seed^Math.imul(row+351,1597)^Math.imul(side+31,9973));
    c.fillStyle='#c7c5b32b';c.fillRect(x,y,11,course);
    const face=c.createLinearGradient(x,0,x+11,0);
    face.addColorStop(0,side?'#cbd0b75b':'#38423c45');face.addColorStop(.65,'#c4c7ac21');face.addColorStop(1,side?'#35453d55':'#d9d8bf78');
    c.fillStyle=face;c.fillRect(x,y,11,course);
    c.fillStyle='#303b366b';c.fillRect(x,y,11,1.5);c.fillStyle='#d4cfb353';c.fillRect(x,y+1.7,11,.6);
    const roadEdge=side?x:x+11;
    // The shadow tapers at the actual entrance, rather than dropping an entire
    // 120-unit kerbstone whenever it happens to overlap a doorway.
    const shade=c.createLinearGradient(0,y,0,y+course);
    for(let n=0;n<=12;n++){
      const yy=y+n*course/12,raised=curbHeightAt(yy,driveways);
      shade.addColorStop(n/12,`rgba(23,42,36,${.1+raised*.28})`);
    }
    c.fillStyle=shade;c.fillRect(side?roadEdge-1.5:roadEdge,y,1.5,course);
    for(let n=0;n<6;n++){
      const yy=y+r()*course,xx=x+1+r()*8;
      c.fillStyle=n%2?'#40503b66':'#d8d3b94d';c.fillRect(xx,yy,.6+r()*1.5,.5+r()*2);
    }
    if(curbHeightAt(y,driveways)>.8&&row%3===0){
      c.strokeStyle=kind==='flooded'?'#71834c99':'#6a765464';c.lineWidth=.7;
      for(let n=0;n<4;n++){c.beginPath();c.moveTo(x+5,y+1);c.quadraticCurveTo(x+2+n,y+4,x+1+n*2,y+5+r()*5);c.stroke();}
    }
  }
  for(const drive of driveways){
    if(drive.high+36<low||drive.low-36>high)continue;
    const slope=c.createLinearGradient(0,drive.low-36,0,drive.high+36),length=drive.high-drive.low+72;
    slope.addColorStop(0,'#9e9f8f00');slope.addColorStop(36/length,'#9e9f8f77');slope.addColorStop(1-36/length,'#9e9f8f77');slope.addColorStop(1,'#9e9f8f00');
    c.fillStyle=slope;c.fillRect(x,drive.low-36,11,length);
    // Diagonal seams are the mitres on the two sloping end stones.
    c.strokeStyle='#39483c64';c.lineWidth=.6;
    for(const [yy,sign] of [[drive.low,-1],[drive.high,1]]){
      c.beginPath();c.moveTo(side?x+11:x,yy+sign*28);c.lineTo(side?x:x+11,yy);c.stroke();
    }
  }
  c.restore();
}

export function curbHeightAt(y,driveways){
  let height=1;
  for(const drive of driveways){
    const distance=Math.max(drive.low-y,y-drive.high,0),t=Math.min(1,distance/36);
    height=Math.min(height,t*t*(3-2*t));
  }
  return height;
}

// A catch basin cuts into the kerb on its pavement side. The narrow throat and
// silt fan connect it to the gutter; the grate no longer floats across the edge.
export function paintCurbDrain(c,texture,edge,y,side,seed){
  const direction=side?-1:1,x=edge+direction*8,r=random(seed);
  c.save();c.translate(x,y);
  const inner=-direction*8;
  // Two cut stones fit around the inlet and retain the sidewalk's material.
  for(const sign of [-1,1]){
    const left=direction>0?-24:-9;
    c.fillStyle=texture?c.createPattern(texture,'repeat'):'#96998c';c.fillRect(left,sign<0?-48:39,33,9);
    c.fillStyle='#333e3469';c.fillRect(left,sign<0?-48:47,33,.8);
    c.fillStyle='#d4cfb65c';c.fillRect(left,sign<0?-40:40,33,.6);
    c.strokeStyle='#4d574b70';c.lineWidth=.6;c.beginPath();c.moveTo(inner,sign*48);c.lineTo(inner-direction*11,sign*40);c.stroke();
  }
  // Water enters beneath the kerb lip, dark enough to read as a recess.
  c.fillStyle='#172622';c.fillRect(direction>0?-19:14,-33,5,66);
  c.fillStyle='#d0c9ae65';c.fillRect(direction>0?-19:18,-32,.7,64);
  c.save();c.beginPath();c.rect(-24,-40,48,80);c.clip();paintDrainGrate(c,34,72,seed);c.restore();
  // A restrained sediment fan follows the gutter, outside the iron slots.
  for(const sign of [-1,1])for(let n=0;n<70;n++){
    const distance=r()*63,yy=sign*(39+distance),spread=3+distance*.16;
    const xx=inner+direction*(2+r()*spread),size=.3+r();
    c.fillStyle=['#7d74574f','#b2a98a46','#283a304d'][n%3];c.fillRect(xx,yy,size,size*.65);
  }
  c.restore();
}

export function paintServiceCover(c,texture,x,y,seed){
  const r=random(seed),w=31,h=43;
  c.save();c.translate(x,y);
  c.fillStyle=texture?c.createPattern(texture,'repeat'):'#8b9084';c.fillRect(-w/2-3,-h/2-3,w+6,h+6);
  c.strokeStyle='#414d4177';c.lineWidth=.8;c.strokeRect(-w/2-3,-h/2-3,w+6,h+6);
  c.fillStyle='#25332f';c.beginPath();c.roundRect(-w/2,-h/2,w,h,1);c.fill();
  const metal=c.createLinearGradient(-w/2,-h/2,w/2,h/2);metal.addColorStop(0,'#737a6b');metal.addColorStop(.5,'#535f54');metal.addColorStop(1,'#3d4b43');
  c.fillStyle=metal;c.fillRect(-w/2+2,-h/2+2,w-4,h-4);
  c.strokeStyle='#26382f85';c.lineWidth=.65;
  for(let yy=-16;yy<=16;yy+=5)for(let xx=-10;xx<=10;xx+=5){c.beginPath();c.moveTo(xx-1.5,yy);c.lineTo(xx,yy-1.5);c.lineTo(xx+1.5,yy);c.lineTo(xx,yy+1.5);c.closePath();c.stroke();}
  c.fillStyle='#3b4c40';c.fillRect(-6,-5,12,10);c.fillStyle='#b0b29a99';c.font='bold 7px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('W',0,.5);
  for(const yy of [-17,17]){c.fillStyle='#182c25';c.fillRect(-3,yy,6,1.8);c.fillStyle='#bbc0aa50';c.fillRect(-3,yy+1.8,6,.5);}
  for(let n=0;n<60;n++){c.fillStyle=n%3?'#bcb69b27':'#172c253a';c.fillRect(-13+r()*26,-19+r()*38,.4+r()*.8,.5);}
  c.restore();
}
