# AGENTS.md — Tabib Qatar

## Project

AI health assistant (React 19 + TypeScript + Vite 6). Single-page app deployed to Vercel. Uses Google Gemini for AI diagnosis, ElevenLabs for text-to-speech.

## Commands

- `npm install` — install deps
- `npm run dev` — dev server on port 3000
- `npm run build` — production build to `dist/`
- `npx tsc --noEmit` — typecheck (no dedicated script, run manually)

No test framework, no linter, no formatter configured.

## Architecture

```
index.html → index.tsx → App.tsx (monolithic, ~1750 lines)
```

- `services/assistantDoctorService.ts` — all AI logic (chat diagnosis, symptom analysis, medication analysis, clinical report generation). Uses `@google/genai` with Gemini 3.5 Flash Lite.
- `services/elevenLabsService.ts` — text-to-speech
- `components/` — UI components (Header, ConditionCard, InteractiveBodyMap, LandingCards, SymptomScene, UrgencyBadge)
- `types.ts` — shared TypeScript interfaces

## Key Details

- **Env vars**: `VITE_GEMINI_API_KEY`, `VITE_ELEVENLABS_API_KEY` (in `.env`, not committed)
- **Path alias**: `@` maps to project root (vite + tsconfig)
- **No tests**: Verify changes with `npx tsc --noEmit` only
- **Report generation**: `generateClinicalReport()` in assistantDoctorService.ts produces HTML strings. Schema defines what fields AI populates — update both schema and report prompt when adding clinical fields.
- **SEO**: All meta tags, structured data (JSON-LD), and Open Graph live in `index.html`. Brand is "Tabib Qatar".
