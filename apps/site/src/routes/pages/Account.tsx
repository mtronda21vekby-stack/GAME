import React from "react";
import { Button } from "@blackcrown/ui";
import { Icons } from "@blackcrown/assets";
import { getProfile, setProfile, clearAvatar, clearProfile, validateAvatarDataUrl } from "@blackcrown/core";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("read_failed"));
    fr.onload = () => resolve(String(fr.result || ""));
    fr.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("read_failed"));
    fr.onload = () => resolve(String(fr.result || ""));
    fr.readAsDataURL(file);
  });
}

function downloadJson(filename: string, obj: any) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatUpdatedAt(ts: number) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

function Pill(props: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.82)",
        fontWeight: 850,
        fontSize: 12,
        letterSpacing: "0.02em",
      }}
    >
      {props.children}
    </span>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        height: 46,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "var(--text)",
        padding: "0 12px",
        outline: "none",
        fontWeight: 850,
        ...(props.style || {}),
      }}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 90,
        resize: "vertical",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "var(--text)",
        padding: "10px 12px",
        outline: "none",
        fontWeight: 850,
        lineHeight: 1.4,
        ...(props.style || {}),
      }}
    />
  );
}

export function Account() {
  const [profile, setProfileState] = React.useState(() => getProfile());
  const [nickname, setNickname] = React.useState(profile.nickname);
  const [status, setStatus] = React.useState(profile.status);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string>("");

  const avatar = profile.avatarDataUrl;

  const hasChanges =
    nickname.trim() !== profile.nickname ||
    status.trim() !== profile.status;

  React.useEffect(() => {
    const t = toast ? setTimeout(() => setToast(""), 2200) : undefined;
    return () => {
      if (t) clearTimeout(t);
    };
  }, [toast]);

  function applySave() {
    const next = setProfile({ nickname, status });
    setProfileState(next);
    setToast("Сохранено");
  }

  async function onPickAvatar(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Нужен PNG/JPG/WebP");
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const v = validateAvatarDataUrl(dataUrl);
      if (!v.ok) {
        setToast(v.reason);
        return;
      }
      const next = setProfile({ avatarDataUrl: dataUrl });
      setProfileState(next);
      setToast("Аватар обновлён");
    } catch {
      setToast("Не удалось загрузить файл");
    } finally {
      setBusy(false);
    }
  }

  async function onImportProfile(file?: File | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setToast("Нужен JSON файл");
      return;
    }

    setBusy(true);
    try {
      const raw = await readFileAsText(file);
      const parsed = JSON.parse(raw);

      const nextNick = typeof parsed.nickname === "string" ? parsed.nickname : profile.nickname;
      const nextStatus = typeof parsed.status === "string" ? parsed.status : profile.status;
      const nextAvatar = typeof parsed.avatarDataUrl === "string" ? parsed.avatarDataUrl : profile.avatarDataUrl;

      const v = validateAvatarDataUrl(nextAvatar || "");
      if (!v.ok) {
        setToast(v.reason);
        return;
      }

      const next = setProfile({ nickname: nextNick, status: nextStatus, avatarDataUrl: nextAvatar || "" });
      setProfileState(next);
      setNickname(next.nickname);
      setStatus(next.status);
      setToast("Профиль импортирован");
    } catch {
      setToast("Не удалось импортировать");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bcSiteRoot">
      <section className="bcSection" style={{ paddingTop: 18 }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div
            className="glassStrong"
            style={{
              borderRadius: 22,
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <img alt="" src={Icons.crown} width="20" height="20" />
              <div style={{ fontWeight: 980, fontSize: 16 }}>Аккаунт</div>
              <Pill>Обновлено: {formatUpdatedAt(profile.updatedAt)}</Pill>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => nav("/")}>Главная</Button>
              <Button variant="secondary" onClick={() => nav("/store")}>Магазин</Button>
              <Button variant="secondary" onClick={() => nav("/support")}>Поддержка</Button>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "grid", gap: 12 }}>
            <div className="glassStrong" style={{ borderRadius: 22, padding: 16 }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 22,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    display: "grid",
                    placeItems: "center",
                  }}
                  aria-label="Аватар"
                >
                  {avatar ? (
                    <img alt="" src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ opacity: 0.7, fontWeight: 950 }}>BC</div>
                  )}
                </div>

                <div style={{ flex: "1 1 260px", minWidth: 240 }}>
                  <div style={{ fontWeight: 980, fontSize: 18, letterSpacing: "-0.01em" }}>{profile.nickname}</div>
                  <div style={{ marginTop: 4, opacity: 0.75, fontWeight: 850 }}>
                    {profile.status ? profile.status : "Статус не задан"}
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <label style={{ display: "inline-flex" }}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        style={{ display: "none" }}
                        onChange={(e) => onPickAvatar(e.target.files?.[0])}
                        disabled={busy}
                      />
                      <span>
                        <Button variant="secondary" disabled={busy}>
                          Загрузить аватар
                        </Button>
                      </span>
                    </label>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        const next = clearAvatar();
                        setProfileState(next);
                        setToast("Аватар удалён");
                      }}
                      disabled={busy || !avatar}
                    >
                      Удалить аватар
                    </Button>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                  <Pill>Хранилище: device</Pill>
                  <Pill>Профиль: v1</Pill>
                </div>
              </div>
            </div>

            <div className="glassStrong" style={{ borderRadius: 22, padding: 16 }}>
              <div style={{ fontWeight: 980, fontSize: 16 }}>Профиль</div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Никнейм</div>
                  <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Введите никнейм" autoComplete="nickname" />
                  <div style={{ marginTop: 6, opacity: 0.70, fontWeight: 850, fontSize: 12 }}>До 18 символов</div>
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Статус</div>
                  <TextArea value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Например: ищу команду / готов играть / на связи" />
                  <div style={{ marginTop: 6, opacity: 0.70, fontWeight: 850, fontSize: 12 }}>До 42 символов</div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="primary" onClick={applySave} disabled={!hasChanges || busy}>
                      Сохранить
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setNickname(profile.nickname);
                        setStatus(profile.status);
                        setToast("Сброшено");
                      }}
                      disabled={busy}
                    >
                      Отменить
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      clearProfile();
                      const p = getProfile();
                      setProfileState(p);
                      setNickname(p.nickname);
                      setStatus(p.status);
                      setToast("Профиль очищен");
                    }}
                    disabled={busy}
                  >
                    Очистить профиль
                  </Button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button variant="ghost" onClick={() => setStatus("Ищу команду")} disabled={busy}>
                    Ищу команду
                  </Button>
                  <Button variant="ghost" onClick={() => setStatus("Готов играть")} disabled={busy}>
                    Готов играть
                  </Button>
                  <Button variant="ghost" onClick={() => setStatus("На связи")} disabled={busy}>
                    На связи
                  </Button>
                </div>
              </div>
            </div>

            <div className="glassStrong" style={{ borderRadius: 22, padding: 16 }}>
              <div style={{ fontWeight: 980, fontSize: 16 }}>Перенос профиля</div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const p = getProfile();
                    downloadJson(`blackcrown-profile.json`, p);
                    setToast("Файл создан");
                  }}
                  disabled={busy}
                >
                  Экспорт JSON
                </Button>

                <label style={{ display: "inline-flex" }}>
                  <input
                    type="file"
                    accept="application/json"
                    style={{ display: "none" }}
                    onChange={(e) => onImportProfile(e.target.files?.[0])}
                    disabled={busy}
                  />
                  <span>
                    <Button variant="secondary" disabled={busy}>
                      Импорт JSON
                    </Button>
                  </span>
                </label>
              </div>

              <div style={{ marginTop: 10, opacity: 0.75, fontWeight: 850, lineHeight: 1.4 }}>
                Экспорт/импорт работает на одном устройстве и между устройствами — через файл.
              </div>
            </div>
          </div>

          {toast ? (
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 18, display: "grid", placeItems: "center", pointerEvents: "none" }}>
              <div
                style={{
                  pointerEvents: "none",
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(20,20,30,0.55)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  color: "rgba(255,255,255,0.88)",
                  fontWeight: 950,
                }}
              >
                {toast}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
