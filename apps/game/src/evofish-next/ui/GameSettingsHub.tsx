import React from "react";
import { navigate } from "../../router";
import {
  DEFAULT_VIEW_SETTINGS,
  loadViewSettings,
  resetViewSettings,
  saveViewSettings,
  setTutorialDone,
  type ControlMode,
  type LanguageMode,
  type StickMode,
  type ViewSettings
} from "../state/viewSettingsStore";

function pct(value: number, min: number, max: number) {
  return `${Math.max(0, Math.min(100, ((value - min) / Math.max(0.001, max - min)) * 100))}%`;
}

function qualityLabel(value: ViewSettings["quality"]) {
  if (value === "low") return "Низкое";
  if (value === "high") return "Высокое";
  return "Баланс";
}

function controlLabel(value: ControlMode) {
  if (value === "joystick") return "Стик";
  if (value === "gamepad") return "Геймпад";
  return "Касание";
}

export function GameSettingsHub() {
  const [settings, setSettings] = React.useState<ViewSettings>(() => loadViewSettings());
  const [notice, setNotice] = React.useState("");

  const update = (next: ViewSettings) => {
    setSettings(next);
    saveViewSettings(next);
  };

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const setControlMode = (controlMode: ControlMode) => update({ ...settings, controlMode });
  const setQuality = (quality: ViewSettings["quality"]) => update({ ...settings, quality });
  const setLanguage = (language: LanguageMode) => update({ ...settings, language });
  const setStickMode = (stickMode: StickMode) => update({ ...settings, stickMode });

  const resetAll = () => {
    setSettings(resetViewSettings());
    flash("Настройки сброшены");
  };

  const restartTutorial = () => {
    setTutorialDone(false);
    flash("Обучение появится при запуске");
  };

  return (
    <main className="efSettingsPage">
      <div className="efSettingsAtmosphere" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <section className="efSettingsShell">
        <header className="efSettingsTop">
          <button className="efSettingsBack" type="button" onClick={() => navigate("/game")}>‹ Лобби</button>
          <div className="efSettingsTitle">
            <span>Система EvoFish Next</span>
            <h1>Настройки игры</h1>
          </div>
          <button className="efSettingsPlay" type="button" onClick={() => navigate("/game/play")}>PLAY</button>
        </header>

        <section className="efSettingsHero" aria-label="Текущая конфигурация">
          <div>
            <span>Активный пресет</span>
            <h2>{controlLabel(settings.controlMode)} · {qualityLabel(settings.quality)}</h2>
            <p>Эти параметры применятся к EvoFish Next сразу при следующем запуске.</p>
          </div>
          <div className="efSettingsDial">
            <b>{Math.round(settings.zoom * 100)}%</b>
            <span>{settings.autoZoom ? "AUTO ZOOM" : "MANUAL"}</span>
          </div>
        </section>

        <section className="efSettingsGrid">
          <article className="efSettingsCard large">
            <div className="efSettingsCardHead">
              <span>Управление</span>
              <b>{controlLabel(settings.controlMode)}</b>
            </div>
            <div className="efSegmented">
              <button className={settings.controlMode === "pointer" ? "active" : ""} type="button" onClick={() => setControlMode("pointer")}>Касание</button>
              <button className={settings.controlMode === "joystick" ? "active" : ""} type="button" onClick={() => setControlMode("joystick")}>Стик</button>
              <button className={settings.controlMode === "gamepad" ? "active" : ""} type="button" onClick={() => setControlMode("gamepad")}>Геймпад</button>
            </div>
            <p>На телефоне лучше использовать стик. Для браузера на компьютере подойдет касание или мышь.</p>
          </article>

          <article className="efSettingsCard">
            <div className="efSettingsCardHead">
              <span>Качество</span>
              <b>{qualityLabel(settings.quality)}</b>
            </div>
            <div className="efSegmented">
              <button className={settings.quality === "low" ? "active" : ""} type="button" onClick={() => setQuality("low")}>Low</button>
              <button className={settings.quality === "balanced" ? "active" : ""} type="button" onClick={() => setQuality("balanced")}>Balance</button>
              <button className={settings.quality === "high" ? "active" : ""} type="button" onClick={() => setQuality("high")}>High</button>
            </div>
            <p>Низкое качество снижает визуальную нагрузку. Высокое оставляет максимум воды, свечения и частиц.</p>
          </article>

          <article className="efSettingsCard">
            <div className="efSettingsCardHead">
              <span>Язык</span>
              <b>{settings.language === "ru" ? "Русский" : "English"}</b>
            </div>
            <div className="efSegmented two">
              <button className={settings.language === "ru" ? "active" : ""} type="button" onClick={() => setLanguage("ru")}>Русский</button>
              <button className={settings.language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>English</button>
            </div>
            <p>Меняет язык интерфейса, обучения и внутренних игровых панелей.</p>
          </article>

          <article className="efSettingsCard large">
            <div className="efSettingsCardHead">
              <span>Камера</span>
              <b>{settings.autoZoom ? "Авто-зум" : "Ручной зум"}</b>
            </div>
            <button className={`efSettingsToggle ${settings.autoZoom ? "active" : ""}`} type="button" onClick={() => update({ ...settings, autoZoom: !settings.autoZoom })}>
              <span>{settings.autoZoom ? "Включен" : "Выключен"}</span>
              <i />
            </button>
            <label className="efSettingsRange">
              <span>Ручной зум: {Math.round(settings.zoom * 100)}%</span>
              <input
                type="range"
                min="0.56"
                max="1.18"
                step="0.02"
                value={settings.zoom}
                onChange={(event) => update({ ...settings, zoom: Number(event.currentTarget.value), autoZoom: false })}
                style={{ backgroundSize: `${pct(settings.zoom, 0.56, 1.18)} 100%` }}
              />
            </label>
          </article>

          <article className="efSettingsCard large">
            <div className="efSettingsCardHead">
              <span>Стик</span>
              <b>{settings.stickMode === "fixed" ? "Фиксированный" : "Плавающий"}</b>
            </div>
            <div className="efSegmented two">
              <button className={settings.stickMode === "fixed" ? "active" : ""} type="button" onClick={() => setStickMode("fixed")}>Фиксированный</button>
              <button className={settings.stickMode === "floating" ? "active" : ""} type="button" onClick={() => setStickMode("floating")}>Плавающий</button>
            </div>
            <label className="efSettingsRange">
              <span>Размер: {Math.round(settings.stickSize)}px</span>
              <input
                type="range"
                min="76"
                max="132"
                step="2"
                value={settings.stickSize}
                onChange={(event) => update({ ...settings, stickSize: Number(event.currentTarget.value) })}
                style={{ backgroundSize: `${pct(settings.stickSize, 76, 132)} 100%` }}
              />
            </label>
            <label className="efSettingsRange">
              <span>Чувствительность: {settings.stickSensitivity.toFixed(2)}x</span>
              <input
                type="range"
                min="0.65"
                max="1.55"
                step="0.05"
                value={settings.stickSensitivity}
                onChange={(event) => update({ ...settings, stickSensitivity: Number(event.currentTarget.value) })}
                style={{ backgroundSize: `${pct(settings.stickSensitivity, 0.65, 1.55)} 100%` }}
              />
            </label>
          </article>

          <article className="efSettingsCard">
            <div className="efSettingsCardHead">
              <span>Обучение</span>
              <b>Подсказки</b>
            </div>
            <button className="efSettingsAction" type="button" onClick={restartTutorial}>Повторить обучение</button>
            <button className="efSettingsAction ghost" type="button" onClick={resetAll}>Сбросить настройки</button>
            <p>Сброс вернет стандарт: {controlLabel(DEFAULT_VIEW_SETTINGS.controlMode)}, {qualityLabel(DEFAULT_VIEW_SETTINGS.quality)}, авто-зум.</p>
          </article>
        </section>

        <nav className="efSettingsBottomNav" aria-label="Основная навигация">
          <button type="button" onClick={() => navigate("/game")}><span>⌂</span><b>Лобби</b></button>
          <button type="button" onClick={() => navigate("/game/progress")}><span>◇</span><b>Достижения</b></button>
          <button type="button" onClick={() => navigate("/game/account")}><span>◉</span><b>Профиль</b></button>
        </nav>
      </section>
      {notice ? <div className="efSettingsNotice" role="status">{notice}</div> : null}
      <style>{`
        .efSettingsPage{min-height:100vh;min-height:100dvh;color:#eaf7ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;overflow-x:hidden;background:#020915;background-image:linear-gradient(180deg,rgba(2,9,21,.12),rgba(2,9,21,.72)),url("/game/assets/lobby/lobby-bg-station-16x9.png");background-size:cover;background-position:center;background-attachment:fixed}.efSettingsPage:before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 18%,rgba(53,216,255,.20),transparent 36%),linear-gradient(90deg,rgba(2,9,21,.44),transparent 30%,transparent 70%,rgba(2,9,21,.44));z-index:0}.efSettingsAtmosphere{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}.efSettingsAtmosphere:before{content:"";position:absolute;left:44%;top:-14%;width:20%;height:70%;background:linear-gradient(180deg,rgba(53,216,255,.30),transparent);filter:blur(20px);opacity:.72}.efSettingsAtmosphere i{position:absolute;width:7px;height:7px;border-radius:999px;background:rgba(223,248,255,.42);box-shadow:0 0 18px rgba(53,216,255,.35);animation:efSettingsBubble 12s linear infinite}.efSettingsAtmosphere i:nth-child(1){left:11%;bottom:-8%;animation-delay:-2s}.efSettingsAtmosphere i:nth-child(2){left:82%;bottom:-10%;width:10px;height:10px;animation-delay:-6s}.efSettingsAtmosphere i:nth-child(3){left:55%;bottom:-12%;width:5px;height:5px;animation-delay:-1s}.efSettingsAtmosphere i:nth-child(4){left:91%;bottom:-9%;animation-delay:-8s}.efSettingsAtmosphere i:nth-child(5){left:30%;bottom:-9%;width:8px;height:8px;animation-delay:-4s}.efSettingsShell{position:relative;z-index:1;width:min(1180px,calc(100vw - 28px));margin:0 auto;padding:max(16px,env(safe-area-inset-top)) 0 calc(96px + env(safe-area-inset-bottom));display:grid;gap:14px}.efSettingsTop{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center}.efSettingsBack,.efSettingsPlay,.efSettingsHero,.efSettingsCard,.efSettingsBottomNav{border:1px solid rgba(88,210,255,.25);background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025)),rgba(5,18,32,.66);box-shadow:0 24px 80px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(18px) saturate(1.14);-webkit-backdrop-filter:blur(18px) saturate(1.14)}.efSettingsBack,.efSettingsPlay{min-height:46px;border-radius:999px;padding:0 16px;color:#eaf7ff;font:inherit;font-weight:1000;cursor:pointer}.efSettingsPlay{min-width:112px;background:linear-gradient(135deg,rgba(53,216,255,.30),rgba(7,27,45,.76))}.efSettingsTitle{text-align:center;min-width:0}.efSettingsTitle span,.efSettingsHero span,.efSettingsCardHead span{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(150,232,255,.78);font-weight:1000}.efSettingsTitle h1{margin:2px 0 0;font-size:clamp(30px,5vw,58px);line-height:1}.efSettingsHero{border-radius:8px;padding:22px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center}.efSettingsHero h2{margin:4px 0;font-size:clamp(32px,5vw,62px);line-height:1}.efSettingsHero p,.efSettingsCard p{margin:0;color:rgba(234,247,255,.66);line-height:1.45}.efSettingsDial{width:132px;height:132px;border-radius:999px;display:grid;place-items:center;align-content:center;border:1px solid rgba(150,232,255,.44);background:radial-gradient(circle at 35% 22%,rgba(255,255,255,.24),transparent 22%),radial-gradient(circle,rgba(53,216,255,.18),rgba(5,18,32,.72));box-shadow:0 0 46px rgba(53,216,255,.24),inset 0 0 38px rgba(53,216,255,.14)}.efSettingsDial b{font-size:32px}.efSettingsDial span{font-size:10px;color:rgba(234,247,255,.60)}.efSettingsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.efSettingsCard{border-radius:8px;padding:14px;display:grid;gap:12px;align-content:start}.efSettingsCard.large{grid-column:span 2}.efSettingsCardHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.efSettingsCardHead b{font-size:20px}.efSegmented{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.efSegmented.two{grid-template-columns:repeat(2,minmax(0,1fr))}.efSegmented button,.efSettingsAction,.efSettingsToggle{min-height:44px;border-radius:999px;border:1px solid rgba(88,210,255,.18);background:rgba(5,18,32,.50);color:#eaf7ff;font:inherit;font-weight:1000;cursor:pointer}.efSegmented button.active,.efSettingsToggle.active{border-color:rgba(53,216,255,.56);background:rgba(53,216,255,.16);box-shadow:inset 0 0 24px rgba(53,216,255,.10),0 0 24px rgba(53,216,255,.10)}.efSettingsToggle{display:flex;align-items:center;justify-content:space-between;padding:0 8px 0 16px}.efSettingsToggle i{width:30px;height:30px;border-radius:999px;background:rgba(234,247,255,.36);box-shadow:inset 0 0 12px rgba(255,255,255,.18)}.efSettingsToggle.active i{background:#35d8ff;box-shadow:0 0 18px rgba(53,216,255,.60)}.efSettingsRange{display:grid;gap:8px;color:rgba(234,247,255,.82);font-weight:900}.efSettingsRange input{width:100%;height:12px;border-radius:999px;appearance:none;background:linear-gradient(90deg,#35d8ff,#35d8ff) 0/50% 100% no-repeat,rgba(255,255,255,.10);outline:none}.efSettingsRange input::-webkit-slider-thumb{appearance:none;width:26px;height:26px;border-radius:999px;border:2px solid rgba(234,247,255,.90);background:#061827;box-shadow:0 0 20px rgba(53,216,255,.45)}.efSettingsAction{border-radius:16px;background:rgba(53,216,255,.14)}.efSettingsAction.ghost{background:rgba(5,18,32,.46)}.efSettingsBottomNav{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));z-index:10;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));border-radius:999px;padding:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.efSettingsBottomNav button{min-height:54px;border:0;border-radius:999px;background:transparent;display:grid;place-items:center;align-content:center;gap:2px;color:rgba(234,247,255,.62);font:inherit;font-size:11px;font-weight:950;cursor:pointer}.efSettingsBottomNav button span{font-size:16px}.efSettingsBottomNav button b{font-size:11px}.efSettingsNotice{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));z-index:12;transform:translateX(-50%);border:1px solid rgba(88,210,255,.30);border-radius:999px;background:rgba(5,18,32,.86);box-shadow:0 20px 70px rgba(0,0,0,.38),0 0 32px rgba(53,216,255,.18);padding:12px 18px;font-weight:1000;backdrop-filter:blur(18px)}@media(max-width:900px){.efSettingsGrid{grid-template-columns:1fr}.efSettingsCard.large{grid-column:auto}.efSettingsHero{grid-template-columns:1fr}.efSettingsDial{width:106px;height:106px}.efSettingsDial b{font-size:27px}}@media(max-width:560px){.efSettingsShell{width:min(100%,calc(100vw - 20px));gap:10px;padding-top:max(10px,env(safe-area-inset-top))}.efSettingsTop{grid-template-columns:auto minmax(0,1fr) auto}.efSettingsBack,.efSettingsPlay{min-height:42px;padding:0 11px;font-size:13px}.efSettingsPlay{min-width:78px}.efSettingsTitle h1{font-size:30px}.efSettingsHero,.efSettingsCard{padding:12px}.efSettingsHero h2{font-size:34px}.efSegmented{gap:6px}.efSegmented button{font-size:12px;padding:0 8px}.efSettingsBottomNav{width:calc(100vw - 18px)}}@keyframes efSettingsBubble{0%{transform:translateY(0);opacity:0}12%{opacity:.68}100%{transform:translateY(-110vh);opacity:0}}@media(prefers-reduced-motion:reduce){.efSettingsAtmosphere i{animation:none!important}}
      `}</style>
    </main>
  );
}
