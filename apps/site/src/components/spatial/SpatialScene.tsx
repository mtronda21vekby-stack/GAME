import { forwardRef, useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import { SpatialSceneRuntime } from "./SpatialSceneRuntime";

export type SpatialSceneHandle = { dispose: () => void };
type Props = { stageRef: RefObject<HTMLElement>; panelRootRef: RefObject<HTMLDivElement>; worldIndex: number; visibleGames: readonly number[]; paused: boolean; detailOpen: boolean; onStatus: (status: "ready" | "fallback") => void; onProgress: (complete: number, total: number) => void };

const SpatialScene = forwardRef<SpatialSceneHandle, Props>(function SpatialScene({ stageRef, panelRootRef, worldIndex, visibleGames, paused, detailOpen, onStatus, onProgress }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SpatialSceneRuntime | null>(null);
  const settings = useRef({ worldIndex, visibleGames, paused, detailOpen });
  settings.current = { worldIndex, visibleGames, paused, detailOpen };
  useImperativeHandle(ref, () => ({ dispose() { runtimeRef.current?.dispose(); runtimeRef.current = null; } }), []);
  useEffect(() => {
    let alive = true;
    const initialize = () => {
      if (!alive || !hostRef.current || !stageRef.current || !panelRootRef.current || runtimeRef.current) return;
      try {
        const runtime = new SpatialSceneRuntime({ host: hostRef.current, stage: stageRef.current, panelRoot: panelRootRef.current, onStatus: status => { if (alive) onStatus(status); }, onProgress });
        runtimeRef.current = runtime;
        const current = settings.current;
        runtime.setWorld(current.worldIndex, current.visibleGames); runtime.setPaused(current.paused); runtime.setDetailOpen(current.detailOpen);
      } catch { onStatus("fallback"); }
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) initialize(); };
    initialize(); window.addEventListener("pageshow", onPageShow);
    return () => { alive = false; window.removeEventListener("pageshow", onPageShow); runtimeRef.current?.dispose(); runtimeRef.current = null; };
  }, [stageRef, panelRootRef, onStatus, onProgress]);
  useEffect(() => { runtimeRef.current?.setWorld(worldIndex, visibleGames); }, [worldIndex, visibleGames]);
  useEffect(() => { runtimeRef.current?.setPaused(paused); }, [paused]);
  useEffect(() => { runtimeRef.current?.setDetailOpen(detailOpen); }, [detailOpen]);
  return <div ref={hostRef} className="spatialSceneHost" aria-hidden="true" />;
});

export default SpatialScene;
