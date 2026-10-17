# FasalSakshi: Frontend & Sensor Simulation (Member 3)

This directory encapsulates the entire implementation for **Member 3 (Frontend & Sensor Simulator)** of the FasalSakshi project, built strictly to the contract specifications in `plan.md`.

## Structure

```
frontend-simulation/
├── contracts/                  # Contract definitions (sample_policy.json, scenario_profiles.json)
├── simulator/                  # Python sensor telemetry simulator (M3)
│   ├── simulate.py             # CLI telemetry streamer & scenario trigger
│   ├── requirements.txt        # dependencies (requests)
│   └── README.md               # CLI instructions
└── frontend/                   # Next.js 14 App Router + TypeScript + Tailwind + Recharts
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── lib/
    │   ├── types.ts            # Contract A10 shared domain models
    │   ├── mock.ts             # Complete offline demo mock fixtures
    │   ├── api.ts              # Contract A9 typed API client
    │   ├── i18n.ts             # English & Hindi bilingual dictionary
    │   └── LanguageContext.tsx # Language state provider
    ├── components/
    │   ├── Header.tsx          # Nav header with EN/HI toggle & simulator pill
    │   └── Footer.tsx          # Platform disclosures
    └── app/
        ├── page.tsx            # / Dashboard (Field card, sensor summary, alerts)
        ├── fields/[id]/page.tsx# /fields/1 Live sensor charts (5s polling)
        ├── fields/[id]/evidence/page.tsx # /fields/1/evidence Cryptographic hash chain
        ├── claims/[id]/page.tsx# /claims/1 Hero claim dossier (3-bar breakdown, countdown)
        ├── market/page.tsx     # /market Mandi net realization & organic trust score
        └── simulate/page.tsx   # /simulate Demo control panel & WhatsApp mockup
```

## Quick Start

### 1. Run the Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
The app defaults to `NEXT_PUBLIC_USE_MOCK=1` so all routes and simulations are fully interactive immediately without requiring the backend or ML service.

### 2. Run the Sensor Simulator
```bash
cd simulator
pip install -r requirements.txt
python simulate.py --scenario hail --field 1 --interval 5 --count 20
```

## Integration with Teammates (Zero Breakage)
- All paths are self-contained inside `frontend-simulation/`.
- Once Member 2 starts the backend on port 8000, set `NEXT_PUBLIC_USE_MOCK=0` in `.env.local` to stream directly from the live FastAPI backend with zero code changes.
