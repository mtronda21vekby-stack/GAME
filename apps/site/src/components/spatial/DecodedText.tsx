import { useEffect, useRef } from "react";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";

/** The accessible text never changes. The brief visual decode always resolves in 240ms. */
export function DecodedText({text,token}:{text:string;token:string}){
  const ref=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const node=ref.current;if(!node||prefersStaticPlatform(window.matchMedia("(prefers-reduced-motion: reduce)")))return;
    const start=performance.now();let frame=0,last=-1;
    const paint=(now:number)=>{const phase=Math.min(1,(now-start)/240),step=Math.floor(phase*8);if(step!==last){last=step;node.textContent=[...text].map((c,i)=>c===" "||i<text.length*phase?c:"/·+—"[(i+step)%4]).join("");}if(phase<1)frame=requestAnimationFrame(paint);else node.textContent=text;};
    frame=requestAnimationFrame(paint);return()=>{cancelAnimationFrame(frame);node.textContent=text;};
  },[text,token]);
  return <span aria-label={text}><span aria-hidden="true" ref={ref}>{text}</span></span>;
}
