# FasalSakshi API Reference Guide 🌾

The FasalSakshi REST API runs on port `8000` (default: `http://localhost:8000`). All endpoints are prefixed with `/api`. Interactive documentation is available via:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI JSON:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 1. System Health & Core

### `GET /api/health`
Check backend server lifecycle status.
* **Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

## 2. Farm & Telemetry (Fields & Readings)

### `GET /api/fields/{id}`
Retrieve farm plot profile, crop type, GPS coordinates, and farmer information.
* **Parameters:** `id` (integer, e.g. `1`)
* **Response (200 OK):**
```json
{
  "id": 1,
  "farmer_id": 1,
  "name": "North Plot",
  "crop": "tomato",
  "lat": 21.2514,
  "lon": 81.6296,
  "area_ha": 1.5,
  "farmer": {
    "id": 1,
    "name": "Ramesh Kumar",
    "phone": "+910000000000",
    "language": "hi",
    "village": "Arang",
    "district": "Raipur",
    "state": "Chhattisgarh"
  }
}
```

### `GET /api/fields/{id}/policy`
Retrieve active PMFBY-style crop insurance policy terms.
* **Response (200 OK):**
```json
{
  "id": 1,
  "scheme": "PMFBY-style sample policy",
  "policy_no": "FP-2026-0001",
  "crop": "tomato",
  "sum_insured_total": 120000,
  "deductible_pct": 10,
  "reporting_window_hours": 72,
  "perils": {
    "individual": ["hail", "flood"],
    "area_based": ["drought", "frost"]
  }
}
```

### `POST /api/readings`
Stream microclimate sensor telemetry from field IoT probes or simulator CLI.
* **Request Body:**
```json
{
  "field_id": 1,
  "soil_moisture_pct": 89.4,
  "soil_temp_c": 22.2,
  "air_temp_c": 22.8,
  "humidity_pct": 88.2,
  "rainfall_mm": 11.3,
  "soil_ec_ds_m": 0.84,
  "soil_ph": 6.5,
  "scenario": "flood"
}
```
* **Response (201 Created):** Full reading record with auto-assigned `id` and ISO UTC `ts`.

### `GET /api/fields/{id}/readings?limit=50`
Get historical readings ordered newest first.

---

## 3. Cryptographic Evidence Vault (Images & Hash Chain)

### `POST /api/fields/{id}/images`
Ingest field photo into the immutable SHA-256 hash chain.
* **Content-Type:** `multipart/form-data`
* **Form Fields:**
  * `file`: Binary image file (JPEG/PNG)
  * `role`: `baseline` | `before` | `after` | `routine`
  * `lat`: Optional float
  * `lon`: Optional float
* **Response (201 Created):**
```json
{
  "id": 2,
  "field_id": 1,
  "ts": "2026-10-17T18:00:00Z",
  "role": "after",
  "filename": "1_20261017_after.jpg",
  "sha256": "4b68e...",
  "prev_hash": "e3b0c...",
  "chain_hash": "a1f9d...",
  "url": "/api/images/2/file"
}
```

### `GET /api/fields/{id}/chain/verify`
Mathematically re-derive the full hash chain to audit evidence integrity.
* **Response (200 OK):**
```json
{
  "valid": true,
  "length": 4,
  "broken_at_image_id": null,
  "head_hash": "a1f9d45e69..."
}
```

---

## 4. Disaster Simulation & Weather Corroboration

### `POST /api/simulate/{scenario}?field_id=1`
Trigger simulated calamity (`hail`, `flood`, `drought`, `frost`, `fertilizer_spike`).
* Backfills 24h of microclimate readings from `scenario_profiles.json`.
* Evaluates meteorological thresholds and visual loss.
* Automatically prepares a claim and dispatches bilingual alerts.
* **Response (200 OK):** Returns `SimulateResult` containing `event`, `claim`, and `alert`.

### `POST /api/fields/{id}/check-weather`
Trigger live Open-Meteo satellite weather radar query.
* Requires no API keys.
* Evaluates real precipitation, wind gusts, and temperatures for the GPS coordinates.

---

## 5. Claims & Evidence Reports (Member 4)

### `GET /api/claims/{id}`
Retrieve prepared insurance claim dossier details, deductible adjustments, and statutory deadline countdown.
* **Response (200 OK):**
```json
{
  "id": 1,
  "event_id": 1,
  "field_id": 1,
  "created_ts": "2026-10-17T19:00:00Z",
  "claimability": "individual",
  "peril": "hail",
  "covered": true,
  "claim_low": 27000.0,
  "claim_high": 51000.0,
  "confidence": 0.88,
  "confidence_label": "High",
  "deadline_ts": "2026-10-20T19:00:00Z",
  "report_channel": {
    "channel": "PMFBY Portal / Insurer Helpline",
    "helpline": "14447"
  },
  "report_url": "/api/claims/1/report.pdf"
}
```

### `GET /api/claims/{id}/report.pdf`
Generate or stream the insurer-admissible PDF claim dossier.
* **Content-Type:** `application/pdf`
* **Features:** Dual UTC/IST timestamps, in-situ Matplotlib telemetry charts, and SHA-256 hash-chain audit log.

---

## 6. Mandi Market Realization (Member 4)

### `GET /api/market/prices?commodity=Tomato&state=Chhattisgarh`
Retrieve market prices across regional mandis (from live Agmarknet or fallback CSV).

### `GET /api/market/best?field_id=1&quantity_q=10`
Calculate optimal net realization after transport logistics deductions.
* **Response (200 OK):**
```json
{
  "commodity": "Tomato",
  "quantity_q": 10.0,
  "assumptions": {
    "transport_rs_per_qtl_km": 0.25,
    "road_factor": 1.3,
    "note": "Road distance calculated using 1.3x factor over great-circle; transport assumed at Rs. 0.25/quintal/km."
  },
  "options": [
    {
      "market": "Bilaspur",
      "district": "Bilaspur",
      "distance_km": 150.2,
      "modal_price": 2500.0,
      "transport_cost_per_qtl": 37.55,
      "net_price_per_qtl": 2462.45,
      "net_total": 24624.5
    }
  ],
  "best": "Bilaspur",
  "organic_premium": {
    "low_pct": 10,
    "high_pct": 30,
    "note": "Indicative only, not from mandi data; mandi prices are for conventional produce."
  }
}
```

---

## 7. Organic Evidence Scoring (Member 4)

### `POST /api/fields/{id}/inputs`
Log an agricultural input.
* **Request Body:**
```json
{
  "input_type": "neem_spray",
  "description": "Cold-pressed neem oil applied for preventative pest management",
  "ts": "2026-10-18T00:00:00Z"
}
```
* Chemical types (`urea`, `dap`, `pesticide`, `herbicide`) automatically set `is_chemical = 1`.

### `GET /api/fields/{id}/inputs`
List chronological cultivation log entries.

### `GET /api/fields/{id}/trust-score`
Compute the 0–100 Organic Evidence Strength Score.
* **Components:**
  * `log_completeness` (0–40)
  * `photo_continuity` (0–30)
  * `anomaly_free` (0–30)
* **Response (200 OK):**
```json
{
  "score": 75,
  "label": "Strong",
  "components": {
    "log_completeness": 36.0,
    "photo_continuity": 15.0,
    "anomaly_free": 24.0
  },
  "flags": [],
  "disclaimer": "Evidence strength, not certification. Official organic certification (NPOP / PGS-India) requires documented practices and lab residue tests."
}
```

---

## 8. Alerts & WhatsApp Dispatch (Member 4)

### `GET /api/fields/{id}/alerts`
Fetch farm alerts in chronological order (newest first).

### `POST /api/alerts/test?field_id=1&language=hi&kind=damage_detected`
Dispatch a test alert via Twilio WhatsApp (if configured) or persist to database log.
