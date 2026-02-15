import { useMemo } from "react";

export function useSafeAreaInsets() {
  return useMemo(() => ({
    top: "env(safe-area-inset-top)",
    right: "env(safe-area-inset-right)",
    bottom: "env(safe-area-inset-bottom)",
    left: "env(safe-area-inset-left)"
  }), []);
}
