/** Original procedural audio; no network assets or autoplay. */
export class AudioBus{
 constructor(){this.enabled=false;this.ctx=null;this.nextBird=0;}
 enable(value){this.enabled=value;if(value){this.init();this.ctx?.resume();}if(this.gain)this.gain.gain.setTargetAtTime(value?.045:0,this.ctx.currentTime,.5);}
 init(){if(this.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.gain=this.ctx.createGain();this.gain.gain.value=.045;this.gain.connect(this.ctx.destination);
  const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.4;
  this.noise=this.ctx.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=400;this.noise.connect(filter);filter.connect(this.gain);this.noise.start();
 }
 tone(f,d=.2,v=.1,delay=0){if(!this.enabled||!this.ctx)return;const t=this.ctx.currentTime+delay;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(f,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(v,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+d);osc.connect(gain);gain.connect(this.ctx.destination);osc.start(t);osc.stop(t+d+.02);}
 event(type){if(type==='delivery'||type==='rescue'){[392,493.88,587.33].forEach((f,i)=>this.tone(f,.45,.035,i*.075));}else if(type==='collision'||type==='miss'){this.tone(146,.3,.07);this.tone(110,.4,.045,.18);}else if(type==='route')this.tone(523,.09,.025);else if(type==='spawn'){this.tone(262,.2,.035);this.tone(330,.2,.025,.13);}else if(type==='stage')[392,523,659,784].forEach((f,i)=>this.tone(f,.5,.045,i*.15));}
 dispose(){this.noise?.stop();this.ctx?.close();}
}
