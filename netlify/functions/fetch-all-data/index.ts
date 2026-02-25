// oxlint-disable no-console
import type { Context } from "@netlify/functions";
import { responseJson } from "~/lib/response-json";
import { fetchSheetData } from "./sheets";

export default async function handler(
  request: Request,
  context: Context,
): Promise<Response> {
  const { pathname, search } = new URL(request.url);
  const path = `${pathname}${search}`;
  const ua = request.headers.get("user-agent");
  const ip = context.ip;
  const method = request.method;
  console.log({ ip, method, path, ua });

  const data = await fetchSheetData();

  return responseJson(data, request);
}
