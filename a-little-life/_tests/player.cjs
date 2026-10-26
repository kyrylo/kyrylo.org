const fs=require('fs'),vm=require('vm'),assert=require('assert');const {createCanvas}=require('@napi-rs/canvas');const root=require('node:path').resolve(__dirname,'../..');const LittleLife=require('../drawing.js');
function element(){return{value:0,textContent:'',attrs:{},style:{setProperty(){}},firstElementChild:{className:''},classList:{add(){},remove(){}},listeners:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.listeners[k]=f;}};}
function harness(reduced=false){
 const els=Object.fromEntries(['life','play','replay','timeline','age','age-display','chapter'].map(k=>[k,element()]));
 const cv=createCanvas(1176,580);Object.assign(els.life,{getContext:()=>cv.getContext('2d'),getBoundingClientRect:()=>({width:1176,height:580})});
 const media={matches:reduced,addEventListener(k,f){this.changed=f;}};
 const frames=new Map(),events={},windowEvents={};let n=0,intersection;
 const rootStyles={};const d={documentElement:{style:{setProperty(k,v){rootStyles[k]=v;}}},getElementById:k=>els[k],hidden:false,activeElement:{tagName:'BODY'},addEventListener(k,f){events[k]=f;},fonts:{ready:{then(f){f();}}}};
 let rendered=0,fontsInvalidated=0;
 const engine={duration:76,chapters:LittleLife.chapters,age:LittleLife.age,heartLayout:LittleLife.heartLayout,paper:LittleLife.paper,draw(){rendered++;},fontsChanged(){fontsInvalidated++;}};
 const sandbox={LittleLife:engine,console,devicePixelRatio:2,matchMedia:()=>media,requestAnimationFrame:f=>{frames.set(++n,f);return n;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{observe(){}},IntersectionObserver:class{constructor(f){intersection=f;}observe(){}},setTimeout,clearTimeout,document:d,window:{addEventListener(k,f){windowEvents[k]=f;}}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(root+'/a-little-life/player.js','utf8'),sandbox);
 const tick=now=>{const q=[...frames.entries()];frames.clear();for(const[,f]of q)f(now);};
 return {els,media,frames,events,windowEvents,d,tick,intersection:val=>intersection([{isIntersecting:val}]),get rendered(){return rendered},get fontsInvalidated(){return fontsInvalidated},rootStyles};
}

const h=harness();assert.equal(h.frames.size,1);assert.equal(h.els.age.textContent,4);
h.tick(10);h.tick(110);assert(h.els.timeline.value>.09,'Autoplay does not advance');
const heart=LittleLife.heartLayout(1176,580);assert.equal(h.els['age-display'].style.left,heart.x+'px');assert.equal(h.els['age-display'].style.top,(heart.top+heart.height*.53)+'px');
h.els.play.listeners.click();assert.equal(h.frames.size,0);const n=h.rendered;h.tick(500);assert.equal(h.rendered,n);
h.els.timeline.value=51;h.els.timeline.listeners.input();assert.equal(h.els.age.textContent,63);assert.equal(h.els.chapter.textContent,LittleLife.chapters.find(([time])=>time===51)[1]);assert.equal(h.els.timeline.attrs['aria-valuetext'],'Age 63');
h.els.play.listeners.click();assert.equal(h.frames.size,1);
for(const finish of [()=>h.windowEvents.pointerup(),()=>h.windowEvents.pointercancel(),()=>h.windowEvents.blur(),()=>h.els.timeline.listeners.lostpointercapture(),()=>h.els.timeline.listeners.blur()]){h.els.timeline.listeners.pointerdown();assert.equal(h.frames.size,0);finish();assert.equal(h.frames.size,1);}
h.d.hidden=true;h.events.visibilitychange();assert.equal(h.frames.size,0);h.d.hidden=false;h.events.visibilitychange();assert.equal(h.frames.size,1);
h.intersection(false);assert.equal(h.frames.size,0);h.intersection(true);assert.equal(h.frames.size,1);
h.els.timeline.value=76;h.els.timeline.listeners.input();assert.equal(h.frames.size,0);assert.equal(h.els.age.textContent,89);h.els.play.listeners.click();assert.equal(h.els.timeline.value,0);assert.equal(h.frames.size,1);
for(let i=0;i<800;i++)h.tick(1000+i*100);assert.equal(h.frames.size,0);assert.equal(h.els.age.textContent,89);
h.els.replay.listeners.click();assert.equal(h.els.timeline.value,0);assert.equal(h.frames.size,1);h.els.play.listeners.click();assert.equal(h.frames.size,0);
const r=harness(true);assert.equal(r.frames.size,0);r.els.replay.listeners.click();assert.equal(r.frames.size,1,'Explicit replay must work with reduced motion enabled');r.media.changed({matches:true});assert.equal(r.frames.size,0);r.els.play.listeners.click();assert.equal(r.frames.size,1);r.els.play.listeners.click();assert.equal(r.frames.size,0);
console.log('Passed: autoplay, age placement, timeline seeking, all drag-release paths, pause/resume, hidden/offscreen suspension, ending/restarting, and explicit replay with reduced motion.');
