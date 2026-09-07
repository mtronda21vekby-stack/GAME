import {Lifetime} from '../infrastructure/lifecycle.js';
import {createLaunchDiagnostics} from '../presentation/launch.js';

const lifetime=new Lifetime();
const diagnostics=createLaunchDiagnostics(lifetime);
// Install error display before requesting the runtime graph, including module-load failures.
try {
  const {startGame}=await import('./startGame.js');
  await startGame({lifetime,diagnostics});
} catch(error){diagnostics.fail(error);}
