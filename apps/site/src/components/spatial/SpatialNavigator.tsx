import { useEffect, useRef, useState } from "react";
import { platformGames } from "../../lib/platformGames";
import { SPATIAL_CATEGORIES } from "./spatialNavigation";
import { DecodedText } from "./DecodedText";

type Props={category:string;onCategory:(category:string)=>void;onGame:(index:number)=>void;disabled:boolean;openSignal:number};
export function SpatialNavigator({category,onCategory,onGame,disabled,openSignal}:Props){
  const [open,setOpen]=useState(false),[query,setQuery]=useState("");const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),opener=useRef<HTMLButtonElement>(null);
  const [chapter,setChapter]=useState("Начало");
  useEffect(()=>{
    let raf=0;const sections=["spatial-start","spatial-intro","spatial-games","spatial-transition","spatial-lab"],names=["Начало","О платформе","Игры","Переход","Лаборатория"];
    const read=()=>{raf=0;let index=0;sections.forEach((id,i)=>{if((document.getElementById(id)?.getBoundingClientRect().top??Infinity)<innerHeight*.42)index=i;});setChapter(names[index]);};
    const scroll=()=>{if(!raf)raf=requestAnimationFrame(read);};read();window.addEventListener("scroll",scroll,{passive:true});return()=>{window.removeEventListener("scroll",scroll);cancelAnimationFrame(raf);};
  },[]);
  function close(){setOpen(false);dialog.current?.close();opener.current?.focus({preventScroll:true});}
  useEffect(()=>{if(disabled&&open)close();},[disabled]);
  useEffect(()=>{if(openSignal)setOpen(true);},[openSignal]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(disabled||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if((e.key.toLowerCase()==="k"&&(e.metaKey||e.ctrlKey))||e.key==="/"){e.preventDefault();setOpen(true);}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[disabled]);
  useEffect(()=>{if(open){dialog.current?.showModal();input.current?.focus();}else dialog.current?.close();},[open]);
  const matches=platformGames.flatMap((g,index)=>(category==="Все игры"||category===g.genre)&&[g.title,g.genre,g.description,g.detail].join(" ").toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"))?[{g,index}]:[]);
  const jump=(id:string)=>{close();document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});};
  return <>
    <nav className="spatialSceneNav" aria-label="Навигация по сцене" hidden={disabled}><button ref={opener} type="button" onClick={()=>setOpen(true)} aria-label="Открыть навигатор и поиск игр"><span aria-hidden="true">⌕</span><span className="spatialNavLabel">Миры</span><span className="spatialNavChapter">/ {chapter}</span></button><a href="#spatial-lab">LAB ↘</a></nav>
    <dialog ref={dialog} className="spatialIndex" aria-label="Навигатор BLACKCROWN" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===dialog.current)close();}}>
      <div className="spatialIndexFrame"><header><span>BLACKCROWN / МИРЫ</span><button type="button" onClick={close} aria-label="Закрыть навигатор">×</button></header>
        <nav aria-label="Главы сайта"><button type="button" onClick={()=>jump("spatial-start")}>Начало</button><button type="button" onClick={()=>jump("spatial-intro")}>О платформе</button><button type="button" onClick={()=>jump("spatial-games")}>Игры</button><button type="button" onClick={()=>jump("spatial-lab")}>Лаборатория</button></nav>
        <label className="spatialSearchLabel">Какой мир ищешь?<input ref={input} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Игра, жанр или настроение" autoComplete="off"/></label>
        <div className="spatialIndexCategories" role="group" aria-label="Категории навигатора">{SPATIAL_CATEGORIES.map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>onCategory(c)}>{c==="Все игры"?"Все":c}</button>)}</div>
        <p className="spatialIndexCount" role="status"><DecodedText text={"Найдено: "+matches.length} token={query+category}/></p>
        <div className="spatialIndexResults">{matches.map(({g,index})=><button type="button" key={g.id} onClick={()=>{close();onGame(index);}}><img src={g.image} alt="" width="96" height="60"/><span><strong>{g.title}</strong><small>{g.genre} / {g.status}</small></span><span aria-hidden="true">↗</span></button>)}</div>
        {!matches.length&&<p className="spatialSearchEmpty">Другие миры найдутся по названию или жанру. <button type="button" onClick={()=>{setQuery("");onCategory("Все игры");}}>Сбросить поиск</button></p>}
        <footer>Поиск по играм BLACKCROWN — без отправки запроса.<a href="/support">Помощь ↗</a></footer>
      </div>
    </dialog>
  </>;
}
