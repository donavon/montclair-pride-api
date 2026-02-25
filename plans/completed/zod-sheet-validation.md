# Task: Zod Row Validation for Google Sheets Data

**Completed:** 2026-02-24

## What Changed

`netlify/functions/v1/sheets.ts` — added Zod validation to all four sheet parsers.

## Design

- `SafeSchema<T>` — structural type for any Zod schema's `safeParse`, avoids importing internal Zod types and keeps the generic constraint clean.
- `parseAndFilter(tab, schema, rows)` — single shared filter/log helper. On failure, logs `${tab}: ${rowNum}` via `console.warn` (suppressed from lint with `eslint-disable-next-line no-console`). Row number is 1-indexed spreadsheet row (data starts at row 2).
- Schemas live at module scope as `const`: `StageRowSchema`, `EventRowSchema`, `ParkingRowSchema`. `PerformerRowSchema` is constructed inside `parsePerformers` because its `stage` enum is dynamic.
- `parseStages` runs first; its `.id` values become `validStageKeys` which are fed to `parsePerformers`. If no stages parse cleanly, `parsePerformers` returns `[]` immediately.
- Optional sheet columns (`time`, `link`, `description`, `isHeadliner`) use `.optional()` so missing columns don't invalidate the entire row.
- Required string columns use `.min(1)` so blank cells are caught.
- `category` fields on both events and performers validated against the exact union from `types.ts`.

## Schemas

| Tab        | Required fields validated            | Enum validated                        |
| ---------- | ------------------------------------ | ------------------------------------- |
| stages     | key, name, fullName, location, color | —                                     |
| performers | name, stage, startTime, endTime      | category, stage (against live stages) |
| events     | title, date, location, description   | category                              |
| parking    | name, walk, spaces                   | —                                     |
