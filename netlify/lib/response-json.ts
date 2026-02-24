import crypto from "node:crypto";

import { JsonValue } from "type-fest";

export async function responseJson(data: JsonValue, request: Request) {
  const { searchParams } = new URL(request.url);
  const isDev = searchParams.has("dev");
  const cacheControl = isDev
    ? "no-cache" // Revalidate with server before using cache
    : // Cache on CDN for 1hr (the longest the client would wait id the data changes),
      // allow serving stale for 1 day while revalidating.
      // Browser caches for 5 minutes.
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

  const body = JSON.stringify(data);
  const etag = `"${crypto.createHash("sha256").update(body).digest("hex")}"`;

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        "Cache-Control": cacheControl,
        ETag: etag,
      },
    });
  }

  // Data has changed or no ETag was provided, return new data
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      ETag: etag,
    },
  });
}
