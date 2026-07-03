import React, { useMemo, useState } from "react";
import { Link } from "../../router";
import { EVOFISH_BETA_CHECKLIST, EVOFISH_BETA_CHECKLIST_VERSION, type BetaChecklistStatus } from "../content/betaChecklist";
import { inspectEvoFishNextSave, loadEvoFishNextSave } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

const CHECKLIST_STATE_KEY = "evofish_beta_release_checklist_v1";

function readChecklistState(): Record<string, BetaChecklistStatus> {
  try {
    const raw = localStorage.getItem(CHECKLIST_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BetaChecklistStatus>;
  } catch {
    return {};
  }
}

function writeChecklistState(state: Record<string, BetaChecklistStatus>) {
  try {
    localStorage.setItem(CHECKLIST_STATE_KEY, JSON.stringify(state));
  } catch {
    // local checklist state is optional
  }
}

function label(status: BetaChecklistStatus) {
  if (status === "done") return "DONE";
  if (status === "issue") return "ISSUE";
  return "TODO";
}

export function BetaChecklist() {
  const [state, setState] = useState<Record<string, BetaChecklistStatus>>(() => readChecklistState());
  const [copied, setCopied] = useState(false);
  const doctor = useMemo(() => inspectEvoFishNextSave(), []);
  const save = useMemo(() => loadEvoFishNextSave(), []);
  const total = EVOFISH_BETA_CHECKLIST.length;
  const done = EVOFISH_BETA_CHECKLIST.filter((item) => state[item.id] === "done").length;
  const issues = EVOFISH_BETA_CHECKLIST.filter((item) => state[item.id] === "issue").length;
  const p0Issues = EVOFISH_BETA_CHECKLIST.filter((item) => item.priority === "P0" && state[item.id] !== "done").length;
  const ready = done === total && issues === 0 && p0Issues === 0 && doctor.status !== "needs_repair" && doctor.status !== "error";

  const setItem = (id: string, status: BetaChecklistStatus) => {
    const next = { ...state, [id]: status };
    setState(next);
    writeChecklistState(next);
  };

  const reset = () => {
    setCopied(false);
    setState({});
    writeChecklistState({});
  };

  const report = () => JSON.stringify({
    title: "EvoFish Beta Release Checklist",
    generatedAt: new Date().toISOString(),
    version: EVOFISH_NEXT_VERSION,
    checklistVersion: EVOFISH_BETA_CHECKLIST_VERSION,
    summary: { total, done, issues, p0Open: p0Issues, ready },
    saveDoctor: { status: doctor.status, issues: doctor.issues, summary: doctor.summary },
    run: { level: save.progress.level, tier: save.progress.tier, form: save.progress.form, pearls: save.economy.pearls, corals: save.economy.corals },
    items: EVOFISH_BETA_CHECKLIST.map((item) => ({ ...item, status: state[item.id] || "todo" }))
  }, null, 2);

  const copyReport = async () => {
    setCopied(false);
    try {
      await navigator.clipboard?.writeText(report());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="efChecklist">
      <section className="efChecklistShell">
        <header className="efChecklistHero">
          <div>
            <span>BLACKCROWN BETA RELEASE · {EVOFISH_NEXT_VERSION}</span>
            <h1>Beta Checklist</h1>
            <p>Финальный контроль перед публичной beta-сборкой: маршруты, save, мобильное управление, settings, экономика, QA и report flow.</p>
          </div>
          <nav>
            <Link to="/game">HOME</Link>
            <Link to="/game/qa">QA</Link>
            <Link to="/game/report">REPORT</Link>
          </nav>
        </header>

        <section className="efChecklistStats">
          <article><span>Checklist</span><b>{done}/{total}</b><small>{issues} issue · {p0Issues} P0 open</small></article>
          <article className={ready ? "good" : "warn"}><span>Status</span><b>{ready ? "READY" : "NOT READY"}</b><small>{ready ? "Можно фиксировать beta release" : "Закрой P0/P1 перед релизом"}</small></article>
          <article><span>Save</span><b>{doctor.status.toUpperCase()}</b><small>{doctor.issues[0] || "Ошибок нет"}</small></article>
          <article><span>Version</span><b>{EVOFISH_BETA_CHECKLIST_VERSION}</b><small>LV {save.progress.level} · Tier {save.progress.tier}</small></article>
        </section>

        <section className="efChecklistGrid">
          {EVOFISH_BETA_CHECKLIST.map((item) => {
            const status = state[item.id] || "todo";
            return (
              <article key={item.id} className={`efChecklistCard ${status} ${item.priority.toLowerCase()}`}>
                <div className="efChecklistCardHead">
                  <b>{item.title}</b>
                  <span>{item.priority} · {label(status)}</span>
                </div>
                <p>{item.description}</p>
                <small>{item.gate}</small>
                <div className="efChecklistActions">
                  <button onClick={() => setItem(item.id, "done")}>DONE</button>
                  <button onClick={() => setItem(item.id, "issue")}>ISSUE</button>
                  <button onClick={() => setItem(item.id, "todo")}>TODO</button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="efChecklistFooter">
          <div><span>Release report</span><h2>Скопировать beta checklist</h2><p>После прохода checklist можно скопировать JSON-отчёт и сохранить в задачу/заметку перед деплоем.</p></div>
          <div>
            <button onClick={copyReport}>{copied ? "Copied" : "Copy Checklist Report"}</button>
            <button onClick={reset}>Reset Marks</button>
            <Link to="/game/play">Play</Link>
            <Link to="/game/progress">Progress</Link>
          </div>
        </section>
      </section>

      <style>{`
        .efChecklist{min-height:100vh;background:#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efChecklistShell{width:min(1160px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efChecklistHero,.efChecklistStats article,.efChecklistCard,.efChecklistFooter{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efChecklistHero{border-radius:32px;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start;background:radial-gradient(circle at 12% 0,rgba(120,240,255,.18),transparent 38%),linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.035))}.efChecklistHero span,.efChecklistStats span,.efChecklistFooter span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#fff3a0;font-weight:1000}.efChecklistHero h1{margin:5px 0;font-size:38px;line-height:1}.efChecklistHero p,.efChecklistCard p,.efChecklistFooter p{margin:0;color:rgba(231,242,255,.68);line-height:1.45}.efChecklistHero nav,.efChecklistFooter div:last-child,.efChecklistActions{display:flex;gap:8px;flex-wrap:wrap}.efChecklistHero a,.efChecklistFooter a,.efChecklistFooter button,.efChecklistActions button{min-height:36px;border-radius:999px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.10);color:#e7f2ff;padding:0 12px;text-decoration:none;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.efChecklistStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.efChecklistStats article{border-radius:22px;padding:12px;display:grid;gap:5px}.efChecklistStats article.good{border-color:rgba(110,255,180,.22)}.efChecklistStats article.warn{border-color:rgba(255,220,120,.22)}.efChecklistStats b{font-size:18px}.efChecklistStats small,.efChecklistCard small{color:rgba(231,242,255,.62);font-size:11px}.efChecklistGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.efChecklistCard{border-radius:24px;padding:12px;display:grid;gap:10px}.efChecklistCard.done{border-color:rgba(110,255,180,.28);background:rgba(110,255,180,.055)}.efChecklistCard.issue{border-color:rgba(255,120,120,.30);background:rgba(255,90,90,.055)}.efChecklistCard.p0{box-shadow:inset 0 0 0 1px rgba(255,220,120,.10),0 24px 80px rgba(0,0,0,.30)}.efChecklistCardHead{display:flex;justify-content:space-between;gap:12px}.efChecklistCardHead b{font-size:15px}.efChecklistCardHead span{font-size:11px;color:#fff3a0;font-weight:1000}.efChecklistActions button:nth-child(1){border-color:rgba(110,255,180,.22)}.efChecklistActions button:nth-child(2){border-color:rgba(255,120,120,.22)}.efChecklistFooter{border-radius:26px;padding:14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.efChecklistFooter h2{margin:0 0 4px;font-size:20px}@media(max-width:880px){.efChecklistHero,.efChecklistFooter{display:grid}.efChecklistStats,.efChecklistGrid{grid-template-columns:1fr 1fr}.efChecklistHero h1{font-size:30px}}@media(max-width:620px){.efChecklistStats,.efChecklistGrid{grid-template-columns:1fr}.efChecklistHero nav{justify-content:flex-start}}
      `}</style>
    </main>
  );
}
