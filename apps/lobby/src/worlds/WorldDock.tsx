import React from "react";
import { navigate } from "../router";
import { WORLD_CATALOG } from "./catalog";
import "./worlds.css";

function usePathname() {
  const [path, setPath] = React.useState(() => window.location.pathname);
  React.useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return path;
}

export function WorldDock() {
  const path = usePathname();
  const [open, setOpen] = React.useState(false);
  const portalOpen = path.startsWith("/lobby/world/");
  if (portalOpen) return null;

  return (
    <aside className={`bcWorldDock ${open ? "isOpen" : ""}`} aria-label="Миры BLACKCROWN">
      <button className="bcWorldDock__toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="bcWorldDock__signal" aria-hidden="true" />
        <span><b>МИРЫ</b><small>{WORLD_CATALOG.length} ONLINE</small></span>
        <i aria-hidden="true">{open ? "×" : "+"}</i>
      </button>

      {open ? (
        <div className="bcWorldDock__panel">
          <header><span>BLACKCROWN NETWORK</span><strong>Выберите мир</strong></header>
          <div className="bcWorldDock__grid">
            {WORLD_CATALOG.map((world) => {
              const active = world.id === "evofish" && (path === "/" || path === "/lobby");
              return (
                <button
                  key={world.id}
                  className={`bcWorldCard ${active ? "isActive" : ""}`}
                  style={{ "--world-accent": world.accent } as React.CSSProperties}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(world.lobbyRoute);
                  }}
                >
                  <span className="bcWorldCard__media" style={{ backgroundImage: `url(${world.previewAsset})` }} />
                  <span className="bcWorldCard__copy">
                    <small>{world.eyebrow}</small>
                    <strong>{world.title}</strong>
                    <em>{world.maturity.toUpperCase()} · {world.version}</em>
                  </span>
                  <span className="bcWorldCard__arrow" aria-hidden="true">↗</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
