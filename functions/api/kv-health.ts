export const onRequest: PagesFunction<Env> = async ({ env }) => {
  const kv = env.BC_METRICS_KV;
  if (!kv) {
    return json({ ok: false, reason: "BC_METRICS_KV binding missing" }, 500);
  }

  const key = "__kv_health__";
  const value = String(Date.now());

  try {
    await kv.put(key, value, { expirationTtl: 60 });
    const got = await kv.get(key);

    return json({
      ok: got === value,
      kv: got === value ? "ON" : "ERROR",
      wrote: value,
      read: got,
    });
  } catch (e: any) {
    return json(
      { ok: false, kv: "ERROR", error: e?.message ?? String(e) },
      500,
    );
  }
};

type Env = {
  BC_METRICS_KV: KVNamespace;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
