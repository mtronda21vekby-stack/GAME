import React from "react";

export function MapShaderOverlay() {
  return (
    <div className="efMapShaderOverlay" aria-hidden="true">
      <i className="caustics a" />
      <i className="caustics b" />
      <i className="glow g1" />
      <i className="glow g2" />
      <i className="vignette" />
      <style>{`
        .efMapShaderOverlay{position:fixed;inset:0;z-index:10000;pointer-events:none;overflow:hidden;mix-blend-mode:screen;opacity:.66;contain:layout paint size;transform:translateZ(0)}.efMapShaderOverlay .caustics{position:absolute;inset:-18%;background-image:radial-gradient(circle at 18% 22%,rgba(120,240,255,.16) 0 1px,transparent 2px),radial-gradient(circle at 72% 64%,rgba(255,240,170,.12) 0 1px,transparent 2px),linear-gradient(115deg,transparent 0 38%,rgba(120,240,255,.067) 42%,transparent 48% 100%);background-size:104px 94px,152px 136px,340px 260px;will-change:transform,opacity;animation:efShaderDriftA 34s linear infinite}.efMapShaderOverlay .caustics.b{opacity:.34;transform:rotate(9deg) scale(1.05);animation:efShaderDriftB 46s linear infinite;background-size:168px 148px,104px 112px,420px 310px}.efMapShaderOverlay .glow{position:absolute;border-radius:999px;opacity:.28;will-change:transform,opacity}.efMapShaderOverlay .g1{width:48vw;height:48vw;left:-14vw;top:8vh;background:radial-gradient(circle,rgba(110,255,180,.18),rgba(110,255,180,.06) 38%,transparent 68%);animation:efGlowPulse 18s ease-in-out infinite}.efMapShaderOverlay .g2{width:50vw;height:50vw;right:-18vw;top:30vh;background:radial-gradient(circle,rgba(180,140,255,.20),rgba(180,140,255,.06) 38%,transparent 70%);animation:efGlowPulse 22s ease-in-out infinite reverse}.efMapShaderOverlay .vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,transparent 0 50%,rgba(0,12,22,.24) 100%);mix-blend-mode:multiply;opacity:.5}@keyframes efShaderDriftA{from{transform:translate3d(-2%,0,0) rotate(0deg)}to{transform:translate3d(2%,3%,0) rotate(1deg)}}@keyframes efShaderDriftB{from{transform:translate3d(3%,1%,0) rotate(9deg) scale(1.05)}to{transform:translate3d(-3%,-2%,0) rotate(10deg) scale(1.05)}}@keyframes efGlowPulse{0%,100%{opacity:.20;transform:scale(.98)}50%{opacity:.34;transform:scale(1.025)}}@media(max-width:720px){.efMapShaderOverlay{opacity:.54}.efMapShaderOverlay .caustics.b{display:none}.efMapShaderOverlay .glow{opacity:.24}}@media(prefers-reduced-motion:reduce){.efMapShaderOverlay .caustics,.efMapShaderOverlay .glow{animation:none!important}}
      `}</style>
    </div>
  );
}
