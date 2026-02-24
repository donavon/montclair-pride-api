# Master Agent Protocol: Netlify & Ox Stack (API)

## 🧠 Hybrid Memory & Repository Hygiene

- **Core Context:** `memory_bank.md` is the source of truth for high-level architecture, tech stack (Ox Stack/Netlify), and system patterns. Update this ONLY for global changes.
- **Task Persistence:** When a feature/task is finished, create a new file in `plans/completed/<feature-name>.md`.
- **Conflict Prevention:** Never edit a file in `plans/completed/` created by another developer. Always create a NEW uniquely named file for your specific task to avoid Git merge conflicts.
- **Transient Files:** Any files in the root of `/plans/` (except the `completed/` folder) are scratchpads. Verify they are git-ignored before creating them.
- **Session Start (The Bootstrap):** Your first action in a new chat MUST be to read `memory_bank.md`. Then, check `netlify.toml` and the `/netlify/functions` directory to sync with the current routing state.

## 🚫 Anti-Hallucination & Tooling Protocol (STRICT)

- **No Guessing:** You have a documented tendency to hallucinate package names. **Prohibited:** Never "invent" package names, CLI flags, or file paths.
- **No Self-Installation:** Never run `npm install` or `npx` to fetch new tools without explicit permission.
- **Cleanup Protocol:** After EVERY file modification, execute exactly: `npm run fix`.
- **Linting & Code Style:** You must strictly adhere to the rules defined in `.oxlintrc.json`.
- **Validation Loop:** After running `npm run fix`, verify compliance by running `npm run lint`.
- **Stop on Failure:** If a command fails once, **STOP.** Do not try variations or "guesses." Report the terminal output and ask for the correct project script.
- **Verify Before Thinking:** If you are unsure of a command, read `package.json` first. This is cheaper than a failed execution turn.

## 💰 Efficiency & Cost Control (Pay-As-You-Go)

- **Session Management:** Once a specific feature is verified and task summary is written to `plans/completed/`, prompt the user to "Start a New Task."
- **Three-Strike Rule:** If any command fails 3 times, **STOP.** Do not burn tokens in a loop. Ask for a hint.
- **Architect Mode:** Use for planning ONLY. Propose a plan in Markdown first. Wait for a "Go" before writing code.
- **Concision:** Do not explain basic code or add obvious comments. Skip the conversational fluff.

## 🛠️ Execution & Safety

- **Dirty Buffer Awareness:** Before writing, verify if a file has unsaved changes. **DO NOT OVERWRITE** manual edits made since your last turn. Ask to merge first.
- **Diff Preference:** Prefer applying targeted diffs/edits via the VS Code API over rewriting entire files to the filesystem.
- **Path Aliases:** Always use `~/...` aliases mapping to the root `/netlify` directory.

## 🏗️ Architecture & Logic

- **Routing Pattern:** Use the directory-based structure: `/netlify/functions/{route-name}/index.ts`.
- **Redirect Configuration:** Every new route MUST be added to `netlify.toml` using a 200 rewrite: `from = "/{route-name}"` to `to = "/.netlify/functions/{route-name}"` with `force = true`.
- **Serverless Handlers:** Every route must use a default export: `export default async function handler(req: Request, context: Context)`.
- **Module Design:** Use `const` over `let`. Use `type` over `interface`. Double quotes for strings. Prefer `function` declarations for top-level logic.
- **Logic Boundaries:** Functions are entry points.
  - **Local Logic:** Colocate business logic/validation in the route folder (e.g., `/netlify/functions/{name}/utils.ts`).
  - **Shared Logic:** Use `~/services` or `~/lib` ONLY for logic used by multiple functions.
- **Type Imports:** Use `import type { ... }` for better runtime erasure.
- **Environment Variables:** Access via the global `Netlify.env.get("KEY")` rather than `process.env`.
- **Statelessness:** Remember that Functions are ephemeral. Use external stores (Redis/DB) for state.
- **Response Safety:** Use standard Web `Response` objects. Ensure appropriate HTTP status codes and JSON headers.
