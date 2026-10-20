import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { CameraRig } from "../../src/experience/camera/CameraRig";
import { INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";
import { spatialAxisJourney } from "../../src/components/spatial/SpatialAxis";
import { spatialArrivalEnd, spatialChoreography, spatialInterludeVisible } from "../../src/components/spatial/SpatialChoreography";
import { SpatialCloth } from "../../src/components/spatial/SpatialCloth";

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
      expect(camera.position.z).toBeLessThanOrEqual(26.8+(compact?1.8:0)+1e-6);
      expect(camera.position.y).toBeLessThanOrEqual(previous+1e-6);previous=camera.position.y;
      expect(Math.abs(camera.quaternion.x)+Math.abs(camera.quaternion.y)+Math.abs(camera.quaternion.z)).toBeLessThan(1e-8);
      poses.push(camera.position.toArray());
    }
    for(let i=1000;i>=0;i--){rig.update({...snapshot,progress:i/1000},{x:0,y:0},0);expect(camera.position.toArray()).toEqual(poses[i]);}
    expect(poses[0][2]-poses[Math.round(spatialArrivalEnd(stops)*1000)][2]).toBeCloseTo(8);
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
