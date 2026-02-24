// functions/api/lobby/ws.ts
import { Env } from "../_lib/auth";

function okUpgrade(req: Request) {
  return req.headers.get("Upgrade")?.toLowerCase() === "websocket";
}

/**
 * AAA WS proxy:
 * Browser -> Pages Function (/api/lobby/ws) -> Service binding (blackcrown-lobby-ws) -> DO
 *
 * Требование: в Pages Settings добавить Service Binding:
 *   Name: LOBBY_WS
 *   Service: blackcrown-lobby-ws
 */
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (!okUpgrade(request)) {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const svc = env.LOBBY_WS as Fetcher | undefined;
  if (!svc) {
    // fallback: можно сделать через env.LOBBY_WS_URL, но Service Binding надёжнее
    return new Response("Missing service binding: LOBBY_WS", { status: 500 });
  }

  // На worker'е вход: /ws или /ws/<room>
  // У нас здесь: /api/lobby/ws?room=main
  // Перепишем путь на /ws, query оставим.
  const url = new URL(request.url);
  url.pathname = "/ws";

  // ВАЖНО: создаём новый Request с теми же заголовками (Upgrade/Sec-WebSocket-*)
  const nextReq = new Request(url.toString(), request);

  return svc.fetch(nextReq);
};
