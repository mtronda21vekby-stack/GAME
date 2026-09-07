/** Nonblocking GPU completion at startup/region boundaries, never in the hot render loop.
 * A fence confirms submitted commands, not physical display scanout. Some software/remote
 * WebGL drivers never signal fences reliably, so an expired confirmation window is a soft
 * fallback: the controller still yields one browser frame before exposing the scene.
 */
export function waitForGPUFrame(gl, {signal, timeoutMs = 1500, pollMs = 16} = {}) {
 return new Promise((resolve, reject) => {
  if (signal?.aborted) { reject(new Error('Frame completion cancelled')); return; }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) { resolve(false); return; }
  let finished = false, timer = null;
  const started = performance.now();
  const finish = (error, confirmed = true) => {
   if (finished) return;
   finished = true;
   if (timer !== null) clearTimeout(timer);
   signal?.removeEventListener('abort', abort);
   gl.deleteSync(sync);
   if (error) reject(error); else resolve(confirmed);
  };
  const abort = () => finish(new Error('Frame completion cancelled'));
  const poll = () => {
   try {
    if (signal?.aborted) { abort(); return; }
    if (gl.isContextLost()) throw new Error('WebGL context lost before frame completion');
    const status = gl.clientWaitSync(sync, 0, 0);
    if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) { finish(null, true); return; }
    if (status === gl.WAIT_FAILED) { finish(null, false); return; }
    if (performance.now() - started >= timeoutMs) { finish(null, false); return; }
    timer = setTimeout(poll, pollMs);
   } catch (error) { finish(error); }
  };
  signal?.addEventListener('abort', abort, {once: true});
  try { gl.flush(); poll(); } catch (error) { finish(error); }
 });
}
