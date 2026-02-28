import { handleDataRequest } from "./handlers/pride-data";
import { getRoute } from "./lib/get-route";
import { withCache } from "./lib/with-cache";
import { withConfig } from "./lib/with-config";
import { ConfiguredHandler, Route } from "./lib/types";
import { withTiming } from "./lib/with-timing";

const routes: Route[] = [
  { path: "/api/v1/pride-data", handler: withCache(handleDataRequest) },
];

const app: ConfiguredHandler = async (request, config, ctx) => {
  const handler = getRoute(routes, request);

  if (!handler) return new Response("Not Found", { status: 404 });

  const response = await handler(request, config, ctx);

  return response;
};

// Wrap it and export it
export default withConfig(withTiming(app));
