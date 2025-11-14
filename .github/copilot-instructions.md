# Copilot Instructions for saelab

## Big Picture

- Interactive storytelling app (Korean UI) using Next.js 16 App Router + React 19 + Tailwind 4. Sketch/hand-drawn look via RoughJS. Guide character: “룩말”.
- Client-heavy: most components/pages use hooks — add "use client" for interactivity.

## Architecture & Flow

- Routes: `app/page.tsx` (2-step home with internal state), `app/day1/*` (guided flow with context + persistence), `app/login/page.tsx` (placeholder).
- Global shell: `app/layout.tsx` loads local font via `next/font/local` and sets background image. Page transitions wrap with `app/template.tsx` (`animate-fadeIn` from `app/globals.css`).
- Day 1 flow state: `app/day1/context.tsx` provides `Day1Provider` storing `logline`, generated `stories`, and `plotPoints` in `localStorage` with keys `day1_*`. Context hydrates on mount and persists changes automatically.
- Data flow: Client calls `POST /api/generate` → `app/api/generate/route.ts` formats prompts from `lib/prompts.yaml` (via `lib/promptLoader.ts`) → calls OpenAI Chat Completions and returns text or parsed JSON.

## Context Pattern & State Management

- Day 1 wraps content in `Day1Provider` via `app/day1/layout.tsx` — ensures context available to all child routes.
- Context uses `isLoaded` flag to prevent hydration mismatch: renders `null` until `localStorage` is read on client.
- All state setters (e.g., `setLogline`) automatically persist to `localStorage`; no manual save calls needed.
- TypeScript types: `StoryStructure` defines JSON shape from API; `Stories` holds all three frameworks (`gulino`, `vogel`, `snider`).

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

- Prompts: YAML at `lib/prompts.yaml` with templates for `create_logline`, `create_from_logline_w_{gulino|vogel|snider}`, `extract_plot_point` (and `extract_structure` available). `formatPrompt()` substitutes `{variables}` placeholders.
- API: `app/api/generate/route.ts` uses `OPENAI_API_KEY` env var and model `gpt-4.1-mini`. Set `responseFormat: "json"` to enforce JSON mode and parse `message.content`.
- Client usage example: `app/day1/page.tsx` calls the API in parallel (`Promise.all`) to produce three frameworks, each returning `{ metadata, 막: { '1막'|'2막'|'3막': [{이름,내용}] } }` JSON.
- Error handling: JSON parse failures return 500 with clear message; text mode returns `{ result: content }` directly.
- Always await response, check `response.ok`, and handle errors with user-facing alerts.

## Styling & Conventions

- Tailwind 4 via PostCSS (no `tailwind.config.js`); classes only. Base type ramps around `text-2xl lg:text-4xl` with hover/active scale micro-interactions.
- Yui font (NanumGimYuICe) installed both in CSS (`@font-face`) and via `next/font/local`; UI inherits font (`fontFamily: "inherit"`).
- Background image set globally (`bg-[url('/bg.png')] bg-cover`); cards use semi-transparent layers (`bg-white/80 dark:bg-neutral-900/70`).
- Images: always provide `width`/`height` to `next/image`. Horizontal flip: `className="transform scale-x-[-1]"` (see `glint.png`).
- Use path alias `@/*` (maps to project root in `tsconfig.json`).
- Responsive: mobile-first with `lg:` breakpoint for desktop refinements.

## Developer Workflow

- Commands: `npm run dev` (port 3000), `npm run build`, `npm start`, `npm run lint`.
- Env: set `OPENAI_API_KEY` in `.env.local` for `/api/generate` to work locally/deployed.
- Files to study first: `app/page.tsx`, `app/day1/page.tsx`, `app/day1/context.tsx`, `components/*`, `app/api/generate/route.ts`, `lib/{promptLoader.ts,prompts.yaml}`.
- TypeScript: strict mode enabled; always type props interfaces. React 19 JSX transform (`"jsx": "react-jsx"`).

## Do/Don’t (Project‑specific)

- **Do** add `"use client"` to interactive components/pages; prefer Sketch components over plain divs/inputs for the aesthetic.
- **Do** pass `seed` to RoughJS components for consistent visuals; don't add extra resize listeners (already handled).
- **Do** keep user-visible text in Korean; no i18n layer. Code comments/vars can be English.
- **Don't** change YAML prompt keys or JSON shapes without updating `PromptName` type union and consuming code.
- **Don't** use `cursor: "pointer"` on `ClickableText`—use `"default"` to maintain sketch aesthetic.
- **Don't** forget to wrap new day routes with provider in layout if they need context.
