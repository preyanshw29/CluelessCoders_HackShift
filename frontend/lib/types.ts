// Shared types conforming byte-for-byte to Part A10 of FasalSakshi Plan

export type Farmer = {
  id: number;
  name: string;
  phone: string;
  language: 'hi' | 'en';
  village: string;
  district: string;
  state: string;
};

export type Field = {
  id: number;
  farmer_id: number;
  name: string;
  crop: string;
  lat: number;
  lon: number;
  area_ha: number;
  farmer: Farmer;
};

export type ReadingIn = {
  field_id: number;
  ts?: string;
  soil_moisture_pct: number;
  soil_temp_c: number;
  air_temp_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  soil_ec_ds_m: number;
  soil_ph: number;
  scenario?: string;
};

export type Reading = ReadingIn & {
  id: number;
  ts: string;
};

export type ImageRec = {
  id: number;
  field_id: number;
  ts: string;
  role: 'baseline' | 'before' | 'after' | 'routine';
  lat: number | null;
  lon: number | null;
  sha256: string;
  prev_hash: string;
  chain_hash: string;
  url: string; /* "/api/images/{id}/file" */
};

export type Weather = {
  rain_24h_mm: number;
  max_gust_kmh: number;
  min_temp_c: number;
  max_temp_c: number;
  weather_code: number;
  source: 'open-meteo' | 'mock';
};

export type EventRec = {
  id: number;
  field_id: number;
  ts: string;
  peril: 'hail' | 'flood' | 'drought' | 'frost' | 'fertilizer_spike';
  source: 'weather' | 'simulated';
  weather: Weather | null;
  canopy_loss_pct: number;
  weather_score: number;
  visual_score: number;
  sensor_score: number; // each 0..1
  confidence: number;
  confidence_label: 'High' | 'Medium' | 'Low';
  status: 'open' | 'claim_prepared' | 'anomaly';
  before_image_id: number | null;
  after_image_id: number | null;
};

export type ClaimRec = {
  id: number;
  event_id: number;
  field_id: number;
  created_ts: string;
  claimability: 'individual' | 'area_based' | 'not_covered';
  peril: string;
  covered: boolean;
  claim_low: number | null;
  claim_high: number | null;
  confidence: number;
  confidence_label: 'High' | 'Medium' | 'Low';
  deadline_ts: string | null;
  report_channel: {
    channel: string;
    helpline: string;
    note: string;
  };
  note: string;
  report_url: string; /* "/api/claims/{id}/report.pdf" */
};

export type Alert = {
  id: number;
  field_id: number;
  ts: string;
  channel: 'whatsapp' | 'sms' | 'app';
  language: 'en' | 'hi';
  kind: 'damage_detected' | 'deadline_reminder' | 'anomaly' | 'price';
  message: string;
  status: 'sent' | 'logged' | 'failed';
};

export type SimulateResult = {
  scenario: string;
  event: EventRec | null;
  claim: ClaimRec | null;
  alert: Alert | null;
};

export type InputLog = {
  id: number;
  field_id: number;
  ts: string;
  input_type: string;
  description: string;
  is_chemical: boolean;
};

export type TrustScore = {
  score: number; /* 0-100 */
  label: 'Strong' | 'Moderate' | 'Weak';
  components: {
    log_completeness: number; /* 0-40 */
    photo_continuity: number; /* 0-30 */
    anomaly_free: number; /* 0-30 */
  };
  flags: {
    ts: string;
    type: string;
    detail: string;
  }[];
  disclaimer: string; /* "Evidence strength, not certification." */
};

export type MarketRow = {
  market: string;
  district: string;
  state: string;
  commodity: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrival_date: string;
};

export type MarketPrices = {
  commodity: string;
  source: 'agmarknet' | 'fallback_csv';
  as_of: string;
  rows: MarketRow[];
};

export type BestMandiOption = {
  market: string;
  district: string;
  distance_km: number;
  modal_price: number;
  transport_cost_per_qtl: number;
  net_price_per_qtl: number;
  net_total: number;
};

export type BestMandi = {
  commodity: string;
  quantity_q: number;
  assumptions: {
    transport_rs_per_qtl_km: number;
    road_factor: number;
    note: string;
  };
  options: BestMandiOption[]; // sorted best first
  best: string;
  organic_premium: {
    low_pct: number;
    high_pct: number;
    note: string; /* "Indicative only, not from mandi data" */
  };
};

export type ChainVerifyResult = {
  valid: boolean;
  length: number;
  broken_at_image_id: number | null;
  head_hash: string;
};

export type CheckWeatherResult = {
  triggered: boolean;
  weather: Weather;
  event: EventRec | null;
  claim: ClaimRec | null;
};

export type Policy = {
  id?: number;
  scheme: string;
  policy_no: string;
  crop: string;
  season: string;
  area_ha: number;
  sum_insured_per_ha: number;
  sum_insured_total: number;
  deductible_pct: number;
  reporting_window_hours: number;
  perils: {
    individual: string[];
    area_based: string[];
  };
  thresholds: Record<string, any>;
  report_to: {
    channel: string;
    helpline: string;
    note: string;
  };
};

export type TopPrediction = {
  label: string;
  confidence: number;
};

export type DiseasePrediction = {
  label: string;
  crop: string;
  disease: string;
  healthy: boolean;
  confidence: number;
  top3: TopPrediction[];
};
