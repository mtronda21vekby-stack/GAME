import { json, methodNotAllowed } from "../_lib/http";
import type { Env } from "../_lib/db";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method !== "GET") return methodNotAllowed();

  const q = await ctx.env.DB.prepare(
    "SELECT id, kind, title, data, updated_at AS updatedAt FROM blocks WHERE status='published' ORDER BY updated_at DESC"
  ).all();

  const blocks = (q.results || []).map((r: any) => ({
    id: String(r.id),
    kind: String(r.kind),
    title: r.title ?? null,
    data: r.data ? JSON.parse(String(r.data)) : null,
    updatedAt: r.updatedAt ?? null,
  }));

  return json(
    { blocks },
    { headers: { "cache-control": "public, max-age=15, s-maxage=60" } }
  );
};
