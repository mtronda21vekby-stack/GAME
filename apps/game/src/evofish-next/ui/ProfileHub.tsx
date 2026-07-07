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
    <main className="efProfilesPage">
      <div className="efProfilesAtmosphere" aria-hidden="true"><i /><i /><i /><i /></div>
      <section className="efProfilesShell">
        <header className="efProfilesTop">
          <Link className="efProfilesBack" to="/game">‹ Лобби</Link>
          <div className="efProfilesTitle">
            <span>Центр игрока</span>
            <h1>Профили</h1>
          </div>
          <Link className="efProfilesGear" to="/game/account" aria-label="Профиль">⚙</Link>
        </header>

        <section className="efProfilesHero" aria-label="Активный профиль">
          <div className="efProfilesAvatar">{initial(save.account.name)}</div>
          <div className="efProfilesIdentity">
            <span>Активный профиль</span>
            <h2>{save.account.name}</h2>
            <p>LV {save.account.level} · XP {format(save.account.xp)} / {format(save.account.xpToNext)}</p>
            <i><em style={{ width: percent(save.account.xp, save.account.xpToNext) }} /></i>
          </div>
          <div className="efProfilesFishSphere" aria-label={`Скин ${activeSkin.name}`}>
            <div className="efProfilesFishGlass" />
            <SkinPreview skin={activeSkin} form={save.progress.form || "fish"} size="md" variant="sprite" />
          </div>
        </section>

        <section className="efProfilesStats" aria-label="Данные игрока">
          <article><span>Жемчуг</span><b>{format(save.economy.pearls)}</b></article>
          <article><span>Коралл</span><b>{format(save.economy.corals)}</b></article>
          <article><span>Скины</span><b>{ownedSkins}</b></article>
          <article><span>Мутации</span><b>{mutationLevels}</b></article>
          <article><span>Квесты</span><b>{completedQuests}</b></article>
          <article><span>Достижения</span><b>{achievements}</b></article>
        </section>

        <section className="efProfilesEditor" aria-label="Настройки активного профиля">
          <div>
            <span>Никнейм</span>
            <b>{activeProfile?.name || save.account.name}</b>
          </div>
          <input value={draftName} maxLength={18} placeholder="Имя игрока" onChange={(event) => setDraftName(event.currentTarget.value)} />
          <button onClick={saveName}>Сохранить</button>
        </section>

        <form className="efProfilesCreate" onSubmit={createProfile}>
          <div>
            <span>Новый профиль</span>
            <b>Отдельное сохранение</b>
          </div>
          <input value={newProfileName} maxLength={18} placeholder="Имя нового профиля" onChange={(event) => setNewProfileName(event.currentTarget.value)} />
          <button type="submit">Создать</button>
        </form>

        <section className="efProfilesGrid" aria-label="Все профили">
          {profiles.map((profile) => {
            const isActive = profile.id === activeId;
            return (
              <article key={profile.id} className={`efProfileCard ${isActive ? "active" : ""}`}>
                <div className="efProfileCardAvatar">{initial(profile.name)}</div>
                <div className="efProfileCardBody">
                  <span>{isActive ? "Сейчас активен" : "Сохранение"}</span>
                  <h3>{profile.name}</h3>
                  <p>LV {profile.accountLevel} · {skinName(profile)}</p>
                  <small>{format(profile.pearls)} жемчуг · {format(profile.corals)} коралл</small>
                </div>
                <div className="efProfileCardActions">
                  <button disabled={isActive} onClick={() => selectProfile(profile.id)}>{isActive ? "Активен" : "Выбрать"}</button>
                  <button disabled={profile.isDefault} onClick={() => removeProfile(profile.id)}>Удалить</button>
                </div>
              </article>
            );
          })}
        </section>

        {notice ? <div className="efProfilesNotice" role="status">{notice}</div> : null}

        <nav className="efProfilesBottomNav" aria-label="Основная навигация">
          <Link to="/game"><span>⌂</span><b>Лобби</b></Link>
          <Link to="/game/progress"><span>◇</span><b>Достижения</b></Link>
          <Link className="active" to="/game/account"><span>◉</span><b>Профиль</b></Link>
        </nav>
      </section>
      <style>{`
        .efProfilesPage{min-height:100vh;min-height:100dvh;color:#eaf7ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;overflow-x:hidden;background:#020915;background-image:linear-gradient(180deg,rgba(2,9,21,.10),rgba(2,9,21,.62)),url("/game/assets/lobby/lobby-bg-station-16x9.png");background-size:cover;background-position:center;background-attachment:fixed}.efProfilesAtmosphere{position:fixed;inset:0;pointer-events:none;overflow:hidden}.efProfilesAtmosphere:before{content:"";position:absolute;left:38%;top:-8%;width:24%;height:62%;background:linear-gradient(180deg,rgba(53,216,255,.28),transparent);filter:blur(20px);opacity:.78}.efProfilesAtmosphere:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 56%,rgba(53,216,255,.16),transparent 30%),radial-gradient(circle at 12% 92%,rgba(245,184,75,.08),transparent 18%),linear-gradient(180deg,rgba(2,9,21,.18),rgba(2,9,21,.62));mix-blend-mode:screen}.efProfilesAtmosphere i{position:absolute;width:7px;height:7px;border-radius:999px;background:rgba(223,248,255,.44);box-shadow:0 0 18px rgba(53,216,255,.36);animation:efProfileBubble 12s linear infinite}.efProfilesAtmosphere i:nth-child(1){left:10%;bottom:-8%;animation-delay:-2s}.efProfilesAtmosphere i:nth-child(2){left:74%;bottom:-10%;width:10px;height:10px;animation-delay:-6s}.efProfilesAtmosphere i:nth-child(3){left:90%;bottom:-8%;width:5px;height:5px;animation-delay:-4s}.efProfilesAtmosphere i:nth-child(4){left:34%;bottom:-9%;width:8px;height:8px;animation-delay:-8s}.efProfilesShell{position:relative;z-index:1;width:min(1180px,calc(100vw - 28px));margin:0 auto;padding:max(16px,env(safe-area-inset-top)) 0 calc(96px + env(safe-area-inset-bottom));display:grid;gap:14px}.efProfilesTop{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center}.efProfilesBack,.efProfilesGear,.efProfilesHero,.efProfilesStats article,.efProfilesEditor,.efProfilesCreate,.efProfileCard,.efProfilesBottomNav{border:1px solid rgba(88,210,255,.25);background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.035)),rgba(5,18,32,.68);box-shadow:0 24px 80px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(18px) saturate(1.14);-webkit-backdrop-filter:blur(18px) saturate(1.14)}.efProfilesBack{min-height:46px;border-radius:999px;padding:0 16px;display:inline-flex;align-items:center;color:#eaf7ff;text-decoration:none;font-weight:1000}.efProfilesTitle{text-align:center}.efProfilesTitle span,.efProfilesIdentity span,.efProfilesEditor span,.efProfilesCreate span,.efProfilesStats span,.efProfileCardBody span{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(150,232,255,.78);font-weight:1000}.efProfilesTitle h1{margin:2px 0 0;font-size:clamp(30px,4vw,54px);line-height:1}.efProfilesGear{width:46px;height:46px;border-radius:9999px;display:grid;place-items:center;color:#eaf7ff;text-decoration:none;font-size:18px}.efProfilesHero{position:relative;overflow:hidden;min-height:270px;border-radius:34px;padding:22px;display:grid;grid-template-columns:auto minmax(0,1fr) minmax(220px,340px);gap:22px;align-items:center}.efProfilesHero:before{content:"";position:absolute;inset:-20%;background:radial-gradient(circle at 74% 42%,rgba(53,216,255,.20),transparent 32%),radial-gradient(circle at 16% 12%,rgba(255,255,255,.10),transparent 28%);mix-blend-mode:screen;pointer-events:none}.efProfilesAvatar{position:relative;width:88px;height:88px;border-radius:999px;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,rgba(255,255,255,.78),rgba(53,216,255,.30) 44%,rgba(7,27,45,.88));border:1px solid rgba(88,210,255,.38);box-shadow:0 0 36px rgba(53,216,255,.22);font-size:34px;font-weight:1000}.efProfilesIdentity{position:relative;min-width:0;display:grid;gap:7px}.efProfilesIdentity h2{margin:0;font-size:clamp(34px,5vw,64px);line-height:.98;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efProfilesIdentity p{margin:0;color:rgba(234,247,255,.68);font-weight:800}.efProfilesIdentity i{width:min(460px,100%);height:8px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efProfilesIdentity em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#35d8ff,#f5b84b)}.efProfilesFishSphere{position:relative;aspect-ratio:1;border-radius:999px;display:grid;place-items:center}.efProfilesFishGlass{position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 34% 22%,rgba(255,255,255,.30),transparent 18%),radial-gradient(circle at 50% 58%,rgba(53,216,255,.18),transparent 44%),radial-gradient(circle at 50% 50%,rgba(3,18,32,.08),rgba(3,18,32,.28) 62%,rgba(53,216,255,.22));border:1px solid rgba(150,232,255,.48);box-shadow:inset 0 0 62px rgba(53,216,255,.18),0 0 55px rgba(53,216,255,.28),0 30px 90px rgba(0,0,0,.38);backdrop-filter:blur(10px) saturate(1.12)}.efProfilesFishSphere .efSkinPreview{position:relative;z-index:1;width:76%;background:transparent!important;border:0!important;box-shadow:none!important}.efProfilesStats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.efProfilesStats article{min-height:92px;border-radius:22px;padding:14px;display:grid;align-content:center;gap:5px}.efProfilesStats b{font-size:clamp(19px,2vw,28px)}.efProfilesEditor,.efProfilesCreate{border-radius:24px;padding:12px;display:grid;grid-template-columns:minmax(180px,1fr) minmax(190px,340px) auto;gap:10px;align-items:center}.efProfilesEditor div,.efProfilesCreate div{display:grid;gap:2px}.efProfilesEditor b,.efProfilesCreate b{font-size:16px}.efProfilesEditor input,.efProfilesCreate input{min-height:46px;border-radius:16px;border:1px solid rgba(88,210,255,.24);background:rgba(2,9,21,.58);color:#eaf7ff;padding:0 13px;font-size:15px;font-weight:900;outline:none}.efProfilesEditor button,.efProfilesCreate button,.efProfileCardActions button{min-height:46px;border-radius:16px;border:1px solid rgba(88,210,255,.26);background:rgba(53,216,255,.13);color:#eaf7ff;padding:0 15px;font-weight:1000;cursor:pointer}.efProfilesEditor button:hover,.efProfilesCreate button:hover,.efProfileCardActions button:hover:not(:disabled){border-color:rgba(53,216,255,.50);box-shadow:0 0 24px rgba(53,216,255,.14)}.efProfileCardActions button:disabled{opacity:.55;cursor:default}.efProfilesGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.efProfileCard{border-radius:26px;padding:14px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center}.efProfileCard.active{border-color:rgba(53,216,255,.56);box-shadow:0 0 0 3px rgba(53,216,255,.08),0 24px 80px rgba(0,0,0,.34),0 0 36px rgba(53,216,255,.13)}.efProfileCardAvatar{width:54px;height:54px;border-radius:999px;display:grid;place-items:center;background:rgba(53,216,255,.12);border:1px solid rgba(88,210,255,.28);font-size:22px;font-weight:1000}.efProfileCardBody{min-width:0;display:grid;gap:3px}.efProfileCardBody h3{margin:0;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efProfileCardBody p,.efProfileCardBody small{margin:0;color:rgba(234,247,255,.64)}.efProfileCardActions{display:flex;gap:8px}.efProfilesNotice{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));z-index:12;transform:translateX(-50%);border:1px solid rgba(88,210,255,.30);border-radius:999px;background:rgba(5,18,32,.86);box-shadow:0 20px 70px rgba(0,0,0,.38),0 0 32px rgba(53,216,255,.18);padding:12px 18px;font-weight:1000;backdrop-filter:blur(18px)}.efProfilesBottomNav{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));z-index:10;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));border-radius:999px;padding:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efProfilesBottomNav a{min-height:54px;border-radius:999px;display:grid;place-items:center;align-content:center;gap:2px;text-decoration:none;color:rgba(234,247,255,.62);font-size:11px;font-weight:950}.efProfilesBottomNav a.active{background:rgba(53,216,255,.14);color:#eaf7ff;box-shadow:inset 0 0 20px rgba(53,216,255,.10)}.efProfilesBottomNav span{font-size:16px}.efProfilesBottomNav b{font-size:11px}@media(max-width:900px){.efProfilesHero{grid-template-columns:auto minmax(0,1fr);align-items:center}.efProfilesFishSphere{grid-column:1/-1;width:min(360px,78vw);justify-self:center}.efProfilesStats{grid-template-columns:repeat(3,minmax(0,1fr))}.efProfilesEditor,.efProfilesCreate{grid-template-columns:1fr}.efProfilesGrid{grid-template-columns:1fr}.efProfileCard{grid-template-columns:auto minmax(0,1fr)}.efProfileCardActions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}}@media(max-width:560px){.efProfilesPage{background-position:center top}.efProfilesShell{width:min(100%,calc(100vw - 20px));gap:10px;padding-top:max(10px,env(safe-area-inset-top))}.efProfilesTop{grid-template-columns:auto 1fr auto}.efProfilesBack{min-height:42px;padding:0 12px;font-size:13px}.efProfilesGear{width:42px;height:42px}.efProfilesTitle h1{font-size:30px}.efProfilesHero{border-radius:28px;padding:14px;gap:12px}.efProfilesAvatar{width:64px;height:64px;font-size:26px}.efProfilesIdentity h2{font-size:34px}.efProfilesStats{grid-template-columns:repeat(2,minmax(0,1fr))}.efProfilesStats article{min-height:78px}.efProfilesEditor,.efProfilesCreate,.efProfileCard{border-radius:22px;padding:12px}.efProfileCardAvatar{width:48px;height:48px}.efProfilesBottomNav{width:calc(100vw - 18px)}}@keyframes efProfileBubble{0%{transform:translateY(0);opacity:0}12%{opacity:.7}100%{transform:translateY(-110vh);opacity:0}}@media(prefers-reduced-motion:reduce){.efProfilesAtmosphere i{animation:none!important}}
      `}</style>
      <style>{`
        .efProfilesPage{background-image:linear-gradient(180deg,rgba(2,9,21,.14),rgba(2,9,21,.66)),url("/game/assets/lobby/lobby-bg-station-16x9.png")!important;background-size:cover!important;background-position:center!important;background-attachment:fixed!important}
        .efProfilesHero,.efProfilesStats article,.efProfilesEditor,.efProfilesCreate,.efProfileCard{border-radius:8px!important;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025)),rgba(5,18,32,.62)!important}
        .efProfilesHero{min-height:300px!important}
        .efProfilesFishSphere{max-width:320px;justify-self:end}
        .efProfilesBottomNav{border-radius:999px!important}
        @media(max-width:900px){.efProfilesFishSphere{justify-self:center;max-width:none}.efProfilesHero{min-height:unset!important}}
      `}</style>
    </main>
  );
}
