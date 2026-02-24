import React from "react";

export type MeProfileV1 = {
  v: 1;
  id: string;
  createdAt: number;
  lastSeenAt: number;
  nickname: string;
  avatarUrl?: string;
  roles?: string[];
};

type MeGetOk = { ok: true; profile: MeProfileV1 };
type MeGetFail = { ok: false; reason?: string };
type MeGet = MeGetOk | MeGetFail;

type MePatchOk = { ok: true; profile: MeProfileV1 };
type MePatchFail = { ok: false; reason?: string };
type MePatch = MePatchOk | MePatchFail;

async function getMe(): Promise<MeProfileV1 | null> {
  try {
    const res = await fetch("/api/me", {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as MeGet;
    if (!json || (json as any).ok !== true) return null;
    return (json as MeGetOk).profile || null;
  } catch {
    return null;
  }
}

async function patchMe(payload: { nickname?: string; avatarUrl?: string }): Promise<MeProfileV1 | null> {
  try {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as MePatch;
    if (!json || (json as any).ok !== true) return null;
    return (json as MePatchOk).profile || null;
  } catch {
    return null;
  }
}

export function useMe() {
  const [profile, setProfile] = React.useState<MeProfileV1 | null>(null);
  const [ready, setReady] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const reload = React.useCallback(async () => {
    setReady(false);
    const p = await getMe();
    setProfile(p);
    setReady(true);
  }, []);

  const update = React.useCallback(async (payload: { nickname?: string; avatarUrl?: string }) => {
    setSaving(true);
    const p = await patchMe(payload);
    if (p) setProfile(p);
    setSaving(false);
    return p;
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  return { profile, ready, saving, reload, update };
}
