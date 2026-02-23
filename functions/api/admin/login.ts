// functions/api/admin/login.ts
import { Env, setCookie, signAdminToken } from "../_lib/auth";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = String(body?.password || "");
  } catch {
    password = "";
  }

  const expected = env.BC_ADMIN_PASSWORD || "";
  const secret = env.BC_ADMIN_SECRET || "";

  if (!expected || !secret) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!password || password !== expected) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = await signAdminToken(env, 24 * 60 * 60); // 24h
  if (!token) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": setCookie("bc_admin", token, { maxAgeSec: 24 * 60 * 60 }),
    },
  });
};
