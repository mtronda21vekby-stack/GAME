export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function badRequest(message = "Bad Request") {
  return json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return json({ error: "Unauthorized" }, { status: 401 });
}

export function methodNotAllowed() {
  return json({ error: "Method Not Allowed" }, { status: 405 });
}

export function getCookie(req: Request, name: string): string | null {
  const h = req.headers.get("cookie") || "";
  const parts = h.split(";").map((s) => s.trim());
  for (const p of parts) {
    if (!p.startsWith(name + "=")) continue;
    return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

export function setCookie(headers: Headers, cookie: string) {
  headers.append("set-cookie", cookie);
}
