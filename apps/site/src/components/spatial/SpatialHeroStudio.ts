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
    // Broad softboxes describe the brow and jaw; the narrow strips stay as rims.
    // A low opposite reflection separates black metal from the black background.
    const key=glow(u,v,.86,.64,.062,.21)*7.6;
    const cyan=glow(u,v,.55,.57,.019,.26)*5.6;
    const violet=glow(u,v,.97,.56,.031,.22)*2.5;
    const ceiling=glow(u,v,.76,.86,.22,.09)*.8;
    const bounce=glow(u,v,.73,.55,.18,.26)*.65;
    const counter=glow(u,v,.18,.51,.11,.24)*.42;
    pixels[i]=.018+key*.94+cyan*.34+violet*.73+ceiling*.82+bounce*.72+counter*.6;
    pixels[i+1]=.024+key*.97+cyan*.76+violet*.57+ceiling*.91+bounce*.86+counter*.58;
    pixels[i+2]=.033+key+cyan+violet+ceiling+bounce+counter;
    pixels[i+3]=1;
  }
  const texture=new DataTexture(pixels,width,height,RGBAFormat,FloatType);
  texture.mapping=EquirectangularReflectionMapping;texture.colorSpace=LinearSRGBColorSpace;texture.needsUpdate=true;
  const pmrem=new PMREMGenerator(renderer);
  try{return pmrem.fromEquirectangular(texture);}
  finally{texture.dispose();pmrem.dispose();}
}
