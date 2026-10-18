import { randomSource, districtAt } from './model.js?v=lean-frames-134';

// Sprite widths include mirrors. Calibrated body widths share the existing
// 334-unit collision envelope; the route never changes when a model changes.
export const VEHICLES = [
  {id:'blue-hatchback',name:'Blue hatchback',asset:'parked-car.webp',width:410,insets:[125,65,125,55]},
  {id:'red-hatchback',name:'Red hatchback',asset:'car-red-hatchback.webp',width:406.8},
  {id:'ivory-estate',name:'Ivory estate',asset:'car-ivory-estate.webp',width:383.8},
  {id:'white-van',name:'Work van',asset:'car-white-van.webp',width:400.7},
  {id:'green-classic',name:'Green saloon',asset:'car-green-classic.webp',width:372.3},
];

// A separate visual seed keeps authored hazards and replay routes untouched.
// Deal all passenger models before repeating; the crew always has its work van.
export function vehicleLineup(street) {
  const rand=randomSource(street.seed ^ 0x63ca29f1),lineup=new Map();
  const passenger=VEHICLES.filter(v=>v.id!=='white-van').map(v=>v.id);
  let deck=[],previous;
  for(const car of street.parking || []){
    let id;
    if(districtAt(car.y).id==='works')id='white-van';
    else {
      if(!deck.length){
        deck=[...passenger];
        for(let i=deck.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
        if(deck[deck.length-1]===previous)[deck[0],deck[deck.length-1]]=[deck[deck.length-1],deck[0]];
      }
      id=deck.pop();
    }
    lineup.set(car,id);previous=id;
  }
  return lineup;
}
