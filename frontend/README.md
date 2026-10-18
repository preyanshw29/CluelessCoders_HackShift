# Fasalpramaaan Frontend (Member 3)

The farmer-facing interface and demo evaluation console for Fasalpramaaan. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript (strict types adhering to Part A10 Shared Contract)
- **Styling**: Tailwind CSS (custom agriculture palette: emerald, amber, slate)
- **Charts**: Recharts (multi-axis real-time telemetry graphs)
- **Icons**: Lucide React
- **Internationalization**: Dual-language support (English / हिन्दी) with live toggle

---

## 📂 Routes

| Route | Description |
|---|---|
| `/` | **Dashboard**: Farmer & field identity, live sensor telemetry tiles, latest critical alert, active claim summary, quick actions. |
| `/fields/[id]` | **Telemetry Feed**: High-contrast Recharts live graphs (Soil Moisture & Rain, Temperature vs Humidity, Soil EC & pH) polling every 5s, active peril banner. |
| `/fields/[id]/evidence` | **Evidence Timeline**: Cryptographic SHA-256 hash chain ledger, tamper verification badge (`✓` or `✗`), photo upload with role attribution (`baseline`, `before`, `after`, `routine`). |
| `/claims/[id]` | **Hero Claim Dossier**: 3-part multi-source confidence bars (Weather, Optical, Ground Sensor), side-by-side Before/After damage photos with % canopy loss, claim estimate range, live 72h countdown timer, helpline reporting channel, and one-click PDF download. |
| `/market` | **Mandi Discovery & Organic Trust Score**: Net mandi realization modeling after road transport costs, organic indicative premium, 0–100 evidence trust score gauge with 3 component bars, anomaly audit flags, farm input log form & history. |
| `/simulate` | **Demo Control Room**: Trigger Hail, Flood, Drought, Frost, Fertilizer Spike, or Reset to Normal. Includes live Open-Meteo satellite weather check and smartphone WhatsApp alert preview mockup. |

---

## 🚀 Running the Frontend

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Settings:
- `NEXT_PUBLIC_API_URL`: Backend URL (default: `http://localhost:8000`)
- `NEXT_PUBLIC_USE_MOCK`: Set to `1` to run purely in mock mode without needing the backend or ML services running. Set to `0` for live integration.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
