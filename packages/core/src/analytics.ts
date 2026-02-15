import { EventBus } from "./eventBus";

type AnalyticsEvent =
  | { type: "page_view"; path: string; ts: number }
  | { type: "cta_click"; id: string; ts: number }
  | { type: "ui_toggle"; id: string; value: boolean | string; ts: number }
  | { type: "error"; message: string; ts: number };

type Events = { analytics: AnalyticsEvent };

const bus = new EventBus<Events>();

export function onAnalytics(handler: (e: AnalyticsEvent) => void) {
  return bus.on("analytics", handler);
}

export function track(e: Omit<AnalyticsEvent, "ts">) {
  bus.emit("analytics", { ...e, ts: Date.now() } as AnalyticsEvent);
}

/** Local analytics hook. Wire to your endpoint later. */
export function attachConsoleAnalytics() {
  return onAnalytics((e) => {
    // eslint-disable-next-line no-console
    console.log(`[analytics]`, e);
  });
}
