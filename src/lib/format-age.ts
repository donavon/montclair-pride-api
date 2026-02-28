/**
 * Converts seconds into a human-readable "1m 30s" or "30s" string.
 */
export function formatAge(seconds: number): string {
  if (seconds <= 0) return "0s";

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
