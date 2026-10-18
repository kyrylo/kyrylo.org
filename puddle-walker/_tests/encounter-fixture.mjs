import {createGame,indexStreet} from '../model.js';

// Unit fixture for the individual authored encounters. The continuous failed
// shoulders and later contaminant tongues deliberately remove many of these former clean bypasses; keep
// their tests about rail clearance, runnel geometry, cover contact and recovery.
// balance.test and hard-course.test exercise the complete, weathered street.
export function createEncounterGame(...args){
 const g=createGame(...args);
 g.street=indexStreet({...g.street,patches:g.street.patches.filter(p=>!p.roadDecay&&!p.contaminant)});
 return g;
}
