import { useEffect, useState } from "react";
import type { PlatformGame } from "../../lib/platformGames";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";

/** Own recorded runtime interfaces; these are labelled previews, never invented gameplay. */
type CaseMediaProps={game:PlatformGame;open:boolean;paused:boolean;onPosterLoad?:()=>void};
export function CaseMedia(props:CaseMediaProps){return <AttachedCaseMedia key={props.game.id} {...props}/>;}

export function shouldPlayCasePreview({open,paused,hidden,reduced,requested,stopped}:{open:boolean;paused:boolean;hidden:boolean;reduced:boolean;requested:boolean;stopped:boolean}) {
  return open&&!paused&&!hidden&&!stopped&&(!reduced||requested);
}

function AttachedCaseMedia({game,open,paused,onPosterLoad}:CaseMediaProps){
  // Actual node attachment is a dependency: error fallback -> healthy next case
  // must run playback policy even when the previous video node was absent.
  const [video,setVideo]=useState<HTMLVideoElement|null>(null);
  const [stopped,setStopped]=useState(false);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[playing,setPlaying]=useState(false),[requested,setRequested]=useState(false);
  const [reduced,setReduced]=useState(()=>typeof window==="undefined"||prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)")));
  useEffect(()=>{const q=window.matchMedia("(prefers-reduced-motion: reduce)"),read=()=>setReduced(prefersStaticPlatform(q));q.addEventListener("change",read);const o=new MutationObserver(read);o.observe(document.documentElement,{attributes:true,attributeFilter:["data-reduced-motion"]});return()=>{q.removeEventListener("change",read);o.disconnect();};},[]);
  useEffect(()=>{
    const v=video;if(!v)return;
    const apply=()=>{if(!shouldPlayCasePreview({open,paused,hidden:document.hidden,reduced,requested,stopped})){v.pause();return;}void v.play().catch(()=>setPlaying(false));};
    apply();document.addEventListener("visibilitychange",apply);return()=>{document.removeEventListener("visibilitychange",apply);v.pause();};
  },[video,open,paused,reduced,requested,stopped]);
  return <>
    <img src={game.image} alt={game.imageAlt} width="1280" height="720" onLoad={onPosterLoad}/>
    {open&&!failed&&<video key={game.id} ref={setVideo} className="spatialCaseVideo" style={{opacity:ready?1:0}} src={reduced&&!requested?undefined:"/media/game-previews/"+game.id+".webm"} poster={game.image} muted playsInline loop preload={reduced?"none":"metadata"} aria-label={"Запись интерфейса "+game.title} onLoadedData={()=>setReady(true)} onError={()=>{setFailed(true);setPlaying(false);}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>}
    <figcaption className="spatialMediaControl"><span>{failed?"Статичный кадр":paused?"Сцена на паузе":playing?(game.id==="ballcrown"?"Запись экрана запуска":"Запись интерфейса"):"Превью интерфейса"}</span>{!failed&&<button type="button" disabled={paused} aria-label={playing?"Остановить превью":"Воспроизвести превью"} onClick={()=>{if(paused)return;const v=video;if(playing){setStopped(true);v?.pause();}else{setStopped(false);setRequested(true);void v?.play().catch(()=>setPlaying(false));}}}>{playing?"Ⅱ":"▷"}</button>}</figcaption>
  </>;
}
