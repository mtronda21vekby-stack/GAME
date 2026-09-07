/** Device capability changes quality, not the authored art or material implementation. */
export function graphicsPreferences(storage,reducedMotion){
 let quality='balanced';try{const s=storage.getItem('quiet-valley.graphics.v2');if(['low','balanced','high'].includes(s))quality=s;}catch{}
 return {quality,motion:reducedMotion?0:1,onQualityChange(value){try{storage.setItem('quiet-valley.graphics.v2',value);}catch{}}};
}
