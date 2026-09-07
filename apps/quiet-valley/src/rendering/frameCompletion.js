/** Nonblocking GPU completion at startup/region boundaries, never in the hot render loop.
 * A fence confirms submitted commands, not physical display scanout. The controller
 * additionally grants the browser a frame before exposing the new location.
 */
export function waitForGPUFrame(gl, {signal, timeoutMs = 10000, pollMs = 16} = {}) {
 return new Promise((resolve, reject) => {
  if (signal?.aborted) { reject(new Error('Frame completion cancelled')); return; }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) { reject(new Error('Unable to create WebGL frame fence')); return; }
  let finished = false, timer = null;
  const started = performance.now();
  const finish = error => {
   if (finished) return;
   finished = true;
   if (timer !== null) clearTimeout(timer);
   signal?.removeEventListener('abort', abort);
   gl.deleteSync(sync);
   if (error) reject(error); else resolve();
  };
  const abort = () => finish(new Error('Frame completion cancelled'));
  const poll = () => {
   try {
    if (signal?.aborted) { abort(); return; }
    if (gl.isContextLost()) throw new Error('WebGL context lost before frame completion');
    const status = gl.clientWaitSync(sync, 0, 0);
    if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) { finish(); return; }
    if (status === gl.WAIT_FAILED) throw new Error('WebGL frame completion failed');
    if (performance.now() - started >= timeoutMs) throw new Error('WebGL frame completion timed out');
    timer = setTimeout(poll, pollMs);
   } catch (error) { finish(error); }
  };
  signal?.addEventListener('abort', abort, {once: true});
  try { gl.flush(); poll(); } catch (error) { finish(error); }
 });
}
