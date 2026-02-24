// functions/api/lobby/ws.ts
import { Env } from "../_lib/auth";

/**
 * Pages Function WS proxy:
 * Client connects to: wss://blackcrown.work/api/lobby/ws?room=main
 * This function proxies Upgrade to the dedicated Worker (ws-lobby).
 *
 * REQUIRED env var on Pages project:
 *   LOBBY_WS_ORIGIN = "https://<your-worker-subdomain>.workers.dev"
 * Example:
 *   "https://blackcrown-lobby-ws.yourname.workers.dev"
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const upgrade = request.headers.get("Upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const url = new URL(request.url);
  const room = (url.searchParams.get("room") || "main").trim() || "main";

  const origin = String(env.LOBBY_WS_ORIGIN || env.BC_LOBBY_WS_ORIGIN || "").trim();
  if (!origin) {
    return new Response("Missing env LOBBY_WS_ORIGIN", { status: 500 });
  }

  const target = new URL(origin);
  target.pathname = "/ws";
  target.searchParams.set("room", room);

  // Proxy the websocket upgrade to worker
  return fetch(target.toString(), request);
};
