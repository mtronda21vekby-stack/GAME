import React from "react";
import { Link } from "../../router";
import { inspectEvoFishNextSave, repairEvoFishNextSave, resetEvoFishNextRun, type EvoFishSaveDoctorReport } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

type BetaErrorBoundaryProps = {
  children: React.ReactNode;
};

type BetaErrorBoundaryState = {
  error: Error | null;
  report: EvoFishSaveDoctorReport | null;
};

function safeErrorText(error: Error | null) {
  if (!error) return "Unknown runtime error.";
  return error.message || String(error);
}

export class BetaErrorBoundary extends React.Component<BetaErrorBoundaryProps, BetaErrorBoundaryState> {
  state: BetaErrorBoundaryState = { error: null, report: null };

  static getDerivedStateFromError(error: Error): BetaErrorBoundaryState {
    return { error, report: inspectEvoFishNextSave() };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("EvoFish beta runtime error", error, info);
  }

  private repairSave = () => {
    this.setState({ report: repairEvoFishNextSave() });
  };

  private resetRun = () => {
    this.setState({ report: resetEvoFishNextRun() });
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const report = this.state.report || inspectEvoFishNextSave();

    return (
      <main className="efBetaError">
        <section className="efBetaErrorCard">
          <span>BLACKCROWN ERROR GUARD · {EVOFISH_NEXT_VERSION}</span>
          <h1>Game Error</h1>
          <p>Игра поймала runtime-ошибку вместо белого экрана. Можно безопасно восстановить save, сбросить текущий run или вернуться в lobby.</p>

          <pre>{safeErrorText(this.state.error)}</pre>

          <div className="efErrorActions">
            <button onClick={this.reload}>Reload</button>
            <button onClick={this.resetRun}>Restart Run</button>
            <button onClick={this.repairSave}>Repair Save</button>
            <Link to="/game">Back to Lobby</Link>
            <Link to="/game/next/progress">Save Doctor</Link>
          </div>

          <div className="efErrorReport">
            <b>Save Doctor: {report.status.toUpperCase()}</b>
            {(report.issues.length ? report.issues : ["No save issues detected."]).map((issue) => <em key={issue}>{issue}</em>)}
          </div>
        </section>

        <style>{`
          .efBetaError{min-height:100vh;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 20% 10%,rgba(255,90,90,.22),transparent 32%),linear-gradient(180deg,#04101c,#020b15);color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efBetaErrorCard{width:min(760px,calc(100vw - 28px));border-radius:30px;border:1px solid rgba(255,120,120,.24);background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.04));box-shadow:0 28px 90px rgba(0,0,0,.45);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);padding:18px;display:grid;gap:12px}.efBetaErrorCard span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#fff3a0;font-weight:1000}.efBetaErrorCard h1{margin:0;font-size:34px}.efBetaErrorCard p{margin:0;color:rgba(231,242,255,.72);line-height:1.45}.efBetaErrorCard pre{white-space:pre-wrap;word-break:break-word;max-height:170px;overflow:auto;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(2,16,27,.55);padding:12px;color:#ffb0b0;font-size:12px}.efErrorActions{display:flex;flex-wrap:wrap;gap:8px}.efErrorActions button,.efErrorActions a{min-height:40px;border-radius:999px;border:1px solid rgba(120,240,255,.24);background:rgba(120,240,255,.11);color:#e7f2ff;text-decoration:none;padding:0 14px;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.efErrorReport{display:grid;gap:6px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(2,16,27,.36);padding:12px}.efErrorReport b{color:#fff3a0}.efErrorReport em{font-style:normal;color:rgba(231,242,255,.66);font-size:12px}
        `}</style>
      </main>
    );
  }
}
