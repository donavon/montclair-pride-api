import { z } from "zod";
import { AppConfig } from "./types";

const LOG_LEVELS = ["debug", "info", "warn", "error", "none"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

export const logLevelSchema = z.enum(LOG_LEVELS);

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

export class Logger {
  private static config: AppConfig;

  // Static configuration called once per request
  static configure(config: AppConfig) {
    this.config = config;
  }

  private priority: number;
  private prefix: string;

  constructor(level: LogLevel = "info", prefix = "PRIDE") {
    this.priority = LEVEL_PRIORITY[level];
    this.prefix = prefix;

    if (!Logger.config) {
      throw new Error("Logger must be configured before use");
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= this.priority;
  }

  private log(level: LogLevelSansNone, msg: string, ...args: unknown[]) {
    const isProd = Logger.config.ENVIRONMENT === "production";

    const logObject = {
      t: new Date().toISOString(),
      lvl: level,
      pre: this.prefix,
      msg,
      ...(args.length > 0
        ? { meta: args.map((arg) => formatForJson(arg)) }
        : {}),
    };

    // 3. For local Wrangler dev, the string is still nicer.
    // For production, we want JSON.
    if (isProd) {
      console[level](JSON.stringify(logObject));
    } else {
      const cleanArgs = args.flatMap((arg) => formatArg(arg, level));
      console[level](`[${this.prefix}:${level}] ${msg}`, ...cleanArgs);
    }
  }

  debug(msg: string, ...args: unknown[]) {
    const level = "debug";
    if (this.shouldLog(level)) this.log(level, msg, ...args);
  }

  info(msg: string, ...args: unknown[]) {
    const level = "info";
    if (this.shouldLog(level)) this.log(level, msg, ...args);
  }

  warn(msg: string, ...args: unknown[]) {
    const level = "warn";
    if (this.shouldLog(level)) this.log(level, msg, ...args);
  }

  error(msg: string, ...args: unknown[]) {
    const level = "error";
    if (this.shouldLog(level)) this.log(level, msg, ...args);
  }
}

type LogLevelSansNone = Exclude<LogLevel, "none">;

/**
 * Processes arguments into a log-friendly format.
 */
function formatArg(arg: unknown, level: LogLevelSansNone): unknown[] {
  if (arg instanceof Error) {
    const output = [`${arg.name}: ${arg.message}`];
    if (level === "error" && arg.stack) {
      output.push(arg.stack); // Stack trace becomes its own argument (new line)
    }
    return output;
  }

  if (arg instanceof Response) {
    return [`(${arg.status})`, arg.url];
  }

  if (typeof arg === "object" && arg !== null && !Array.isArray(arg)) {
    // Turn { total: 526, cache: 10 } into "total=526, cache=10"
    return [
      Object.entries(arg)
        .map(([k, v]) => `${k}=${v}`)
        .join(", "),
    ];
  }

  return [arg];
}

function formatForJson(arg: unknown): unknown {
  if (arg instanceof Error) {
    return { name: arg.name, message: arg.message, stack: arg.stack };
  }
  if (arg instanceof Response) {
    return { status: arg.status, url: arg.url, statusText: arg.statusText };
  }
  return arg;
}
