import {
  Farmer,
  Field,
  Reading,
  ImageRec,
  EventRec,
  ClaimRec,
  Alert,
  TrustScore,
  MarketPrices,
  BestMandi,
  InputLog,
  ChainVerifyResult,
  Policy,
  SimulateResult,
} from './types';

export const mockFarmer: Farmer = {
  id: 1,
  name: 'Ramesh Kumar',
  phone: '+919876543210',
  language: 'hi',
  village: 'Arang',
  district: 'Raipur',
  state: 'Chhattisgarh',
};

export const mockField: Field = {
  id: 1,
  farmer_id: 1,
  name: 'North Plot',
  crop: 'Tomato',
  lat: 21.2514,
  lon: 81.6296,
  area_ha: 1.5,
  farmer: mockFarmer,
};

export const mockPolicy: Policy = {
  id: 1,
  scheme: 'PMFBY-style sample policy (verify real rules before quoting)',
  policy_no: 'DEMO-2026-0001',
  crop: 'tomato',
  season: 'rabi_2026',
  area_ha: 1.5,
  sum_insured_per_ha: 80000,
  sum_insured_total: 120000,
  deductible_pct: 10,
  reporting_window_hours: 72,
  perils: {
    individual: ['hail', 'flood'],
    area_based: ['drought', 'frost'],
  },
  thresholds: {
    hail: { weather_codes: [96, 99], min_gust_kmh: 50 },
    flood: { min_rain_24h_mm: 100 },
    drought: { max_soil_moisture_pct: 15 },
    frost: { max_min_temp_c: 2 },
  },
  report_to: {
    channel: 'Crop Insurance app / insurer helpline / bank branch',
    helpline: '14447',
    note: 'Sample value; verify current channel and window for the scheme and state.',
  },
};

// Generate 24 realistic readings
export const mockReadings: Reading[] = Array.from({ length: 24 }, (_, i) => {
  const hoursAgo = 23 - i;
  const d = new Date(Date.now() - hoursAgo * 3600 * 1000);
  const isStorm = hoursAgo < 6;
  return {
    id: i + 1,
    field_id: 1,
    ts: d.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    soil_moisture_pct: isStorm ? 62.4 + (i % 5) * 1.5 : 46.5 + (i % 4) * 0.8,
    soil_temp_c: isStorm ? 19.2 - (i % 3) * 0.4 : 24.1 + (i % 3) * 0.5,
    air_temp_c: isStorm ? 15.3 - (i % 4) * 0.5 : 28.6 + (i % 5) * 0.6,
    humidity_pct: isStorm ? 91.0 + (i % 3) * 1.2 : 62.0 + (i % 6) * 1.5,
    rainfall_mm: isStorm ? 8.5 + (i % 4) * 2.1 : 0.0,
    soil_ec_ds_m: 0.95 + (i % 3) * 0.05,
    soil_ph: 6.6 + (i % 2) * 0.1,
    scenario: isStorm ? 'hail' : 'normal',
  };
});

// 3 hash-chained images with SVG placeholder URLs
export const mockImages: ImageRec[] = [
  {
    id: 1,
    field_id: 1,
    ts: '2026-10-10T08:00:00Z',
    role: 'baseline',
    lat: 21.2514,
    lon: 81.6296,
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    chain_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    url: '/api/images/1/file',
  },
  {
    id: 2,
    field_id: 1,
    ts: '2026-10-16T07:30:00Z',
    role: 'before',
    lat: 21.2514,
    lon: 81.6296,
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    prev_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    chain_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    url: '/api/images/2/file',
  },
  {
    id: 3,
    field_id: 1,
    ts: '2026-10-17T14:15:00Z',
    role: 'after',
    lat: 21.2514,
    lon: 81.6296,
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    prev_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    chain_hash: 'b14a7b8059d9f0e79391e59c69512b65059d14d793864ee3a666937425575790',
    url: '/api/images/3/file',
  },
];

export const mockChainVerify: ChainVerifyResult = {
  valid: true,
  length: 3,
  broken_at_image_id: null,
  head_hash: 'b14a7b8059d9f0e79391e59c69512b65059d14d793864ee3a666937425575790',
};

// Realistic Hail Event & Claim
const eventTimestamp = new Date(Date.now() - 4 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const deadlineTimestamp = new Date(Date.now() + 68 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

export const mockEvent: EventRec = {
  id: 1,
  field_id: 1,
  ts: eventTimestamp,
  peril: 'hail',
  source: 'simulated',
  weather: {
    rain_24h_mm: 35,
    max_gust_kmh: 78,
    min_temp_c: 13,
    max_temp_c: 20,
    weather_code: 96,
    source: 'mock',
  },
  canopy_loss_pct: 42.5,
  weather_score: 1.0,
  visual_score: 0.85,
  sensor_score: 0.80,
  confidence: 0.78,
  confidence_label: 'High',
  status: 'claim_prepared',
  before_image_id: 2,
  after_image_id: 3,
};

export const mockClaim: ClaimRec = {
  id: 1,
  event_id: 1,
  field_id: 1,
  created_ts: eventTimestamp,
  claimability: 'individual',
  peril: 'hail',
  covered: true,
  claim_low: 24000,
  claim_high: 48000,
  confidence: 0.78,
  confidence_label: 'High',
  deadline_ts: deadlineTimestamp,
  report_channel: {
    channel: 'Crop Insurance app / insurer helpline / bank branch',
    helpline: '14447',
    note: 'Sample value; verify current channel and window for the scheme and state.',
  },
  note: 'Individual claim for localized calamity. Final settlement is the insurer\'s decision.',
  report_url: '/api/claims/1/report.pdf',
};

export const mockAlerts: Alert[] = [
  {
    id: 1,
    field_id: 1,
    ts: eventTimestamp,
    channel: 'whatsapp',
    language: 'hi',
    kind: 'damage_detected',
    message: 'उत्तर खेत (टमाटर) में ओलावृष्टि से भारी क्षति का संकेत मिला है। 72 घंटे के भीतर 14447 पर रिपोर्ट करें। संभावित दावा अनुमान: ₹24,000 - ₹48,000।',
    status: 'sent',
  },
  {
    id: 2,
    field_id: 1,
    ts: eventTimestamp,
    channel: 'app',
    language: 'en',
    kind: 'damage_detected',
    message: 'Heavy hail damage detected in North Plot (tomato). Report to helpline 14447 before deadline. Est: ₹24,000 - ₹48,000.',
    status: 'logged',
  },
  {
    id: 3,
    field_id: 1,
    ts: new Date(Date.now() - 2 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    channel: 'whatsapp',
    language: 'hi',
    kind: 'deadline_reminder',
    message: 'स्मरण पत्र: फसल क्षति बीमा सूचना की समय-सीमा 68 घंटे शेष है। डिजिटल साक्ष्य पीडीएफ ऐप से डाउनलोड करें।',
    status: 'sent',
  },
  {
    id: 4,
    field_id: 1,
    ts: new Date(Date.now() - 24 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    channel: 'app',
    language: 'en',
    kind: 'price',
    message: 'Raipur mandi modal price for Tomato reached ₹2,200/qtl (+₹150 from yesterday).',
    status: 'logged',
  },
];

export const mockMarketPrices: MarketPrices = {
  commodity: 'Tomato',
  source: 'agmarknet',
  as_of: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  rows: [
    {
      market: 'Raipur',
      district: 'Raipur',
      state: 'Chhattisgarh',
      commodity: 'Tomato',
      min_price: 1900,
      max_price: 2400,
      modal_price: 2200,
      arrival_date: '2026-10-17',
    },
    {
      market: 'Durg',
      district: 'Durg',
      state: 'Chhattisgarh',
      commodity: 'Tomato',
      min_price: 1800,
      max_price: 2250,
      modal_price: 2050,
      arrival_date: '2026-10-17',
    },
    {
      market: 'Bilaspur',
      district: 'Bilaspur',
      state: 'Chhattisgarh',
      commodity: 'Tomato',
      min_price: 2000,
      max_price: 2500,
      modal_price: 2350,
      arrival_date: '2026-10-17',
    },
    {
      market: 'Rajnandgaon',
      district: 'Rajnandgaon',
      state: 'Chhattisgarh',
      commodity: 'Tomato',
      min_price: 1750,
      max_price: 2100,
      modal_price: 1950,
      arrival_date: '2026-10-17',
    },
  ],
};

export const mockBestMandi: BestMandi = {
  commodity: 'Tomato',
  quantity_q: 10,
  assumptions: {
    transport_rs_per_qtl_km: 0.25,
    road_factor: 1.3,
    note: 'Transport cost = distance * 1.3 (road factor) * ₹0.25/qtl-km freight rate assumption.',
  },
  options: [
    {
      market: 'Raipur',
      district: 'Raipur',
      distance_km: 32.5,
      modal_price: 2200,
      transport_cost_per_qtl: 10.56,
      net_price_per_qtl: 2189.44,
      net_total: 21894.40,
    },
    {
      market: 'Bilaspur',
      district: 'Bilaspur',
      distance_km: 118.0,
      modal_price: 2350,
      transport_cost_per_qtl: 38.35,
      net_price_per_qtl: 2311.65,
      net_total: 23116.50,
    },
    {
      market: 'Durg',
      district: 'Durg',
      distance_km: 68.2,
      modal_price: 2050,
      transport_cost_per_qtl: 22.17,
      net_price_per_qtl: 2027.83,
      net_total: 20278.30,
    },
    {
      market: 'Rajnandgaon',
      district: 'Rajnandgaon',
      distance_km: 98.4,
      modal_price: 1950,
      transport_cost_per_qtl: 31.98,
      net_price_per_qtl: 1918.02,
      net_total: 19180.20,
    },
  ],
  best: 'Bilaspur',
  organic_premium: {
    low_pct: 10,
    high_pct: 30,
    note: 'Indicative only, not from mandi data; mandi prices are for conventional produce.',
  },
};

export const mockTrustScore: TrustScore = {
  score: 72,
  label: 'Strong',
  components: {
    log_completeness: 32,
    photo_continuity: 22,
    anomaly_free: 18,
  },
  flags: [
    {
      ts: '2026-10-12T10:45:00Z',
      type: 'ec_spike',
      detail: 'Soil EC rose to 2.4 dS/m during routine monitoring without an organic input logged in previous 7 days.',
    },
  ],
  disclaimer: 'Evidence strength, not certification. Official organic certification (NPOP / PGS-India) requires documented practices and lab residue tests.',
};

export const mockInputs: InputLog[] = [
  {
    id: 1,
    field_id: 1,
    ts: '2026-10-15T09:00:00Z',
    input_type: 'neem_spray',
    description: 'Preventive neem kernel aqueous extract application for pest repellency',
    is_chemical: false,
  },
  {
    id: 2,
    field_id: 1,
    ts: '2026-10-08T07:30:00Z',
    input_type: 'vermicompost',
    description: 'Applied 150 kg farm-made vermicompost along tomato ridges',
    is_chemical: false,
  },
  {
    id: 3,
    field_id: 1,
    ts: '2026-10-01T08:15:00Z',
    input_type: 'compost',
    description: 'Enriched cow dung compost applied during inter-cultivation',
    is_chemical: false,
  },
  {
    id: 4,
    field_id: 1,
    ts: '2026-09-24T16:00:00Z',
    input_type: 'other',
    description: 'Jeevamrut microbial brew drenching with irrigation water',
    is_chemical: false,
  },
];
