import {createFarming} from './farming.js';
import {createExpansion} from './expansion.js';
import {createStory} from './story.js';
import {createProduction} from './production.js';

const omit=(value,names)=>Object.freeze(Object.fromEntries(Object.entries(value).filter(([key])=>!names.includes(key))));
const freezeTree=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const item of Object.values(value))freezeTree(item);Object.freeze(value);}return value;};
const mutable=['sim','fresh','validate','tick','act','ensureOrders'];
/** Per-session construction: features extend copies, never mutate imported shared singletons. */
export function createDomain(clock){
  const farming=createFarming(clock);
  const expansion=createExpansion(farming,clock);
  const story=createStory(expansion,clock);
  const production=createProduction(story.sim,story,clock);
  const sim=production.sim;
  // Catalogs are populated only during composition, then made immutable for all consumers.
  for(const catalog of [sim.CROPS,sim.SPECIES,sim.PRODUCTS,expansion.regions,expansion.projects,expansion.decor])freezeTree(catalog);
  const resume=(state,now)=>{if(state.game)state.game.lastActiveAt=now;return sim.tick(state,now);};
  return Object.freeze({
    commands:Object.freeze({fresh:sim.fresh,validate:sim.validate,tick:sim.tick,act:sim.act,resume}),
    queries:Object.freeze({
      FarmSim:omit(sim,mutable),
      FarmExpansion:omit(expansion,mutable),
      ValleyGameplay:omit(story,mutable),
      FarmProduction:omit(production,mutable),
    }),
  });
}
