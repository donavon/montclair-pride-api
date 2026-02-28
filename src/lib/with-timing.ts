import { AsyncLocalStorage } from "node:async_hooks";
import { AppConfig } from "./types"; // Assuming AppConfig is in your types file
import { Logger } from "./logger";

const timingStorage = new AsyncLocalStorage<Map<string, number>>();
function track(label: string, startTime: number): void {
  const store = timingStorage.getStore();
  if (store) {
    const duration = performance.now() - startTime;
    const existing = store.get(label) || 0;
    store.set(label, existing + duration);
  }
}

/**
 * Define the standard handler shape to avoid 'any'
 */
type Handler<T = AppConfig> = (
  request: Request,
  config: T,
  ctx: ExecutionContext
) => Promise<Response>;

/**
 * Wraps a handler with timing information.
 *
 * This function will measure the duration of the handler's execution,
 * as well as any nested timing measurements. The measurements
 * are logged as a "Server-Timing" header in the response.
 * The format of the header is:
 *   label;dur=XX.XX,label;dur=XX.XX,...
 *
 * @param handler The handler to wrap with timing information.
 * @returns A new handler that wraps the original handler with timing information.
 */
export function withTiming<T extends AppConfig>(
  handler: Handler<T>
): Handler<T> {
  return async (
    request: Request,
    config: T,
    ctx: ExecutionContext
  ): Promise<Response> => {
    const timings = new Map<string, number>();
    const start = performance.now();

    const log = new Logger(config.LOG_LEVEL, "timing");

    // Execute the handler within the AsyncLocalStorage context
    const response = await timingStorage.run(timings, () =>
      handler(request, config, ctx)
    );

    const total = performance.now() - start;

    const entries = Array.from(timings).map(([label, dur]) => ({
      label,
      dur: Number.parseFloat(dur.toFixed(2)),
      header: `${label};dur=${dur.toFixed(2)}`,
    }));

    const metricsHeader = [
      `total;dur=${total.toFixed(2)}`,
      ...entries.map(({ header }) => header),
    ].join(", ");

    const metricsObj = {
      total: Number.parseFloat(total.toFixed(2)),
      ...Object.fromEntries(entries.map(({ label, dur }) => [label, dur])),
    };
    if (response.status !== 404) {
      log.info("server-timing", metricsObj);
    }

    response.headers.set("Server-Timing", metricsHeader);
    return response;
  };
}

/**
 * Wraps a function (sync or async) and tracks its execution time.
 */
export async function measure<T>(
  label: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    track(label, start);
  }
}
