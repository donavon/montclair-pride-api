import { measure } from "./with-timing";
import { formatAge } from "./format-age";
import { Logger } from "./logger";
import { AppConfig } from "./types";

const X_PRIDE = "Made with PRIDE by Keen";

type CacheHandler = (
  request: Request,
  config: AppConfig,
  ctx: ExecutionContext
) => Promise<Response>;

type CacheContext = {
  handler: CacheHandler;
  cache: Cache;
  cacheKey: Request;
  request: Request;
  config: AppConfig;
  ctx: ExecutionContext;
  log: Logger;
  startTime: number;
};

export function withCache(handler: CacheHandler) {
  return async (request: Request, config: AppConfig, ctx: ExecutionContext) => {
    const log = new Logger(config.LOG_LEVEL, "cache");
    const startTime = Date.now();

    const cache = caches.default;
    const { pathname, searchParams } = new URL(request.url);

    // Define a consistent internal hostname for the cache key
    const cacheKeyUrl = new URL(request.url);
    cacheKeyUrl.hostname = "cache.internal";
    cacheKeyUrl.protocol = "https";
    cacheKeyUrl.port = "";

    // Add the code version ID to the cache key so that the cache is invalidated
    // if new code is executed. This is important so we don't serve stale data.
    cacheKeyUrl.searchParams.set("vid", config.CF_VERSION_METADATA.id);

    // Now, no matter if it's localhost or ngrok, the key is ALWAYS:
    // https://cache.internal/api/v1/pride-data?cv=...
    const cacheKey = new Request(cacheKeyUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const isRefresh = searchParams.get("refresh") === config.ADMIN_KEY;

    const cacheCtx: CacheContext = {
      handler,
      cache,
      cacheKey,
      request,
      config,
      ctx,
      log,
      startTime,
    };

    if (isRefresh) {
      log.warn(`Refresh secret detected. Bypassing cache for: ${pathname} ⚡`);
    } else {
      const cachedResponse = await measure("cache_lookup", () =>
        cache.match(cacheKey)
      );

      if (cachedResponse) {
        const isStaleData = isStale(cachedResponse, config.S_MAXAGE);
        const serverEtag = cachedResponse.headers
          .get("ETag")
          ?.replace(/^W\//, "");
        const clientEtag = request.headers
          .get("if-none-match")
          ?.replace(/^W\//, "");
        const isMatch = !!(
          clientEtag &&
          serverEtag &&
          clientEtag === serverEtag
        );

        if (isStaleData) {
          log.info(`Data is stale. Triggering background refresh... 🔄`);
          ctx.waitUntil(fetchAndCache(cacheCtx, "origin_revalidate"));
        }

        // 2. THE SILENCER: If the ETag matches, return 304 IMMEDIATELY.
        // Even if it's stale, we don't send the body.
        if (isMatch) {
          log.info(`304 HIT (Silent SWR): ${pathname}`);
          const response = new Response(null, {
            status: 304,
            headers: cachedResponse.headers,
          });
          addHeaders({ response, hitOrMiss: "HIT", config });
          return response;
        }

        // 3. If no match (new phone/cleared cache), send the full body
        log.info(`200 HIT: ${pathname}`);
        const response = new Response(cachedResponse.body, {
          status: 200,
          headers: cachedResponse.headers,
        });
        addHeaders({ response, hitOrMiss: "HIT", config });
        return response;
      }
    }

    log.info(
      isRefresh
        ? "Forcing fresh fetch..."
        : "Cache MISS. Running handler... 💻 🛜"
    );
    return fetchAndCache(cacheCtx, "origin_fetch");
  };
}

function isStale(response: Response, ttlSeconds: number): boolean {
  const dateHeader = response.headers.get("Date");
  if (!dateHeader) return true;
  const ageInSeconds = (Date.now() - new Date(dateHeader).getTime()) / 1000;
  return ageInSeconds > ttlSeconds;
}

type AddHeaders = {
  response: Response;
  hitOrMiss: "HIT" | "MISS";
  config: AppConfig;
};

function addHeaders({ response, hitOrMiss, config }: AddHeaders) {
  const metadata = config.CF_VERSION_METADATA;
  response.headers.set("Vary", "Origin");
  response.headers.set("x-cache", hitOrMiss);
  response.headers.set("x-pride", X_PRIDE);

  const isProduction = config.ENVIRONMENT === "production";
  const isCacheable = response.status === 200 || response.status === 304;

  if (!response.headers.has("Cache-Control")) {
    response.headers.set(
      "Cache-Control",
      `public, s-maxage=${config.S_MAXAGE}, stale-while-revalidate=${config.SWR_TTL}`
    );
  }
  if (!response.headers.has("Cache-Control")) {
    if (isCacheable) {
      const browserMaxAge = isProduction ? config.S_MAXAGE : 0;
      const sMaxAge = config.S_MAXAGE;
      const swrTtl = config.SWR_TTL;

      response.headers.set(
        "Cache-Control",
        `public, max-age=${browserMaxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swrTtl}`
      );

      if (hitOrMiss === "HIT") {
        const dateHeader = response.headers.get("Date");
        if (dateHeader) {
          const age = Math.floor(
            (Date.now() - new Date(dateHeader).getTime()) / 1000
          );
          response.headers.set("x-pride-data-age", formatAge(age));
        }
      }
    } else {
      // Error path: Do NOT cache failures
      // no-store: Don't save it
      // no-cache: Revalidate every time
      // private: Don't let the CDN save it
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );
    }
  }

  response.headers.set("X-Pride-Version-ID", metadata.id);
  response.headers.set("X-Pride-Version-Tag", metadata.tag);
  response.headers.set("X-Pride-Version-Timestamp", metadata.timestamp);
}

async function fetchAndCache(
  ctx: CacheContext,
  type: "origin_fetch" | "origin_revalidate"
): Promise<Response> {
  const {
    handler,
    cache,
    cacheKey,
    request,
    config,
    log,
    ctx: executionCtx,
  } = ctx;

  try {
    const response = await measure(type, () =>
      handler(request, config, executionCtx)
    );
    addHeaders({ response, hitOrMiss: "MISS", config });

    // Background the cache update so we don't hold up the response
    executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

    log.info(`${type} success ✅`);
    return response;
  } catch (exception) {
    log.error(`${type} failed ❌:`, exception);

    // Return the branded error response
    const errorResponse = new Response(
      JSON.stringify({
        error: "Service Unavailable",
        message:
          "We're having trouble reaching our data source. Please try again shortly.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );

    // Ensure even the error response has your branding headers
    addHeaders({ response: errorResponse, hitOrMiss: "MISS", config });

    return errorResponse;
  }
}
