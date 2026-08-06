import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error; info?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info });
    document.documentElement.dataset.bcBoot = "error";
  }

  private recover = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      // Recovery must remain available even when browser storage APIs fail.
    }

    const url = new URL(window.location.href);
    url.searchParams.set("bc-recover", String(Date.now()));
    window.location.replace(url.toString());
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 20,
          background:
            "radial-gradient(circle at 50% 18%, rgba(0,229,255,.12), transparent 34%), #02060a",
          color: "#f4fbff",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
        <section
          style={{
            width: "min(100%, 560px)",
            padding: "28px 24px",
            borderRadius: 24,
            border: "1px solid rgba(0,229,255,.2)",
            background: "rgba(4,12,20,.9)",
            boxShadow: "0 28px 90px rgba(0,0,0,.58)",
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: ".16em", color: "#65eaff" }}>
            BLACKCROWN RECOVERY
          </div>
          <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(28px, 8vw, 44px)", lineHeight: 1 }}>
            Интерфейс не загрузился
          </h1>
          <p style={{ margin: 0, color: "rgba(224,240,250,.72)", lineHeight: 1.55 }}>
            Данные аккаунта не удаляются. Кнопка ниже очистит только устаревший кэш сайта и загрузит свежую версию.
          </p>

          <button
            type="button"
            onClick={this.recover}
            style={{
              width: "100%",
              minHeight: 52,
              marginTop: 22,
              border: "1px solid rgba(151,247,255,.38)",
              borderRadius: 16,
              background: "linear-gradient(180deg, rgba(0,229,255,.28), rgba(0,229,255,.1))",
              color: "#ecfeff",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            Восстановить BlackCrown
          </button>

          <details style={{ marginTop: 18, color: "rgba(196,218,232,.6)", fontSize: 12 }}>
            <summary>Техническая информация</summary>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {this.state.error.name}: {this.state.error.message}
            </pre>
          </details>
        </section>
      </main>
    );
  }
}
