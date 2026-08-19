function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const onRequestGet: PagesFunction = async () => {
  return json({
    ok: true,
    service: "blackcrown-site",
    bridgeContract: "blackcrown-account-bridge-v43-direct-supabase",
    runtimeMarker: "supabase-secret-refresh-2026-08-19T13:16Z",
  });
};
