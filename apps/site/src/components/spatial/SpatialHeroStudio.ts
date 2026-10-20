import { DataTexture, EquirectangularReflectionMapping, FloatType, LinearSRGBColorSpace, RGBAFormat, type WebGLRenderer } from "three";
import { PMREMGenerator } from "three/src/extras/PMREMGenerator.js";

/** A dark photographic studio, captured once. No visible cards or extra props. */
export function createHeroStudio(renderer:WebGLRenderer,compact:boolean) {
  const width=compact?256:512,height=width/2,pixels=new Float32Array(width*height*4);
  const glow=(u:number,v:number,x:number,y:number,sx:number,sy:number)=>{
    const dx=Math.min(Math.abs(u-x),1-Math.abs(u-x))/sx,dy=(v-y)/sy;
    return Math.exp(-2*(dx*dx+dy*dy));
  };
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=(x+.5)/width,v=(y+.5)/height,i=(y*width+x)*4;
    const key=glow(u,v,.87,.65,.037,.19)*9;
    const cyan=glow(u,v,.55,.57,.012,.25)*6.5;
    const violet=glow(u,v,.95,.58,.016,.22)*3.6;
    const ceiling=glow(u,v,.76,.88,.22,.065)*.7;
    const bounce=glow(u,v,.75,.56,.14,.22)*.22;
    pixels[i]=.015+key*.94+cyan*.36+violet*.65+ceiling*.82+bounce*.8;
    pixels[i+1]=.02+key*.97+cyan*.78+violet*.68+ceiling*.91+bounce*.9;
    pixels[i+2]=.027+key+cyan+violet+ceiling+bounce;
    pixels[i+3]=1;
  }
  const texture=new DataTexture(pixels,width,height,RGBAFormat,FloatType);
  texture.mapping=EquirectangularReflectionMapping;texture.colorSpace=LinearSRGBColorSpace;texture.needsUpdate=true;
  const pmrem=new PMREMGenerator(renderer);
  try{return pmrem.fromEquirectangular(texture);}
  finally{texture.dispose();pmrem.dispose();}
}
