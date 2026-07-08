# scripts/

Maintenance and tooling scripts for the project. These are developer utilities —
they are **not** part of the app build. Run them with the npm scripts below (which
use [`tsx`](https://github.com/privatenumber/tsx) under the hood) or directly.

| Script | Run with | What it does |
| --- | --- | --- |
| `seed-database.ts` | `npm run seed` | Seed a fresh Supabase project with the lesson/curriculum data. Point it at your own backend when self-hosting. |
| `kernel-probe.ts` | `npm run probe:kernel` | Static audit of the Eight-Box Kernel wiring. Also runs in CI (`.github/workflows/kernel-probe.yml`). |
| `probe-echelon.mjs` | `npm run probe:live` | Live end-to-end probe of the Echelon relay against a running backend. |
| `export-lessons-to-json.ts` | `tsx scripts/export-lessons-to-json.ts` | Export the current lessons from Supabase to JSON (uses `VITE_SUPABASE_*` env vars). |
| `curriculum-to-markdown.py` | `python3 scripts/curriculum-to-markdown.py` | Render the curriculum spreadsheet (`docs/example-curriculum/*.xlsx`) into the readable per-phase Markdown files. |

## Configuration

The Supabase-facing scripts read their connection details from the same
environment variables the app uses:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

See [docs/CONFIGURATION.md](../docs/CONFIGURATION.md) for details.
