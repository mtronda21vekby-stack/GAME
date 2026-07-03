export const EVOFISH_VERSION = "v0.00.46 alpha";

function numberFromText(value: string | null | undefined) {
  const n = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function xpFromText(value: string | null | undefined) {
  const parts = String(value || "").split("/");
  return {
    current: numberFromText(parts[0]),
    max: Math.max(1, numberFromText(parts[1]))
  };
}

function ensureClassicAutoStart(doc: Document) {
  const start = doc.getElementById("start") as HTMLElement | null;
  if (!start) return;

  const root = doc.documentElement;
  const btn = doc.getElementById("btnStart") as HTMLElement | null;
  const alreadyStarted = root.getAttribute("data-bc-classic-autostart") === "1";

  start.style.display = "none";
  start.style.pointerEvents = "none";

  if (alreadyStarted) return;
  root.setAttribute("data-bc-classic-autostart", "1");

  window.setTimeout(() => {
    try {
      btn?.click();
      start.style.display = "none";
      start.style.pointerEvents = "none";
    } catch {
      // Classic start overlay is optional after the unified lobby.
    }
  }, 0);

  window.setTimeout(() => {
    start.style.display = "none";
    start.style.pointerEvents = "none";
  }, 180);
}

function ensureVisualScaleGuard(doc: Document) {
  if (doc.getElementById("bc-visual-scale-guard")) return;

  const script = doc.createElement("script");
  script.id = "bc-visual-scale-guard";
  script.textContent = `
(function(){
  if(window.__bcVisualScaleGuardV4) return;
  window.__bcVisualScaleGuardV4 = true;
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function num(v,fallback){ v=Number(v); return Number.isFinite(v) ? v : fallback; }
  var originalGetZoom = window.getZoom;
  var originalGetCamera = window.getCamera;
  var originalDrawPlayerAvatar = window.drawPlayerAvatar;
  function computeSafeZoom(){
    var p = window.player || {};
    var w = num(window.W, window.innerWidth || 800);
    var h = num(window.H, window.innerHeight || 450);
    var dpr = num(window.DPR, window.devicePixelRatio || 1);
    var mass = Math.max(1, num(p.mass, 1));
    var radius = Math.max(1, num(p.r, 20));
    var base = originalGetZoom ? num(originalGetZoom(), 1) : 1;
    var z = base;
    if(mass > 18) z -= clamp(Math.log(mass / 18) * 0.12, 0, 0.42);
    var maxScreenRadius = Math.max(32 * dpr, Math.min(w, h) * 0.105);
    var screenRadius = radius * dpr * z;
    if(screenRadius > maxScreenRadius) z = Math.min(z, maxScreenRadius / (radius * dpr));
    return clamp(z, 0.045, 1);
  }
  window.getZoom = function(){ try { return computeSafeZoom(); } catch(e){ return originalGetZoom ? originalGetZoom() : 1; } };
  window.getCamera = function(){
    try{
      var targetZoom = window.getZoom();
      var currentZoom = num(window.ZOOM, targetZoom);
      window.ZOOM = currentZoom + (targetZoom - currentZoom) * 0.12;
      var w = num(window.W, window.innerWidth || 800);
      var h = num(window.H, window.innerHeight || 450);
      var world = window.WORLD || { w: 6400, h: 4200 };
      var p = window.player || { x: 0, y: 0 };
      var vw = w / window.ZOOM;
      var vh = h / window.ZOOM;
      var x = p.x - vw * 0.5;
      var y = p.y - vh * 0.5;
      if(vw >= world.w) x = (world.w - vw) * 0.5;
      else x = clamp(x, 0, world.w - vw);
      if(vh >= world.h) y = (world.h - vh) * 0.5;
      else y = clamp(y, 0, world.h - vh);
      return { x: x, y: y, vw: vw, vh: vh };
    }catch(e){
      return originalGetCamera ? originalGetCamera() : { x: 0, y: 0, vw: window.innerWidth || 800, vh: window.innerHeight || 450 };
    }
  };
  window.drawPlayerAvatar = function(x,y,r,ang){
    if(!originalDrawPlayerAvatar) return;
    try{
      var w = num(window.W, window.innerWidth || 800);
      var h = num(window.H, window.innerHeight || 450);
      var dpr = num(window.DPR, window.devicePixelRatio || 1);
      var safeRadius = Math.min(r, Math.max(34 * dpr, Math.min(w, h) * 0.13));
      return originalDrawPlayerAvatar.call(this, x, y, safeRadius, ang);
    }catch(e){ return originalDrawPlayerAvatar.apply(this, arguments); }
  };
})();
  `;
  doc.head.appendChild(script);
}

function ensureProgressFeedback(doc: Document) {
  if (doc.getElementById("bc-progress-feedback-style")) return;

  const style = doc.createElement("style");
  style.id = "bc-progress-feedback-style";
  style.textContent = `
    #bcProgressFeedback{position:fixed;left:50%;top:28%;z-index:160;transform:translate(-50%,-50%) scale(.96);display:none;min-width:220px;max-width:86vw;padding:14px 18px;border-radius:24px;background:linear-gradient(180deg,rgba(255,86,86,.18),rgba(2,16,27,.78));border:1px solid rgba(255,120,120,.24);box-shadow:0 22px 70px rgba(0,0,0,.38);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);pointer-events:none;text-align:center;color:#fff}
    #bcProgressFeedback.show{display:block;animation:bcProgressPop 1050ms ease both}
    #bcProgressFeedback .bcProgressTitle{font-weight:1000;font-size:24px;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 2px 20px rgba(255,80,80,.46)}
    #bcProgressFeedback .bcProgressSub{margin-top:5px;font-size:13px;font-weight:850;color:rgba(231,242,255,.88)}
    #bcProgressPulse{position:fixed;inset:0;z-index:159;display:none;pointer-events:none;background:radial-gradient(circle at 50% 45%,rgba(255,120,120,.18),transparent 48%)}
    #bcProgressPulse.show{display:block;animation:bcProgressPulse 520ms ease both}
    @keyframes bcProgressPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.72)}16%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}52%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-56%) scale(.96)}}
    @keyframes bcProgressPulse{0%{opacity:0}35%{opacity:1}100%{opacity:0}}
  `;
  doc.head.appendChild(style);

  const pulse = doc.createElement("div");
  pulse.id = "bcProgressPulse";
  doc.body.appendChild(pulse);

  const feedback = doc.createElement("div");
  feedback.id = "bcProgressFeedback";
  feedback.innerHTML = `<div class="bcProgressTitle">ПОГЛОЩЕНИЕ</div><div class="bcProgressSub">+XP · +Mass</div>`;
  doc.body.appendChild(feedback);
}

function showProgressFeedback(doc: Document, xpGain: number, massGain: number) {
  ensureProgressFeedback(doc);

  const feedback = doc.getElementById("bcProgressFeedback");
  const pulse = doc.getElementById("bcProgressPulse");
  if (!feedback || !pulse) return;

  const xpText = xpGain > 0 ? `+${Math.round(xpGain)} XP` : "+XP";
  const massText = massGain > 0 ? `+${massGain.toFixed(2)} Mass` : "+Mass";
  feedback.innerHTML = `<div class="bcProgressTitle">ПОГЛОЩЕНИЕ</div><div class="bcProgressSub">${xpText} · ${massText}</div>`;
  feedback.classList.remove("show");
  pulse.classList.remove("show");
  void feedback.offsetWidth;
  void pulse.offsetWidth;
  feedback.classList.add("show");
  pulse.classList.add("show");
}

export function applyEvoFishRuntime(frame: HTMLIFrameElement | null) {
  try {
    const doc = frame?.contentDocument;
    if (!doc) return;

    doc.title = `EvoFish ${EVOFISH_VERSION}`;
    const versionEl = doc.getElementById("ver");
    if (versionEl) versionEl.textContent = EVOFISH_VERSION;

    const root = doc.documentElement;
    root.setAttribute("data-evofish-version", EVOFISH_VERSION);
    ensureClassicAutoStart(doc);
    ensureVisualScaleGuard(doc);
    ensureProgressFeedback(doc);

    const massEl = doc.getElementById("mass");
    const xpEl = doc.getElementById("xpTxt");
    const pearlsEl = doc.getElementById("pearls");
    if (!massEl || !xpEl) return;

    const mass = numberFromText(massEl.textContent);
    const xp = xpFromText(xpEl.textContent || "0/1");
    const pearls = numberFromText(pearlsEl?.textContent);
    const ready = root.getAttribute("data-bc-progress-watch-ready") === "1";
    const lastMass = numberFromText(root.getAttribute("data-bc-last-mass"));
    const lastXp = numberFromText(root.getAttribute("data-bc-last-xp"));
    const lastXpMax = Math.max(1, numberFromText(root.getAttribute("data-bc-last-xp-max")));
    const lastPearls = numberFromText(root.getAttribute("data-bc-last-pearls"));

    root.setAttribute("data-bc-progress-watch-ready", "1");
    root.setAttribute("data-bc-last-mass", String(mass));
    root.setAttribute("data-bc-last-xp", String(xp.current));
    root.setAttribute("data-bc-last-xp-max", String(xp.max));
    root.setAttribute("data-bc-last-pearls", String(pearls));

    if (!ready) return;

    const massGain = mass - lastMass;
    const xpGain = xp.current >= lastXp ? xp.current - lastXp : xp.current + lastXpMax - lastXp;
    const pearlGain = pearls - lastPearls;
    const looksLikeProgress = massGain >= 0.035 && (xpGain >= 12 || pearlGain >= 1);
    if (looksLikeProgress) showProgressFeedback(doc, xpGain, massGain);
  } catch {
    // Runtime polish only. Never block EvoFish gameplay.
  }
}
