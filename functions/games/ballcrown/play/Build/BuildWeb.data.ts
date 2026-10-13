import manifest from "./transport-manifest.json";
import { createBallcrownTransport } from "../../../../../scripts/lib/ballcrown-transport.mjs";

const serve = createBallcrownTransport(manifest);

export const onRequest = ({ request, env }: {
  request: Request;
  env: { ASSETS: { fetch(request: Request): Promise<Response> } };
}) => serve(request, env.ASSETS);
