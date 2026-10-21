import { describe, expect, it } from "vitest";
import { Color, PerspectiveCamera, Vector3 } from "three";
import { CameraRig } from "../../src/experience/camera/CameraRig";
import { INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";
import { spatialAxisJourney } from "../../src/components/spatial/SpatialAxis";
import { spatialArrivalEnd, spatialChoreography, spatialInterludeVisible, spatialWorldBlend } from "../../src/components/spatial/SpatialChoreography";
import { SpatialCloth } from "../../src/components/spatial/SpatialCloth";
import { WORLD_ACCENTS } from "../../src/components/spatial/spatialState";

describe("Scroll owned entrance and exit",()=>{
  it.each([390,650,710,844,900])("keeps LAB out of the last visible game at viewport height %i, in both directions",height=>{
    // Reproduction: the last card occupies y200..460; the next chapter starts at678.
    // The old bottom-edge trigger showed a full-height sheet before the card left.
    const steps=Array.from({length:141},(_,i)=>i*10);
    const forward=steps.map(scroll=>spatialInterludeVisible({top:678-scroll,bottom:1317-scroll}));
    for(const scroll of [...steps,...steps.slice().reverse()]){
      const visible=spatialInterludeVisible({top:678-scroll,bottom:1317-scroll});
      if(460-scroll>104&&200-scroll<height)expect(visible).toBe(false);
      expect(visible).toBe(forward[scroll/10]);
    }
    expect(spatialInterludeVisible({top:0,bottom:639})).toBe(true);
    expect(spatialInterludeVisible({top:-639,bottom:0})).toBe(false);
    expect(spatialInterludeVisible(undefined)).toBe(false);
  });
  it("keeps the portrait head centred in its slot at both ends of the dolly",()=>{
    const width=390,height=844,slot={x:195,y:352,width:350,height:405};
    const stops={intro:.16,projects:[.26,.4,.54,.68],exit:.78,lab:.9};
    const {frames,axisHeight}=spatialAxisJourney({compact:true,width,height,slot,stops});
    const camera=new PerspectiveCamera(36,width/height,.1,100),rig=new CameraRig(camera,frames,true);
    for(const progress of [0,spatialArrivalEnd(stops)]){
      rig.update({...INITIAL_SCROLL_SNAPSHOT,progress,viewportWidth:width,viewportHeight:height},{x:0,y:0},0);camera.updateMatrixWorld(true);
      const head=new Vector3(0,axisHeight*.35,0).project(camera);
      expect((head.x+1)*width/2).toBeCloseTo(slot.x,5);expect((1-head.y)*height/2).toBeCloseTo(slot.y,5);
    }
  });
  it.each([false,true])("gives the about copy room before returning to the collection axis, compact=%s",compact=>{
    const width=compact?393:1440,height=compact?852:900;
    const stops={about:.13,intro:.22,projects:[.32,.46,.60,.74],exit:.82,lab:.93};
    const {frames,axisHeight}=spatialAxisJourney({compact,width,height,slot:{x:width*.5,y:height*.42,width:compact?353:892,height:height*.48},stops});
    const camera=new PerspectiveCamera(38,width/height,.1,100),rig=new CameraRig(camera,frames,true);
    const snapshot={...INITIAL_SCROLL_SNAPSHOT,viewportWidth:width,viewportHeight:height,reducedMotion:false};
    const progress=Array.from({length:193},(_,i)=>stops.about+(stops.projects[0]-stops.about)*i/192);
    const poses:number[][]=[];let previousY=Infinity;
    const headScreenX=(p:number)=>{
      rig.update({...snapshot,progress:p},{x:0,y:0},0);camera.updateMatrixWorld(true);
      const head=new Vector3(0,axisHeight*.35,0).project(camera);
      expect([head.x,head.y,head.z,...camera.position.toArray(),...camera.quaternion.toArray(),...camera.projectionMatrix.elements].every(Number.isFinite)).toBe(true);
      return (head.x+1)*width/2;
    };
    // The copy occupies the left 250px on phones and 480px on desktop.
    // Its subject must have its own space, then align with the central spine.
    const copyRight=(compact?24:72)+(compact?250:480);
    expect(headScreenX(stops.about)).toBeGreaterThan(copyRight+20);
    expect(headScreenX(stops.about)).toBeLessThan(width);
    for(const p of progress){
      headScreenX(p);
      expect(camera.position.y).toBeLessThanOrEqual(previousY+1e-8);previousY=camera.position.y;
      expect(new Vector3(0,1,0).applyQuaternion(camera.quaternion).distanceTo(new Vector3(0,1,0))).toBeLessThan(1e-8);
      expect(camera.getWorldDirection(new Vector3()).distanceTo(new Vector3(0,0,-1))).toBeLessThan(1e-8);
      poses.push([...camera.position.toArray(),...camera.quaternion.toArray(),camera.fov]);
    }
    expect(headScreenX(stops.projects[0])).toBeCloseTo(width*.5,5);
    for(let i=progress.length-1;i>=0;i--){
      headScreenX(progress[i]);
      expect([...camera.position.toArray(),...camera.quaternion.toArray(),camera.fov]).toEqual(poses[i]);
    }
  });
  it.each([false,true])("retraces an upright bounded camera path, compact=%s",compact=>{
    const width=compact?390:1440,height=844;
    const stops={intro:.16,projects:[.26,.4,.54,.68],exit:.78,lab:.9};
    const {frames}=spatialAxisJourney({compact,width,height,slot:{x:width*.6,y:height*.6,width:width*.8,height:350},stops});
    const camera=new PerspectiveCamera(38,width/height,.1,100),rig=new CameraRig(camera,frames,true);
    const poses:number[][]=[];let previous=Infinity;
    const snapshot={...INITIAL_SCROLL_SNAPSHOT,viewportWidth:width,viewportHeight:height,reducedMotion:false};
    for(let i=0;i<=1000;i++){
      rig.update({...snapshot,progress:i/1000},{x:0,y:0},0);
      expect(camera.position.z).toBeGreaterThanOrEqual(17.8+(compact?1.8:0)-1e-6);
      expect(camera.position.z).toBeLessThanOrEqual((compact?22.2:26.8)+(compact?1.8:0)+1e-6);
      expect(camera.position.y).toBeLessThanOrEqual(previous+1e-6);previous=camera.position.y;
      expect(Math.abs(camera.quaternion.x)+Math.abs(camera.quaternion.y)+Math.abs(camera.quaternion.z)).toBeLessThan(1e-8);
      poses.push(camera.position.toArray());
    }
    for(let i=1000;i>=0;i--){rig.update({...snapshot,progress:i/1000},{x:0,y:0},0);expect(camera.position.toArray()).toEqual(poses[i]);}
    expect(poses[0][2]-poses[Math.round(spatialArrivalEnd(stops)*1000)][2]).toBeCloseTo(compact?3.4:8);
    const exit=poses.slice(700,901).map(p=>p[2]);
    expect(Math.max(...exit)).toBeLessThanOrEqual(20.4+(compact?1.8:0)+1e-6);
  });
  it("clamps phases and returns the same reveal on reverse",()=>{
    const phases=Array.from({length:101},(_,i)=>spatialChoreography(i/100));
    expect(spatialChoreography(NaN)).toEqual({arrival:0,departure:0});
    expect(spatialChoreography(-1)).toEqual({arrival:0,departure:0});
    expect(spatialChoreography(2)).toEqual({arrival:1,departure:1});
    for(let i=100;i>=0;i--){expect(spatialChoreography(i/100)).toEqual(phases[i]);for(const value of Object.values(phases[i]))expect(value>=0&&value<=1).toBe(true);}
  });
  it("unfolds on the GPU without replacing the mobile vertex buffer",()=>{
    const cloth=new SpatialCloth(true),geometry=cloth.geometry,positions=geometry.attributes.position.array.slice();
    for(const phase of [0,.2,.8,1,.5,0])cloth.setEntrance(phase);
    expect(cloth.geometry).toBe(geometry);expect(cloth.geometry.attributes.position.array).toEqual(positions);
    expect(cloth.entrance.value).toBe(0);cloth.geometry.dispose();cloth.material.dispose();
  });
});

describe("World lighting along the catalogue",()=>{
  const stops={about:.13,intro:.22,projects:[.32,.46,.60,.74],exit:.82,lab:.93};
  const colorOf=(world:number)=>new Vector3().fromArray(new Color(WORLD_ACCENTS[world]).toArray());
  const colorAt=(progress:number,stations=stops,worlds:readonly number[]=[0,1,2,3])=>{
    const {from,to,mix}=spatialWorldBlend(progress,stations,worlds);
    return colorOf(from).lerp(colorOf(to),mix);
  };
  it("arrives at each real world's palette continuously and eases around its project stop",()=>{
    stops.projects.forEach((station,index)=>{
      const color=colorAt(station);
      expect(color.distanceTo(colorOf(index))).toBeLessThan(1e-12);
      expect(colorAt(station-1e-6).distanceTo(colorAt(station+1e-6))).toBeLessThan(1e-8);
    });
    for(let i=0;i<stops.projects.length-1;i++){
      const from=stops.projects[i],span=stops.projects[i+1]-from;
      const a=colorOf(i),b=colorOf(i+1),distance=a.distanceTo(b);
      expect(colorAt(from+span*.5).distanceTo(a.clone().lerp(b,.5))).toBeLessThan(1e-12);
      expect(colorAt(from+span*.01).distanceTo(a)).toBeLessThan(distance*.001);
      expect(colorAt(from+span*.99).distanceTo(b)).toBeLessThan(distance*.001);
      let travelled=0;
      for(let step=0;step<=100;step++){
        const next=colorAt(from+span*step/100),amount=next.distanceTo(a);
        expect(next.toArray().every(Number.isFinite)).toBe(true);
        expect(amount).toBeGreaterThanOrEqual(travelled-1e-12);
        expect(amount+next.distanceTo(b)).toBeCloseTo(distance,12);
        travelled=amount;
      }
    }
    expect(colorAt(0).distanceTo(colorOf(0))).toBe(0);
    expect(colorAt(1).distanceTo(colorOf(3))).toBe(0);
  });
  it("uses filtered world identities and retraces exactly when scroll reverses",()=>{
    const filtered={...stops,projects:[.36,.65]},worlds=[1,3];
    const middle=(filtered.projects[0]+filtered.projects[1])*.5;
    const blend=spatialWorldBlend(middle,filtered,worlds);
    expect(blend.from).toBe(1);expect(blend.to).toBe(3);expect(blend.mix).toBeCloseTo(.5,12);
    expect(colorAt(filtered.projects[0],filtered,worlds).distanceTo(colorOf(1))).toBeLessThan(1e-12);
    expect(colorAt(filtered.projects[1],filtered,worlds).distanceTo(colorOf(3))).toBeLessThan(1e-12);
    const forward=Array.from({length:101},(_,i)=>({blend:spatialWorldBlend(i/100,filtered,worlds),color:colorAt(i/100,filtered,worlds).toArray()}));
    for(let i=100;i>=0;i--){
      expect(spatialWorldBlend(i/100,filtered,worlds)).toEqual(forward[i].blend);
      expect(colorAt(i/100,filtered,worlds).toArray()).toEqual(forward[i].color);
    }
  });
  it("keeps a single world stable and supplies a finite palette before layout or for an empty collection",()=>{
    for(const progress of [-1,0,.3,.5,.9,1,2]){
      expect(spatialWorldBlend(progress,stops,[2])).toEqual({from:2,to:2,mix:0});
      expect(spatialWorldBlend(progress,stops,[])).toEqual({from:0,to:0,mix:0});
      expect(spatialWorldBlend(progress,undefined,[1,3])).toEqual({from:1,to:1,mix:0});
      expect(spatialWorldBlend(progress,{...stops,projects:[]},[1,3])).toEqual({from:1,to:1,mix:0});
    }
  });
});
