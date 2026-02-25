# Memory Bank — montclair-pride-api

> Source of truth for high-level architecture, tech stack, and system patterns.
> Update ONLY for global changes. Last audited: 2026-02-24 — clean, all discrepancies resolved.

---

## Project Identity

- **Name:** montclair-pride-api
- **Purpose:** Serverless REST API serving event, performer, stage, and parking data for Montclair Pride 2026.
- **Deployed on:** Netlify (Functions + CDN)
- **Node version:** 22 (`.nvmrc` + `[build.environment]` in `netlify.toml`)

---

## Tech Stack (Ox Stack)

| Tool       | Package                                  | Config file                |
| ---------- | ---------------------------------------- | -------------------------- |
| Runtime    | Node 22 / Netlify Functions              | `netlify.toml`             |
| Language   | TypeScript 5.9                           | `tsconfig.json`            |
| Linter     | **oxlint** 1.48                          | `.oxlintrc.json`           |
| Formatter  | **oxfmt** 0.33                           | `.oxfmtrc.json`            |
| Bundler    | esbuild (via Netlify)                    | `netlify.toml [functions]` |
| Validation | zod 4                                    | `package.json`             |
| Type defs  | `@netlify/functions` 5, `@types/node` 25 | `tsconfig.json`            |

**No ESLint. No Prettier. No Babel. No Webpack.** The project uses the Ox toolchain exclusively.

---

## NPM Scripts

| Script              | Command                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `npm run dev`       | `netlify dev` (local dev server on port 8887)                          |
| `npm run build`     | `tsc -p tsconfig.json`                                                 |
| `npm run lint`      | `oxlint --deny-warnings .`                                             |
| `npm run lint:fix`  | `oxlint --fix .`                                                       |
| `npm run format`    | `oxfmt .`                                                              |
| `npm run fix`       | `npm run format && npm run lint:fix` ← **run after every file change** |
| `npm run typecheck` | `tsc`                                                                  |
| `npm run ci`        | lint + format:check + typecheck                                        |

---

## Directory Structure

```
/
├── netlify/
│   └── functions/
│       └── v1/                  ← route folder
│           ├── index.ts         ← handler entry point
│           ├── get-data.ts      ← colocated business logic
│           └── mock-data.ts     ← colocated mock data / type definitions
├── public/
│   └── index.html               ← static landing page
├── plans/
│   └── completed/               ← task summaries (tracked); scratchpad root is git-ignored
├── memory_bank.md               ← this file
├── netlify.toml
├── tsconfig.json
├── package.json
├── .oxlintrc.json
├── .oxfmtrc.json
├── .nvmrc
└── .gitignore
```

---

## Path Aliases

`tsconfig.json` maps `~/*` → `./netlify/*`.

- `~/functions/v1/...` resolves to `./netlify/functions/v1/...`
- `~/services/...` resolves to `./netlify/services/...` (reserved for shared logic)
- `~/lib/...` resolves to `./netlify/lib/...` (reserved for shared utilities)
- Use `~/` for cross-folder imports only. Same-folder relative imports (e.g., `./get-data`) are acceptable and preferred within a route folder.

---

## Routing Registry

| Public URL | Netlify function         | Status              |
| ---------- | ------------------------ | ------------------- |
| `/v1`      | `/.netlify/functions/v1` | ✅ Live (mock data) |

### `netlify.toml` redirect pattern (required for every new route):

```toml
[[redirects]]
from = "/{route-name}"
to = "/.netlify/functions/{route-name}"
status = 200
force = true
```

---

## Handler Contract

Every route `index.ts` must use:

```typescript
import type { Context } from "@netlify/functions";

// If context is unused, prefix with _ to satisfy the no-unused-vars lint rule.
export default async function handler(
  req: Request,
  _context: Context
): Promise<Response> {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
```

- Default export, named `handler`.
- Always declare both `req` and `_context` (or `context`) — omitting the second param diverges from the contract.
- Standard Web `Request`/`Response` objects.
- Env vars via `Netlify.env.get("KEY")` — **never** `process.env`.
- Functions are stateless/ephemeral; no in-memory state between invocations.

---

## Data Model (v1 endpoint)

Response shape of `GET /v1`:

```typescript
{
  events: YearEvent[];      // community/fundraiser/social/pride/education events
  performers: Performer[];  // per-stage schedule with startTime/endTime "HH:MM"
  stages: Stage[];          // main | schoolofrock | opencall
  parking: { name, walk, spaces }[];
}
```

Key types live in `netlify/functions/v1/mock-data.ts`. Real data source is TBD (will replace `getData()` in `get-data.ts`).

---

## Git / Plans Hygiene

- `/plans/*` (root scratchpads) are **git-ignored**.
- `/plans/completed/` is **tracked**. Write one file per completed task.
- Never edit another developer's completed plan file.
- `memory_bank.md` is tracked and is the source of truth for global state.

---

## Code Style Rules

- `const` over `let`; `type` over `interface`
- Double quotes for strings
- `function` declarations for top-level logic; arrow functions for callbacks
- `import type { ... }` for type-only imports
- Max 3 function parameters (`max-params` lint rule)
- No `console.log` in production code (`no-console: warn`)
- No relative parent imports (`import/no-relative-parent-imports: error`)
