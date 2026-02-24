import { Env } from "../_lib/auth";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const roomId = new URL(request.url).searchParams.get("room") || "main";

  const id = env.LOBBY_ROOMS.idFromName(roomId);
  const stub = env.LOBBY_ROOMS.get(id);

  return stub.fetch(request);
};
