export type Ga4Params = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const SESSION_KEY = "ft_gateway_session_id";

function randomId(): string {
  // Not a security token; just a stable analytics session id.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getGatewaySessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = randomId();
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return "unknown";
  }
}

export function track(eventName: string, params: Ga4Params = {}) {
  if (typeof window === "undefined") return;
  const gtag = window.gtag;
  if (!gtag) return;
  try {
    gtag("event", eventName, params);
  } catch {
    // No-op: analytics must never break UX
  }
}

