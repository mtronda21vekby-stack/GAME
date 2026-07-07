import React, { useState } from "react";
import { Link } from "../../router";
import { renameNextAccount } from "../content/account";
import { getMutationTotalLevel } from "../content/mutations";
import { EVOFISH_SKIN_BY_ID, EVOFISH_SKINS } from "../content/skins";
import { SkinPreview } from "../render/SkinPreview";
import {
  inspectEvoFishNextSave,
  loadEvoFishNextSave,
  repairEvoFishNextSave,
  resetEvoFishNextRun,
  saveEvoFishNextSave,
  type EvoFishSaveDoctorReport
} from "../state/nextSaveStore";

function format(value: number) { return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU"); }
function statusLabel(report: EvoFishSaveDoctorReport) { if (report.status === "healthy") return "Сохранение в порядке"; if (report.status === "needs_repair") return "Нужен ремонт сохранения"; if (report.status === "repaired") return "Сохранение восстановлено"; if (report.status === "reset") return "Забег перезапущен"; return "Ошибка сохранения"; }
function statusTone(report: EvoFishSaveDoctorReport) { if (report.status === "healthy" || report.status === "repaired" || report.status === "reset") return "good"; if (report.status === "needs_repair") return "warn"; return "bad"; }

type ModeId = "next" | "classic";

const SIDE_ACTIONS = [
  { label: "Магазин", icon: "◈", to: "/game/skins", notify: true },
  { label: "Инвентарь", icon: "▣", to: "/game/progress" },
  { label: "Скины", icon: "✦", to: "/game/skins" },
  { label: "Мутации", icon: "✺", to: "/game/progress" },
  { label: "Квесты", icon: "◇", to: "/game/progress", notify: true },
  { label: "События", icon: "✧", to: "/game/season" },
  { label: "Крафт", icon: "⬡", to: "/game/play" }
] as const;

const MODE_COPY: Record<ModeId, { title: string; subtitle: string; cta: string; href: string }> = {
  next: { title: "EvoFish Next", subtitle: "Новая версия", cta: "Играть в Next", href: "/game/?mode=next" },
  classic: { title: "EvoFish Classic", subtitle: "Классический режим", cta: "Играть в Classic", href: "/game/?mode=classic" }
};

export function BetaHome() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [doctor, setDoctor] = useState(() => inspectEvoFishNextSave());
  const [draftName, setDraftName] = useState(() => save.account.name);
  const [nameSaved, setNameSaved] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ModeId>("next");
  const mutations = getMutationTotalLevel(save.mutations);
  const ownedSkins = Object.keys(save.loadout.ownedSkins || {}).length;
  const achievements = Object.keys(save.achievements.unlocked || {}).length;
  const completedQuests = Object.keys(save.quests.completed || {}).length;
  const needsRepair = doctor.status !== "healthy";
  const heroSkin = EVOFISH_SKIN_BY_ID[save.loadout.equippedSkinId] || EVOFISH_SKIN_BY_ID.default;
  const heroForm = save.progress.form || "fish";
  const mode = MODE_COPY[selectedMode];

  const refresh = (report?: EvoFishSaveDoctorReport) => {
    const nextSave = loadEvoFishNextSave();
    setSave(nextSave);
    setDoctor(report || inspectEvoFishNextSave());
    setDraftName(nextSave.account.name);
  };

  const saveNickname = () => {
    const fresh = loadEvoFishNextSave();
    saveEvoFishNextSave({ ...fresh, account: renameNextAccount(fresh.account, draftName) });
    refresh();
    setNameSaved(true);
    window.setTimeout(() => setNameSaved(false), 1800);
  };

  return (
    <main className="efBetaHome">
      <div className="efHubAtmosphere" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <section className="efBetaHomeShell">
        <header className="efHubTop">
          <section className="efHubProfile" aria-label="Профиль игрока">
            <div className="efAccountAvatar">{save.account.name.slice(0, 1).toUpperCase()}</div>
            <div className="efHubProfileBody">
              <span>Игрок</span>
              <div className="efHubNameRow">
                <h2>{save.account.name}</h2>
                <Link className="efHubProfileLink" to="/game/account">Профиль</Link>
              </div>
              <p>LV {save.account.level} · XP {format(save.account.xp)} / {format(save.account.xpToNext)}</p>
              <i><em style={{ width: `${Math.max(0, Math.min(100, (save.account.xp / Math.max(1, save.account.xpToNext)) * 100))}%` }} /></i>
            </div>
          </section>

          <section className="efHubWallet" aria-label="Игровые ресурсы">
            <span><b>◌</b>{format(save.economy.pearls)}<em>Жемчуг</em></span>
            <span><b>✺</b>{format(save.economy.corals)}<em>Коралл</em></span>
            <Link className="efHubSettings" to="/game/account" aria-label="Настройки профиля">⚙</Link>
          </section>
        </header>

        <div className="efHubScene">
          <nav className="efHubSideNav" aria-label="Разделы EvoFish">
            {SIDE_ACTIONS.map((item) => (
              <Link key={item.label} to={item.to} className="efHubSideButton">
                <span>{item.icon}</span>
                <b>{item.label}</b>
                {"notify" in item && item.notify ? <i aria-hidden="true" /> : null}
              </Link>
            ))}
          </nav>

          <section className="efHubCenter" aria-label="Главный запуск игры">
            <div className="efHubLabel">ОКЕАНСКАЯ СТАНЦИЯ</div>
            <h1>{mode.title}</h1>
            <div className="efHubSphere" aria-label="Текущий скин">
              <div className="efHubSphereGlass" />
              <div className="efHubSphereFish">
                <SkinPreview skin={heroSkin} form={heroForm} size="md" />
              </div>
              <span className="efHubBubble one" />
              <span className="efHubBubble two" />
              <span className="efHubBubble three" />
            </div>
            <p className="efHubModeText">{mode.subtitle} · {heroSkin.name}</p>
            <a className="efHubPlay" href={mode.href}>PLAY</a>

            <div className="efModeGrid" aria-label="Выбор режима">
              {(Object.keys(MODE_COPY) as ModeId[]).map((id) => (
                <article key={id} className={`efModeCard ${id === selectedMode ? "active" : ""} ${id === "next" ? "primary" : ""}`} onClick={() => setSelectedMode(id)}>
                  <div>
                    <b>{MODE_COPY[id].title}</b>
                    {id === "next" ? <small>РЕКОМЕНД.</small> : null}
                  </div>
                  <span>{MODE_COPY[id].subtitle}</span>
                  <a href={MODE_COPY[id].href} onClick={(event) => event.stopPropagation()}>{MODE_COPY[id].cta}</a>
                </article>
              ))}
            </div>
          </section>

          <aside className="efHubInfoCards" aria-label="Информация">
            <Link to="/game/season" className="efHubInfoCard"><span>Сезон</span><b>Neon Abyss</b><em>Цели и награды</em></Link>
            <Link to="/game/leaderboard" className="efHubInfoCard"><span>Лидерборд</span><b>TOP 100</b><em>Живое обновление</em></Link>
            <Link to="/game/progress" className="efHubInfoCard"><span>Достижения</span><b>{achievements}</b><em>Открыто сейчас</em></Link>
            <Link to="/game/skins" className="efHubInfoCard"><span>Скины</span><b>{ownedSkins}/{EVOFISH_SKINS.length}</b><em>Коллекция</em></Link>
          </aside>
        </div>

        <section className="efHubQuickGrid" aria-label="Быстрые действия">
          <Link to="/game/skins"><b>Скины</b><span>{ownedSkins} / {EVOFISH_SKINS.length}</span></Link>
          <Link to="/game/progress"><b>Задания</b><span>{completedQuests} выполнено</span></Link>
          <Link to="/game/season"><b>События</b><span>Сезон активен</span></Link>
          <Link to="/game/progress"><b>Инвентарь</b><span>{mutations} мутаций</span></Link>
        </section>

        <section className="efHubRename">
          <div>
            <span>Активный профиль</span>
            <b>{save.account.name}</b>
          </div>
          <input value={draftName} maxLength={18} placeholder="Введите никнейм" onChange={(event) => setDraftName(event.currentTarget.value)} />
          <button onClick={saveNickname}>{nameSaved ? "Сохранено" : "Сохранить ник"}</button>
        </section>

        {needsRepair ? <section className={`efPlayerSupport ${statusTone(doctor)}`}><div><span>Состояние сохранения</span><h2>{statusLabel(doctor)}</h2><p>{doctor.issues[0] || "Можно попробовать восстановить сохранение."}</p></div><div className="efPlayerSupportActions"><button onClick={() => refresh(repairEvoFishNextSave())}>Восстановить</button><button onClick={() => refresh(resetEvoFishNextRun())}>Новый забег</button></div></section> : null}

        <nav className="efHubBottomNav" aria-label="Основная навигация">
          <Link className="active" to="/game"><span>⌂</span><b>Лобби</b></Link>
          <Link to="/game/progress"><span>◇</span><b>Достижения</b></Link>
          <Link to="/game/account"><span>◉</span><b>Профиль</b></Link>
        </nav>
      </section>
      <style>{`
        .efBetaHome{min-height:100vh;min-height:100dvh;color:#eaf7ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;overflow-x:hidden}.efHubAtmosphere{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}.efHubAtmosphere:before{content:"";position:absolute;left:44%;top:-12%;width:20%;height:72%;background:linear-gradient(180deg,rgba(53,216,255,.28),transparent);filter:blur(18px);transform:perspective(400px) rotateX(18deg);opacity:.68}.efHubAtmosphere:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 72%,rgba(53,216,255,.14),transparent 28%),linear-gradient(90deg,transparent,rgba(255,255,255,.035),transparent);mix-blend-mode:screen}.efHubAtmosphere i{position:absolute;width:6px;height:6px;border-radius:999px;background:rgba(223,248,255,.42);box-shadow:0 0 18px rgba(53,216,255,.35);animation:efBubbleRise 11s linear infinite}.efHubAtmosphere i:nth-child(1){left:12%;bottom:-8%;animation-delay:-2s}.efHubAtmosphere i:nth-child(2){left:82%;bottom:-10%;width:9px;height:9px;animation-delay:-5s}.efHubAtmosphere i:nth-child(3){left:64%;bottom:-12%;width:4px;height:4px;animation-delay:-7s}.efHubAtmosphere i:nth-child(4){left:28%;bottom:-9%;width:8px;height:8px;animation-delay:-1s}.efHubAtmosphere i:nth-child(5){left:92%;bottom:-8%;animation-delay:-8s}.efBetaHomeShell{position:relative;z-index:1;width:min(1380px,calc(100vw - 32px));min-height:100dvh;margin:0 auto;padding:max(16px,env(safe-area-inset-top)) 0 calc(92px + env(safe-area-inset-bottom));display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;gap:14px}.efHubTop{display:grid;grid-template-columns:minmax(260px,420px) minmax(260px,1fr);align-items:start;gap:14px}.efHubProfile,.efHubWallet,.efHubCenter,.efHubSideNav,.efHubInfoCard,.efHubQuickGrid a,.efHubRename,.efPlayerSupport,.efHubBottomNav{border:1px solid rgba(88,210,255,.24);background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.035)),rgba(5,18,32,.52);box-shadow:0 24px 80px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(18px) saturate(1.14);-webkit-backdrop-filter:blur(18px) saturate(1.14)}.efHubProfile{min-width:0;border-radius:26px;padding:12px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px}.efAccountAvatar{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,rgba(255,255,255,.76),rgba(53,216,255,.28) 42%,rgba(7,27,45,.86));border:1px solid rgba(88,210,255,.38);box-shadow:0 0 28px rgba(53,216,255,.20);font-weight:1000;font-size:22px}.efHubProfileBody{min-width:0;display:grid;gap:4px}.efHubProfileBody span,.efHubInfoCard span,.efHubRename span,.efPlayerSupport span,.efHubLabel{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(150,232,255,.78);font-weight:1000}.efHubNameRow{display:flex;align-items:center;gap:10px;min-width:0}.efHubNameRow h2{margin:0;font-size:22px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efHubProfileLink{flex:0 0 auto;text-decoration:none;color:#eaf7ff;border:1px solid rgba(88,210,255,.22);border-radius:999px;padding:6px 9px;background:rgba(5,18,32,.44);font-size:11px;font-weight:900}.efHubProfileBody p{margin:0;color:rgba(234,247,255,.66);font-size:13px}.efHubProfileBody i{height:7px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efHubProfileBody em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#35d8ff,#f5b84b)}.efHubWallet{justify-self:end;border-radius:999px;padding:8px;display:flex;align-items:center;justify-content:flex-end;gap:8px}.efHubWallet span{min-height:42px;display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:0 12px;border:1px solid rgba(88,210,255,.18);background:rgba(5,18,32,.46);font-weight:1000}.efHubWallet b{font-size:18px;color:#dff8ff}.efHubWallet em{font-style:normal;color:rgba(234,247,255,.58);font-size:11px}.efHubSettings{width:42px;height:42px;display:grid;place-items:center;border-radius:9999px;border:1px solid rgba(88,210,255,.24);background:rgba(5,18,32,.58);color:#eaf7ff;text-decoration:none;font-size:17px}.efHubScene{display:grid;grid-template-columns:minmax(210px,260px) minmax(460px,1fr) minmax(230px,310px);gap:16px;align-items:center}.efHubSideNav{border-radius:28px;padding:10px;display:grid;gap:8px;align-self:center}.efHubSideButton{position:relative;min-height:48px;display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:10px;text-decoration:none;color:#eaf7ff;border-radius:16px;border:1px solid rgba(88,210,255,.14);background:rgba(5,18,32,.36);padding:7px 10px;font-weight:950}.efHubSideButton span{width:34px;height:34px;border-radius:13px;display:grid;place-items:center;background:rgba(53,216,255,.10);color:#9defff}.efHubSideButton b{font-size:13px}.efHubSideButton i{position:absolute;right:11px;top:10px;width:7px;height:7px;border-radius:999px;background:#ff4f73;box-shadow:0 0 14px rgba(255,79,115,.85)}.efHubCenter{position:relative;overflow:hidden;min-height:min(650px,calc(100dvh - 172px));border-radius:34px;padding:18px clamp(14px,3vw,34px);display:grid;justify-items:center;align-content:center;text-align:center;background:linear-gradient(180deg,rgba(3,18,32,.24),rgba(3,18,32,.16))!important}.efHubCenter:before{content:"";position:absolute;inset:10px;border-radius:28px;border:1px solid rgba(88,210,255,.12);box-shadow:inset 0 0 90px rgba(53,216,255,.10);pointer-events:none}.efHubLabel{position:relative}.efHubCenter h1{position:relative;margin:6px 0 0;font-size:clamp(34px,5vw,70px);line-height:.95;text-shadow:0 0 34px rgba(53,216,255,.24)}.efHubSphere{position:relative;width:clamp(300px,34vw,520px);aspect-ratio:1;margin:clamp(8px,2vh,16px) auto 8px;border-radius:999px;display:grid;place-items:center;animation:efSphereBreathe 5.8s ease-in-out infinite}.efHubSphereGlass{position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 36% 22%,rgba(255,255,255,.36),transparent 18%),radial-gradient(circle at 50% 58%,rgba(53,216,255,.18),transparent 44%),radial-gradient(circle at 50% 50%,rgba(3,18,32,.10),rgba(3,18,32,.32) 62%,rgba(53,216,255,.24));border:1px solid rgba(150,232,255,.48);box-shadow:inset 0 0 62px rgba(53,216,255,.18),inset 0 -22px 62px rgba(53,216,255,.20),0 0 55px rgba(53,216,255,.28),0 30px 90px rgba(0,0,0,.38)}.efHubSphereGlass:after{content:"";position:absolute;inset:9%;border-radius:inherit;background:linear-gradient(130deg,transparent 18%,rgba(255,255,255,.12),transparent 36%),repeating-radial-gradient(circle at 50% 72%,rgba(53,216,255,.12) 0 1px,transparent 1px 14px);opacity:.65;mix-blend-mode:screen}.efHubSphereFish{position:relative;z-index:1;width:76%;animation:efFishFloat 4.6s ease-in-out infinite;filter:drop-shadow(0 26px 34px rgba(0,0,0,.30)) drop-shadow(0 0 24px rgba(53,216,255,.18))}.efHubSphereFish .efSkinShowcase{background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important}.efHubBubble{position:absolute;z-index:2;border-radius:999px;background:rgba(223,248,255,.70);box-shadow:0 0 20px rgba(53,216,255,.34);opacity:.66}.efHubBubble.one{left:30%;top:25%;width:7px;height:7px}.efHubBubble.two{right:25%;top:36%;width:10px;height:10px}.efHubBubble.three{left:54%;bottom:24%;width:5px;height:5px}.efHubModeText{position:relative;margin:0 0 12px;color:rgba(234,247,255,.68);font-weight:850}.efHubPlay{position:relative;overflow:hidden;width:clamp(300px,36vw,520px);height:76px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(53,216,255,.58);background:linear-gradient(135deg,rgba(53,216,255,.34),rgba(7,27,45,.76) 54%,rgba(245,184,75,.14));box-shadow:0 0 38px rgba(53,216,255,.34),0 24px 70px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.18);color:#eaf7ff;text-decoration:none;font-weight:1000;font-size:25px;letter-spacing:.20em}.efHubPlay:after{content:"";position:absolute;inset:-50% auto -50% -70%;width:45%;transform:skewX(-18deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);animation:efButtonShine 4.3s ease-in-out infinite}.efModeGrid{position:relative;width:100%;display:grid;grid-template-columns:1.05fr .95fr;gap:10px;margin-top:14px}.efModeCard{cursor:pointer;text-align:left;min-height:118px;border-radius:22px;padding:13px;display:grid;gap:7px;border:1px solid rgba(88,210,255,.18);background:rgba(5,18,32,.42);box-shadow:0 16px 44px rgba(0,0,0,.22);transition:transform .16s,border-color .16s,box-shadow .16s}.efModeCard.active{border-color:rgba(53,216,255,.52);box-shadow:0 0 0 3px rgba(53,216,255,.08),0 18px 54px rgba(0,0,0,.30)}.efModeCard div{display:flex;align-items:center;justify-content:space-between;gap:8px}.efModeCard b{font-size:16px}.efModeCard small{border-radius:999px;padding:5px 7px;background:rgba(245,184,75,.18);color:#ffe2a4;font-size:10px;font-weight:1000}.efModeCard span{color:rgba(234,247,255,.62);font-size:13px}.efModeCard a{min-height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(88,210,255,.22);background:rgba(53,216,255,.11);color:#eaf7ff;text-decoration:none;font-weight:1000;font-size:12px}.efHubInfoCards{display:grid;gap:10px}.efHubInfoCard{min-height:104px;border-radius:22px;padding:14px;display:grid;align-content:center;gap:5px;color:#eaf7ff;text-decoration:none}.efHubInfoCard b{font-size:22px}.efHubInfoCard em{font-style:normal;color:rgba(234,247,255,.62);font-size:12px}.efHubQuickGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.efHubQuickGrid a{min-height:78px;border-radius:20px;padding:13px;text-decoration:none;color:#eaf7ff;display:grid;gap:4px}.efHubQuickGrid b{font-size:16px}.efHubQuickGrid span{color:rgba(234,247,255,.62);font-size:12px}.efHubRename{border-radius:22px;padding:10px;display:grid;grid-template-columns:minmax(170px,1fr) minmax(190px,320px) auto;gap:8px;align-items:center}.efHubRename div{display:grid;gap:2px}.efHubRename b{font-size:16px}.efHubRename input{min-height:42px;border-radius:15px;border:1px solid rgba(88,210,255,.22);background:rgba(2,9,21,.56);color:#eaf7ff;padding:0 12px;font-size:15px;font-weight:900;outline:none}.efHubRename button,.efPlayerSupportActions button{min-height:42px;border-radius:15px;border:1px solid rgba(88,210,255,.24);background:rgba(53,216,255,.12);color:#eaf7ff;padding:0 13px;font-weight:1000}.efPlayerSupport{border-radius:24px;padding:14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.efPlayerSupport h2,.efPlayerSupport p{margin:0}.efPlayerSupport p{color:rgba(234,247,255,.68)}.efPlayerSupportActions{display:flex;gap:8px}.efHubBottomNav{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));z-index:8;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));border-radius:999px;padding:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efHubBottomNav a{min-height:54px;border-radius:999px;display:grid;place-items:center;align-content:center;gap:2px;text-decoration:none;color:rgba(234,247,255,.62);font-size:11px;font-weight:950}.efHubBottomNav a.active{background:rgba(53,216,255,.14);color:#eaf7ff;box-shadow:inset 0 0 20px rgba(53,216,255,.10)}.efHubBottomNav span{font-size:16px}.efHubBottomNav b{font-size:11px}@media(min-width:1024px){.efHubQuickGrid{display:none}.efHubSideButton:hover,.efHubInfoCard:hover,.efModeCard:hover,.efHubQuickGrid a:hover{transform:translateY(-1px);border-color:rgba(53,216,255,.44);box-shadow:0 20px 62px rgba(0,0,0,.34),0 0 24px rgba(53,216,255,.12)}}@media(max-width:1023px){.efBetaHomeShell{width:min(100%,calc(100vw - 20px));display:grid}.efHubTop{grid-template-columns:1fr}.efHubWallet{justify-self:stretch;border-radius:24px;display:grid;grid-template-columns:1fr 1fr auto}.efHubWallet span{justify-content:center}.efHubScene{grid-template-columns:1fr}.efHubSideNav{order:-1;display:flex;overflow:auto;border-radius:24px;padding:8px;scrollbar-width:none}.efHubSideButton{min-width:128px}.efHubInfoCards{grid-template-columns:1fr 1fr}.efHubCenter{min-height:auto}.efHubSphere{width:clamp(260px,76vw,360px)}.efHubPlay{width:min(100%,430px);height:68px}.efModeGrid{grid-template-columns:1fr 1fr}.efHubQuickGrid{grid-template-columns:1fr 1fr}.efHubRename{grid-template-columns:1fr}}@media(max-width:640px){.efBetaHomeShell{padding-top:max(10px,env(safe-area-inset-top));gap:10px}.efHubProfile{border-radius:22px}.efHubWallet{grid-template-columns:1fr 1fr auto;padding:7px}.efHubWallet span{padding:0 8px;font-size:12px}.efHubWallet em{display:none}.efHubSettings{width:40px;height:40px}.efHubCenter{border-radius:28px;padding:15px 10px}.efHubCenter h1{font-size:36px}.efModeGrid,.efHubInfoCards,.efHubQuickGrid{grid-template-columns:1fr}.efModeCard{min-height:98px}.efHubRename{display:none}.efPlayerSupport{grid-template-columns:1fr}.efPlayerSupportActions{display:grid}.efHubBottomNav{width:calc(100vw - 18px)}}@keyframes efFishFloat{0%,100%{transform:translate3d(0,0,0) rotate(-1deg)}50%{transform:translate3d(0,-10px,0) rotate(1deg)}}@keyframes efSphereBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}@keyframes efBubbleRise{0%{transform:translateY(0);opacity:0}12%{opacity:.68}100%{transform:translateY(-110vh);opacity:0}}@media(prefers-reduced-motion:reduce){.efHubAtmosphere i,.efHubSphere,.efHubSphereFish,.efHubPlay:after{animation:none!important}}
      `}</style>
    </main>
  );
}
