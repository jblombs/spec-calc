# SpecCalc v1

Professional client-side calculator suite for architects, plumbers, electricians, HVAC, and construction.

Dark teal/navy blueprint-inspired UI with a light-mode toggle. All math runs in the browser — no backend or accounts.

## Requirements

- Node.js 18+ (20 recommended)
- npm 9+

## Run locally

```bash
cd /workspace/speccalc/app
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm test` | Run calc-engine unit tests (Vitest) |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |

## Features (v1)

- **Dashboard** — module grid + local project overview
- **Structural Beam Load Calculator** — uniform & midspan point load with exact formulas, diagrams, pass/fail, imperial/metric, section presets
- **Material Quantity Estimator** — concrete, rebar, lumber BF, drywall, paint + waste factors
- **Projects** — create/name projects; save last calc results to `localStorage`
- **Unit converter** — common construction imperial ↔ metric
- **Print / export** — print CSS for printable HTML / PDF via browser print
- **Settings** — theme, default units, deflection limit divisor
- **Coming soon** placeholders — stairs, roof, foundations, HVAC, electrical, plumbing (no fake math)

## Beam formulas (simply supported)

- Uniform `w`: `M = wL²/8` · `V = wL/2` · `δ = 5wL⁴/(384EI)`
- Midspan `P`: `M = PL/4` · `V = P/2` · `δ = PL³/(48EI)`
- `S_req = M/σ` · pass if `S_avail ≥ S_req` AND `δ ≤ L/n` (default n=360)

## Stack

Vite + React + TypeScript · Vitest for the calc engine
