// Road damage shares one contour between contact physics and baked terrain art.
// Rows are evenly spaced: testing a shoe cell takes two lookups, not a polygon scan.
export function groundEdge(p, localY) {
  const t=Math.max(0,Math.min(p.edge.length-1,(localY+p.ry)/p.rowHeight)),i=Math.min(p.edge.length-2,Math.floor(t));
  return p.edge[i]+(p.edge[i+1]-p.edge[i])*(t-i);
}
export function groundDepth(p,x,y){
  if(p.dirtRoad){
    const lx=x-p.x,ly=y-p.y;if(Math.abs(lx)>=p.rx)return 0;
    const low=dirtRoadEdge(p,lx,0),high=dirtRoadEdge(p,lx,1);
    return Math.max(0,p.depth*Math.min(1,(ly-low)/24,(high-ly)/24));
  }
  const ly=y-p.y;if(Math.abs(ly)>=p.ry)return 0;
  const lx=x-p.x,edge=groundEdge(p,ly),inside=(lx-edge)*p.bankSide;
  if(inside<=0||Math.abs(lx)>=p.rx)return 0;
  return p.depth*Math.min(1,inside/14,(p.ry-Math.abs(ly))/14);
}
// Transverse washed-out edges are sampled once. Art and shoe contact interpolate
// the same rows, including after the district is translated into the full street.
export function dirtRoadEdge(p,x,end){
  const edge=p.roadEdges[end],t=Math.max(0,Math.min(edge.length-1,(x+p.rx)/p.columnWidth)),i=Math.min(edge.length-2,Math.floor(t));
  return edge[i]+(edge[i+1]-edge[i])*(t-i);
}
export function dirtRoad(y,rand,washSide=1){
  const rx=342,ry=345,columns=46;
  return {type:'mud',x:450,y:y+10,rx,ry,depth:7,cos:1,sin:0,seed:rand()*80,groundField:true,dirtRoad:true,washSide,
    columnWidth:rx*2/columns,roadEdges:[-1,1].map(side=>Array.from({length:columns+1},(_,i)=>{
      const across=(i/columns*2-1)*washSide,source=Math.max(0,across),outlet=Math.max(0,-across);
      // Silt reaches farther along the source gutter, then fans toward the
      // opposite outlet. The centre retains room to approach the first stone;
      // the banks no longer arrive as one horizontal strip across the road.
      const spread=side<0?source*source*105+outlet*outlet*25:source*source*35+outlet*outlet*80;
      const old=side*(193+spread)-across*18+Math.sin(i*.47+side)*8+(rand()-.5)*13;
      // Little scoured bays break up the deposited edge without a sharp lip.
      const bay=Math.max(0,Math.sin(i*.23+side*1.8))**3*28+Math.max(0,Math.sin(i*.61-side))**6*9;
      return old-side*bay;
    }))};
}
export function groundBank({side,line,halfGap,type,seed,rand,id,excavated=false}){
  const entry=side<0?145:95,exit=side<0?95:150,low=line[0].y-entry,high=line.at(-1).y+exit,rows=Math.ceil((high-low)/18),ry=(high-low)/2;
  // Broken bays are staggered on opposite shoulders. They open small places
  // to gather a stretched stance, without straightening the winding route.
  // Derive them from the existing seed so later street details keep their RNG.
  const bays=excavated?[.22,.49,.77].map((t,i)=>({
    y:low+(high-low)*(t+side*.035+Math.sin(seed+i*2.3)*.025),
    span:42+(Math.sin(seed*.7+i*3.1)+1)*14,
    depth:24+(Math.cos(seed+i*1.9)+1)*13
  })):[];
  const edge=[];
  for(let i=0;i<=rows;i++){
    const y=low+i*(high-low)/rows;
    let n=line.findIndex(p=>p.y>y);if(n<0)n=line.length-1;
    const b=line[n],a=line[Math.max(0,n-1)],t=b.y===a.y?0:Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y)));
    const centre=a.x+(b.x-a.x)*t,fade=Math.max(0,1-Math.min((y-low)/entry,(high-y)/exit));
    // Chips recede into the damaged ground; they never steal the reserved lane.
    const chip=rand(),pocket=excavated?Math.max(0,...bays.map(b=>Math.max(0,1-Math.abs(y-b.y)/b.span)*b.depth)):
      Math.max(0,Math.sin((y-low)/(high-low)*Math.PI*4+side*1.4))**4*22;
    const clearance=a.clearance===undefined?halfGap:a.clearance+((b.clearance??a.clearance)-a.clearance)*t;
    const inner=(centre-450)+side*(clearance+chip*(excavated?17:10)+pocket);
    edge.push(inner+(side*440-inner)*fade*fade);
  }
  return {id,type,x:450,y:(low+high)/2,rx:440,ry,depth:type==='mud'?8:5,cos:1,sin:0,seed,
    groundField:true,bankSide:side,edge,rowHeight:(high-low)/rows};
}
export function groundPath(p){
  if(p.dirtRoad){
    const path=new Path2D();
    for(const end of [0,1])for(let j=0;j<p.roadEdges[end].length;j++){
      const i=end?p.roadEdges[end].length-1-j:j,x=-p.rx+i*p.columnWidth,y=-p.roadEdges[end][i];
      if(!end&&!j)path.moveTo(x,y);else path.lineTo(x,y);
    }
    path.closePath();return path;
  }
  const path=new Path2D(),outer=p.bankSide*p.rx;
  path.moveTo(outer,p.ry);
  for(let i=0;i<p.edge.length;i++)path.lineTo(p.edge[i],p.ry-i*p.rowHeight);
  path.lineTo(outer,-p.ry);path.closePath();return path;
}
function tread(c,x,y,length,width,mud,rand){
  c.save();c.translate(x,y);c.rotate((rand()-.5)*.13);
  // Old vehicle tracks have broken shoulders and individual tread blocks.
  // The enclosing ground clip keeps them off the surviving clean asphalt.
  const wash=c.createLinearGradient(-width/2,0,width/2,0);
  wash.addColorStop(0,'#292b2400');wash.addColorStop(.22,mud?'#302e2440':'#544d382c');wash.addColorStop(.78,mud?'#302e2440':'#544d382c');wash.addColorStop(1,'#292b2400');
  c.fillStyle=wash;c.fillRect(-width/2,0,width,length);
  for(let yy=0;yy<length;yy+=8){
    if(rand()<.17)continue;
    c.globalAlpha=.35+rand()*.5;
    for(const side of [-1,1]){
      c.beginPath();c.moveTo(side*2,yy);c.lineTo(side*(width*.4),yy+4);c.lineTo(side*(width*.4),yy+7);c.lineTo(side*2,yy+3);c.closePath();
      c.fillStyle=mud?'#302e2766':'#5c523e4d';c.fill();
      c.strokeStyle=mud?'#c1ab7e4d':'#ded0a947';c.lineWidth=.65;c.beginPath();c.moveTo(side*3,yy-.5);c.lineTo(side*(width*.4),yy+3.5);c.stroke();
    }
  }
  c.restore();
}
function groundHistory(c,p,rand){
  const mud=p.type==='mud',works=p.groundStyle==='subbase',parking=p.parkingShoulder;
  if(mud||works||parking){
    const anchor=groundEdge(p,0)+p.bankSide*(works?105:parking?52:80);
    for(const lane of parking?[0]:[0,1])tread(c,anchor+p.bankSide*lane*(works?115:125),-p.ry*.78,p.ry*1.55,works?44:parking?29:31,mud,rand);
  }
  if(mud){
    // Fine sediment is combed into branching rivulets by runoff. Tiny grains
    // settle at their ends instead of being distributed like confetti.
    for(let n=0;n<16;n++){
      const y=(rand()-.5)*p.ry*1.6,x=groundEdge(p,-y)+p.bankSide*(24+rand()*150),length=25+rand()*75;
      c.strokeStyle='#393d2d55';c.lineWidth=.7+rand();c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+p.bankSide*12,y+length*.3,x-p.bankSide*7,y+length*.7,x+5,y+length);c.stroke();
      c.strokeStyle='#c0ad802e';c.lineWidth=.6;c.beginPath();c.moveTo(x+2,y);c.quadraticCurveTo(x+p.bankSide*9,y+length*.6,x+7,y+length);c.stroke();
      for(let i=0;i<9;i++){c.fillStyle=i%3?'#3d413257':'#a99a716b';c.fillRect(x+5+(rand()-.5)*15,y+length+rand()*9,.5+rand()*1.2,.6+rand());}
    }
  }
  if(works){
    // A few chipped pieces of old terracotta drain pipe in the excavated bed.
    for(let n=0;n<12;n++){
      const y=(rand()-.5)*p.ry*1.7,x=groundEdge(p,-y)+p.bankSide*(22+rand()*160),r=2+rand()*5;
      c.save();c.translate(x,y);c.rotate(rand()*6.28);
      c.fillStyle='#292e2555';c.beginPath();c.moveTo(-r+1,1);c.lineTo(r+1,-r*.6+1);c.lineTo(r*.5+1,r+1);c.closePath();c.fill();
      c.fillStyle=['#936748','#a07954','#79624d'][n%3];c.beginPath();c.moveTo(-r,0);c.lineTo(r,-r*.6);c.lineTo(r*.5,r);c.closePath();c.fill();
      c.strokeStyle='#cfaa7b99';c.lineWidth=.7;c.beginPath();c.moveTo(-r,0);c.lineTo(r,-r*.6);c.stroke();c.restore();
    }
  }
}
export function paintGroundBank(c,p,sy,patterns,rand){
  if(p.dirtRoad){paintDirtRoad(c,p,sy,patterns,rand);return;}
  const path=groundPath(p),mud=p.type==='mud',excavated=p.groundStyle==='subbase';
  c.save();c.translate(p.x,sy);c.save();c.clip(path);
  c.fillStyle=mud?'#655543':'#8b8270';c.fillRect(-p.rx,-p.ry,p.rx*2,p.ry*2);
  // World-anchored texture prevents seams where a damaged stretch crosses chunks.
  c.save();c.translate(-p.x,p.y);c.fillStyle=patterns[mud?'mud':'rubble'];c.fillRect(p.x-p.rx,-p.y-p.ry,p.rx*2,p.ry*2);
  if(excavated){c.globalAlpha=.5;c.fillStyle=patterns.subbase;c.fillRect(p.x-p.rx,-p.y-p.ry,p.rx*2,p.ry*2);}c.restore();
  const shade=c.createLinearGradient(-p.rx,0,p.rx,0);shade.addColorStop(0,'#19201b35');shade.addColorStop(.5,mud?'#73644708':'#ddd0a420');shade.addColorStop(1,'#1c231c38');c.fillStyle=shade;c.fillRect(-p.rx,-p.ry,p.rx*2,p.ry*2);
  if(excavated){
    // Broad, overlapping compaction stains break up the uniform aggregate.
    // They stay within the shared contact boundary and are baked only once.
    for(let i=0;i<9;i++){
      const y=-p.ry+rand()*p.ry*2,x=groundEdge(p,-y)+p.bankSide*(35+rand()*190),r=45+rand()*75;
      c.save();c.translate(x,y);c.scale(.75,1.5);
      const compact=c.createRadialGradient(0,0,0,0,0,r);compact.addColorStop(0,i%3?'#282c2360':'#b7a57e38');compact.addColorStop(1,'#766d5100');
      c.fillStyle=compact;c.fillRect(-r,-r,r*2,r*2);c.restore();
    }
  }
  if(!mud){
    // Fragments of the old wearing course lie in the exposed aggregate. Each is
    // smaller than a shoe, dust-coated, and part of the gravel contact surface.
    for(let i=0;i<72;i++){
      const x=(rand()-.5)*p.rx*2,y=(rand()-.5)*p.ry*2,r=2+rand()**2*(excavated?13:21),shape=new Path2D();
      for(let n=0;n<6;n++){const a=n/6*Math.PI*2,rr=r*(.6+rand()*.4),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.65;if(n)shape.lineTo(px,py);else shape.moveTo(px,py);}shape.closePath();
      c.save();c.translate(1,1.4);c.fillStyle='#29302c55';c.fill(shape);c.restore();
      c.fillStyle=patterns.asphalt;c.fill(shape);c.fillStyle=excavated?'#a4967440':'#87847122';c.fill(shape);
      c.strokeStyle='#a9a48b70';c.lineWidth=.55;c.stroke(shape);
    }
  }
  // Scoured grooves and discontinuous tyre ruts follow the road, not a tiled decal.
  for(let i=0;i<9;i++){
    const x=(rand()-.5)*p.rx*2,y=(rand()-.5)*p.ry*1.8,len=35+rand()*150;
    c.strokeStyle=mud?'#332f2750':'#4a473b28';c.lineWidth=mud?3+rand()*8:2+rand()*4;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+6,y-len*.35,x-4,y-len*.7,x+2,y-len);c.stroke();
    if(mud){c.strokeStyle='#b1a58a35';c.lineWidth=.8;c.beginPath();c.moveTo(x+5,y);c.lineTo(x+7,y-len);c.stroke();}
  }
  groundHistory(c,p,rand);
  c.restore();
  // A fractured asphalt lip: dark undercut, exposed aggregate, small radial cracks.
  for(let i=1;i<p.edge.length-1;i++){
    const x=p.edge[i],y=p.ry-i*p.rowHeight,prevX=p.edge[i-1],prevY=y+p.rowHeight;
    c.strokeStyle=mud?'#453e3090':excavated?'#222a2980':'#222a29c0';c.lineWidth=mud?1.2:excavated?1.3:2.1;c.beginPath();c.moveTo(prevX,prevY);c.lineTo(x,y);c.stroke();
    // Exposed aggregate catches light in short chips, not one bright ribbon.
    if(!excavated||i%4===1){
      c.strokeStyle=mud?'#ad9a7355':excavated?'#ada68e80':'#c3b99a9c';c.lineWidth=.8;c.beginPath();c.moveTo(prevX+p.bankSide*2,prevY);c.lineTo(x+p.bankSide*2,y);c.stroke();
    }
    if(!mud&&(excavated?rand()<.19:i%2===0)){
      const length=8+rand()*23,dx=-p.bankSide*length;
      c.strokeStyle='#20282999';c.lineWidth=.65;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx*.4,y-4);c.lineTo(x+dx,y-2-rand()*12);c.moveTo(x+dx*.4,y-4);c.lineTo(x+dx*.7,y+6);c.stroke();
    }
    // Loose chips stay on the broken side of the exact contact boundary.
    for(let n=0;n<3;n++){
      const px=x+p.bankSide*(6+rand()*18),py=y+rand()*10,s=mud?.6+rand()*1.5:1+rand()*3;
      c.fillStyle=mud?'#51473488':['#4c514a','#b6ac94','#65675c'][n];c.beginPath();c.moveTo(px-s,py);c.lineTo(px,py-s*.7);c.lineTo(px+s,py+s*.3);c.lineTo(px-s*.3,py+s);c.closePath();c.fill();
    }
  }
  c.restore();
}

function paintSiltBed(c,p,patterns){
  // Both the street fan and its pavement mouth use the same world grain and
  // dampness, so the deposit continues across the curb without a texture seam.
  c.fillStyle='#6e604b';c.fillRect(-460,-p.ry,920,p.ry*2);
  c.save();c.translate(-p.x,p.y);c.fillStyle=patterns.mud;c.fillRect(p.x-460,-p.y-p.ry,920,p.ry*2);c.restore();
  const damp=c.createLinearGradient(0,-p.ry,0,p.ry);damp.addColorStop(0,'#74654c28');damp.addColorStop(.45,'#292c2370');damp.addColorStop(1,'#99826830');
  c.fillStyle=damp;c.fillRect(-460,-p.ry,920,p.ry*2);
}
export function paintWashoutMouth(c,p,sy,patterns,rand){
  const side=p.washSide,inner=side*(p.rx-.25),outer=side*460,low=dirtRoadEdge(p,side*p.rx,0),high=dirtRoadEdge(p,side*p.rx,1),path=new Path2D(),banks=[];
  c.save();c.translate(p.x,sy);
  // The unsealed entrance narrows toward the property. Rain fans the silt
  // across the lowered curb; the mouth meets the actual muddy road contour.
  for(const [near,far] of [[low,-105],[high,110]]){
    const bank=[];
    for(let i=0;i<=12;i++){
      const t=i/12,x=inner+(outer-inner)*t,y=-(near+(far-near)*Math.pow(t,.8))+(i&&i<12?(rand()-.5)*3:0);
      bank.push([x,y]);
    }
    banks.push(bank);
  }
  for(const [i,bank] of banks.entries())for(const [n,point] of (i?[...bank].reverse():bank).entries()){
    if(!i&&!n)path.moveTo(...point);else path.lineTo(...point);
  }
  path.closePath();c.save();c.clip(path);paintSiltBed(c,p,patterns);
  // Narrow drainage grooves spread out from the entrance. Keep them shallow;
  // there is no new obstacle and no decorative gravel in the playable lane.
  for(let n=0;n<7;n++){
    const y=-65+n*21;c.strokeStyle='#30382a36';c.lineWidth=.7+rand();c.beginPath();c.moveTo(outer,y);
    c.bezierCurveTo(outer-side*32,y-3,inner+side*23,y*1.6,inner,y*1.9);c.stroke();
  }
  for(let n=0;n<190;n++){
    const x=inner+(outer-inner)*rand(),y=low+rand()*(high-low),size=.35+rand()*1.4;
    c.fillStyle=['#57513b70','#b3a17c55','#333e3170'][n%3];c.fillRect(x,-y,size*1.5,size*.7);
  }
  // Thin sediment lets the old paving show through at the sides. Leave the
  // curb-facing join unfeathered: it is one continuous deposit, not two decals.
  for(const bank of banks){
    c.beginPath();bank.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));
    c.strokeStyle=patterns.paving;c.globalAlpha=.23;c.lineWidth=18;c.stroke();c.globalAlpha=.22;c.lineWidth=6;c.stroke();
  }
  c.restore();
  for(const bank of banks){
    c.strokeStyle='#6b60432b';c.lineWidth=.6;c.beginPath();bank.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.stroke();
  }
  c.restore();
}
function paintDirtRoad(c,p,sy,patterns,rand){
  const path=groundPath(p);c.save();c.translate(p.x,sy);c.save();c.clip(path);
  paintSiltBed(c,p,patterns);
  // Compacted ruts are darker than the loose shoulders. The broken tyre tread
  // sits inside a shallow depression, rather than looking printed on top.
  for(const x of [-174,106]){
    const rut=c.createLinearGradient(x-36,0,x+36,0);rut.addColorStop(0,'#332d2500');rut.addColorStop(.22,'#2f2a2440');rut.addColorStop(.6,'#39372f4f');rut.addColorStop(.84,'#b5a17e26');rut.addColorStop(1,'#332d2500');
    c.fillStyle=rut;c.fillRect(x-36,-p.ry,72,p.ry*2);tread(c,x,-p.ry,p.ry*2,43,true,rand);
  }
  for(let n=0;n<13;n++){
    const x=p.washSide*(p.rx+15),y=-90+n*17+(rand()-.5)*13,reach=130+rand()*340;
    // Fine sediment follows the same diagonal wash as the banks. Broken
    // mineral lines settle alongside a shallow channel, not evenly scattered
    // scratches. All marks stay within the actual muddy ground clip.
    c.lineWidth=.6+rand();c.strokeStyle='#34392b3d';c.beginPath();c.moveTo(x,y);
    c.bezierCurveTo(x-p.washSide*reach*.3,y+14,x-p.washSide*reach*.6,y-38,x-p.washSide*reach,y-60);c.stroke();
    c.strokeStyle='#b8a27b30';c.lineWidth=.6;c.beginPath();c.moveTo(x-p.washSide*reach*.32,y+3);
    c.quadraticCurveTo(x-p.washSide*reach*.63,y-30,x-p.washSide*reach*.9,y-48);c.stroke();
  }
  for(let n=0;n<1000;n++){
    const x=(rand()-.5)*p.rx*2,y=(rand()-.5)*p.ry*2,r=.3+rand()**3*2.2;
    c.fillStyle=['#3b3c2d80','#a8997966','#70695199','#282f2770'][n%4];c.beginPath();c.ellipse(x,y,r*1.3,r*.65,rand()*3,0,Math.PI*2);c.fill();
  }
  // The last few millimetres of silt thin over the old surface. Keep the blend
  // inside the physical muddy edge, so visible clean asphalt is still clean.
  const banks=new Path2D();
  for(const end of [0,1])for(let i=0;i<p.roadEdges[end].length;i++){
    const x=-p.rx+i*p.columnWidth,y=-p.roadEdges[end][i];if(i)banks.lineTo(x,y);else banks.moveTo(x,y);
  }
  c.strokeStyle=patterns.asphalt;c.globalAlpha=.23;c.lineWidth=40;c.stroke(banks);
  c.globalAlpha=.25;c.lineWidth=17;c.stroke(banks);c.globalAlpha=.2;c.lineWidth=5;c.stroke(banks);c.globalAlpha=1;
  c.restore();
  for(const end of [0,1])for(let i=1;i<p.roadEdges[end].length;i++){
    const x=-p.rx+i*p.columnWidth,y=-p.roadEdges[end][i],px=x-p.columnWidth,py=-p.roadEdges[end][i-1];
    // Deposited silt lies flush with the road. Keep an intermittent sediment
    // line and occasional existing cracks, rather than an excavated kerb.
    c.strokeStyle='#6b604338';c.lineWidth=.7;c.beginPath();c.moveTo(px,py);c.lineTo(x,y);c.stroke();
    if(i%9===0){
      const direction=end?-1:1,len=5+rand()*13;
      c.strokeStyle='#1e282875';c.lineWidth=.55;c.beginPath();c.moveTo(x,y);c.lineTo(x+3,y+direction*len*.45);c.lineTo(x-1,y+direction*len);c.moveTo(x+3,y+direction*len*.45);c.lineTo(x+9,y+direction*len*.7);c.stroke();
    }
    for(let j=0;j<(i%3===0?2:0);j++){
      const xx=x-rand()*p.columnWidth,yy=y+(end?1:-1)*(3+rand()*15),r=.4+rand()*1.6;
      c.fillStyle=['#424b41','#9b927a','#626b59'][j];c.beginPath();c.moveTo(xx-r,yy);c.lineTo(xx,yy-r*.7);c.lineTo(xx+r,yy+r*.4);c.lineTo(xx-r*.3,yy+r);c.closePath();c.fill();
    }
  }
  c.restore();
}

// Low, broad river stones. Their irregular top is also the contact footprint;
// the dark side is only a few pixels deep, so the shoe stays grounded on landing.
export function paintSteppingStone(c,p,path,patterns,rand){
  c.save();c.translate(1.1,2);c.fillStyle='#252b247d';c.fill(path);c.strokeStyle='#252b243b';c.lineWidth=3;c.stroke(path);c.restore();
  const palette=[['#aaa79a','#d5d1be','#515954'],['#989e98','#c7cdc3','#424f4e'],['#aca18d','#d9ccb3','#5d584a']][(Math.floor(p.seed)+(p.stoneOrder||0))%3];
  c.fillStyle=palette[0];c.fill(path);c.save();c.clip(path);
  // Each rock carries its own mineral grain; it no longer shares the asphalt's
  // world-aligned pattern. All of this is baked into the static terrain chunk.
  c.save();c.rotate(p.seed);c.fillStyle=patterns.rubble;c.globalAlpha=.28;c.fillRect(-140,-140,280,280);c.restore();
  const face=c.createLinearGradient(-p.rx,-p.ry,p.rx,p.ry);face.addColorStop(0,palette[1]+'68');face.addColorStop(.42,palette[0]+'08');face.addColorStop(1,palette[2]+'a0');c.fillStyle=face;c.fill(path);
  for(let i=0;i<10;i++){
    const x=(rand()-.5)*p.rx*1.6,y=(rand()-.5)*p.ry*1.6,r=8+rand()*p.rx*.6;
    const mineral=c.createRadialGradient(x,y,0,x,y,r);mineral.addColorStop(0,(i%3?palette[2]:palette[1])+'2e');mineral.addColorStop(1,palette[0]+'00');c.fillStyle=mineral;c.fillRect(x-r,y-r,r*2,r*2);
  }
  for(let i=0;i<320;i++){
    const x=(rand()-.5)*p.rx*2.3,y=(rand()-.5)*p.ry*2.3,r=.18+rand()**3*1.3;
    c.fillStyle=i%3?palette[2]+'66':palette[1]+'99';c.beginPath();c.ellipse(x,y,r*1.3,r*.6,rand()*3,0,Math.PI*2);c.fill();
    if(i%9===0){c.fillStyle='#e4dec147';c.fillRect(x-r*.6,y-r*.7,r,.35);}
  }
  // A worn seam follows the mineral, with tiny breaks and a faint lower face.
  const seamY=(rand()-.5)*p.ry*.8,seamSlope=(rand()-.5)*.7;
  for(let i=0;i<18;i++){
    if(rand()<.22)continue;const x=-p.rx+i*p.rx/9,y=seamY+x*seamSlope+Math.sin(i*.6+p.seed)*3;
    c.strokeStyle=i%4?palette[1]+'55':palette[2]+'4d';c.lineWidth=.5+rand()*.65;c.beginPath();c.moveTo(x,y);c.lineTo(x+p.rx/9,y+p.rx/9*seamSlope+(rand()-.5)*2);c.stroke();
  }
  c.strokeStyle='#3b3a2f4d';c.lineWidth=5;c.stroke(path);
  c.strokeStyle=palette[2]+'66';c.lineWidth=1.1;c.stroke(path);c.restore();
  c.save();c.translate(-.45,-.65);c.strokeStyle=palette[1]+'33';c.lineWidth=.45;c.stroke(path);c.restore();
}

// A piecewise fractured outline remains inside the original wet footprint. The
// gritty lip and its water share these cuts, including in contact sampling.
export function fractureRadius(p,angle){
  if(!p.edgeCuts)return 1;
  const n=p.edgeCuts.length,t=((angle/(Math.PI*2)%1+1)%1)*n,i=Math.floor(t);
  return p.edgeCuts[i]+(p.edgeCuts[(i+1)%n]-p.edgeCuts[i])*(t-i);
}
// Rounded saw cuts remain inside the same conservative radius used to reject
// distant contacts. Physics and art use this exact chipped, nearly square edge.
export function utilityCutRadius(p,a){
  return .84/(Math.abs(Math.cos(a))**8+Math.abs(Math.sin(a))**8)**.125*fractureRadius(p,a);
}
export function breakPool(p,rand){
  const cuts=Array.from({length:18},()=>.87+rand()*.13),rim={...p,edgeCuts:cuts,type:'gravel',dirt:.32,depth:3.2,craterRim:true,underlay:true};
  p.edgeCuts=cuts;p.rx*=.87;p.ry*=.89;p.fracturedPool=true;
  return rim;
}
export function paintCrater(c,p,sy,path,patterns,rand){
  if(p.workBed){paintUtilityCut(c,p,sy,path,patterns,rand);return;}
  c.save();c.translate(p.x,sy);c.rotate(-Math.atan2(p.sin,p.cos));c.save();c.clip(path);
  c.fillStyle=patterns.rubble;c.fillRect(-p.rx*1.2,-p.ry*1.2,p.rx*2.4,p.ry*2.4);
  const hollow=c.createRadialGradient(-p.rx*.12,-p.ry*.1,2,0,0,Math.max(p.rx,p.ry)*1.14);
  hollow.addColorStop(0,'#19251d70');hollow.addColorStop(.65,'#252b2440');hollow.addColorStop(1,'#201f1b10');c.fillStyle=hollow;c.fill(path);
  // The wearing course has thickness: an undercut lip, a broken aggregate
  // cross-section, then the lower bed. Everything stays inside the real rim.
  c.strokeStyle='#131c1b72';c.lineWidth=3;c.stroke(path);
  // The upper asphalt breaks in little shelves. Lighting and exposed depth
  // vary around the basin instead of outlining it with one uniform dark ring.
  for(let n=0;n<38;n++){
    const a=n/38*Math.PI*2,span=.07+rand()*.09,depth=1.2+rand()*3.7;
    c.beginPath();
    for(let j=0;j<=4;j++){
      const angle=a+j/4*span,cut=craterRadius(p,angle),x=Math.cos(angle)*p.rx*cut,y=-Math.sin(angle)*p.ry*cut;
      if(j)c.lineTo(x,y);else c.moveTo(x,y);
    }
    c.strokeStyle=Math.sin(a)>.1?'#19231eb0':'#b0aa8b75';c.lineWidth=depth;c.stroke();
    if(n%3===0){
      const cut=craterRadius(p,a),x=Math.cos(a)*(p.rx*cut-depth),y=-Math.sin(a)*(p.ry*cut-depth);
      c.fillStyle=['#4b5148','#9d9a85','#717467'][(n/3)%3];c.beginPath();c.moveTo(x-2,y);c.lineTo(x+1,y-2);c.lineTo(x+4,y+1);c.lineTo(x,y+3);c.closePath();c.fill();
    }
  }
  // Loose aggregate interrupts the lip in clusters, never a necklace of slabs.
  for(let n=0;n<180;n++){
    const a=rand()*Math.PI*2,cut=craterRadius(p,a),inset=rand()*6,size=.35+rand()**2*2.2;
    const x=Math.cos(a)*(p.rx*cut-inset),y=-Math.sin(a)*(p.ry*cut-inset);
    c.fillStyle=['#77796e','#414c48','#a5a08d','#535c55'][n%4];
    c.beginPath();c.moveTo(x-size,y);c.lineTo(x-size*.3,y-size*.8);c.lineTo(x+size,y-.2);c.lineTo(x+size*.2,y+size*.6);c.closePath();c.fill();
  }
  for(let i=0;i<90;i++){
    const x=(rand()-.5)*p.rx*2.3,y=(rand()-.5)*p.ry*2.3,r=.6+rand()**2*4;
    c.fillStyle=i%4?'#3e494199':'#c1b7a08c';c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r*.2,y-r*.8);c.lineTo(x+r,y-r*.2);c.lineTo(x+r*.4,y+r*.7);c.closePath();c.fill();
  }
  // Rain leaves distinct, incomplete mineral tidemarks as the basin recedes.
  // The water is painted later, covering the submerged portion naturally.
  for(let band=0;band<3;band++){
    const start=.15+rand()*2.4,span=.8+rand()*1.8,scale=.74+band*.07;
    c.strokeStyle=['#c1b3973b','#c1b3974d','#4a473b66'][band];c.lineWidth=1.1+band*.3;c.beginPath();
    for(let i=0;i<=36;i++){
      const a=start+i/36*span,r=craterRadius(p,a)*scale,x=Math.cos(a)*p.rx*r,y=-Math.sin(a)*p.ry*r;
      if(i)c.lineTo(x,y);else c.moveTo(x,y);
    }c.stroke();
  }
  for(let n=0;n<28;n++){
    const a=rand()*Math.PI*2,r=craterRadius(p,a)*(.84+rand()*.13),x=Math.cos(a)*p.rx*r,y=-Math.sin(a)*p.ry*r,size=.7+rand()*2.3;
    c.fillStyle='#17261f80';c.beginPath();c.ellipse(x+.5,y+.8,size*1.4,size*.75,0,0,Math.PI*2);c.fill();
    c.fillStyle=['#a69e84','#686f5b','#89866d'][n%3];c.beginPath();c.ellipse(x,y,size,size*.65,a,0,Math.PI*2);c.fill();
    if(n%4===0){c.strokeStyle='#c9bea074';c.lineWidth=.5;c.beginPath();c.moveTo(x-size*.7,y-.3);c.lineTo(x,y-size*.5);c.stroke();}
  }
  c.restore();
  // Layered, irregular tarmac edges give depth without a broad cartoon outline.
  c.strokeStyle='#18221e38';c.lineWidth=.65;c.stroke(path);
  for(let i=0;i<12;i++){
    const a=rand()*Math.PI*2,cut=fractureRadius(p,a),r=1+.085*Math.sin(a*3+p.seed)+.045*Math.sin(a*7-p.seed*.7)+.025*Math.cos(a*11+p.seed);
    const x=Math.cos(a)*p.rx*r*cut,y=-Math.sin(a)*p.ry*r*cut,len=6+rand()*21;
    c.strokeStyle='#202c2790';c.lineWidth=.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*len*.5,y-Math.sin(a)*len*.6);c.lineTo(x+Math.cos(a+.25)*len,y-Math.sin(a+.25)*len);c.stroke();
  }
  c.restore();
}
function craterRadius(p,a){
  return (1+.085*Math.sin(a*3+p.seed)+.045*Math.sin(a*7-p.seed*.7)+.025*Math.cos(a*11+p.seed))*fractureRadius(p,a);
}


// Washed aggregate is deepest beside the excavation and thins toward the gap.
// Contact physics and the baked dust/pebble density share this same profile.
export function spillWeight(p,nx){
  return .32+.68*Math.max(0,Math.min(1,(1+nx*p.spillSide)/2));
}
export function paintAggregateSpill(c,p,path,rand){
  c.save();c.clip(path);c.save();c.scale(1,p.ry/p.rx);
  const dust=c.createRadialGradient(p.spillSide*p.rx*.48,0,2,p.spillSide*p.rx*.2,0,p.rx*1.1);
  dust.addColorStop(0,'#9b8f766b');dust.addColorStop(.5,'#8c826941');dust.addColorStop(1,'#746d5700');
  c.fillStyle=dust;c.fillRect(-p.rx*1.2,-p.rx*1.2,p.rx*2.4,p.rx*2.4);c.restore();
  // Short, shallow wash lines connect the deposited grit to the repair bed.
  for(let n=0;n<7;n++){
    const y=(n-3)*p.ry*.19,reach=p.rx*(.8+rand()*.65);
    c.strokeStyle='#a2937730';c.lineWidth=.6+rand()*.6;c.beginPath();c.moveTo(p.spillSide*p.rx*.85,y*.45);
    c.quadraticCurveTo(p.spillSide*p.rx*.1,y,p.spillSide*(p.rx*.85-reach),y*1.35);c.stroke();
  }
  for(let n=0;n<850;n++){
    const x=(rand()-.5)*p.rx*2.3,y=(rand()-.5)*p.ry*2.3,r=Math.hypot(x/p.rx,y/p.ry),weight=spillWeight(p,x/p.rx);
    if(rand()>Math.max(0,1.12-r)*1.6*weight)continue;
    const size=.3+rand()**2*(.8+weight*1.9),h=size*(.5+rand()*.4);
    c.fillStyle='#26312a45';c.fillRect(x+.35,y+.5,size*1.6,h*1.3);
    c.fillStyle=['#938775','#676c60','#b0a38c','#465248','#817c68'][n%5];
    c.beginPath();c.moveTo(x-size,y);c.lineTo(x-size*.15,y-h);c.lineTo(x+size,y+h*.2);c.lineTo(x+size*.25,y+h);c.closePath();c.fill();
  }
  c.restore();
}

function paintUtilityCut(c,p,sy,path,patterns,rand){
  c.save();c.translate(p.x,sy);c.save();c.clip(path);
  c.fillStyle=patterns.rubble;c.fillRect(-p.rx,-p.ry,p.rx*2,p.ry*2);
  c.globalAlpha=.32;c.fillStyle=patterns.subbase;c.fillRect(-p.rx,-p.ry,p.rx*2,p.ry*2);c.globalAlpha=1;
  const fall=c.createLinearGradient(0,-p.ry,0,p.ry);
  fall.addColorStop(0,'#a1967b18');fall.addColorStop(.55,'#41483c2c');fall.addColorStop(1,'#1d2c2770');
  c.fillStyle=fall;c.fillRect(-p.rx,-p.ry,p.rx*2,p.ry*2);
  // Compacting leaves short overlapping passes in the fill. The wet end is
  // drawn afterwards, so the gravel and standing water share one depression.
  for(let y=-p.ry*.7;y<p.ry*.65;y+=18){
    c.strokeStyle='#393e3225';c.lineWidth=2.5;c.beginPath();c.moveTo(-p.rx*.64,y);c.lineTo(p.rx*(.48+rand()*.18),y+2);c.stroke();
    c.strokeStyle='#c5b18d26';c.lineWidth=.7;c.beginPath();c.moveTo(-p.rx*.58,y-2);c.lineTo(p.rx*.58,y);c.stroke();
  }
  for(let i=0;i<105;i++){
    const x=(rand()-.5)*p.rx*1.8,y=(rand()-.5)*p.ry*1.8,r=.5+rand()**2*2.8;
    c.fillStyle=['#b3a487','#6f705e','#414c43','#918b73'][i%4];
    c.beginPath();c.moveTo(x-r,y);c.lineTo(x,y-r*.6);c.lineTo(x+r,y+.3);c.lineTo(x+r*.2,y+r*.7);c.closePath();c.fill();
  }
  // A few remnants of the old wearing course remain along the cut, instead
  // of making every repair a uniform pale slab. All fragments stay in the bed.
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2+.16,edge=utilityCutRadius(p,a)*.86,x=Math.cos(a)*p.rx*edge,y=-Math.sin(a)*p.ry*edge,r=2+rand()*5,chip=new Path2D();
    for(let n=0;n<5;n++){const t=n/5*Math.PI*2,size=r*(.6+rand()*.4),px=x+Math.cos(t)*size,py=y+Math.sin(t)*size*.65;if(n)chip.lineTo(px,py);else chip.moveTo(px,py);}chip.closePath();
    c.fillStyle=patterns.asphalt;c.fill(chip);c.strokeStyle='#9b9c8770';c.lineWidth=.45;c.stroke(chip);
  }
  // Expose the dark wearing course and a fine pale aggregate edge. Keep the
  // depth inside the excavation; there is no raised outline to trip over.
  c.strokeStyle='#18241db3';c.lineWidth=3.2;c.stroke(path);
  c.strokeStyle='#b9b49c80';c.lineWidth=.7;c.stroke(path);
  for(let i=0;i<42;i++){
    const a=i/42*Math.PI*2,r=utilityCutRadius(p,a),x=Math.cos(a)*p.rx*r,y=-Math.sin(a)*p.ry*r;
    c.fillStyle=i%3?'#434b40':'#ada68d';c.fillRect(x-1,y-1,1+rand()*3,1+rand()*2);
  }
  c.restore();
  // Only a few small cracks grow from a repair corner. They stop well before
  // the walking opening instead of covering the whole road with a crack mesh.
  for(const a of [.8,3.9]){
    const r=utilityCutRadius(p,a),x=Math.cos(a)*p.rx*r,y=-Math.sin(a)*p.ry*r,dx=Math.sign(x),dy=Math.sign(y);
    c.strokeStyle='#1e2b2670';c.lineWidth=.65;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx*6,y+dy*5);c.lineTo(x+dx*9,y+dy*14);c.stroke();
  }
  c.restore();
}
