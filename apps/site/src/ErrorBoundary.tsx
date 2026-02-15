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
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="apple-bg" style={{ minHeight: "100%", padding: 16 }}>
        <div className="glassStrong bc-container" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>UI crashed</div>
          <div className="bc-p" style={{ marginTop: 8 }}>
            {this.state.error.name}: {this.state.error.message}
          </div>

          <div className="bc-divider" style={{ marginTop: 14 }} />

          <pre
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              border: "1px solid var(--stroke)",
              background: "rgba(0,0,0,0.35)",
              color: "var(--text)",
              overflow: "auto",
              fontSize: 12,
              lineHeight: 1.45,
              whiteSpace: "pre-wrap"
            }}
          >
{String(this.state.error.stack ?? "")}
{this.state.info?.componentStack ? `\n\nComponent stack:\n${this.state.info.componentStack}` : ""}
          </pre>

          <div className="bc-p" style={{ marginTop: 10, opacity: 0.8 }}>
            Скопируй текст ошибки отсюда — и я дам точный фикс без лишних вопросов.
          </div>
        </div>
      </div>
    );
  }
}
