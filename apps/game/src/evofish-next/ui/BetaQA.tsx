import React, { useMemo, useState } from "react";
import { Link } from "../../router";
import { NEXT_BETA_BALANCE_VERSION } from "../content/balance";
import { inspectEvoFishNextSave, loadEvoFishNextSave, repairEvoFishNextSave, resetEvoFishNextRun, type EvoFishSaveDoctorReport } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

type QAStatus = "todo" | "pass" | "fail";

type QACheck = {
  id: string;
  title: string;
  route: string;
  expected: string;
  critical?: boolean;
};

const QA_STATE_KEY = "evofish_beta_qa_state_v1";

const QA_CHECKS: QACheck[] = [
  { id: "home", title: "Beta Home открывается", route: "/game", expected: "Видны Play / Progress / Skins / Classic, статус Save Doctor и быстрый Repair.", critical: true },
  { id: "play", title: "Основной run запускается", route: "/game/play", expected: "Нет белого экрана, виден HUD beta.1, управление реагирует, игра сохраняется.", critical: true },
  { id: "settings", title: "Settings сохраняются", route: "/game/play", expected: "Язык RU/EN, Quality, Stick Fixed/Floating, размер и sensitivity сохраняются после перезахода.", critical: true },
  { id: "progress", title: "Progress + Balance Hub", route: "/game/progress", expected: "Видны Daily/Weekly/Story, достижения, pickups, мутации и Beta Balance Pass.", critical: true },
  { id: "repair", title: "Repair path работает", route: "/game/repair", expected: "Inspect / Repair Save / Reset Run / Copy Debug Save не ломают кошелёк и скины.", critical: true },
  { id: "skins", title: "Skin Lab работает", route: "/game/skins", expected: "Скины открываются по LV/Tier/Form, покупка/надевание работает, цены beta-баланса видны.", critical: true },
  { id: "classic", title: "Classic fallback доступен", route: "/game/classic", expected: "Старая версия открывается как fallback и не перехватывает основной beta-flow." },
  { id: "mobile", title: "Mobile viewport / touch", route: "/game/play", expected: "На телефоне нет скролла страницы, canvas занимает экран, bite/dash/stick не конфликтуют с браузером.", critical: true }
];

function readState(): Record<string, QAStatus> {
  try {
    const raw = localStorage.getItem(QA_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, QAStatus>;
  } catch {
    return {};
  }
}

function writeState(state: Record<string, QAStatus>) {
  try {
    localStorage.setItem(QA_STATE_KEY, JSON.stringify(state));
  } catch {
    // QA state is optional.
  }
}

function saveStatusLabel(report: EvoFishSaveDoctorReport) {
  if (report.status === "healthy") return "Save healthy";
  if (report.status === "needs_repair") return "Needs repair";
  if (report.status === "repaired") return "Repaired";
  if (report.status === "reset") return "Run reset";
  return "Save error";
}

function statusText(status: QAStatus) {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  return "TODO";
}

function browserChecks() {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  const canvas2d = Boolean(canvas?.getContext("2d"));
  const localStorageOk = (() => {
    try {
      localStorage.setItem("ef_beta_probe", "1");
      localStorage.removeItem("ef_beta_probe");
      return true;
    } catch {
      return false;
    }
  })();

  return [
    { label: "Canvas 2D", ok: canvas2d },
    { label: "localStorage", ok: localStorageOk },
    { label: "Touch API", ok: typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0) },
    { label: "Gamepad API", ok: typeof navigator !== "undefined" && "getGamepads" in navigator },
    { label: "VisualViewport", ok: typeof window !== "undefined" && Boolean(window.visualViewport) },
    { label: "Device Pixel Ratio", ok: typeof window !== "undefined" && Number.isFinite(window.devicePixelRatio) }
  ];
}

export function BetaQA() {
  const [qaState, setQaState] = useState<Record<string, QAStatus>>(() => readState());
  const [doctor, setDoctor] = useState(() => inspectEvoFishNextSave());
  const [copied, setCopied] = useState(false);
  const save = useMemo(() => loadEvoFishNextSave(), [doctor]);
  const checks = useMemo(() => browserChecks(), []);
  const passed = QA_CHECKS.filter((item) => qaState[item.id] === "pass").length;
  const failed = QA_CHECKS.filter((item) => qaState[item.id] === "fail").length;
  const todo = QA_CHECKS.length - passed - failed;
  const criticalFailed = QA_CHECKS.filter((item) => item.critical && qaState[item.id] === "fail").length;
  const readyForNextBuild = passed >= QA_CHECKS.length && failed === 0 && doctor.status !== "needs_repair" && doctor.status !== "error";

  const setStatus = (id: string, status: QAStatus) => {
    const next = { ...qaState, [id]: status };
    setQaState(next);
    writeState(next);
  };

  const resetQA = () => {
    setQaState({});
    writeState({});
    setCopied(false);
  };

  const repair = () => setDoctor(repairEvoFishNextSave());
  const restartRun = () => setDoctor(resetEvoFishNextRun());

  const buildReport = () => JSON.stringify({
    title: "EvoFish Beta QA Report",
    generatedAt: new Date().toISOString(),
    version: EVOFISH_NEXT_VERSION,
    balance: NEXT_BETA_BALANCE_VERSION,
    page: typeof window !== "undefined" ? window.location.pathname : "unknown",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    viewport: typeof window !== "undefined" ? { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio } : null,
    summary: { total: QA_CHECKS.length, passed, failed, todo, criticalFailed, readyForNextBuild },
    saveDoctor: { status: doctor.status, issues: doctor.issues, summary: doctor.summary },
    run: { level: save.progress.level, tier: save.progress.tier, form: save.progress.form, pearls: save.economy.pearls, corals: save.economy.corals },
    smoke: checks,
    checklist: QA_CHECKS.map((item) => ({ id: item.id, title: item.title, route: item.route, status: qaState[item.id] || "todo", critical: Boolean(item.critical), expected: item.expected }))
  }, null, 2);

  const copyReport = async () => {
    setCopied(false);
    try {
      await navigator.clipboard?.writeText(buildReport());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="efBetaQa">
      <section className="efQaShell">
        <header className="efQaHero">
          <div>
            <span>BLACKCROWN QA · {EVOFISH_NEXT_VERSION}</span>
            <h1>Beta QA Pass</h1>
            <p>Контрольный экран перед следующей beta-сборкой: маршруты, save, touch/stick, repair path, balance hub и fallback.</p>
          </div>
          <nav>
            <Link to="/game">BETA HOME</Link>
            <Link to="/game/play">PLAY</Link>
            <Link to="/game/progress">PROGRESS</Link>
          </nav>
        </header>

        <section className="efQaStats">
          <article><span>QA</span><b>{passed}/{QA_CHECKS.length}</b><small>{failed} fail · {todo} todo · {criticalFailed} critical</small></article>
          <article className={readyForNextBuild ? "good" : "warn"}><span>Status</span><b>{readyForNextBuild ? "READY" : "NOT READY"}</b><small>{readyForNextBuild ? "Можно двигать следующую сборку" : "Нужно закрыть checklist"}</small></article>
          <article><span>Save</span><b>{saveStatusLabel(doctor)}</b><small>{doctor.issues[0] || "Ошибок нет"}</small></article>
          <article><span>Balance</span><b>{NEXT_BETA_BALANCE_VERSION}</b><small>LV {save.progress.level} · Tier {save.progress.tier}</small></article>
        </section>

        <section className="efQaPanel">
          <div className="efQaPanelHead"><div><span>Browser smoke checks</span><h2>Среда запуска</h2></div><small>{new Date().toLocaleString("ru-RU")}</small></div>
          <div className="efSmokeGrid">
            {checks.map((check) => <article key={check.label} className={check.ok ? "ok" : "bad"}><b>{check.ok ? "OK" : "NO"}</b><span>{check.label}</span></article>)}
          </div>
        </section>

        <section className="efQaGrid">
          {QA_CHECKS.map((item) => {
            const status = qaState[item.id] || "todo";
            return (
              <article key={item.id} className={`efQaCard ${status} ${item.critical ? "critical" : ""}`}>
                <div className="efQaCardHead"><b>{item.title}</b><span>{statusText(status)}</span></div>
                <p>{item.expected}</p>
                <div className="efQaRouteRow"><code>{item.route}</code><Link to={item.route}>Open</Link></div>
                <div className="efQaButtons">
                  <button onClick={() => setStatus(item.id, "pass")}>PASS</button>
                  <button onClick={() => setStatus(item.id, "fail")}>FAIL</button>
                  <button onClick={() => setStatus(item.id, "todo")}>TODO</button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="efQaRepair">
          <div>
            <span>Recovery + report</span>
            <h2>Починка и отчёт</h2>
            <p>Скопируй QA Report после теста: туда попадут статусы, save doctor, browser smoke checks, версия, viewport и маршруты.</p>
          </div>
          <div>
            <button onClick={() => setDoctor(inspectEvoFishNextSave())}>Inspect Save</button>
            <button onClick={repair}>Repair Save</button>
            <button onClick={restartRun}>Restart Run</button>
            <button onClick={resetQA}>Reset QA Marks</button>
            <button onClick={copyReport}>{copied ? "Report Copied" : "Copy QA Report"}</button>
          </div>
        </section>
      </section>

      <style>{`
        .efBetaQa{min-height:100vh;background:#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efQaShell{width:min(1160px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efQaHero,.efQaStats article,.efQaPanel,.efQaCard,.efQaRepair{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efQaHero{border-radius:32px;padding:18px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;background:radial-gradient(circle at 12% 0,rgba(120,240,255,.18),transparent 38%),linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.035))}.efQaHero span,.efQaStats span,.efQaPanelHead span,.efQaRepair span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(231,242,255,.56);font-weight:1000}.efQaHero h1{margin:5px 0;font-size:38px;line-height:1}.efQaHero p,.efQaCard p,.efQaRepair p{margin:0;color:rgba(231,242,255,.68);line-height:1.45}.efQaHero nav{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.efQaHero a,.efQaRepair button,.efQaRouteRow a,.efQaButtons button{min-height:36px;border-radius:999px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.10);color:#e7f2ff;padding:0 12px;text-decoration:none;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.efQaStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.efQaStats article{border-radius:22px;padding:12px;display:grid;gap:5px}.efQaStats article.good{border-color:rgba(110,255,180,.22)}.efQaStats article.warn{border-color:rgba(255,220,120,.22)}.efQaStats b{font-size:18px}.efQaStats small,.efQaPanelHead small{color:rgba(231,242,255,.62);font-size:11px}.efQaPanel,.efQaRepair{border-radius:26px;padding:14px;display:grid;gap:12px}.efQaPanelHead{display:flex;justify-content:space-between;gap:12px}.efQaPanelHead h2,.efQaRepair h2{margin:0;font-size:20px}.efSmokeGrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.efSmokeGrid article{border-radius:16px;border:1px solid rgba(255,255,255,.09);background:rgba(2,16,27,.34);padding:9px;display:grid;gap:4px}.efSmokeGrid article.ok{border-color:rgba(110,255,180,.22)}.efSmokeGrid article.bad{border-color:rgba(255,120,120,.22)}.efSmokeGrid b{font-size:11px;color:#fff3a0}.efSmokeGrid span{font-size:11px;color:rgba(231,242,255,.68)}.efQaGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.efQaCard{border-radius:24px;padding:12px;display:grid;gap:10px}.efQaCard.critical{border-color:rgba(255,220,120,.15)}.efQaCard.pass{border-color:rgba(110,255,180,.28);background:rgba(110,255,180,.055)}.efQaCard.fail{border-color:rgba(255,120,120,.30);background:rgba(255,90,90,.055)}.efQaCardHead{display:flex;justify-content:space-between;gap:12px}.efQaCardHead b{font-size:15px}.efQaCardHead span{font-size:11px;color:#fff3a0;font-weight:1000}.efQaRouteRow{display:flex;gap:8px;align-items:center;justify-content:space-between}.efQaRouteRow code{font-size:12px;padding:7px 9px;border-radius:999px;background:rgba(2,16,27,.52);border:1px solid rgba(255,255,255,.08);color:rgba(231,242,255,.78)}.efQaButtons{display:flex;gap:7px;flex-wrap:wrap}.efQaButtons button:nth-child(1){border-color:rgba(110,255,180,.22)}.efQaButtons button:nth-child(2){border-color:rgba(255,120,120,.22)}.efQaRepair{grid-template-columns:minmax(0,1fr) auto;align-items:center}.efQaRepair div:last-child{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}@media(max-width:980px){.efSmokeGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.efQaStats,.efQaGrid{grid-template-columns:1fr 1fr}.efQaRepair{grid-template-columns:1fr}.efQaRepair div:last-child{justify-content:flex-start}}@media(max-width:620px){.efQaHero{display:grid}.efQaHero nav{justify-content:flex-start}.efQaStats,.efQaGrid,.efSmokeGrid{grid-template-columns:1fr}.efQaHero h1{font-size:30px}}
      `}</style>
    </main>
  );
}
