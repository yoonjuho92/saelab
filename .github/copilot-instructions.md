# Copilot Instructions for saelab

## Project Overview

This is a Next.js 16 + React 19 interactive storytelling application with a hand-drawn sketch aesthetic. The project uses Korean language UI and features a character named "룩말 (Lookmal)" who guides users through story creation.

## Tech Stack & Key Dependencies

- **Next.js 16** with App Router (not Pages Router)
- **React 19.2** with TypeScript
- **Tailwind CSS 4.x** (PostCSS-based, no `tailwind.config.js`)
- **RoughJS** for hand-drawn sketch rendering (used in `SketchCard.tsx`)

## Architecture Patterns

### Component Strategy

All interactive components require `"use client"` directive at the top since this is a client-heavy interactive app.

**SketchCard Component** (`components/SketchCard.tsx`):

- Custom canvas-based component using RoughJS for hand-drawn borders
- Uses ResizeObserver with requestAnimationFrame for performant redraws
- Provides extensive customization props: `roughness`, `bowing`, `seed`, `radius`, etc.
- SVG overlay is absolutely positioned with `pointer-events-none`
- Content is wrapped in relative z-10 div for proper layering

**ClickableText Component** (`components/ClickableText.tsx`):

- Hover opacity changes to 0.7 for feedback
- Uses button semantic element with `cursor: default` to match design
- Inherits font family from parent (Yui font)

### Navigation Pattern

The app uses a hybrid navigation approach:

- **Home page** (`app/page.tsx`) uses `useState` for internal multi-page flows (page1, page2, etc.)
- **Feature routes** use Next.js App Router (e.g., `/page1` for new user flow)
- SketchCard components with `onClick` can trigger `useRouter().push()` for route navigation
- Back button is positioned fixed bottom-right using `router.push()` or state updates

### Page Transitions

Smooth transitions are implemented at two levels:

- **Internal state transitions** (within `page.tsx`): Use `isTransitioning` state with `opacity` transitions (300ms) and `setTimeout` to fade out → update state → fade in
- **Route transitions** (`app/template.tsx`): Wraps all pages with `animate-fadeIn` class for 0.5s fade-in animation when navigating between routes
- Custom `@keyframes fadeIn` animation defined in `globals.css`

## Styling Conventions

### Korean Font Setup

Custom font "Yui" (NanumGimYuICe.ttf) loaded via `@font-face` in `globals.css`. Applied globally as `font-[Yui]` in `layout.tsx`.

### Responsive Design

- Base text: `text-3xl lg:text-5xl`
- Use `lg:` breakpoint for desktop sizing adjustments
- Interactive elements scale on hover: `hover:scale-[1.02]` and active: `active:scale-[0.98]`

### Background & Theme

Body has background image (`bg-[url('/bg.png')]`) with semi-transparent overlays on cards (`bg-white/80 dark:bg-neutral-900/70`). Dark mode support via Tailwind's dark: prefix.

## File Organization

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable React components (use PascalCase)
- `/public/day1/`, `/public/fonts/` - Static assets organized by purpose
- Path alias: `@/*` maps to root (e.g., `@/components/SketchCard`)

## Development Workflow

```bash
npm run dev     # Start dev server on localhost:3000
npm run build   # Production build
npm run lint    # ESLint check with Next.js config
```

## TypeScript Configuration

- Path alias `@/*` resolves to project root
- `jsx: "react-jsx"` (not "preserve")
- Strict mode enabled

## Component Development Guidelines

1. Always add `"use client"` for components using hooks or interactivity
2. Use Korean text for user-facing strings (no i18n needed)
3. Maintain sketch aesthetic: prefer SketchCard over plain divs for containers
4. For new pages in the flow, add to conditional rendering in `page.tsx` if part of onboarding, or create new routes in `/app` for feature pages
5. When adding images, place in `/public/day1/` (or create day2/, day3/ as needed)

## Critical Implementation Notes

- Image transform: Use `transform scale-x-[-1]` for horizontal flip (see glint.png usage)
- SketchCard requires explicit seed prop for deterministic sketch rendering on rerenders
- Avoid Next.js Image optimization errors: always provide width/height props
- ResizeObserver in SketchCard already handles responsive redrawing - don't add additional resize listeners
