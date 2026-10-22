import { describe,it,expect } from "vitest";
import { outroClothPose } from "../../src/components/spatial/outroClothPose";

describe("continuous closing cloth route",()=>{
  for(const [width,height] of [[393,852],[430,932]]){
    const pose=(top:number,farewell:number)=>outroClothPose({width,height,headerBottom:104,copyRight:264,farewell,
      sheet:{left:24,top:top-595,width:width-48,height:height*.48},
      slot:{left:24,top:top+504,width:width-48,height:height*.29}});
    it(`keeps a whole bounded body in the passing-copy lane at ${width}px`,()=>{
      for(let f=.5;f<=.85;f+=.01){
        const p=pose(460-(f-.5)*500,f);
        expect(p.x-p.width*.61).toBeGreaterThan(264);
        expect(p.x+p.width*.61).toBeLessThanOrEqual(width-21);
        expect(p.y-p.height*.56).toBeGreaterThan(104);
        expect(p.y+p.height*.56).toBeLessThan(height);
        expect(p.width).toBeGreaterThan(60);
      }
    });
    it(`returns exactly to its native closing slot at ${width}px`,()=>{
      const top=80,p=pose(top,1);
      expect(p.opening).toBe(1);
      expect(p.x).toBe(width/2);
      expect(p.y).toBe(top+504+height*.29/2);
      expect(p.width).toBe(width-48);
      expect(p.height).toBeCloseTo(height*.29);
      expect(p.sculpture).toBe(0);
    });
    it(`has a continuous path at ${width}px`,()=>{
      const forward=Array.from({length:1001},(_,i)=>pose(height*.95-i*height*.83/1000,i/1000));
      for(let i=1;i<forward.length;i++){
        const a=forward[i-1],b=forward[i];
        expect(Math.hypot(b.x-a.x,b.y-a.y)).toBeLessThan(8);
        expect(Math.abs(b.width-a.width)).toBeLessThan(8);
      }
    });
  }
});
