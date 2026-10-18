import {createDenimWear,updateDenimWear,paintDenimWear} from './denim-wear.js?v=clear-step-133';
// Material coordinates run from cuff (v=0) to thigh (v=1). The same cloth
// vertices carry the weave, creases, stitching and dirt through every pose.
const WIDTH=96,HEIGHT=512,BANDS=24;
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const curve=(a,b,c,d,t,p)=>{p.x=(1-t)**3*a.x+3*(1-t)**2*t*b.x+3*(1-t)*t*t*c.x+t**3*d.x;p.y=(1-t)**3*a.y+3*(1-t)**2*t*b.y+3*(1-t)*t*t*c.y+t**3*d.y;return p;};
export function legRows(pose,shoe,side,lift,center,viewH,breath=0,rows=[]){
  const ca=Math.cos(pose.angle),sa=Math.sin(pose.angle);
  const ankle={x:pose.x-shoe.length*.17*pose.sy*sa,y:pose.y+shoe.length*.17*pose.sy*ca};
  const hip={x:center+(side?38:-38),y:viewH+28+breath};
  const knee={x:hip.x*.44+ankle.x*.56+(side?1:-1)*(4+lift*.16),y:hip.y*.48+ankle.y*.52-lift*.12};
  const shin={x:ankle.x-sa*24,y:ankle.y+ca*24};
  // Shared tangents keep the cloth from kinking or changing density at the knee.
  const tangent={x:(hip.x-ankle.x)*.18,y:(hip.y-ankle.y)*.18};
  const below={x:knee.x-tangent.x,y:knee.y-tangent.y},above={x:knee.x+tangent.x,y:knee.y+tangent.y};
  const thigh={x:mix(knee.x,hip.x,2/3),y:mix(knee.y,hip.y,2/3)};
  const kneeAngle=Math.atan2(ankle.x-hip.x,hip.y-ankle.y)*.45;
  const point={};
  for(let i=0;i<=BANDS;i++){
    const v=i/BANDS,lower=v<=.5,t=lower?v*2:(v-.5)*2;
    const p=lower?curve(ankle,shin,below,knee,t,point):curve(knee,above,thigh,hip,t,point);
    const angle=lower?mix(pose.angle,kneeAngle,smooth(t)):mix(kneeAngle,0,smooth(t));
    const width=lower?mix(shoe.width*.54*pose.sx,24,smooth(t)):mix(24,28,smooth(t));
    const dx=Math.cos(angle)*width,dy=Math.sin(angle)*width;
    const row=rows[i]||={left:{},right:{},v};
    row.left.x=p.x-dx;row.left.y=p.y-dy;row.right.x=p.x+dx;row.right.y=p.y+dy;
  }
  return rows;
}

// Hit the visible cloth outline, so tapping the road between the legs still steps.
export function legContains(rows,x,y){
  const count=rows.length*2;
  const vertex=i=>i<rows.length?rows[i].left:rows[count-1-i].right;
  let inside=false;
  for(let i=0,j=count-1;i<count;j=i++){
    const a=vertex(i),b=vertex(j);
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

export function createDenim(image){
  const make=()=>{const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;return c;};
  const bases=[0,1].map(side=>{
    const canvas=make(),c=canvas.getContext('2d');
    c.fillStyle=image?c.createPattern(image,'repeat'):'#395d79';c.fillRect(0,0,WIDTH,HEIGHT);
    c.fillStyle='#25415650';c.fillRect(0,0,WIDTH,HEIGHT);
    const light=c.createLinearGradient(0,0,WIDTH,0);
    for(const [p,color] of [[0,'#071d3088'],[.3,'#b5cad524'],[.58,'#91b1ce0e'],[1,'#071d30a0']])light.addColorStop(p,color);
    c.fillStyle=light;c.fillRect(0,0,WIDTH,HEIGHT);
    // Fixed, irregular folds compress with the leg instead of drifting over it.
    for(const [y,slant,strength] of [[31,5,.6],[55,-7,.4],[86,9,.3],[228,12,.3],[253,-9,.5],[277,7,.25]]){
      const shift=side?3:-3;c.lineCap='round';
      c.strokeStyle=`rgba(12,33,48,${strength})`;c.lineWidth=3;
      c.beginPath();c.moveTo(8,y+slant);c.bezierCurveTo(31,y-4+shift,58,y+6,87,y-slant);c.stroke();
      c.strokeStyle=`rgba(166,184,194,${strength*.55})`;c.lineWidth=1.3;
      c.beginPath();c.moveTo(12,y+slant+3);c.bezierCurveTo(31,y+shift,58,y+9,83,y-slant+3);c.stroke();
    }
    c.strokeStyle='#b0ad8765';c.lineWidth=1.15;c.setLineDash([3,2]);
    c.beginPath();c.moveTo(side?85:11,0);c.lineTo(side?85:11,HEIGHT);c.stroke();c.setLineDash([]);
    c.fillStyle='#23465c';c.fillRect(0,0,WIDTH,12);
    c.strokeStyle='#b6bab386';c.lineWidth=1.3;c.beginPath();c.moveTo(0,3);c.lineTo(WIDTH,3);c.stroke();
    return canvas;
  });
  const stained=[make(),make()],revisions=[-1,-1];let owner,wear;
  function material(g,f){
    if(owner!==g){owner=g;revisions.fill(-1);wear=[createDenimWear(0),createDenimWear(1)];}
    const state=updateDenimWear(wear[f.side],g,f);
    if(revisions[f.side]!==state.revision){
      const c=stained[f.side].getContext('2d');c.clearRect(0,0,WIDTH,HEIGHT);c.drawImage(bases[f.side],0,0);
      paintDenimWear(c,state);revisions[f.side]=state.revision;
    }
    return stained[f.side];
  }
  function triangle(ctx,texture,a,b,c,sy,sh,second){
    // Subpixel overlap prevents hairline cracks between opaque mesh triangles.
    const mx=(a.x+b.x+c.x)/3,my=(a.y+b.y+c.y)/3;
    ctx.save();ctx.beginPath();
    for(let i=0;i<3;i++){
      const p=i===0?a:i===1?b:c;
      const d=Math.hypot(p.x-mx,p.y-my)||1,x=p.x+(p.x-mx)/d*.45,y=p.y+(p.y-my)/d*.45;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.clip();
    const ax=second?(b.x-c.x)/WIDTH:(b.x-a.x)/WIDTH,ay=second?(b.y-c.y)/WIDTH:(b.y-a.y)/WIDTH;
    const bx=second?(b.x-a.x)/sh:(c.x-a.x)/sh,by=second?(b.y-a.y)/sh:(c.y-a.y)/sh;
    ctx.transform(ax,ay,bx,by,a.x-(second?ax*WIDTH:0)-bx*sy,a.y-(second?ay*WIDTH:0)-by*sy);
    ctx.drawImage(texture,0,Math.max(0,sy-1),WIDTH,Math.min(HEIGHT,sy+sh+1)-Math.max(0,sy-1),0,Math.max(0,sy-1),WIDTH,Math.min(HEIGHT,sy+sh+1)-Math.max(0,sy-1));
    ctx.restore();
  }
  return (ctx,g,f,rows,bottom=Infinity)=>{
    const texture=material(g,f);
    ctx.save();ctx.beginPath();ctx.moveTo(rows[0].left.x,rows[0].left.y);
    for(let i=1;i<rows.length;i++)ctx.lineTo(rows[i].left.x,rows[i].left.y);
    for(let i=rows.length-1;i>=0;i--)ctx.lineTo(rows[i].right.x,rows[i].right.y);
    ctx.closePath();ctx.strokeStyle='#101b2940';ctx.lineWidth=3;ctx.stroke();
    // Keep antialiased triangle edges opaque; otherwise bits of moving road
    // bleed through the fabric and look like a shimmering weave.
    ctx.fillStyle='#26475f';ctx.fill();ctx.clip();
    for(let i=0;i<BANDS;i++){
      const a=rows[i],b=rows[i+1],sy=i*HEIGHT/BANDS,sh=HEIGHT/BANDS;
      // The hip extends beyond the screen. Keep its mesh for hit testing and
      // the cloth outline, but do not submit invisible texture triangles.
      // One world pixel includes the triangle's subpixel seam overlap.
      if(Math.min(a.left.y,a.right.y,b.left.y,b.right.y)>bottom+1)continue;
      triangle(ctx,texture,a.left,a.right,b.left,sy,sh,false);
      triangle(ctx,texture,a.right,b.right,b.left,sy,sh,true);
    }
    ctx.restore();
  };
}
