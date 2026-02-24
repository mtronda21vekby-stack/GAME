import React from "react";
import { fetchContent, type BlockRow } from "../lib/content";
import ContentBlocks from "./ContentBlocks";

export function ContentSection(props: { title?: string; forceRefreshButton?: boolean }) {
  const [blocks, setBlocks] = React.useState<BlockRow[]>([]);
  const [status, setStatus] = React.useState<"idle" | "loading" | "error">("idle");

  const load = React.useCallback(async (force?: boolean) => {
    setStatus("loading");
    try {
      const c = await fetchContent({ force: !!force });
      setBlocks(c.blocks || []);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, []);

  React.useEffect(() => {
    load(false);
  }, [load]);

  return (
    <div className="glassStrong bc-motion" style={{ padding: 18, borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)" }}>
      {props.title ? <div style={{ fontWeight: 980, fontSize: 18 }}>{props.title}</div> : null}

      <div style={{ marginTop: 12 }}>
        {status === "loading" ? <div style={{ opacity: 0.82, fontWeight: 850 }}>Loading…</div> : null}
        {status === "error" ? <div style={{ opacity: 0.82, fontWeight: 850 }}>Content load failed (using cache if available).</div> : null}

        <ContentBlocks blocks={blocks} />

        {props.forceRefreshButton ? (
          <div style={{ marginTop: 12 }}>
            <button className="bcAccountPill bcAccentHover" onClick={() => load(true)}>
              Refresh content
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ContentSection;
