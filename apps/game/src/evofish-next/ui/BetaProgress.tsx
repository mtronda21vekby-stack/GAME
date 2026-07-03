import React, { useMemo, useState } from "react";
import { Link } from "../../router";
import { NEXT_ACHIEVEMENTS, type NextAchievementDefinition } from "../content/achievements";
import { getMutationTotalLevel, NEXT_MUTATIONS } from "../content/mutations";
import { buildQuestBoard, type NextQuestDefinition } from "../content/quests";
import { NEXT_RESOURCE_DEFS } from "../content/resources";
import {
  exportEvoFishNextDebugSave,
  inspectEvoFishNextSave,
  loadEvoFishNextSave,
  repairEvoFishNextSave,
  resetEvoFishNextProgressKeepSkins,
  resetEvoFishNextRun,
  type EvoFishSaveDoctorReport
} from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function pct(current: number, target: number) {
  return `${Math.max(0, Math.min(100, (current / Math.max(1, target)) * 100))}%`;
}

function counter(save: ReturnType<typeof loadEvoFishNextSave>, key: string) {
  return Math.max(0, Math.floor(save.quests.counters?.[key] || 0));
}

function questValue(save: ReturnType<typeof loadEvoFishNextSave>, quest: NextQuestDefinition) {
  if (quest.metric === "kills") return save.progress.kills;
  if (quest.metric === "mass") return save.progress.mass;
  if (quest.metric === "level") return save.progress.level;
  if (quest.metric === "tier") return save.progress.tier;
  if (quest.metric === "pearls") return save.economy.pearls;
  if (quest.metric === "corals") return save.economy.corals;
  if (quest.metric === "resources") return counter(save, "resources");
  if (quest.metric === "craft") return counter(save, "craft");
  if (quest.metric === "mutations") return Math.max(counter(save, "mutations"), getMutationTotalLevel(save.mutations));
  if (quest.metric === "perks") return counter(save, "perks");
  if (quest.metric === "artifacts") return counter(save, "artifacts");
  return 0;
}

function achievementValue(save: ReturnType<typeof loadEvoFishNextSave>, achievement: NextAchievementDefinition) {
  if (achievement.metric === "kills") return save.progress.kills;
  if (achievement.metric === "tier") return save.progress.tier;
  if (achievement.metric === "level") return save.progress.level;
  if (achievement.metric === "craft") return counter(save, "craft");
  if (achievement.metric === "resources") return counter(save, "resources");
  if (achievement.metric === "mutations") return Math.max(counter(save, "mutations"), getMutationTotalLevel(save.mutations));
  if (achievement.metric === "perks") return counter(save, "perks");
  if (achievement.metric === "artifacts") return counter(save, "artifacts");
  if (achievement.metric === "pearls") return save.economy.pearls;
  if (achievement.metric === "corals") return save.economy.corals;
  return 0;
}

function questGroupTitle(scope: "daily" | "weekly" | "story") {
  if (scope === "daily") return "Daily";
  if (scope === "weekly") return "Weekly";
  return "Story";
}

function statusLabel(report: EvoFishSaveDoctorReport) {
  if (report.status === "healthy") return "HEALTHY";
  if (report.status === "needs_repair") return "NEEDS REPAIR";
  if (report.status === "repaired") return "REPAIRED";
  if (report.status === "reset") return "RESET DONE";
  return "ERROR";
}

export function BetaProgress() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [doctor, setDoctor] = useState(() => inspectEvoFishNextSave());
  const [copied, setCopied] = useState(false);
  const board = useMemo(() => buildQuestBoard(), []);
  const mutationsTotal = getMutationTotalLevel(save.mutations);
  const ownedSkins = Object.keys(save.loadout.ownedSkins || {}).length;
  const achievementsUnlocked = Object.keys(save.achievements.unlocked || {}).length;

  const refresh = (report?: EvoFishSaveDoctorReport) => {
    setSave(loadEvoFishNextSave());
    setDoctor(report || inspectEvoFishNextSave());
  };

  const copyDebug = async () => {
    const data = exportEvoFishNextDebugSave();
    setCopied(false);
    try {
      await navigator.clipboard?.writeText(data);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const renderQuestCard = (quest: NextQuestDefinition) => {
    const current = Math.min(quest.target, questValue(save, quest));
    const done = current >= quest.target || Boolean(save.quests.completed[quest.id]);
    return (
      <article key={quest.id} className={`efBetaCard ${done ? "done" : ""}`}>
        <div className="efBetaRow">
          <b>{quest.title}</b>
          <span>{Math.floor(current)} / {quest.target}</span>
        </div>
        <p>{quest.description}</p>
        <i><em style={{ width: pct(current, quest.target) }} /></i>
        <small>Reward: {format(quest.reward.xp)} XP · {format(quest.reward.pearls)} жемчуг{quest.reward.corals ? ` · ${quest.reward.corals} кристалл` : ""}</small>
      </article>
    );
  };

  const renderAchievementCard = (achievement: NextAchievementDefinition) => {
    const current = Math.min(achievement.target, achievementValue(save, achievement));
    const done = current >= achievement.target || Boolean(save.achievements.unlocked[achievement.id]);
    return (
      <article key={achievement.id} className={`efBetaCard ${done ? "done" : ""}`}>
        <div className="efBetaRow">
          <b>🏆 {achievement.title}</b>
          <span>{Math.floor(current)} / {achievement.target}</span>
        </div>
        <p>{achievement.description}</p>
        <i><em style={{ width: pct(current, achievement.target) }} /></i>
        <small>Reward: {format(achievement.reward.xp)} XP · {format(achievement.reward.pearls)} жемчуг{achievement.reward.corals ? ` · ${achievement.reward.corals} кристалл` : ""}</small>
      </article>
    );
  };

  return (
    <main className="efBetaProgress">
      <section className="efBetaShell">
        <header className="efBetaHero">
          <div>
            <span>BLACKCROWN BETA HUB · {EVOFISH_NEXT_VERSION}</span>
            <h1>Progress + Save Doctor</h1>
            <p>Центр беты: прогресс, задания, достижения, pickups, мутации и безопасное восстановление сохранения.</p>
          </div>
          <nav>
            <Link to="/game/next/play">PLAY</Link>
            <Link to="/game/next/skins">SKINS</Link>
            <Link to="/game">LOBBY</Link>
          </nav>
        </header>

        <section className="efBetaStats">
          <article><span>Run LV</span><b>{save.progress.level}</b><small>Tier {save.progress.tier}</small></article>
          <article><span>Wallet</span><b>🦪 {format(save.economy.pearls)}</b><small>💎 {format(save.economy.corals)}</small></article>
          <article><span>Mutations</span><b>{mutationsTotal}</b><small>{NEXT_MUTATIONS.length} branches</small></article>
          <article><span>Skins</span><b>{ownedSkins}</b><small>Equipped: {save.loadout.equippedSkinId}</small></article>
          <article><span>Achievements</span><b>{achievementsUnlocked}/{NEXT_ACHIEVEMENTS.length}</b><small>Unlocked</small></article>
          <article><span>Pickups</span><b>{format(counter(save, "resources"))}</b><small>{counter(save, "perks")} perks · {counter(save, "artifacts")} artifacts</small></article>
        </section>

        <section className="efBetaDoctor">
          <div className="efBetaPanelHead">
            <div>
              <span>Save Doctor</span>
              <h2>{statusLabel(doctor)}</h2>
            </div>
            <small>{new Date(doctor.timestamp).toLocaleString("ru-RU")}</small>
          </div>
          <div className="efDoctorGrid">
            <button onClick={() => refresh(inspectEvoFishNextSave())}>Inspect</button>
            <button onClick={() => refresh(repairEvoFishNextSave())}>Repair Save</button>
            <button onClick={() => refresh(resetEvoFishNextRun())}>Reset Run</button>
            <button onClick={() => refresh(resetEvoFishNextProgressKeepSkins())}>Reset Progress · Keep Skins</button>
            <button onClick={copyDebug}>{copied ? "Copied" : "Copy Debug Save"}</button>
          </div>
          <div className="efDoctorIssues">
            {(doctor.issues.length ? doctor.issues : ["No issues detected."]).map((issue) => <span key={issue}>{issue}</span>)}
          </div>
        </section>

        <section className="efBetaGrid two">
          <div className="efBetaPanel">
            <div className="efBetaPanelHead"><h2>Daily / Weekly / Story</h2><span>{board.dailyKey} · {board.weeklyKey}</span></div>
            {(["daily", "weekly", "story"] as const).map((scope) => (
              <div key={scope} className="efQuestGroup">
                <h3>{questGroupTitle(scope)}</h3>
                {(scope === "daily" ? board.daily : scope === "weekly" ? board.weekly : board.story).map(renderQuestCard)}
              </div>
            ))}
          </div>

          <div className="efBetaPanel">
            <div className="efBetaPanelHead"><h2>Achievements</h2><span>{achievementsUnlocked}/{NEXT_ACHIEVEMENTS.length}</span></div>
            <div className="efAchievementList">
              {NEXT_ACHIEVEMENTS.map(renderAchievementCard)}
            </div>
          </div>
        </section>

        <section className="efBetaGrid two compact">
          <div className="efBetaPanel">
            <div className="efBetaPanelHead"><h2>Pickups Guide</h2><span>resources / perks / artifacts</span></div>
            <div className="efPickupGrid">
              {NEXT_RESOURCE_DEFS.map((item) => (
                <article key={item.kind} className="efPickupCard">
                  <b>{item.name}</b>
                  <span>{item.kind}</span>
                  <small>Value {item.valueMin}-{item.valueMax} · weight {item.weight} · respawn {item.respawnMin}-{item.respawnMax}s</small>
                </article>
              ))}
            </div>
          </div>

          <div className="efBetaPanel">
            <div className="efBetaPanelHead"><h2>Mutations</h2><span>{mutationsTotal} total LV</span></div>
            <div className="efPickupGrid">
              {NEXT_MUTATIONS.map((mutation) => (
                <article key={mutation.id} className="efPickupCard">
                  <b>{mutation.name}</b>
                  <span>LV {save.mutations.levels[mutation.id] || 0}/{mutation.maxLevel} · {mutation.stat.toUpperCase()}</span>
                  <small>{mutation.description}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>

      <style>{`
        .efBetaProgress{min-height:100vh;background:#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efBetaShell{width:min(1180px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efBetaHero,.efBetaStats article,.efBetaPanel,.efBetaDoctor{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efBetaHero{border-radius:30px;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start;background:radial-gradient(circle at 12% 0,rgba(120,240,255,.18),transparent 38%),linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.035))}.efBetaHero span,.efBetaPanelHead span,.efBetaStats span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(231,242,255,.56);font-weight:1000}.efBetaHero h1{margin:4px 0;font-size:32px;line-height:1}.efBetaHero p{margin:0;color:rgba(231,242,255,.68)}.efBetaHero nav{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.efBetaHero a,.efDoctorGrid button{min-height:38px;border-radius:999px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.10);color:#e7f2ff;padding:0 13px;text-decoration:none;font-weight:1000;display:inline-flex;align-items:center;justify-content:center}.efBetaStats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.efBetaStats article{border-radius:20px;padding:12px;display:grid;gap:4px;min-width:0}.efBetaStats b{font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efBetaStats small,.efBetaCard small,.efPickupCard small,.efDoctorIssues span{color:rgba(231,242,255,.62);font-size:11px}.efBetaDoctor,.efBetaPanel{border-radius:26px;padding:14px;display:grid;gap:12px}.efBetaPanelHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.efBetaPanelHead h2{margin:0;font-size:20px}.efDoctorGrid{display:flex;gap:8px;flex-wrap:wrap}.efDoctorGrid button{cursor:pointer}.efDoctorIssues{display:grid;gap:6px}.efDoctorIssues span{padding:8px 10px;border-radius:13px;background:rgba(2,16,27,.36);border:1px solid rgba(255,255,255,.07)}.efBetaGrid.two{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}.efQuestGroup{display:grid;gap:8px;margin-top:4px}.efQuestGroup h3{margin:8px 0 0;color:#fff3a0;font-size:12px;letter-spacing:.10em;text-transform:uppercase}.efBetaCard,.efPickupCard{border-radius:17px;border:1px solid rgba(255,255,255,.09);background:rgba(2,16,27,.34);padding:10px;display:grid;gap:6px}.efBetaCard.done{border-color:rgba(110,255,180,.22);background:rgba(110,255,180,.06)}.efBetaRow{display:flex;justify-content:space-between;gap:12px}.efBetaRow b{font-size:13px}.efBetaRow span{font-size:12px;color:#fff3a0;font-weight:1000}.efBetaCard p{margin:0;color:rgba(231,242,255,.72);font-size:12px;line-height:1.35}.efBetaCard i{height:6px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efBetaCard i em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#78f0ff,#fff3a0)}.efAchievementList{display:grid;gap:8px;max-height:720px;overflow:auto;padding-right:3px}.efPickupGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efPickupCard b{font-size:13px}.efPickupCard span{font-size:10px;color:#fff3a0;text-transform:uppercase;font-weight:1000}@media(max-width:920px){.efBetaStats{grid-template-columns:repeat(2,minmax(0,1fr))}.efBetaGrid.two,.efPickupGrid{grid-template-columns:1fr}.efBetaHero{display:grid}.efBetaHero nav{justify-content:flex-start}.efBetaHero h1{font-size:26px}}
      `}</style>
    </main>
  );
}
