import { z } from "zod";
import { logLevelSchema } from "./logger";

// 1. The Source of Truth
export const envSchema = z.object({
  // secrets
  GOOGLE_SHEETS_API_KEY: z.string().min(1),
  ADMIN_KEY: z.string().min(1),
  // non-secrets
  GOOGLE_SHEET_ID: z.string().min(1),
  S_MAXAGE: z.coerce.number(),
  SWR_TTL: z.coerce.number(),
  LOG_LEVEL: logLevelSchema,
  ENVIRONMENT: z.enum(["development", "staging", "production"]),
  // metadata
  CF_VERSION_METADATA: z.object({
    id: z.string().min(1),
    tag: z.string(),
    timestamp: z.string().min(1),
  }),
});

export type AppConfig = Readonly<z.infer<typeof envSchema>>;

export type ConfiguredHandler = (
  request: Request,
  config: AppConfig,
  ctx: ExecutionContext
) => Promise<Response>;

export type StageKey = "main" | "schoolofrock" | "opencall";

export type Performer = {
  id: string;
  name: string;
  stage: StageKey;
  startTime: string; // "12:00"
  endTime: string;
  category:
    | "music"
    | "drag"
    | "dance"
    | "choir"
    | "comedy"
    | "dj"
    | "theater"
    | "kids"
    | "other";
  description?: string;
  isHeadliner?: boolean;
  isFavorited?: boolean;
};

export type Stage = {
  id: StageKey;
  name: string;
  fullName: string;
  location: string;
  color: string;
  emcees: string[];
};

export type YearEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  category: "community" | "fundraiser" | "social" | "pride" | "education";
  link?: string;
};

export type SheetData = {
  performers: Performer[];
  stages: Stage[];
  events: YearEvent[];
  parking: {
    name: string;
    walk: string;
    spaces: string;
  }[];
};

export type RouteHandler = (
  request: Request,
  env: AppConfig,
  ctx: ExecutionContext
) => Promise<Response>;

export type Route = {
  path: string;
  handler: RouteHandler;
};
