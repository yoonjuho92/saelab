# Copilot Instructions for saelab

## Big Picture

- Interactive storytelling app (Korean UI) using Next.js 16 App Router + React 19 + Tailwind 4. Sketch/hand-drawn look via RoughJS. Guide character: "룩말".
- Client-heavy: most components/pages use hooks — add "use client" for interactivity.
- Multi-day curriculum: Day 1 (localStorage-based) is onboarding; Day 2+ require auth and use Supabase for persistence.

## Architecture & Flow

- **Routes**: `app/page.tsx` (2-step home), `app/dashboard/*` (auth-protected hub), `app/day1/*` (localStorage), `app/day2/*` (story structure), `app/day3/*` (character creation), `app/day4/*`, `app/day5/*` (Supabase), `app/login/page.tsx` (Supabase Auth).
- **Global shell**: `app/layout.tsx` loads local font via `next/font/local` (NanumGimYuICe) and sets background image (`bg-[url('/bg.png')]`). Route transitions use `app/template.tsx` (`animate-fadeIn` from `app/globals.css`).
- **Day 1 flow**: `app/day1/context.tsx` provides `Day1Provider` storing `logline`, generated `stories` (3 frameworks: gulino/vogel/snider), `plotPoints`, and `extractedStructure` in `localStorage` with keys `day1_*`. Context hydrates on mount and persists changes automatically on every setter call.
- **Day 2+ flow**: `app/day2/context.tsx` and `app/day3/context.tsx` provide providers storing `logline`, `story`, `storyId` (and `character` in Day 3) in Supabase `story` table. Context loads from DB on mount (`isLoaded` flag prevents hydration mismatch). Methods: `loadStoryFromDB()`, `saveStoryToDB(storyToSave?, characterToSave?)`.
- **Data flow**: Client calls `POST /api/generate` → `app/api/generate/route.ts` formats prompts from `lib/prompts.yaml` (via `lib/promptLoader.ts`) → calls OpenAI Chat Completions (model: `gpt-4.1`) and returns text or parsed JSON.

## Authentication & Data Persistence

- **Supabase Auth**: `lib/supabase/client.ts` (client-side) and `lib/supabase/server.ts` (server-side) use `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Middleware**: `middleware.ts` protects routes (`/dashboard`, `/day2`, `/day3`, `/day4`, `/day5`) — redirects to `/login?redirect={path}` if not authenticated. Uses `createServerClient` with cookie handling for SSR auth.
- **Login flow**: `app/login/page.tsx` uses `supabase.auth.signInWithPassword()` and redirects to `?redirect` param (defaults to `/dashboard`).
- **Storage model**:
  - Day 1: localStorage-only (no auth required). Keys: `day1_logline`, `day1_stories`, `day1_plotPoints`, `day1_extractedStructure`.
  - Day 2+: requires auth, persists to Supabase `story` table with columns `id`, `user_id`, `logline`, `structure` (JSONB), `character` (JSONB, Day 3+), `created_at`.

## Context Pattern & State Management

- **Day 1 (localStorage)**: `Day1Provider` wraps routes in `app/day1/layout.tsx`. Context hook: `useDay1Context()` throws if used outside provider. State automatically persists to `localStorage` on every setter call (e.g., `setLogline` → `localStorage.setItem("day1_logline", value)`). Hydration happens in `useEffect` with try-catch around `localStorage.getItem()`.
- **Day 2 (Supabase)**: `Day2Provider` wraps routes in `app/day2/layout.tsx`. Context loads from DB on mount via `supabase.from("story").select("id, logline, structure").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single()`. Exposes `saveStoryToDB(storyToSave?)` for explicit saves. Update existing story if `storyId` exists, otherwise insert new row and update `storyId`.
- **Day 3 (Supabase + Character)**: `Day3Provider` extends Day 2 pattern with `character` state. DB query adds `character` field: `.select("id, logline, structure, character")`. `saveStoryToDB(storyToSave?, characterToSave?)` optionally saves both story and character to same row.
- **`isLoaded` flag**: both contexts render `null` until data is loaded (prevents hydration mismatch). Always check `isLoaded` before rendering. Set in `finally` block after mount effect.
- **TypeScript types**: `StoryStructure` defines JSON shape from API (`{ metadata: { framework, logline, lang }, 막: Record<string, Array<{ 이름, 내용 }>> }`); `Stories` holds all three frameworks (`gulino`, `vogel`, `snider`); `ExtractedStructure` for plot structure (`처음`, `중간`, `끝`); `Character` for Day 3 (`이름`, `나이`, `외적_특징`, `외적_목표와_장애물`, `내적_목표와_장애물`, `결핍`, `욕망과_결핍의_관계`, `다른_캐릭터들과의_관계`).

## UI Components (RoughJS)

- `SketchCard`, `SketchButton`, `SketchInput`, `SketchSelect`: draw sketch borders in an absolutely-positioned SVG overlay; content sits in a `z-10` wrapper. All use `ResizeObserver` + `requestAnimationFrame` redraw.
- Determinism: pass `seed` to keep lines stable across rerenders (e.g., `seed={42}`). Omitting seed generates new random lines each render.
- Inputs: `SketchInput` supports `multiline={true}` + `rows={5}`; `SketchSelect` takes `options={["a","b"]}` array and shows a placeholder option.
- Text: `ClickableText` is a `<button>` with hover opacity change and `cursor: "default"` to match the design (not pointer).
- All sketch components have same props: `stroke`, `strokeWidth`, `roughness`, `bowing`, `fill`, `fillStyle`, `seed`, `radius`, `inset`. Defaults work for most cases.

## Navigation & Transitions

- Internal "pages": components use `useState` + `isTransitioning` to fade out/in with a 300ms timeout (see `app/page.tsx`, `app/day1/page.tsx`).
- Pattern: `setIsTransitioning(true)` → `setTimeout(() => { setCurrentPage(n); setIsTransitioning(false); }, 300)`.
- Route nav: use `useRouter().push("/day1")` from clickable cards/text. Back/next affordances are fixed at corners with `fixed bottom-8 right-8`.
- Template wrapper (`app/template.tsx`) provides route-level fade-in; don't duplicate `animate-fadeIn` on internal transitions.

## AI/Prompt Integration

- **Prompts**: YAML at `lib/prompts.yaml` with templates for `create_logline`, `create_from_logline_w_{gulino|vogel|snider}`, `extract_plot_point`, `extract_structure`, `create_from_logline`, `revise_story_structure`, `extract_character`, and `revise_story_with_character`. Each has `system` and `user` keys. `_common.base_system` is anchored (`&BASE_SYS`) and aliased (`*BASE_SYS`) for shared rules across prompts. `formatPrompt()` in `lib/promptLoader.ts` substitutes `{variables}` placeholders.
- **API**: `app/api/generate/route.ts` uses `OPENAI_API_KEY` env var and model `gpt-4.1` (temp: 1, max_tokens: 4000). Set `responseFormat: "json"` to enforce JSON mode (`response_format: { type: "json_object" }`) and parse `message.content`.
- **Client usage**: `app/day1/page.tsx` calls `POST /api/generate` in parallel (`Promise.all`) to produce three frameworks, each returning `{ metadata, 막: { '1막'|'2막'|'3막': [{이름,내용}] } }` JSON. Day 2 revises structure with `revise_story_structure` (locked beats passed as `lockedBeatsJSON`). Day 3 extracts character with `extract_character` and revises story with `revise_story_with_character`.
- **Error handling**: JSON parse failures return 500 with clear message; text mode returns `{ result: content }` directly.
- Always await response, check `response.ok`, and handle errors with user-facing alerts (e.g., `alert()` for quick feedback).

## Styling & Conventions

- Tailwind 4 via PostCSS (no `tailwind.config.js`); classes only. Base type ramps around `text-2xl lg:text-4xl` with hover/active scale micro-interactions.
- Yui font (NanumGimYuICe) installed both in CSS (`@font-face`) and via `next/font/local`; UI inherits font (`fontFamily: "inherit"`).
- Background image set globally (`bg-[url('/bg.png')] bg-cover`); cards use semi-transparent layers (`bg-white/80 dark:bg-neutral-900/70`).
- Images: always provide `width`/`height` to `next/image`. Horizontal flip: `className="transform scale-x-[-1]"` (see `glint.png`).
- Use path alias `@/*` (maps to project root in `tsconfig.json`).
- Responsive: mobile-first with `lg:` breakpoint for desktop refinements.

## Developer Workflow

- Commands: `npm run dev` (port 3000), `npm run build`, `npm start`, `npm run lint`.
- Env: set `OPENAI_API_KEY` in `.env.local` for `/api/generate` to work locally/deployed. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase integration.
- Files to study first: `app/page.tsx`, `app/day1/page.tsx`, `app/day1/context.tsx`, `app/day2/context.tsx`, `components/*`, `app/api/generate/route.ts`, `lib/{promptLoader.ts,prompts.yaml}`, `middleware.ts`.
- TypeScript: strict mode enabled; always type props interfaces. React 19 JSX transform (`"jsx": "react-jsx"`).

## Do/Don't (Project‑specific)

- **Do** add `"use client"` to interactive components/pages; prefer Sketch components over plain divs/inputs for the aesthetic.
- **Do** pass `seed` to RoughJS components for consistent visuals; don't add extra resize listeners (already handled).
- **Do** keep user-visible text in Korean; no i18n layer. Code comments/vars can be English.
- **Don't** change YAML prompt keys or JSON shapes without updating `PromptName` type union in `app/api/generate/route.ts` and consuming code.
- **Don't** use `cursor: "pointer"` on `ClickableText`—use `"default"` to maintain sketch aesthetic.
- **Don't** forget to wrap new day routes with provider in layout if they need context (e.g., `app/day2/layout.tsx` wraps `<Day2Provider>`).
