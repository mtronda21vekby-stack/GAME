// functions/api/lobby/ws.ts
// WebSocket proxy: Pages Functions -> Service Binding (blackcrown-lobby-ws)
// Route: /api/lobby/ws?room=main

export interface Env {
  LOBBY_WS?: Fetcher;
}

function isWebSocketUpgrade(req: Request): boolean {
  return (req.headers.get("Upgrade") || "").toLowerCase() === "websocket";
}

function safeRoom(raw: string | null): string {
  const r = String(raw || "main").trim();
  const clean = r.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return clean || "main";
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.LOBBY_WS) {
    return new Response("Missing service binding LOBBY_WS", { status: 500 });
  }

  if (!isWebSocketUpgrade(request)) {
    // удобный ответ для ручной проверки в браузере
    return new Response("Expected WebSocket Upgrade", { status: 426 });
  }

  // ВАЖНО: твой WS worker слушает /ws (см. apps/ws-lobby/src/index.ts)
  // а Pages route у нас /api/lobby/ws — поэтому переписываем pathname на /ws
  const url = new URL(request.url);
  const room = safeRoom(url.searchParams.get("room"));
  url.pathname = "/ws";
  url.searchParams.set("room", room);

  // Проксируем Upgrade как есть
  const nextReq = new Request(url.toString(), request);
  return env.LOBBY_WS.fetch(nextReq);
};
