import type { Context } from "@netlify/functions";
import { getData } from "./get-data";

export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const isDev = searchParams.has("dev");
  const cacheControl = isDev
    ? // no cache during development
      "no-store"
    : // NOTE: Exact prod valies TBD
      "public, max-age=300, s-maxage=300";

  const data = await getData();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}
