# FasalSakshi Sensor Simulator (Member 3)

The simulator generates synthetic field telemetry matching the exact bounds defined in `contracts/scenario_profiles.json` and streams live `ReadingIn` records to the FasalSakshi backend API at `/api/readings`.

## Installation

```bash
cd simulator
pip install -r requirements.txt
```

## Usage

### 1. Stream live sensor readings

Simulate readings under a chosen scenario (e.g. `hail`, `flood`, `drought`, `frost`, `fertilizer_spike`, or `normal`):

```bash
python simulate.py --scenario hail --field 1 --interval 5 --count 20 --api http://localhost:8000
```

Arguments:
- `--scenario`: Scenario profile to stream (`normal`, `hail`, `flood`, `drought`, `frost`, `fertilizer_spike`). Default: `normal`.
- `--field`: Target field ID (default: `1`).
- `--interval`: Time between readings in seconds (default: `5.0`).
- `--count`: Number of readings to emit (`0` or negative runs indefinitely until `Ctrl+C`). Default: `20`.
- `--api`: Backend API base URL (default: `http://localhost:8000`).
- `--trigger`: Also triggers a full scenario run on the backend (`POST /api/simulate/{scenario}`).

### 2. Trigger a full scenario pipeline once

```bash
python simulate.py --scenario hail --field 1 --trigger --count 1
```

## Contract Alignment

Readings values are drawn uniformly from the agreed ranges in `contracts/scenario_profiles.json`:
- `soil_moisture_pct` (%)
- `soil_temp_c` (°C)
- `air_temp_c` (°C)
- `humidity_pct` (%)
- `rainfall_mm` (mm)
- `soil_ec_ds_m` (dS/m)
- `soil_ph`
- `ts` (ISO-8601 UTC string ending in `Z`)
