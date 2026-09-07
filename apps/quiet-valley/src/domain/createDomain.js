import {createFarming} from './farming.js';
import {createExpansion} from './expansion.js';
import {createStory} from './story.js';
import {createProduction} from './production.js';
/** Features compose once per session, never extend imported globals. */
export function createDomain(clock){
 const sim=createFarming(clock),expansion=createExpansion(sim,clock),story=createStory(expansion,clock),production=createProduction(sim,story,clock);
 const queryOnly=object=>Object.freeze(Object.fromEntries(Object.entries(object).filter(([key])=>!['sim','act','tick','fresh','validate','ensureOrders'].includes(key))));
 return {
  commands:{fresh:sim.fresh,validate:sim.validate,tick:sim.tick,act:sim.act,resume(state,now){state.game.lastActiveAt=now;return sim.tick(state,now);}},
  queries:{FarmSim:queryOnly(sim),FarmExpansion:queryOnly(expansion),ValleyGameplay:queryOnly(story),FarmProduction:queryOnly(production)}
 };
}
