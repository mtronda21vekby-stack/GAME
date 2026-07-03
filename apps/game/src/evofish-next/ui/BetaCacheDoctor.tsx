import React, { useEffect, useMemo, useState } from "react";
import { Link } from "../../router";
import { EVOFISH_NEXT_VERSION } from "../version";

type CacheDoctorReport = {
  cacheKeys: string[];
  serviceWorkers: string[];
  localKeys: string[];
  cleanedCaches: string[];
  unregisteredWorkers: string[];
  clearedSettings: string[];
  error?: string;
};

const SETTINGS_KEYS = [
  "evofish_next_view_settings_v5",
  "evofish_next_view_settings_v4",
  "evofish_next_tutorial_done_v1",
  "evofish_beta_qa_state_v1",
  "evofish_beta_release_checklist_v1"
];

function isGameCacheKey(key: string) {
  return /evofish|blackcrown|game|vite|workbox|asset/i.test(key);
}

async function inspectCacheDoctor(): Promise<CacheDoctorReport> {
  const cacheKeys = typeof caches !== "undefined" ? await caches.keys() : [];
  const registrations = typeof navigator !== "undefined" && "serviceWorker" in navigator
    ? await navigator.serviceWorker.getRegistrations()
    : [];
  const localKeys = SETTINGS_KEYS.filter((key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  });

  return {
    cacheKeys,
    serviceWorkers: registrations.map((registration) => registration.scope),
    localKeys,
    cleanedCaches: [],
    unregisteredWorkers: [],
    clearedSettings: []
  };
}

async function cleanGameCaches() {
  const report = await inspectCacheDoctor();
  const keys = report.cacheKeys.filter(isGameCacheKey);
  const cleanedCaches: string[] = [];

  if (typeof caches !== "undefined") {
    for (const key of keys) {
      try {
        const deleted = await caches.delete(key);
        if (deleted) cleanedCaches.push(key);
      } catch {
        // Keep cleaning other caches.
      }
    }
  }

  const unregisteredWorkers: string[] = [];
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      try {
        if (registration.scope.includes("/game/") || registration.scope.includes("blackcrown") || registration.scope.includes("evofish")) {
          const ok = await registration.unregister();
          if (ok) unregisteredWorkers.push(registration.scope);
        }
      } catch {
        // Keep cleaning other workers.
      }
    }
  }

  return { ...await inspectCacheDoctor(), cleanedCaches, unregisteredWorkers };
}

function clearLocalSettings() {
  const clearedSettings: string[] = [];
  for (const key of SETTINGS_KEYS) {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        clearedSettings.push(key);
      }
    } catch {
      // Settings cleanup is optional.
    }
  }
  return clearedSettings;
}

export function BetaCacheDoctor() {
  const [report, setReport] = useState<CacheDoctorReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = useMemo(() => {
    if (!report) return "WAIT";
    const staleRisk = report.cacheKeys.some(isGameCacheKey) || report.serviceWorkers.length > 0;
    return staleRisk ? "CACHE RISK" : "CLEAN";
  }, [report]);

  const refresh = async () => {
    setBusy(true);
    setCopied(false);
    try {
      setReport(await inspectCacheDoctor());
    } catch (error) {
      setReport({ cacheKeys: [], serviceWorkers: [], localKeys: [], cleanedCaches: [], unregisteredWorkers: [], clearedSettings: [], error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  };

  const clean = async () => {
    setBusy(true);
    setCopied(false);
    try {
      setReport(await cleanGameCaches());
    } catch (error) {
      setReport({ cacheKeys: [], serviceWorkers: [], localKeys: [], cleanedCaches: [], unregisteredWorkers: [], clearedSettings: [], error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  };

  const resetSettings = async () => {
    setBusy(true);
    setCopied(false);
    const clearedSettings = clearLocalSettings();
    const next = await inspectCacheDoctor();
    setReport({ ...next, clearedSettings });
    setBusy(false);
  };

  const reload = () => {
    window.location.assign(`/game?fresh=${Date.now()}`);
  };

  const copyReport = async () => {
    if (!report) return;
    setCopied(false);
    try {
      await navigator.clipboard?.writeText(JSON.stringify({ title: "EvoFish Cache Doctor", version: EVOFISH_NEXT_VERSION, generatedAt: new Date().toISOString(), report }, null, 2));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <main className="efCacheDoctor">
      <section className="efCacheShell">
        <header className="efCacheHero">
          <div>
            <span>BLACKCROWN CACHE DOCTOR · {EVOFISH_NEXT_VERSION}</span>
            <h1>Cache Doctor</h1>
            <p>Чистит старые game-кэши и service workers, чтобы iPhone не держал старую сборку после деплоя.</p>
          </div>
          <nav>
            <Link to="/game">HOME</Link>
            <Link to="/game/play">PLAY</Link>
            <Link to="/game/checklist">CHECKLIST</Link>
          </nav>
        </header>

        <section className="efCacheStats">
          <article className={status === "CLEAN" ? "good" : "warn"}><span>Status</span><b>{status}</b><small>{busy ? "Working..." : "Ready"}</small></article>
          <article><span>Caches</span><b>{report?.cacheKeys.length || 0}</b><small>{report?.cleanedCaches.length || 0} cleaned</small></article>
          <article><span>Service workers</span><b>{report?.serviceWorkers.length || 0}</b><small>{report?.unregisteredWorkers.length || 0} unregistered</small></article>
          <article><span>Local settings</span><b>{report?.localKeys.length || 0}</b><small>{report?.clearedSettings.length || 0} cleared</small></article>
        </section>

        <section className="efCacheActions">
          <button disabled={busy} onClick={refresh}>Inspect</button>
          <button disabled={busy} onClick={clean}>Clean Game Cache</button>
          <button disabled={busy} onClick={resetSettings}>Reset Local Settings</button>
          <button disabled={busy} onClick={reload}>Fresh Reload</button>
          <button disabled={!report || busy} onClick={copyReport}>{copied ? "Copied" : "Copy Report"}</button>
        </section>

        <section className="efCacheGrid">
          <article><b>Cache keys</b>{(report?.cacheKeys.length ? report.cacheKeys : ["No caches found"]).map((item) => <code key={item}>{item}</code>)}</article>
          <article><b>Service workers</b>{(report?.serviceWorkers.length ? report.serviceWorkers : ["No service workers found"]).map((item) => <code key={item}>{item}</code>)}</article>
          <article><b>Local keys</b>{(report?.localKeys.length ? report.localKeys : ["No local beta keys found"]).map((item) => <code key={item}>{item}</code>)}</article>
          <article><b>Last cleanup</b>{(report?.cleanedCaches.length ? report.cleanedCaches : ["No cache cleanup yet"]).map((item) => <code key={item}>{item}</code>)}{report?.error ? <em>{report.error}</em> : null}</article>
        </section>
      </section>

      <style>{`
        .efCacheDoctor{min-height:100vh;background:#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efCacheShell{width:min(1120px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efCacheHero,.efCacheStats article,.efCacheActions,.efCacheGrid article{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efCacheHero{border-radius:32px;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.efCacheHero span,.efCacheStats span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#fff3a0;font-weight:1000}.efCacheHero h1{margin:5px 0;font-size:38px;line-height:1}.efCacheHero p{margin:0;color:rgba(231,242,255,.68);line-height:1.45}.efCacheHero nav,.efCacheActions{display:flex;gap:8px;flex-wrap:wrap}.efCacheHero a,.efCacheActions button{min-height:38px;border-radius:999px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.10);color:#e7f2ff;padding:0 13px;text-decoration:none;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.efCacheActions{border-radius:24px;padding:12px}.efCacheActions button:disabled{opacity:.48}.efCacheStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.efCacheStats article{border-radius:22px;padding:12px;display:grid;gap:5px}.efCacheStats article.good{border-color:rgba(110,255,180,.22)}.efCacheStats article.warn{border-color:rgba(255,220,120,.22)}.efCacheStats b{font-size:18px}.efCacheStats small{color:rgba(231,242,255,.62);font-size:11px}.efCacheGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.efCacheGrid article{border-radius:24px;padding:12px;display:grid;gap:8px}.efCacheGrid b{font-size:16px}.efCacheGrid code{display:block;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(2,16,27,.44);padding:8px;white-space:pre-wrap;word-break:break-word;color:rgba(231,242,255,.72);font-size:12px}.efCacheGrid em{font-style:normal;color:#ffb0b0}@media(max-width:780px){.efCacheHero{display:grid}.efCacheStats,.efCacheGrid{grid-template-columns:1fr}.efCacheHero h1{font-size:30px}}
      `}</style>
    </main>
  );
}
