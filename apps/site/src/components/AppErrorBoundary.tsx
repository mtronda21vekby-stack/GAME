import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorId: string;
};

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `err_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

async function emitCrashEvent(name: string) {
  try {
    await fetch("/api/metrics/event", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ app: "site", name, n: 1 }),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorId: safeId() };

  static getDerivedStateFromError() {
    return { hasError: true, errorId: safeId() };
  }

  componentDidCatch(error: unknown) {
    // фиксируем событие (без PII)
    emitCrashEvent("site_crash");
    // в консоль — чтобы в dev сразу видно
    // eslint-disable-next-line no-console
    console.error("[site] crash:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "var(--app-vh, 100vh)",
          display: "grid",
          placeItems: "center",
          padding: 18,
          background: "rgba(0,0,0,0.65)",
        }}
      >
        <div
          className="glassStrong"
          style={{
            maxWidth: 640,
            width: "100%",
            padding: 18,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontWeight: 950, fontSize: 18 }}>Произошла ошибка</div>
          <div style={{ marginTop: 8, opacity: 0.82, fontWeight: 800, lineHeight: 1.45 }}>
            Мы уже зафиксировали проблему. Попробуй перезагрузить страницу.
          </div>

          <div
            style={{
              marginTop: 10,
              opacity: 0.7,
              fontWeight: 800,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
            title={this.state.errorId}
          >
            id: {this.state.errorId}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="bcAccountPill"
              onClick={() => window.location.reload()}
              style={{ cursor: "pointer" }}
            >
              Reload
            </button>

            <button
              className="bcAccountPill"
              onClick={() => {
                // мягкий reset без reload (иногда спасает)
                this.setState({ hasError: false, errorId: safeId() });
              }}
              style={{ cursor: "pointer" }}
            >
              Try restore
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
