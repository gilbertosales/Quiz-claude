# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A True/False quiz web app about Claude Code for internal training: 20 questions (5 per level, fixed order `negocio` → `basico` → `intermediario` → `avancado`) drawn from a 60-question bank, immediate feedback with a docs link, and a global leaderboard in Supabase. **`.claude/prd.md` is the source of truth** for requirements (RF01–RF18, RNF01–RNF08) and acceptance criteria (§10). All UI copy is **pt-BR**.

## Commands

```bash
npm run dev            # Vite dev server
npm run build          # tsc -b && vite build → dist/
npm run typecheck      # tsc -b
npm run lint           # oxlint (react, jsx-a11y, vitest plugins), config in .oxlintrc.json
npm run format         # prettier
npm test               # vitest run (unit + RTL integration, jsdom)
npm run test:e2e       # playwright (builds to dist-e2e with a fake Supabase URL, desktop + 360px projects)

npx vitest run src/features/quiz/scoring.test.ts   # single unit test file
npx vitest run -t "fila de reenvio"                 # by test name
npx playwright test -g "retoma a partida" --project=desktop
```

The toolchain uses TypeScript 7 (native), so lint is **oxlint** rather than the ESLint the PRD names, because typescript-eslint doesn't support TS 7.

## Architecture

- **Quiz state machine**: `src/features/quiz/quizReducer.ts` is a pure reducer: `idle → identifying → playing → feedback → [levelTransition] → … → finished → submitting → done | submitError`. Impure inputs (`now`, drawn `questions`, `gameId`) are passed in actions so the reducer stays testable. `QuizProvider` persists the whole state to `sessionStorage` and restores it via `RESTORE` in the lazy initializer (reload resumes the game). `features/quiz/persistence.ts` rejects inconsistent saved states (bad `index`, mismatched `answers`, phase/answer mismatch) instead of restoring them. A restored `submitting` becomes `submitError`.
- **Pages render by phase**: `QuizPage` redirects to `/resultado` once the phase is finished or later. `ResultPage`'s effect, on `finished`, records local history and submits. Pure logic lives in `draw.ts` (Fisher–Yates with injectable RNG) and `scoring.ts` (points 1/2/3/4, max 50).
- **Submission/retry queue** (`features/leaderboard/pending.ts`): every finished game is enqueued in `localStorage` _before_ sending and removed only on success or on a permanent error (`domain`, `invalid`). An in-flight map dedupes concurrent sends of the same `gameId` (StrictMode, plus `flushPending()` on app mount). The server is idempotent on `gameId` (`client_game_id`), so resending an already-stored game is safe. Error classification lives in `features/leaderboard/api.ts`.
- **Supabase**: `lib/supabase.ts` lazy-imports `supabase-js` (it stays out of the initial bundle) and resolves to `null` when env vars are missing. The front end uses only RPCs `submit_result` / `get_leaderboard`, and the tables have RLS with no policies (`supabase/migrations/0001_init.sql`). The email domain allowlist is enforced in **both** the front end (`VITE_ALLOWED_EMAIL_DOMAINS`, `features/identity/validation.ts`) and the DB (`allowed_domains` table). Keep them in sync.
- **Never key leaderboard lookups by email**: the anon key is public, so anything accepting an email would let anyone look up a colleague. `get_leaderboard` marks `is_me` only for best rows whose own id is in `p_result_ids`, the ids `submit_result` returned to this browser (`features/leaderboard/myResults.ts`). That way a forged submission under someone else's email reveals nothing about their real games.
- **SQL changes**: no Postgres/Docker locally. Validate the migration with PGlite (`@electric-sql/pglite`) before `supabase db push`. The original PRD SQL failed on an unquoted `position` in `RETURNS TABLE`.
- **Storage**: always go through `lib/storage.ts` (try/catch wrappers plus type guards); keys are in `STORAGE_KEYS`.
- **Question bank**: `src/data/questions.json`, validated only in tests (`questions.test.ts`: Zod schema, unique IDs, ≥5 per level, 30–70% True per level). Statements and explanations may contain `` `code` `` spans, rendered by `components/RichText.tsx`. Questions tagged `"revisar"` were rewritten for V/F balance and still need content review (listed in the README).
- **Styling**: Tailwind 4 via `@tailwindcss/vite`. Shared classes (`btn-primary`, `btn-secondary`, `card`, `link`) are `@utility` blocks in `src/index.css`. Dark mode follows `prefers-color-scheme`. Level colors live in `components/levels.ts` and must always be paired with a text label.

## Constraints

- WCAG 2.1 AA: fully keyboard-playable (`V`/`F`/`←`/`→` answer, `Enter` next, handled in `QuestionCard`), `aria-live` feedback, focus moved on question change/answer, `motion-safe` animations ≤200ms.
- Mobile-first from 360px with no horizontal scroll (an E2E test checks this); initial bundle < 200 KB gzip.
- Emails must never be rendered for other people; the leaderboard shows names only.
