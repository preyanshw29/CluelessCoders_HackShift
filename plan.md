# Fasalpramaaan: Team Build Plan (4 members, one repo, zero breakage)

**One line pitch:** A field unit (designed, data simulated for this demo) that watches a farmer's crop daily, builds tamper-proof evidence of what happened, and turns it into an insurance claim report plus a crop quality record that helps the farmer sell at a better price.

## How to use this file

1. **One person (Member 2) commits Part A's `contracts/` files and `backend/schema.sql` to the repo first.** Everyone else copies them byte for byte.
2. Each member opens their own AI agent and pastes **Part A (Shared Contract) + their own prompt from Part B**. Part A is what makes the four outputs fit together. Do not edit it individually. If something must change, change it in this file, tell everyone, and re-paste.
3. Each member works only inside the folders they own (table below). That means no merge conflicts, and the git history shows each person's separate contribution.
4. Merge order: **M2, M1, M4, M3**. Then run `python scripts/smoke_test.py`. Fix mismatches using Part C.
5. **Read and understand your own code.** Judges will ask each of you about your part, and agent output that you cannot explain will hurt you.

## Honest framing (use in pitch and README)

| Bucket | What |
|---|---|
| **Built (real)** | Web app, image evidence with hash chain, weather trigger (Open-Meteo), damage comparison, disease model, policy engine, claim PDF, alerts (EN/HI), mandi prices and best mandi after transport, organic evidence score |
| **Simulated (labelled)** | Sensor feed (Python script + scenario buttons), camera images (uploads or prepared image pairs), mock weather events for the demo |
| **Roadmap (told, not built)** | Field unit: camera + soil moisture, temperature, EC, pH, rainfall. One slide only. Answer to "why no hardware": *"We prioritised the intelligence layer, evidence logic and claim engine. The sensors are off the shelf and the value is in what we do with the data."* |

Other honesty rules: we do **not** certify organic (the score means "evidence strength, not certification"), claim ranges depend on insurer rules that vary by state and scheme (**verify current PMFBY rules before quoting them**), and model accuracy claims must be modest because it is trained on public datasets.

## Ownership

| Member | Role | Owns (only edit these) |
|---|---|---|
| **M1** | ML engineer | `ml/`, `demo_assets/` |
| **M2** | Backend, evidence and policy engine | `backend/` except M4's files, `contracts/`, `scripts/`, `.env.example` |
| **M3** | Frontend and sensor simulator | `frontend/`, `simulator/` |
| **M4** | Report, alerts, market and organic, docs and pitch | `backend/app/report.py`, `alerts.py`, `market.py`, `seed_organic.py`, `routers/report.py`, `routers/alerts.py`, `routers/market.py`, `routers/organic.py`, `backend/requirements-m4.txt`, `backend/data/mandi_prices.csv`, `docs/`, root `README.md` |

---

# PART A: SHARED CONTRACT (paste into every agent, unchanged)

## A1. Stack, ports, layout

- Python 3.11, FastAPI, SQLite. Next.js 14 (App Router), TypeScript, Tailwind, Recharts.
- Ports: **backend 8000**, **ML service 8001**, **frontend 3000**.
- Backend allows CORS from `http://localhost:3000`.
- All timestamps are **ISO-8601 UTC strings** (e.g. `2026-10-17T09:30:00Z`). All ids are integers.
- Units: moisture and humidity in %, temperatures in °C, rainfall in mm, EC in dS/m, wind in km/h, prices in Rs per quintal.

```
fasalpramaaan/
  README.md                      (M4)
  plan.md
  .env.example                   (M2)
  contracts/
    scenario_profiles.json       (M2 commits, everyone reads)
    sample_policy.json           (M2 commits)
  scripts/
    smoke_test.py                (M2)
    run_all.sh                   (M2)
  demo_assets/                   (M1)
    hail/before.jpg, after.jpg
    flood/before.jpg, after.jpg
    drought/before.jpg, after.jpg
    frost/before.jpg, after.jpg
    disease_sample.jpg
  ml/                            (M1)  FastAPI :8001
  backend/                       FastAPI :8000
    schema.sql                   (M2)
    requirements.txt             (M2)
    requirements-m4.txt          (M4)
    data/                        (runtime: fasalpramaaan.db, images/, reports/, mandi_prices.csv)
    app/
      main.py db.py seed.py hashchain.py weather.py policy_engine.py scoring.py pipeline.py   (M2)
      report.py alerts.py market.py seed_organic.py                                            (M4)
      routers/
        fields.py readings.py images.py events.py claims.py simulate.py                        (M2)
        report.py alerts.py market.py organic.py                                               (M4)
  frontend/                      (M3)  Next.js :3000
  simulator/                     (M3)
  docs/                          (M4)
```

## A2. Environment variables (`.env.example`, all optional except URLs)

```
ML_URL=http://localhost:8001
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=0
DATAGOV_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TRANSPORT_RS_PER_QTL_KM=0.25
```

## A3. Database (`backend/schema.sql`, exact)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, phone TEXT, language TEXT DEFAULT 'hi',
  village TEXT, district TEXT, state TEXT
);
CREATE TABLE IF NOT EXISTS fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id),
  name TEXT, crop TEXT, lat REAL, lon REAL, area_ha REAL
);
CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id),
  terms_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id),
  ts TEXT NOT NULL,
  soil_moisture_pct REAL, soil_temp_c REAL, air_temp_c REAL, humidity_pct REAL,
  rainfall_mm REAL, soil_ec_ds_m REAL, soil_ph REAL,
  scenario TEXT DEFAULT 'normal'
);
CREATE INDEX IF NOT EXISTS idx_readings_field_ts ON readings(field_id, ts);
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id),
  ts TEXT NOT NULL,
  role TEXT NOT NULL,            -- baseline | before | after | routine
  filename TEXT NOT NULL,        -- file lives at backend/data/images/<filename>
  lat REAL, lon REAL,
  sha256 TEXT NOT NULL, prev_hash TEXT NOT NULL, chain_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id),
  ts TEXT NOT NULL,
  peril TEXT NOT NULL,           -- hail | flood | drought | frost | fertilizer_spike
  source TEXT NOT NULL,          -- weather | simulated
  weather_json TEXT,
  canopy_loss_pct REAL DEFAULT 0,
  weather_score REAL DEFAULT 0, visual_score REAL DEFAULT 0, sensor_score REAL DEFAULT 0,
  confidence REAL DEFAULT 0, confidence_label TEXT,
  status TEXT DEFAULT 'open',    -- open | claim_prepared | anomaly
  before_image_id INTEGER, after_image_id INTEGER
);
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id),
  field_id INTEGER NOT NULL REFERENCES fields(id),
  created_ts TEXT NOT NULL,
  claimability TEXT NOT NULL,    -- individual | area_based | not_covered
  peril TEXT NOT NULL,
  covered INTEGER NOT NULL,      -- 0/1
  claim_low REAL, claim_high REAL,   -- NULL unless claimability = individual
  confidence REAL, confidence_label TEXT,
  deadline_ts TEXT,
  report_channel_json TEXT,
  note TEXT,
  pdf_path TEXT                  -- relative to backend/data/
);
CREATE TABLE IF NOT EXISTS inputs_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id),
  ts TEXT NOT NULL,
  input_type TEXT NOT NULL,      -- compost | vermicompost | neem_spray | urea | dap | pesticide | herbicide | other
  description TEXT,
  is_chemical INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id),
  ts TEXT NOT NULL,
  channel TEXT NOT NULL,         -- whatsapp | sms | app
  language TEXT NOT NULL,        -- en | hi
  kind TEXT NOT NULL,            -- damage_detected | deadline_reminder | anomaly | price
  message TEXT NOT NULL,
  status TEXT NOT NULL           -- sent | logged | failed
);
```

DB access helper (M2 writes `backend/app/db.py`, everyone imports it):

```python
def get_conn() -> sqlite3.Connection   # new connection, row_factory=sqlite3.Row, foreign_keys=ON. Caller closes it.
def row_to_dict(row) -> dict
DATA_DIR: pathlib.Path                 # backend/data
IMAGES_DIR, REPORTS_DIR                # DATA_DIR/"images", DATA_DIR/"reports" (created on import)
```

## A4. Demo seed data (M2 `seed.py` inserts at startup if DB is empty)

- Farmer `id=1`: Ramesh Kumar, phone `+910000000000` (placeholder), language `hi`, village Arang, district Raipur, state Chhattisgarh.
- Field `id=1`: "North Plot", crop **tomato** (chosen so the PlantVillage disease model supports it), lat `21.2514`, lon `81.6296`, area_ha `1.5`.
- Policy `id=1` for field 1 = `contracts/sample_policy.json`.
- 30 days of hourly `normal` readings. Images are NOT seeded (simulate creates them).
- Then calls `app.seed_organic.seed_demo(conn)` inside try/except ImportError (M4's seed of `inputs_log`).

## A5. `contracts/sample_policy.json` (exact; a SAMPLE, not real scheme terms)

```json
{
  "scheme": "PMFBY-style sample policy (verify real rules before quoting)",
  "policy_no": "FP-2026-0001",
  "crop": "tomato",
  "season": "rabi_2026",
  "area_ha": 1.5,
  "sum_insured_per_ha": 80000,
  "sum_insured_total": 120000,
  "deductible_pct": 10,
  "reporting_window_hours": 72,
  "perils": {
    "individual": ["hail", "flood"],
    "area_based": ["drought", "frost"]
  },
  "thresholds": {
    "hail":   { "weather_codes": [96, 99], "min_gust_kmh": 50 },
    "flood":  { "min_rain_24h_mm": 100 },
    "drought":{ "max_soil_moisture_pct": 15 },
    "frost":  { "max_min_temp_c": 2 }
  },
  "report_to": {
    "channel": "Crop Insurance app / insurer helpline / bank branch",
    "helpline": "14447",
    "note": "Sample value; verify current channel and window for the scheme and state."
  }
}
```

## A6. `contracts/scenario_profiles.json` (exact; single source for simulator AND backend)

```json
{
  "readings": {
    "normal":           {"soil_moisture_pct":[40,55],"soil_temp_c":[22,26],"air_temp_c":[26,32],"humidity_pct":[50,70],"rainfall_mm":[0,0.2],"soil_ec_ds_m":[0.8,1.1],"soil_ph":[6.4,6.8]},
    "hail":             {"soil_moisture_pct":[55,70],"soil_temp_c":[18,21],"air_temp_c":[13,18],"humidity_pct":[85,95],"rainfall_mm":[6,15],"soil_ec_ds_m":[0.8,1.1],"soil_ph":[6.4,6.8]},
    "flood":            {"soil_moisture_pct":[88,98],"soil_temp_c":[20,23],"air_temp_c":[22,27],"humidity_pct":[85,95],"rainfall_mm":[10,25],"soil_ec_ds_m":[0.7,1.0],"soil_ph":[6.4,6.8]},
    "drought":          {"soil_moisture_pct":[8,14],"soil_temp_c":[30,36],"air_temp_c":[36,42],"humidity_pct":[15,30],"rainfall_mm":[0,0],"soil_ec_ds_m":[1.0,1.3],"soil_ph":[6.4,6.8]},
    "frost":            {"soil_moisture_pct":[35,45],"soil_temp_c":[3,6],"air_temp_c":[0,3],"humidity_pct":[60,80],"rainfall_mm":[0,0],"soil_ec_ds_m":[0.8,1.1],"soil_ph":[6.4,6.8]},
    "fertilizer_spike": {"soil_moisture_pct":[40,55],"soil_temp_c":[22,26],"air_temp_c":[26,32],"humidity_pct":[50,70],"rainfall_mm":[0,0.2],"soil_ec_ds_m":[2.2,3.0],"soil_ph":[6.0,6.4]}
  },
  "mock_weather": {
    "hail":   {"rain_24h_mm":35,"max_gust_kmh":78,"min_temp_c":13,"max_temp_c":20,"weather_code":96},
    "flood":  {"rain_24h_mm":140,"max_gust_kmh":30,"min_temp_c":22,"max_temp_c":27,"weather_code":65},
    "drought":{"rain_24h_mm":0,"max_gust_kmh":15,"min_temp_c":28,"max_temp_c":42,"weather_code":0},
    "frost":  {"rain_24h_mm":0,"max_gust_kmh":10,"min_temp_c":1,"max_temp_c":14,"weather_code":0},
    "fertilizer_spike": {"rain_24h_mm":0,"max_gust_kmh":10,"min_temp_c":24,"max_temp_c":32,"weather_code":0}
  }
}
```

## A7. Weather summary shape (`events.weather_json`)

```json
{"rain_24h_mm": 35, "max_gust_kmh": 78, "min_temp_c": 13, "max_temp_c": 20, "weather_code": 96, "source": "mock"}
```

## A8. ML service API (M1 builds, M2 calls) at `ML_URL`

| Method and path | Request | Response |
|---|---|---|
| `GET /health` | none | `{"status":"ok","disease_model":"<name>","version":"1"}` |
| `POST /predict/disease` | multipart `file` (image) | `{"label":"Tomato___Early_blight","crop":"Tomato","disease":"Early blight","healthy":false,"confidence":0.91,"top3":[{"label":"...","confidence":0.91}]}` |
| `POST /damage/compare` | multipart `before`, `after` (images, same camera angle) | `{"canopy_loss_pct":42.5,"green_before_pct":71.2,"green_after_pct":40.9,"ssim":0.38,"change_score":0.62,"diff_png_b64":"<base64 png or empty string>"}` |
