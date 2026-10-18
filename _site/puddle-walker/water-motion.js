// Reflection-only geometry. It reads contact waves without advancing physics or
// consuming the level's random stream, so rendering cannot change a race.
const TAU=Math.PI*2;
export function rippleProfile(r,reduced=false){
  const type=r.patch.type,viscosity=type==='mud'?.62:type==='oil'?.76:1;
  const lifetime=type==='mud'?.95:type==='oil'?1.2:1.5;
  if(reduced||r.age<0||r.age>=lifetime||r.strength<=0)return null;
  const strength=Math.min(1,r.strength),spread=r.age*40*viscosity;
  const fade=Math.pow(1-r.age/lifetime,1.35)*strength*Math.min(1,r.age/.035);
  return {rx:(r.rx??10)+spread,ry:(r.ry??7.8)+spread*.88,fade,
    width:2.2+r.age*2.4,displacement:fade*(type==='water'?2.8:.8),
    secondary:r.age>.12&&r.age<lifetime*.78};
}

// Sixteen narrow pieces of a wave front. Only these small rectangles need to
// sample the photograph; the shoreline and road texture are never displaced.
export function reflectionFacets(r,p){
  const facets=[],rotation=r.angle||0,c=Math.cos(rotation),s=Math.sin(rotation);
  const point=(a,extra)=>{const x=Math.cos(a)*(p.rx+extra),y=Math.sin(a)*(p.ry+extra);return {x:r.x+x*c-y*s,y:-r.y+x*s+y*c};};
  for(let i=0;i<16;i++){
    const a0=i*TAU/16,a1=(i+1)*TAU/16,am=(a0+a1)/2;
    const points=[point(a0,p.width),point(am,p.width),point(a1,p.width),point(a1,-p.width),point(am,-p.width),point(a0,-p.width)];
    // Normal of an ellipse, rotated with the shoe's contact patch.
    const nx=Math.cos(am)/p.rx,ny=Math.sin(am)/p.ry,n=Math.hypot(nx,ny);
    const dx=(nx*c-ny*s)/n*p.displacement,dy=(nx*s+ny*c)/n*p.displacement;
    facets.push({points,dx,dy,x0:Math.min(...points.map(p=>p.x))-1,y0:Math.min(...points.map(p=>p.y))-1,
      x1:Math.max(...points.map(p=>p.x))+1,y1:Math.max(...points.map(p=>p.y))+1});
  }
  return facets;
}

// Crop in destination space first, preserving the photograph's world anchor.
// At a photo boundary we trim the sample instead of stretching its last pixel.
export function reflectionSample(group,facet,imageWidth,imageHeight){
  const left=group.x0,top=-group.y1,w=group.x1-left,h=group.y1-group.y0;
  const x0=Math.max(facet.x0,left+facet.dx),y0=Math.max(facet.y0,top+facet.dy);
  const x1=Math.min(facet.x1,left+w+facet.dx),y1=Math.min(facet.y1,top+h+facet.dy);
  if(x1<=x0||y1<=y0)return null;
  return {sx:(x0-facet.dx-left)/w*imageWidth,sy:(y0-facet.dy-top)/h*imageHeight,
    sw:(x1-x0)/w*imageWidth,sh:(y1-y0)/h*imageHeight,
    x:x0,y:y0,w:x1-x0,h:y1-y0};
}
