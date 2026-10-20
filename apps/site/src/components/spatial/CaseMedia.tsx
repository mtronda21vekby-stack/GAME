import { useEffect, useRef, useState } from "react";
import type { PlatformGame } from "../../lib/platformGames";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";

/** Own recorded runtime interfaces; these are labelled previews, never invented gameplay. */
export function CaseMedia({game,open,paused}:{game:PlatformGame;open:boolean;paused:boolean}){
  const video=useRef<HTMLVideoElement>(null);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[playing,setPlaying]=useState(false),[requested,setRequested]=useState(false);
  const [reduced,setReduced]=useState(()=>typeof window==="undefined"||prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)")));
  useEffect(()=>{const q=window.matchMedia("(prefers-reduced-motion: reduce)"),read=()=>setReduced(prefersStaticPlatform(q));q.addEventListener("change",read);const o=new MutationObserver(read);o.observe(document.documentElement,{attributes:true,attributeFilter:["data-reduced-motion"]});return()=>{q.removeEventListener("change",read);o.disconnect();};},[]);
  useEffect(()=>{setReady(false);setFailed(false);setPlaying(false);setRequested(false);},[game.id]);
  useEffect(()=>{
    const v=video.current;if(!v)return;
    const apply=()=>{if(!open||paused||document.hidden||(!requested&&reduced)){v.pause();return;}void v.play().catch(()=>setPlaying(false));};
    apply();document.addEventListener("visibilitychange",apply);return()=>{document.removeEventListener("visibilitychange",apply);v.pause();};
  },[open,paused,reduced,requested,game.id]);
  return <>
    <img src={game.image} alt={game.imageAlt} width="1280" height="720"/>
    {open&&!failed&&<video key={game.id} ref={video} className="spatialCaseVideo" style={{opacity:ready?1:0}} src={reduced&&!requested?undefined:"/media/game-previews/"+game.id+".webm"} poster={game.image} muted playsInline loop preload={reduced?"none":"metadata"} aria-label={"Запись интерфейса "+game.title} onLoadedData={()=>setReady(true)} onError={()=>{setFailed(true);setPlaying(false);}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>}
    <figcaption className="spatialMediaControl"><span>{failed?"Статичный кадр":paused?"Сцена на паузе":playing?(game.id==="ballcrown"?"Запись экрана запуска":"Запись интерфейса"):"Превью интерфейса"}</span>{!failed&&<button type="button" disabled={paused} aria-label={playing?"Остановить превью":"Воспроизвести превью"} onClick={()=>{if(paused)return;const v=video.current;if(playing)v?.pause();else{setRequested(true);void v?.play().catch(()=>setPlaying(false));}}}>{playing?"Ⅱ":"▷"}</button>}</figcaption>
  </>;
}
