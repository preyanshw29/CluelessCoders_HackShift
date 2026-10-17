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
