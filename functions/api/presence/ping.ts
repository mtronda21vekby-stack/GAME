// functions/api/presence/ping.ts
import { Env } from "../_lib/auth";
import { presencePing } from "../_lib/presence";

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const r = presencePing({ scope: body?.scope, id: body?.id });

  return new Response(JSON.stringify(r), {
    status: r.ok ? 200 : 400,
    headers: { "Content-Type": "application/json" },
  });
};
