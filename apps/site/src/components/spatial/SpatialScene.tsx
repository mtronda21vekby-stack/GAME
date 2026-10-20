import { forwardRef, useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import { SpatialSceneRuntime } from "./SpatialSceneRuntime";

export type SpatialSceneHandle = { dispose: () => void; touchCloth:(x?:number,y?:number)=>boolean; setDetailOpen:(open:boolean)=>void;setPaused:(paused:boolean)=>void;syncScroll:()=>void };
type Props = { stageRef: RefObject<HTMLElement>; worldIndex: number; visibleGames: readonly number[]; paused: boolean; detailOpen: boolean; detailFocus: boolean; onStatus: (status: "ready" | "fallback") => void; onProgress: (complete: number, total: number,phase?:"download"|"prepare"|"complete") => void };

const SpatialScene = forwardRef<SpatialSceneHandle, Props>(function SpatialScene({ stageRef, worldIndex, visibleGames, paused, detailOpen, detailFocus, onStatus, onProgress }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SpatialSceneRuntime | null>(null);
  const settings = useRef({ worldIndex, visibleGames, paused, detailOpen, detailFocus });
  settings.current = { worldIndex, visibleGames, paused, detailOpen, detailFocus };
  useImperativeHandle(ref, () => ({ dispose() { runtimeRef.current?.dispose(); runtimeRef.current = null; },touchCloth(x,y){return runtimeRef.current?.touchCloth(x,y)??false;},setDetailOpen(open){runtimeRef.current?.setDetailOpen(open);},setPaused(value){runtimeRef.current?.setPaused(value);},syncScroll(){runtimeRef.current?.syncScroll();} }), []);
  useEffect(() => {
    let alive = true;
    const initialize = () => {
      if (!alive || !hostRef.current || !stageRef.current || runtimeRef.current) return;
      try {
        const runtime = new SpatialSceneRuntime({ host: hostRef.current, stage: stageRef.current, onStatus: status => { if (alive) onStatus(status); }, onProgress });
        runtimeRef.current = runtime;
        const current = settings.current;
        runtime.setWorld(current.worldIndex, current.visibleGames); runtime.setPaused(current.paused); runtime.setDetailOpen(current.detailOpen); runtime.setDetailFocus(current.detailFocus);
      } catch(error) { console.warn("BLACKCROWN scene initialization failed",error);onStatus("fallback"); }
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) initialize(); };
    initialize(); window.addEventListener("pageshow", onPageShow);
    return () => { alive = false; window.removeEventListener("pageshow", onPageShow); runtimeRef.current?.dispose(); runtimeRef.current = null; };
  }, [stageRef, onStatus, onProgress]);
  useEffect(() => { runtimeRef.current?.setWorld(worldIndex, visibleGames); }, [worldIndex, visibleGames]);
  useEffect(() => { runtimeRef.current?.setPaused(paused); }, [paused]);
  useEffect(() => { runtimeRef.current?.setDetailOpen(detailOpen); }, [detailOpen]);
  useEffect(() => { runtimeRef.current?.setDetailFocus(detailFocus); }, [detailFocus]);
  return <div ref={hostRef} className="spatialSceneHost" aria-hidden="true" />;
});

export default SpatialScene;
