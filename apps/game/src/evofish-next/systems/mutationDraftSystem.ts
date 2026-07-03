import type { NextEngineState } from "../core/engineTypes";
import { getMutationLevel, NEXT_MUTATIONS, type NextMutationDefinition } from "../content/mutations";
import { refreshMutationStats } from "./progressionSystem";

const OVERLAY_ID = "efMutationDraftOverlay";

function addFloat(state: NextEngineState, text: string) {
  state.floats.push({
    id: state.nextFloatId++,
    x: state.player.x,
    y: state.player.y - state.player.radius * 3.2,
    text,
    ttl: 1.1,
    kind: "kill"
  });
}

function counter(state: NextEngineState, key: string) {
  return Math.max(0, Math.floor(state.quests.counters?.[key] || 0));
}

function setCounter(state: NextEngineState, key: string, value: number) {
  state.quests.counters = state.quests.counters || {};
  state.quests.counters[key] = Math.max(0, Math.floor(value));
}

function bumpCounter(state: NextEngineState, key: string, amount = 1) {
  setCounter(state, key, counter(state, key) + amount);
}

function eligibleMutationIds(state: NextEngineState) {
  return NEXT_MUTATIONS
    .filter((mutation) => getMutationLevel(state.mutations, mutation.id) < mutation.maxLevel)
    .map((mutation) => mutation.id);
}

function pickOptions(state: NextEngineState) {
  const eligible = eligibleMutationIds(state);
  const seeded = [...eligible].sort((a, b) => {
    const ax = Math.sin((state.frame + state.player.level * 17 + a.length * 31) * 0.017) + Math.random() * 0.1;
    const bx = Math.sin((state.frame + state.player.level * 17 + b.length * 31) * 0.017) + Math.random() * 0.1;
    return bx - ax;
  });
  return seeded.slice(0, 3);
}

function mutationById(id: string) {
  return NEXT_MUTATIONS.find((mutation) => mutation.id === id);
}

function statLabel(mutation: NextMutationDefinition) {
  if (mutation.stat === "hp") return "HP";
  if (mutation.stat === "damage") return "DMG";
  if (mutation.stat === "speed") return "SPD";
  return "LOOT";
}

function removeDraftOverlay() {
  if (typeof document === "undefined") return;
  document.getElementById(OVERLAY_ID)?.remove();
}

function renderMutationDraftOverlay(state: NextEngineState) {
  if (typeof document === "undefined") return;
  const draft = state.mutationDraft;
  if (!draft) {
    removeDraftOverlay();
    return;
  }

  let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
  if (overlay?.dataset.draftId === String(draft.id)) return;

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    document.body.appendChild(overlay);
  }

  overlay.dataset.draftId = String(draft.id);
  overlay.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.52);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);pointer-events:auto;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;";

  const cards = draft.options
    .map((id) => mutationById(id))
    .filter(Boolean)
    .map((mutation) => {
      const current = getMutationLevel(state.mutations, mutation!.id);
      return `
        <button data-mutation-id="${mutation!.id}" style="min-height:156px;text-align:left;border-radius:22px;border:1px solid rgba(150,230,255,.18);background:linear-gradient(180deg,rgba(120,240,255,.13),rgba(2,16,27,.70));color:#e7f2ff;padding:14px;box-shadow:0 18px 54px rgba(0,0,0,.32);display:grid;gap:8px;touch-action:manipulation;">
          <b style="font-size:14px;font-weight:1000;">${mutation!.name}</b>
          <span style="display:inline-flex;width:max-content;padding:4px 8px;border-radius:999px;background:rgba(255,243,160,.12);border:1px solid rgba(255,243,160,.18);font-size:10px;font-weight:1000;color:#fff3a0;">${statLabel(mutation!)} · LV ${current + 1}/${mutation!.maxLevel}</span>
          <small style="font-size:11px;line-height:1.35;color:rgba(231,242,255,.72);">${mutation!.description}</small>
          <em style="font-style:normal;font-size:10px;color:rgba(120,240,255,.90);font-weight:1000;">Выбрать мутацию</em>
        </button>`;
    })
    .join("");

  overlay.innerHTML = `
    <div style="width:min(760px,94vw);border-radius:28px;border:1px solid rgba(150,230,255,.20);background:rgba(2,16,27,.88);box-shadow:0 28px 90px rgba(0,0,0,.48);padding:16px;display:grid;gap:12px;">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <div style="font-size:11px;font-weight:1000;color:#fff3a0;letter-spacing:.08em;text-transform:uppercase;">Mutation Draft</div>
          <h2 style="margin:3px 0 0;font-size:20px;line-height:1.1;">Эволюция: выбери 1 из 3</h2>
        </div>
        <div style="font-size:11px;color:rgba(231,242,255,.62);font-weight:900;">LV ${state.player.level} · Tier ${state.player.tier}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">${cards}</div>
      <div style="font-size:11px;color:rgba(231,242,255,.58);">Мир поставлен на паузу. Выбор бесплатный и засчитывается в задания/достижения.</div>
    </div>`;

  overlay.querySelectorAll<HTMLButtonElement>("[data-mutation-id]").forEach((button) => {
    button.onclick = () => {
      const id = button.getAttribute("data-mutation-id") || "";
      if (applyMutationDraftChoice(state, id)) removeDraftOverlay();
    };
  });
}

export function updateMutationDraftSystem(state: NextEngineState) {
  if (state.mutationDraft) {
    state.stats.mutationDraftReady = true;
    renderMutationDraftOverlay(state);
    return;
  }

  removeDraftOverlay();

  const lastDraftLevel = counter(state, "mutationDraftLevel");
  const shouldDraftByLevel = state.player.level >= 4 && state.player.level >= lastDraftLevel + 4;
  const lastDraftTier = counter(state, "mutationDraftTier");
  const shouldDraftByTier = state.player.tier >= 3 && state.player.tier >= lastDraftTier + 3;

  if (!shouldDraftByLevel && !shouldDraftByTier) {
    state.stats.mutationDraftReady = false;
    return;
  }

  const options = pickOptions(state);
  if (!options.length) {
    state.stats.mutationDraftReady = false;
    return;
  }

  state.mutationDraft = {
    id: state.frame + state.player.level * 1000 + state.player.tier * 100,
    source: shouldDraftByLevel ? "level" : "tier",
    options,
    createdFrame: state.frame
  };
  state.stats.mutationDraftReady = true;
  state.stats.lastEvent = "Мутация: выбери 1 из 3";
  renderMutationDraftOverlay(state);
}

export function applyMutationDraftChoice(state: NextEngineState, mutationId: string) {
  const draft = state.mutationDraft;
  if (!draft || !draft.options.includes(mutationId)) return false;

  const mutation = NEXT_MUTATIONS.find((item) => item.id === mutationId);
  if (!mutation) return false;

  const current = getMutationLevel(state.mutations, mutationId);
  if (current >= mutation.maxLevel) return false;

  state.mutations.levels[mutationId] = Math.min(mutation.maxLevel, current + 1);
  setCounter(state, "mutationDraftLevel", state.player.level);
  setCounter(state, "mutationDraftTier", state.player.tier);
  bumpCounter(state, "mutations");
  state.mutationDraft = null;
  state.stats.mutationDraftReady = false;
  state.stats.mutationPurchases = counter(state, "mutations");
  state.stats.lastEvent = `Мутация выбрана: ${mutation.name} LV ${current + 1}/${mutation.maxLevel}`;
  addFloat(state, `MUTATION: ${mutation.name}`);
  refreshMutationStats(state);
  removeDraftOverlay();
  return true;
}
