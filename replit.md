# Mausam Mitra Weather AI

Mausam Mitra is a multilingual conversational weather and climate assistant for India, powered by live Open-Meteo data and designed for clear, actionable decisions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mausam-mitra/src/App.tsx` — the weather assistant interface, live forecast data fetching, location search, language preferences, voice controls, advisories, and climate views.
- `artifacts/mausam-mitra/src/index.css` — the shared visual system for the web app.
- `artifacts/mausam-mitra/.replit-artifact/artifact.toml` — artifact routing and managed web workflow.

## Architecture decisions

- The first version is frontend-first and uses Open-Meteo's public geocoding, forecast, and archive endpoints directly so live weather works without user-managed API keys.
- Browser geolocation and Web Speech APIs are progressive enhancements; the core experience remains usable when either capability is unavailable.
- Weather questions are interpreted locally for fast, offline-friendly intent matching and translated guidance, while forecast values remain sourced from the live weather response.
- Preferences such as language, units, and saved location are stored in local storage to keep setup lightweight.

## Product

The app supports current conditions, 7-day forecasts, location search, natural-language questions, quick asks for commuting and farming, extreme-weather advisories, climate trend context, nine Indian language choices, Celsius/Fahrenheit settings, and browser voice input/output.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The live weather and climate panels require network access to Open-Meteo.
- Voice controls depend on browser Web Speech API support and permission.
- Forecast timestamps are displayed in the selected location's timezone, while update metadata reflects the user's local display timezone.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
