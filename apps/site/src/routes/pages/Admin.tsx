import React from "react";
import { Pressable, SpringGlow, Reveal } from "@blackcrown/ui";

type BlockRow = {
  id: string;
  kind: string;
  title?: string | null;
  data?: any;
};

type ContentPayload = {
  blocks: BlockRow[];
};

async function adminLogin(password: string): Promise<boolean> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

async function loadAdminContent(): Promise<ContentPayload> {
  const res = await fetch("/api/admin/content", { method: "GET", headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("load");
  return (await res.json()) as ContentPayload;
}

async function saveAdminContent(payload: ContentPayload): Promise<boolean> {
  const res = await fetch("/api/admin/content", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

async function requestUploadUrl(file: File): Promise<{ uploadUrl: string; publicUrl: string }> {
  const res = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
  });
  if (!res.ok) throw new Error("upload-url");
  return (await res.json()) as any;
}

export function Admin() {
  const [authed, setAuthed] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [blocks, setBlocks] = React.useState<BlockRow[]>([]);
  const [selected, setSelected] = React.useState<string>("");
  const [editor, setEditor] = React.useState<string>("{}");
  const [status, setStatus] = React.useState<string>("");

  const sel = blocks.find((b) => b.id === selected) ?? null;

  const reload = React.useCallback(() => {
    setStatus("");
    loadAdminContent()
      .then((c) => {
        setBlocks(c.blocks || []);
        if (!selected && c.blocks?.[0]?.id) setSelected(c.blocks[0].id);
      })
      .catch(() => setStatus("Failed to load content"));
  }, [selected]);

  React.useEffect(() => {
    if (!authed) return;
    reload();
  }, [authed, reload]);

  React.useEffect(() => {
    if (!sel) return;
    setEditor(JSON.stringify(sel.data ?? {}, null, 2));
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

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  style={{
                    height: 44,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.92)",
                    padding: "0 12px",
                    fontWeight: 800,
                  }}
                />

                <Pressable
                  as="button"
                  className="bcAccountPill"
                  onClick={() => {
                    setStatus("");
                    adminLogin(password)
                      .then((ok) => setAuthed(ok))
                      .catch(() => setStatus("Login failed"));
                  }}
                >
                  Sign in
                </Pressable>

                {status ? <div style={{ opacity: 0.78, fontWeight: 750 }}>{status}</div> : null}
              </div>
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
              <Pressable as="button" className="bcAccountPill" onClick={reload}>Reload</Pressable>
              <Pressable
                as="button"
                className="bcAccountPill"
                onClick={() => {
                  const id = crypto.randomUUID();
                  const nb: BlockRow = { id, kind: "cards", title: "New block", data: { items: [] } };
                  setBlocks((x) => [nb, ...x]);
                  setSelected(id);
                  setEditor(JSON.stringify(nb.data, null, 2));
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
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ opacity: 0.78, fontWeight: 750 }}>{status}</div>
                  <Pressable
                    as="button"
                    className="bcAccountPill"
                    onClick={() => {
                      setStatus("");
                      let data: any = null;
                      try {
                        data = JSON.parse(editor);
                      } catch {
                        setStatus("Invalid JSON");
                        return;
                      }

                      const nextBlocks = blocks.map((b) => (b.id === sel.id ? { ...b, data } : b));
                      setBlocks(nextBlocks);

                      saveAdminContent({ blocks: nextBlocks })
                        .then((ok) => setStatus(ok ? "Saved" : "Save failed"))
                        .catch(() => setStatus("Save failed"));
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
          <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 750, lineHeight: 1.45 }}>
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
                      setStatus("Upload failed");
                      return;
                    }
                    setStatus(`Uploaded: ${publicUrl}`);
                  })
                  .catch(() => setStatus("Upload failed"));
              }}
            />
          </div>
        </SpringGlow>
      </div>
    </div>
  );
}
