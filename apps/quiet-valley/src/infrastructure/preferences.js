/** Preferences are persistence, not renderer responsibilities. Failure never prevents rendering. */
export function graphicsPreferences(storage, reducedMotion){
  const key='quiet-valley.graphics.v2';let quality='balanced';
  try{const stored=storage.getItem(key);if(['low','balanced','high'].includes(stored))quality=stored;}catch{}
  return {quality,motion:reducedMotion?0:1,onQualityChange:value=>{try{storage.setItem(key,value);}catch{}}};
