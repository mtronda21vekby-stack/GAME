import {createDomain} from '../domain/createDomain.js';
import {GameSession} from '../application/session.js';
import {createSaveRepository} from '../infrastructure/saveRepository.js';
import {graphicsPreferences} from '../infrastructure/graphicsPreferences.js';
import {attachBridge} from '../infrastructure/blackcrownBridge.js';
import * as F from '../rendering/index.js';
import {createFarmArt} from '../scene/farm.js';
import {createValleyWorld} from '../scene/valley.js';
import {createEstateWorld} from '../scene/estateWorld.js';
import {createCountryDetails} from '../scene/countryDetails.js';
import {createAtmosphere} from '../scene/atmosphere.js';
import {createWatering} from '../scene/watering.js';
import {createValleyUI} from '../presentation/templates/land.js';
import {createGameplayUI} from '../presentation/templates/story.js';
import {createProductionUI} from '../presentation/templates/production.js';
import {FarmPick} from '../input/picking.js';
import {startController} from './controller.js';
import {VERSION} from './version.js';

/** Browser implementations are wired here. Other layers depend on explicit ports. */
export async function startGame({lifetime,diagnostics}){
 const clock={now:()=>Date.now()};let storage;
 try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}};}
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const domain=createDomain(clock),session=new GameSession(domain.commands,clock,createSaveRepository(storage));
 const {FarmSim,FarmExpansion,ValleyGameplay,FarmProduction}=domain.queries;
 const ValleyWorld=createEstateWorld(createValleyWorld(FarmExpansion,FarmSim),FarmExpansion);
 const app=await startController({session,FarmSim,FarmExpansion,ValleyGameplay,FarmProduction,F,
  FarmArt:createFarmArt(FarmSim),ValleyWorld,FarmAtmosphere:createAtmosphere(FarmProduction),FarmWater:createWatering(reducedMotion),
  ValleyUI:createValleyUI(FarmSim,FarmExpansion),GameplayUI:createGameplayUI(FarmSim,ValleyGameplay),ProductionUI:createProductionUI(FarmSim,FarmProduction),FarmPick,
  createCountryDetails,lifetime,diagnostics,graphics:graphicsPreferences(storage,reducedMotion)});
 if(!diagnostics.failed)attachBridge({inspect:app.inspect,lifetime,host:window,origin:location.origin,version:VERSION});
 return app;
}
