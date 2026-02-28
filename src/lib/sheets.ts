import { z } from "zod";
import type {
  AppConfig,
  Performer,
  SheetData,
  Stage,
  StageKey,
  YearEvent,
} from "./types";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

type SheetName = "performers" | "stages" | "events" | "parking";

type BatchValueResponse = {
  valueRanges: { values: string[][] }[];
};

type SafeSchema<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false };
};

const EVENT_CATEGORIES = [
  "community",
  "fundraiser",
  "social",
  "pride",
  "education",
] as const;

const PERFORMER_CATEGORIES = [
  "music",
  "drag",
  "dance",
  "choir",
  "comedy",
  "dj",
  "theater",
  "kids",
  "other",
] as const;

const StageRowSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
  location: z.string().min(1),
  color: z.string().min(1),
  emcees: z.string(),
});

const EventRowSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(EVENT_CATEGORIES),
  time: z.string().optional(),
  link: z.string().optional(),
});

const ParkingRowSchema = z.object({
  name: z.string().min(1),
  walk: z.string().min(1),
  spaces: z.string().min(1),
});

function rowsToObjects(values: string[][]): Record<string, string>[] {
  const [headers, ...rows] = values;
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((key, i) => {
      obj[key] = row[i] ?? "";
    });
    return obj;
  });
}

function parseAndFilter<T>(
  tab: SheetName,
  schema: SafeSchema<T>,
  rows: Record<string, string>[]
): { data: T; rowIndex: number }[] {
  const results: { data: T; rowIndex: number }[] = [];
  rows.forEach((row, i) => {
    const result = schema.safeParse(row);
    if (result.success) {
      results.push({ data: result.data, rowIndex: i });
    } else {
      // eslint-disable-next-line no-console
      console.warn(`${tab}: ${i + 2}`);
    }
  });
  return results;
}

function parseStages(values: string[][]): Stage[] {
  return parseAndFilter("stages", StageRowSchema, rowsToObjects(values)).map(
    ({ data: row }) => ({
      id: row.key as StageKey,
      name: row.name,
      fullName: row.fullName,
      location: row.location,
      color: row.color,
      emcees: row.emcees
        .split(" | ")
        .map((s: string) => s.trim())
        .filter(Boolean),
    })
  );
}

function parsePerformers(
  values: string[][],
  validStageKeys: string[]
): Performer[] {
  if (validStageKeys.length === 0) return [];

  const PerformerRowSchema = z.object({
    name: z.string().min(1),
    stage: z.enum(validStageKeys as [string, ...string[]]),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    category: z.enum(PERFORMER_CATEGORIES),
    description: z.string().optional(),
    isHeadliner: z.string().optional(),
  });

  return parseAndFilter(
    "performers",
    PerformerRowSchema,
    rowsToObjects(values)
  ).map(({ data: row, rowIndex }) => {
    const performer: Performer = {
      id: String(rowIndex + 1),
      name: row.name,
      stage: row.stage as StageKey,
      startTime: row.startTime,
      endTime: row.endTime,
      category: row.category,
    };
    if (row.description) performer.description = row.description;
    if (row.isHeadliner === "TRUE") performer.isHeadliner = true;
    return performer;
  });
}

function parseEvents(values: string[][]): YearEvent[] {
  return parseAndFilter("events", EventRowSchema, rowsToObjects(values)).map(
    ({ data: row, rowIndex }) => {
      const event: YearEvent = {
        id: String(rowIndex + 1),
        title: row.title,
        date: row.date,
        location: row.location,
        description: row.description,
        category: row.category,
      };
      if (row.time) event.time = row.time;
      if (row.link) event.link = row.link;
      return event;
    }
  );
}

function parseParking(
  values: string[][]
): { name: string; walk: string; spaces: string }[] {
  return parseAndFilter("parking", ParkingRowSchema, rowsToObjects(values)).map(
    ({ data }) => data
  );
}

export async function fetchSheetData(config: AppConfig): Promise<SheetData> {
  const { GOOGLE_SHEETS_API_KEY, GOOGLE_SHEET_ID } = config;

  const sheetNames: SheetName[] = ["performers", "stages", "events", "parking"];
  const ranges = sheetNames.map((s) => `ranges=${s}`).join("&");

  const url = `${SHEETS_BASE}/${GOOGLE_SHEET_ID}/values:batchGet?${ranges}&key=${GOOGLE_SHEETS_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Sheets API error: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as BatchValueResponse;
  const [perfValues, stageValues, eventValues, parkingValues] =
    body.valueRanges.map((r) => r.values);

  const stages = parseStages(stageValues);
  const validStageKeys = stages.map((s) => s.id);

  return {
    performers: parsePerformers(perfValues, validStageKeys),
    stages,
    events: parseEvents(eventValues),
    parking: parseParking(parkingValues),
  };
}
