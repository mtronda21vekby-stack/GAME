import React from "react";
import { navigate } from "../router";
import { getWorld } from "./catalog";
import { isWorldBridgeMessage, makeWorldHostMessage } from "./bridge";
import type { WorldId } from "./types";
import "./worlds.css";

export function WorldPortal({ worldId }: { worldId: WorldId }) {
  const world = getWorld(worldId);
  const frameRef = React.useRef<HTMLIFrameElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [runtimeState, setRuntimeState] = React.useState<"idle" | "loading" | "ready">("idle");
  const [snapshot, setSnapshot] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isWorldBridgeMessage(event.data) || event.data.worldId !== world.id) return;
      if (event.data.type === "world.ready") setRuntimeState("ready");
      if (event.data.payload) setSnapshot(event.data.payload);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [world.id]);

  const start = () => {
    setRuntimeState("loading");
    setPlaying(true);
  };

  const requestSnapshot = () => {
    frameRef.current?.contentWindow?.postMessage(makeWorldHostMessage(world.id, "host.requestSnapshot"), window.location.origin);
  };

  if (playing) {
    return (
      <main className="bcWorldRuntimeShell" style={{ "--world-accent": world.accent } as React.CSSProperties}>
        <header className="bcWorldRuntimeShell__bar">
          <button type="button" onClick={() => { setPlaying(false); setRuntimeState("idle"); }}>← Лобби мира</button>
          <div><small>{world.eyebrow}</small><strong>{world.title}</strong></div>
          <span className={`bcWorldRuntimeShell__status is-${runtimeState}`}>
            {runtimeState === "ready" ? "RUNTIME READY" : "LOADING"}
          </span>
        </header>
        <iframe
          ref={frameRef}
          className="bcWorldRuntimeShell__frame"
          src={world.runtimeUrl}
          title={`${world.title} — игровой мир`}
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-pointer-lock"
          onLoad={requestSnapshot}
        />
      </main>
    );
  }

  return (
    <main className="bcWorldPortal" style={{ "--world-accent": world.accent } as React.CSSProperties}>
      <div className="bcWorldPortal__backdrop" style={{ backgroundImage: `url(${world.previewAsset})` }} aria-hidden="true" />
      <header className="bcWorldPortal__top">
        <button type="button" onClick={() => navigate("/lobby")}>← BLACKCROWN LOBBY</button>
        <span>WORLD NODE · {world.version}</span>
      </header>

      <section className="bcWorldPortal__hero">
        <div className="bcWorldPortal__copy">
          <span>{world.eyebrow}</span>
          <h1>{world.title}</h1>
          <p>{world.description}</p>
          <div className="bcWorldPortal__actions">
            <button className="isPrimary" type="button" onClick={start}>ИГРАТЬ В ЛОББИ</button>
            <button type="button" onClick={() => window.location.assign(world.runtimeUrl)}>Открыть отдельно ↗</button>
          </div>
        </div>

        <aside className="bcWorldPortal__intel">
          <div><small>STATUS</small><strong>{world.maturity.toUpperCase()}</strong></div>
          <div><small>SAVE</small><strong>{world.saveNamespace ? "LOCAL / CLOUD-READY" : "ACCOUNT"}</strong></div>
          <div><small>RUNTIME</small><strong>{world.runtimeKind === "isolated-html" ? "ISOLATED WEBGL" : "BLACKCROWN APP"}</strong></div>
        </aside>
      </section>

      <section className="bcWorldPortal__lower">
        <article>
          <span>СЕЙЧАС</span>
          <div className="bcWorldPortal__chips">{world.capabilities.map((item) => <i key={item}>{item}</i>)}</div>
        </article>
        <article>
          <span>ДАЛЬШЕ</span>
          <div className="bcWorldPortal__chips isRoadmap">{world.roadmap.map((item) => <i key={item}>{item}</i>)}</div>
        </article>
        {snapshot ? <pre className="bcWorldPortal__snapshot">{JSON.stringify(snapshot, null, 2)}</pre> : null}
      </section>
    </main>
  );
}
