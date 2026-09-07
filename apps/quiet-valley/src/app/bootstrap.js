import {Lifetime} from '../infrastructure/lifetime.js';
import {createLaunchDiagnostics} from '../presentation/launch.js';
const lifetime=new Lifetime(),diagnostics=createLaunchDiagnostics(lifetime);
// Install failure UI before loading the runtime graph: missing modules must never leave a spinner.
try{const {startGame}=await import('./startGame.js');await startGame({lifetime,diagnostics});}catch(error){diagnostics.fail(error);}
