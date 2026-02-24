export const onRequest: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const room = url.searchParams.get("room") || "main";

  const id = env.LOBBY_ROOMS.idFromName(room);
  const stub = env.LOBBY_ROOMS.get(id);

  return stub.fetch(request);
};
