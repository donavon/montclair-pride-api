export async function generateETag(json: string) {
  const msgUint8 = new TextEncoder().encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `"${hash}"`;
}
