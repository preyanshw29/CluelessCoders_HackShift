import {
  Farmer,
  Field,
  Reading,
  ReadingIn,
  ImageRec,
  EventRec,
  ClaimRec,
  Alert,
  SimulateResult,
  InputLog,
  TrustScore,
  MarketPrices,
  BestMandi,
  ChainVerifyResult,
  CheckWeatherResult,
  Policy,
} from './types';
import {
  mockField,
  mockPolicy,
  mockReadings,
  mockImages,
  mockChainVerify,
  mockEvent,
  mockClaim,
  mockAlerts,
  mockMarketPrices,
  mockBestMandi,
  mockTrustScore,
  mockInputs,
} from './mock';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

export const isMockEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mock') === '1') return true;
    if (urlParams.get('mock') === '0') return false;
  }
  return process.env.NEXT_PUBLIC_USE_MOCK === '1';
};

// Safe image and report URL helpers
export const getFullImageUrl = (relativeUrl: string): string => {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('data:')) {
    return relativeUrl;
  }
  return `${API_URL}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
};

export const getFullReportUrl = (relativeUrl: string): string => {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  return `${API_URL}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
};

// Internal mock state for dynamic demo interaction
let dynamicMockInputs: InputLog[] = [...mockInputs];
let dynamicMockAlerts: Alert[] = [...mockAlerts];
let dynamicMockTrustScore: TrustScore = { ...mockTrustScore };
let dynamicMockImages: ImageRec[] = [...mockImages];

export async function getFields(): Promise<Field[]> {
  if (isMockEnabled()) {
    return [mockField];
  }
  try {
    const res = await fetch(`${API_URL}/api/fields`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [data];
  } catch (err) {
    console.warn('[API] getFields failed, falling back to mock:', err);
    return [mockField];
  }
}

export async function getField(id: number): Promise<Field> {
  if (isMockEnabled()) {
    return mockField;
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getField(${id}) failed, falling back to mock:`, err);
    return mockField;
  }
}

export async function getPolicy(fieldId: number): Promise<Policy> {
  if (isMockEnabled()) {
    return mockPolicy;
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/policy`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getPolicy(${fieldId}) failed, falling back to mock:`, err);
    return mockPolicy;
  }
}

export async function getReadings(fieldId: number, limit = 200): Promise<Reading[]> {
  if (isMockEnabled()) {
    return mockReadings.slice(0, limit);
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/readings?limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getReadings(${fieldId}) failed, falling back to mock:`, err);
    return mockReadings.slice(0, limit);
  }
}

export async function postReading(reading: ReadingIn): Promise<Reading> {
  if (isMockEnabled()) {
    const newReading: Reading = {
      ...reading,
      id: Date.now(),
      ts: reading.ts || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    };
    return newReading;
  }
  const res = await fetch(`${API_URL}/api/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reading),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function getImages(fieldId: number): Promise<ImageRec[]> {
  if (isMockEnabled()) {
    return dynamicMockImages;
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/images`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getImages(${fieldId}) failed, falling back to mock:`, err);
    return dynamicMockImages;
  }
}

export async function uploadImage(
  fieldId: number,
  formData: FormData
): Promise<ImageRec> {
  if (isMockEnabled()) {
    const role = (formData.get('role') as ImageRec['role']) || 'routine';
    const newImg: ImageRec = {
      id: dynamicMockImages.length + 1,
      field_id: fieldId,
      ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      role,
      lat: mockField.lat,
      lon: mockField.lon,
      sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      prev_hash: dynamicMockImages[dynamicMockImages.length - 1]?.chain_hash || '0'.repeat(64),
      chain_hash: 'f0e1d2c3b4a5968778695a4b3c2d1e0ff0e1d2c3b4a5968778695a4b3c2d1e0f',
      url: `/api/images/${dynamicMockImages.length + 1}/file`,
    };
    dynamicMockImages.push(newImg);
    return newImg;
  }
  const res = await fetch(`${API_URL}/api/fields/${fieldId}/images`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Upload failed with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function verifyChain(fieldId: number): Promise<ChainVerifyResult> {
  if (isMockEnabled()) {
    return {
      ...mockChainVerify,
      length: dynamicMockImages.length,
      head_hash: dynamicMockImages[dynamicMockImages.length - 1]?.chain_hash || mockChainVerify.head_hash,
    };
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/chain/verify`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] verifyChain(${fieldId}) failed, falling back to mock:`, err);
    return mockChainVerify;
  }
}

export async function getEvents(fieldId: number): Promise<EventRec[]> {
  if (isMockEnabled()) {
    return [mockEvent];
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/events`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [data];
  } catch (err) {
    console.warn(`[API] getEvents(${fieldId}) failed, falling back to mock:`, err);
    return [mockEvent];
  }
}

export async function getEvent(id: number): Promise<EventRec> {
  if (isMockEnabled()) {
    return mockEvent;
  }
  try {
    const res = await fetch(`${API_URL}/api/events/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getEvent(${id}) failed, falling back to mock:`, err);
    return mockEvent;
  }
}

export async function getClaims(fieldId: number): Promise<ClaimRec[]> {
  if (isMockEnabled()) {
    return [mockClaim];
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/claims`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [data];
  } catch (err) {
    console.warn(`[API] getClaims(${fieldId}) failed, falling back to mock:`, err);
    return [mockClaim];
  }
}

export async function getClaim(id: number): Promise<ClaimRec> {
  if (isMockEnabled()) {
    return mockClaim;
  }
  try {
    const res = await fetch(`${API_URL}/api/claims/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getClaim(${id}) failed, falling back to mock:`, err);
    return mockClaim;
  }
}

export async function simulate(
  scenario: string,
  fieldId = 1
): Promise<SimulateResult> {
  if (isMockEnabled()) {
    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const deadlineIso = new Date(Date.now() + 72 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

    if (scenario === 'normal') {
      return { scenario: 'normal', event: null, claim: null, alert: null };
    }

    if (scenario === 'fertilizer_spike') {
      const anomalyEvent: EventRec = {
        id: Date.now(),
        field_id: fieldId,
        ts: nowIso,
        peril: 'fertilizer_spike',
        source: 'simulated',
        weather: {
          rain_24h_mm: 0,
          max_gust_kmh: 10,
          min_temp_c: 24,
          max_temp_c: 32,
          weather_code: 0,
          source: 'mock',
        },
        canopy_loss_pct: 0,
        weather_score: 0,
        visual_score: 0,
        sensor_score: 1.0,
        confidence: 0.20,
        confidence_label: 'Low',
        status: 'anomaly',
        before_image_id: null,
        after_image_id: null,
      };

      const anomalyAlert: Alert = {
        id: Date.now() + 1,
        field_id: fieldId,
        ts: nowIso,
        channel: 'whatsapp',
        language: 'hi',
        kind: 'anomaly',
        message: 'चेतावनी: उत्तर खेत में असामान्य मृदा विद्युत चालकता (EC) दर्ज की गई। रासायनिक अवशेष जोखिम की जांच करें।',
        status: 'sent',
      };

      dynamicMockAlerts.unshift(anomalyAlert);
      dynamicMockTrustScore = {
        ...dynamicMockTrustScore,
        score: Math.max(0, dynamicMockTrustScore.score - 20),
        label: 'Moderate',
        components: {
          ...dynamicMockTrustScore.components,
          anomaly_free: Math.max(0, dynamicMockTrustScore.components.anomaly_free - 15),
        },
        flags: [
          {
            ts: nowIso,
            type: 'ec_spike',
            detail: 'Simulated Fertilizer Spike: Soil EC exceeded 2.5 dS/m threshold.',
          },
          ...dynamicMockTrustScore.flags,
        ],
      };

      return {
        scenario,
        event: anomalyEvent,
        claim: null,
        alert: anomalyAlert,
      };
    }

    // Weather perils: hail, flood, drought, frost
    const isAreaBased = scenario === 'drought' || scenario === 'frost';
    const perilEvent: EventRec = {
      id: Date.now(),
      field_id: fieldId,
      ts: nowIso,
      peril: scenario as EventRec['peril'],
      source: 'simulated',
      weather: {
        rain_24h_mm: scenario === 'flood' ? 140 : scenario === 'hail' ? 35 : 0,
        max_gust_kmh: scenario === 'hail' ? 78 : 20,
        min_temp_c: scenario === 'frost' ? 1 : 18,
        max_temp_c: scenario === 'drought' ? 42 : 25,
        weather_code: scenario === 'hail' ? 96 : scenario === 'flood' ? 65 : 0,
        source: 'mock',
      },
      canopy_loss_pct: scenario === 'flood' ? 52.0 : scenario === 'hail' ? 42.5 : scenario === 'drought' ? 32.0 : 25.0,
      weather_score: 1.0,
      visual_score: 0.85,
      sensor_score: 0.80,
      confidence: 0.78,
      confidence_label: 'High',
      status: 'claim_prepared',
      before_image_id: 2,
      after_image_id: 3,
    };

    const perilClaim: ClaimRec = {
      id: Date.now() + 10,
      event_id: perilEvent.id,
      field_id: fieldId,
      created_ts: nowIso,
      claimability: isAreaBased ? 'area_based' : 'individual',
      peril: scenario,
      covered: true,
      claim_low: isAreaBased ? null : 24000,
      claim_high: isAreaBased ? null : 48000,
      confidence: 0.78,
      confidence_label: 'High',
      deadline_ts: deadlineIso,
      report_channel: {
        channel: 'Crop Insurance app / insurer helpline / bank branch',
        helpline: '14447',
        note: 'Sample value; verify current channel and window for the scheme and state.',
      },
      note: isAreaBased
        ? 'Widespread loss; assessed on area basis (crop cutting experiments). No individual claim estimate.'
        : 'Individual claim for localized calamity. Final settlement is the insurer\'s decision.',
      report_url: `/api/claims/${Date.now() + 10}/report.pdf`,
    };

    const perilAlert: Alert = {
      id: Date.now() + 20,
      field_id: fieldId,
      ts: nowIso,
      channel: 'whatsapp',
      language: 'hi',
      kind: 'damage_detected',
      message: `उत्तर खेत (टमाटर) में ${scenario} से क्षति दर्ज की गई। 14447 पर 72 घंटे में संपर्क करें।`,
      status: 'sent',
    };

    dynamicMockAlerts.unshift(perilAlert);

    return {
      scenario,
      event: perilEvent,
      claim: perilClaim,
      alert: perilAlert,
    };
  }

  const res = await fetch(`${API_URL}/api/simulate/${scenario}?field_id=${fieldId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Simulation failed with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function checkWeather(fieldId: number): Promise<CheckWeatherResult> {
  if (isMockEnabled()) {
    return {
      triggered: false,
      weather: {
        rain_24h_mm: 0.0,
        max_gust_kmh: 12.0,
        min_temp_c: 21.0,
        max_temp_c: 31.5,
        weather_code: 1,
        source: 'open-meteo',
      },
      event: null,
      claim: null,
    };
  }
  const res = await fetch(`${API_URL}/api/fields/${fieldId}/check-weather`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Weather check failed with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function getAlerts(fieldId: number): Promise<Alert[]> {
  if (isMockEnabled()) {
    return dynamicMockAlerts;
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/alerts`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getAlerts(${fieldId}) failed, falling back to mock:`, err);
    return dynamicMockAlerts;
  }
}

export async function sendTestAlert(fieldId = 1, language = 'hi'): Promise<Alert> {
  if (isMockEnabled()) {
    const newAlert: Alert = {
      id: Date.now(),
      field_id: fieldId,
      ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      channel: 'whatsapp',
      language: language as 'en' | 'hi',
      kind: 'damage_detected',
      message:
        language === 'hi'
          ? 'परीक्षण अलर्ट: फसल साक्षी प्रणाली सक्रिय है। आपके खेत की निगरानी सामान्य है।'
          : 'Test Alert: FasalSakshi field monitoring active. Telemetry healthy.',
      status: 'sent',
    };
    dynamicMockAlerts.unshift(newAlert);
    return newAlert;
  }
  const res = await fetch(`${API_URL}/api/alerts/test?field_id=${fieldId}&language=${language}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function getPrices(
  commodity = 'Tomato',
  state = 'Chhattisgarh'
): Promise<MarketPrices> {
  if (isMockEnabled()) {
    return mockMarketPrices;
  }
  try {
    const res = await fetch(
      `${API_URL}/api/market/prices?commodity=${encodeURIComponent(commodity)}&state=${encodeURIComponent(state)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] getPrices failed, falling back to mock:', err);
    return mockMarketPrices;
  }
}

export async function getBestMandi(fieldId = 1, quantityQ = 10): Promise<BestMandi> {
  if (isMockEnabled()) {
    return mockBestMandi;
  }
  try {
    const res = await fetch(
      `${API_URL}/api/market/best?field_id=${fieldId}&quantity_q=${quantityQ}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] getBestMandi failed, falling back to mock:', err);
    return mockBestMandi;
  }
}

export async function getInputs(fieldId: number): Promise<InputLog[]> {
  if (isMockEnabled()) {
    return dynamicMockInputs;
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/inputs`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getInputs(${fieldId}) failed, falling back to mock:`, err);
    return dynamicMockInputs;
  }
}

export async function addInput(
  fieldId: number,
  data: { input_type: string; description: string; ts?: string }
): Promise<InputLog> {
  if (isMockEnabled()) {
    const isChemical = ['urea', 'dap', 'pesticide', 'herbicide'].includes(data.input_type.toLowerCase());
    const newEntry: InputLog = {
      id: dynamicMockInputs.length + 1,
      field_id: fieldId,
      ts: data.ts || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      input_type: data.input_type,
      description: data.description,
      is_chemical: isChemical,
    };
    dynamicMockInputs.unshift(newEntry);
    if (isChemical) {
      dynamicMockTrustScore = {
        ...dynamicMockTrustScore,
        score: Math.max(0, dynamicMockTrustScore.score - 10),
        flags: [
          {
            ts: newEntry.ts,
            type: 'chemical_input',
            detail: `Chemical input logged: ${data.input_type} (${data.description})`,
          },
          ...dynamicMockTrustScore.flags,
        ],
      };
    }
    return newEntry;
  }
  const res = await fetch(`${API_URL}/api/fields/${fieldId}/inputs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Failed to log input with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function getTrustScore(fieldId: number): Promise<TrustScore> {
  if (isMockEnabled()) {
    return dynamicMockTrustScore;
  }
  try {
    const res = await fetch(`${API_URL}/api/fields/${fieldId}/trust-score`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] getTrustScore(${fieldId}) failed, falling back to mock:`, err);
    return dynamicMockTrustScore;
  }
}
