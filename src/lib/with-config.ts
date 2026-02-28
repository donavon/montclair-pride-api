import { Logger } from "./logger";
import { ConfiguredHandler } from "./types";
import { getValidatedConfig } from "./validate-env";

/**
 * Wraps a Cloudflare Worker handler with environment variable validation.
 * Replaces the `env` parameter of the handler with a validated `AppConfig` object.
 */
export function withConfig(handler: ConfiguredHandler) {
  return {
    async fetch(
      request: Request,
      env: unknown,
      ctx: ExecutionContext
    ): Promise<Response> {
      const config = getValidatedConfig(env);

      Logger.configure(config);

      return handler(request, config, ctx);
    },
  };
}
