const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import {mkdir,writeFile} from 'node:fs/promises';
const output='/tmp/elsewhere-performance';
await mkdir(output,{recursive:true});
const url=process.env.ELSEWHERE_URL || 'http://127.0.0.1:8244/elsewhere/';
const label=process.env.PERF_LABEL || 'current';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const width=Number(process.env.PERF_WIDTH || 1600), height=Number(process.env.PERF_HEIGHT || 1000);
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,timezoneId:'Asia/Tokyo'});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(!process.env.PERF_LIVE) await page.route('**/live-camera.js',r=>r.fulfill({contentType:'application/javascript',body:'export function createLiveCamera(){ return {load(){}}; }'}));
 const cdp=await context.newCDPSession(page);
 await cdp.send('Performance.enable');
 if(process.env.PERF_CPU) await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.PERF_CPU)});
 const started=Date.now();
 await page.goto(url,{waitUntil:'load'});
 if(process.env.PERF_LIVE) await page.waitForSelector('#camera-panel[data-state=playing]',{timeout:40000});
 const startupMs=Date.now()-started;
 await page.waitForTimeout(4200);
 const results={label,url,viewport:`${width}×${height} @2x`,cpu:Number(process.env.PERF_CPU || 1),live:!!process.env.PERF_LIVE,startupMs,errors,phases:[]};
 for(const phase of ['idle','travel']) {
  const events=[];
  const listener=({value})=>events.push(...value);
  cdp.on('Tracing.dataCollected',listener);
  await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing',transferMode:'ReportEvents'});
  const before=await cdp.send('Performance.getMetrics');
  const frameResult=await page.evaluate(async phase=>{
   const intervals=[];const start=performance.now();let previous=start,index=0;
   const destinations=['rio','reykjavik','venice','new-york','tokyo','santa-maria','jerusalem','taipei'];
   const times=[];
   let interval;
   if(phase==='travel') interval=setInterval(()=>{
    if(index>=destinations.length){clearInterval(interval);return;}
    const begin=performance.now();document.querySelector(`.city-stop[data-city="${destinations[index++]}"]`).click();
    times.push(performance.now()-begin);
   },350);
   await new Promise(resolve=>{function frame(now){intervals.push(now-previous);previous=now;if(now-start<6500)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
   clearInterval(interval);
   intervals.shift();intervals.sort((a,b)=>a-b);
   return {frames:intervals.length,p50:intervals[Math.floor(intervals.length*.5)],p95:intervals[Math.floor(intervals.length*.95)],p99:intervals[Math.floor(intervals.length*.99)],over25:intervals.filter(x=>x>25).length,over50:intervals.filter(x=>x>50.5).length,interactionMs:times};
  },phase);
  const after=await cdp.send('Performance.getMetrics');
  const complete=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
  await cdp.send('Tracing.end');await complete;
  cdp.off('Tracing.dataCollected',listener);
  const metric=(collection,name)=>collection.metrics.find(m=>m.name===name)?.value||0;
  const timings={};
  for(const event of events) if(event.ph==='X' && event.dur && ['Paint','PrePaint','UpdateLayoutTree','Layout','RasterTask','FunctionCall','Layerize'].includes(event.name)) {
   const entry=timings[event.name] ||= {count:0,ms:0};entry.count++;entry.ms+=event.dur/1000;
  }
  const metrics={};for(const name of ['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'])metrics[name]=metric(after,name)-metric(before,name);
  const result={phase,...frameResult,metrics,timings};results.phases.push(result);console.log(JSON.stringify(result));
  await writeFile(`${output}/${label}-${phase}-trace.json`,JSON.stringify({traceEvents:events}));
 }
 await page.screenshot({path:`${output}/${label}.png`});
 await writeFile(`${output}/${label}.json`,JSON.stringify(results,null,2));
 console.log('RESULT',label,'errors',errors);
}finally{await browser.close();}
