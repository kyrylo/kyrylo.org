/* A little life — a moving pencil study on continuous paper.
   Scenery is cached at 2× resolution. Figure contours are derived from one
   shared pose, so clothing and visible joints use the same construction. */
(() => {
  'use strict';
  const Geo = globalThis.LittleLifeGeometry || (typeof require === 'function' ? require('./geometry.js') : null);
  const TAU = Math.PI * 2;
  const PAPER = '#f5f2eb';
  const INK = '#454841';
  const palette = {
    grandma: '#82768b', grandpa: '#708278', mom: '#a47767', dad: '#738291',
    me: '#a68b50', friend: '#858c6b', love: '#9a7d83', child: '#6d8c83', little: '#aa925c'
  };
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const lerp = (a,b,t) => a+(b-a)*t;
  const smooth = x => { x=clamp(x);return x*x*(3-2*x); };
  const ramp = (t,a,b) => smooth((t-a)/(b-a));
  const rand = n => { const s=Math.sin(n*127.1+311.7)*43758.5453123;return s-Math.floor(s); };
  const rgb = h => [1,3,5].map(n=>parseInt(h.slice(n,n+2),16));
  function blend(a,b,t) {a=rgb(a);b=rgb(b);return `rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],t))).join(',')})`;}
  const chapters = [
    [0,'At first, the world is whoever holds your hand.'],
    [7,'Then a friend asks you to go a little further.'],
    [14,'One day, someone you love doesn’t come back.'],
    [20,'A friend takes a different road.'],
    [24,'You carry their love with you.'],
    [28,'Then someone stays, and you learn each other’s pace.'],
    [35,'One day, a little hand reaches for yours.'],
    [44,'You miss the people who showed you how.'],
    [51,'Then you hear their voices in the things you say.'],
    [58,'You tell their stories as the days grow quieter.'],
    [64,'Your little one slows down to stay beside you.'],
    [71,'And holds a little hand the way you held theirs.']
  ];
  const people = [
    {id:'grandma',name:'grandma',start:-4,end:14,star:[0,.31],seed:2,kind:'grandma'},
    {id:'grandpa',name:'grandpa',start:-4,end:23,star:[.25,0],seed:4,kind:'grandpa'},
    {id:'mom',name:'mum',start:-4,end:43,star:[.50,.25],seed:6,kind:'dress'},
    {id:'dad',name:'dad',start:-4,end:50,star:[.75,0],seed:8,kind:'dad'},
    {id:'friend',name:'a friend',start:6,end:20,seed:10,kind:'friend'},
    {id:'love',name:'your person',start:28,end:60,star:[1,.31],seed:12,kind:'love'},
    {id:'child',name:'your little one',start:35,end:100,seed:14,kind:'child'},
    {id:'little',name:'a new beginning',start:67,end:100,seed:16,kind:'child'},
    {id:'me',name:'you',start:-4,end:67,star:[.50,1],seed:18,kind:'me'}
  ];
  const byId = Object.fromEntries(people.map(p=>[p.id,p]));
  const memories = people.filter(p=>p.star);
  const links = [['grandma','grandpa'],['grandpa','mom'],['mom','dad'],['dad','love'],['love','me'],['me','grandma']].map(([a,b])=>[byId[a],byId[b]]);
  // These six curved links gradually complete a heart as the stars arrive.
  const linkBends = [[[-.04,.13],[.08,-.045]],[[.36,.01],[.45,.12]],[[.55,.12],[.64,.01]],[[.92,-.045],[1.04,.13]],[[.98,.56],[.65,.86]],[[.35,.86],[.02,.56]]];
  const heartConnectsAt=Math.max(...memories.map(p=>p.end))+6;
  // Start the finishing light at the last star, at the point of the heart.
  const heartLoop=[5,0,1,2,3,4].map(i=>[links[i][0].star,...linkBends[i],links[i][1].star]);
  const heartPerimeter=heartLoop.reduce((total,q)=>{
    let previous=q[0];
    for(let i=1;i<=40;i++){
      const t=i/40,u=1-t,point=[0,1].map(k=>u*u*u*q[0][k]+3*u*u*t*q[1][k]+3*u*t*t*q[2][k]+t*t*t*q[3][k]);
      total+=Math.hypot((point[0]-previous[0])*1.12,point[1]-previous[1]);previous=point;
    }return total;
  },0);
  const ageKeys = [[0,4],[6,9],[14,16],[23,23],[28,28],[35,34],[43,49],[50,61],[60,77],[67,86],[71,89],[76,89]];
  let factory=null,assets=null,scene=null,fontVersion=0;
  const textCache=new Map(),hatchCache=new Map(),clothesCache=new Map(),headCache=new Map();
  let c,W,H,T,G,U,small,mood,blocking,construction=false;
  function surface(w,h){if(factory)return factory(Math.ceil(w),Math.ceil(h));if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(Math.ceil(w),Math.ceil(h));const e=document.createElement('canvas');e.width=Math.ceil(w);e.height=Math.ceil(h);return e;}
  function sprite(w,h,paint,res=2){const el=surface(w*res,h*res),x=el.getContext('2d');x.scale(res,res);x.lineCap='round';x.lineJoin='round';paint(x);return{el,w,h};}
  function blit(s,x,y,w=s.w,h=s.h){c.drawImage(s.el,x,y,w,h);}
  function ink(x,d,fill=null,color=INK,width=.8,alpha=1){const p=typeof d==='string'?new Path2D(d):d,old=x.globalAlpha;x.globalAlpha*=alpha;if(fill){x.fillStyle=fill;x.fill(p);}if(color){x.strokeStyle=color;x.lineWidth=width;x.stroke(p);}x.globalAlpha=old;return p;}
  function line(x,x1,y1,x2,y2,color=INK,width=.65,alpha=1){const old=x.globalAlpha;x.globalAlpha*=alpha;x.strokeStyle=color;x.lineWidth=width;x.beginPath();x.moveTo(x1,y1);x.lineTo(x2,y2);x.stroke();x.globalAlpha=old;}
  function oval(x,cx,cy,rx,ry,fill,color=null,width=.7){x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,TAU);if(fill){x.fillStyle=fill;x.fill();}if(color){x.strokeStyle=color;x.lineWidth=width;x.stroke();}}
  function curve(x,a,b,d,e,color=INK,width=.7,alpha=1){const old=x.globalAlpha;x.globalAlpha*=alpha;x.strokeStyle=color;x.lineWidth=width;x.beginPath();x.moveTo(...a);x.bezierCurveTo(...b,...d,...e);x.stroke();x.globalAlpha=old;}
  function hatch(x,clip,seed,color=INK,spacing=3,opacity=.15){if(construction)return;x.save();x.clip(clip);for(let y=-160;y<170;y+=spacing){const shift=(rand(y+seed)-.5)*2;line(x,-95,y+shift,95,y-90+shift,color,.38,opacity*(.55+rand(y+seed+7)*.5));}x.restore();}
  function figureHatch(x,clip,seed,color,spacing,opacity){
    if(construction)return;
    const key=[seed,color,spacing,opacity].join('|');let tile=hatchCache.get(key);
    if(!tile){
      tile=sprite(80,190,a=>{a.translate(40,160);for(let y=-160;y<170;y+=spacing){const shift=(rand(y+seed)-.5)*2;line(a,-95,y+shift,95,y-90+shift,color,.38,opacity*(.55+rand(y+seed+7)*.5));}});
      hatchCache.set(key,tile);
    }
    x.save();x.clip(clip);x.drawImage(tile.el,-40,-160,80,190);x.restore();
  }
  function paper(t){return blend('#f5f2eb','#e9eeeb',ramp(t,37,73)*.58);}
  function makeGrain(){return sprite(160,160,x=>{for(let i=0;i<1900;i++){x.fillStyle=i%3?'#6b63521a':'#ffffff55';x.fillRect(rand(i+13)*160,rand(i+511)*160,.45+rand(i)*.65,.45);}for(let i=0;i<24;i++)line(x,rand(i)*160,rand(i+50)*160,rand(i)*160+3,rand(i+50)*160+.4,'#786f59',.25,.065);},1);}
  function tree(x,type){
    const leaf=['#9aa684','#b0a17a','#8e9d8b'][type],seed=31+type*43;
    // Uneven clusters leave windows of sky between the branches.
    const clusters=[[78,79,47,36],[127,55,48,36],[174,73,53,36],[210,108,42,33],[109,111,58,41],[166,116,54,36],[64,119,36,30]];
    for(let j=0;j<clusters.length;j++){
      const [cx,cy,rx,ry]=clusters[j],p=new Path2D();
      for(let k=0;k<=32;k++){const a=k/32*TAU,r=.85+rand(seed+j*40+k)*.20,px=cx+Math.cos(a)*rx*r,py=cy+Math.sin(a)*ry*r;k?p.lineTo(px,py):p.moveTo(px,py);}p.closePath();
      ink(x,p,blend(leaf,PAPER,.54),null,0,.65);
      for(let k=0;k<55;k++){const a=rand(k+j*71)*TAU,r=Math.sqrt(rand(seed+k+j*101)),px=cx+Math.cos(a)*rx*r,py=cy+Math.sin(a)*ry*r;
        ink(x,`M${px-2} ${py+1} q-2 -3 1 -4 q3 -2 5 1`,null,leaf,.5,.26+rand(k+3)*.40);
      }
    }
    const trunk=ink(x,'M128 279 Q134 227 128 190 Q124 160 108 140 L116 143 Q128 156 134 178 Q141 151 154 129 L163 123 Q143 161 141 194 Q144 235 140 280Z','#c3bea9','#7f8871',.7);
    hatch(x,trunk,35,'#737c66',3,.21);
    ink(x,'M133 261 Q139 212 134 191 M132 183 Q114 160 92 154 Q77 149 68 136 M134 190 Q158 171 179 165 L198 146 M133 172 Q127 144 130 114 L119 96 M145 155 Q162 131 183 123 L196 103 M112 160 99 132 86 120',null,'#7b866e',.7,.8);
    ink(x,'M70 136 L60 123 M96 150 L89 136 M179 164 L178 146 M131 125 L146 108 M158 140 L160 116 M132 278 L121 284 M139 279 L153 285',null,'#7b866e',.45,.75);
    for(let i=0;i<38;i++){const px=111+rand(i+7)*46,py=281+rand(i+45)*7;ink(x,`M${px} ${py} q${rand(i)*8-4} -8 ${rand(i+9)*9-4} -10`,null,'#8d997c',.5,.65);}
    for(let i=0;i<12;i++){const px=77+rand(i+9)*121,py=87+rand(i+61)*63;ink(x,`M${px-3} ${py} q3 -5 6 -1 q-3 4 -6 1Z`,leaf,null,0,.42);}
  }
  function plant(x,type,member=null){
    if(type===2){
      for(let j=0;j<5;j++){const px=32+(j-2)*6,tipX=px+(j-2)*9,tipY=20+Math.abs(j-2)*13;
        if(member!==null&&member!==j)continue;
        curve(x,[32,90],[px,70],[tipX,tipY+20],[tipX,tipY],'#77876c',.7,.9);
        for(let k=0;k<7;k++){const f=.08+k*.12,u=1-f,cy=u*u*u*90+3*u*u*f*70+3*u*f*f*(tipY+20)+f*f*f*tipY,cx=u*u*u*32+3*u*u*f*px+3*u*f*f*tipX+f*f*f*tipX,len=(1-f)*10+3;
          ink(x,`M${cx} ${cy} q${-len} -1 ${-len} -7 q${len-2} 0 ${len} 7 M${cx} ${cy} q${len} -2 ${len} -7 q${-len+2} 0 ${-len} 7`,'#91a28080',null);
        }
      }return;
    }
    const stems=type===0?5:7;
    for(let i=0;i<stems;i++){
      if(member!==null&&member!==i)continue;
      const px=9+i*9,py=18+rand(i+type*17)*35,bend=(rand(i+11)-.5)*9;
      curve(x,[px,91],[px-5,64],[px+bend,py+16],[px+bend,py],'#7e8c70',.65,.90);
      for(let j=0;j<3;j++){const t=.22+j*.19,u=1-t,sx=u*u*u*px+3*u*u*t*(px-5)+3*u*t*t*(px+bend)+t*t*t*(px+bend),sy=u*u*u*91+3*u*u*t*64+3*u*t*t*(py+16)+t*t*t*py,side=(i+j)%2?1:-1;ink(x,`M${sx} ${sy} q${side*8} -11 ${side*11} -8 q-1 7 ${-side*11} 8`,'#9ca88877','#899779',.35,.8);}
      const cx=px+bend;
      if(type===0){
        for(let j=0;j<7;j++){const a=j/7*TAU;x.save();x.translate(cx,py);x.rotate(a);oval(x,0,-3.3,1.3,2.6,'#f4edda','#a8a081',.3);x.restore();}oval(x,cx,py,1.8,1.8,'#bda265');
      }else{
        for(let j=0;j<6;j++){const side=j%2?1:-1;ink(x,`M${cx} ${py+j*3} q${side*5} -5 ${side*4} -1`,'#ad987c99','#a18c70',.45,.8);}
      }
    }
  }
  function plantStems(type){
    const stems=[];
    for(let member=0;member<(type===1?7:5);member++){
      const art=sprite(98,104,x=>{x.translate(16,6);plant(x,type,member);});
      // Trim each frond once. Leaves keep their pencil texture while the
      // cached stem bends in a few connected strips, rooted at its true base.
      const ctx=art.el.getContext('2d'),pixels=ctx.getImageData(0,0,art.el.width,art.el.height).data;
      let left=art.el.width,top=art.el.height,right=0,bottom=0;
      for(let y=0;y<art.el.height;y++)for(let x=0;x<art.el.width;x++)if(pixels[(y*art.el.width+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      left=Math.max(0,Math.floor(left/2)-1);top=Math.max(0,Math.floor(top/2)-1);right=Math.min(art.w,Math.ceil((right+1)/2)+1);bottom=Math.min(art.h,Math.ceil((bottom+1)/2)+1);
      const cropped=sprite(right-left,bottom-top,x=>x.drawImage(art.el,left*2,top*2,(right-left)*2,(bottom-top)*2,0,0,right-left,bottom-top));
      const rootX=type===2?32:9+member*9,rootY=type===2?90:91;
      stems.push({...cropped,rootX:rootX+16-left,rootY:rootY+6-top,offset:rootX-32,member,type});
    }
    return stems;
  }
  function makeAssets(){
    const a={trees:[],plants:[],plantStems:[],glows:{},grain:makeGrain(),patterns:new WeakMap()};
    for(const p of people){
      a.glows[p.id]=sprite(80,80,x=>{const g=x.createRadialGradient(40,40,0,40,40,40);g.addColorStop(0,'#d7bd7f50');g.addColorStop(.25,'#ceb57720');g.addColorStop(1,'#ceb57700');x.fillStyle=g;x.fillRect(0,0,80,80);},1);
    }
    for(let i=0;i<3;i++)a.trees.push(sprite(280,300,x=>tree(x,i)));
    for(let i=0;i<3;i++){a.plants.push(sprite(66,94,x=>plant(x,i)));a.plantStems.push(plantStems(i));}
    a.house=sprite(180,158,x=>{
      const mesh=Geo.house(),P=Geo.project;
      const visible=mesh.faces.filter(f=>f.name!=='roofLeft');
      const fills={front:'#e7e1d1',side:'#cfd3c2',roofRight:'#bdc1ad'};
      for(const f of visible){const face=ink(x,polygon(f.points),fills[f.name],null);x.save();x.clip(face);
        if(f.name==='front'){
          for(let row=0;row<8;row++)for(let col=0;col<7;col++){const px=31+col*13+(row%2)*6,py=69+row*7;line(x,px,py,px+8,py,'#989f87',.32,.22);}
        }else if(f.name==='roofRight'){
          // Roof courses and tile joints lie on the same sloping plane.
          for(let i=1;i<8;i++){const t=i/8,A=Geo.pointMix(mesh.vertices.roofRidge,mesh.vertices.roofRight,t),B=Geo.pointMix(mesh.vertices.roofBackRidge,mesh.vertices.roofBackRight,t);line(x,...A,...B,'#818e76',.4,.32);}
          for(let j=1;j<6;j++){const t=j/6,A=Geo.pointMix(mesh.vertices.roofRidge,mesh.vertices.roofBackRidge,t),B=Geo.pointMix(mesh.vertices.roofRight,mesh.vertices.roofBackRight,t);line(x,...A,...B,'#929b83',.3,.2);}
        }else hatch(x,face,21,'#90967e',4,.16);
        x.restore();
      }
      // Shared visible edges are stroked once. Gable and roof have real,
      // separate overhangs instead of a folded, self-intersecting polygon.
      const edges=new Map();for(const f of visible)f.names.forEach((n,i)=>{const next=f.names[(i+1)%f.names.length],key=[n,next].sort().join(':');edges.set(key,[mesh.vertices[n],mesh.vertices[next]]);});
      for(const [A,B]of edges.values())line(x,...A,...B,'#818b77',.7,.95);
      line(x,...mesh.vertices.roofLeft,...mesh.vertices.roofRidge,'#818b77',.8);
      line(x,...mesh.vertices.roofLeft,...mesh.vertices.el,'#818b77',.6);
      const door=polygon([P(64,126),P(80,126),P(80,94),P(64,94)]);ink(x,door,'#b4beaa','#818b77',.65);line(x,68,97,68,122,'#8c977f',.4,.7);oval(x,76.5,111,.7,.7,'#827651');
      for(const wx of [41,91]){
        ink(x,polygon([P(wx,77),P(wx+12,77),P(wx+12,92),P(wx,92)]),'#e0d6b3','#818b77',.6);
        // Thin curtains, a sill plant, and height marks make this a lived-in home.
        ink(x,`M${wx+1} 78 l3 0 q-1 5 -3 7Z M${wx+11} 78 l-3 0 q1 5 3 7Z`,'#f1ecdb',null,0,.8);
        line(x,wx+6,77,wx+6,92,'#818b77',.4);line(x,wx,84.5,wx+12,84.5,'#818b77',.4);line(x,wx-1,93,wx+13,93,'#818b77',.7);
      }
      ink(x,'M97 91 l.5 -3 3 0 .5 3Z','#b9a58b','#89917c',.35,.8);
      ink(x,'M99 88 l0 -5 M99 86 q-4 0 -3 -3 q3 0 3 3 M99 85 q3 0 3 -2 q-3 0 -3 2',null,'#879779',.45,.8);
      for(const y of [116,109,102])line(x,82,y,85,y-1,'#9f927b',.45,.6);
      curve(x,[35,120],[42,122],[48,119],[53,121],'#a4a58d',.35,.42);
      const sideWindow=polygon([P(112,77,16),P(112,77,31),P(112,91,31),P(112,91,16)]);ink(x,sideWindow,'#c3c6ad','#818b77',.55);line(x,...P(112,84,16),...P(112,84,31),'#818b77',.4);line(x,...P(112,77,23.5),...P(112,91,23.5),'#818b77',.4);
      // The chimney is a small projected box with its bottom cut by the roof.
      const cx=91,z=25,top=16,roofY=x=>27+(x-71)*41/47;
      ink(x,polygon([P(cx,top,z),P(cx+8,top,z),P(cx+8,roofY(cx+8),z),P(cx,roofY(cx),z)]),'#c9cbb9','#818b77',.6);
      ink(x,polygon([P(cx+8,top,z),P(cx+8,top,z+8),P(cx+8,roofY(cx+8),z+8),P(cx+8,roofY(cx+8),z)]),'#b6beaa','#818b77',.6);
      ink(x,polygon([P(cx-1,top,z-1),P(cx+9,top,z-1),P(cx+9,top,z+9),P(cx-1,top,z+9)]),'#d8d8c6','#818b77',.6);
      for(let i=0;i<7;i++){const px=18+i*21;line(x,px,136,px,120,'#89947d',.65,.65);}for(const [a,b]of [[12,60],[81,155]]){line(x,a,125,b,125,'#89947d',.55,.65);line(x,a,132,b,132,'#89947d',.55,.65);}
      curve(x,[64,126],[63,140],[57,148],[51,156],'#a9a58b',.5,.5);curve(x,[80,126],[86,140],[99,149],[111,156],'#a9a58b',.5,.5);
    });
    a.bridge=sprite(248,124,x=>{
      const P=Geo.project,depth=25;
      const front=[],back=[];
      for(let i=0;i<=24;i++){const xx=15+i*8.3,yy=66-26*Math.sin(i/24*Math.PI);front.push(P(xx,yy,0));back.push(P(xx,yy,depth));}
      const deck=polygon([...front,...back.slice().reverse()]);ink(x,deck,'#d5d3bd','#8a927b',.65);
      const wall=new Path2D();wall.moveTo(...front[0]);for(const p of front.slice(1))wall.lineTo(...p);wall.lineTo(222,100);wall.lineTo(181,100);wall.bezierCurveTo(170,65,149,60,117,60);wall.bezierCurveTo(84,60,62,73,50,100);wall.lineTo(12,100);wall.closePath();
      ink(x,wall,'#d3d1bd','#8a927b',.7);hatch(x,wall,23,'#8b927c',4,.16);
      for(let i=0;i<front.length;i+=2){const p=front[i];line(x,p[0],p[1],p[0],p[1]+7,'#929782',.45,.7);}
      const coping=new Path2D();coping.moveTo(...front[0]);for(const p of front.slice(1))coping.lineTo(...p);for(const p of front.slice().reverse())coping.lineTo(p[0],p[1]+5);coping.closePath();ink(x,coping,'#bcc4ac','#879178',.55);
      // Texture remains clipped to the masonry silhouette.
      x.save();x.clip(wall);for(let i=0;i<25;i++){const px=18+rand(i+80)*196,py=53+rand(i+2)*43;line(x,px,py,px+9,py,'#929782',.4,.4);}x.restore();
      for(let i=0;i<5;i++)curve(x,[43+i*12,104+i*2],[95,101+i*2],[157,111+i*2],[211-i*11,106+i*2],'#8faaa3',.45,.38);
    });
    a.bench=sprite(164,104,x=>{
      const P=Geo.project;
      // The back, seat, and feet all share the same depth vector.
      for(const xx of [27,126]){
        line(x,...P(xx,29,20),...P(xx,92,20),'#717d6c',1.6);
        line(x,...P(xx,64,0),...P(xx,92,0),'#717d6c',1.6);
        line(x,...P(xx,75,0),...P(xx,75,20),'#717d6c',1.1);
      }
      for(let i=0;i<3;i++){const y=29+i*10;ink(x,polygon([P(19,y,20),P(133,y,20),P(133,y+6,20),P(19,y+6,20)]),'#c2b395','#8b806c',.6);line(x,...P(24,y+3,20),...P(127,y+3,20),'#9b8e75',.35,.5);}
      for(let i=0;i<3;i++){const z=i*7;ink(x,polygon([P(17,66,z),P(135,66,z),P(135,66,z+6),P(17,66,z+6)]),'#c9b99a','#847c69',.6);}
      for(const xx of [18,135]){const A=P(xx,66,0),B=P(xx,53,0),C=P(xx,53,20);curve(x,A,[A[0]-1,A[1]-8],B,C,'#717d6c',1.1);line(x,...C,...P(xx,66,20),'#717d6c',1.1);}
      // An old, almost worn-away carving echoes the constellation overhead.
      const [hx,hy]=P(76,42,20);
      ink(x,`M${hx} ${hy+2} c-7 -4 -3 -7 0 -4 c3 -3 7 0 0 4`,null,'#897d67',.38,.55);
      oval(x,49,37,3.2,.8,null,'#998c74',.35);
      curve(x,[112,45],[116,43],[120,45],[124,44],'#a09378',.35,.65);
    });
    a.robinBody=sprite(28,24,x=>{
      x.translate(14,19);
      ink(x,'M-4 -7 -10 -9 -6 -3Z','#9a9e8d','#737b6b',.45);
      oval(x,-1,-5,4.5,3.6,'#999e8b','#6f7869',.5);
      oval(x,1.5,-5,2.6,2.7,'#b99a7d');
      ink(x,'M-4 -7 q5 -1 4 4 q-3 0 -4 -4',null,'#737b6b',.45,.8);
    });
    a.robinHead=sprite(14,12,x=>{
      x.translate(6,6);oval(x,0,0,3.1,2.8,'#969b88','#6f7869',.45);
      ink(x,'M2.5 -.1 5 .5 2.5 1.2Z','#9a9274',null);
      oval(x,1.2,-.8,.45,.45,'#5f665b');
    });
    a.blossom=sprite(20,20,x=>{
      for(let i=0;i<19;i++){x.save();x.translate(10,10);x.rotate(i*TAU/19);oval(x,0,-3.1-rand(i+41)*.6,.55,1.8+rand(i+61)*.6,'#e4cd94','#b8a170',.25);x.restore();}
      oval(x,10,10,2.2,2.2,'#d0b77b');
      for(let i=0;i<8;i++){const a=i*TAU/8;line(x,10+Math.cos(a),10+Math.sin(a),10+Math.cos(a)*2.6,10+Math.sin(a)*2.6,'#ab986d',.3,.65);}
    });
    a.paperPlane=sprite(30,18,x=>{
      x.translate(14,9);ink(x,'M-11 -4 13 0 -8 7 -3 1Z','#f7f3e9','#929782',.55);
      line(x,-3,1,13,0,'#929782',.4);line(x,-7,-2,5,-.1,'#bba06a',.5,.75);
    });
    a.cloud=sprite(260,65,x=>{
      ink(x,'M14 46 Q25 39 43 40 Q40 27 59 28 Q65 12 85 23 Q100 14 113 29 Q139 24 150 37 Q173 28 193 39 Q224 34 246 45',null,'#a6ad9b',.55,.30);
      curve(x,[29,49],[90,47],[170,50],[231,47],'#a6ad9b',.4,.21);
    },1);
    return a;
  }
  function edgeMask(w,h){return sprite(w,h,x=>{
    const edge=Math.min(48,w*.10),g=x.createLinearGradient(0,0,w,0);
    g.addColorStop(0,'#ffffff00');g.addColorStop(4/w,'#ffffff00');g.addColorStop(edge/w,'#ffffffff');g.addColorStop(1-edge/w,'#ffffffff');g.addColorStop(1-4/w,'#ffffff00');g.addColorStop(1,'#ffffff00');x.fillStyle=g;x.fillRect(0,0,w,h);
    x.globalCompositeOperation='destination-in';const v=x.createLinearGradient(0,0,0,h);v.addColorStop(0,'#ffffff00');v.addColorStop(6/h,'#ffffff00');v.addColorStop(38/h,'#ffffffff');v.addColorStop(.87,'#ffffffff');v.addColorStop(.98,'#ffffff00');v.addColorStop(1,'#ffffff00');x.fillStyle=v;x.fillRect(0,0,w,h);
  },1);}
  function makeScene(w,h){
    const s={w,h,mask:edgeMask(w,h),hills:[]},gy=h*.74;
    s.wash=sprite(w,h,x=>{
      x.save();x.translate(w*.76,h*.30);x.scale(w*.28,h*.29);const g=x.createRadialGradient(0,0,.05,0,0,1);g.addColorStop(0,'#d7bf9133');g.addColorStop(.55,'#d7bf9118');g.addColorStop(1,'#d7bf9100');x.fillStyle=g;x.fillRect(-1,-1,2,2);x.restore();
      const sx=w*.82,sy=h*.22,r=Math.min(w*.033,29);oval(x,sx,sy,r,r,'#d4c59d12','#b8ac8955',.55);oval(x,sx+.6,sy-.4,r*.97,r*.99,null,'#b8ac8925',.35);
    },1);
    for(let layer=0;layer<3;layer++){
      const tw=Math.ceil(w*1.25),th=160;
      s.hills.push(sprite(tw,th,x=>{
        const ridge=new Path2D(),base=45+layer*27,amp=layer?12:25;
        for(let i=0;i<=tw;i+=4){const z=i/tw*TAU,y=base+Math.sin(z+layer)*amp+Math.cos(z*2+.6)*amp*.27;i?ridge.lineTo(i,y):ridge.moveTo(i,y);}
        ink(x,ridge,null,'#8e9c83',.6,.55);
        const fill=new Path2D(ridge);fill.lineTo(tw,th);fill.lineTo(0,th);fill.closePath();x.fillStyle=['#b6c4ad36','#aebb9f30','#a4b59126'][layer];x.fill(fill);
        x.save();x.clip(fill);
        for(let i=0;i<36;i++){const px=rand(i+layer*70)*tw,py=base+18+rand(i+15)*35;curve(x,[px,py],[px+16,py-1],[px+29,py-3],[px+46,py-5],'#879779',.4,.15);}
        x.restore();
        x.globalCompositeOperation='destination-in';const fade=x.createLinearGradient(0,70,0,th);fade.addColorStop(0,'#ffffffff');fade.addColorStop(1,'#ffffff00');x.fillStyle=fade;x.fillRect(0,0,tw,th);
      },1));
    }
    // Store only occupied scenery rows; avoid resampling a mostly transparent
    // full-canvas image twice on every frame. Integer origins preserve pixels.
    s.meadowY=Math.floor(gy-60);
    s.meadow=sprite(w,64,x=>{
      x.translate(0,-s.meadowY);
      const ry=gy-27;
      // Low hedgerows and tiny fence posts give the walkers a distant scale.
      for(let i=0;i<Math.ceil(w/18);i++){
        const px=i*18,py=ry+Math.sin(i*.18)*7,ht=5+rand(i+75)*10;
        ink(x,`M${px-5} ${py} q-3 ${-ht*.6} 4 ${-ht} q5 -5 8 0 q8 0 7 ${ht}Z`,'#acb89a30',null);
        if(i%3===0){line(x,px,py+4,px-1,py-8,'#8f977e',.55,.42);line(x,px,py-4,px+53,py-3,'#8f977e',.45,.33);}
      }
      for(let i=0;i<90;i++){
        const px=rand(i+400)*w,py=gy-15+rand(i+130)*14;
        ink(x,`M${px} ${py} l-2 -4 M${px+1} ${py} l2 -6`,null,'#8b9a78',.45,.15+rand(i)*.18);
      }
    },1);
    s.pathY=Math.floor(gy-14);
    s.path=sprite(w,86,x=>{
      x.translate(0,-s.pathY);
      const lane=new Path2D(`M-20 ${gy+4} C${w*.30} ${gy-11} ${w*.65} ${gy+12} ${w+20} ${gy-2} L${w+20} ${gy+57} Q${w*.5} ${gy+43} -20 ${gy+69}Z`);
      const wash=x.createLinearGradient(0,gy,0,gy+80);wash.addColorStop(0,'#d6c7a62b');wash.addColorStop(.65,'#d6c7a618');wash.addColorStop(1,'#d6c7a600');ink(x,lane,wash,null);
      curve(x,[-20,gy+4],[w*.30,gy-11],[w*.65,gy+12],[w+20,gy-2],'#8e997e',.75,.55);
      curve(x,[-20,gy+66],[w*.28,gy+42],[w*.72,gy+64],[w+20,gy+49],'#a1a58b',.5,.37);
      for(let i=0;i<110;i++){const px=rand(i+17)*w,py=gy+8+rand(i+91)*42;line(x,px,py,px+rand(i+3)*5+1,py-.5,'#928d73',.4,.12+rand(i)*.13);}
      for(let i=0;i<12;i++){const px=rand(i+83)*w,py=gy+12+rand(i+211)*33;ink(x,`M${px-2} ${py} q2 -3 4 -.5 l-1 1Z`,'#bebaa064','#96967c',.35,.5);}
    },1);
    return s;
  }
  function label(text,x,y,color='#74766b',size=12,alpha=1,backing=false){
    if(alpha<.01)return;const key=[text,color,size,fontVersion].join('|');let s=textCache.get(key);
    if(!s){const m=surface(1,1).getContext('2d');m.font=`italic ${size}px Georgia, serif`;const width=Math.ceil(m.measureText(text).width)+8;s=sprite(width,size*1.8,a=>{a.font=`italic ${size}px Georgia, serif`;a.fillStyle=color;a.textBaseline='middle';a.fillText(text,4,size*.85);});textCache.set(key,s);}
    if(backing&&!s.backing)s.backing=sprite(s.w,s.h,a=>{
      // A feathered knockout reveals the page's own paper and grain. Cache the
      // mask with the lettering so changing sky colors need no new artwork.
      const across=a.createLinearGradient(0,0,s.w,0);
      across.addColorStop(0,'#0000');across.addColorStop(3/s.w,'#000');across.addColorStop(1-3/s.w,'#000');across.addColorStop(1,'#0000');
      a.fillStyle=across;a.fillRect(0,0,s.w,s.h);
      const down=a.createLinearGradient(0,size*.10,0,size*1.5);
      down.addColorStop(0,'#0000');down.addColorStop(.16,'#000');down.addColorStop(.84,'#000');down.addColorStop(1,'#0000');
      a.globalCompositeOperation='destination-in';a.fillStyle=down;a.fillRect(0,0,s.w,s.h);
    });
    const left=clamp(x-s.w/2,9,W-s.w-9),top=y-s.h*.65;
    c.save();c.globalAlpha*=alpha;
    if(backing){c.globalCompositeOperation='destination-out';blit(s.backing,left,top);c.globalCompositeOperation='source-over';}
    blit(s,left,top);c.restore();
  }
  function anchor(p,t){return W*.5+(t===T?blocking:Geo.stage(t))[p.id]*U;}
  function groundAt(x){return G+Math.sin(x/W*TAU*.82+.3)*3;}
  function state(p){
    const entry=ramp(T,p.start,p.start+3),departure=ramp(T,p.end,p.end+3.3);let x=anchor(p,Math.min(T,p.end));
    // Departures leave a real space behind. The friend's path alone branches
    // away; family farewells and their star trails share this exact origin.
    if(p.id==='friend')x=anchor(p,T);
    let scale=U*({grandma:.94,grandpa:1.01,mom:.98,dad:1.05,love:.98}[p.id]||1);
    if(p.id==='me')scale*=lerp(.60,1,ramp(T,0,25))*lerp(1,.94,ramp(T,53,67));if(p.id==='friend')scale*=lerp(.76,.98,ramp(T,6,20));if(p.id==='child')scale*=lerp(.56,1,ramp(T,35,64));if(p.id==='little')scale*=.55;
    const alpha=entry*(1-ramp(T,p.end+.1,p.end+(p.star?2.9:4.2)));
    const young=p.id==='me'?1-ramp(T,0,24):p.id==='child'?1-ramp(T,35,61):p.id==='little'?1:p.id==='friend'?.4*(1-ramp(T,6,20)):0;
    const grand=p.kind==='grandma'||p.kind==='grandpa',elderly=grand?1:p.id==='me'?ramp(T,52,60):0;
    const slowing=p.id==='me'?Geo.paceIntegral(T,52,8):p.id==='child'?Geo.paceIntegral(T,60,3)-Geo.paceIntegral(T,69,3):0;
    const phase=(grand?T*2.8:T*3.15-.35*slowing)+p.seed;
    const lean=elderly*.035+(1-elderly)*Math.sin(phase)*.006;
    const ageing=p.id==='me'?ramp(T,51,63):p.id==='dad'?ramp(T,26,46):p.id==='mom'?ramp(T,25,40):p.id==='love'?ramp(T,48,58):0;
    const rig=Geo.pose({young,kind:p.kind,elderly,phase,lean});
    return{x,y:groundAt(x)-(p.id==='friend'?departure*22*U:0),scale,entry,departure,alpha,p,young,elderly,phase,lean,rig,ageing};
  }

  function heartLayout(width,height){
    const heartHeight=Math.min(height*.40,width*.62/1.12);
    return{x:width*.5,top:Math.max(56,height*.10),width:heartHeight*1.12,height:heartHeight};
  }
  function heartPoint(point){
    // One physical aspect ratio for stars AND curves: wide canvases cannot
    // flatten the lobes, and narrow canvases cannot stretch the point.
    const heart=heartLayout(W,H);
    return[heart.x+(point[0]-.5)*heart.width,heart.top+point[1]*heart.height];
  }
  function starXY(p){return heartPoint(p.star);}
  function flight(p,f){const a=[anchor(p,p.end),groundAt(anchor(p,p.end))-110*U],b=starXY(p),s=1-f;return[s*s*s*a[0]+3*s*s*f*(a[0]-50*U)+3*s*f*f*(b[0]+40*U)+f*f*f*b[0],s*s*s*a[1]+3*s*s*f*(a[1]-90*U)+3*s*f*f*(b[1]+70*U)+f*f*f*b[1]];}
  function drawStar(x,y,r,p,alpha=1){
    const old=c.globalAlpha;c.globalAlpha*=alpha;const breath=1+Math.sin(T*1.1+p.seed)*.07,g=r*8;
    blit(assets.glows[p.id],x-g/2,y-g/2,g,g);const q=r*breath;
    ink(c,`M${x} ${y-q} Q${x+.6} ${y-.5} ${x+q} ${y} Q${x+.5} ${y+.5} ${x} ${y+q} Q${x-.6} ${y+.5} ${x-q} ${y} Q${x-.5} ${y-.5} ${x} ${y-q}Z`,'#b49a61',null);
    oval(c,x,y,.75,.75,'#fff9e8');c.globalAlpha=old;
  }
  function atmosphere(){
    c.globalAlpha=1-mood*.55;blit(scene.wash,0,0,W,H);c.globalAlpha=1;
    if(mood<1)for(let i=0;i<2;i++){const x=((W*(.15+i*.46)-T*1.0+W+270)%(W+270))-130;c.globalAlpha=(1-mood)*.70;blit(assets.cloud,x,H*(.20+i*.09),small?150:260,small?38:65);}c.globalAlpha=1;
    if(mood>0)for(let i=0;i<38;i++){
      const x=(.08+rand(i+115)*.84)*W,y=(.09+rand(i+301)*.43)*H;
      const alpha=mood*(.12+rand(i)*.22)*(.7+.3*Math.sin(T*.7+i));c.globalAlpha=alpha;
      if(i%11===0){line(c,x-2,y,x+2,y,'#9e916e',.45);line(c,x,y-2,x,y+2,'#9e916e',.45);}else oval(c,x,y,.5,.5,'#9e916e');
    }c.globalAlpha=1;
    if(mood<1)for(let i=0;i<2;i++){const x=((T*6+i*20)%(W+80))-40,y=H*.25+i*9+Math.sin(T*.4+i)*4;const f=Math.sin(T*4+i)*1.5;c.globalAlpha=.30*(1-mood);curve(c,[x-4,y-f],[x-2,y-3],[x-1,y],[x,y+.5],'#87917e',.55);curve(c,[x,y+.5],[x+2,y-3],[x+4,y-3],[x+6,y-f],'#87917e',.55);}c.globalAlpha=1;
  }
  function landscape(){
    for(let i=0;i<3;i++){const s=scene.hills[i],offset=-(T*(.65+i*.5))%s.w,sy=G-138+i*9;c.globalAlpha=.94;blit(s,offset,sy,s.w,160);if(offset+s.w<W)blit(s,offset+s.w,sy,s.w,160);}c.globalAlpha=1;
    blit(scene.meadow,0,scene.meadowY);
    const houseX=W*.10-T*1.7*U,houseAlpha=.73*(1-ramp(T,32,49));
    if(houseX>-160&&houseAlpha)prop(assets.house,houseX-55*U,G-136*U,136*U,120*U,houseAlpha,cottageDetails);
    const bridgeAlpha=ramp(T,23,35)*(1-ramp(T,52,65));
    if(bridgeAlpha)prop(assets.bridge,W*.81-90*U-T*.25,G-103*U,185*U,92*U,bridgeAlpha*.62,bridgeDetails);
    const benchAlpha=ramp(T,46,58);if(benchAlpha)prop(assets.bench,W*.14-49*U,G-78*U,108*U,72*U,benchAlpha*.72,benchDetails);
    for(const[pos,type,size]of[[.025,0,small?.61:.91],[.97,1,small?.52:.78]]){
      c.save();c.translate(W*pos-T*.18*U,G-17*U);c.rotate(breeze(T,pos)*.0035);
      c.globalAlpha=.73;blit(assets.trees[type],-136*U*size,-280*U*size,280*U*size,300*U*size);c.restore();
    }
    blit(scene.path,0,scene.pathY);
  }
  function prop(art,x,y,w,h,alpha,detail){
    // Artwork and its small inhabitants use exactly the same local coordinates.
    c.save();c.globalAlpha=alpha;c.translate(x,y);c.scale(w/art.w,h/art.h);
    blit(art,0,0);detail();c.restore();
  }
  function robin(x,y,size,flight=0,face=1){
    c.save();c.translate(x,y);c.scale(size*face,size);
    if(flight<.01){line(c,-1,-2,-1,0,'#757765',.45);line(c,1,-2,2,0,'#757765',.45);line(c,-1,0,1,0,'#757765',.45);}
    blit(assets.robinBody,-14,-19);
    if(flight>.01){
      const wing=Math.sin(T*22)*5;
      ink(c,`M-3 -6 Q-7 ${-14-wing} -12 ${-11-wing} Q-9 -5 -3 -3`,'#a2a692','#737b6b',.4);
    }
    c.translate(2,-8);c.rotate(Math.sin(T*.9)*.08+ramp(Math.sin(T*.62),.88,1)*.3);
    blit(assets.robinHead,-6,-6);c.restore();
  }
  function cottageDetails(){
    // Warm glass never covers the mullions or curtains.
    c.save();c.globalAlpha*=.17+.025*Math.sin(T*.75);
    for(const wx of [41,91])for(const yy of [79,86]){c.fillStyle='#c7a15c';c.fillRect(wx+4,yy,1,5);c.fillRect(wx+7,yy,1,5);}
    c.restore();
    // Three slow pencil wisps begin at the projected chimney cap.
    for(let i=0;i<3;i++){
      const f=(T*.13+i/3)%1,x=112+f*7+Math.sin(T*.7+i)*2,y=5-f*30;
      curve(c,[x,y],[x-4,y-4],[x+4,y-7],[x+1,y-11],'#969a88',.65,Math.sin(f*Math.PI)*.23);
    }
    if(T<21){
      const leave=ramp(T,18,21);c.save();c.globalAlpha*=1-leave;
      robin(143+leave*38,120-leave*31,1.25,leave);c.restore();
    }
  }
  function bridgeDetails(){
    // A travelling reflection is confined to the water below the masonry.
    for(let i=0;i<2;i++){
      const f=(T*.17+i*.5)%1;c.save();c.globalAlpha*=Math.sin(f*Math.PI)*.24;
      oval(c,111+i*29,109+i*4,3+f*13,.7+f*1.4,null,'#8faaa3',.5);c.restore();
    }
    if(T>30&&T<46){
      const arrive=ramp(T,30,33),leave=ramp(T,43,46);
      c.save();c.globalAlpha*=arrive*(1-leave);
      robin(181-(1-arrive)*22+leave*32,66-26*Math.sin(20/24*Math.PI)-(1-arrive)*18-leave*25,1.2,1-arrive+leave,-1);c.restore();
    }
  }
  function benchDetails(){
    const arrive=ramp(T,54,57),perch=Geo.project(46,29,20);
    if(arrive){c.save();c.globalAlpha*=arrive;robin(perch[0]-(1-arrive)*22,perch[1]-(1-arrive)*18,1.35,1-arrive);c.restore();}
    // A smaller companion finds the same perch as the next generation arrives.
    const fledgling=ramp(T,68,71),other=Geo.project(66,29,20);
    if(fledgling){c.save();c.globalAlpha*=fledgling;robin(other[0]+(1-fledgling)*24,other[1]-(1-fledgling)*25,1.02,1-fledgling,-1);c.restore();}
  }
  function breeze(time,position){
    // A slow travelling gust carries small irregular eddies across the scene.
    return .30+.62*Math.sin(time*.86-position*4)+.24*Math.sin(time*1.47-position*6+.9)+.15*Math.sin(time*.29+2);
  }
  function stemOffset(y,root,bend,flutter){
    const u=clamp((root*.85-y)/(root*.85));
    return bend*u*u+flutter*u*u*Math.sin(u*Math.PI*1.3);
  }
  const stemBands=[0,.30,.60,.85,1];
  function bendingStem(art,bend,flutter){
    const ratio=art.el.width/art.w;
    // Adjacent affine strips share their boundary exactly. The root and its
    // tangent remain fixed; only the flexible upper stem catches the breeze.
    for(let i=0;i<4;i++){
      const top=art.rootY*stemBands[i],bottom=art.rootY*stemBands[i+1];
      const a=stemOffset(top,art.rootY,bend,flutter),b=stemOffset(bottom,art.rootY,bend,flutter),slope=(b-a)/(bottom-top);
      c.save();c.transform(1,0,slope,1,a-slope*top-art.rootX,-art.rootY);
      c.drawImage(art.el,0,top*ratio,art.el.width,(bottom-top)*ratio,0,top,art.w,bottom-top);c.restore();
    }
    if(art.h>art.rootY)c.drawImage(art.el,0,art.rootY*ratio,art.el.width,(art.h-art.rootY)*ratio,-art.rootX,0,art.w,art.h-art.rootY);
  }
  function foreground(){
    const count=small?5:10;
    for(let i=0;i<count;i++){
      const size=(.25+rand(i+63)*.26)*U,x=((i/count*(W+130)-T*2.6)%(W+130)+(W+130))%(W+130)-50,y=G+46+rand(i+81)*19;
      c.save();c.translate(x,y);c.rotate(breeze(T,(x+T*2.6)/W)*.033);c.globalAlpha=.60;blit(assets.plants[i%3],-32*size,-91*size,66*size,94*size);c.restore();
    }
    const nearCount=small?4:6,edge=110*U,span=W+edge*2,speed=7*U;
    for(let i=0;i<nearCount;i++){
      const origin=i/nearCount*span+W*.07,x=((origin-T*speed+edge)%span+span)%span-edge;
      const type=[2,0,1][i%3],size=(.69+rand(i+511)*.25)*U,y=G+(74+rand(i+99)*10)*U;
      if(x+80*size<0||x-80*size>W)continue;
      const position=(x+T*speed)/W;
      c.save();c.translate(x,y);c.scale(size,size);c.globalAlpha=.76;
      oval(c,0,.6,19,1.5,'#939b7d0e');
      for(const art of assets.plantStems[type]){
        const delay=art.member*.09,wind=breeze(T-delay,position+art.offset*size/W);
        const stiffness=type===2?.12:.17,bend=wind*art.rootY*stiffness;
        const flutter=Math.sin(T*(1.8+art.member*.07)+i*1.3+art.member)*1.2;
        c.save();c.translate(art.offset,0);bendingStem(art,bend,flutter);c.restore();
      }
      c.restore();
    }
    meadowStory();
  }
  function seed(x,y,angle,alpha){
    if(alpha<.005)return;c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.scale(U,U);
    line(c,0,0,0,-5,'#9b957b',.45);oval(c,0,.3,.55,1,'#a69a7b');
    for(const dx of [-2.6,0,2.6])line(c,0,-5,dx,-7,'#aaa28a',.4,.85);
    c.restore();
  }
  function meadowStory(){
    // A complete, seekable life in the lower margin: flower, seed, new growth.
    // Every seed has a fixed release and landing point; no particle history.
    const x=W*.28,y=G+55,headY=y-27*U,sway=t=>breeze(t,.28)*2.5*U;
    const seedTime=ramp(T,31,39),wither=ramp(T,57,66),headX=x+sway(T);
    c.save();c.globalAlpha=.68;
    curve(c,[x,y],[x-2*U,y-12*U],[headX,headY+8*U],[headX,headY],'#899578',.65*U,1-wither*.55);
    for(const side of [-1,1]){
      c.save();c.translate(x,y-3*U);c.scale(U*side,U);
      ink(c,'M0 0 -4 -1 -3 -3 -7 -2 -6 -5 -10 -4 -12 -8 -7 -7 -5 -5 -2 -5 0 0Z','#a8b19088','#909c7c',.35,1-wither*.5);
      line(c,0,0,-10,-6,'#94a07f',.3,.6);c.restore();
    }
    if(seedTime<1){
      const opening=lerp(.38,1,ramp(T,1,8)),s=20*U*opening;
      c.save();c.globalAlpha*=1-seedTime;blit(assets.blossom,headX-s/2,headY-s/2,s,s);c.restore();
    }
    oval(c,headX,headY,1*U,1.1*U,'#a5a286');
    for(let i=0;i<13;i++){
      const angle=i*TAU/13,release=48+i*.65,flight=ramp(T,release,release+8);
      if(i>=5){seed(headX,headY,angle,seedTime*(1-wither));continue;}
      const startX=x+sway(Math.min(T,release)),landX=x+(48+i*18)*U,landY=y+(i%2)*4*U;
      const sx=lerp(startX,landX,flight),sy=lerp(headY,landY,flight)-Math.sin(flight*Math.PI)*(21+i*4)*U;
      seed(sx,sy,lerp(angle,Math.sin(T+i)*.25,flight),seedTime*(1-ramp(T,release+7.5,release+10)));
    }
    for(let i=0;i<2;i++){
      const growth=ramp(T,59+i*3,71+i*3);if(!growth)continue;
      const bx=x+(48+i*18)*U,by=y+(i%2)*4*U,tipX=bx+breeze(T-i*.13,bx/W)*1.4*U*growth,tipY=by-(19-i*4)*U*growth;
      curve(c,[bx,by],[bx-2*U,by-5*U],[tipX,tipY+5*U*growth],[tipX,tipY],'#899578',.6*U);
      for(const side of [-1,1])curve(c,[bx,by-3*U*growth],[bx+side*4*U*growth,by-7*U*growth],[bx+side*6*U*growth,by-8*U*growth],[bx+side*7*U*growth,by-6*U*growth],'#94a07f',.7*U);
      const bloom=ramp(T,68+i*4,74+i*2),s=U*(4+bloom*9);
      if(bloom){c.save();c.globalAlpha*=bloom;blit(assets.blossom,tipX-s/2,tipY-s/2,s,s);c.restore();}
      else oval(c,tipX,tipY,1.2*U*growth,1.6*U*growth,'#a3ab87');
    }
    c.restore();
  }
  function thread(s){
    const p=s.p;if(T<p.start||T>p.end+6)return;
    curve(c,[-25,G+21+p.seed*.4],[W*.24,G+29+p.seed*.6],[s.x-64*U,G+17],[s.x,s.y+2],palette[p.id],.55,.10*s.entry*(1-ramp(T,p.end+2,p.end+6)));
    for(let i=0;i<4;i++){const x=s.x-17*U-i*19*U-(T*13%19)*U;c.globalAlpha=s.alpha*(.10-i*.021);oval(c,x,groundAt(x)+4+(i%2)*3,2.4*U,.75*U,'#8c8c76');}c.globalAlpha=1;
  }
  function heartFinish(time){
    const t=time-heartConnectsAt;
    if(t<=0||t>=2.9)return{travel:0,light:0,pulse:0};
    return{travel:ramp(t,0,1.85)*1.16,light:ramp(t,0,.18)*(1-ramp(t,1.6,1.9)),
      pulse:Math.sin(Math.PI*ramp(t,1.25,2.9))**2};
  }
  function finishHeart(effect){
    if(!effect.light&&!effect.pulse)return;
    const heart=heartLayout(W,H),path=new Path2D();path.moveTo(...heartPoint(heartLoop[0][0]));
    for(const q of heartLoop)path.bezierCurveTo(...heartPoint(q[1]),...heartPoint(q[2]),...heartPoint(q[3]));
    path.closePath();c.save();
    // One travelling light, then one slow shared breath. The accent is driven
    // only by story time, so pausing, seeking and replaying remain deterministic.
    if(effect.light){
      const perimeter=heartPerimeter*heart.height,trail=perimeter*.16;
      c.setLineDash([trail,perimeter*2]);c.lineDashOffset=trail-effect.travel*perimeter;
      ink(c,path,null,'#d5b778',small?5:7,effect.light*.13);
      ink(c,path,null,'#b79957',small?1.7:2.1,effect.light*.78);
      ink(c,path,null,'#f0d9a2',.65,effect.light*.72);
    }
    c.setLineDash([]);c.lineDashOffset=0;
    if(effect.pulse){
      ink(c,path,null,'#d5b778',small?5:7,effect.pulse*.12);
      ink(c,path,null,'#b79957',small?1.35:1.65,effect.pulse*.68);
      for(const p of memories){const q=starXY(p),size=(small?49:67)*(1+effect.pulse*.2);c.globalAlpha=effect.pulse*.65;blit(assets.glows[p.id],q[0]-size/2,q[1]-size/2,size,size);}
    }
    c.restore();
  }
  function constellations(){
    const complete=ramp(T,72,75),finish=heartFinish(T);
    for(let i=0;i<links.length;i++){
      const[p,q]=links[i],amount=ramp(T,Math.max(p.end,q.end)+2.5,Math.max(p.end,q.end)+6);if(!amount)continue;
      const a=starXY(p),b=starXY(q),controls=linkBends[i].map(heartPoint);
      // Subdivide the curve so each connection grows along the heart's outline.
      const mix=(a,b)=>[lerp(a[0],b[0],amount),lerp(a[1],b[1],amount)];
      const ab=mix(a,controls[0]),bc=mix(controls[0],controls[1]),cd=mix(controls[1],b),abc=mix(ab,bc),bcd=mix(bc,cd);
      const end=mix(abc,bcd);
      // Once the last star settles, a fine continuous line makes the complete
      // heart legible without adding a filled shape or a background panel.
      if(complete)curve(c,a,ab,abc,end,'#a68b50',.9,complete*.55);
      c.setLineDash([1,3.5]);curve(c,a,ab,abc,end,'#a68b50',.8,.7-complete*.2);c.setLineDash([]);
    }
    finishHeart(finish);
    for(const p of memories){
      if(T<p.end)continue;const f=ramp(T,p.end+.25,p.end+4.5),pos=flight(p,f),end=starXY(p);
      if(T<p.end+5.5){
        const fade=(1-ramp(T,p.end+3.6,p.end+5.5))*.4;c.beginPath();for(let i=0;i<=28;i++){const a=flight(p,f*i/28);i?c.lineTo(...a):c.moveTo(...a);}c.strokeStyle=palette[p.id];c.lineWidth=.6;c.globalAlpha=fade;c.stroke();
        for(let i=0;i<9;i++){const a=flight(p,clamp(f-i*.018));c.globalAlpha=fade*(1-i/9);oval(c,a[0]+Math.sin(T+i)*3,a[1]+Math.cos(T+i)*3,.7,.7,'#b3a16b');}c.globalAlpha=1;
      }
      drawStar(...pos,lerp(1,small?4.2:5.8,f)*(1+finish.pulse*.18),p,ramp(T,p.end,p.end+1));
      // The quiet circles and registration ticks belong to the celestial drawing.
      if(T>p.end+4.5){const alpha=ramp(T,p.end+4.5,p.end+6)*.15;c.save();c.globalAlpha=alpha;oval(c,...end,small?9:13,small?9:13,null,'#a89d7c',.4);c.restore();}
    }
    if(T>70){const s=state(byId.child),b=starXY(byId.me);c.setLineDash([1,6]);curve(c,[s.x,s.y-141*s.scale],[s.x-30*U,G-165*U],[b[0]+45*U,b[1]+36*U],b,'#ae9b6c',.5,ramp(T,70,74)*.25);c.setLineDash([]);}
    // Lettering sits above every connection, star halo and finishing accent.
    for(const p of memories){
      if(T<p.end||ramp(T,p.end+.25,p.end+4.5)<=.6)continue;
      const end=starXY(p),tipLabel=small&&p.id==='me';
      label(p.name,end[0]-(tipLabel?18:0),end[1]+(tipLabel?14:-(small?14:18)),'#8a826c',small?11:12.5,ramp(T,p.end+2.8,p.end+4.8),true);
    }
  }
  // Every shape below is expressed in the pose's pelvis coordinates. Fills
  // overlap at attachments; only the exposed silhouette receives an outline.
  function polygon(points){const p=new Path2D();points.forEach((v,i)=>i?p.lineTo(...v):p.moveTo(...v));p.closePath();return p;}
  function ribbonPath(r,cap=null){
    const p=new Path2D(),[a,e,b]=r.left,[d,f,g]=r.right;
    const near=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
    p.moveTo(...a);p.lineTo(...near(a,e,.80));p.quadraticCurveTo(...e,...near(e,b,.20));p.lineTo(...b);p.lineTo(...g);p.lineTo(...near(g,f,.80));p.quadraticCurveTo(...f,...near(f,d,.20));p.lineTo(...d);
    if(cap)p.bezierCurveTo(...cap[0],...cap[1],...a);
    p.closePath();return p;
  }
  function sleevePath(arm,d){
    const ribbon=Geo.ribbon(arm.root,arm.joint,arm.wrist,[d.sleeve,3.3,2.15]);
    const axis=Geo.unit(Geo.sub(arm.joint,arm.root));
    // A cloth shoulder curves over the upper arm. This is a sleeve seam, not
    // a circular joint cap; both long edges remain legible over the torso.
    const [left]=ribbon.left,[right]=ribbon.right;
    const controls=[Geo.sub(right,Geo.mul(axis,4)),Geo.sub(left,Geo.mul(axis,4))];
    const cap=new Path2D();cap.moveTo(...right);cap.bezierCurveTo(...controls[0],...controls[1],...left);
    const fill=ribbonPath(ribbon,controls);
    return {fill,ribbon,cap};
  }
  function outlineFill(path,fill,width=.65){
    // Filling the combined path AFTER its stroke erases internal overlap edges.
    // No stroke is left where a sleeve or leg enters another filled component.
    ink(c,path,null,INK,width*2);ink(c,path,fill,null);
  }
  function bodyPath(r,hem,shape=Geo.torso(r,hem)){
    const p=new Path2D(),b=r.body,sy=-r.d.torso;
    p.moveTo(...b(shape.neckBack));
    for(const q of shape.back)p.bezierCurveTo(...b(q[1]),...b(q[2]),...b(q[3]));
    p.quadraticCurveTo(...b([1,hem+1]),...b(shape.front[1][3]));
    for(const q of [...shape.front].reverse())p.bezierCurveTo(...b(q[2]),...b(q[1]),...b(q[0]));
    p.lineTo(...b([4,sy]));p.quadraticCurveTo(...b([0,sy+1]),...b(shape.neckBack));p.closePath();return p;
  }
  function clothes(s){
    const p=s.p,color=palette[p.id],female=['grandma','dress','love'].includes(p.kind);
    if(clothesCache.has(p.id))return clothesCache.get(p.id);
    const blouse=p.id==='mom'?'#ded0bc':p.id==='love'?'#c9b5ba':p.id==='grandma'?'#bcb0c1':blend(color,PAPER,.52);
    const wardrobe={female,blouse,skirt:p.id==='mom'?'#b99989':p.id==='love'?'#ab929d':'#b3a8b8',trousers:blend(color,PAPER,.36),far:blend(color,PAPER,.27),color};
    clothesCache.set(p.id,wardrobe);return wardrobe;
  }
  function paintHead(s,look){
    const r=s.rig,p=s.p,old=p.kind==='grandma'||p.kind==='grandpa'?1:s.ageing;
    c.save();c.translate(...r.neck);c.rotate(r.lean+look);c.scale(r.d.head/24,r.d.head/24);
    // Stable heads are tiny high-resolution sprites. Keep growth and ageing
    // fully continuous: intermediate contours are still drawn as vectors.
    if(!construction&&(s.young===0||s.young===1)&&(old===0||old===1)){
      const key=[p.id,s.young,old].join('|');let head=headCache.get(key);
      if(!head){head=sprite(40,42,x=>{const destination=c;c=x;c.translate(20,35);paintHeadArtwork(s);c=destination;},3);headCache.set(key,head);}
      blit(head,-20,-35);
    }else paintHeadArtwork(s);
    c.restore();
  }
  function paintHeadArtwork(s){
    const p=s.p,y=s.young;
    const old=p.kind==='grandma'||p.kind==='grandpa'?1:s.ageing;
    const base={mom:'#716454',love:'#695c51',dad:'#555d54',friend:'#856b50',me:'#74644c',child:'#74604b',little:'#8b704f'}[p.id]||'#7f7464';
    const hair=blend(base,'#b4b2a3',old);
    // One interpolated face contour, including the neck tucked under the collar.
    const cheek=lerp(11.9,12.7,y),nose=lerp(14.3,13.4,y),jaw=lerp(7.6,8.5,y);
    if(p.id==='mom')ink(c,'M-5 -23 Q-12 -20 -10 -11 Q-13 -4 -7 0 L-1 -5 0 -24Z',hair,INK,.65);
    if(p.id==='love')ink(c,'M-5 -24 Q-12 -19 -10 -9 Q-8 -4 -3 -5 L2 -22Z',hair,INK,.6);
    const head=new Path2D();head.moveTo(-4,4);head.lineTo(-3,-5);head.bezierCurveTo(-10,-8,-10,-17,-7,-22);head.bezierCurveTo(-4,-29,7,-29,10,-23);head.quadraticCurveTo(12,-20,11,-16);head.lineTo(nose,-12.7);head.quadraticCurveTo(nose+.3,-11.6,cheek,-11.4);head.quadraticCurveTo(cheek+.7,-6,jaw,-5.5);head.lineTo(4,-5);head.lineTo(4,4);head.closePath();
    ink(c,head,'#eee3d2',INK,.65);
    if(construction)return;
    ink(c,'M-4 -12 Q-7 -15 -6 -10 Q-5 -8 -3 -9 M8 -8.5 Q10 -8 11 -8.9',null,INK,.4,.8);
    ink(c,'M7.1 -17 Q8.4 -17.5 10 -17',null,INK,.45);oval(c,9,-16.3,.42,.5,INK);
    oval(c,8,-11.2,1.5,.8,'#b5816322');
    if(p.kind==='grandpa'){
      const cap=ink(c,'M-10 -20 Q-10 -28 -2 -29 Q7 -31 11 -22 L16 -20 5 -20Z','#a0a68d',INK,.6);figureHatch(c,cap,40,INK,2.4,.17);
      ink(c,'M-10 -21 Q1 -24 12 -21 M8 -10 Q10 -11 12 -10',null,INK,.5);
    }else{
      // Hair recedes continuously; ageing never overlays a second head.
      const crown=lerp(-27,-26,old),part=lerp(2,-3,old);
      const hp=new Path2D();hp.moveTo(-7,-9);hp.bezierCurveTo(-12,-16,-10,-24,-5,crown);hp.bezierCurveTo(1,crown-3,10,crown,11,-21);hp.quadraticCurveTo(7,-19,part,-23);hp.quadraticCurveTo(-1,-17,-6,-15);hp.lineTo(-6,-10);hp.closePath();
      ink(c,hp,hair,INK,.65);figureHatch(c,hp,p.seed,PAPER,2.2,.22);
      if(p.id==='grandma'){const bun=ink(c,'M-9 -23 Q-16 -28 -16 -21 Q-16 -16 -9 -18Z',hair,INK,.6);figureHatch(c,bun,4,INK,2,.16);}
      if(p.id==='love')ink(c,'M-9 -16 Q-10 -10 -6 -7',null,'#b3a18b',.5,.7);
      if(y>.05){ink(c,`M-7 -24 q-3 ${-2*y} -2 ${-4*y} M-2 -27 q1 ${-3*y} 4 ${-2*y}`,null,hair,.8,y);}
    }
    if(old>.01){c.save();c.globalAlpha*=old;oval(c,9.3,-16.2,3,2.3,null,INK,.45);line(c,-5,-17,6.5,-16.8,INK,.45,.8);ink(c,'M6.6 -9.8 l1 .6 M5.5 -7 l1 .5',null,INK,.3,.5);c.restore();}
    if(p.id==='dad')ink(c,'M8 -10.2 Q10 -11 12 -10',null,hair,.8);
    if(p.id==='mom'||p.id==='love')oval(c,-4,-7,.65,.85,'#b2975c');
  }
  function paintShoe(leg,shade){
    const [x,y]=leg.end;c.save();c.translate(x,y);
    // The ankle is inside the shoe; a planted sole is always exactly y=0.
    ink(c,'M-3.4 -2.1 Q-.2 -3.1 2.8 -.5 L7.5 .1 Q9.4 1 8 2 L-4 2Z',shade,INK,.6);
    line(c,-3.2,1.3,7.7,1.3,INK,.35,.6);c.restore();
  }
  function paintLegs(s,cloth){
    const r=s.rig,d=r.d;
    const paths=r.legs.map(l=>ribbonPath(Geo.ribbon(l.root,l.joint,l.end,[d.thigh,4.2,2.8])));
    const farRibbon=Geo.ribbon(r.legs[0].root,r.legs[0].joint,r.legs[0].end,[d.thigh,4.2,2.8]);
    const nearRibbon=Geo.ribbon(r.legs[1].root,r.legs[1].joint,r.legs[1].end,[d.thigh,4.2,2.8]);
    const l=Geo.pointMix(farRibbon.left[0],farRibbon.left[1],.12),rr=Geo.pointMix(nearRibbon.right[0],nearRibbon.right[1],.12);
    const waist=new Path2D();waist.moveTo(...r.body([-d.seat,-12]));waist.quadraticCurveTo(...r.body([-d.seat,-4]),...l);waist.lineTo(...rr);waist.quadraticCurveTo(...r.body([d.belly,-4]),...r.body([d.belly,-12]));waist.closePath();
    const trousers=new Path2D();trousers.addPath(paths[0]);trousers.addPath(paths[1]);trousers.addPath(waist);
    outlineFill(trousers,cloth.trousers,.65);
    // Shade the far leg, then cover its hidden portion with the near leg/seat.
    ink(c,paths[0],cloth.far,null);ink(c,paths[1],cloth.trousers,null);ink(c,waist,cloth.trousers,null);
    c.save();c.clip(trousers);const j=r.legs[1].joint,b=r.legs[1].end;
    curve(c,Geo.pointMix(r.legs[1].root,j,.27),Geo.pointMix(r.legs[1].root,j,.7),Geo.pointMix(j,b,.35),[b[0]-1,b[1]-4],INK,.45,.42);c.restore();
    paintShoe(r.legs[0],'#8b897a');paintShoe(r.legs[1],'#969080');
  }
  function paintHand(s,arm,held){
    const r=s.rig,amount=held?.amount||0;
    const dir=Geo.unit(Geo.pointMix(arm.handDirection,held?.direction||arm.handDirection,amount));
    const palm=r.d.palm;
    c.save();c.translate(...arm.wrist);c.rotate(Math.atan2(dir[1],dir[0])-Math.PI/2);
    // The grip contact lies inside the palm, so the two hands overlap.
    // The cuff covers the palm's base without a gap at the wrist.
    const hand=new Path2D();hand.moveTo(-1.65,-.8);hand.bezierCurveTo(-2,1,-1.8,palm-.2,0,palm);hand.quadraticCurveTo(1.5,palm,1.6,palm-1.5);hand.lineTo(1.6,.9);hand.quadraticCurveTo(2.9,1.6,2.4,.1);hand.lineTo(1.4,-.9);hand.closePath();
    ink(c,hand,'#eee3d2',INK,.45);
    if(amount<.95)line(c,-.4,palm-1.8,.1,palm-.6,'#9c907c',.27,.55);
    c.restore();
  }
  function paintFigure(s,hands={}){
    const r=s.rig,d=r.d,cloth=clothes(s),p=s.p;
    const greeting=p.start>0?ramp(T,p.start+.4,p.start+1.4)*(1-ramp(T,p.start+2.8,p.start+4.6)):0;
    const wave=Math.max(greeting,ramp(T,p.end+.1,p.end+1.3))*(1-(hands.right?.amount||0));
    const armFor=(side,held)=>Geo.arm(r,side,{wave:side===1?wave:0,cane:side===1&&s.elderly,target:held?Geo.local(s,held.wrist):null,amount:held?.amount||0});
    const far=armFor(-1,hands.left),near=armFor(1,hands.right);
    const farSleeve=sleevePath(far,d),nearSleeve=sleevePath(near,d);
    const farPath=farSleeve.fill,nearPath=nearSleeve.fill;
    if(p.id==='friend'&&!construction){
      const back=-d.back,sy=-d.torso,b=r.body;
      ink(c,polygon([b([back+1,sy+8]),b([back-10,sy+11]),b([back-10,sy+30]),b([back+1,sy+32])]),'#b7a583',INK,.6);
    }
    outlineFill(farPath,cloth.blouse,.6);paintHand(s,far,hands.left);
    paintLegs(s,cloth);
    const looking=memories.some(q=>T>q.end+.5&&T<q.end+4.5);
    const glance=(hands.right?.amount||0)*.055-(hands.left?.amount||0)*.06;
    paintHead(s,looking?-.075:glance+Math.sin(T*.5+p.seed)*.008);
    if(cloth.female){
      const waist=-25,hem=p.id==='love'?23:29,back=d.seat+6,front=d.belly+5;
      const skirt=new Path2D(),b=r.body;
      skirt.moveTo(...b([-d.seat+1,waist]));skirt.bezierCurveTo(...b([-d.seat-1,-5]),...b([-back+3,hem-9]),...b([-back,hem]));skirt.quadraticCurveTo(...b([1,hem+2]),...b([front,hem-1]));skirt.bezierCurveTo(...b([front-1,hem-13]),...b([d.belly+1,-7]),...b([d.waist,waist]));skirt.closePath();
      outlineFill(skirt,cloth.skirt,.65);
      c.save();c.clip(skirt);curve(c,b([-2,waist+4]),b([-3,-7]),b([-2,hem-8]),b([-4,hem+2]),INK,.4,.28);curve(c,b([-7,hem-16]),b([-7,hem-10]),b([-9,hem-5]),b([-10,hem+1]),INK,.35,.2);c.restore();
    }
    const hem=cloth.female?-24:lerp(2,-4,s.young),profile=Geo.torso(r,hem);
    const torso=bodyPath(r,hem,profile),garment=new Path2D();garment.addPath(torso);garment.addPath(nearPath);
    // The shoulder and near sleeve form one garment silhouette.
    outlineFill(garment,cloth.blouse,.65);
    c.save();c.clip(torso);const exclusion=new Path2D();exclusion.rect(-100,-220,220,250);exclusion.addPath(nearPath);c.clip(exclusion,'evenodd');
    const b=r.body,sy=-d.torso,front=(y,inset=0)=>b(profile.frontAt(y,inset));
    figureHatch(c,torso,p.seed,cloth.color,5,.10);
    if(!construction){
    // The neckline wraps around a profile neck. Garment openings live on the
    // forward edge; there is no viewer-facing centreline or paired decoration.
    curve(c,b([-3.5,sy-4]),b([-3,sy-1]),b([2,sy+3]),b([5,sy-1]),INK,.5,.8);
    if(p.id==='mom'){
      ink(c,polygon([b([4,sy-3]),b([9,sy+3]),b([7,sy+9]),b([4,sy+3])]),'#e9ddca',INK,.45);
      curve(c,front(sy+10,1.4),front(sy+15,1.4),front(hem-5,1.4),front(hem-1,1.4),INK,.35,.55);
    }else if(p.id==='grandma'){
      ink(c,polygon([b([-4,sy-4]),b([-6,sy+2]),b([3,sy+8]),front(sy+12,.8),front(sy+4,.5),b([5,sy-3]),b([3,sy+2])]),'#a997b0',INK,.5);
    }else if(p.id==='dad'||p.id==='grandpa'){
      ink(c,polygon([b([4,sy-3]),front(sy+8,.4),front(sy+22,1.4)]),p.id==='dad'?'#c7c9bd':'#939f87',INK,.4);
      ink(c,polygon([b([4,sy-3]),b([7.5,sy+5]),b([6,sy+9]),front(sy+12,2),front(sy+23,1.5),b([5,sy+13]),b([2,sy+2])]),cloth.blouse,INK,.5);
      const opening=new Path2D();opening.moveTo(...front(sy+23,1.5));for(let y=sy+25;y<hem;y+=2)opening.lineTo(...front(y,1.5));ink(c,opening,null,INK,.4,.65);
      for(let i=0;i<3;i++)oval(c,...front(sy+28+i*7,2.2),.45,.6,INK);
    }else{
      if(p.id!=='little')curve(c,front(sy+8,1),front(sy+20,1),front(hem-12,1),front(hem-1,1),INK,.3,.35);
    }
    if(p.id==='little')for(let y=sy+13;y<hem-3;y+=7)line(c,...b([-15,y]),...b([15,y+1]),'#aa8e5b',.7,.4);
    if(s.young>.01&&['child','me','friend'].includes(p.id)){
      c.save();c.globalAlpha*=s.young;
      const bib=polygon([b([6,sy+15]),front(sy+15),front(hem-.5),b([-d.seat,hem]),b([-d.seat,sy+24]),b([0,sy+23])]);ink(c,bib,blend(cloth.color,PAPER,.42),INK,.45);
      curve(c,b([-3,sy+1]),b([0,sy+4]),b([5,sy+10]),b([7,sy+17]),cloth.color,1.8,.75);
      oval(c,...b([7,sy+17]),.7,.7,'#ac9871');
      ink(c,polygon([b([-2,hem-13]),b([5,hem-12]),b([4,hem-6]),b([-2,hem-7])]),null,INK,.35);c.restore();
    }
    if(s.young<.5&&p.id!=='little')line(c,...b([-2,hem-11]),...b([5,hem-9]),INK,.4,.55);
    }
    c.restore();
    if(p.id==='friend'&&!construction){
      c.save();c.clip(torso);c.clip(exclusion,'evenodd');
      curve(c,b([-d.back+1,sy+1]),b([0,sy+12]),b([0,sy+24]),b([-d.back+1,sy+31]),'#847252',.8,.8);c.restore();
    }
    if(p.id==='me'&&!construction){
      const f=Math.sin(T*2.1)*1.2;
      c.save();c.translate(...r.neck);c.rotate(r.lean);
      ink(c,`M-5 3 Q-13 ${7+f} -23 ${5+f} L-23 ${8+f} Q-13 ${11+f} -4 7Z`,'#c6aa70','#8f7e55',.45);
      ink(c,'M-6 0 Q0 4 7 0 L8 4 Q1 8 -7 4Z','#c6aa70','#8f7e55',.45);c.restore();
      if(s.young<.99){c.save();c.globalAlpha*=1-s.young;c.clip(exclusion,'evenodd');curve(c,b([-d.back+2,sy+6]),b([-2,-25]),b([3,-15]),b([7,-9]),'#8b7853',.85);ink(c,polygon([b([-2,-13]),b([10,-14]),b([10,-2]),b([-2,-1])]),'#b6a17a',INK,.5);c.restore();}
    }
    // The near arm occludes the shirt front. Draw both sleeve edges, including
    // the part over the chest, so the torso cannot masquerade as an arm edge.
    ink(c,nearPath,blend(cloth.blouse,cloth.color,.06),null);
    c.save();c.clip(torso); // The exposed edge already belongs to the silhouette.
    for(const side of [nearSleeve.ribbon.left,nearSleeve.ribbon.right]){
      const [a,e,w]=side,edge=new Path2D();edge.moveTo(...a);edge.lineTo(...Geo.pointMix(a,e,.8));edge.quadraticCurveTo(...e,...Geo.pointMix(e,w,.2));edge.lineTo(...w);ink(c,edge,null,INK,.6,.9);
    }
    ink(c,nearSleeve.cap,null,INK,.45,.65);c.restore();
    paintHand(s,near,hands.right);
    // Cuffs follow their wrists exactly. No circular shoulder caps are drawn.
    for(const a of [far,near]){const v=Geo.unit(Geo.sub(a.wrist,a.joint));line(c,a.wrist[0]-v[1]*2,a.wrist[1]+v[0]*2,a.wrist[0]+v[1]*2,a.wrist[1]-v[0]*2,INK,.45,.8);}
    if(s.elderly){
      const opacity=s.elderly*(1-ramp(wave,0,.22))*(1-(hands.right?.amount||0));
      const contact=Geo.add(near.wrist,Geo.mul(near.handDirection,d.palm*.7));
      curve(c,contact,[contact[0]+4,contact[1]-3],[contact[0]+7,contact[1]+1],[contact[0]+5,-1],'#777b6a',1,opacity);
    }
  }
  function person(s,hands={}){
    if(s.alpha<.005)return;
    c.save();c.globalAlpha=s.alpha;oval(c,s.x,s.y+1,17*s.scale,1.6*s.scale,'#89917b12');c.translate(s.x,s.y);c.scale(s.scale,s.scale);
    if(s.alpha<.995){
      // Fade a complete person once; translucent layers must not reveal seams.
      if(!assets.figure)assets.figure=surface(400,440);
      const dst=c,tmp=assets.figure.getContext('2d');tmp.setTransform(2,0,0,2,180,360);tmp.clearRect(-90,-180,200,220);tmp.lineCap='round';tmp.lineJoin='round';c=tmp;paintFigure(s,hands);c=dst;c.drawImage(assets.figure,-90,-180,200,220);
    }else paintFigure(s,hands);
    c.restore();
  }
  function cast(){
    const states=people.filter(p=>T>=p.start&&T<p.end+4.5).map(state),map=Object.fromEntries(states.map(s=>[s.p.id,s])),hands={},grips=[];
    const reassurance=ramp(T,1,2.5)*(1-ramp(T,5,6.5))+ramp(T,14.2,15.5)*(1-ramp(T,18,19.5));
    if(map.dad&&map.mom&&reassurance>0){
      const touch=Geo.backTouch(map.dad,map.mom);
      if(touch)hands.dad={right:{...touch,amount:reassurance}};
    }
    const pairs=[['mom','me',1-ramp(T,12,14)],['me','child',ramp(T,37.7,39)*(1-ramp(T,47,49))],['child','little',ramp(T,69.8,71.2)]];
    for(const[aid,bid,amount]of pairs){
      const a=map[aid],b=map[bid];if(!a||!b||amount<=0||Math.min(a.alpha,b.alpha)<.01)continue;
      const grip=Geo.grip(a,b);if(!grip)continue;
      (hands[aid]||={}).right={...grip.a,amount};(hands[bid]||={}).left={...grip.b,amount};grips.push({a,b,grip,amount});
    }
    // Back-to-front in walking order, so Dad's hand rests behind Mum's sleeve
    // and the child's clasp remains in front of the parent's palm.
    states.sort((a,b)=>a.x-b.x);
    for(const s of states)thread(s);for(const s of states)person(s,hands[s.p.id]);
    // One short finger crease clarifies the overlap, without a third hand/blob.
    for(const{a,b,grip,amount}of grips){if(amount<.98)continue;const q=grip.contact;c.save();c.globalAlpha=Math.min(a.alpha,b.alpha)*amount;curve(c,[q[0]-.8*a.scale,q[1]-.3*a.scale],[q[0],q[1]-.6*a.scale],[q[0]+.5*a.scale,q[1]-.4*a.scale],[q[0]+.7*a.scale,q[1]],'#998a74',.3,.7);c.restore();}
    return states;
  }
  function castLabels(states){
    for(const s of states){const p=s.p,alpha=s.alpha*(1-s.departure);if(alpha<.01)continue;
      const below=p.id==='little'?1:p.id==='me'?1-ramp(T,11,13):p.id==='child'?1-ramp(T,54,56):0;
      // Fixed name lanes keep close relatives readable without spreading the
      // people apart. They do not jump around as a new label appears.
      const stagger=({grandpa:small?16:4,love:small?18:14,child:lerp(small?18:10,0,ramp(T,69,72))}[p.id]||0);
      const headTop=s.y-(161+3*s.young)*s.scale;
      const nameTop=p.id==='child'?Math.min(headTop,s.y-161*U):headTop;
      label(p.name,s.x,s.y+27*U,palette[p.id],small?11.5:13,alpha*below,true);
      label(p.name,s.x,nameTop-stagger,palette[p.id],small?11.5:13,alpha*(1-below),true);
    }
  }
  function smallMoments(){
    // The same gold pencil crease and flight arc return one generation later.
    for(const [start,p]of [[8,byId.me],[40,byId.child]]){
      if(T<=start||T>=start+6)continue;
      const f=(T-start)/6,x=anchor(p,start)+f*W*.22,y=G-170*U-Math.sin(f*Math.PI)*35*U;
      c.save();c.translate(x,y);c.rotate(-.15+f*.3);c.scale(U,U);c.globalAlpha=Math.sin(f*Math.PI)*.65;
      blit(assets.paperPlane,-14,-9);c.restore();
    }
  }
  function sceneState(width,height,time){
    W=width;H=height;T=clamp(time,0,76);small=W<700;G=H*.74;U=small?clamp(W/550,.62,1):clamp(W/1060,1,1.20);mood=ramp(T,26,69);blocking=Geo.stage(T);
  }
  function draw(context,width,height,time){
    c=context;sceneState(width,height,time);
    if(!assets)assets=makeAssets();if(!scene||scene.w!==W||scene.h!==H)scene=makeScene(W,H);
    c.save();c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,W,H);c.lineCap='round';c.lineJoin='round';
    atmosphere();landscape();smallMoments();constellations();
    const states=cast();foreground();castLabels(states);
    // No coloured rectangle can survive at an edge, at any age or viewport size.
    c.globalCompositeOperation='destination-in';blit(scene.mask,0,0,W,H);c.restore();
  }
  function paintPaper(context,width,height,time=0){
    if(!assets)assets=makeAssets();context.save();context.fillStyle=paper(time);context.fillRect(0,0,width,height);
    if(!assets.patterns.has(context))assets.patterns.set(context,context.createPattern(assets.grain.el,'repeat'));
    context.fillStyle=assets.patterns.get(context);context.fillRect(0,0,width,height);context.restore();
  }
  function age(t){let i=0;while(i<ageKeys.length-2&&t>ageKeys[i+1][0])i++;return Math.round(lerp(ageKeys[i][1],ageKeys[i+1][1],clamp((t-ageKeys[i][0])/(ageKeys[i+1][0]-ageKeys[i][0]))));}
  globalThis.LittleLife={draw,paintPaper,paper,duration:76,chapters,age,heartLayout,
    setCanvasFactory(f){factory=f;assets=null;scene=null;textCache.clear();hatchCache.clear();headCache.clear();},fontsChanged(){fontVersion++;textCache.clear();},invalidate(){assets=null;scene=null;textCache.clear();hatchCache.clear();headCache.clear();},
    getPaperTile(){if(!assets)assets=makeAssets();return assets.grain.el;},
    get cacheStats(){return{labels:textCache.size,heads:headCache.size,hatches:hatchCache.size,scene:scene?`${scene.w}×${scene.h}`:null};}
  };
  if(typeof module==='object'&&module.exports){
    module.exports={...globalThis.LittleLife,inspect:{people,state,clothes,bodyPath,paintFigure,heartFinish,states(w,h,t){sceneState(w,h,t);return people.filter(p=>t>=p.start&&t<p.end+4.5).map(state);},assets(){if(!assets)assets=makeAssets();return assets;},renderFigure(context,s,hands={},draft=false){const previous=c,old=construction;c=context;construction=draft;c.lineCap='round';c.lineJoin='round';paintFigure(s,hands);c=previous;construction=old;}}};
    Object.defineProperty(module.exports,'cacheStats',Object.getOwnPropertyDescriptor(globalThis.LittleLife,'cacheStats'));
  }
})();
