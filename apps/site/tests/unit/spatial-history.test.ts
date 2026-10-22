import {describe,it,expect} from "vitest";
import {clearSpatialCase,hasSpatialCaseEntry,spatialCaseIndex,spatialCaseOrigin,writeSpatialCase} from "../../src/components/spatial/spatialHistory";

describe("Case history ownership",()=>{
  it("ignores unrelated fragments and malformed or unknown game ids",()=>{
    for(const hash of ["#spatial-lab","#game/%E0%A4%A","#game/missing","#game/ballcrown/extra"])expect(spatialCaseIndex(hash)).toBeUndefined();
    expect(spatialCaseIndex("#game/quiet-valley")).toBe(2);
  });
  it("keeps one case entry through related games and preserves foreign route state",()=>{
    const entries:Array<{state:any;url:string}>=[{state:{router:{key:4}},url:"/"}];let at=0;
    const history={get state(){return entries[at].state;},pushState(state:any,_:string,url?:string|URL|null){entries.splice(++at);entries.push({state,url:String(url)});},replaceState(state:any,_:string,url?:string|URL|null){entries[at]={state,url:String(url)};}};
    const origin={worldIndex:0,category:"Все игры",scrollY:2150};
    writeSpatialCase(history,{pathname:"/",search:""},0,origin);
    writeSpatialCase(history,{pathname:"/",search:""},2,origin,true);
    expect(entries).toHaveLength(2);expect(entries[1].url).toBe("/#game/quiet-valley");expect(history.state.router).toEqual({key:4});expect(spatialCaseOrigin(history.state)).toEqual(origin);
    expect(hasSpatialCaseEntry(history.state)).toBe(true);at=0;expect(hasSpatialCaseEntry(history.state)).toBe(false);at=1;expect(spatialCaseIndex(entries[at].url.slice(1))).toBe(2);
    clearSpatialCase(history,{pathname:"/",search:""});expect(history.state).toEqual({router:{key:4}});expect(entries[1].url).toBe("/");
  });
  it("rejects unbounded return coordinates and retains a copy of a valid origin",()=>{
    expect(spatialCaseOrigin({blackcrownCase:{origin:{worldIndex:1,category:"Все игры",scrollY:Infinity}}})).toBeUndefined();
    expect(spatialCaseOrigin({blackcrownCase:{origin:{worldIndex:99,category:"Все игры",scrollY:1}}})).toBeUndefined();
  });
  it("keeps browser history denial from interrupting case open, replace or close",()=>{
    const history={state:{router:{key:4}},pushState(){throw new DOMException("History quota","SecurityError");},replaceState(){throw new DOMException("History quota","SecurityError");}};
    const location={pathname:"/",search:""},origin={worldIndex:0,category:"Все игры",scrollY:2150};
    expect(writeSpatialCase(history,location,0,origin)).toBe(false);
    expect(writeSpatialCase(history,location,1,origin,true)).toBe(false);
    expect(clearSpatialCase(history,location)).toBe(false);
    expect(history.state).toEqual({router:{key:4}});
  });
});
