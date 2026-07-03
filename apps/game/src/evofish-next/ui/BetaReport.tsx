import React, { useMemo, useState } from "react";
import { Link } from "../../router";
import { NEXT_BETA_BALANCE_VERSION } from "../content/balance";
import { inspectEvoFishNextSave, loadEvoFishNextSave } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

type ReportKind = "crash" | "controls" | "save" | "balance" | "visual" | "other";

const REPORT_TEXT: Record<ReportKind, string> = {
  crash: "Краш / Game Error",
  controls: "Управление / стик / touch",
  save: "Save / progress / repair",
  balance: "Баланс / экономика",
  visual: "Визуал / UI / экран",
  other: "Другое"
};

function statusName(status: string) {
  if (status === "healthy") return "healthy";
  if (status === "needs_repair") return "needs repair";
  if (status === "repaired") return "repaired";
  if (status === "reset") return "reset";
  return "error";
}

function safeLocalStorage(key: string) {
  try {
    return localStorage.getItem(key) || "empty";
  } catch {
    return "blocked";
  }
}

export function BetaReport() {
  const [kind, setKind] = useState<ReportKind>("crash");
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);
  const doctor = useMemo(() => inspectEvoFishNextSave(), []);
  const save = useMemo(() => loadEvoFishNextSave(), []);

  const report = useMemo(() => {
    const viewport = typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio || 1}`
      : "unknown";
    const page = typeof window !== "undefined" ? window.location.pathname : "unknown";
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    return [
      `# EvoFish Beta Report`,
      `Type: ${REPORT_TEXT[kind]}`,
      `Version: ${EVOFISH_NEXT_VERSION}`,
      `Balance: ${NEXT_BETA_BALANCE_VERSION}`,
      `Route: ${page}`,
      `Viewport: ${viewport}`,
      `UserAgent: ${userAgent}`,
      `SaveDoctor: ${statusName(doctor.status)}`,
      `SaveIssues: ${doctor.issues.length ? doctor.issues.join(" | ") : "none"}`,
      `Run: LV ${save.progress.level}, Tier ${save.progress.tier}, Form ${save.progress.form}, Pearls ${save.economy.pearls}, Corals ${save.economy.corals}`,
      `SettingsKeyV5: ${safeLocalStorage("evofish_next_view_settings_v5")}`,
      `QAKey: ${safeLocalStorage("evofish_beta_qa_state_v1")}`,
      ``,
      `Details:`,
      details.trim() || "Опиши: что нажал, что ожидал, что произошло, повторяется ли ошибка."
    ].join("\n");
  }, [details, doctor.issues, doctor.status, kind, save.economy.corals, save.economy.pearls, save.progress.form, save.progress.level, save.progress.tier]);

  const copyReport = async () => {
    setCopied(false);
    try {
      await navigator.clipboard?.writeText(report);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="efReport">
      <section className="efReportShell">
        <header className="efReportHero">
          <div>
            <span>BLACKCROWN REPORT · {EVOFISH_NEXT_VERSION}</span>
            <h1>Report Bug</h1>
            <p>Собирает короткий технический отчёт: route, viewport, save status, run state, settings key и описание проблемы. Ничего никуда не отправляется — только копирование.</p>
          </div>
          <nav>
            <Link to="/game">HOME</Link>
            <Link to="/game/play">PLAY</Link>
            <Link to="/game/qa">QA</Link>
          </nav>
        </header>

        <section className="efReportGrid">
          <div className="efReportPanel">
            <b>Тип проблемы</b>
            <div className="efReportKinds">
              {(Object.keys(REPORT_TEXT) as ReportKind[]).map((item) => (
                <button key={item} className={kind === item ? "active" : ""} onClick={() => setKind(item)}>{REPORT_TEXT[item]}</button>
              ))}
            </div>
            <label>
              <span>Описание</span>
              <textarea value={details} onChange={(event) => setDetails(event.currentTarget.value)} placeholder="Например: открыл Settings → двигал Stick Size → получил Game Error..." />
            </label>
            <div className="efReportActions">
              <button onClick={copyReport}>{copied ? "Copied" : "Copy Report"}</button>
              <Link to="/game/qa">Open QA</Link>
              <Link to="/game/repair">Save Doctor</Link>
            </div>
          </div>

          <div className="efReportPanel preview">
            <b>Preview</b>
            <pre>{report}</pre>
          </div>
        </section>
      </section>

      <style>{`
        .efReport{min-height:100vh;background:#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efReportShell{width:min(1120px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efReportHero,.efReportPanel{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efReportHero{border-radius:32px;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.efReportHero span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#fff3a0;font-weight:1000}.efReportHero h1{margin:5px 0;font-size:38px;line-height:1}.efReportHero p{margin:0;color:rgba(231,242,255,.68);line-height:1.45}.efReportHero nav,.efReportActions{display:flex;gap:8px;flex-wrap:wrap}.efReportHero a,.efReportActions a,.efReportActions button,.efReportKinds button{min-height:38px;border-radius:999px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.10);color:#e7f2ff;padding:0 13px;text-decoration:none;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.efReportGrid{display:grid;grid-template-columns:.9fr 1.1fr;gap:14px;align-items:start}.efReportPanel{border-radius:26px;padding:14px;display:grid;gap:12px}.efReportPanel>b{font-size:18px}.efReportKinds{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efReportKinds button.active{border-color:rgba(255,220,120,.30);background:rgba(255,220,120,.12)}.efReportPanel label{display:grid;gap:7px}.efReportPanel label span{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(231,242,255,.56);font-weight:1000}.efReportPanel textarea{min-height:180px;resize:vertical;border-radius:18px;border:1px solid rgba(255,255,255,.10);background:rgba(2,16,27,.50);color:#e7f2ff;padding:12px;font:inherit;outline:none}.efReportPanel.preview pre{white-space:pre-wrap;word-break:break-word;max-height:68vh;overflow:auto;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(2,16,27,.48);padding:12px;color:rgba(231,242,255,.78);font-size:12px;line-height:1.45}@media(max-width:820px){.efReportHero{display:grid}.efReportGrid{grid-template-columns:1fr}.efReportKinds{grid-template-columns:1fr}.efReportHero h1{font-size:30px}}
      `}</style>
    </main>
  );
}
