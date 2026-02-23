import { json, badRequest, unauthorized, methodNotAllowed } from "../../_lib/http";
import type { Env } from "../../_lib/db";
import { getAdminCookie, verifyAdminSession } from "../../_lib/auth";

type BlockRow = { id: string; kind: string; title?: string | null; data?: unknown };

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const token = getAdminCookie(ctx.request);
  if (!token) return unauthorized();

  const ok = await verifyAdminSession(ctx.env.SESSION_SECRET, token);
  if (!ok) return unauthorized();

  if (ctx.request.method === "GET") {
    const q = await ctx.env.DB.prepare(
      "SELECT id, kind, title, data, updated_at AS updatedAt FROM blocks ORDER BY updated_at DESC"
    ).all();

    const blocks = (q.results || []).map((r: any) => ({
      id: String(r.id),
      kind: String(r.kind),
      title: r.title ?? null,
      data: r.data ? JSON.parse(String(r.data)) : null,
      updatedAt: r.updatedAt ?? null,
    }));

    return json({ blocks });
  }

  if (ctx.request.method === "POST") {
    let body: any = null;
    try {
      body = await ctx.request.json();
    } catch {
      return badRequest("Invalid JSON");
    }

    const blocks = Array.isArray(body?.blocks) ? (body.blocks as BlockRow[]) : null;
    if (!blocks) return badRequest("blocks required");

    const now = Date.now();

    // Upsert blocks; publish by default (можешь менять через UI позже)
    const stmt = ctx.env.DB.prepare(
      "INSERT INTO blocks (id, kind, title, data, status, updated_at) VALUES (?1, ?2, ?3, ?4, 'published', ?5) " +
        "ON CONFLICT(id) DO UPDATE SET kind=excluded.kind, title=excluded.title, data=excluded.data, status='published', updated_at=excluded.updated_at"
    );

    const batch = blocks.map((b) =>
      stmt.bind(
        String(b.id),
        String(b.kind),
        b.title == null ? null : String(b.title),
        JSON.stringify(b.data ?? {}),
        now
      )
    );

    await ctx.env.DB.batch(batch);
    return json({ ok: true });
  }

  return methodNotAllowed();
};
