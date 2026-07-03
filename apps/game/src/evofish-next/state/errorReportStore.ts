import { EVOFISH_NEXT_VERSION } from "../version";

export type BetaLastErrorReport = {
  message: string;
  stack?: string;
  componentStack?: string;
  route: string;
  version: string;
  userAgent: string;
  viewport: string;
  createdAt: string;
};

export const BETA_LAST_ERROR_KEY = "evofish_beta_last_error_v1";

function safeRoute() {
  try {
    return window.location.pathname + window.location.search;
  } catch {
    return "unknown";
  }
}

function safeUserAgent() {
  try {
    return navigator.userAgent || "unknown";
  } catch {
    return "unknown";
  }
}

function safeViewport() {
  try {
    return `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio || 1}`;
  } catch {
    return "unknown";
  }
}

export function saveBetaLastError(error: Error, componentStack?: string) {
  const report: BetaLastErrorReport = {
    message: error.message || String(error),
    stack: error.stack,
    componentStack,
    route: safeRoute(),
    version: EVOFISH_NEXT_VERSION,
    userAgent: safeUserAgent(),
    viewport: safeViewport(),
    createdAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(BETA_LAST_ERROR_KEY, JSON.stringify(report));
  } catch {
    // Last error capture must never break gameplay recovery.
  }

  return report;
}

export function loadBetaLastError(): BetaLastErrorReport | null {
  try {
    const raw = localStorage.getItem(BETA_LAST_ERROR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BetaLastErrorReport;
  } catch {
    return null;
  }
}

export function clearBetaLastError() {
  try {
    localStorage.removeItem(BETA_LAST_ERROR_KEY);
  } catch {
    // Optional cleanup.
  }
}
