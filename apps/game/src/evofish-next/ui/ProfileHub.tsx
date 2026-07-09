import React from "react";
import { userStorage } from "@blackcrown/core";
import { Link } from "../../router";
import { renameNextAccount } from "../content/account";
import { getMutationTotalLevel } from "../content/mutations";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { SkinPreview } from "../render/SkinPreview";
import {
  createEvoFishProfile,
  deleteEvoFishProfile,
  getActiveEvoFishProfile,
  listEvoFishProfiles,
  loadEvoFishNextSave,
  saveEvoFishNextSave,
  subscribeEvoFishNextSaveChanges,
  switchEvoFishProfile,
  type EvoFishLocalProfile
} from "../state/nextSaveStore";

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function percent(current: number, total: number) {
  return `${Math.max(0, Math.min(100, (current / Math.max(1, total)) * 100))}%`;
}

function initial(name: string) {
  return (name || "P").slice(0, 1).toUpperCase();
}

function skinName(profile: EvoFishLocalProfile) {
  return EVOFISH_SKIN_BY_ID[profile.equippedSkinId]?.name || "Стандарт";
}

export function ProfileHub() {
  const [profiles, setProfiles] = React.useState<EvoFishLocalProfile[]>(() => listEvoFishProfiles());
  const [activeProfile, setActiveProfile] = React.useState<EvoFishLocalProfile | undefined>(() => getActiveEvoFishProfile());
  const [save, setSave] = React.useState(() => loadEvoFishNextSave());
  const [draftName, setDraftName] = React.useState(() => loadEvoFishNextSave().account.name);
  const [newProfileName, setNewProfileName] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [activePanel, setActivePanel] = React.useState<"overview" | "saves">("overview");

  const activeId = activeProfile?.id || profiles[0]?.id || "main";
  const activeSkin = EVOFISH_SKIN_BY_ID[save.loadout.equippedSkinId] || EVOFISH_SKIN_BY_ID.default;
  const ownedSkins = Object.keys(save.loadout.ownedSkins || {}).length;
  const achievements = Object.keys(save.achievements.unlocked || {}).length;
  const completedQuests = Object.keys(save.quests.completed || {}).length;
  const mutationLevels = getMutationTotalLevel(save.mutations);

  const refresh = React.useCallback(() => {
    const nextProfiles = listEvoFishProfiles();
    const nextActive = getActiveEvoFishProfile();
    const nextSave = loadEvoFishNextSave();
    setProfiles(nextProfiles);
    setActiveProfile(nextActive);
    setSave(nextSave);
    setDraftName(nextSave.account.name);
    userStorage.setString("nickname", nextSave.account.name);
  }, []);

  React.useEffect(() => subscribeEvoFishNextSaveChanges(refresh), [refresh]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const saveName = () => {
    const fresh = loadEvoFishNextSave();
    const nextAccount = renameNextAccount(fresh.account, draftName);
    saveEvoFishNextSave({ ...fresh, account: nextAccount });
    userStorage.setString("nickname", nextAccount.name);
    refresh();
    flash("Профиль сохранен");
  };

  const createProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const profile = createEvoFishProfile(newProfileName);
    userStorage.setString("nickname", profile.name);
    setNewProfileName("");
    refresh();
    flash(`${profile.name} активен`);
  };

  const selectProfile = (profileId: string) => {
    const profile = switchEvoFishProfile(profileId);
    userStorage.setString("nickname", profile.name);
    refresh();
    flash("Профиль переключен");
  };

  const removeProfile = (profileId: string) => {
    if (!deleteEvoFishProfile(profileId)) return;
    refresh();
    flash("Профиль удален");
  };

  return (
    <main className="efProfileV2Page">
      <div className="efProfileV2Fx" aria-hidden="true"><i /><i /><i /></div>
      <section className="efProfileV2Shell">
        <header className="efProfileV2Top">
          <Link className="efProfileV2Back" to="/game" aria-label="Назад в лобби">‹</Link>
          <div className="efProfileV2Title">
            <span>Центр игрока</span>
            <h1>Профиль</h1>
          </div>
          <Link className="efProfileV2Gear" to="/game/settings" aria-label="Настройки игры">⚙</Link>
        </header>

        <section className="efProfileV2Hero" aria-label="Активный профиль">
          <div className="efProfileV2Avatar">{initial(save.account.name)}</div>
          <div className="efProfileV2Identity">
            <span>Активный профиль</span>
            <h2>{save.account.name}</h2>
            <p>LV {save.account.level} · XP {format(save.account.xp)} / {format(save.account.xpToNext)}</p>
            <div className="efProfileV2Xp"><i style={{ width: percent(save.account.xp, save.account.xpToNext) }} /></div>
          </div>
          <div className="efProfileV2Fish" aria-label={`Скин ${activeSkin.name}`}>
            <SkinPreview skin={activeSkin} form={save.progress.form || "fish"} size="sm" variant="sprite" />
          </div>
        </section>

        <section className="efProfileV2Stats" aria-label="Данные игрока">
          <StatCard label="Жемчуг" value={format(save.economy.pearls)} />
          <StatCard label="Коралл" value={format(save.economy.corals)} />
          <StatCard label="Скины" value={format(ownedSkins)} />
          <StatCard label="Мутации" value={format(mutationLevels)} />
          <StatCard label="Квесты" value={format(completedQuests)} />
          <StatCard label="Достижения" value={format(achievements)} />
        </section>

        <section className="efProfileV2Tabs" aria-label="Раздел профиля">
          <button className={activePanel === "overview" ? "active" : ""} type="button" onClick={() => setActivePanel("overview")}>Обзор</button>
          <button className={activePanel === "saves" ? "active" : ""} type="button" onClick={() => setActivePanel("saves")}>Сохранения</button>
        </section>

        {activePanel === "overview" ? (
          <section className="efProfileV2Panel" aria-label="Обзор профиля">
            <section className="efProfileV2Editor" aria-label="Настройки активного профиля">
              <div>
                <span>Никнейм</span>
                <strong>{activeProfile?.name || save.account.name}</strong>
              </div>
              <input value={draftName} maxLength={18} placeholder="Имя игрока" onChange={(event) => setDraftName(event.currentTarget.value)} />
              <button type="button" onClick={saveName}>Сохранить</button>
            </section>

            <section className="efProfileV2Actions" aria-label="Быстрые действия">
              <Link to="/game/skins"><span>Скины</span><b>{activeSkin.name}</b></Link>
              <Link to="/game/leaderboard"><span>Топ игроков</span><b>Рейтинг</b></Link>
              <Link to="/game/progress"><span>Прогресс</span><b>Достижения</b></Link>
            </section>
          </section>
        ) : (
          <section className="efProfileV2Panel" aria-label="Сохранения профиля">
            <form className="efProfileV2Create" onSubmit={createProfile}>
              <div>
                <span>Новый профиль</span>
                <strong>Отдельное сохранение</strong>
              </div>
              <input value={newProfileName} maxLength={18} placeholder="Имя нового профиля" onChange={(event) => setNewProfileName(event.currentTarget.value)} />
              <button type="submit">Создать</button>
            </form>

            <section className="efProfileV2Grid" aria-label="Все профили">
              {profiles.map((profile) => {
                const isActive = profile.id === activeId;
                return (
                  <article key={profile.id} className={`efProfileV2Save ${isActive ? "active" : ""}`}>
                    <div className="efProfileV2SaveAvatar">{initial(profile.name)}</div>
                    <div>
                      <span>{isActive ? "Сейчас активен" : "Сохранение"}</span>
                      <h3>{profile.name}</h3>
                      <p>LV {profile.accountLevel} · {skinName(profile)}</p>
                      <small>{format(profile.pearls)} жемчуг · {format(profile.corals)} коралл</small>
                    </div>
                    <div className="efProfileV2SaveActions">
                      <button disabled={isActive} type="button" onClick={() => selectProfile(profile.id)}>{isActive ? "Активен" : "Выбрать"}</button>
                      <button disabled={profile.isDefault} type="button" onClick={() => removeProfile(profile.id)}>Удалить</button>
                    </div>
                  </article>
                );
              })}
            </section>
          </section>
        )}

        {notice ? <div className="efProfileV2Notice" role="status">{notice}</div> : null}

        <nav className="efProfileV2BottomNav" aria-label="Основная навигация">
          <Link to="/game"><span>⌂</span><b>Лобби</b></Link>
          <Link to="/game/progress"><span>◇</span><b>Достижения</b></Link>
          <Link className="active" to="/game/account"><span>◉</span><b>Профиль</b></Link>
        </nav>
      </section>
      <ProfileV2Styles />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <article><span>{label}</span><b>{value}</b></article>;
}

function ProfileV2Styles() {
  return (
    <style>{`
      .efProfileV2Page{min-height:100vh;min-height:100dvh;overflow-x:hidden;color:#eaf7ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background:radial-gradient(ellipse at 50% 0%,rgba(53,216,255,.22),transparent 42%),linear-gradient(180deg,rgba(2,9,21,.18),rgba(2,9,21,.84)),url('/game/assets/lobby/lobby-bg-station-16x9.png') center/cover fixed,#020915}.efProfileV2Page,.efProfileV2Page *{box-sizing:border-box}.efProfileV2Fx{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}.efProfileV2Fx:before{content:"";position:absolute;left:38%;top:-10%;width:28%;height:70%;background:linear-gradient(180deg,rgba(53,216,255,.25),transparent);filter:blur(24px);opacity:.72}.efProfileV2Fx:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 56%,rgba(53,216,255,.14),transparent 34%),linear-gradient(90deg,rgba(2,9,21,.5),transparent 38%,transparent 62%,rgba(2,9,21,.5))}.efProfileV2Fx i{position:absolute;width:7px;height:7px;border-radius:999px;background:rgba(223,248,255,.42);box-shadow:0 0 18px rgba(53,216,255,.36);animation:efProfileV2Bubble 12s linear infinite}.efProfileV2Fx i:nth-child(1){left:12%;bottom:-8%;animation-delay:-2s}.efProfileV2Fx i:nth-child(2){left:75%;bottom:-10%;width:10px;height:10px;animation-delay:-6s}.efProfileV2Fx i:nth-child(3){left:90%;bottom:-8%;width:5px;height:5px;animation-delay:-4s}@keyframes efProfileV2Bubble{to{transform:translateY(-112vh);opacity:.08}}.efProfileV2Shell{position:relative;z-index:1;width:min(980px,calc(100vw - 18px));margin:0 auto;padding:max(12px,env(safe-area-inset-top)) 0 calc(128px + env(safe-area-inset-bottom));display:grid;gap:10px}.efProfileV2Top{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:8px}.efProfileV2Back,.efProfileV2Gear,.efProfileV2Hero,.efProfileV2Stats article,.efProfileV2Tabs,.efProfileV2Editor,.efProfileV2Create,.efProfileV2Actions a,.efProfileV2Save,.efProfileV2BottomNav{border:1px solid rgba(88,210,255,.25);background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.035)),rgba(5,18,32,.68);box-shadow:0 24px 80px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(18px) saturate(1.12);-webkit-backdrop-filter:blur(18px) saturate(1.12)}.efProfileV2Back,.efProfileV2Gear{width:44px;height:44px;border-radius:999px;display:grid;place-items:center;color:#eaf7ff;text-decoration:none;font-size:24px;font-weight:1000}.efProfileV2Gear{font-size:18px}.efProfileV2Title{text-align:center;min-width:0}.efProfileV2Title span,.efProfileV2Identity span,.efProfileV2Stats span,.efProfileV2Editor span,.efProfileV2Create span,.efProfileV2Actions span,.efProfileV2Save span{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(150,232,255,.78);font-weight:1000}.efProfileV2Title h1{margin:0;font-size:clamp(26px,7vw,42px);line-height:1}.efProfileV2Hero{min-height:150px;max-height:190px;border-radius:24px;padding:14px;display:grid;grid-template-columns:64px minmax(0,1fr) 118px;gap:12px;align-items:center;overflow:hidden;background:radial-gradient(circle at 84% 48%,rgba(53,216,255,.16),transparent 35%),linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025)),rgba(5,18,32,.66)}.efProfileV2Avatar{width:64px;height:64px;border-radius:999px;display:grid;place-items:center;background:radial-gradient(circle at 35% 26%,#fff 0 8%,#aaf3ff 25%,#35d8ff 62%,#0a668a 100%);color:#031524;font-size:26px;font-weight:1000;box-shadow:0 0 30px rgba(53,216,255,.32)}.efProfileV2Identity{min-width:0;display:grid;gap:5px}.efProfileV2Identity h2{margin:0;font-size:clamp(28px,7vw,44px);line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efProfileV2Identity p{margin:0;color:rgba(234,247,255,.72);font-size:13px;font-weight:850}.efProfileV2Xp{height:7px;border-radius:999px;background:rgba(234,247,255,.12);overflow:hidden}.efProfileV2Xp i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#35d8ff,#78ffd8,#f5b84b)}.efProfileV2Fish{width:112px;aspect-ratio:1;border-radius:999px;display:grid;place-items:center;justify-self:end;overflow:hidden;background:radial-gradient(circle at 34% 24%,rgba(255,255,255,.18),transparent 22%),radial-gradient(circle at 50% 64%,rgba(53,216,255,.24),rgba(53,216,255,.08) 58%,transparent 78%);border:1px solid rgba(88,210,255,.22);opacity:.82;pointer-events:none}.efProfileV2Fish .efSkinPreview{width:96px!important;max-width:96px!important;background:transparent!important;border:0!important;box-shadow:none!important}.efProfileV2Fish img,.efProfileV2Fish svg,.efProfileV2Fish .efSkinSpriteImg,.efProfileV2Fish .efSkinSpriteSvg{max-width:96px!important;pointer-events:none!important;user-select:none!important;-webkit-user-drag:none!important;-webkit-touch-callout:none!important}.efProfileV2Stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efProfileV2Stats article{min-height:74px;border-radius:18px;padding:11px 12px;display:grid;align-content:center;gap:6px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.022)),rgba(5,18,32,.58)}.efProfileV2Stats b{font-size:clamp(22px,6vw,34px);line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efProfileV2Tabs{justify-self:center;width:min(100%,330px);display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:5px;border-radius:999px}.efProfileV2Tabs button{min-height:38px;border:0;border-radius:999px;background:transparent;color:rgba(234,247,255,.62);font:inherit;font-size:12px;font-weight:1000;cursor:pointer}.efProfileV2Tabs button.active{color:#eaf7ff;background:rgba(53,216,255,.14);box-shadow:inset 0 0 20px rgba(53,216,255,.10),0 0 22px rgba(53,216,255,.12)}.efProfileV2Panel{display:grid;gap:8px}.efProfileV2Editor,.efProfileV2Create{border-radius:20px;padding:12px;display:grid;grid-template-columns:1fr;gap:10px;min-width:0}.efProfileV2Editor strong,.efProfileV2Create strong{display:block;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efProfileV2Editor input,.efProfileV2Create input{width:100%;min-height:48px;border-radius:16px;padding:0 14px;border:1px solid rgba(88,210,255,.18);background:rgba(2,9,21,.50);color:#eaf7ff;font:inherit;font-size:16px;font-weight:900}.efProfileV2Editor button,.efProfileV2Create button,.efProfileV2SaveActions button{min-height:48px;width:100%;border-radius:999px;border:1px solid rgba(88,210,255,.28);background:linear-gradient(90deg,rgba(53,216,255,.24),rgba(120,255,216,.14));color:#eaf7ff;font:inherit;font-weight:1000;cursor:pointer}.efProfileV2Actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.efProfileV2Actions a{min-height:70px;border-radius:18px;padding:12px;color:#eaf7ff;text-decoration:none;display:grid;align-content:center;gap:4px}.efProfileV2Actions b{font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efProfileV2Grid{display:grid;gap:8px}.efProfileV2Save{border-radius:20px;padding:12px;display:grid;grid-template-columns:48px minmax(0,1fr);gap:10px}.efProfileV2Save.active{border-color:rgba(101,232,255,.62);box-shadow:0 0 32px rgba(53,216,255,.14),0 24px 80px rgba(0,0,0,.34)}.efProfileV2SaveAvatar{width:48px;height:48px;border-radius:999px;display:grid;place-items:center;background:rgba(53,216,255,.16);font-weight:1000}.efProfileV2Save h3{margin:0;font-size:20px}.efProfileV2Save p,.efProfileV2Save small{margin:2px 0 0;color:rgba(234,247,255,.62);font-weight:850}.efProfileV2SaveActions{grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr;gap:8px}.efProfileV2SaveActions button:disabled{opacity:.55}.efProfileV2BottomNav{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(560px,calc(100vw - 20px));z-index:80;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:6px;border-radius:999px}.efProfileV2BottomNav a{min-width:0;min-height:48px;border-radius:999px;display:grid;place-items:center;color:rgba(234,247,255,.62);text-decoration:none;font-weight:1000}.efProfileV2BottomNav a.active{color:#eaf7ff;background:rgba(53,216,255,.14);box-shadow:inset 0 0 22px rgba(53,216,255,.12),0 0 24px rgba(53,216,255,.14)}.efProfileV2BottomNav span{font-size:16px}.efProfileV2BottomNav b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efProfileV2Notice{position:fixed;left:50%;bottom:calc(86px + env(safe-area-inset-bottom));z-index:90;transform:translateX(-50%);border-radius:999px;padding:11px 15px;background:rgba(5,18,32,.90);border:1px solid rgba(101,232,255,.42);box-shadow:0 16px 46px rgba(0,0,0,.34);font-weight:1000}@media(min-width:820px){.efProfileV2Shell{width:min(1040px,calc(100vw - 24px))}.efProfileV2Stats{grid-template-columns:repeat(3,minmax(0,1fr))}.efProfileV2Editor{grid-template-columns:minmax(150px,.7fr) minmax(250px,1fr) 150px}.efProfileV2Grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.efProfileV2Shell{width:min(100%,calc(100vw - 14px))}.efProfileV2Hero{grid-template-columns:58px minmax(0,1fr);min-height:142px}.efProfileV2Fish{display:none}.efProfileV2Identity h2{font-size:34px}.efProfileV2Stats article{min-height:70px;padding:10px}.efProfileV2Actions{grid-template-columns:1fr}.efProfileV2BottomNav a{min-height:44px}}
    `}</style>
  );
}

export default ProfileHub;
