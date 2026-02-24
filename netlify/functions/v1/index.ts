import type { Context } from "@netlify/functions";
import { getData } from "./get-data";
import { responseJson } from "~/lib/response-json";

export default async function handler(
  request: Request,
  _context: Context,
): Promise<Response> {
  const data = await getData();

  return responseJson(data, request);
}
