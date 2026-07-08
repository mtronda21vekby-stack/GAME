import React from "react";

export function MapShaderOverlay() {
  return (
    <div className="efMapShaderOverlay" aria-hidden="true">
      <i className="caustics a" />
      <i className="caustics b" />
      <i className="glow g1" />
      <i className="glow g2" />
      <i className="glow g3" />
      <i className="vignette" />
      <style>{`
        .efMapShaderOverlay{position:fixed;inset:0;z-index:10000;pointer-events:none;overflow:hidden;mix-blend-mode:screen;opacity:.72}.efMapShaderOverlay .caustics{position:absolute;inset:-22%;background-image:radial-gradient(circle at 18% 22%,rgba(120,240,255,.18) 0 1px,transparent 2px),radial-gradient(circle at 72% 64%,rgba(255,240,170,.14) 0 1px,transparent 2px),linear-gradient(115deg,transparent 0 38%,rgba(120,240,255,.075) 42%,transparent 48% 100%);background-size:92px 82px,132px 116px,280px 220px;filter:blur(.2px);animation:efShaderDriftA 18s linear infinite}.efMapShaderOverlay .caustics.b{opacity:.42;transform:rotate(9deg) scale(1.08);animation:efShaderDriftB 26s linear infinite;background-size:148px 128px,88px 92px,360px 260px}.efMapShaderOverlay .glow{position:absolute;border-radius:999px;filter:blur(24px);opacity:.34}.efMapShaderOverlay .g1{width:42vw;height:42vw;left:-12vw;top:10vh;background:radial-gradient(circle,rgba(110,255,180,.22),transparent 62%);animation:efGlowPulse 9s ease-in-out infinite}.efMapShaderOverlay .g2{width:46vw;height:46vw;right:-16vw;top:28vh;background:radial-gradient(circle,rgba(180,140,255,.24),transparent 64%);animation:efGlowPulse 12s ease-in-out infinite reverse}.efMapShaderOverlay .g3{width:34vw;height:34vw;left:46vw;bottom:-12vw;background:radial-gradient(circle,rgba(255,220,120,.20),transparent 62%);animation:efGlowPulse 11s ease-in-out infinite}.efMapShaderOverlay .vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,transparent 0 48%,rgba(0,12,22,.26) 100%);mix-blend-mode:multiply;opacity:.55}@keyframes efShaderDriftA{from{transform:translate3d(-3%,0,0) rotate(0deg)}to{transform:translate3d(3%,4%,0) rotate(1deg)}}@keyframes efShaderDriftB{from{transform:translate3d(4%,2%,0) rotate(9deg) scale(1.08)}to{transform:translate3d(-4%,-3%,0) rotate(10deg) scale(1.08)}}@keyframes efGlowPulse{0%,100%{opacity:.24;transform:scale(.96)}50%{opacity:.42;transform:scale(1.04)}}@media(max-width:720px){.efMapShaderOverlay{opacity:.58}.efMapShaderOverlay .glow{filter:blur(20px)}}`}</style>
    </div>
  );
}
