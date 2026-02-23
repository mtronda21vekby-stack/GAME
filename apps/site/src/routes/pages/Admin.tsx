import React from "react";
import { Pressable, SpringGlow, Reveal } from "@blackcrown/ui";

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
    });

    if (res.ok) return { ok: true };

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "Доступ запрещён: неверный пароль." };
    }

    // 503/500 и т.п.
    return { ok: false, message: "Не удалось войти. Проверь переменные окружения и повтори." };
  } catch {
    return { ok: false, message: "Сеть недоступна. Проверь соединение." };
  }
}

async function loadAdminContent(): Promise<ContentPayload> {
  const res = await fetch("/api/admin/content", {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "include",
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
  });
  return res.ok;
}

async function requestUploadUrl(file: File): Promise<{ uploadUrl: string; publicUrl: string }> {
  const res = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) throw new Error("unauthorized");
  if (!res.ok) throw new Error("upload-url");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await res.json()) as any;
}

export function Admin() {
  const [authed, setAuthed] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const [blocks, setBlocks] = React.useState<BlockRow[]>([]);
  const [selected, setSelected] = React.useState<string>("");
  const [editor, setEditor] = React.useState<string>("{}");
  const [status, setStatus] = React.useState<string>("");

  const sel = blocks.find((b) => b.id === selected) ?? null;

  const reload = React.useCallback(() => {
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

  React.useEffect(() => {
    if (!authed) return;
    reload();
  }, [authed, reload]);

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
          <Reveal>
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

                {/* submit внутри form — на iOS кликается стабильнее всего */}
                <button
                  type="submit"
                  className="bcAccountPill"
                  disabled={busy}
                  style={{ opacity: busy ? 0.7 : 1, cursor: busy ? "default" : "pointer" }}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>

                {status ? <div style={{ opacity: 0.82, fontWeight: 800 }}>{status}</div> : null}
              </form>
            </SpringGlow>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="bcSection">
      <div className="bcSectionHead">
        <div className="bcSectionTitle">Admin</div>
        <div className="bcSectionSub">Blocks & media management.</div>
      </div>

      <div className="bcCards" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
        <SpringGlow className="glassStrong bc-motion" style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 950 }}>Content blocks</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pressable as="button" className="bcAccountPill" onClick={reload}>
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
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
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
                    minHeight: 240,
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
                      } catch {
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
        </SpringGlow>

        <SpringGlow className="glassStrong bc-motion" style={{ padding: 18 }}>
          <div style={{ fontWeight: 950 }}>Media upload</div>
          <div style={{ marginTop: 10, opacity: 0.82, fontWeight: 800, lineHeight: 1.45 }}>
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
        </SpringGlow>
      </div>
    </div>
  );
}

export default Admin;
