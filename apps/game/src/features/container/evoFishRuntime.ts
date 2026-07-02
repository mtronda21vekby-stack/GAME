export const EVOFISH_VERSION = "v0.00.9 alpha";

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

function ensureKillFeedback(doc: Document) {
  if (doc.getElementById("bc-kill-feedback-style")) return;

  const style = doc.createElement("style");
  style.id = "bc-kill-feedback-style";
  style.textContent = `
    #bcKillFeedback{position:fixed;left:50%;top:28%;z-index:160;transform:translate(-50%,-50%) scale(.96);display:none;min-width:220px;max-width:86vw;padding:14px 18px;border-radius:24px;background:linear-gradient(180deg,rgba(255,86,86,.18),rgba(2,16,27,.78));border:1px solid rgba(255,120,120,.24);box-shadow:0 22px 70px rgba(0,0,0,.38),0 0 40px rgba(255,80,80,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);pointer-events:none;text-align:center;color:#fff}
    #bcKillFeedback.show{display:block;animation:bcKillPop 1050ms ease both}
    #bcKillFeedback .bcKillTitle{font-weight:1000;font-size:24px;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 2px 20px rgba(255,80,80,.46)}
    #bcKillFeedback .bcKillSub{margin-top:5px;font-size:13px;font-weight:850;color:rgba(231,242,255,.88)}
    #bcKillPulse{position:fixed;inset:0;z-index:159;display:none;pointer-events:none;background:radial-gradient(circle at 50% 45%,rgba(255,120,120,.18),transparent 48%)}
    #bcKillPulse.show{display:block;animation:bcKillPulse 520ms ease both}
    @keyframes bcKillPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.72)}16%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}52%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-56%) scale(.96)}}
    @keyframes bcKillPulse{0%{opacity:0}35%{opacity:1}100%{opacity:0}}
    @media(orientation:landscape){#bcKillFeedback{top:24%;padding:12px 16px}.bcKillTitle{font-size:20px!important}}
  `;
  doc.head.appendChild(style);

  const pulse = doc.createElement("div");
  pulse.id = "bcKillPulse";
  doc.body.appendChild(pulse);

  const feedback = doc.createElement("div");
  feedback.id = "bcKillFeedback";
  feedback.innerHTML = `<div class="bcKillTitle">УБИЙСТВО</div><div class="bcKillSub">+XP · +Mass</div>`;
  doc.body.appendChild(feedback);
}

function showKillFeedback(doc: Document, xpGain: number, massGain: number) {
  ensureKillFeedback(doc);

  const feedback = doc.getElementById("bcKillFeedback");
  const pulse = doc.getElementById("bcKillPulse");
  if (!feedback || !pulse) return;

  const xpText = xpGain > 0 ? `+${Math.round(xpGain)} XP` : "+XP";
  const massText = massGain > 0 ? `+${massGain.toFixed(2)} Mass` : "+Mass";

  feedback.innerHTML = `<div class="bcKillTitle">УБИЙСТВО</div><div class="bcKillSub">${xpText} · ${massText}</div>`;

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
    ensureKillFeedback(doc);

    const massEl = doc.getElementById("mass");
    const xpEl = doc.getElementById("xpTxt");
    const pearlsEl = doc.getElementById("pearls");
    if (!massEl || !xpEl) return;

    const mass = numberFromText(massEl.textContent);
    const xp = xpFromText(xpEl.textContent || "0/1");
    const pearls = numberFromText(pearlsEl?.textContent);

    const ready = root.getAttribute("data-bc-kill-watch-ready") === "1";
    const lastMass = numberFromText(root.getAttribute("data-bc-last-mass"));
    const lastXp = numberFromText(root.getAttribute("data-bc-last-xp"));
    const lastXpMax = Math.max(1, numberFromText(root.getAttribute("data-bc-last-xp-max")));
    const lastPearls = numberFromText(root.getAttribute("data-bc-last-pearls"));

    root.setAttribute("data-bc-kill-watch-ready", "1");
    root.setAttribute("data-bc-last-mass", String(mass));
    root.setAttribute("data-bc-last-xp", String(xp.current));
    root.setAttribute("data-bc-last-xp-max", String(xp.max));
    root.setAttribute("data-bc-last-pearls", String(pearls));

    if (!ready) return;

    const massGain = mass - lastMass;
    const xpGain = xp.current >= lastXp ? xp.current - lastXp : xp.current + lastXpMax - lastXp;
    const pearlGain = pearls - lastPearls;

    const looksLikeDevour = massGain >= 0.035 && (xpGain >= 12 || pearlGain >= 1);
    if (looksLikeDevour) showKillFeedback(doc, xpGain, massGain);
  } catch {
    // Runtime polish only. Never block EvoFish gameplay.
  }
}
