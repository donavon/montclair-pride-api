# Master Agent Protocol: Cloudflare Workers & Ox Stack (API)

## 🧠 Memory & Repository Hygiene

- **Core Context:** `memory_bank.md` is the source of truth for high-level architecture, the Cloudflare/worker runtime, and system patterns. Update this ONLY for global changes.
- **Task Persistence:** When a feature/task is finished, document it in `plans/completed/<feature-name>.md`.
- **Conflict Prevention:** Never edit a file in `plans/completed/` created by another developer. Always create a NEW uniquely named file for your specific task.
- **Session Start (The Bootstrap):** Your first action in a new chat MUST be to read `memory_bank.md`. Then, verify the current `wrangler.toml` and `worker-configuration.d.ts` to sync with the active environment bindings.

## 🚫 Anti-Hallucination & Tooling Protocol (STRICT)

- **No Guessing:** You have a documented tendency to hallucinate package names. **Prohibited:** Never "invent" package names, CLI flags, or file paths.
- **Wrangler Type Generation:** If you modify `wrangler.toml` or environment bindings, you MUST run `npm run types` (or `npx wrangler types`) to sync global type definitions.
- **Cleanup Protocol:** After EVERY file modification, execute exactly: `npm run fix`.
- **Validation Loop:** After running `npm run fix`, verify compliance by running `npm run typecheck` and `npm run lint`.
- **Stop on Failure:** If a command fails once, **STOP.** Do not try variations. Report terminal output and ask for the correct project script.

## 🏗️ Architecture & Logic (Cloudflare-Specific)

- **The "Switcheroo" Pattern:** All environment validation happens in `lib/validate-env.ts`.
  - Logic MUST use the function-pointer swap: `getValidatedConfig` re-assigns itself to a cached return after the first successful Zod parse.
- **Routing Pattern:** Use the centralized `routes` array. Do not use directory-based routing.
- **Bootloader:** The entry point `src/cloudflare-worker.ts` MUST use the `withConfig` wrapper to inject the validated `AppConfig`.
- **Module Design:**
  - Use `const` over `let` (except for the validation pointer swap).
  - Use `type` over `interface`.
  - Prefer `function` declarations for top-level logic.
  - Use `import type { ... }` for Cloudflare-specific types (`ExecutionContext`, `Request`, etc.) to ensure clean runtime erasure.
- **Environment Variables:** Access via the validated `config` object passed to handlers. Do not use `process.env`.
- **Statelessness & Persistence:** Workers are ephemeral. Use the Newark Edge Cache (via `withCache`) or external stores for state.

## 💰 Efficiency & Cost Control

- **Session Management:** Once a specific feature is verified, prompt the user to "Start a New Task."
- **Three-Strike Rule:** If any command fails 3 times, **STOP.** Do not burn tokens in a loop. Ask for a hint.
- **Architect Mode:** Use for planning ONLY. Propose a plan in Markdown first. Wait for a "Go" before writing code.
- **Concision:** Do not explain basic code or add obvious comments. Skip the conversational fluff.

## 🛠️ Execution & Safety

- **Wrangler Dev:** Use `npm run dev` for local testing. It automatically loads `.dev.vars`.
- **Diff Preference:** Prefer applying targeted diffs/edits via the VS Code API over rewriting entire files.
- **No Global Leakage:** Ensure `ExecutionContext.waitUntil` is used for non-blocking tasks (like logging or analytics) to prevent prematurely killing the isolate.
- **Standard Library:** Use Web Standard APIs (Fetch, Crypto, Streams). Avoid Node.js built-ins unless `nodejs_compat` is explicitly required.
