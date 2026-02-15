import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMsg } from "./lobbyModel";
import { Button } from "@blackcrown/ui";
import { createSpamGuard, uid } from "./chatAntiSpam";

export function ChatPanel(props: {
  me: string;
  chat: ChatMsg[];
  onSend: (m: { id: string; text: string; ts: number }) => void;
}) {
  const guard = useMemo(() => createSpamGuard(), []);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [props.chat.length]);

  const send = () => {
    const res = guard.allow(text);
    if (!res.ok) { setErr(res.reason); return; }
    props.onSend({ id: uid(), text: text.trim(), ts: Date.now() });
    setText(""); setErr("");
  };

  return (
    <div className="glassStrong" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <div className="bc-row" style={{ justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>Chat</div>
        <div className="bc-faint">8 players</div>
      </div>

      <div ref={listRef} style={{ flex: 1, overflow: "auto", borderRadius: 16, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)", padding: 10 }}>
        {props.chat.map((m) => (
          <div key={m.id} style={{ marginBottom: 10, opacity: 0.96 }}>
            <div className="bc-row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 850, letterSpacing: "-0.01em" }}>{m.name === props.me ? "You" : m.name}</span>
              <span className="bc-faint" style={{ fontSize: 12 }}>
                {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="bc-p" style={{ marginTop: 2 }}>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="bc-row" style={{ gap: 10 }}>
        <input
          className="bc-focus"
          value={text}
          onChange={(e) => { setText(e.target.value); setErr(""); }}
          placeholder="Message…"
          style={{ flex: 1, minHeight: 44, borderRadius: 14, border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.06)", color: "var(--text)", padding: "10px 12px", fontSize: 15 }}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <Button variant="primary" onClick={send}>Send</Button>
      </div>

      {err ? <div className="bc-p" style={{ color: "rgba(255,140,140,0.95)" }}>{err}</div> : null}
      <div className="bc-p" style={{ opacity: 0.72 }}>Transparent chat, transform/opacity motion only.</div>
    </div>
  );
}
