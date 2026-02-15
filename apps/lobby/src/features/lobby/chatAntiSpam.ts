export type SpamGuard = { allow: (text: string) => { ok: true } | { ok: false; reason: string }; };

export function createSpamGuard(): SpamGuard {
  let lastTs = 0;
  let burst = 0;
  let lastText = "";

  return {
    allow: (text) => {
      const t = text.trim();
      if (!t) return { ok: false, reason: "Empty message." };
      if (t.length > 160) return { ok: false, reason: "Too long (max 160)." };

      const now = Date.now();
      const delta = now - lastTs;

      if (delta < 700) burst += 1;
      else burst = Math.max(0, burst - 1);

      lastTs = now;

      if (burst > 5) return { ok: false, reason: "Slow down." };
      if (t === lastText) return { ok: false, reason: "Duplicate." };
      lastText = t;

      return { ok: true };
    }
  };
}

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
