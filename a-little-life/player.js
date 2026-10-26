(() => {
  'use strict';
  const canvas=document.getElementById('life');
  const ctx=canvas.getContext('2d',{alpha:true});
  const play=document.getElementById('play');
  const replay=document.getElementById('replay');
  const slider=document.getElementById('timeline');
  const age=document.getElementById('age');
  const ageDisplay=document.getElementById('age-display');
  const caption=document.getElementById('chapter');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let time=0,paused=motion.matches,inView=true,scrubbing=false;
  let frameId=0,last=0,lastUI=-Infinity,width=0,height=0,chapter=-1,shownAge=-1,captionTimer=0;
  const canRun=()=>!paused&&!scrubbing&&inView&&!document.hidden&&time<LittleLife.duration;

  function updateUI(instant=false) {
    document.documentElement.style.setProperty('--paper',LittleLife.paper(time));
    slider.value=time;
    slider.style.setProperty('--position',`${time/LittleLife.duration*100}%`);
    const years=LittleLife.age(time);
    if(years!==shownAge){shownAge=years;age.textContent=years;slider.setAttribute('aria-valuetext',`Age ${years}`);}
    const next=LittleLife.chapters.findLastIndex(c=>time>=c[0]);
    if(next!==chapter||instant){
      chapter=next;clearTimeout(captionTimer);
      if(instant||paused||motion.matches){caption.textContent=LittleLife.chapters[next][1];caption.classList.remove('changing');}
      else {caption.classList.add('changing');captionTimer=setTimeout(()=>{caption.textContent=LittleLife.chapters[chapter][1];caption.classList.remove('changing');},450);}
    }
  }
  function render(instant=false){if(width&&height)LittleLife.draw(ctx,width,height,time);if(instant)updateUI(true);}
  function controls(){play.setAttribute('aria-label',paused?'Play animation':'Pause animation');play.firstElementChild.className=paused?'play-symbol':'pause-symbol';}
  function cancel(){if(frameId)cancelAnimationFrame(frameId);frameId=0;last=0;}
  function schedule(){if(canRun()&&!frameId)frameId=requestAnimationFrame(frame);}
  function frame(now){
    frameId=0;
    if(!canRun()){last=0;return;}
    if(last)time=Math.min(LittleLife.duration,time+Math.min((now-last)/1000,.1));
    last=now;render();
    // The artwork runs at the display rate; the age and caption only need 10 Hz.
    if(now-lastUI>=100){updateUI();lastUI=now;}
    if(time>=LittleLife.duration){paused=true;controls();updateUI(true);last=0;}
    else schedule();
  }
  function size(){
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    if(!rect.width||!rect.height)return;
    const pixelsW=Math.round(rect.width*dpr),pixelsH=Math.round(rect.height*dpr);
    if(pixelsW===canvas.width&&pixelsH===canvas.height&&width===rect.width)return;
    width=rect.width;height=rect.height;canvas.width=pixelsW;canvas.height=pixelsH;
    const heart=LittleLife.heartLayout(width,height);
    ageDisplay.style.left=`${heart.x}px`;
    ageDisplay.style.top=`${heart.top+heart.height*.53}px`;
    ctx.setTransform(pixelsW/width,0,0,pixelsH/height,0,0);render(true);
  }
  function toggle(){
    if(time>=LittleLife.duration)time=0;
    paused=!paused;cancel();controls();render(true);schedule();
  }
  play.addEventListener('click',toggle);
  // An explicit replay is a request to move, even when autoplay is disabled.
  replay.addEventListener('click',()=>{cancel();time=0;paused=false;scrubbing=false;controls();render(true);schedule();});
  slider.addEventListener('input',()=>{time=Number(slider.value);last=0;if(time>=LittleLife.duration){paused=true;cancel();}controls();render(true);});
  slider.addEventListener('pointerdown',()=>{scrubbing=true;cancel();});
  function finishScrub(){if(scrubbing){scrubbing=false;schedule();}}
  window.addEventListener('pointerup',finishScrub);
  window.addEventListener('pointercancel',finishScrub);
  window.addEventListener('blur',finishScrub);
  slider.addEventListener('lostpointercapture',finishScrub);
  slider.addEventListener('blur',finishScrub);
  document.addEventListener('keydown',e=>{
    if(e.code==='Space'&&!['INPUT','BUTTON','A','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();toggle();}
  });
  motion.addEventListener('change',e=>{if(e.matches){paused=true;cancel();controls();render(true);}});
  document.addEventListener('visibilitychange',()=>{cancel();schedule();});
  if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)schedule();else cancel();},{threshold:0}).observe(canvas);
  new ResizeObserver(size).observe(canvas);
  document.fonts.ready.then(()=>{LittleLife.fontsChanged();render(true);});
  controls();size();schedule();
})();
