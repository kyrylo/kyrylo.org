import { createRaceClock, formatRaceTime, readRaceBests } from './race-clock.js?v=light-materials-135';
import { ROAD, STRETCH, SHOES, districtAt, createGame, setShoeMask, planStep, suggestStep, takeStep, selectFoot, recoveryBarrier, recoverFooting, cancelStep, advance, condition, progress } from './model.js?v=light-materials-135';
import { createRenderer } from './render.js?v=light-materials-135';
import { createAmbience } from './ambience.js?v=light-materials-135';
import { beginHomeArrival, advanceHomeArrival } from './home-arrival.js?v=light-materials-135';
const $ = id => document.getElementById(id), canvas = $('street'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
// Replacing identical text still rebuilds DOM text nodes and can force layout
// before the next canvas coordinate read. Only touch values that have changed.
const text = (element,value) => { if(element.textContent!==value)element.textContent=value; };
const data = (key,value) => { if(canvas.dataset[key]!==String(value))canvas.dataset[key]=value; };
const attribute = (key,value) => { value=String(value);if(canvas.getAttribute(key)!==value)canvas.setAttribute(key,value); };
const keys = new Set();
const race = createRaceClock(() => performance.now()), raceStorageKey = 'puddle-walker-clean-times-walking-v8';
let raceBests = {};
const soundStorageKey = 'puddle-walker-sound';
let game = createGame(), pointer = null, inputMode = 'pointer', pointerPosition = null, aimCache = '', lastFrame = 0, lastHud = 0, audioOn = false, audioContext, resultShown = false, needsPaint = true, arrival = null;
const times = [], frames = []; let lastMetrics = 0;
let queuedStep = null;
let pointerTarget = null, shoeDrag = null;
let aimedPoint = null;
const STEP_GRACE = .22;
let frameRequested=false;
function requestFrame(){if(!frameRequested){frameRequested=true;requestAnimationFrame(frame);}}
const ambience = createAmbience();
try { raceBests = readRaceBests(localStorage.getItem(raceStorageKey)); } catch {}
try { audioOn = localStorage.getItem(soundStorageKey) === 'true'; } catch {}
const renderer = await createRenderer(canvas, null, $('result-inspection'));
if (renderer.mask) setShoeMask(game, renderer.mask);
await renderer.prime?.(game,reduced.matches);
updateSoundControl();
$('start').disabled = false;
$('start').setAttribute('aria-busy','false');
text($('loading-status'),'');
$('loading-status').hidden = true;
canvas.dataset.assetsReady = renderer.assetsReady;
function updateSoundControl() {
  $('sound').setAttribute('aria-pressed', audioOn);
  $('sound').setAttribute('aria-label', audioOn ? 'Disable sounds' : 'Enable sounds');
  $('sound').setAttribute('title', audioOn ? 'Sound on' : 'Sound off');
}
function unlockAudio() {
  if (!audioOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    ambience.prepare(audioContext);
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  } catch {}
}
function hud() {
  canvas.tabIndex = game.phase === 'walking' ? 0 : -1;
  attribute('aria-hidden', game.phase !== 'walking');
  const phase=arrival?'arriving':game.phase;
  if(canvas.parentElement.dataset.phase!==phase)canvas.parentElement.dataset.phase=phase;
  data('arrival',game.arrival?.stage || '');
  text($('goal-condition'),condition(game).toFixed(1) + '%');
  const metres = progress(game) * ROAD.metres;
  const district=districtAt(ROAD.start+metres/ROAD.metres*ROAD.length);
  text($('district-name'),district.name);
  canvas.dataset.district=district.id;
  text($('distance'),metres.toFixed(1)); $('progress-fill').style.transform = `scaleX(${progress(game)})`;
  text($('race-time'),formatRaceTime(race.elapsed()));
  canvas.dataset.raceTime = race.elapsed().toFixed(0);
  const recovery=Boolean(recoveryBarrier(game));
  $('make-room').hidden=!recovery;
  $('make-room').disabled=game.mode!=='idle';
  data('activeFoot',String(game.active));
  $('control-hint').hidden = game.phase !== 'walking' || game.steps >= 4 || recovery;
  text($('control-hint'),inputMode === 'keyboard' ? 'Arrows aim · Space steps' : 'Tap ahead to step · Or drag either shoe');
  data('mode',game.mode); data('phase',game.phase); data('steps',game.steps); data('seed',game.street.seed);
  data('queued',String(Boolean(queuedStep)));
  attribute('aria-label', game.phase === 'finished' ? `Home after ${ROAD.metres} metres. ${condition(game).toFixed(1)} percent clean. Time ${formatRaceTime(race.elapsed())}.` : `${game.active ? 'Right' : 'Left'} foot next. ${metres.toFixed(1)} of ${ROAD.metres} metres. ${condition(game).toFixed(1)} percent clean. Click or tap where the next foot should land, or drag either shoe and release to step. Tap a shoe or press F to switch feet, then step sideways around obstacles. A short step toward the other shoe can shorten a stretched stance without losing distance.${recovery ? ' Press R to make room beside this barrier.' : ''} Arrow keys adjust the footprint; hold Shift for fine aiming. Space or Enter commits the selected move.`);
}
function clearInput(keepHover = false, keepQueuedStep = false) {
  const captured = pointer; pointer = null;
  if (captured !== null && canvas.hasPointerCapture(captured)) canvas.releasePointerCapture(captured);
  if (!keepHover) pointerPosition = null;
  if (!keepQueuedStep) queuedStep = null;
  pointerTarget = shoeDrag = null; canvas.dataset.pointer = 'ground';
  game.precisionAim = false; aimCache = ''; keys.clear();
}
function requestStep(point = null) {
  if (game.phase !== 'walking') return false;
  if (game.mode === 'idle') {
    queuedStep = null;
    if (point) planStep(game, point); else if (!game.preview) suggestStep(game);
    const taken = takeStep(game);
    if (taken) aimedPoint = null;
    return taken;
  }
  if (['flight','settling'].includes(game.mode)) {
    // One short-lived request absorbs a slightly early tap, never a chain of steps.
    // Keep a clicked spot in world coordinates while the camera catches up.
    queuedStep = {point, until:game.time + STEP_GRACE};
    return true;
  }
  return false;
}
function switchFoot(side) {
  const target = aimedPoint;
  if (!selectFoot(game, side)) return false;
  clearInput();
  if (target) aimAt(target);
  needsPaint = true; hud(); canvas.focus({preventScroll:true});
  return true;
}
function makeRoom() {
  if(game.phase!=='walking'||game.mode!=='idle')return false;
  clearInput();aimedPoint=null;
  if(!recoverFooting(game))return false;
  needsPaint=true;hud();canvas.focus({preventScroll:true});
  return true;
}
function reset(sameStreet = false) {
  ambience.stop(); race.reset();
  cancelStep(game); clearInput(); game = createGame('leather', sameStreet ? game.street.seed : undefined); if (renderer.mask) setShoeMask(game, renderer.mask);
  aimedPoint = null;
  resultShown = false; arrival = null; $('welcome').hidden = false; $('result').hidden = true;
  needsPaint = true; lastFrame = performance.now(); times.length = frames.length = 0; hud(); requestFrame(); $('start').focus({preventScroll:true});
}
function start() { race.start(); unlockAudio(); game.phase = 'walking'; $('welcome').hidden = true; lastFrame = performance.now(); suggestStep(game); hud(); requestFrame(); canvas.focus({preventScroll:true}); }
function finish() {
  ambience.stop();
  if (resultShown) return; resultShown = true; needsPaint = true; clearInput();
  const clean = Number(condition(game).toFixed(1));
  const finishTime = race.finish(), previousBest = raceBests[game.shoeId];
  race.split(STRETCH.count-1);
  const cleanRecord = clean >= 95 && finishTime > 0 && (!previousBest || finishTime < previousBest);
  if (cleanRecord) {
    raceBests[game.shoeId] = finishTime;
    try { localStorage.setItem(raceStorageKey, JSON.stringify(raceBests)); } catch {}
  }
  $('result-time').textContent = formatRaceTime(finishTime);
  $('result-time-best').hidden = clean < 95;
  $('result-time-best').textContent = cleanRecord ? 'New best time' : previousBest ? `Best ${formatRaceTime(previousBest)}` : '';
  $('result-time-best').dataset.record = String(cleanRecord);
  $('result-clean').textContent = clean.toFixed(1) + '%';
  // Bank the result before any automatic wiping or walking inside.
  arrival = beginHomeArrival(game,ROAD.finish,{reduced:reduced.matches});
  hud();
}
function footAtPointer(e) {
  if (game.mode !== 'idle') return null;
  const point = renderer.worldPoint(e.clientX, e.clientY), shoe = SHOES[game.shoeId];
  // On a phone the shoe is narrower than a fingertip. Use a 44 px touch area
  // and pick the nearest shoe where the two areas overlap.
  const touch = e.pointerType === 'touch';
  const rx = Math.max(shoe.width * .9, touch ? Math.abs(renderer.worldPoint(e.clientX + 22, e.clientY).x - point.x) : 0);
  const ry = Math.max(shoe.length * .6, touch ? Math.abs(renderer.worldPoint(e.clientX, e.clientY + 22).y - point.y) : 0);
  const nearest = game.feet.map(f => ({side:f.side, distance:((point.x-f.x)/rx)**2+((point.y-f.y)/ry)**2})).sort((a,b)=>a.distance-b.distance)[0];
  return nearest.distance <= 1 ? nearest.side : renderer.legAtPoint(e.clientX, e.clientY);
}
function aimAt(point) {
  const preview = planStep(game, point);
  if (preview) {
    aimedPoint = {x:point.x,y:point.y};
    // Pointer input already computed this landing. Reuse it for the frame;
    // a camera change, foot switch or cleared preview still requests a new one.
    aimCache = `${game.active}:${point.x.toFixed(1)}:${point.y.toFixed(1)}`;
  }
  return preview;
}
function aimAtPointer(e) {
  inputMode = 'pointer'; aimCache = '';
  const position = insideCanvas(e) ? {x:e.clientX,y:e.clientY} : null;
  const moved = !pointerPosition || !position || position.x !== pointerPosition.x || position.y !== pointerPosition.y;
  pointerPosition = position;
  if (!pointerPosition) { game.preview = null; pointerTarget = aimedPoint = null; game.precisionAim = false; return null; }
  // Hovering a planted shoe is a selection gesture, not a new landing spot.
  // Keep the preview while the pointer travels to the other shoe or a control.
  if (pointer === null && footAtPointer(e) !== null) {
    pointerPosition = pointerTarget = null; canvas.dataset.pointer = 'shoe';
    game.precisionAim = false; return game.preview;
  }
  if (shoeDrag && !shoeDrag.moved) {
    shoeDrag.moved = Math.hypot(e.clientX - shoeDrag.x, e.clientY - shoeDrag.y) >= 7;
    if (!shoeDrag.moved) { game.preview = null; game.precisionAim = false; return null; }
  }
  // A held aim belongs to a patch of pavement, even while the camera eases.
  // Only an actual pointer movement changes it; release must use that same spot.
  if (pointer === null || moved || !pointerTarget) {
    const point = renderer.worldPoint(e.clientX, e.clientY);
    pointerTarget = {x:point.x + (shoeDrag?.offset.x || 0), y:point.y + (shoeDrag?.offset.y || 0)};
  }
  canvas.dataset.pointer = shoeDrag ? 'dragging' : footAtPointer(e) !== null ? 'shoe' : 'ground';
  game.precisionAim = pointer !== null && e.pointerType === 'touch' && Boolean(pointerPosition);
  return aimAt(pointerTarget);
}
function insideCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  return e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
}
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0 || pointer !== null || game.phase !== 'walking') return;
  e.preventDefault();
  const side = footAtPointer(e);
  if (side !== null) {
    switchFoot(side);
    const point = renderer.worldPoint(e.clientX, e.clientY), foot = game.feet[side];
    shoeDrag = {x:e.clientX, y:e.clientY, offset:{x:foot.x-point.x,y:foot.y-point.y}, moved:false, target:game.preview, intent:aimedPoint};
    canvas.dataset.pointer = 'shoe';
  }
  keys.clear(); queuedStep = null; pointerTarget = pointerPosition = null; pointer = e.pointerId; aimAtPointer(e);
  canvas.setPointerCapture(pointer); canvas.focus({preventScroll:true});
});
canvas.addEventListener('pointermove', e => {
  if (pointer !== null && e.pointerId !== pointer) return;
  if (pointer === null && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
  if (pointer === null && keys.size) return;
  if (pointer !== null) e.preventDefault();
  aimAtPointer(e);
});
canvas.addEventListener('pointerup', e => {
  if (e.pointerId !== pointer) return;
  const selectedOnly = shoeDrag && !shoeDrag.moved && Math.hypot(e.clientX-shoeDrag.x,e.clientY-shoeDrag.y) < 7;
  if (insideCanvas(e)) {
    aimAtPointer(e);
    if (selectedOnly) {
      if (shoeDrag.target) planStep(game, shoeDrag.target); else suggestStep(game);
      aimedPoint = shoeDrag.intent;
    } else requestStep(pointerTarget);
  } else { game.preview = null; queuedStep = aimedPoint = null; }
  clearInput(e.pointerType !== 'touch' && !selectedOnly, true); hud();
});
canvas.addEventListener('pointercancel', e => { if (e.pointerId === pointer) { cancelStep(game); clearInput(); aimedPoint = null; } });
canvas.addEventListener('lostpointercapture', e => { if (e.pointerId === pointer) { cancelStep(game); clearInput(); aimedPoint = null; } });
canvas.addEventListener('pointerleave', () => { if (pointer === null && inputMode === 'pointer') { pointerPosition = pointerTarget = null; canvas.dataset.pointer = 'ground'; aimCache = ''; } });
function nudgeTarget(x, y, distance) {
  if (game.mode !== 'idle') return;
  const target = game.preview || suggestStep(game);
  if (!target) return;
  const length = Math.hypot(x, y) || 1;
  aimAt({x:target.x + x / length * distance, y:target.y + y / length * distance});
}
canvas.addEventListener('keydown', e => {
  if (e.key === 'Shift' && game.phase === 'walking') { keys.add('Shift'); return; }
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'f', 'r'].includes(key) || game.phase !== 'walking') return;
  e.preventDefault(); if (pointer !== null) return;
  inputMode = 'keyboard'; pointerPosition = null; aimCache = '';
  if (e.shiftKey) keys.add('Shift');
  if (key === 'f') { if (!e.repeat) switchFoot(); return; }
  if (key === 'r') { if (!e.repeat) makeRoom(); return; }
  if (key === ' ' || key === 'Enter') {
    if (!e.repeat) { requestStep(); hud(); }
    return;
  }
  queuedStep = null;
  keys.add(key);
  if (!e.repeat) nudgeTarget(Number(key === 'ArrowRight' || key === 'd') - Number(key === 'ArrowLeft' || key === 'a'), Number(key === 'ArrowUp' || key === 'w') - Number(key === 'ArrowDown' || key === 's'), keys.has('Shift') ? 3 : 12);
});
window.addEventListener('keyup', e => { keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); });
// Losing focus releases input, but never stops the walk or its race clock.
window.addEventListener('blur', () => clearInput());
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); ambience.stop(); } });
window.addEventListener('resize', () => { renderer.invalidateSize(); needsPaint = true; requestFrame(); });
function retry() { reset(true); start(); }
$('make-room').addEventListener('click', makeRoom);
$('start').addEventListener('click', start); $('restart').addEventListener('click', () => reset()); $('again').addEventListener('click', retry);
$('sound').addEventListener('click', () => {
  audioOn = !audioOn; updateSoundControl();
  try { localStorage.setItem(soundStorageKey, String(audioOn)); } catch {}
  if (audioOn) unlockAudio();
  else ambience.stop();
  // A toolbar click must not strand keyboard play on the sound toggle.
  if (game.phase === 'walking') canvas.focus({preventScroll:true});
});
function frame(now) {
  frameRequested=false;
  const elapsed = lastFrame ? now - lastFrame : 16.7, dt = Math.min(elapsed / 1000, .1); lastFrame = now;
  if (inputMode === 'keyboard' && game.phase === 'walking' && game.mode === 'idle') {
    const x = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'));
    const y = Number(keys.has('ArrowUp') || keys.has('w')) - Number(keys.has('ArrowDown') || keys.has('s'));
    if (x || y) nudgeTarget(x, y, (keys.has('Shift') ? 48 : 210) * dt);
  }
  const t = performance.now(); advance(game, dt);
  const contactEvents = game.events.splice(0);
  for (const event of contactEvents) {
    if (event.type === 'stretch' && event.index < STRETCH.count - 1) race.split(event.index);
    if (event.type === 'bump') {
      // A buffered placement assumed this swing would finish. Let the player
      // regain their footing before committing another move from a new stance.
      queuedStep = null;
    }
    if (event.type === 'step' && (inputMode === 'keyboard' || !pointerPosition)) suggestStep(game);
    if (event.type === 'finished') finish();
  }
  if (queuedStep) {
    if (game.time > queuedStep.until) queuedStep = null;
    else if (game.phase === 'walking' && game.mode === 'idle') requestStep(queuedStep.point);
  }
  if (arrival && !document.hidden) {
    needsPaint = true;
    if (advanceHomeArrival(game,dt)) {
      arrival = null; $('result').hidden = false; hud(); $('again').focus({preventScroll:true});
    }
  }
  if (now - lastHud > 70 && (game.phase === 'walking' || needsPaint)) { hud(); lastHud = now; }
  if (!document.hidden && (game.phase === 'walking' || needsPaint)) {
    renderer.prepare(game, now, dt, reduced.matches);
    if (game.phase === 'walking' && game.mode === 'idle' && inputMode === 'pointer' && pointerPosition && ! (shoeDrag && !shoeDrag.moved)) {
      const point = pointer !== null ? pointerTarget : renderer.worldPoint(pointerPosition.x, pointerPosition.y);
      const key = `${game.active}:${point.x.toFixed(1)}:${point.y.toFixed(1)}`;
      if (key !== aimCache || !game.preview) { aimAt(point); aimCache = key; }
    }
    renderer.render(game, now, dt, reduced.matches); needsPaint = false;
    const target = game.preview, screen = target && renderer.screenPoint(target);
    data('target',target ? `${target.x.toFixed(1)},${target.y.toFixed(1)}` : '');
    data('targetScreen',screen ? `${screen.x.toFixed(1)},${screen.y.toFixed(1)}` : '');
    data('targetLimited',Boolean(target?.limited));
    data('targetValid',Boolean(target?.valid));
    data('targetBackward',Boolean(target?.backward));
    data('feet',JSON.stringify(game.feet.map(f => ({x:+f.x.toFixed(1),y:+f.y.toFixed(1),z:+f.z.toFixed(1),side:f.side}))));
  }
  ambience.update(audioContext, game, audioOn && !document.hidden, [...contactEvents, ...(renderer.takeSceneEvents?.() || [])]);
  const ambientState = ambience.isActive() ? 'playing' : 'silent';
  if (canvas.dataset.ambience !== ambientState) canvas.dataset.ambience = ambientState;
  if (game.phase === 'walking') { times.push(performance.now() - t); frames.push(elapsed); if (times.length > 240) { times.shift(); frames.shift(); } }
  if (now - lastMetrics > 1000 && times.length && game.phase === 'walking') {
    const sorted = [...times].sort((a,b)=>a-b);
    // Read-only DOM diagnostics let QA measure the actual visible game without runtime hooks.
    canvas.dataset.frameP95 = sorted[Math.floor(sorted.length*.95)].toFixed(2);
    canvas.dataset.frameAverage = (times.reduce((a,b)=>a+b,0)/times.length).toFixed(2);
    canvas.dataset.fps = (1000/(frames.reduce((a,b)=>a+b,0)/frames.length)).toFixed(1);
    canvas.dataset.cacheMb = (renderer.metrics.cacheBytes/1048576).toFixed(1); canvas.dataset.cachedChunks = renderer.metrics.chunks; canvas.dataset.particles = game.particles.length; canvas.dataset.prints = game.prints.length;
    canvas.dataset.wildlife = JSON.stringify(renderer.wildlifeState?.() || []);
    lastMetrics = now;
  }
  // Menus use CSS for their pulse. A sleeping game loop saves battery without
  // slowing the walking simulation, race clock or automatic home arrival.
  if(game.phase==='walking'||arrival||needsPaint)requestFrame();
}
hud(); requestFrame();
