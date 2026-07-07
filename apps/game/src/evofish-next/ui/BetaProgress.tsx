import React, { useEffect, useMemo, useState } from "react";
import { Link } from "../../router";
import { NEXT_ACHIEVEMENTS, type NextAchievementDefinition } from "../content/achievements";
import { NEXT_BETA_BALANCE_TARGETS, NEXT_BETA_ECONOMY_TARGETS } from "../content/balance";
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
  subscribeEvoFishNextSaveChanges,
  type EvoFishSaveDoctorReport
} from "../state/nextSaveStore";

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
  if (scope === "daily") return "Ежедневные";
  if (scope === "weekly") return "Еженедельные";
  return "История";
}

function statusLabel(report: EvoFishSaveDoctorReport) {
  if (report.status === "healthy") return "Сохранение в порядке";
  if (report.status === "needs_repair") return "Нужно восстановление";
  if (report.status === "repaired") return "Сохранение восстановлено";
  if (report.status === "reset") return "Прогресс сброшен";
  return "Ошибка сохранения";
}

export function BetaProgress() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [doctor, setDoctor] = useState(() => inspectEvoFishNextSave());
  const [copied, setCopied] = useState(false);
  const board = useMemo(() => buildQuestBoard(), []);
  const mutationsTotal = getMutationTotalLevel(save.mutations);
  const ownedSkins = Object.keys(save.loadout.ownedSkins || {}).length;
  const achievementsUnlocked = Object.keys(save.achievements.unlocked || {}).length;
  const achievementPct = Math.round((achievementsUnlocked / Math.max(1, NEXT_ACHIEVEMENTS.length)) * 100);

  const refresh = (report?: EvoFishSaveDoctorReport) => {
    setSave(loadEvoFishNextSave());
    setDoctor(report || inspectEvoFishNextSave());
  };

  useEffect(() => subscribeEvoFishNextSaveChanges(() => refresh()), []);

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
        <small>Награда: {format(quest.reward.xp)} XP · {format(quest.reward.pearls)} жемчуг{quest.reward.corals ? ` · ${quest.reward.corals} кристалл` : ""}</small>
      </article>
    );
  };

  const renderAchievementCard = (achievement: NextAchievementDefinition) => {
    const current = Math.min(achievement.target, achievementValue(save, achievement));
    const done = current >= achievement.target || Boolean(save.achievements.unlocked[achievement.id]);
    return (
      <article key={achievement.id} className={`efBetaCard ${done ? "done" : ""}`}>
        <div className="efBetaRow">
          <b>{achievement.title}</b>
          <span>{Math.floor(current)} / {achievement.target}</span>
        </div>
        <p>{achievement.description}</p>
        <i><em style={{ width: pct(current, achievement.target) }} /></i>
        <small>Награда: {format(achievement.reward.xp)} XP · {format(achievement.reward.pearls)} жемчуг{achievement.reward.corals ? ` · ${achievement.reward.corals} кристалл` : ""}</small>
      </article>
    );
  };

  return (
    <main className="efBetaProgress efAchievementsPage">
      <div className="efAchievementsAtmosphere" aria-hidden="true"><i /><i /><i /><i /></div>
      <section className="efBetaShell">
        <header className="efAchievementsTop" aria-label="Профиль игрока">
          <section className="efAchievementsProfile">
            <div className="efAchievementsAvatar">{save.account.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <span>Игрок</span>
              <h2>{save.account.name}</h2>
              <p>LV {save.account.level} · XP {format(save.account.xp)} / {format(save.account.xpToNext)}</p>
              <i><em style={{ width: pct(save.account.xp, save.account.xpToNext) }} /></i>
            </div>
          </section>
          <nav className="efAchievementsTopNav" aria-label="Быстрые действия">
            <Link to="/game">Лобби</Link>
            <Link to="/game/account">Профиль</Link>
            <Link to="/game/skins">Скины</Link>
          </nav>
        </header>

        <header className="efBetaHero">
          <div>
            <span>EVOFISH NEXT</span>
            <h1>Достижения</h1>
            <p>Квесты, коллекция достижений и развитие активного профиля.</p>
          </div>
          <div className="efAchievementsHeroScore">
            <strong>{achievementPct}%</strong>
            <span>{achievementsUnlocked}/{NEXT_ACHIEVEMENTS.length}</span>
          </div>
          <nav>
            <Link to="/game/next/play">Играть</Link>
            <Link to="/game/next/skins">Скины</Link>
            <Link to="/game">Главная</Link>
          </nav>
        </header>

        <section className="efBetaStats">
          <article><span>Уровень</span><b>{save.progress.level}</b><small>Tier {save.progress.tier}</small></article>
          <article><span>Кошелёк</span><b>{format(save.economy.pearls)} жемчуг</b><small>{format(save.economy.corals)} кораллы</small></article>
          <article><span>Мутации</span><b>{mutationsTotal}</b><small>{NEXT_MUTATIONS.length} веток</small></article>
          <article><span>Скины</span><b>{ownedSkins}</b><small>обликов в коллекции</small></article>
          <article><span>Достижения</span><b>{achievementsUnlocked}/{NEXT_ACHIEVEMENTS.length}</b><small>открыто</small></article>
          <article><span>Ресурсы</span><b>{format(counter(save, "resources"))}</b><small>{counter(save, "perks")} перков · {counter(save, "artifacts")} артефактов</small></article>
        </section>

        <section className="efBetaPanel">
          <div className="efBetaPanelHead"><h2>Баланс наград</h2><span>цели / 10 мин</span></div>
          <div className="efBalanceStats">
            <article><span>Жемчуг / 10 мин</span><b>{NEXT_BETA_ECONOMY_TARGETS.pearlsPerTenMinutes}</b></article>
            <article><span>Кристаллы / 10 мин</span><b>{NEXT_BETA_ECONOMY_TARGETS.coralsPerTenMinutes}</b></article>
            <article><span>Артефакты / 10 мин</span><b>{NEXT_BETA_ECONOMY_TARGETS.artifactPerTenMinutes}</b></article>
            <article><span>Перки / 10 мин</span><b>{NEXT_BETA_ECONOMY_TARGETS.perkPerTenMinutes}</b></article>
          </div>
          <div className="efPickupGrid">
            {NEXT_BETA_BALANCE_TARGETS.map((target) => (
              <article key={target.id} className="efPickupCard">
                <b>{target.label}</b>
                <span>{target.target}</span>
                <small>{target.tuning}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="efBetaDoctor">
          <div className="efBetaPanelHead">
            <div>
              <span>Сохранение</span>
              <h2>{statusLabel(doctor)}</h2>
            </div>
            <small>{new Date(doctor.timestamp).toLocaleString("ru-RU")}</small>
          </div>
          <div className="efDoctorGrid">
            <button onClick={() => refresh(inspectEvoFishNextSave())}>Проверить</button>
            <button onClick={() => refresh(repairEvoFishNextSave())}>Восстановить</button>
            <button onClick={() => refresh(resetEvoFishNextRun())}>Новый забег</button>
            <button onClick={() => refresh(resetEvoFishNextProgressKeepSkins())}>Сбросить прогресс</button>
            <button onClick={copyDebug}>{copied ? "Скопировано" : "Скопировать сохранение"}</button>
          </div>
          <div className="efDoctorIssues">
            {(doctor.issues.length ? doctor.issues : ["Проблем не найдено."]).map((issue) => <span key={issue}>{issue}</span>)}
          </div>
        </section>

        <section className="efBetaGrid two">
          <div className="efBetaPanel">
            <div className="efBetaPanelHead"><h2>Задания</h2><span>{board.dailyKey} · {board.weeklyKey}</span></div>
            {(["daily", "weekly", "story"] as const).map((scope) => (
              <div key={scope} className="efQuestGroup">
                <h3>{questGroupTitle(scope)}</h3>
                {(scope === "daily" ? board.daily : scope === "weekly" ? board.weekly : board.story).map(renderQuestCard)}
              </div>
            ))}
          </div>

          <div className="efBetaPanel">
            <div className="efBetaPanelHead"><h2>Достижения</h2><span>{achievementsUnlocked}/{NEXT_ACHIEVEMENTS.length}</span></div>
            <div className="efAchievementList">
              {NEXT_ACHIEVEMENTS.map(renderAchievementCard)}
            </div>
          </div>
        </section>

        <section className="efBetaGrid two compact">
          <div className="efBetaPanel">
            <div className="efBetaPanelHead"><h2>Ресурсы</h2><span>ресурсы / перки / артефакты</span></div>
            <div className="efPickupGrid">
              {NEXT_RESOURCE_DEFS.map((item) => (
                <article key={item.kind} className="efPickupCard">
                  <b>{item.name}</b>
                  <span>{item.kind}</span>
                  <small>Награда {item.valueMin}-{item.valueMax} · шанс {item.weight} · появление {item.respawnMin}-{item.respawnMax}с</small>
                </article>
              ))}
            </div>
          </div>

          <div className="efBetaPanel">
            <div className="efBetaPanelHead"><h2>Мутации</h2><span>{mutationsTotal} уровней</span></div>
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

        <nav className="efAchievementsBottomNav" aria-label="Основная навигация">
          <Link to="/game"><span>⌂</span><b>Лобби</b></Link>
          <Link className="active" to="/game/progress"><span>◇</span><b>Достижения</b></Link>
          <Link to="/game/account"><span>◉</span><b>Профиль</b></Link>
        </nav>
      </section>

      <style>{`
        .efBetaProgress{min-height:100vh;background:#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efBetaShell{width:min(1180px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efBetaHero,.efBetaStats article,.efBetaPanel,.efBetaDoctor{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efBetaHero{border-radius:30px;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start;background:radial-gradient(circle at 12% 0,rgba(120,240,255,.18),transparent 38%),linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.035))}.efBetaHero span,.efBetaPanelHead span,.efBetaStats span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(231,242,255,.56);font-weight:1000}.efBetaHero h1{margin:4px 0;font-size:32px;line-height:1}.efBetaHero p{margin:0;color:rgba(231,242,255,.68)}.efBetaHero nav{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.efBetaHero a,.efDoctorGrid button{min-height:38px;border-radius:999px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.10);color:#e7f2ff;padding:0 13px;text-decoration:none;font-weight:1000;display:inline-flex;align-items:center;justify-content:center}.efBetaStats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.efBetaStats article{border-radius:20px;padding:12px;display:grid;gap:4px;min-width:0}.efBetaStats b{font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efBetaStats small,.efBetaCard small,.efPickupCard small,.efDoctorIssues span{color:rgba(231,242,255,.62);font-size:11px}.efBetaDoctor,.efBetaPanel{border-radius:26px;padding:14px;display:grid;gap:12px}.efBetaPanelHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.efBetaPanelHead h2{margin:0;font-size:20px}.efDoctorGrid{display:flex;gap:8px;flex-wrap:wrap}.efDoctorGrid button{cursor:pointer}.efDoctorIssues{display:grid;gap:6px}.efDoctorIssues span{padding:8px 10px;border-radius:13px;background:rgba(2,16,27,.36);border:1px solid rgba(255,255,255,.07)}.efBetaGrid.two{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}.efQuestGroup{display:grid;gap:8px;margin-top:4px}.efQuestGroup h3{margin:8px 0 0;color:#fff3a0;font-size:12px;letter-spacing:.10em;text-transform:uppercase}.efBetaCard,.efPickupCard{border-radius:17px;border:1px solid rgba(255,255,255,.09);background:rgba(2,16,27,.34);padding:10px;display:grid;gap:6px}.efBetaCard.done{border-color:rgba(110,255,180,.22);background:rgba(110,255,180,.06)}.efBetaRow{display:flex;justify-content:space-between;gap:12px}.efBetaRow b{font-size:13px}.efBetaRow span{font-size:12px;color:#fff3a0;font-weight:1000}.efBetaCard p{margin:0;color:rgba(231,242,255,.72);font-size:12px;line-height:1.35}.efBetaCard i{height:6px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efBetaCard i em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#78f0ff,#fff3a0)}.efAchievementList{display:grid;gap:8px;max-height:720px;overflow:auto;padding-right:3px}.efPickupGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efPickupCard b{font-size:13px}.efPickupCard span{font-size:10px;color:#fff3a0;text-transform:uppercase;font-weight:1000}.efBalanceStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.efBalanceStats article{border-radius:17px;border:1px solid rgba(255,255,255,.09);background:rgba(120,240,255,.07);padding:10px;display:grid;gap:5px}.efBalanceStats span{font-size:10px;color:rgba(231,242,255,.60);font-weight:1000;text-transform:uppercase;letter-spacing:.08em}.efBalanceStats b{font-size:15px;color:#fff3a0}@media(max-width:920px){.efBetaStats,.efBalanceStats{grid-template-columns:repeat(2,minmax(0,1fr))}.efBetaGrid.two,.efPickupGrid{grid-template-columns:1fr}.efBetaHero{display:grid}.efBetaHero nav{justify-content:flex-start}.efBetaHero h1{font-size:26px}}
      `}</style>
      <style>{`
        .efAchievementsPage{position:relative;isolation:isolate;overflow-x:hidden;background:#020915;background-image:linear-gradient(180deg,rgba(2,9,21,.12),rgba(2,9,21,.70)),url("/game/assets/lobby/lobby-bg-station-16x9.png");background-size:cover;background-position:center;background-attachment:fixed}.efAchievementsPage:before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 50% 18%,rgba(53,216,255,.20),transparent 36%),linear-gradient(90deg,rgba(2,9,21,.42),transparent 32%,transparent 68%,rgba(2,9,21,.42))}.efAchievementsAtmosphere{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}.efAchievementsAtmosphere i{position:absolute;width:7px;height:7px;border-radius:999px;background:rgba(223,248,255,.42);box-shadow:0 0 18px rgba(53,216,255,.35);animation:efAchievementBubble 13s linear infinite}.efAchievementsAtmosphere i:nth-child(1){left:11%;bottom:-8%;animation-delay:-3s}.efAchievementsAtmosphere i:nth-child(2){left:78%;bottom:-9%;width:10px;height:10px;animation-delay:-7s}.efAchievementsAtmosphere i:nth-child(3){left:56%;bottom:-12%;width:5px;height:5px;animation-delay:-1s}.efAchievementsAtmosphere i:nth-child(4){left:92%;bottom:-10%;animation-delay:-9s}.efBetaShell{position:relative;z-index:1;padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}.efAchievementsTop{display:grid;grid-template-columns:minmax(260px,430px) auto;gap:12px;align-items:center}.efAchievementsProfile,.efAchievementsTopNav,.efAchievementsBottomNav,.efAchievementsHeroScore{border:1px solid rgba(88,210,255,.25);background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025)),rgba(5,18,32,.62);box-shadow:0 18px 60px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efAchievementsProfile{border-radius:8px;padding:10px;display:grid;grid-template-columns:54px minmax(0,1fr);gap:12px;align-items:center}.efAchievementsProfile span{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(150,232,255,.78);font-weight:1000}.efAchievementsProfile h2{margin:1px 0 3px;font-size:22px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efAchievementsProfile p{margin:0;color:rgba(234,247,255,.66);font-size:13px}.efAchievementsProfile i{display:block;height:7px;margin-top:5px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efAchievementsProfile em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#35d8ff,#f5b84b)}.efAchievementsAvatar{width:54px;height:54px;border-radius:999px;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,rgba(255,255,255,.80),rgba(53,216,255,.30) 42%,rgba(7,27,45,.88));border:1px solid rgba(88,210,255,.38);font-weight:1000;font-size:22px}.efAchievementsTopNav{justify-self:end;border-radius:999px;padding:7px;display:flex;gap:6px}.efAchievementsTopNav a{min-height:40px;border-radius:999px;padding:0 14px;display:inline-flex;align-items:center;color:#eaf7ff;text-decoration:none;font-weight:1000;background:rgba(5,18,32,.42);border:1px solid rgba(88,210,255,.16)}.efBetaHero{border-radius:8px!important;background:linear-gradient(120deg,rgba(53,216,255,.16),rgba(5,18,32,.70)),rgba(5,18,32,.58)!important;align-items:center!important}.efBetaHero h1{font-size:clamp(40px,6vw,76px)!important}.efBetaHero p{max-width:560px}.efAchievementsHeroScore{border-radius:999px;width:132px;height:132px;display:grid;place-items:center;align-content:center;gap:2px}.efAchievementsHeroScore strong{font-size:36px;line-height:1}.efAchievementsHeroScore span{font-size:12px;color:rgba(234,247,255,.66);font-weight:1000}.efBetaStats article,.efBetaPanel,.efBetaDoctor{border-radius:8px!important;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025)),rgba(5,18,32,.62)!important;border-color:rgba(88,210,255,.22)!important}.efBetaCard,.efPickupCard,.efBalanceStats article{border-radius:8px!important;background:rgba(5,18,32,.46)!important;border-color:rgba(88,210,255,.14)!important}.efBetaCard.done{background:linear-gradient(180deg,rgba(110,255,180,.12),rgba(5,18,32,.44))!important;border-color:rgba(110,255,180,.28)!important}.efAchievementList{max-height:none!important}.efAchievementsBottomNav{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));z-index:10;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));border-radius:999px;padding:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efAchievementsBottomNav a{min-height:54px;border-radius:999px;display:grid;place-items:center;align-content:center;gap:2px;text-decoration:none;color:rgba(234,247,255,.62);font-size:11px;font-weight:950}.efAchievementsBottomNav a.active{background:rgba(53,216,255,.14);color:#eaf7ff;box-shadow:inset 0 0 20px rgba(53,216,255,.10)}.efAchievementsBottomNav span{font-size:16px}.efAchievementsBottomNav b{font-size:11px}@media(max-width:920px){.efAchievementsTop{grid-template-columns:1fr}.efAchievementsTopNav{justify-self:stretch;justify-content:center}.efBetaHero{grid-template-columns:1fr!important}.efAchievementsHeroScore{width:104px;height:104px}.efAchievementsHeroScore strong{font-size:28px}}@media(max-width:560px){.efBetaShell{width:min(100%,calc(100vw - 20px))!important;padding-top:max(10px,env(safe-area-inset-top))!important}.efAchievementsTopNav a{padding:0 10px;font-size:13px}.efBetaHero h1{font-size:42px!important}.efAchievementsHeroScore{display:none}.efBetaStats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.efBetaStats article{min-height:82px}.efAchievementsBottomNav{width:calc(100vw - 18px)}}@keyframes efAchievementBubble{0%{transform:translateY(0);opacity:0}12%{opacity:.68}100%{transform:translateY(-110vh);opacity:0}}
      `}</style>
    </main>
  );
}
