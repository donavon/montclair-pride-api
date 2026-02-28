import { envSchema } from "./types";
import type { AppConfig } from "./types";

let configCache: AppConfig | null = null;

export let getValidatedConfig = validatedConfig;

function cachedValidatedConfig(): AppConfig {
  // If we got here, the pointer was swapped.
  // We use the "!" to tell TS: "Trust me, I'm a professional."
  return configCache!;
}

function validatedConfig(env: unknown): AppConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errorMsg = `❌ Env Validation Failed: ${result.error.issues.map((i) => i.path).join(", ")}`;
    // oxlint-disable-next-line no-console
    console.error(errorMsg, result.error.format());
    throw new Error(errorMsg);
  }

  const validated: AppConfig = Object.freeze(result.data);

  getValidatedConfig = cachedValidatedConfig;
  configCache = validated;
  return configCache;
}
