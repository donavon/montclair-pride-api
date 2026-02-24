// oxlint-disable no-console
import type { Context } from "@netlify/functions";
import { getData } from "./get-data";
import { responseJson } from "~/lib/response-json";

export default async function handler(
  request: Request,
  context: Context,
): Promise<Response> {
  const { pathname } = new URL(request.url);

  const ua = request.headers.get("user-agent");
  const who = request.headers.get("x-who");
  const ip = context.ip;
  const method = request.method;
  console.log({ ip, method, pathname, who, ua });

  const data = await getData();

  return responseJson(data, request);
}
