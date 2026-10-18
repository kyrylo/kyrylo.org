import {recordGroundContact,recordRinse,settleGroundContact,ageGroundContacts} from './ground-effects.js?v=lean-frames-134';
import {groundBank,groundDepth,fractureRadius,utilityCutRadius,breakPool,dirtRoad,spillWeight} from './road-ground.js?v=lean-frames-134';
import {onWelcomeMat} from './home-arrival.js?v=lean-frames-134';
// 200 world units = 1 metre. Fixed 120 Hz simulation, independent of display rate.
export const ROAD = { left: 108, right: 792, start: 240, finish: 20240, length: 20000, metres: 100 };
export const PAVEMENT = { startEnd: 540, finishStart: ROAD.finish - 120 };
export const DISTRICT_LENGTH = 4000;
export const DISTRICTS = [
  {id:'doorsteps',name:'No. 12',challenge:'Read small hazards and place each foot.'},
  {id:'parking',name:'Jo’s garage',challenge:'Change lanes before the next parked car.'},
  {id:'works',name:'The repair crew',challenge:'Set up tight turns through the repair chicanes.'},
  {id:'flooded',name:'The low corner',challenge:'Choose precise covers or longer dry detours.'},
  {id:'home',name:'Home again',challenge:'Link the earlier skills and bring both shoes home.'},
];
export const STRETCH = { count: DISTRICTS.length, length: DISTRICT_LENGTH, metres: ROAD.metres / DISTRICTS.length };
export const districtAt = y => DISTRICTS[clamp(Math.floor((y-ROAD.start)/DISTRICT_LENGTH),0,DISTRICTS.length-1)];
// Shared world dimensions keep the vehicle artwork and solid body aligned.
export const CAR = { width:410, length:880, halfWidth:167, halfLength:425 };
export const GRID = { width: 24, height: 56 };
export const FLOW_WINDOW = 3.6;
const STEP_PACE = 1.5;
export const GATHER_REACH = 120;
export const SHOES = {
  leather: { name: 'Leather', absorption: .66, width: 27, length: 62, mass: 1.1, grip: 1, bonus: 1 },
  canvas: { name: 'Canvas', absorption: 1.05, width: 26, length: 62, mass: .9, grip: .88, bonus: 1.15 },
  knit: { name: 'Knit', absorption: 1.4, width: 28, length: 64, mass: .75, grip: .78, bonus: 1.3 },
};
export const MATERIALS = {
  water: { rinse: 0.65, color: [105, 94, 67], dirt: .42, grip: 6, liquid: true },
  mud: { rinse: 0.75, color: [96, 66, 39], dirt: .95, grip: 9, liquid: true },
  oil: { rinse: 0.02, color: [37, 40, 43], dirt: .8, grip: 1.6, liquid: true },
  gum: { rinse: 0, color: [190, 139, 144], dirt: .8, grip: 45, sticky: true },
  poop: { rinse: 0.5, color: [70, 46, 25], dirt: 1, grip: 16, sticky: true },
  gravel: { rinse: 1, color: [153, 139, 112], dirt: .32, grip: 13 },
  metal: { color: [81, 85, 81], dirt: .04, grip: 3 },
  dry: { color: [120, 116, 102], dirt: 0, grip: 28 },
  stone: { color: [126, 128, 113], dirt: 0, grip: 28 },
  // Pickup is pigment transferred per real contact, not an arbitrary score penalty.
  clay: { rinse: 0.6, color: [132, 76, 43], dirt: 1, grip: 12, liquid: true, pickup: 2.4, earthy: true },
  tar: { rinse: 0.01, color: [30, 28, 25], dirt: 1, grip: 42, sticky: true, pickup: 3.2, contactHeight: 3 },
  cement: { rinse: 0.45, color: [155, 153, 139], dirt: .9, grip: 17, liquid: true, pickup: 2.3, earthy: true },
  algae: { rinse: 0.8, color: [59, 74, 37], dirt: .85, grip: .8, liquid: true, pickup: 2 },
};
const MATERIAL_NAMES = Object.keys(MATERIALS);
// A moving shoe can rinse in ankle-shallow water. Once any part of the sole is
// in a deep pocket, immersion wins; its shallow edge cannot award a wash bonus.
export const RINSE_DEPTH = { minimum: .6, full: 2.5, fade: 7, soak: 12 };
export function waterRinse(depth){
  return Math.max(0,Math.min(1,(depth-RINSE_DEPTH.minimum)/(RINSE_DEPTH.full-RINSE_DEPTH.minimum),
    (RINSE_DEPTH.soak-depth)/(RINSE_DEPTH.soak-RINSE_DEPTH.fade)));
}
const stainFixation=type=>1-(MATERIALS[type].rinse||0)*.7;

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function randomSource(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
export function boundary(p, angle) {
  if(p.bootprint)return .88+.08*Math.sin(angle)+.025*Math.sin(angle*7+p.seed);
  if(p.workBed)return utilityCutRadius(p,angle);
  if(p.steppingStone)return (1+.035*Math.sin(angle*3+p.seed)+.02*Math.sin(angle*7-p.seed*.7))*fractureRadius(p,angle);
  return (1 + .085 * Math.sin(angle * 3 + p.seed) + .045 * Math.sin(angle * 7 - p.seed * .7) + .025 * Math.cos(angle * 11 + p.seed))*fractureRadius(p,angle);
}
// Clean paved aprons at both ends; grass is decorative and outside the walking lane.
export const isPavement = y => y <= PAVEMENT.startEnd || y >= PAVEMENT.finishStart;
export function puddleDepth(p, x, y) {
  if(p.groundField)return groundDepth(p,x,y);
  const dx = x - p.x, dy = y - p.y;
  const nx = (dx * p.cos + dy * p.sin) / p.rx, ny = (-dx * p.sin + dy * p.cos) / p.ry;
  const rr = nx * nx + ny * ny;
  if (rr > 1.36) return 0;
  const edge = boundary(p, Math.atan2(ny, nx));
  if (rr >= edge * edge) return 0;
  const depth=p.depth * Math.pow(1 - rr / (edge * edge), .65);
  return p.workSpill?depth*spillWeight(p,nx):depth;
}
const BIN = 256;
export function indexStreet(street) {
  const bins = new Map();
  for (const item of [...street.patches, ...street.obstacles]) {
    const extent = Math.max(item.rx || item.r, item.ry || item.r) * 1.25 + 100;
    for (let b = Math.floor((item.y - extent) / BIN); b <= Math.floor((item.y + extent) / BIN); b++) {
      if (!bins.has(b)) bins.set(b, { patches: [], obstacles: [] });
      bins.get(b)[item.solid ? 'obstacles' : 'patches'].push(item);
    }
  }
  street.bins = bins;
  return street;
}
const EMPTY = { patches: [], obstacles: [] };
export const nearby = (street, y) => street.bins.get(Math.floor(y / BIN)) || EMPTY;
function makeDistrict(seed, stage = 0) {
  const rand = randomSource(seed), patches = [], obstacles = [], clutter = [], sections = [], parking = [];
  const parkingSide = rand() < .5 ? 0 : 1;
  const profile=DISTRICTS[stage];
  const parkingBays=[
    [{y:3050,side:parkingSide}],
    [{y:1150,side:parkingSide},{y:2150,side:1-parkingSide},{y:3200,side:parkingSide}],
    [{y:1900,side:parkingSide}],
    [],
    [{y:1450,side:parkingSide},{y:2760,side:1-parkingSide}],
  ][stage];
  const add = (type, x, y, rx, ry, depth, angle = (rand() - .5) * .36) => {
    const p = { id: patches.length, type, x, y, rx, ry, depth, dirt: MATERIALS[type].dirt, seed: rand() * 80, cos: Math.cos(angle), sin: Math.sin(angle) };
    patches.push(p); return p;
  };
  // Authored sequences: an approach, a decision, then an exit that changes line.
  // Randomness mirrors and dresses these patterns; it never scrambles their logic.
  const sequences = [
    ['pinch','doorstep','slalom','crown','fork','drain','offset'],
    ['pinch','squeeze','squeeze','squeeze','diagonal'],
    ['works-in','works-out','runoff','works-in','works-out','offset'],
    ['drain-chain','double-runoff','fork','drain-chain','diagonal'],
    ['crown','drain-chain','fork','runoff','squeeze','works-in','works-out'],
  ];
  const deck=sequences[stage],turn=rand()<.5?-1:1;
  const bend=110+stage*9,worksTurn=parkingSide?1:-1;
  // Each 20 m district has a different rhythm, with clear setup and exit room.
  const centres = [
    [780,1250,1740,2270,2770,3290,3830],
    [650,1150,2150,3200,3830],
    [650,1180,1680,2350,2900,3780],
    [700,1750,2260,2950,3780],
    [600,1200,1800,2250,2650,3000,3500],
  ][stage];
  const mirror = parkingSide ? -1 : 1;
  const across = x => mirror === 1 ? x : 900 - x;
  const carAt=y=>parkingBays.reduce((best,car)=>!best||Math.abs(car.y-y)<Math.abs(best.y-y)?car:best,null);
  const besideCar=(x,y)=>carAt(y)?.side?900-x:x;
  const post = (x, y, r = 17) => obstacles.push({ id: obstacles.length, type: 'bollard', x, y, r, height: 100, solid: true, seed: rand() * 100 });
  // Reserve the stated inner edge even at the most irregular point of a bank.
  const bank = (side, edge, y, length = 145, depth = 16) => {
    const outer = side < 0 ? 45 : 855;
    return add('water', (outer + edge) / 2, y, Math.abs(edge - outer) / 2 / 1.155, length, depth, 0);
  };
  const repairBarrier=(side,y)=>{
    const end=side<0?(stage===4?505:530):(stage===4?395:370);
    const besideCar=parkingBays.some(car=>car.side===(side<0?0:1)&&Math.abs(car.y-y)<CAR.halfLength+30);
    const outer=besideCar?(side<0?207:693):(side<0?110:790);
    const x=(end+outer)/2,halfWidth=Math.abs(end-outer)/2;
    obstacles.push({id:obstacles.length,type:'barrier',x,y,r:halfWidth,ry:24,halfWidth,halfLength:24,height:165,solid:true,seed:rand()*80});
  };
  for (let n = 0; n < deck.length; n++) {
    const kind = deck[n], y = centres[n] + (rand() - .5) * 20, firstPatch=patches.length;
    let gap = 450, halfGap = 60, lanes, line, parkingPattern, coverPattern;
    if (kind === 'pinch') {
      gap = 450 + turn*bend; halfGap = 76-stage*3;
      if(stage===0){
        // One worn gutter fails first; a smaller depression follows across the
        // road. Unequal lengths leave room to read the next landing, instead
        // of making the first encounter a pair of matching puddle gates.
        for(const side of [-1,1]){
          const large=side===-turn;
          bank(side,gap+side*halfGap,y+(large?-32:54),large?166:118,large?13:8);
        }
        line=[{x:450,y:y-280},{x:gap,y:y-95},{x:gap,y:y+95},{x:gap,y:y+220}];
      }else{
        bank(-1, gap - halfGap, y, 180, 15); bank(1, gap + halfGap, y + 12, 185, 16);
      }
    } else if (kind === 'doorstep') {
      // Small real litter asks for foot placement, not just a broad change of lane.
      gap=450+turn*82;halfGap=65;
      bank(-1,295,y,180,9);bank(1,605,y+12,180,10);
      add('poop',450,y,16,20,11,0);
      add('gum',450-turn*48,y-135,17,13,3,0);
      // A shallow drain trickle crosses the incoming side of the street.
      // Leave a full dry stance on each bank, then curve around the litter.
      // The entry follows the first puddle's exit instead of doubling back.
      bank(turn,450+turn*40,y-150,20,7).doorstepRunoff=true;
      const approach=450+turn*110;
      line=[{x:approach,y:y-245},{x:approach,y:y-225},{x:gap,y:y-40},{x:gap,y:y+90},{x:450,y:y+240}];
    } else if (kind === 'runoff') {
      // A narrow transverse runnel can be stepped OVER, or walked around at its
      // far end. Its shallow profile is still water, not a painted safe strip.
      gap = across(700); halfGap = 52;
      add('water',across(345),y,275,(stage<2?34:65)+rand()*5,stage<2?9:14,0);
      if(stage>=2)add('water',across(535),y+180,63,52,14,0);
      add('water', across(125), y - 75, 54, 105, 12, 0);
      lanes = [stage<2?450:across(390),gap];
    } else if (kind === 'diagonal') {
      // Runoff follows a sloping repair seam. Crossing from the lower end costs
      // less reach; cutting straight across its rising end catches the trailing
      // heel. A dry outside route remains visible beyond the rounded tip.
      gap=across(700);halfGap=54;
      const tilt=turn*mirror*(stage===1?.30:-.34);
      add('water',across(350),y,270,stage===1?39:46,stage===1?12:16,tilt).repairSeam=true;
      add('water',across(530),y+175,65,45,12,0);
      bank(-mirror,across(195),y-85,92,11);
      lanes=[across(390),gap];
      line=[{x:gap,y:y-190},{x:gap,y:y+220}];
      if(stage===3){
        // The low gutter stays wet beyond the repair seam. Turn back onto the
        // road crown before the home stretch, with a dry landing for both feet.
        bank(mirror,across(710),y+350,105,12).lowRoadExit=true;
        line=[[-190,700],[100,700],[250,650],[350,550],[470,450]].map(([dy,x])=>({x:across(x),y:y+dy}));
      }
    } else if (kind === 'crown') {
      // Follow the surviving road crown. Near home, the two gutters fail at
      // different points, leaving open asphalt between the approach and exit.
      halfGap=94-stage*3;gap=450;
      const sweep=62+stage*7;
      line=[-150,-50,50,150].map((dy,i)=>({x:450+turn*sweep*[-1,-.4,.4,1][i],y:y+dy}));
      for(const [i,p] of line.entries()){
        const pair=[bank(-1,p.x-halfGap,p.y,84,15),bank(1,p.x+halfGap,p.y+5,84,16)];
        if(stage===4){
          const wetSide=i<2?turn:-turn,keep=wetSide<0?0:1;
          pair[keep].homeBend=i;
          // Dress both banks before discarding one, so later street seeds and
          // furniture stay stable when this encounter becomes less crowded.
          patches.splice(patches.indexOf(pair[1-keep]),1);
        }
      }
      lanes=[line[0].x,line.at(-1).x];
    } else if (kind === 'double-runoff') {
      // Opposing gutter channels leave a broad dry refuge between them.
      // Precise strides cross directly; the longer route changes sides here.
      gap=450;halfGap=68;
      add('water',across(338),y-230,270,37,12,0).pairedChannel='entry';
      bank(mirror,across(315),y+130,43,15).pairedChannel='exit';
      bank(-mirror,across(180),y-20,60,13);
      lanes=[450,across(700)];
      line=[[-335,700],[-110,700],[-40,550],[20,400],[90,230],[280,230]].map(([dy,x])=>({x:across(x),y:y+dy}));
    } else if (kind === 'fork') {
      const centre = 450 + (rand() - .5) * 28;
      // Branches now feed the following encounter. One gets there directly;
      // the outside branch is cleaner at the exit but costs a change of line.
      const next=deck[n+1],exit=next==='squeeze'?besideCar(272,centres[n+1]):next==='runoff'?across(700):next==='drain'?across(235):next==='drain-chain'?across(690):450+turn*125;
      gap = centre + (exit<centre?-165:165); halfGap = 48;
      lanes = [centre - 165, centre + 165];
      add('water', centre, y, 103, 170, 18, 0);
      bank(-1, centre - 218, y - 12, 135, 13); bank(1, centre + 218, y + 12, 135, 13);
      // The direct exit has a small gravel fan to step over; the long branch
      // stays clear. Its position is intentional, rather than random punishment.
      const gravel=add('gravel',gap,y+181,stage===4?67:27,stage===4?29:24,3,0);
      if(stage===3){
        // The long crossing route feeds this fork's nearer branch. Rejoin on
        // open asphalt before choosing the following covers or gutter detour.
        const branch=lanes.find(x=>x!==gap);
        line=[{x:branch,y:y-140},{x:branch,y:y+160},{x:450,y:y+300}];
      }
      if(stage===4){
        // A visible fan of washed-out aggregate spans the direct branch. Its
        // shallow width can be stepped over from a dry setup; the other branch
        // stays open. The far bank feeds the following runoff and parked car.
        gravel.washout=true;
        line=[{x:gap,y:y-210},{x:gap,y:y+90},{x:gap,y:y+265}];
      }
    } else if (kind === 'drain') {
      gap = across(235); halfGap = 57;
      lanes = [gap, 450, across(665)];
      add('water', 450, y, 155, 130, 17, 0);
      add('metal', 450, y + 3, 60, 60, 2, 0);
      // The manhole is a precise, slippery shortcut; asphalt around it is wider.
      bank(mirror, across(725), y + 30, 112, 12);
    } else if (kind === 'drain-chain') {
      // Utility covers sit above a long flooded depression. They are real metal
      // footholds, with lower grip, rather than artificial dry holes in water.
      // A single stride cannot span the entire basin.
      gap=across(690);halfGap=56;
      coverPattern=stage===3&&n>0?'staggered':'pair';
      const staggered=coverPattern==='staggered',basinLength=staggered?260:235;
      add('water',450,y,158,basinLength,17,0);
      const exit=deck[n+1]==='slalom'?450-turn*35:across(700);
      const first=exit>450?490:410;
      // The first low-road basin introduces the slippery covers with generous
      // edges. Later, three staggered footholds change the leading foot twice,
      // then leave a full dry landing before the following diagonal runoff.
      const covers=staggered?[[first,-145],[900-first,0],[first,145]]:[[first,-100],[900-first,100]];
      const radius=stage===3&&n===0?70:64;
      for(const [x,dy] of covers)add('metal',x,y+dy,radius,radius,2,0);
      lanes=[gap,450];
      line=[{x:gap,y:y-(staggered?315:270)},{x:gap,y:y+(staggered?335:270)}];
      if(staggered){
        // Overflow at the far gutter makes the dry alternative turn in before
        // rejoining. The covers take five precise placements; the longer route
        // has generous asphalt throughout, including space for the rear heel.
        bank(mirror,across(710),y+340,110,13);
        line=[[-315,690],[130,690],[330,650],[410,650],[510,690]].map(([dy,x])=>({x:across(x),y:y+dy}));
      }
    } else if (kind === 'squeeze') {
      // The car occupies x <= 187 (mirrored on the right). A dry corridor lies
      // between its body and the deep gutter basin: approaching from the right
      // direction matters, while the far side stays a longer alternative.
      const squeezeSide=carAt(y).side,squeezeMirror=squeezeSide?-1:1;
      gap = besideCar(272,y); halfGap = 48;
      parkingPattern=stage===1?['squeeze','bend','crossing'][n-1]:'squeeze';
      if(parkingPattern==='bend'){
        // Worn aggregate beside the middle car pushes the dry strip away from
        // its body. A rain-filled wheel rut borders the other side; the broad
        // outside route remains available beyond that depression.
        gap=besideCar(345,y);halfGap=70;
        const contour=[[280,-170],[345,0],[380,180]];
        for(const [x,dy] of contour){
          const inner=x-halfGap,outer=x+halfGap;
          add('water',besideCar((45+inner)/2,y),y+dy,(inner-45)/2/1.155,110,12,0).parkingShoulder=true;
          add('water',besideCar((outer+650)/2,y),y+dy+8,(650-outer)/2/1.155,114,17,0);
        }
        line=[{x:besideCar(272,y),y:y-270},...contour.map(([x,dy])=>({x:besideCar(x,y),y:y+dy})),{x:besideCar(400,y),y:y+310}];
      }else{
        add('water', besideCar(492,y), y, 137, stage===1?240:185, 18, 0);
      }
      bank(squeezeMirror, besideCar(755,y), y + 45, stage===1?205:155, 14);
      lanes = [gap, besideCar(700,y)];
      if(stage===1){
        // Old engine drips sit behind the car, so blindly hugging its body costs dirt.
        add('oil',besideCar(235,y),y-360,31,47,4,0);
        if(!line)line=[{x:gap,y:y-280},{x:gap,y:y+270}];
        if(parkingPattern==='crossing'){
          // A shallow trickle leaves the gutter behind the last car. Its banks
          // fit a whole shoe, so an ordinary, well-placed stride clears it.
          // The broad outside route stays dry for players who prefer a detour.
          add('water',besideCar(271,y),y-175,84/1.155,19,7,0).tyreRunoff=true;
          line=[{x:gap,y:y-270},{x:gap,y:y-240},{x:gap,y:y-105},{x:gap,y:y+270}];
        }
      }
      // After the middle repair chicane the outside line is already reachable.
      // Keep it wide enough for a whole pair, then let it rejoin beyond the car.
      if(stage===2)line=[{x:lanes[1],y:y-210},{x:lanes[1],y:y+210}];
    } else if (kind === 'slalom') {
      gap = 450 - turn*35; halfGap = 146;
      bank(-1, gap - halfGap, y, 169, 17); bank(1, gap + halfGap, y + 20, 169, 17);
      // Paired access posts make the foot's whole swing matter, not just its end.
      post(gap + turn * 55, y - 110); post(gap - turn * 55, y + 125);
      // Rain settles in the worn sockets around the posts. A near miss can wet
      // the sole; a deliberate turn still has space for both complete shoes.
      for(const [x,dy] of [[gap+turn*55,-110],[gap-turn*55,125]])add('water',x,y+dy,40,45,7,0).postPool=true;
      line=[{x:gap-turn*45,y:y-145},{x:gap-turn*45,y:y-65},{x:gap+turn*45,y:y+90},{x:gap+turn*45,y:y+175}];
    } else if(kind==='works-in'||kind==='works-out'){
      const side=kind==='works-in'?worksTurn:-worksTurn;
      gap=side<0?(stage===4?620:642):(stage===4?280:258);halfGap=70;
      repairBarrier(side,y);
      // Rain collects behind the closed work area; the walkable opening stays dry.
      bank(side,side<0?402:498,y+65,112,17).workPool=true;
      add('gravel',side<0?245:655,y+125,95,75,5,0).workBed=true;
      if(stage===4&&kind==='works-in'){
        // Ease into the final S-turn from the parked car, then leave enough
        // landing room beyond the rail to bring the trailing shoe through.
        line=[{x:gap,y:y-150},{x:gap,y:y+85},{x:450,y:y+265}];
      }
      if(stage===2&&kind==='works-out'&&n===1){
        // The first work zone exits toward the opposite side of the parked car.
        // Gutter water should ask for that turn, not pin the rear shoe against
        // the rail. A central dry pocket fits both shoes before the next runnel.
        bank(-side,side<0?550:350,y+240,42,11).workExit=true;
        line=[{x:gap,y:y-100},{x:gap,y:y+70},{x:450,y:y+235}];
      }else if(stage>=2&&kind==='works-out'){
        // The later exit asks for a placed stride over its narrow runnel.
        add('water',side<0?555:345,y+190,155,31,10,0);
      }
      if(stage===2&&kind==='works-in'&&n===3){
        // Loose aggregate has washed off the second work bed into the turn.
        // Its thin trailing edge rewards looking past the barrier before stepping.
        Object.assign(add('gravel',side<0?345:555,y+235,115,23,4.5,0),{workSpill:true,spillSide:side});
        line=[{x:gap,y:y-100},{x:gap,y:y+80},{x:450,y:y+330}];
      }
      if(stage===4&&kind==='works-out'){
        // The last turn leads back between the entrance posts. Shallow gutter
        // pools close the outside edges, with a generous central landing before
        // the clean stone apron. There is room to turn before the final runnel.
        const apron=PAVEMENT.finishStart-(ROAD.start+stage*DISTRICT_LENGTH);
        bank(-1,320,apron-60,54,11);bank(1,580,apron-60,54,11);
        line=[{x:gap,y:y-95},{x:gap,y:y+60},{x:450,y:apron-15}];
      }
    } else {
      gap = 450 + turn*125; halfGap = 65;
      bank(-1, gap - halfGap, y - 38, 130, 19); bank(1, gap + halfGap, y + 38, 130, 19);
      add('water', gap + (gap < 450 ? 100 : -100), y - 156, 60, 35, 10, 0);
    }
    sections.push({kind,y,gap,halfGap,lanes:lanes||[gap],stage,...(line?{line}:{}),...(parkingPattern?{parkingPattern}:{}),...(coverPattern?{coverPattern}:{})});
    // Silt belongs to the gutter. Small hazards between encounters make careless
    // maximum-length strides costly without covering both routes at once.
    if (n % 2 === 0 && stage!==3) {
      // Beside parked cars, silt hugs the curb instead of spilling into the
      // deliberately wider outside route after its apparently dry entrance.
      const edge=stage===1?790:770;
      add('mud', parkingSide ? edge : 900-edge, y + 110, stage===1?30:54, 70, 3 + rand() * 4, 0);
    }
    if(stage!==3&&stage!==1&&!kind.startsWith('works')&&!['doorstep','crown','double-runoff','drain-chain','diagonal'].includes(kind)&&!(kind==='runoff'&&stage>=2)){
      const type=['gum','metal','oil','poop','metal','gum','gravel','oil'][n];
      const x=clamp(gap+(gap<450?1:-1)*112,170,730);
      const size=type==='metal'?54:type==='oil'?30:type==='gravel'?25:12;
      add(type,x,y+185,size,type==='metal'?size:size*.8,type==='poop'?12:type==='gum'?3:5);
    }
    for(let i=firstPatch;i<patches.length;i++)patches[i].encounter=n;
  }
  // Clean paved entrances remain wide enough for both feet.
  for (const y of [630, DISTRICT_LENGTH - 180]) for (const x of [278, 622]) post(x, y, 14);
  for (const {y,side} of parkingBays) {
    const car = { x: side ? 880 : 20, y, side, angle: side ? Math.PI : 0, width: CAR.width, length: CAR.length };
    parking.push(car);
    obstacles.push({ id: obstacles.length, type: 'car', x: car.x, y, halfWidth: CAR.halfWidth, halfLength: CAR.halfLength, r: CAR.halfWidth, ry: CAR.halfLength, height: 220, solid: true });
  }
  for (let i = 0; i < 170; i++) clutter.push({ x: i % 3 ? (rand() < .5 ? 70 + rand() * 120 : 710 + rand() * 120) : 130 + rand() * 640, y: 650 + rand() * (DISTRICT_LENGTH - 700), angle: rand() * 6.28, size: 3 + rand() * 7, type: Math.floor(rand() * 7) });
  if(stage===1){
    // Oily gutter overflow joins the bowed bay to the final parked car. A short
    // placed stride clears the film; the rounded end leaves a broad dry detour.
    // Add it after dressing so existing seeded encounters stay unchanged.
    const side=parkingBays[1].side,at=x=>side?x:900-x;
    const y=(parkingBays[1].y+parkingBays[2].y)/2-10;
    const spill=add('oil',at(582.5),y,272.5/1.155,27,4,0);
    spill.garageRunoff=true;spill.gutterSide=side;
    for(const [x,dy,r] of [[818,-58,12],[801,-90,8]])add('oil',at(x),y+dy,r,r*1.4,3,0);
    const next=sections.find(s=>s.parkingPattern==='crossing');
    sections.push({kind:'garage-runoff',stage,y,gap:at(230),halfGap:70,lanes:[450,at(230)],
      line:[[-135,450],[-95,330],[-30,230],[40,230],[95,350],[155,350]].map(([dy,x])=>({x:at(x),y:y+dy})).concat({...next.line[0]})});
    sections.sort((a,b)=>a.y-b.y);
  }
  // Damage replaces selected puddle patterns after dressing, preserving the rest
  // of the seeded street. The dry remnant is actual asphalt, never a painted hint.
  const damageRand=randomSource(seed^0x73b54a21);
  const replaceGround=(section,type,line,halfGap)=>{
    const encounter=deck.indexOf(section.kind);
    for(let i=patches.length-1;i>=0;i--){
      const p=patches[i];if(p.encounter!==encounter)continue;
      patches.splice(i,1);
    }
    for(const side of [-1,1]){
      // The first worn section peels away in two staggered shoulders. The
      // longer excavation later in the walk keeps its sustained winding line.
      const edgeLine=stage===0?(side===-turn?line.slice(0,-1):line.slice(1)):line;
      patches.push(groundBank({side,line:edgeLine,halfGap,type,seed:damageRand()*80,rand:damageRand,id:0,excavated:stage===2}));
    }
    section.ground=type==='mud'?'washout':'broken-road';
  };
  if(stage===0){
    const s=sections.find(s=>s.kind==='crown');replaceGround(s,'gravel',s.line,84);
  }
  if(stage===1){
    const s=sections.find(s=>s.parkingPattern==='bend'),shoulderRand=randomSource(seed^0x48a31f2b);
    // One continuous failed shoulder replaces three floating gutter pools.
    // Its chipped edge follows the same dry route, with tapered ends and no
    // extra obstacles. A separate seed keeps the other parking bays stable.
    for(let i=patches.length-1;i>=0;i--)if(patches[i].parkingShoulder)patches.splice(i,1);
    const p=groundBank({side:carAt(s.y).side?1:-1,line:s.line.slice(1,-1),halfGap:s.halfGap,type:'gravel',seed:shoulderRand()*80,rand:shoulderRand,id:0});
    p.parkingShoulder=true;patches.push(p);s.ground='broken-shoulder';
  }
  if(stage===2){
    const s=sections.find(s=>s.kind==='offset');
    s.line=[[-390,450],[-170,450-turn*115],[-60,450-turn*115],[100,450],[260,450+turn*115]].map(([dy,x])=>({x,y:s.y+dy}));
    s.gap=450-turn*71.875;s.halfGap=88;s.lanes=[s.line[0].x,s.line.at(-1).x];
    replaceGround(s,'gravel',s.line,88);
  }
  if(stage===3){
    const s=sections.find(s=>s.kind==='fork'),encounter=deck.indexOf('fork');
    for(let i=patches.length-1;i>=0;i--)if(patches[i].encounter===encounter)patches.splice(i,1);
    s.y+=50; // Leave a dry turning pocket after either channel approach.
    patches.push(dirtRoad(s.y,damageRand,mirror));
    Object.assign(s,{kind:'stepping-stones',ground:'dirt-road',gap:450,lanes:[450,across(650)],
      line:[[-240,450],[-145,450],[-25,505],[75,360],[175,500],[275,440],[345,580]].map(([dy,x])=>({x:across(x),y:s.y+dy}))});
    // The broad first/last stones let either foot lead. The single-shoe stones
    // make a deliberate weave: a narrow, fixed stance cannot use both. The
    // far stone brings the pair back toward the bank. Mud stays walkable.
    for(const [i,[x,dy,rx,ry]] of [[450,-145,76,65],[505,-25,42,50],[360,75,42,50],[500,175,64,58]].entries()){
      const p=add('stone',across(x),s.y+dy,rx,ry,2,0);
      Object.assign(p,{steppingStone:true,stoneOrder:i,encounter,edgeCuts:Array.from({length:12},()=>.94+damageRand()*.06)});
    }
  }
  // Failures in the wearing course are layered: fractured asphalt, a gritty
  // shoulder, then standing water. Reserve the old footprint so every existing
  // dry approach stays usable while the landing material becomes more precise.
  const potholes=patches.filter(p=>p.type==='water'&&!p.groundField&&(
    stage===0&&(p.encounter===0||p.encounter===deck.indexOf('drain')&&p.rx>140)||
    stage===1&&[1,3].includes(p.encounter)&&p.rx>130&&p.rx<145||
    stage===3&&p.encounter===0&&p.rx===158||
    stage===4&&(p.encounter===deck.indexOf('fork')&&p.rx===103||p.homeBend===3)));
  for(const p of potholes){
    p.craterKey=`${stage}:${p.encounter}:${p.seed}`;
    const rim=breakPool(p,damageRand);patches.push(rim);
    if(stage===1&&p.encounter===1){
      // The first parking-bay failure holds two separate rain pockets. A gritty
      // ridge lies between them; cutting across still marks the soles.
      Object.assign(p,{x:rim.x-rim.rx*.025,y:rim.y-rim.ry*.36,rx:rim.rx*.46,ry:rim.ry*.27});
      patches.push({...p,x:rim.x+rim.rx*.025,y:rim.y+rim.ry*.36,seed:p.seed+3,depth:p.depth*.8});
    }
  }
  // Excavations and the homeward shoulder already supply their own sediment.
  // Generic mud here made unrelated blobs beside their open approaches.
  for(let i=patches.length-1;i>=0;i--)if(patches[i].type==='mud'&&(deck[patches[i].encounter]?.startsWith('works')||stage===4&&patches[i].encounter===0))patches.splice(i,1);
  for(const p of patches){
    if(p.groundField)p.groundStyle=p.type==='mud'?'silt':stage===2?'subbase':'rubble';
    if(p.workBed){
      // A shallow utility cut explains each rail. Rain sits inside the exposed
      // bed, not underneath a gravel island spilling across the approach.
      // Smaller repairs near home keep the final stretch quieter.
      Object.assign(p,{rx:stage===4?118:140,ry:stage===4?92:108,craterRim:true,underlay:true,
        edgeCuts:Array.from({length:18},()=>.975+damageRand()*.025)});
      const pool=patches.find(q=>q.workPool&&q.encounter===p.encounter);
      Object.assign(pool,{x:p.x,y:p.y-20,rx:stage===4?62:80,ry:stage===4?32:43,depth:10});
    }
    if(p.type==='gravel'&&!p.groundField&&p.rx<45){p.craterRim=true;p.underlay=true;}
  }
  // Small hazards have a visible source in the neighbourhood. Add them after
  // the main encounters so their dressing cannot shuffle the seeded route.
  if(stage===0){
    // Roof runoff carries gritty sediment onto the far bank. The short,
    // straight landing gets the toe dirty; a slightly longer placed stride
    // reaches intact asphalt before the dog mess further ahead.
    const doorstep=sections.find(s=>s.kind==='doorstep');
    Object.assign(add('gravel',doorstep.gap+turn*69,doorstep.y-100,39,29,3.6,0),
      {gutterGrit:true,flatResidue:true,surfaceFilm:true});
    doorstep.story='leaking-downpipe';
    const s=sections.find(s=>s.kind==='crown'),y=2280;
    const bay=parkingBays.find(b=>Math.abs(b.y-y)<570),side=1-(bay?.side??parkingSide),sign=side?1:-1;
    const a=s.line[1],b=s.line[2],centre=a.x+(b.x-a.x)*clamp((y-a.y)/(b.y-a.y),0,1);
    // The neighbour's hose drains over the already broken shoulder. The dry
    // crown stays intact, but stepping off it now means wet grit and muddy silt.
    const end=centre+sign*125,curb=side?808:92;
    Object.assign(add('water',(curb+end)/2,y,Math.abs(curb-end)/2,14,6,0),{hoseRunoff:true,surfaceFilm:true});
    Object.assign(add('mud',end+sign*16,y+22,25,48,3,0),{hoseSilt:true,surfaceFilm:true,flatResidue:true});
    s.story='watering-the-plants';
  }
  if(stage===1){
    const side=parkingBays[0].side,across=x=>side?900-x:x,y=parkingBays[0].y+510;
    // Two tyre-width oil traces pull diagonally away from the first parked car.
    // There is room between the tracks, across them, or around their outer tip.
    for(const x of [305,475])Object.assign(add('oil',across(x),y,150,8,3,side?-.72:.72),{tyreTrack:true,flatResidue:true});
    const first=sections.find(s=>s.parkingPattern==='squeeze');
    first.story='leaking-car';
    // The loaded wheel has broken the asphalt at the end of the close route.
    // It reaches from under the tyre into the lane, so simply hugging the car
    // catches grit. Both banks fit a pair; the wide outside route stays intact.
    Object.assign(add('gravel',across(260),parkingBays[0].y+275,100,26,4.2,side?-.12:.12),
      {wheelRubble:true,craterRim:true,underlay:true,edgeCuts:Array.from({length:18},()=>.94+damageRand()*.06)});
    first.line=[[-280,272],[190,272],[350,272],[375,272]].map(([dy,x])=>({x:across(x),y:parkingBays[0].y+dy}));
  }
  if(stage===2){
    const s=sections.filter(s=>s.kind==='works-in')[1],side=worksTurn,heading=side<0?1:-1;
    // Someone has walked out of the wet repair bed. Individual bootprints leave
    // real gaps to place a white sneaker, rather than filling the whole exit.
    for(let i=0;i<5;i++){
      const sway=i%2?8:-8,x=(side<0?285:615)+heading*i*74;
      Object.assign(add('mud',x+heading*sway,s.y+158+i*37-sway,14,29,2.4,-heading*1.11),{bootprint:true,surfaceFilm:true,flatResidue:true});
    }
    s.story='builders-boots';
  }
  if(stage===3){
    // Runoff deposits leaves on the iron as well as in the gutter. The first
    // basin teaches the texture at the rim; the later middle cover asks for
    // an offset landing on its bare half. Mud stays walkable after a mistake.
    const intro=sections.find(s=>s.coverPattern==='pair'),later=sections.find(s=>s.coverPattern==='staggered');
    const covers=s=>patches.filter(p=>p.type==='metal'&&Math.abs(p.y-s.y)<180).sort((a,b)=>a.y-b.y);
    for(const [cover,inset,rx,ry] of [[covers(intro)[0],43,12,25],[covers(later)[1],29,24,37]]){
      const inward=cover.x<450?1:-1;
      Object.assign(add('mud',cover.x+inward*inset,cover.y,rx,ry,4.2,0),
        {leafMat:true,onCover:true,flatResidue:true,surfaceFilm:true});
    }
    // A larger tide line collects at the low gutter. It reinforces the inward
    // turn without spreading into the full-pair asphalt detour.
    Object.assign(add('mud',across(750),later.y+340,34,48,5,0),
      {leafMat:true,flatResidue:true,surfaceFilm:true});
    later.story='blocked-drains';
  }
  if(stage===4){
    // The quick branch passes a knocked-over planter. Damp compost replaces
    // the old gravel fan, with a narrow trail back to its source at the curb.
    // Both banks still fit a full stance, so a placed stride clears the spill.
    const s=sections.find(s=>s.kind==='fork'),fan=patches.find(p=>p.washout);
    Object.assign(fan,{type:'mud',dirt:MATERIALS.mud.dirt,depth:5.5,gardenSpill:true,surfaceFilm:true,flatResidue:true});
    const curb=fan.x>450?808:92;
    Object.assign(add('mud',(curb+fan.x)/2,fan.y,Math.abs(curb-fan.x)*.56,19,4,0),
      {gardenSpill:true,surfaceFilm:true,flatResidue:true});
    s.story='spilled-planter';
    // Bin water follows the road's slope, across the long outside route around
    // the final car. Step over it, or take the closer corridor beside the car.
    // No solid object is added to the lane, including its recovery space.
    const at=x=>parkingSide?900-x:x,sourceY=2600,endY=2640,dx=241,dy=endY-sourceY;
    Object.assign(add('water',at(224.5),(sourceY+endY)/2,Math.hypot(dx,dy)/2,11,4.5,
      parkingSide?-Math.atan2(dy,dx):Math.atan2(dy,dx)),{binLeak:true,surfaceFilm:true});
    Object.assign(add('water',at(345),endY,23,28,7,0),{binLeak:true,surfaceFilm:true});
    sections.find(s=>s.kind==='squeeze').story='bin-day';
  }
  // Wind and wheels leave most loose litter at the edges. Waterline debris is
  // painted separately; sparse open asphalt keeps foot placement readable.
  // A separate stream leaves all authored hazards and their seeds untouched.
  const dressing=randomSource(seed^0x26c4a91),density=[.62,.72,.78,.60,.48][stage];
  for(let i=clutter.length-1;i>=0;i--){
    const item=clutter[i],inTrack=item.x>210&&item.x<690;
    if(dressing()>density*(inTrack?.34:1))clutter.splice(i,1);
  }
  // The wearing course has failed along the whole street, not just inside a
  // few isolated puddles. Surviving asphalt connects the authored encounters;
  // the old broad outside bypasses are now wet silt and loose aggregate.
  // These are contact surfaces, never solid walls: a missed line can continue.
  const wornRand=randomSource(seed^0x2e71b490);
  const remnant=sections.flatMap(s=>s.line||[
    {x:s.gap,y:s.y-170},{x:s.gap,y:s.y+180}
  ]).sort((a,b)=>a.y-b.y).map(p=>({...p}));
  // Keep the arrival apron and the final doorstep clean. District boundaries
  // fan out gently, with no transverse seam or sudden wall of mud.
  for(let i=0;i<remnant.length;i++){
    const a=remnant[Math.max(0,i-1)],p=remnant[i],b=remnant[Math.min(remnant.length-1,i+1)];
    const slope=Math.max(Math.abs(p.x-a.x)/Math.max(80,p.y-a.y),Math.abs(b.x-p.x)/Math.max(80,b.y-p.y));
    p.clearance=51+Math.min(58,slope*32);
  }
  for(const side of [-1,1]){
    const type=stage===2||stage===0&&side===turn?'gravel':'mud';
    const p=groundBank({side,line:remnant,halfGap:51,type,seed:wornRand()*80,rand:wornRand,id:0});
    Object.assign(p,{roadDecay:true,underlay:true,depth:type==='mud'?7:4.5,
      groundStyle:type==='mud'?'silt':stage===2?'subbase':'rubble'});
    patches.unshift(p);
  }
  // A few surviving asphalt islands offer a real choice. Open both shoulders
  // around the existing depression, keeping its water, grit and slippery iron.
  // The same sampled edge drives the baked art and shoe contact: no invisible
  // clean corridor, extra collision objects, or second route to solve at runtime.
  for(const section of sections.filter(s=>s.kind==='fork'||stage===3&&s.coverPattern==='pair')){
    const fork=section.kind==='fork',left=fork?Math.min(...section.lanes)-62:330;
    const right=fork?Math.max(...section.lanes)+62:Math.max(section.gap+62,570);
    const plateau=fork?270:260,reach=plateau+155;
    for(const bank of patches.filter(p=>p.roadDecay))for(let i=0;i<bank.edge.length;i++){
      const y=bank.y-bank.ry+i*bank.rowHeight,dy=Math.abs(y-section.y);
      const t=clamp((reach-dy)/(reach-plateau),0,1),blend=t*t*(3-2*t);
      const limit=(bank.bankSide<0?left:right)-450;
      const opened=bank.bankSide<0?Math.min(bank.edge[i],limit):Math.max(bank.edge[i],limit);
      bank.edge[i]+=(opened-bank.edge[i])*blend;
    }
    section.choice=fork?'around-the-pothole':'covers-or-bank';
  }
  // Each neighbourhood sheds something different into the remaining asphalt.
  // Opposing tongues alternate with short landing pockets. Their tips can be
  // stepped over; blindly following the old clean strip catches every other toe.
  // No new solids: a dirty mistake always remains physically recoverable.
  const contaminationRand=randomSource(seed^0x603d2f91);
  const contaminants=['clay','tar','cement','algae','clay'];
  const laneAt=y=>{
    let n=remnant.findIndex(p=>p.y>y);if(n<0)n=remnant.length-1;
    const a=remnant[Math.max(0,n-1)],b=remnant[n],t=clamp((y-a.y)/Math.max(1,b.y-a.y),0,1);
    return a.x+(b.x-a.x)*t;
  };
  for(const [n,section] of sections.entries()){
    // Preserve the physical stone chain; its muddy approaches still demand care.
    if(section.kind==='stepping-stones')continue;
    const type=stage===4&&n%2?'tar':contaminants[stage];
    const count=stage===0&&n===0?1:stage===2?3:2;
    for(let i=0;i<count;i++){
      const side=(n+i)%2?1:-1,y=section.y-90+i*126;
      const x=clamp(laneAt(y)+side*77,155,745),rx=82+contaminationRand()*9;
      const p=add(type,x,y,rx,30+contaminationRand()*8,
        type==='clay'?10:type==='cement'?8:type==='tar'?3.5:4,side*.13);
      Object.assign(p,{contaminant:true,flatResidue:true,surfaceFilm:true,
        // Thin tar films are baked; their stretching contact threads remain dynamic.
        bakedSticky:type==='tar',encounter:n,sourceSide:side});
    }
  }
  patches.forEach((p,id)=>{p.id=id;});
  return indexStreet({ seed, profile, patches, obstacles, clutter, sections, parking, parkingSide });
}
export function makeStreet(seed) {
  const rand = randomSource(seed ^ 0x1000006d), districts = [];
  const street = {seed, patches:[], obstacles:[], clutter:[], sections:[], parking:[], districts};
  const count = ROAD.length / DISTRICT_LENGTH;
  for (let i = 0; i < count; i++) {
    const local = makeDistrict(i ? Math.floor(rand()*0x100000000) : seed,i), offset = ROAD.start + i * DISTRICT_LENGTH;
    // Only the real entrance and finish have paired access posts. Districts join
    // into one continuous road, with fresh layouts and parking sides each time.
    local.obstacles = local.obstacles.filter(o => o.type !== 'bollard' ||
      (o.y !== 630 || i === 0) && (o.y !== DISTRICT_LENGTH - 180 || i === count - 1));
    indexStreet(local);
    districts.push({offset, index:i, profile:DISTRICTS[i], first:i===0, last:i===count-1, street:local});
    for (const key of ['patches','obstacles','clutter','sections','parking']) {
      for (const item of local[key]) street[key].push({...item, y:item.y+offset,
        ...(['patches','obstacles'].includes(key) ? {id:street[key].length} : {}),...(item.line?{line:item.line.map(p=>({...p,y:p.y+offset}))}:{})});
    }
  }
  street.parkingSide = districts[0].street.parkingSide;
  return indexStreet(street);
}

function initialMask() {
  return Array.from({ length: GRID.width * GRID.height }, (_, i) => {
    const x = (i % GRID.width + .5) / GRID.width * 2 - 1, y = (Math.floor(i / GRID.width) + .5) / GRID.height;
    const w = y < .22 ? Math.sqrt(Math.max(0, 1 - ((y - .22) / .22) ** 2)) * .96 : y > .82 ? Math.sqrt(Math.max(0, 1 - ((y - .82) / .18) ** 2)) * .73 : .96 - (y - .22) * .32;
    return Math.abs(x) < w && !(y > .71 && y < .9 && Math.abs(x) < .43) ? 1 : 0;
  });
}
function foot(x, y, side) {
  const n = GRID.width * GRID.height;
  return { x, y, side, bestY: y, z: 0, vx: 0, vy: 0, vz: 0, angle: side ? .04 : -.04, landedAt: -10, flightDuration: .5, stain: new Float32Array(n), permanentStain: new Float32Array(n), deposits: new Float32Array(n), depositTypes: new Uint8Array(n), wetness: new Float32Array(n), smearX: new Float32Array(n), smearY: new Float32Array(n), contactLoads: new Float32Array(n), heights: null, spatter: [], tint: new Float32Array(n * 3), contactDepths: new Float32Array(n), contactTypes: new Uint8Array(n), contactPose: '', coverage: 0, revision: 0, jeans: [], sticky: 0, stickyType: 'gum', sole: Array.from({length:8},()=>({wet:0,dirt:0,stain:0,permanentStain:0,stainType:'mud',type:'mud'})), lastSurface: 'dry', exposure: 'dry', dirtSource: 'dry', dirtAt: -10 };
}
export function createGame(shoeId = 'leather', seed = Math.floor(Math.random() * 0xffffffff)) {
  if (!SHOES[shoeId]) throw new RangeError('Unknown shoe material');
  return { shoeId, street: makeStreet(seed), feet: [foot(420, 260, 0), foot(480, 240, 1)], active: 0, mode: 'idle', phase: 'ready', aim: { x: 0, y: 1 }, charge: 0, stepTime: 0, time: 0, steps: 0, chain: 0, bestChain: 0, stylePoints: 0, cleanSteps: 0, stepCoverage: 0, flowDistance:0, flowUntil:0, flowClean:100, bestFlow:1, closeCalls:0, crossings:0, blockIndex:0, blockClean:100, blockTravel:0, blockPoints:0, blocks:Array.from({length:STRETCH.count},()=>({done:false,clean:false,loss:0})), particles: [], rings: [], prints: [], smears: [], crumbs: [], groundContacts: [], pressedPatches: new Map(), mask: initialMask(), random: randomSource(seed + 931), events: [], accumulator: 0, contactClock: 0, impact: 0 };
}
const maskAt = (g, f, i) => g.mask[f.side ? Math.floor(i / GRID.width) * GRID.width + GRID.width - 1 - i % GRID.width : i];
// The silhouette and grid coordinates stay fixed while a shoe moves. Keep the
// original cell order so accumulated contact amounts remain bit-for-bit stable.
const cellU=Float64Array.from({length:GRID.width*GRID.height},(_,i)=>(i%GRID.width+.5)/GRID.width);
const cellX=cellU.map(u=>u-.5),cellY=Float64Array.from(cellU,(_,i)=>.5-(Math.floor(i/GRID.width)+.5)/GRID.height);
const silhouettes=new WeakMap();
function shoeCells(g,f){
  let sides=silhouettes.get(g.mask);
  if(!sides){
    sides=[[],[]];
    for(let i=0;i<g.mask.length;i++){
      if(g.mask[i])sides[0].push(i);
      if(g.mask[Math.floor(i/GRID.width)*GRID.width+GRID.width-1-i%GRID.width])sides[1].push(i);
    }
    silhouettes.set(g.mask,sides);
  }
  return sides[f.side];
}
export function setShoeMask(g, mask) { if (mask.length === GRID.width * GRID.height && mask.some(Boolean)) { g.mask = mask.map(Boolean); g.feet.forEach(f => { f.contactPose = ''; f.heights = null; coverage(g, f); }); } }
function coverage(g, f) {
  const cells=shoeCells(g,f);let sum=0;for(const i of cells)sum+=f.stain[i];
  const upper=cells.length?sum/cells.length:0,tread=f.sole.reduce((total,z)=>total+z.stain,0)/f.sole.length;
  // A saturated tread is a fully dirty shoe even when its raised tongue stays
  // white. Upper stains contribute too, without charging twice for the same dirt.
  f.coverage=clamp(tread+(1-tread)*upper,0,1);
}
export const condition = (g, side) => side === undefined ? (condition(g, 0) + condition(g, 1)) / 2 : clamp((1 - g.feet[side].coverage) * 100, 0, 100);
export const progress = g => g.phase==='finished'?1:clamp((Math.min(g.feet[0].y, g.feet[1].y) - ROAD.start) / ROAD.length, 0, 1);
export const flowMultiplier = g => 1 + Math.min(2, Math.floor(g.flowDistance / 400));
export const flowRemaining = g => g.flowDistance ? (['flight','settling'].includes(g.mode) ? g.flowAtLaunch || 0 : clamp((g.flowUntil - g.time) / FLOW_WINDOW, 0, 1)) : 0;
export function scoreBreakdown(g) {
  const cleanliness = 9000 * (condition(g) / 100) ** 2 * progress(g);
  const finish = g.phase === 'finished' ? 1000 : 0;
  const footwork = g.stylePoints, multiplier = SHOES[g.shoeId].bonus;
  const stretches = g.blockPoints;
  const base = cleanliness + finish + footwork + stretches, total = Math.round(base * multiplier);
  // Round only for display; keep the existing score calculation unchanged.
  const cleanPoints = Math.round(cleanliness);
  return {cleanliness:cleanPoints, footwork, stretches, finish, material:total - cleanPoints - footwork - stretches - finish, multiplier, total};
}
export const score = g => scoreBreakdown(g).total;
export function surfaceAt(g, x, y, patches = nearby(g.street, y).patches) {
  let found = null, depth = 0, priority = -1;
  if (isPavement(y)) return { type: 'dry', depth: 0, dirt: 0, grip: MATERIALS.dry.grip, patch: null };
  for (const p of patches) {
    if (Math.abs(x - p.x) > (Math.abs(p.rx*p.cos)+Math.abs(p.ry*p.sin))*1.2 || Math.abs(y - p.y) > (Math.abs(p.rx*p.sin)+Math.abs(p.ry*p.cos))*1.2) continue;
    // Material deposited ON a raised cover touches the shoe before the iron.
    // Ordinary water and mud beneath a cover still cannot seep through it.
    const d = puddleDepth(p, x, y), rank = p.roadDecay ? 0 : p.onCover ? 4 : p.type === 'metal' || p.type === 'stone' ? 3 : p.contaminant ? 2.5 : p.surfaceFilm || p.type === 'gum' || p.type === 'poop' ? 2 : 1;
    if (d > 0 && (rank > priority || (rank === priority && d > depth))) { found = p; depth = d; priority = rank; }
  }
  const type = found?.type || 'dry', mat = MATERIALS[type];
  return { type, depth, dirt: mat.dirt, grip: mat.grip, patch: found };
}
function surfaceCandidates(patches){
  return patches.map(p=>({p,rank:p.roadDecay?0:p.onCover?4:p.type==='metal'||p.type==='stone'?3:p.contaminant?2.5:p.surfaceFilm||p.type==='gum'||p.type==='poop'?2:1,liquid:Boolean(MATERIALS[p.type].liquid),
    rx:(Math.abs(p.rx*p.cos)+Math.abs(p.ry*p.sin))*1.2,
    ry:(Math.abs(p.rx*p.sin)+Math.abs(p.ry*p.cos))*1.2})).sort((a,b)=>b.rank-a.rank);
}
// Contact grids visit the same few patches hundreds of times. Prepare their
// bounds and priority once, then reuse one result instead of allocating a
// surface object for every cell. The returned result is borrowed until the
// next sample; callers that retain it must copy it.
export function createSurfaceSampler(patches){
  const candidates=surfaceCandidates(patches);
  const result={type:'dry',depth:0,dirt:0,grip:MATERIALS.dry.grip,patch:null};
  return (x,y)=>{
    let found=null,depth=0,priority=-1;
    if(!isPavement(y))for(const {p,rank,rx,ry} of candidates){
      if(rank<priority)break;
      if(Math.abs(x-p.x)>rx||Math.abs(y-p.y)>ry||(rank===priority&&p.depth<=depth))continue;
      const d=puddleDepth(p,x,y);
      if(d>0&&(rank>priority||d>depth)){found=p;depth=d;priority=rank;}
    }
    const type=found?.type||'dry',material=MATERIALS[type];
    result.type=type;result.depth=depth;result.dirt=material.dirt;result.grip=material.grip;result.patch=found;
    return result;
  };
}
// A footprint samples one immutable neighbourhood thousands of times. Cache its
// bounds and priority once; ordinary walking keeps the lightweight surfaceAt path.
// Covers and deposits still win in exactly the same order as contact physics.
export function createSubmersionTest(patches){
  if(!patches.some(p=>MATERIALS[p.type].liquid))return ()=>false;
  const candidates=surfaceCandidates(patches);
  return (x,y)=>{
    if(isPavement(y))return false;
    let priority=-1,depth=0,liquid=false;
    for(const candidate of candidates){
      const {p,rank}=candidate;
      if(rank<priority)break;
      if(Math.abs(x-p.x)>candidate.rx||Math.abs(y-p.y)>candidate.ry)continue;
      if(rank===priority&&p.depth<=depth)continue;
      const d=puddleDepth(p,x,y);
      if(d>0&&(rank>priority||d>depth)){
        priority=rank;depth=d;liquid=candidate.liquid;
      }
    }
    return liquid&&depth>=.3;
  };
}
export function footPoint(f, lx, ly) { const c = Math.cos(f.angle), s = Math.sin(f.angle); return { x: f.x + lx * c + ly * s, y: f.y - lx * s + ly * c }; }
function localPoint(f, x, y) { const dx = x - f.x, dy = y - f.y, c = Math.cos(f.angle), s = Math.sin(f.angle); return { x: dx * c - dy * s, y: dx * s + dy * c }; }
export function shoeContainsPoint(g,f,x,y){
  const shoe=SHOES[g.shoeId],p=localPoint(f,x,y);
  const col=Math.floor((p.x/shoe.width+.5)*GRID.width),row=Math.floor((.5-p.y/shoe.length)*GRID.height);
  return col>=0&&col<GRID.width&&row>=0&&row<GRID.height&&Boolean(maskAt(g,f,row*GRID.width+col));
}
// Reject distant patches once per footprint, before sampling its contact grid.
// 1.155 bounds every ripple of boundary(); the rotated rectangle is deliberately
// conservative, so even a wet toe at an irregular edge still gets full physics.
function footprintPatches(g, f) {
  const shoe=SHOES[g.shoeId],c=Math.abs(Math.cos(f.angle)),s=Math.abs(Math.sin(f.angle));
  const rx=(shoe.width*c+shoe.length*s)*.5+1,ry=(shoe.width*s+shoe.length*c)*.5+1;
  return nearby(g.street,f.y).patches.filter(p=>{
    if(Math.abs(p.x-f.x)>rx+1.155*(Math.abs(p.rx*p.cos)+Math.abs(p.ry*p.sin))||
       Math.abs(p.y-f.y)>ry+1.155*(Math.abs(p.rx*p.sin)+Math.abs(p.ry*p.cos)))return false;
    if(p.groundField&&!p.dirtRoad){
      // Long failed shoulders surround a narrow dry remnant. A rectangular
      // bound alone would sample every shoe cell even on that clean asphalt.
      // Include both endpoints of every intersecting linear edge segment: the
      // resulting envelope is conservative for rotated toes and heels too.
      const low=Math.max(0,Math.floor((f.y-ry-p.y+p.ry)/p.rowHeight));
      const high=Math.min(p.edge.length-1,Math.ceil((f.y+ry-p.y+p.ry)/p.rowHeight));
      if(low>high)return false;
      let edge=p.bankSide<0?-Infinity:Infinity;
      for(let i=low;i<=high;i++)edge=p.bankSide<0?Math.max(edge,p.edge[i]):Math.min(edge,p.edge[i]);
      return p.bankSide<0?f.x-rx<p.x+edge:f.x+rx>p.x+edge;
    }
    return true;
  });
}
export function constrainTarget(g, p, backwardReach = 155) {
  const support = g.feet[1 - g.active], shoe = SHOES[g.shoeId];
  let dx = clamp(p.x, ROAD.left + shoe.width, ROAD.right - shoe.width) - support.x, dy = clamp(p.y - support.y, -backwardReach, 220);
  const reach = Math.hypot(dx / 185, dy / 220); if (reach > 1) { dx /= reach; dy /= reach; }
  // A small overlap is possible while turning, but the legs cannot swap sides.
  if (g.active === 0) dx = Math.min(dx, -27); else dx = Math.max(dx, 27);
  // Side separation must not push a maximum-length preview outside the reach ellipse.
  const verticalReach = 220 * Math.sqrt(Math.max(0, 1 - (dx / 185) ** 2));
  dy = clamp(dy, -verticalReach, verticalReach);
  return { x: clamp(support.x + dx, ROAD.left + shoe.width, ROAD.right - shoe.width), y: Math.max(100, support.y + dy) };
}
function landingContact(g, f) {
  const shoe = SHOES[g.shoeId];
  let risk = 0, material = 'dry', wetCells = 0, cells = 0;
  const c = Math.cos(f.angle), s = Math.sin(f.angle), patches = footprintPatches(g,f);
  if(!patches.length)return {risk:0,material:'dry',wetFraction:0};
  const sample=createSurfaceSampler(patches);
  // Inspect the same silhouette used by contact physics, including the toe and heel.
  // Nine rectangle samples missed small puddles and warned about empty shoe corners.
  for (const i of shoeCells(g,f)) {
    cells++;
    const x = cellX[i] * shoe.width;
    const y = cellY[i] * shoe.length;
    const surface = sample(f.x + x * c + y * s, f.y - x * s + y * c);
    if (surface.depth <= .3 || !surface.dirt) continue;
    wetCells++;
    if (surface.dirt * surface.depth > risk) { risk = surface.dirt * surface.depth; material = surface.type; }
  }
  return {risk, material, wetFraction:cells ? wetCells / cells : 0};
}
function hasDirtyContact(g,f){
  const patches=footprintPatches(g,f);if(!patches.length)return false;
  const sample=createSurfaceSampler(patches),shoe=SHOES[g.shoeId],c=Math.cos(f.angle),s=Math.sin(f.angle);
  for(const i of shoeCells(g,f)){
    const x=cellX[i]*shoe.width,y=cellY[i]*shoe.length,surface=sample(f.x+x*c+y*s,f.y-x*s+y*c);
    if(surface.depth>.3&&surface.dirt)return true;
  }
  return false;
}
// Sound uses the area beneath the actual shoe at touchdown, not the aim marker
// or just its centre. A wet toe and a dry heel can make both sounds together.
function landingSounds(g, f) {
  const shoe=SHOES[g.shoeId],samples=shoeCells(g,f),c=Math.cos(f.angle),s=Math.sin(f.angle);
  if(!samples.length)return [];
  const radius=(Math.abs(shoe.width*s)+Math.abs(shoe.length*c))*.5,low=f.y-radius,high=f.y+radius;
  if(high<=PAVEMENT.startEnd||low>=PAVEMENT.finishStart)return [{surface:'concrete',fraction:1,depth:0}];
  const patches=footprintPatches(g,f);
  // A fully dry landing away from a paving seam has exactly one sound. Partial
  // puddle contact and apron boundaries still use every silhouette cell.
  if(!patches.length&&low>PAVEMENT.startEnd&&high<PAVEMENT.finishStart)return [{surface:'asphalt',fraction:1,depth:0}];
  const areas=new Map(),sample=createSurfaceSampler(patches);
  let cells=0;
  for(const i of samples){
    const x=cellX[i]*shoe.width,y=cellY[i]*shoe.length,wx=f.x+x*c+y*s,wy=f.y-x*s+y*c;
    const ground=sample(wx,wy);
    const surface=ground.type==='dry'?(isPavement(wy)?'concrete':'asphalt'):ground.type;
    const area=areas.get(surface)||{surface,cells:0,depth:0};area.cells++;area.depth+=ground.depth;areas.set(surface,area);cells++;
  }
  return [...areas.values()].map(a=>({surface:a.surface,fraction:a.cells/cells,depth:a.depth/a.cells})).sort((a,b)=>b.fraction-a.fraction);
}
export function planStep(g, point) {
  if (g.phase !== 'walking' || g.mode !== 'idle' || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return null;
  const f = g.feet[g.active],support=g.feet[1-g.active],front=Math.max(f.y,support.y);
  // A deliberate lateral placement can recover from a bad approach to a solid
  // obstacle. A stretched leading foot may also gather toward its partner,
  // never behind it. This shortens the stance without reversing walk progress.
  const gathering=f.y>support.y+12&&point.y<=f.y-12;
  const lateral=Math.abs(point.x-f.x)>=12&&point.y>=f.y-.75&&point.y<front+24;
  const minimumY=gathering?Math.max(support.y,f.y-GATHER_REACH):lateral?f.y:front+24;
  // A pixel-rounded click at the shortest legal step must not become a rejection.
  const requested=point.y>=minimumY-.75?{...point,y:Math.max(point.y,minimumY)}:point;
  const target = constrainTarget(g, requested), shoe = SHOES[g.shoeId];
  const dx = target.x - f.x, dy = target.y - f.y;
  const angle = clamp(Math.atan2(dx, Math.abs(dy) + 1), -.7, .7) * .35;
  // Aiming only needs reach and obstacle clearance. Keep the detailed surface
  // forecast available to route tools, but don't sample a whole shoe until a
  // caller asks for it. Capture this pose and silhouette, not the moving foot.
  const context = { street:g.street, shoeId:g.shoeId, mask:g.mask };
  const pose = {...target, angle, side:f.side};
  let contact;
  const inspect = () => contact ||= landingContact(context, pose);
  let blocked = false;
  // The preview warns about furniture along the whole stride, not just at its end.
  const ca=Math.cos(angle),sa=Math.sin(angle);
  const probes=[-.32,0,.32].map(along=>({x:along*shoe.length*sa,y:along*shoe.length*ca}));
  for (let n = 0; n <= 12 && !blocked; n++) {
    const x=f.x+dx*n/12,y=f.y+dy*n/12;
    for (const o of nearby(g.street, y).obstacles) for (const probe of probes) {
      const ox = Math.max(0, Math.abs(x + probe.x - o.x) - (o.halfWidth || 0));
      const oy = Math.max(0, Math.abs(y + probe.y - o.y) - (o.halfLength || 0));
      if (Math.hypot(ox, oy) < (o.halfWidth ? 0 : o.r) + shoe.width * .48) blocked = true;
    }
  }
  const sideways=lateral&&Math.abs(target.x-f.x)>=12;
  const backward = requested.y < minimumY || target.y < minimumY-.001;
  const stride = target.y - Math.max(f.y, g.feet[1 - g.active].y);
  g.preview = { ...target, angle, get risk(){return inspect().risk;}, get material(){return inspect().material;}, get wetFraction(){return inspect().wetFraction;}, blocked, backward, stride, sideways, gathering, soft:stride<95, limited: Math.hypot(point.x - target.x, point.y - target.y) > 14, valid: !backward && (gathering ? dy<=-12 : lateral ? sideways&&dy>=0 : dy>=24) };
  return g.preview;
}
// Shift weight while both shoes are planted. Selecting a foot never moves it,
// cleans it, or awards points.
export function selectFoot(g, side = 1 - g.active) {
  if (g.phase !== 'walking' || g.mode !== 'idle' || ![0, 1].includes(side) || side === g.active) return false;
  g.active = side; g.preview = null;
  suggestStep(g);
  return true;
}
// A recovery is a small, ordinary placement, never a reset or a route through
// the obstacle. It only helps with the stance immediately against a repair rail.
export function recoveryBarrier(g) {
  if(g.phase!=='walking')return null;
  const shoe=SHOES[g.shoeId];
  return g.street.obstacles.find(o=>o.type==='barrier'&&g.feet.some(f=>
    f.y>=o.y-o.halfLength-110&&f.y<=o.y+o.halfLength+shoe.length*.5&&
    Math.abs(f.x-o.x)<o.halfWidth+35))||null;
}
export function recoverFooting(g) {
  const rail=recoveryBarrier(g);
  if(!rail||g.mode!=='idle')return false;
  const sign=rail.x<450?1:-1,outer=sign>0?1:0,edge=rail.x+sign*rail.halfWidth;
  // Leave more than a minimum sidestep beyond the detection margin. Otherwise
  // a diagonal approach can stop just short of clear with <12 units left to go.
  const wanted=side=>edge+sign*(side===outer?95:55);
  const distance=(feet)=>feet.reduce((sum,f)=>sum+Math.max(0,(wanted(f.side)-f.x)*sign),0);
  const spread=Math.abs(g.feet[0].y-g.feet[1].y),before=distance(g.feet);
  let best=null;
  for(const side of [outer,1-outer]){
    const f=g.feet[side],support=g.feet[1-side],x=f.x+clamp(wanted(side)-f.x,-110,110);
    const ys=[f.y];
    if(f.y>support.y+12)ys.push(Math.max(support.y,f.y-90),Math.max(support.y,f.y-45));
    for(const y of ys)for(const targetX of [x,f.x]){
      const state={...g,active:side,preview:null},p=planStep(state,{x:targetX,y});
      if(!p?.valid||p.blocked)continue;
      const feet=g.feet.map(foot=>foot.side===side?{...foot,x:p.x,y:p.y}:foot);
      const value=before-distance(feet)+Math.max(0,spread-90)-Math.max(0,Math.abs(feet[0].y-feet[1].y)-90);
      if(value>1&&(!best||value>best.value))best={side,x:p.x,y:p.y,value};
    }
  }
  if(!best)return false;
  if(g.active!==best.side)selectFoot(g,best.side);
  if(!takeStep(g,best))return false;
  g.recoveringStep=true;
  return true;
}
export function suggestStep(g) {
  const support = g.feet[1 - g.active];
  return planStep(g, { x: support.x + (g.active ? 60 : -60), y: Math.max(support.y + 175, g.feet[g.active].y + 24) });
}
export function takeStep(g, point) {
  if (point && !planStep(g, point)) return false;
  if (g.phase !== 'walking' || g.mode !== 'idle' || !g.preview?.valid) return false;
  const f = g.feet[g.active], target = { x: g.preview.x, y: g.preview.y };
  const distance = Math.hypot(target.x - f.x, target.y - f.y);
  prepareStride(g, target);
  g.gatheringStep = Boolean(g.preview.gathering);
  g.origin = { x: f.x, y: f.y }; g.target = target; g.stepCoverage = f.coverage;
  g.charge = clamp(distance / 300, 0, 1); g.stepTime = 0; g.mode = 'flight'; g.directStep = true; g.preview = null;
  f.strideDuration = .32 + distance / 1800 + f.sticky * .08;
  f.flightDuration = f.strideDuration / STEP_PACE;
  f.vx = f.vy = 0; f.vz = 475 * f.strideDuration; f.sticky *= .45;
  return true;
}
export function beginStep(g) {
  if (g.phase !== 'walking' || g.mode !== 'idle') return false;
  g.mode = 'charging'; g.directStep = false; g.preview = null; g.charge = 0; g.stepTime = 0; g.aim = { x: 0, y: 1 };
  const f = g.feet[g.active]; g.origin = { x: f.x, y: f.y }; g.stepCoverage = f.coverage; return true;
}
export function aimStep(g, vector) {
  const len = Math.hypot(vector.x, vector.y);
  if (g.mode === 'charging' && Number.isFinite(len) && len > 2) g.aim = { x: vector.x / len, y: vector.y / len };
}
export function predictedTarget(g) {
  const f = g.feet[g.active], origin = g.origin || f, distance = 35 + 310 * g.charge ** 1.35;
  return constrainTarget(g, { x: origin.x + g.aim.x * distance, y: origin.y + g.aim.y * distance });
}
export function cancelStep(g) {
  g.preview = null;
  if (g.mode !== 'charging') return;
  const f = g.feet[g.active]; Object.assign(f, g.origin, { z: 0, vx: 0, vy: 0, vz: 0 }); g.mode = 'idle'; g.charge = 0;
}
export function releaseStep(g) {
  if (g.mode !== 'charging') return false;
  const f = g.feet[g.active], target = predictedTarget(g), duration = .36 + g.charge * .2 + f.sticky * .12;
  if (target.y < Math.max(g.origin.y, g.feet[1 - g.active].y) + 24) { cancelStep(g); return false; }
  prepareStride(g, target);
  g.target = target; g.mode = 'flight'; g.stepTime = 0; f.flightDuration = duration;
  const adhesion = 1 - f.sticky * .18;
  f.vx = (target.x - f.x) / duration * 1.05 * adhesion;
  f.vy = (target.y - f.y) / duration * 1.05 * adhesion;
  f.vz = (950 * duration * .5 - f.z / duration); f.sticky *= .45;
  return true;
}
function prepareStride(g, target) {
  g.gatheringStep = false;
  g.recoveringStep = false;
  if (g.time > g.flowUntil) g.flowDistance = 0;
  g.flowAtLaunch = flowRemaining(g);
  g.strideFront = Math.max(...g.feet.map(f=>f.y));
  g.strideBack = Math.min(...g.feet.map(f=>f.y));
  g.strideClean = condition(g);
  g.crossingDistance = 0;g.hitStop=false;
  g.strideStartedDry = !hasDirtyContact(g, g.feet[g.active]);
  g.strideAdvance = Math.max(0, target.y - g.strideFront);
  // A shorter placement lowers the heel gently; a long stride carries more impact.
  g.landingForce = clamp(.42 + g.strideAdvance / 190 * .85, .5, 1.4);
}
function breakFlow(g, reason) {
  if (g.flowDistance) g.events.push({type:'flowLost',reason});
  g.flowDistance = 0; g.flowUntil = 0;
}
function landingMargin(g, f) {
  const shoe=SHOES[g.shoeId];
  // Only judge after touchdown; the aim marker never classifies a surface.
  for (const margin of [8, 20, 38]) for (let i=0;i<20;i++) {
    const a=i/20*Math.PI*2,p=footPoint(f,Math.cos(a)*(shoe.width/2+margin),Math.sin(a)*(shoe.length/2+margin));
    const surface=surfaceAt(g,p.x,p.y);
    if(surface.dirt>.1&&surface.depth>.5)return margin;
  }
  return Infinity;
}
function completeStretch(g) {
  const clean=condition(g);
  while(g.blockIndex<STRETCH.count&&progress(g)*ROAD.length>=(g.blockIndex+1)*STRETCH.length){
    const loss=Math.max(0,g.blockClean-clean),won=loss<=1+.00001&&g.blockTravel>=STRETCH.length*.6;
    g.blocks[g.blockIndex]={done:true,clean:won,loss};
    const points=won?400:0;g.blockPoints+=points;
    g.events.push({type:'stretch',index:g.blockIndex,clean:won,points,loss});
    g.blockIndex++;g.blockClean=clean;g.blockTravel=0;
  }
}
// A height field follows the outside silhouette, not dark lace holes or the collar.
// Ground contact reaches the rubber rim first, then the toe box, then the vamp.
export function shoeHeights(g, f) {
  if (f.heights) return f.heights;
  const {width:w,height:h}=GRID, heights=new Float32Array(w*h), rows=[],cols=[];
  for(let y=0;y<h;y++){const xs=[];for(let x=0;x<w;x++)if(maskAt(g,f,y*w+x))xs.push(x);rows.push([xs[0]??w,xs.at(-1)??-1]);}
  for(let x=0;x<w;x++){const ys=[];for(let y=0;y<h;y++)if(maskAt(g,f,y*w+x))ys.push(y);cols.push([ys[0]??h,ys.at(-1)??-1]);}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;if(!maskAt(g,f,i)){heights[i]=Infinity;continue;}
    const edge=Math.min((x-rows[y][0]+.5)/w,(rows[y][1]-x+.5)/w,
      (y-cols[x][0]+.5)/h*2.3,(cols[x][1]-y+.5)/h*2.3);
    const v=(y+.5)/h, crown=v<.32?17:v<.6?17+(v-.32)*55:34;
    heights[i]=.5+Math.pow(clamp((edge-.018)/.28,0,1),.8)*crown;
  }
  return f.heights=heights;
}
// Raised material is separate from absorbed colour: water cannot turn into mud lumps.
export const RESIDUE = {water:0,mud:1,oil:0,gum:1.5,poop:1.25,gravel:.35,metal:0,dry:0,stone:0,clay:1.35,tar:1.6,cement:.85,algae:.2};
function deposit(g, f, i, amount, type) {

  if (amount <= 0) return 0;
  const old = f.stain[i], added = (1 - old) * (1 - Math.exp(-amount * SHOES[g.shoeId].absorption));
  const relief=RESIDUE[type]*(1-f.deposits[i])*(1-Math.exp(-amount*.7));
  if (added < .00001 && relief < .00001) return 0;
  const color = MATERIALS[type].color, total = old + added;
  for (let c = 0; c < 3; c++) f.tint[i * 3 + c] = (f.tint[i * 3 + c] * old + color[c] * added) / total;
  f.stain[i] = total;
  f.permanentStain[i]=Math.min(total,f.permanentStain[i]+added*stainFixation(type));
  if(RESIDUE[type]){
    const mass=relief;
    if(mass>f.deposits[i]*.2||f.deposits[i]<.02)f.depositTypes[i]=MATERIAL_NAMES.indexOf(type);
    f.deposits[i]=Math.min(1,f.deposits[i]+mass);
  }
  if(MATERIALS[type].liquid)f.wetness[i]=Math.max(f.wetness[i],clamp(amount*14,.35,1));
  const speed=Math.hypot(f.vx,f.vy);
  if(speed>8){
    const c=Math.cos(f.angle),s=Math.sin(f.angle),weight=clamp(amount*3,0,1),drag=Math.min(1,speed/140);
    f.smearX[i]=f.smearX[i]*(1-weight)+(f.vx*c-f.vy*s)/speed*drag*weight;
    f.smearY[i]=f.smearY[i]*(1-weight)-(f.vx*s+f.vy*c)/speed*drag*weight;
  }
  f.revision++; f.dirtSource = type; f.dirtAt = g.time;
  return added;
}
export function stainAt(g, f, x, y, radius, strength, type = 'mud', height = Infinity) {
  const shoe = SHOES[g.shoeId], local = localPoint(f, x, y), old = f.revision, heights=shoeHeights(g,f);
  const u = (local.x / shoe.width + .5) * GRID.width, v = (.5 - local.y / shoe.length) * GRID.height;
  const ru = Math.max(.8, radius / shoe.width * GRID.width), rv = Math.max(.8, radius / shoe.length * GRID.height);
  for (let row = Math.max(0, Math.floor(v - rv)); row < Math.min(GRID.height, Math.ceil(v + rv)); row++) for (let col = Math.max(0, Math.floor(u - ru)); col < Math.min(GRID.width, Math.ceil(u + ru)); col++) {
    const i = row * GRID.width + col, r = ((col + .5 - u) / ru) ** 2 + ((row + .5 - v) / rv) ** 2;
    if (r < 1 && maskAt(g, f, i) && heights[i]<=height) deposit(g, f, i, strength * (1 - r), type);
  }
  if (f.revision !== old) coverage(g, f);
  return f.revision !== old;
}
function contactField(g,f,patches){
  const shoe=SHOES[g.shoeId],c=Math.cos(f.angle),s=Math.sin(f.angle);
  const pose = `${f.x.toFixed(1)},${f.y.toFixed(1)},${f.angle.toFixed(3)},${g.shoeId}`;
  if (f.contactPose !== pose) {
    const sample=createSurfaceSampler(patches);
    f.contactWaterDepth=0;
    for (const i of shoeCells(g,f)) {
      const lx = cellX[i] * shoe.width, ly = cellY[i] * shoe.length;
      const water = sample(f.x + lx * c + ly * s, f.y - lx * s + ly * c);
      f.contactDepths[i] = water.depth; f.contactTypes[i] = MATERIAL_NAMES.indexOf(water.type);
      if(water.type==='water')f.contactWaterDepth=Math.max(f.contactWaterDepth,water.depth);
      // Sediment is patchy within a puddle; its stable world field follows the
      // contact point, so stopping never rerolls a cosmetic dirt pattern.
      const wx=f.x+lx*c+ly*s,wy=f.y-lx*s+ly*c,seed=water.patch?.seed||0;
      const sediment=(Math.sin(wx*.27+seed)*Math.cos(wy*.19-seed*.4)+1)*.5;
      const grains=(Math.sin(wx*.79+wy*.43+seed)+1)*.5;
      f.contactLoads[i]=(['mud','poop','gravel'].includes(water.type)||MATERIALS[water.type].earthy)?.25+sediment*.95+grains*.6:.82+sediment*.36;
    }
    f.contactPose = pose;
  }
}
function contactDirt(g, f, dt, pressure=0) {
  const shoe = SHOES[g.shoeId];
  f.exposure = 'dry';
  if (f.z > 32) return;
  const patches=footprintPatches(g,f);
  if(!patches.length)return;
  const old = f.revision, heights=shoeHeights(g,f), speed = Math.hypot(f.vx, f.vy), c = Math.cos(f.angle), s = Math.sin(f.angle);
  const addedByMaterial = new Float64Array(MATERIAL_NAMES.length);
  contactField(g,f,patches);
  const rinse=pressure>0?waterRinse(f.contactWaterDepth||0):0;
  for (const i of shoeCells(g,f)) {
    const u = cellU[i], type = MATERIAL_NAMES[f.contactTypes[i]], mat = MATERIALS[type], depth = f.contactDepths[i];
    // Sticky litter and dry grit stay below the upper; liquid follows its actual waterline.
    const reach=mat.liquid?depth:Math.min(depth,mat.contactHeight??(type==='poop'?4:type==='gum'?1.8:1.1));
    if (!mat.dirt || reach <= f.z + heights[i]) continue;
    if(type==='water'&&rinse){
      // Only the immersed cells lose pigment and clay. Laces above the water,
      // the dry half of a toe and the other shoe keep their original marks.
      const washed=Math.max(0,f.stain[i]-f.permanentStain[i])*.32*rinse;
      const material=MATERIAL_NAMES[f.depositTypes[i]];
      const removed=f.deposits[i]*.55*rinse*(MATERIALS[material].rinse||0);
      const zone=Math.floor(i/GRID.width/(GRID.height/4))*2+Math.floor(i%GRID.width/(GRID.width/2));
      recordRinse(g,f,zone,washed/(GRID.width*GRID.height/8),f.tint,i*3);
      recordRinse(g,f,zone,removed*.4/(GRID.width*GRID.height/8),MATERIALS[material].color);
      if(washed>0||removed>0){f.stain[i]-=washed;f.deposits[i]-=removed;f.revision++;}
    }
    const absorption = mat.sticky ? 1.4 : type === 'oil' ? .9 : clamp((depth - f.z) / 22, .02, 1);
    // Touchdown presses pigment into the contacted rim immediately; soaking
    // continues more slowly. Both still obey the actual material waterline.
    // Loose dust adheres to a damp rim; only the cells that actually touch grit
    // gain this extra pigment and relief. Drying removes the extra adhesion.
    const adhesion=type==='gravel'?1+f.wetness[i]*.75:1;
    const sediment=type==='water'?1-.85*waterRinse(f.contactWaterDepth||0):1;
    const tide=type==='water'?1+Math.exp(-Math.max(0,reach-f.z-heights[i])/1.5)*.6:1;
    const amount = sediment * tide * (dt * 1.8 + pressure * 6) * mat.dirt * absorption * (.17 + speed / 220) * (.6 + Math.abs(u - .5) * 1.5) * (1+clamp((reach-f.z-heights[i])/8,0,1)) * f.contactLoads[i] * adhesion * (mat.pickup||1);
    addedByMaterial[f.contactTypes[i]] += deposit(g, f, i, amount, type); f.lastSurface = type;
    if(mat.liquid&&f.wetness[i]<.95){f.wetness[i]=.95;f.revision++;}
    if (mat.sticky) { f.sticky = Math.min(1, f.sticky + dt * .03); f.stickyType = type; }
  }
  if(rinse)for(const spot of f.spatter){
    const i=spot.cell;if(MATERIAL_NAMES[f.contactTypes[i]]!=='water'||f.contactDepths[i]<=f.z+heights[i])continue;
    const fixed=stainFixation(spot.type);spot.opacity=fixed+((spot.opacity??1)-fixed)*(1-.32*rinse);
  }
  if (old !== f.revision) {
    coverage(g, f);
    const dominant = addedByMaterial.indexOf(Math.max(...addedByMaterial));
    f.exposure = f.dirtSource = MATERIAL_NAMES[dominant];
  }
}
// Loose residue and bound pigment are separate on both tread and upper.
// Eight contact areas let a dipped toe leave a partial print, not a full wet shoe.
function soleContact(g, f, zone, visit, patches=nearby(g.street,f.y).patches) {
  const shoe = SHOES[g.shoeId];
  for (const u of [.25, .75]) for (const v of [.25, .75]) {
    const point = footPoint(f, ((zone % 2 + u) / 2 - .5) * shoe.width * .86,
      (.5 - (Math.floor(zone / 2) + v) / 4) * shoe.length * .9);
    visit(surfaceAt(g, point.x, point.y, patches),point);
  }
}
function collectSoleResidue(g, f, dt=0, landing=false) {
  if (f.z > 32) return;
  const patches=footprintPatches(g,f);if(!patches.length)return;
  const revision=f.revision;
  contactField(g,f,patches);
  const rinse=landing?waterRinse(f.contactWaterDepth||0):0;
  f.sole.forEach((sole, i) => {
    let wet = 0, dirt = 0, soil = 0, rinsed = 0, dominant = 0, soilDominant = 0, type = sole.type, stainType = sole.stainType;
    soleContact(g, f, i, surface => {
      const mat = MATERIALS[surface.type];
      if (surface.depth <= f.z + .3 || (!mat.liquid && f.z > .6)) return;
      if(surface.type==='water')rinsed+=rinse*.25;
      wet += mat.liquid ? .25 : surface.type === 'metal' ? .08 : 0;
      // Moisture is local to each tread area: a wet toe picks up more grit
      // without making the heel, the other shoe, or clean paving dirty.
      const adhesion=surface.type==='gravel'?1+sole.wet*.75:1;
      const load = surface.type === 'water' ? .025 : surface.type === 'metal' ? 0 : mat.dirt * .25 * adhesion;
      dirt += load;
      // A thin dirty film still touches the sole. Depth changes the load, but
      // does not make shallow puddles almost harmless. Clean covers stay safe.
      const soilLoad=mat.dirt * (mat.pickup||1) * .25 * (surface.type==='water'?.9*(1-.85*waterRinse(f.contactWaterDepth||0)):surface.type==='metal'?0:1) * (mat.liquid?clamp((surface.depth-f.z)/6,0,1):1) * adhesion;
      soil+=soilLoad;if(soilLoad>soilDominant){soilDominant=soilLoad;stainType=surface.type;}
      if (load > dominant) { dominant = load; type = surface.type; }
    },patches);
    if(rinsed){
      const washed=Math.max(0,sole.stain-sole.permanentStain)*.32*rinsed;
      const loose=sole.dirt*.55*rinsed*(MATERIALS[sole.type].rinse||0);
      recordRinse(g,f,i,washed,MATERIALS[sole.stainType].color);
      recordRinse(g,f,i,loose*.4,MATERIALS[sole.type].color);
      sole.stain-=washed;sole.dirt*=1-.55*rinsed*(MATERIALS[sole.type].rinse||0);
      if(washed>0)f.revision++;
    }
    sole.wet = Math.max(sole.wet, wet);
    if (dirt > sole.dirt * .5) sole.type = type;
    sole.dirt = Math.max(sole.dirt, dirt);
    // Each real landing presses another layer into the tread. Standing contact
    // soaks in more slowly; repeated polling cannot count as repeated steps.
    // Match the full landing-force range used by the stride and splash physics;
    // long steps through dirt must not stop getting heavier before touchdown does.
    const pressed=landing?.32*clamp(g.landingForce||1,.65,1.4):0;
    const added=soil*(pressed+dt*.12)*SHOES[g.shoeId].absorption/.66;
    if(added>0&&sole.stain<1){
      const before=sole.stain;sole.stain=Math.min(1,before+added);
      sole.permanentStain=Math.min(sole.stain,sole.permanentStain+(sole.stain-before)*stainFixation(stainType));
      // A little rinse water cannot recolour remaining black tar as brown mud.
      if(added>before*.15||before<.025)sole.stainType=stainType;
      f.revision++;f.dirtSource=stainType;f.dirtAt=g.time;
    }

  });
  if(f.revision!==revision)coverage(g,f);
}
// Loose clay can break off; the absorbed pigment and cleanliness score remain.
// Use a separate deterministic hash so shedding does not reroll future splashes.
const crumbNoise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function shedResidue(g,f,zones){
  const shoe=SHOES[g.shoeId],heights=shoeHeights(g,f);let detached=0,source=-1,biggest=0;
  for(let i=0;i<f.deposits.length;i++){
    const type=MATERIAL_NAMES[f.depositTypes[i]],mass=f.deposits[i];
    if(mass<.018||heights[i]>9||!(['mud','poop','gravel'].includes(type)||MATERIALS[type].earthy))continue;
    const point=footPoint(f,((i%GRID.width+.5)/GRID.width-.5)*shoe.width,(.5-(Math.floor(i/GRID.width)+.5)/GRID.height)*shoe.length);
    if(MATERIALS[surfaceAt(g,point.x,point.y).type].liquid)continue;
    const removed=mass*(.025+(1-f.wetness[i])*.09);
    f.deposits[i]-=removed;detached+=removed;if(removed>biggest){biggest=removed;source=i;}
  }
  const drop=(x,y,r,type,wet,seed)=>{
    const ground=surfaceAt(g,x,y);if(MATERIALS[ground.type].liquid&&ground.depth>.3)return;
    g.crumbs.push({x,y,r,type,wet,seed,born:g.time});
  };
  if(detached>0)f.revision++;
  if(detached>.02&&source>=0){
    const point=footPoint(f,((source%GRID.width+.5)/GRID.width-.5)*shoe.width,(.5-(Math.floor(source/GRID.width)+.5)/GRID.height)*shoe.length);
    drop(point.x,point.y,.45+Math.min(1,Math.sqrt(detached))*.8,MATERIAL_NAMES[f.depositTypes[source]],f.wetness[source],source+g.steps*11);
  }
  zones.forEach((zone,i)=>{
    if(zone.dirt<.11||!(['mud','poop','gravel'].includes(zone.type)||MATERIALS[zone.type].earthy))return;
    const seed=g.steps*83+i*19+f.side*7+g.street.seed;
    if(crumbNoise(seed)>.32)return;
    const point=footPoint(f,((i%2+.2+crumbNoise(seed+1)*.6)/2-.5)*shoe.width,(.5-(Math.floor(i/2)+crumbNoise(seed+2))/4)*shoe.length);
    drop(point.x,point.y,(zone.type==='gravel'?.3:.65)+zone.dirt*.9,zone.type,zone.wet,seed);
  });
  if(g.crumbs.length>80)g.crumbs.splice(0,g.crumbs.length-80);
}
function leaveFootprint(g, f) {
  settleGroundContact(g,f);
  const patches=footprintPatches(g,f);
  const zones = f.sole.map((sole, i) => {
    let receiving = 0;
    soleContact(g, f, i, surface => {
      // A submerged impression cannot remain on the water's surface.
      if (!MATERIALS[surface.type].liquid || surface.depth < .3) receiving += .25;
    },patches);
    const zone = {wet:sole.wet * receiving, dirt:sole.dirt * receiving, type:sole.type};
    sole.wet *= 1 - .46 * receiving;
    sole.dirt *= 1 - .38 * receiving;
    return zone;
  });
  shedResidue(g,f,zones);
  if (!zones.some(z => Math.max(z.wet, z.dirt) > .035)) return;
  const shoe = SHOES[g.shoeId];
  g.prints.push({x:f.x, y:f.y, angle:f.angle, side:f.side, width:shoe.width, length:shoe.length,
    born:g.time, life:zones.some(z => z.dirt > .035) ? 90 : 22, zones,
    force:g.landingForce||1,slipX:f.x-(g.lastLanding?.x??f.x),slipY:f.y-(g.lastLanding?.y??f.y)});
  if (g.prints.length > 90) g.prints.shift();
}
function jeansMark(g, f, type, strength) {
  f.jeans.push({ x: (g.random() - .5) * .75, y: g.random() * .7, r: 1.5 + g.random() * 4 * strength, type, opacity: .35 + g.random() * .45 });
  if (f.jeans.length > 70) f.jeans.shift();
}
export function emitSplash(g, f, water, impact, contactSamples) {
  // Landing already has masked sole samples. Other callers sample the named
  // patch here, so a toe graze never borrows the whole shoe's displaced volume.
  if (!contactSamples) {
    if (!water.patch || !MATERIALS[water.type].liquid) return;
    contactSamples = [];
    const patches = footprintPatches(g, f);
    for (let zone = 0; zone < 8; zone++) soleContact(g, f, zone, (surface, point) => {
      if (surface.patch === water.patch && shoeContainsPoint(g, f, point.x, point.y))
        contactSamples.push({...surface, ...point});
    }, patches);
  }
  const groups = new Map();
  for (const point of contactSamples) {
    if (!point.patch || point.patch.flatResidue || !MATERIALS[point.type].liquid || point.depth < .7) continue;
    if (!groups.has(point.patch)) groups.set(point.patch, []);
    groups.get(point.patch).push(point);
  }
  const rand = g.random, shoe = SHOES[g.shoeId];
  const force = clamp((impact + Math.hypot(f.vx, f.vy) * .5) / 380, .08, 2);
  for (const [patch, points] of groups) {
    const coverage = points.length / 32;
    const depth = points.reduce((sum, p) => sum + p.depth, 0) / points.length;
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    const intensity = force * Math.sqrt(coverage), type = patch.type;
    const viscosity = type === 'mud' ? .65 : type === 'oil' ? .55 : 1;
    const count = Math.min(75, Math.ceil(depth * 2 * force * coverage));
    for (let i = 0; i < count && g.particles.length < 260; i++) {
      const point = points[Math.floor(rand() * points.length)];
      const a = Math.atan2(point.y - f.y, point.x - f.x) + (rand() - .5) * 1.1;
      const speed = (20 + rand() * 120) * intensity * Math.sqrt(depth / 12) * viscosity;
      g.particles.push({x:point.x, y:point.y, z:3, vx:Math.cos(a)*speed+f.vx*.1, vy:Math.sin(a)*speed+f.vy*.1,
        vz:(70+rand()*150)*intensity, r:.12+rand()**3*1.4, type, life:0, alive:true});
    }
    // The first wave follows the wet portion of the sole, then expands across
    // the puddle. Its centre stays at the impact, even as the foot slides away.
    const centre = localPoint(f, x, y);
    let rx = shoe.width / 8, ry = shoe.length / 16;
    for (const point of points) {
      const local = localPoint(f, point.x, point.y);
      rx = Math.max(rx, Math.abs(local.x - centre.x) + shoe.width / 8);
      ry = Math.max(ry, Math.abs(local.y - centre.y) + shoe.length / 16);
    }
    g.rings.push({x, y, age:0, radius:Math.max(rx, ry), rx, ry, angle:f.angle, strength:intensity, patch});
    for (let i = 0; i < Math.ceil(7 * coverage); i++) {
      const point = points[Math.floor(rand() * points.length)];
      stainAt(g, f, point.x, point.y, 1.8 + intensity * 3, MATERIALS[type].dirt * intensity * .32, type, Math.min(12, point.depth + intensity * 2));
    }
    for (const other of g.feet) {
      const reach = Math.hypot(other.x - x, other.y - y);
      const drops = Math.floor(intensity * depth / 3 * coverage * clamp(1 - reach / 120, 0, 1));
      for (let j = 0; j < drops; j++) jeansMark(g, other, type, intensity);
    }
    g.events.push({type:'splash', intensity, side:f.side, surface:type});
  }
}
function updateParticles(g, dt) {
  const shoe = SHOES[g.shoeId]; let n = 0;
  for (const drop of g.particles) {
    const oldZ = drop.z; drop.vz -= 950 * dt;
    drop.x += drop.vx * dt; drop.y += drop.vy * dt; drop.z += drop.vz * dt; drop.life += dt;
    for (const f of g.feet) {
      if (!drop.alive || drop.life < .04 || drop.vz > 0) continue;
      const local = localPoint(f, drop.x, drop.y),col=Math.floor((local.x/shoe.width+.5)*GRID.width),row=Math.floor((.5-local.y/shoe.length)*GRID.height);
      if(col<0||col>=GRID.width||row<0||row>=GRID.height)continue;
      const height=shoeHeights(g,f)[row*GRID.width+col]+f.z;
      if(oldZ>=height&&drop.z<=height){
        const cell=row*GRID.width+col,radius=drop.r*.65,cellArea=shoe.width*shoe.length/(GRID.width*GRID.height);
        const amount=(.08+MATERIALS[drop.type].dirt*.12)*Math.min(1,Math.PI*radius*radius/cellArea);
        if(deposit(g,f,cell,amount,drop.type)>0){
          f.spatter.push({u:local.x/shoe.width+.5,v:.5-local.y/shoe.length,r:radius/shoe.width,type:drop.type,cell});
          if(f.spatter.length>160)f.spatter.shift();coverage(g,f);
        }
        drop.alive=false;
      }
    }
    if (drop.z < 0) {
      if (drop.r > 1.5) g.smears.push({ x: drop.x, y: drop.y, r: drop.r * 1.2, type: drop.type, alpha: .38 });
      drop.alive = false;
    }
    if (drop.alive && drop.life < 2) g.particles[n++] = drop;
  }
  g.particles.length = n;
  n = 0; for (const r of g.rings) { r.age += dt; r.radius += dt * 40; if (r.age < 1.5) g.rings[n++] = r; } g.rings.length = n;
  if (g.smears.length > 180) g.smears.splice(0, g.smears.length - 180);
}
function recordBump(g, f, obstacle, nx, ny) {
  if (g.bumped) return;
  // Capture the incoming contact before the solver removes its velocity. Feedback
  // shares this one event per stride, without adding a second physical impulse.
  const speed = Math.max(0, -(f.vx * nx + f.vy * ny));
  const force = clamp(speed / 850, .15, 1);
  f.bump = { at: g.time, nx, ny, force };
  g.events.push({ type: 'bump', obstacle: obstacle.type, side: f.side, force });
  g.bumped = true;
}
function collide(g, f) {
  const shoe = SHOES[g.shoeId];
  for (const o of nearby(g.street, f.y).obstacles) {
    if (f.z > o.height) continue;
    // Three circles along the shoe keep the toe from passing through street furniture.
    for (const along of [-.32, 0, .32]) {
      const p = footPoint(f, 0, along * shoe.length);
      let dx = p.x - o.x, dy = p.y - o.y, r = o.r + shoe.width * .48;
      if (o.halfWidth) {
        dx = p.x - clamp(p.x, o.x - o.halfWidth, o.x + o.halfWidth);
        dy = p.y - clamp(p.y, o.y - o.halfLength, o.y + o.halfLength);
        r = shoe.width * .48;
        if (!dx && !dy) {
          dx = p.x < o.x ? -1 : 1;
          f.x = o.x + dx * (o.halfWidth + r); g.hitStop = true;
          recordBump(g, f, o, dx, 0);
          continue;
        }
      }
      const d = Math.hypot(dx, dy);
      if (d >= r) continue;
      const nx = d > .01 ? dx / d : 1, ny = d > .01 ? dy / d : 0;
      f.x += nx * (r - d); f.y += ny * (r - d);
      const v = f.vx * nx + f.vy * ny;
      recordBump(g, f, o, nx, ny);
      if (v < 0) { g.hitStop=true; f.vx -= v * nx * 1.12; f.vy -= v * ny * 1.12; }
    }
  }
}
function keepGatherProgress(g,f) {
  if(g.gatheringStep&&f.y<g.strideBack){f.y=g.strideBack;f.vy=Math.max(0,f.vy);}
}
function simulate(g, dt) {
  g.time += dt; g.stepTime += dt; const f = g.feet[g.active], shoe = SHOES[g.shoeId];
  if(g.mode==='idle'&&g.flowDistance&&g.time>g.flowUntil)breakFlow(g,'timeout');
  if (g.mode === 'charging') {
    g.charge = clamp(g.charge + dt / .85, 0, 1);
    const lift = 3 + 13 * g.charge;
    f.vz += ((lift - f.z) * 110 - f.vz * 18) * dt; f.z = Math.max(0, f.z + f.vz * dt);
    f.x += (g.origin.x - g.aim.x * g.charge * 8 - f.x) * Math.min(1, dt * 12);
    f.y += (g.origin.y - g.aim.y * g.charge * 8 - f.y) * Math.min(1, dt * 12);
    f.angle += (Math.atan2(g.aim.x, g.aim.y) * .18 - f.angle) * dt * 8;
  } else if (g.mode === 'flight') {
    if (g.directStep) {
      // Ease the leg into its chosen footprint. Collision offsets remain physical,
      // and a little landing momentum still slips on wet or oily ground.
      const ease = t => .94 * t * t * (3 - 2 * t) + .06 * t;
      const t = clamp(g.stepTime / f.flightDuration, 0, 1), previous = clamp((g.stepTime - dt) / f.flightDuration, 0, 1);
      const change = g.hitStop ? 0 : ease(t) - ease(previous);
      f.vx = (g.target.x - g.origin.x) * change / dt; f.vy = (g.target.y - g.origin.y) * change / dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      const lift = .78 + .22 * g.landingForce;
      // Quicker swing, same clearance and gentle heel speed. The middle of the
      // arc accelerates while take-off and touchdown retain their original force.
      const arc = 475 * f.strideDuration ** 2 * lift, q = t * (1 - t), heel = 1 / STEP_PACE;
      f.z = arc * q * (heel + (1 - heel) * 4 * q);
      f.vz = arc * (1 - 2 * t) * (heel + (1 - heel) * 8 * q) / f.flightDuration;
    } else {
      f.vx *= Math.exp(-.18 * dt); f.vy *= Math.exp(-.18 * dt); f.vz -= 950 * dt;
      f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
    }
    // Credit a crossing only after a dry take-off, a real span of water under
    // the airborne sole, and a clean landing. This never changes the aim marker.
    const under = surfaceAt(g, f.x, f.y);
    if (g.strideStartedDry && under.type === 'water' && under.depth > 3 && f.z > under.depth + .3)
      g.crossingDistance += Math.hypot(f.vx, f.vy) * dt;
    f.angle += (clamp(Math.atan2(f.vx, Math.abs(f.vy) + 1), -.7, .7) * .35 - f.angle) * dt * 8 * (g.directStep ? STEP_PACE : 1);
    if(g.directStep){
      // A collision stops this swing. Reach correction must never drag the shoe
      // through a rail merely because its partner is already on the other side.
      if(!g.hitStop){const reach=constrainTarget(g,f,220);f.x=reach.x;f.y=reach.y;}
      collide(g,f);
    }else{collide(g,f);const reach=constrainTarget(g,f,155);f.x=reach.x;f.y=reach.y;}
    keepGatherProgress(g,f);
    if (f.z <= 0) {
      f.z = 0; f.landedAt = g.time; const water = surfaceAt(g, f.x, f.y); g.impact = Math.abs(f.vz) * (g.landingForce || 1);
      const contactPatches=footprintPatches(g,f),groundSamples=[];
      if(contactPatches.length)for(let zone=0;zone<8;zone++)soleContact(g,f,zone,(surface,point)=>{
        if(shoeContainsPoint(g,f,point.x,point.y))groundSamples.push({...surface,...point,zone});
      },contactPatches);
      recordGroundContact(g,f,shoe,groundSamples);
      collectSoleResidue(g, f, 0, true);
      emitSplash(g, f, water, g.impact, groundSamples); f.vz = 0;
      const landingMomentum = .28 * (g.landingForce || 1) / (g.directStep ? STEP_PACE : 1);
      f.vx *= landingMomentum; f.vy *= landingMomentum; g.mode = 'settling'; g.stepTime = 0;
      contactDirt(g, f, 0, g.landingForce || 1);
      f.lastSurface = water.type;
      if (MATERIALS[water.type].sticky) {
        f.sticky = 1; f.stickyType = water.type;
        contactDirt(g, f, .3);
      }
      g.events.push({ type: 'land', surface: water.type, side: f.side, force:g.landingForce || 1, contacts:landingSounds(g,f) });
    }
  } else if (g.mode === 'settling') {
    const surface = surfaceAt(g, f.x, f.y), drag = surface.grip * shoe.grip;
    f.vx *= Math.exp(-drag * dt); f.vy *= Math.exp(-drag * dt);
    f.x += f.vx * dt; f.y += f.vy * dt;
    if(!g.directStep||!g.hitStop){const reach=constrainTarget(g,f,g.directStep?220:155);f.x=reach.x;f.y=reach.y;}
    collide(g,f);
    keepGatherProgress(g,f);
    if (Math.hypot(f.vx, f.vy) < 4 || g.stepTime > .6) {
      f.vx = f.vy = 0; g.mode = 'idle'; g.steps++;
      g.blockTravel += Math.max(0, Math.min(...g.feet.map(foot=>foot.y)) - (g.strideBack ?? Math.min(...g.feet.map(foot=>foot.y))));
      if (f.y > f.bestY + 40 && !isPavement(f.y)) {
        if (!hasDirtyContact(g, f) && !hasDirtyContact(g, g.feet[1-g.active]) && condition(g) >= (g.strideClean ?? condition(g))-.05 && !g.bumped) {
          g.chain++; g.cleanSteps++; g.bestChain = Math.max(g.bestChain, g.chain);
          const distance=Math.max(0,f.y-g.strideFront),margin=landingMargin(g,f),close=margin<=38,precision=margin<=8;
          const previousMultiplier=flowMultiplier(g);
          g.flowDistance+=distance;g.flowUntil=g.time+FLOW_WINDOW;g.flowClean=condition(g);
          const multiplier=flowMultiplier(g),points=Math.round(distance*.22*(precision?2.1:close?1.5:1)*multiplier);
          g.bestFlow=Math.max(g.bestFlow,multiplier);if(close)g.closeCalls++;
          const crossed = g.crossingDistance >= 34;
          if (crossed) g.crossings++;
          g.stylePoints += points; g.events.push({ type:'clean', side:f.side, chain:g.chain, points, close, precision, crossed, multiplier, flowRaised:multiplier>previousMultiplier });
          g.landingReward={x:f.x,y:f.y,at:g.time,points,multiplier,precision,crossed};
        } else { if (g.chain) g.events.push({ type: 'chainLost' }); g.chain = 0; breakFlow(g,'dirt'); }
      }
      f.bestY = Math.max(f.bestY, f.y); g.bumped = false;
      leaveFootprint(g, f);
      g.active = 1 - g.active; g.events.push({ type: 'step', side: g.active });
    }
  }
  updateParticles(g, dt); g.contactClock += dt;
  if (g.contactClock >= .075) {
    const soleDrying=Math.exp(-g.contactClock/18),residueDrying=Math.exp(-g.contactClock/240),upperDrying=Math.exp(-g.contactClock/14);
    for (const foot of g.feet) {
      for (const sole of foot.sole) { sole.wet *= soleDrying; sole.dirt *= residueDrying; }
      let drying=false;
      for(let i=0;i<foot.wetness.length;i++)if(foot.wetness[i]>.0001){foot.wetness[i]*=upperDrying;drying=true;}
      if(drying)foot.revision++;
      collectSoleResidue(g, foot, g.contactClock); contactDirt(g, foot, g.contactClock);
    }
    g.prints = g.prints.filter(p => g.time - p.born < p.life);
    g.crumbs = g.crumbs.filter(p=>g.time-p.born<75);
    ageGroundContacts(g);
    g.contactClock = 0;
  }
  if(g.flowDistance&&condition(g)<g.flowClean-.05)breakFlow(g,'dirt');
  if(g.mode==='idle')completeStretch(g);
  // A planted shoe on the welcome mat ends the race. Keep the full-width
  // doorstep fallback so a long stride or outside approach never misses home.
  if (g.mode === 'idle' && (g.feet.some(f=>onWelcomeMat(f,ROAD.finish)) || progress(g)>=1)) {
    g.phase = 'finished'; completeStretch(g); g.events.push({ type: 'finished' });
  }
}
export function advance(g, seconds) {
  if (g.phase !== 'walking') return;
  g.accumulator += clamp(seconds, 0, .1);
  while (g.accumulator >= 1 / 120 && g.phase === 'walking') { simulate(g, 1 / 120); g.accumulator -= 1 / 120; }
}
