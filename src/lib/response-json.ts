import { JsonValue } from "type-fest";
import { generateETag } from "./generate-etag";

export async function responseJson(data: JsonValue) {
  const json = JSON.stringify(data);
  const etag = await generateETag(json);

  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    ETag: etag,
  });

  return new Response(json, { status: 200, headers });
}
