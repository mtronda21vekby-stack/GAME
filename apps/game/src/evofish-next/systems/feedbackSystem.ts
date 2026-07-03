import type { NextEngineState } from "../core/engineTypes";

const BUFF_HUD_ID = "efActiveBuffHud";

function seconds(value: number) {
  return Math.max(0, value || 0);
}

function buffItems(state: NextEngineState) {
  const items: { key: string; label: string; value: number; tone: string }[] = [];

  if (seconds(state.craft.barrierT) > 0) items.push({ key: "barrier", label: "SHD", value: state.craft.barrierT, tone: "#9affc1" });
  if (seconds(state.craft.biteBoostT) > 0) items.push({ key: "bite", label: "DMG", value: state.craft.biteBoostT, tone: "#ffd36d" });
  if (seconds(state.craft.sonarT) > 0) items.push({ key: "sonar", label: "SONAR", value: state.craft.sonarT, tone: "#78f0ff" });
  if (seconds(state.player.dashT) > 0) items.push({ key: "dash", label: "DASH", value: state.player.dashT, tone: "#b48cff" });
  if (seconds(state.player.invulnT) > 0.2) items.push({ key: "invuln", label: "SAFE", value: state.player.invulnT, tone: "#fff3a0" });
  if (state.mutationDraft) items.push({ key: "draft", label: "MUTATION", value: 1, tone: "#ffcc6d" });

  return items;
}

function removeBuffHud() {
  if (typeof document === "undefined") return;
  document.getElementById(BUFF_HUD_ID)?.remove();
}

function ensureBuffHudCleaner() {
  if (typeof window === "undefined") return;
  const keyedWindow = window as typeof window & { __efActiveBuffHudCleaner?: number };
  if (keyedWindow.__efActiveBuffHudCleaner) return;

  keyedWindow.__efActiveBuffHudCleaner = window.setInterval(() => {
    if (!window.location.pathname.includes("play")) removeBuffHud();
  }, 900);
}

function renderBuffHud(state: NextEngineState) {
  if (typeof document === "undefined") return;
  ensureBuffHudCleaner();

  const items = buffItems(state);
  let hud = document.getElementById(BUFF_HUD_ID) as HTMLDivElement | null;

  if (!items.length) {
    hud?.remove();
    return;
  }

  if (!hud) {
    hud = document.createElement("div");
    hud.id = BUFF_HUD_ID;
    document.body.appendChild(hud);
  }

  hud.style.cssText = "position:fixed;left:max(12px,env(safe-area-inset-left));top:142px;z-index:18;display:flex;flex-wrap:wrap;gap:6px;max-width:min(360px,calc(100vw - 24px));pointer-events:none;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;";
  hud.innerHTML = items.map((item) => `
    <span style="display:inline-flex;align-items:center;gap:6px;min-height:26px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(2,16,27,.68);box-shadow:0 10px 26px rgba(0,0,0,.26);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:0 9px;color:#e7f2ff;font-size:10px;font-weight:1000;letter-spacing:.06em;">
      <b style="color:${item.tone};font-weight:1000;">${item.label}</b>
      <em style="font-style:normal;color:rgba(231,242,255,.74);">${item.key === "draft" ? "READY" : `${Math.ceil(item.value)}s`}</em>
    </span>`).join("");
}

export function updateFeedbackSystem(state: NextEngineState, dt: number) {
  for (const enemy of state.enemies) enemy.hitT = Math.max(0, enemy.hitT - dt);
  state.player.hitT = Math.max(0, state.player.hitT - dt);

  for (const float of state.floats) {
    float.ttl -= dt;
    float.y -= 34 * dt;
  }

  state.floats = state.floats.filter((float) => float.ttl > 0);
  renderBuffHud(state);
}
