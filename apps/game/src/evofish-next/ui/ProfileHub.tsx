import React, { useState } from "react";
import { Link } from "../../router";
import { createEvoFishProfile, deleteEvoFishProfile, loadEvoFishProfileIndex, renameEvoFishProfile, switchEvoFishProfile, syncActiveEvoFishProfile } from "../state/profileStoreCompat";

function fmt(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function profileInitial(name: string) {
  return String(name || "P").slice(0, 1).toUpperCase();
}

export function ProfileHub() {
  const [index, setIndex] = useState(() => syncActiveEvoFishProfile());
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const refresh = () => setIndex(loadEvoFishProfileIndex());

  const createProfile = () => {
    setIndex(createEvoFishProfile(newName || `Игрок ${index.profiles.length + 1}`));
    setNewName("");
  };

  const switchProfile = (profileId: string) => {
    setIndex(switchEvoFishProfile(profileId));
    window.setTimeout(() => window.location.assign("/game"), 80);
  };

  const startRename = (profileId: string, name: string) => {
    setRenameId(profileId);
    setRenameValue(name);
  };

  const saveRename = () => {
    if (!renameId) return;
    setIndex(renameEvoFishProfile(renameId, renameValue));
    setRenameId(null);
    setRenameValue("");
    refresh();
  };

  const removeProfile = (profileId: string) => {
    const profile = index.profiles.find((item) => item.id === profileId);
    if (!profile || index.profiles.length <= 1) return;
    if (!window.confirm(`Удалить профиль ${profile.name}?`)) return;
    setIndex(deleteEvoFishProfile(profileId));
  };

  return (
    <main className="efProfilesPage">
      <section className="efProfilesShell">
        <nav className="efProfilesNav">
          <Link to="/game">Главная</Link>
          <Link to="/game/play">Играть</Link>
          <Link to="/game/leaderboard">Лидеры</Link>
          <Link to="/game/skins">Скины</Link>
        </nav>

        <header className="efProfilesHero">
          <span>LOCAL PLAYER PROFILES</span>
          <h1>Профили игроков</h1>
          <p>Для одного устройства: каждый ребёнок играет под своим профилем, со своим прогрессом, скинами, валютой, мутациями и достижениями. Leaderboard остаётся общим и берёт ник активного профиля.</p>
        </header>

        <section className="efProfilesCreate">
          <div>
            <span>Новый профиль</span>
            <h2>Добавить ребёнка</h2>
          </div>
          <input value={newName} maxLength={18} placeholder="Имя профиля" onChange={(event) => setNewName(event.currentTarget.value)} />
          <button onClick={createProfile} disabled={index.profiles.length >= 8}>Создать</button>
        </section>

        <section className="efProfilesGrid">
          {index.profiles.map((profile) => {
            const active = profile.id === index.activeProfileId;
            return (
              <article key={profile.id} className={`efProfileCard ${active ? "active" : ""}`}>
                <div className="efProfileAvatar">{profileInitial(profile.name)}</div>
                <div className="efProfileMain">
                  {renameId === profile.id ? (
                    <div className="efProfileRename">
                      <input value={renameValue} maxLength={18} autoFocus onChange={(event) => setRenameValue(event.currentTarget.value)} />
                      <button onClick={saveRename}>OK</button>
                    </div>
                  ) : (
                    <>
                      <span>{active ? "Активный профиль" : "Профиль"}</span>
                      <h2>{profile.name}</h2>
                    </>
                  )}
                  <p>LV {profile.lastLevel} · Tier {profile.lastTier} · 🦪 {fmt(profile.lastPearls)} · 💎 {fmt(profile.lastCorals)}</p>
                </div>
                <div className="efProfileActions">
                  <button className="primary" onClick={() => switchProfile(profile.id)}>{active ? "Играть" : "Выбрать"}</button>
                  <button onClick={() => startRename(profile.id, profile.name)}>Имя</button>
                  <button disabled={index.profiles.length <= 1} onClick={() => removeProfile(profile.id)}>Удалить</button>
                </div>
              </article>
            );
          })}
        </section>
      </section>

      <style>{`
        .efProfilesPage{min-height:100vh;background:linear-gradient(180deg,#031827,#010711);color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efProfilesShell{width:min(1060px,calc(100vw - 28px));margin:0 auto;padding:max(20px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efProfilesNav{position:sticky;top:max(8px,env(safe-area-inset-top));z-index:5;display:flex;gap:8px;overflow:auto;padding:8px;border:1px solid rgba(150,230,255,.16);border-radius:999px;background:rgba(2,11,21,.68);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efProfilesNav a{white-space:nowrap;text-decoration:none;color:#e7f2ff;border:1px solid rgba(150,230,255,.14);background:rgba(255,255,255,.055);border-radius:999px;padding:9px 13px;font-weight:950;font-size:13px}.efProfilesHero,.efProfilesCreate,.efProfileCard{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.095),rgba(255,255,255,.038));box-shadow:0 24px 80px rgba(0,0,0,.34);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efProfilesHero{border-radius:34px;padding:24px;display:grid;gap:9px}.efProfilesHero span,.efProfilesCreate span,.efProfileMain span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:rgba(231,242,255,.58);font-weight:1000}.efProfilesHero h1{margin:0;font-size:42px;line-height:1}.efProfilesHero p,.efProfileMain p{margin:0;color:rgba(231,242,255,.72);line-height:1.45}.efProfilesCreate{border-radius:26px;padding:14px;display:grid;grid-template-columns:minmax(0,1fr) minmax(200px,.45fr) auto;gap:10px;align-items:center}.efProfilesCreate h2{margin:4px 0 0}.efProfilesCreate input,.efProfileRename input{min-height:44px;border-radius:15px;border:1px solid rgba(150,230,255,.18);background:rgba(2,16,27,.52);color:#e7f2ff;padding:0 12px;font-weight:900;outline:none}.efProfilesCreate button,.efProfileActions button,.efProfileRename button{min-height:42px;border-radius:15px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.12);color:#e7f2ff;padding:0 13px;font-weight:1000}.efProfilesCreate button:disabled,.efProfileActions button:disabled{opacity:.42}.efProfilesGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.efProfileCard{border-radius:28px;padding:14px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:start}.efProfileCard.active{border-color:rgba(255,220,120,.42);box-shadow:0 24px 90px rgba(255,220,120,.09)}.efProfileAvatar{width:54px;height:54px;border-radius:19px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(120,240,255,.30),rgba(255,220,120,.18));border:1px solid rgba(255,255,255,.16);font-size:22px;font-weight:1000}.efProfileMain{min-width:0}.efProfileMain h2{margin:4px 0;font-size:24px;line-height:1;overflow:hidden;text-overflow:ellipsis}.efProfileActions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.efProfileActions .primary{background:linear-gradient(135deg,rgba(120,240,255,.24),rgba(255,220,120,.12));border-color:rgba(120,240,255,.34)}.efProfileRename{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}@media(max-width:720px){.efProfilesCreate{grid-template-columns:1fr}.efProfilesHero h1{font-size:34px}.efProfileActions{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
