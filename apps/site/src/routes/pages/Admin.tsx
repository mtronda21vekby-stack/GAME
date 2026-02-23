import React from "react";
import { Pressable, SpringGlow } from "@blackcrown/ui";

type BlockRow = {
  id: string;
  kind: string;
  title?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

type ContentPayload = {
  blocks: BlockRow[];
};

type LoginResult = { ok: true } | { ok: false; message: string };

type StatsPayload = {
  ok: true;
  stats: {
    kv: boolean;
    online: { site: number; lobby: number; game: number };
    uniqueDay: { site: number; lobby: number; game: number };
    onlineTotal: number;
    uniqueDayTotal: number;
  };
  events24h: {
    kv: boolean;
    byApp: { site: Record<string, number>; lobby: Record<string, number>; game: Record<string, number> };
    total: Record<string, number>;
  };
};

type SnapList = { ok: boolean; ids: string[] };
type SnapGet = { ok: boolean; id: string; payload: any };

type KvHealthPayload =
  | { ok: true; kv: "ON" | "ERROR"; wrote?: string; read?: string | null }
  | { ok: false; reason?: string; kv?: "ERROR" };

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  return `b_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

async function adminLogin(password: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
      cache: "no-store",
    });

    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) return { ok: false, message: "Доступ запрещён: неверный пароль." };
    if (res.status === 503) return { ok: false, message: "Админка не настроена (нет пароля/секрета в env)." };
    return { ok: false, message: "Не удалось войти. Повтори ещё раз." };
  } catch {
    return { ok: false, message: "Сеть недоступна. Проверь соединение." };
  }
}

async function adminLogout(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/logout", {
      method: "POST",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadAdminContent(): Promise<ContentPayload> {
  const res = await fetch("/api/admin/content", {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) throw new Error("unauthorized");
  if (!res.ok) throw new Error("load");

  return (await res.json()) as ContentPayload;
}

async function saveAdminContent(payload: ContentPayload): Promise<boolean> {
  const res = await fetch("/api/admin/content", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) throw new Error("unauthorized");
  return res.ok;
}

async function requestUploadUrl(file: File): Promise<{ uploadUrl: string; publicUrl: string }> {
  const res = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) throw new Error("unauthorized");
  if (!res.ok) throw new Error("upload-url");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await res.json()) as any;
}

async function fetchStats(): Promise<StatsPayload | null> {
  try {
    const res = await fetch("/api/metrics/stats", {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as StatsPayload;
  } catch {
    return null;
  }
}

// КЛЮЧЕВОЕ: берём реальный статус KV из /api/kv-health
async function fetchKvHealth(): Promise<boolean> {
  try {
    const res = await fetch("/api/kv-health", {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as KvHealthPayload;
    return !!data && data.ok === true && (data as any).kv === "ON";
  } catch {
    return false;
  }
}

async function createEvent(app: "site" | "lobby" | "game", name: string, n = 1) {
  try {
    await fetch("/api/metrics/event", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ app, name, n }),
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // ignore
  }
}

async function snapList(): Promise<SnapList | null> {
  try {
    const res = await fetch("/api/admin/snapshots", {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SnapList;
  } catch {
    return null;
  }
}

async function snapSave(payload: any): Promise<{ ok: boolean; id?: string } | null> {
  try {
    const res = await fetch("/api/admin/snapshots", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    return null;
  }
}

async function snapGet(id: string): Promise<SnapGet | null> {
  try {
    const res = await fetch(`/api/admin/snapshots?id=${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SnapGet;
  } catch {
    return null;
  }
}

function Card(props: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <SpringGlow className="glassStrong bc-motion" style={{ padding: 18 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 950 }}>{props.title}</div>
        {props.right}
      </div>
      <div style={{ marginTop: 12 }}>{props.children}</div>
    </SpringGlow>
  );
}

function Pill(props: { children: React.ReactNode }) {
  return (
    <div className="bcAccountPill" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {props.children}
    </div>
  );
}

function sortTop(obj: Record<string, number>, limit = 10) {
  return Object.entries(obj)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .slice(0, limit);
}

export function Admin() {
  const [authed, setAuthed] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const [tab, setTab] = React.useState<"dashboard" | "content" | "snapshots" | "media" | "tools">("dashboard");

  // content
  const [blocks, setBlocks] = React.useState<BlockRow[]>([]);
  const [selected, setSelected] = React.useState<string>("");
  const [editor, setEditor] = React.useState<string>("{}");
  const [status, setStatus] = React.useState<string>("");

  // stats
  const [stats, setStats] = React.useState<StatsPayload | null>(null);
  const [statsAt, setStatsAt] = React.useState<number>(0);
  const [kvOn, setKvOn] = React.useState<boolean>(false);

  // snapshots
  const [snapIds, setSnapIds] = React.useState<string[]>([]);
  const [snapSelected, setSnapSelected] = React.useState<string>("");
  const [snapStatus, setSnapStatus] = React.useState<string>("");

  const sel = blocks.find((b) => b.id === selected) ?? null;

  const reloadContent = React.useCallback(() => {
    setStatus("");
    setBusy(true);

    loadAdminContent()
      .then((c) => {
        const list = c.blocks || [];
        setBlocks(list);
        if ((!selected || !list.some((x) => x.id === selected)) && list[0]?.id) {
          setSelected(list[0].id);
        }
      })
      .catch((e) => {
        if (String(e?.message) === "unauthorized") {
          setAuthed(false);
          setStatus("Сессия истекла. Войди снова.");
          return;
        }
        setStatus("Не удалось загрузить контент.");
      })
      .finally(() => setBusy(false));
  }, [selected]);

  const reloadStats = React.useCallback(async () => {
    // Делаем параллельно: stats + kv-health
    const [s, kv] = await Promise.all([fetchStats(), fetchKvHealth()]);
    setKvOn(kv);

    if (s) {
      setStats(s);
      setStatsAt(Date.now());
    } else {
      // если stats endpoint упал/старый — kv всё равно покажем корректно
      setStatsAt(Date.now());
    }
  }, []);

  const reloadSnapshots = React.useCallback(async () => {
    const r = await snapList();
    if (r?.ok) setSnapIds(r.ids || []);
  }, []);

  React.useEffect(() => {
    if (!authed) return;
    reloadContent();
    reloadStats();
    reloadSnapshots();
  }, [authed, reloadContent, reloadStats, reloadSnapshots]);

  React.useEffect(() => {
    if (!authed) return;
    const t = window.setInterval(() => {
      reloadStats();
    }, 10_000);
    return () => window.clearInterval(t);
  }, [authed, reloadStats]);

  React.useEffect(() => {
    if (!sel) return;
    setEditor(JSON.stringify(sel.data ?? {}, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.id]);

  if (!authed) {
    return (
      <div className="bcSection">
        <div className="bcSectionHead">
          <div className="bcSectionTitle">Admin</div>
          <div className="bcSectionSub">Secure access.</div>
        </div>

        <div className="bcCards">
          <SpringGlow className="glassStrong bc-motion" style={{ padding: 18 }}>
            <div style={{ fontWeight: 950 }}>Login</div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;

                const p = password.trim();
                if (!p) {
                  setStatus("Введите пароль.");
                  return;
                }

                setStatus("");
                setBusy(true);
                const r = await adminLogin(p);
                setBusy(false);

                if (r.ok) {
                  setAuthed(true);
                  setPassword("");
                  return;
                }

                setAuthed(false);
                setStatus(r.message);
              }}
              style={{ marginTop: 12, display: "grid", gap: 10 }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{
                  height: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.92)",
                  padding: "0 12px",
                  fontWeight: 800,
                  outline: "none",
                }}
              />

              <button
                type="submit"
                className="bcAccountPill"
                disabled={busy}
                style={{
                  opacity: busy ? 0.7 : 1,
                  cursor: busy ? "default" : "pointer",
                }}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>

              {status ? <div style={{ opacity: 0.82, fontWeight: 800 }}>{status}</div> : null}
            </form>
          </SpringGlow>
        </div>
      </div>
    );
  }

  const s = stats?.stats;
  const ev = stats?.events24h;

  return (
    <div className="bcSection">
      <div className="bcSectionHead">
        <div className="bcSectionTitle">Admin</div>
        <div className="bcSectionSub">Dashboard, analytics, content & tools.</div>
      </div>

      <div className="bcCards" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
        <Card
          title="Navigation"
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pressable as="button" className="bcAccountPill" onClick={reloadStats}>
                Refresh stats
              </Pressable>
              <Pressable
                as="button"
                className="bcAccountPill"
                onClick={async () => {
                  setStatus("");
                  const ok = await adminLogout();
                  setAuthed(false);
                  setStats(null);
                  setSnapIds([]);
                  setKvOn(false);
                  if (!ok) setStatus("Logout failed.");
                }}
              >
                Logout
              </Pressable>
            </div>
          }
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Pressable as="button" className="bcAccountPill" onClick={() => setTab("dashboard")}>
              Dashboard
            </Pressable>
            <Pressable as="button" className="bcAccountPill" onClick={() => setTab("content")}>
              Content
            </Pressable>
            <Pressable as="button" className="bcAccountPill" onClick={() => setTab("snapshots")}>
              Snapshots
            </Pressable>
            <Pressable as="button" className="bcAccountPill" onClick={() => setTab("media")}>
              Media
            </Pressable>
            <Pressable as="button" className="bcAccountPill" onClick={() => setTab("tools")}>
              Tools
            </Pressable>
          </div>
        </Card>

        {tab === "dashboard" ? (
          <Card title="Dashboard & Analytics">
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pill>
                  KV: <span style={{ fontWeight: 950 }}>{kvOn ? "ON" : "OFF"}</span>
                </Pill>
                <Pill>
                  Online total: <span style={{ fontWeight: 950 }}>{s?.onlineTotal ?? 0}</span>
                </Pill>
                <Pill>
                  Unique (UTC day) total: <span style={{ fontWeight: 950 }}>{s?.uniqueDayTotal ?? 0}</span>
                </Pill>
                <Pill>
                  Updated: <span style={{ fontWeight: 950 }}>{statsAt ? new Date(statsAt).toLocaleTimeString() : "—"}</span>
                </Pill>
              </div>

              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr" as any }}>
                <div className="glassStrong" style={{ padding: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}>
                  <div style={{ fontWeight: 950 }}>Site</div>
                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    <div style={{ opacity: 0.86, fontWeight: 850 }}>
                      Online: <span style={{ fontWeight: 950 }}>{s?.online.site ?? 0}</span>
                    </div>
                    <div style={{ opacity: 0.86, fontWeight: 850 }}>
                      Unique day: <span style={{ fontWeight: 950 }}>{s?.uniqueDay.site ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="glassStrong" style={{ padding: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}>
                  <div style={{ fontWeight: 950 }}>Lobby</div>
                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    <div style={{ opacity: 0.86, fontWeight: 850 }}>
                      Online: <span style={{ fontWeight: 950 }}>{s?.online.lobby ?? 0}</span>
                    </div>
                    <div style={{ opacity: 0.86, fontWeight: 850 }}>
                      Unique day: <span style={{ fontWeight: 950 }}>{s?.uniqueDay.lobby ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="glassStrong" style={{ padding: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}>
                  <div style={{ fontWeight: 950 }}>Game</div>
                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    <div style={{ opacity: 0.86, fontWeight: 850 }}>
                      Online: <span style={{ fontWeight: 950 }}>{s?.online.game ?? 0}</span>
                    </div>
                    <div style={{ opacity: 0.86, fontWeight: 850 }}>
                      Unique day: <span style={{ fontWeight: 950 }}>{s?.uniqueDay.game ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glassStrong" style={{ padding: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}>
                <div style={{ fontWeight: 950 }}>Events (last 24h)</div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Pressable
                    as="button"
                    className="bcAccountPill"
                    onClick={async () => {
                      await createEvent("lobby", "admin_test", 1);
                      await reloadStats();
                    }}
                  >
                    + test event
                  </Pressable>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" as any }}>
                  <div>
                    <div style={{ opacity: 0.82, fontWeight: 900, marginBottom: 6 }}>Top total</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {sortTop(ev?.total || {}, 10).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, opacity: 0.9, fontWeight: 850 }}>
                          <span>{k}</span>
                          <span style={{ fontWeight: 950 }}>{v}</span>
                        </div>
                      ))}
                      {Object.keys(ev?.total || {}).length === 0 ? (
                        <div style={{ opacity: 0.8, fontWeight: 850 }}>Нет событий за 24ч.</div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div style={{ opacity: 0.82, fontWeight: 900, marginBottom: 6 }}>By app</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {(["site", "lobby", "game"] as const).map((a) => (
                        <div
                          key={a}
                          style={{
                            padding: 10,
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(0,0,0,0.12)",
                          }}
                        >
                          <div style={{ fontWeight: 950, marginBottom: 6 }}>{a}</div>
                          <div style={{ display: "grid", gap: 6 }}>
                            {sortTop(ev?.byApp?.[a] || {}, 5).map(([k, v]) => (
                              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, opacity: 0.9, fontWeight: 850 }}>
                                <span>{k}</span>
                                <span style={{ fontWeight: 950 }}>{v}</span>
                              </div>
                            ))}
                            {Object.keys(ev?.byApp?.[a] || {}).length === 0 ? <div style={{ opacity: 0.8, fontWeight: 850 }}>—</div> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {!kvOn ? (
                  <div style={{ marginTop: 10, opacity: 0.82, fontWeight: 850, lineHeight: 1.45 }}>
                    KV выключен — analytics будут нулевые. В Cloudflare Pages добавь KV binding (например BC_METRICS_KV).
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}

        {tab === "content" ? (
          <Card
            title="Content blocks"
            right={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pressable as="button" className="bcAccountPill" onClick={reloadContent}>
                  {busy ? "Loading…" : "Reload"}
                </Pressable>

                <Pressable
                  as="button"
                  className="bcAccountPill"
                  onClick={() => {
                    const id = safeId();
                    const nb: BlockRow = { id, kind: "cards", title: "New block", data: { items: [] } };
                    setBlocks((x) => [nb, ...x]);
                    setSelected(id);
                    setEditor(JSON.stringify(nb.data, null, 2));
                    setStatus("");
                  }}
                >
                  New block
                </Pressable>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 10 }}>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                style={{
                  height: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.92)",
                  padding: "0 12px",
                  fontWeight: 850,
                  outline: "none",
                }}
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {(b.title || b.kind || "Block").toString()}
                  </option>
                ))}
              </select>

              {sel ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input
                      value={sel.title ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBlocks((xs) => xs.map((b) => (b.id === sel.id ? { ...b, title: v } : b)));
                      }}
                      placeholder="Title"
                      style={{
                        height: 44,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.92)",
                        padding: "0 12px",
                        fontWeight: 800,
                        outline: "none",
                      }}
                    />

                    <input
                      value={sel.kind ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBlocks((xs) => xs.map((b) => (b.id === sel.id ? { ...b, kind: v } : b)));
                      }}
                      placeholder="Kind (e.g. cards)"
                      style={{
                        height: 44,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.92)",
                        padding: "0 12px",
                        fontWeight: 800,
                        outline: "none",
                      }}
                    />
                  </div>

                  <textarea
                    value={editor}
                    onChange={(e) => setEditor(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 260,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.92)",
                      padding: 12,
                      fontWeight: 750,
                      outline: "none",
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    }}
                  />

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ opacity: 0.82, fontWeight: 800 }}>{status}</div>

                    <Pressable
                      as="button"
                      className="bcAccountPill"
                      onClick={async () => {
                        setStatus("");
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        let data: any = null;
                        try {
                          data = JSON.parse(editor);
                        } catch {
                          setStatus("Некорректный JSON.");
                          return;
                        }

                        const nextBlocks = blocks.map((b) => (b.id === sel.id ? { ...b, data } : b));
                        setBlocks(nextBlocks);

                        try {
                          const ok = await saveAdminContent({ blocks: nextBlocks });
                          setStatus(ok ? "Saved." : "Save failed.");
                        } catch (e) {
                          if (String((e as any)?.message) === "unauthorized") {
                            setAuthed(false);
                            setStatus("Сессия истекла. Войди снова.");
                            return;
                          }
                          setStatus("Save failed.");
                        }
                      }}
                    >
                      Save
                    </Pressable>
                  </div>
                </>
              ) : null}
            </div>
          </Card>
        ) : null}

        {tab === "snapshots" ? (
          <Card
            title="Snapshots (backup / restore)"
            right={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pressable as="button" className="bcAccountPill" onClick={reloadSnapshots}>
                  Reload list
                </Pressable>
                <Pressable
                  as="button"
                  className="bcAccountPill"
                  onClick={async () => {
                    setSnapStatus("");
                    try {
                      const content = await loadAdminContent();
                      const payload = {
                        kind: "content_snapshot_v1",
                        at: Date.now(),
                        blocks: content.blocks || [],
                      };
                      const r = await snapSave(payload);
                      if (r?.ok) {
                        setSnapStatus(`Saved: ${r.id}`);
                        await reloadSnapshots();
                      } else {
                        setSnapStatus("Save failed.");
                      }
                    } catch {
                      setSnapStatus("Save failed.");
                    }
                  }}
                >
                  Save snapshot
                </Pressable>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ opacity: 0.82, fontWeight: 850 }}>{snapStatus}</div>

              <select
                value={snapSelected}
                onChange={(e) => setSnapSelected(e.target.value)}
                style={{
                  height: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.92)",
                  padding: "0 12px",
                  fontWeight: 850,
                  outline: "none",
                }}
              >
                <option value="">Select snapshot…</option>
                {snapIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pressable
                  as="button"
                  className="bcAccountPill"
                  onClick={async () => {
                    if (!snapSelected) return;
                    setSnapStatus("Loading…");
                    const r = await snapGet(snapSelected);
                    if (!r?.ok) {
                      setSnapStatus("Load failed.");
                      return;
                    }
                    const blocksFromSnap = r.payload?.blocks || [];
                    setBlocks(blocksFromSnap);
                    if (blocksFromSnap?.[0]?.id) setSelected(blocksFromSnap[0].id);
                    setSnapStatus("Loaded into editor. Now go Content tab and press Save to apply.");
                  }}
                >
                  Load into editor
                </Pressable>

                <Pressable
                  as="button"
                  className="bcAccountPill"
                  onClick={async () => {
                    if (!snapSelected) return;
                    setSnapStatus("Preview…");
                    const r = await snapGet(snapSelected);
                    if (!r?.ok) {
                      setSnapStatus("Preview failed.");
                      return;
                    }
                    const count = Array.isArray(r.payload?.blocks) ? r.payload.blocks.length : 0;
                    setSnapStatus(`Snapshot blocks: ${count}`);
                  }}
                >
                  Preview
                </Pressable>
              </div>

              <div style={{ opacity: 0.82, fontWeight: 850, lineHeight: 1.45 }}>
                Snapshots хранят backup blocks JSON в KV. “Load into editor” подставляет snapshot в редактор — затем применяй через Save в Content.
              </div>
            </div>
          </Card>
        ) : null}

        {tab === "media" ? (
          <Card title="Media upload">
            <div style={{ opacity: 0.82, fontWeight: 800, lineHeight: 1.45 }}>
              Upload returns a public URL you can paste into block JSON.
            </div>

            <div style={{ marginTop: 12 }}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;

                  setStatus("Preparing upload…");

                  requestUploadUrl(f)
                    .then(async ({ uploadUrl, publicUrl }) => {
                      const put = await fetch(uploadUrl, {
                        method: "PUT",
                        headers: { "content-type": f.type || "application/octet-stream" },
                        body: f,
                      });

                      if (!put.ok) {
                        setStatus("Upload failed.");
                        return;
                      }

                      setStatus(`Uploaded: ${publicUrl}`);
                      try {
                        await createEvent("site", "upload_media", 1);
                      } catch {
                        // ignore
                      }
                    })
                    .catch((err) => {
                      if (String(err?.message) === "unauthorized") {
                        setAuthed(false);
                        setStatus("Сессия истекла. Войди снова.");
                        return;
                      }
                      setStatus("Upload failed.");
                    });
                }}
              />
            </div>

            {status ? <div style={{ marginTop: 10, opacity: 0.82, fontWeight: 800 }}>{status}</div> : null}
          </Card>
        ) : null}

        {tab === "tools" ? (
          <Card title="Tools">
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ opacity: 0.82, fontWeight: 850, lineHeight: 1.45 }}>
                Это утилиты для проверки метрик и диагностики. Если KV: OFF — сначала подключи KV binding в Cloudflare Pages.
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pressable
                  as="button"
                  className="bcAccountPill"
                  onClick={async () => {
                    await createEvent("site", "admin_tool_click", 1);
                    await reloadStats();
                  }}
                >
                  Emit event: admin_tool_click
                </Pressable>

                <Pressable
                  as="button"
                  className="bcAccountPill"
                  onClick={async () => {
                    await createEvent("lobby", "admin_ping_lobby", 1);
                    await reloadStats();
                  }}
                >
                  Emit event: admin_ping_lobby
                </Pressable>

                <Pressable
                  as="button"
                  className="bcAccountPill"
                  onClick={async () => {
                    await reloadStats();
                    await reloadSnapshots();
                    await reloadContent();
                  }}
                >
                  Full refresh
                </Pressable>
              </div>

              <div className="glassStrong" style={{ padding: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}>
                <div style={{ fontWeight: 950 }}>Quick diagnostics</div>
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  <div style={{ opacity: 0.88, fontWeight: 850 }}>
                    blocks: <span style={{ fontWeight: 950 }}>{blocks.length}</span>
                  </div>
                  <div style={{ opacity: 0.88, fontWeight: 850 }}>
                    snapshots: <span style={{ fontWeight: 950 }}>{snapIds.length}</span>
                  </div>
                  <div style={{ opacity: 0.88, fontWeight: 850 }}>
                    stats: <span style={{ fontWeight: 950 }}>{stats ? "loaded" : "—"}</span>
                  </div>
                  <div style={{ opacity: 0.88, fontWeight: 850 }}>
                    kv-health: <span style={{ fontWeight: 950 }}>{kvOn ? "ON" : "OFF"}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default Admin;
