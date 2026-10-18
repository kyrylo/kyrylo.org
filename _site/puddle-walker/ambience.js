import { randomSource } from './model.js?v=light-materials-135';

// Recorded outdoor footsteps; decoded once, only after the player enables sound.
// Source authors, licenses and edits are in assets/audio/credits.txt.
export const RECORDINGS = {
  pavement: 4, gravel: 4, water: 4, metal: 4, mud: 1, stone: 1, paper: 2,
};
const decoded = new WeakMap();
export function loadRecordings(context) {
  if (decoded.has(context)) return decoded.get(context);
  const work = (async () => {
    const clips = {}, queue = Object.entries(RECORDINGS).flatMap(([group,count]) =>
      Array.from({length:count},(_,i) => ({group,i})));
    // Four concurrent requests keep optional audio out of the image load burst.
    await Promise.all(Array.from({length:4},async () => {
      while(queue.length) {
        const {group,i} = queue.shift();
        try {
          const response = await fetch(new URL(`./assets/audio/${group}-${i}.mp3`,import.meta.url));
          if(!response.ok) continue;
          const buffer = await context.decodeAudioData(await response.arrayBuffer());
          (clips[group] ||= [])[i] = buffer;
        } catch { /* A missing sound stays silent; gameplay never waits for audio. */ }
      }
    }));
    for(const group of Object.keys(clips)) clips[group] = clips[group].filter(Boolean);
    return clips;
  })();
  decoded.set(context,work); return work;
}

export function createAmbience({load = loadRecordings} = {}) {
  let context, master, clips, loading, active = false, currentGame, random;
  const voices = new Set(), previous = new Map();
  function stop() {
    active = false;
    if(master) { master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(0,context.currentTime); }
    for(const voice of [...voices]) { try { voice.source.stop(); } catch {} voice.release(); }
  }
  function prepare(audioContext) {
    if(!audioContext) return Promise.resolve();
    if(context === audioContext) return loading;
    stop(); master?.disconnect(); context = audioContext; clips = null;
    master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
    const owner = context;
    loading = Promise.resolve().then(() => load(owner)).then(result => {
      if(context === owner) clips = result;
    }).catch(() => {});
    return loading;
  }
  function play(group,volume,x,rate=1,cutoff=0,tail=1) {
    const list = clips?.[group]; if(!list?.length || volume < .005 || voices.size >= 12) return;
    // Alternate recordings before changing pitch: preserve the texture of real contact.
    let index = Math.floor(random()*list.length);
    if(list.length > 1 && index === previous.get(group)) index = (index+1)%list.length;
    previous.set(group,index);
    const buffer = list[index],source = context.createBufferSource(),gain = context.createGain(),nodes = [source,gain];
    source.buffer = buffer; source.playbackRate.value = rate*(.98+random()*.04);
    const duration = Math.min(buffer.duration/source.playbackRate.value,tail),t = context.currentTime;
    gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(volume,t+.004);
    gain.gain.setValueAtTime(volume,t+Math.max(.005,duration-.035)); gain.gain.linearRampToValueAtTime(0,t+duration);
    let output = source;
    if(cutoff) { const filter = context.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=cutoff; filter.Q.value=.5; output.connect(filter); output=filter; nodes.push(filter); }
    output.connect(gain); output=gain;
    if(context.createStereoPanner) { const pan=context.createStereoPanner(); pan.pan.value=Math.max(-.65,Math.min(.65,(x-450)/650)); output.connect(pan); output=pan; nodes.push(pan); }
    output.connect(master);
    const voice = {source,release(){ for(const node of nodes)node.disconnect(); voices.delete(voice); }};
    voices.add(voice); source.onended=voice.release; source.start(t); source.stop(t+duration+.005);
  }
  function contact(event) {
    const x = event.side ? 580 : 320,force = Math.max(.25,Math.min(1.6,event.force ?? 1));
    const layers = event.contacts?.length ? event.contacts : [{surface:event.surface || 'asphalt',fraction:1,depth:event.depth ?? 5}];
    for(const layer of layers.filter(l=>l.fraction>=.015).slice(0,3)) {
      const gain = force*Math.sqrt(layer.fraction),depth = Math.min(1,(layer.depth || 0)/24);
      const sound = (group,volume,rate=1,cutoff=0,tail=1) => play(group,volume*gain,x,rate,cutoff,tail);
      switch(layer.surface) {
        case 'water': sound('water',.45+depth*.14,1-depth*.08,0,.24+depth*.45); break;
        case 'mud': case 'poop': sound('mud',.48,.96,1800); sound('water',.17,.93,1800,.28); break;
        case 'clay': sound('mud',.57,.88,1400); sound('water',.12,.92,1600,.22); break;
        case 'gravel': sound('gravel',.55); break;
        case 'cement': sound('gravel',.33,.95,2500); sound('mud',.28,1,2200); break;
        case 'metal': sound('metal',.42,1,5000); break;
        case 'stone': sound('stone',.44); break;
        case 'wood': sound('pavement',.3,.97,1500); break;
        case 'oil': case 'algae': sound('pavement',.27,1,2500); sound('water',.24,1.03,layer.surface==='oil'?1800:3200,.24); break;
        case 'tar': case 'gum': sound('pavement',.24,.96,2200); sound('mud',.26,1.08,2600,.3); break;
        default: sound('pavement',.48,1,layer.surface==='asphalt'?3600:0);
      }
    }
  }
  function update(audioContext,game,enabled,events=[]) {
    const arriving=game.phase==='finished'&&game.arrival&&!game.arrival.done;
    if(!enabled || (game.phase !== 'walking'&&!arriving) || !audioContext) { stop(); return; }
    prepare(audioContext);
    if(currentGame !== game) { stop(); currentGame=game; random=randomSource(game.street.seed^0x466f6f74); previous.clear(); }
    if(!active) { active=true; master.gain.setValueAtTime(.72,context.currentTime); }
    // Never replay stale impacts when the download completes, or on unmute.
    if(!clips) return;
    const landed=new Set(events.filter(e=>e.type==='land').map(e=>e.side));
    for(const event of events) {
      if(event.type==='land') contact(event);
      else if(event.type==='home-step') contact({...event,force:.55});
      else if(event.type==='wipe') play('paper',.16,event.side?580:320,.9,1800,.28);
      else if(event.type==='splash'&&!landed.has(event.side)) play('water',Math.min(.3,(event.intensity||.3)*.2),event.side?580:320,1,0,.4);
      else if(event.type==='paper') play('paper',.22*(event.force||1),event.x??(event.side?580:320),.9,2800,.35);
      else if(event.type==='wings') play('paper',.08,event.x,1.1,3500,.3);
      else if(event.type==='bump') play(event.obstacle==='car'?'pavement':'metal',.3*Math.max(.1,Math.min(1,event.force??.5)),event.side?580:320,.85,1800,.2);
    }
  }
  return {update,stop,prepare,isActive:()=>active,status:()=>({ready:Boolean(clips),groups:Object.keys(clips||{}),voices:voices.size})};
}
