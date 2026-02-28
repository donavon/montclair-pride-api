import type { Route } from "./types";

export function getRoute(routes: Route[], request: Request) {
  const { pathname } = new URL(request.url);

  for (const { path, handler } of routes) {
    if (pathname === path) return handler;
  }
}
