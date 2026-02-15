import { useMemo, useState } from "react";
import type { ToastItem } from "../components/Toast";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const api = useMemo(() => ({
    push: (t: Omit<ToastItem, "id">) => {
      const id = uid();
      setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 3200);
    },
    dismiss: (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id))
  }), []);

  return { toasts, ...api };
}
