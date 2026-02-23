import type { Env } from "../_lib/db";

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const key = ctx.params.path;
  if (!key) return new Response("Not Found", { status: 404 });

  const obj = await ctx.env.MEDIA.get(String(key));
  if (!obj) return new Response("Not Found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
};
