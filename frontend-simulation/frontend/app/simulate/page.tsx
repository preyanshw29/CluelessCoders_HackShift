'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { simulate, checkWeather, getAlerts, sendTestAlert } from '@/lib/api';
import { Alert, CheckWeatherResult } from '@/lib/types';
import {
  Sliders,
  CloudLightning,
  Waves,
  Sun,
  Snowflake,
  FlaskConical,
  CheckCircle2,
  CloudRain,
  Phone,
  Send,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCheck,
} from 'lucide-react';

export default function SimulationDemoPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [phoneLang, setPhoneLang] = useState<'hi' | 'en'>(language);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [weatherCheckResult, setWeatherCheckResult] = useState<CheckWeatherResult | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  async function loadAlerts() {
    try {
      const data = await getAlerts(1);
      setAlerts(data);
    } catch (err) {
      console.warn('Failed to fetch alerts:', err);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const runScenario = async (scenario: string) => {
    try {
      setSimulating(scenario);
      setFeedback(`${t.simulatingNow} (${scenario})`);

      const result = await simulate(scenario, 1);
      await loadAlerts();

      setFeedback(t.pipelineSuccess);

      // Routing rule per prompt:
      // If fertilizer_spike -> navigate to /market
      // Otherwise if claim exists -> navigate to /claims/{claim.id}
      setTimeout(() => {
        if (scenario === 'fertilizer_spike') {
          router.push('/market');
        } else if (result.claim) {
          router.push(`/claims/${result.claim.id}`);
        } else if (scenario === 'normal') {
          router.push('/');
        } else {
          router.push('/claims/1');
        }
      }, 1000);
    } catch (err: any) {
      setFeedback(`Simulation error: ${err.message || 'Execution failed'}`);
      setSimulating(null);
    }
  };

  const handleCheckWeather = async () => {
    try {
      setSimulating('weather');
      const res = await checkWeather(1);
      setWeatherCheckResult(res);
      await loadAlerts();

      if (res.triggered && res.claim) {
        setFeedback('Live weather threshold triggered! Opening claim dossier...');
        setTimeout(() => router.push(`/claims/${res.claim!.id}`), 1200);
      } else {
        setFeedback('Open-Meteo verified: No peril thresholds exceeded in current 24h weather.');
      }
    } catch (err: any) {
      setFeedback(`Weather check error: ${err.message || 'Failed to fetch Open-Meteo'}`);
    } finally {
      setSimulating(null);
    }
  };

  const handleSendTestAlert = async () => {
    try {
      setSendingTest(true);
      await sendTestAlert(1, phoneLang);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTest(false);
    }
  };

  // Filter alerts by the phone preview language toggle
  const filteredAlerts = alerts.filter(
    (a) => a.language === phoneLang || !a.language
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/40">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-stone-950">
            <Sliders className="w-3.5 h-3.5" />
            <span>Hackathon Live Judging Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t.simTitle}</h1>
          <p className="text-xs sm:text-sm text-amber-200 max-w-2xl">{t.simSubtitle}</p>
        </div>
      </div>

      {/* Main Grid: Left Controls (Scenarios) & Right Mobile WhatsApp Phone Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Big Action Buttons (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-900">{t.triggerScenario}</h3>
              <span className="text-xs font-semibold text-stone-500">
                Target: Field #1 (Tomato)
              </span>
            </div>

            {feedback && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
                  feedback.includes('error') || feedback.includes('Error')
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : 'bg-agri-50 text-agri-950 border border-agri-200 animate-pulse'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-agri-700" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Scenario Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Normal Conditions */}
              <button
                type="button"
                onClick={() => runScenario('normal')}
                disabled={Boolean(simulating)}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all shadow-sm flex flex-col justify-between space-y-3 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                    Healthy
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">{t.scenarioNormal}</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Reset baseline soil moisture (40-55%) & clear event status.
                  </p>
                </div>
                <div className="text-xs font-bold text-emerald-700 inline-flex items-center space-x-1">
                  <span>{simulating === 'normal' ? t.simulatingNow : 'Run Normal Flow'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Hailstorm */}
              <button
                type="button"
                onClick={() => runScenario('hail')}
                disabled={Boolean(simulating)}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all shadow-sm flex flex-col justify-between space-y-3 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <CloudLightning className="w-5 h-5 text-indigo-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                    Individual Claim
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">{t.scenarioHail}</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    78 km/h gusts, 42.5% canopy loss, ₹24k-₹48k payout estimate.
                  </p>
                </div>
                <div className="text-xs font-bold text-indigo-700 inline-flex items-center space-x-1">
                  <span>{simulating === 'hail' ? t.simulatingNow : 'Simulate Hail'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Flood */}
              <button
                type="button"
                onClick={() => runScenario('flood')}
                disabled={Boolean(simulating)}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all shadow-sm flex flex-col justify-between space-y-3 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Waves className="w-5 h-5 text-blue-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                    Individual Claim
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">{t.scenarioFlood}</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    140mm rainfall in 24h, soil moisture &gt;90%, high inundation.
                  </p>
                </div>
                <div className="text-xs font-bold text-blue-700 inline-flex items-center space-x-1">
                  <span>{simulating === 'flood' ? t.simulatingNow : 'Simulate Flood'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Drought */}
              <button
                type="button"
                onClick={() => runScenario('drought')}
                disabled={Boolean(simulating)}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all shadow-sm flex flex-col justify-between space-y-3 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Sun className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    Area-Based (CCE)
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">{t.scenarioDrought}</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Moisture &lt;14%, 42°C max temp, triggers widespread CCE clause.
                  </p>
                </div>
                <div className="text-xs font-bold text-amber-700 inline-flex items-center space-x-1">
                  <span>{simulating === 'drought' ? t.simulatingNow : 'Simulate Drought'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Frost */}
              <button
                type="button"
                onClick={() => runScenario('frost')}
                disabled={Boolean(simulating)}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-cyan-500 hover:bg-cyan-50/50 text-left transition-all shadow-sm flex flex-col justify-between space-y-3 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Snowflake className="w-5 h-5 text-cyan-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-900">
                    Area-Based
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">{t.scenarioFrost}</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Freezing temperature 0-3°C, vegetative leaf edge browning.
                  </p>
                </div>
                <div className="text-xs font-bold text-cyan-700 inline-flex items-center space-x-1">
                  <span>{simulating === 'frost' ? t.simulatingNow : 'Simulate Frost'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Fertilizer Spike (Anomaly) */}
              <button
                type="button"
                onClick={() => runScenario('fertilizer_spike')}
                disabled={Boolean(simulating)}
                className="p-5 rounded-2xl border-2 border-stone-200 hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all shadow-sm flex flex-col justify-between space-y-3 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <FlaskConical className="w-5 h-5 text-rose-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-900">
                    Input Anomaly
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">{t.scenarioFertilizer}</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Soil EC spikes to 2.8 dS/m; drops Organic Trust Score & flags input.
                  </p>
                </div>
                <div className="text-xs font-bold text-rose-700 inline-flex items-center space-x-1">
                  <span>
                    {simulating === 'fertilizer_spike' ? t.simulatingNow : 'Simulate Anomaly'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            {/* Check Live Weather button */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center space-x-1.5">
                  <CloudRain className="w-4 h-4 text-agri-700" />
                  <span>{t.checkLiveWeather}</span>
                </h4>
                <p className="text-xs text-stone-500">
                  Calls Open-Meteo API for Field 1 GPS coordinates (Raipur, 21.25°N, 81.63°E).
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckWeather}
                disabled={Boolean(simulating)}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${simulating === 'weather' ? 'animate-spin' : ''}`}
                />
                <span>{simulating === 'weather' ? 'Connecting...' : t.checkLiveWeather}</span>
              </button>
            </div>

            {weatherCheckResult && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                <div className="font-bold text-stone-800 flex items-center justify-between">
                  <span>Live Weather Response ({weatherCheckResult.weather.source}):</span>
                  <span>
                    Triggered:{' '}
                    <strong className={weatherCheckResult.triggered ? 'text-red-600' : 'text-emerald-600'}>
                      {weatherCheckResult.triggered ? 'YES' : 'NO'}
                    </strong>
                  </span>
                </div>
                <p className="text-stone-600">
                  Rain: {weatherCheckResult.weather.rain_24h_mm} mm | Gust:{' '}
                  {weatherCheckResult.weather.max_gust_kmh} km/h | Min/Max Temp:{' '}
                  {weatherCheckResult.weather.min_temp_c}°C /{' '}
                  {weatherCheckResult.weather.max_temp_c}°C
                </p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t.simNote}</p>
          </div>
        </div>

        {/* Right Column: Phone Mockup / WhatsApp Alert Simulator (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-[42px] p-3 bg-stone-900 shadow-2xl border-4 border-stone-800 relative">
            {/* Phone Screen Container */}
            <div className="w-full bg-[#0b141a] rounded-[34px] overflow-hidden flex flex-col h-[640px] text-stone-100 font-sans shadow-inner">
              {/* WhatsApp App Bar */}
              <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-stone-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-agri-600 flex items-center justify-center text-white font-bold text-sm shadow">
                    FS
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-100 flex items-center space-x-1">
                      <span>FasalSakshi Alerts</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      Official Insurance Verified Bot
                    </p>
                  </div>
                </div>

                {/* WhatsApp Language Toggle Pill */}
                <div className="flex items-center bg-stone-800/80 rounded-lg p-0.5 border border-stone-700 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPhoneLang('en')}
                    className={`px-2 py-0.5 rounded font-bold ${
                      phoneLang === 'en' ? 'bg-agri-600 text-white' : 'text-stone-400'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneLang('hi')}
                    className={`px-2 py-0.5 rounded font-bold ${
                      phoneLang === 'hi' ? 'bg-agri-600 text-white' : 'text-stone-400'
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0b141a] bg-opacity-95">
                <div className="text-center my-2">
                  <span className="text-[10px] bg-[#182229] text-stone-400 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
                    TODAY (PMFBY ALERTS)
                  </span>
                </div>

                {filteredAlerts.length === 0 ? (
                  <div className="p-4 text-center text-stone-500 text-xs mt-10">
                    No alerts in {phoneLang === 'hi' ? 'Hindi' : 'English'}. Tap &apos;Send Test Alert&apos; below!
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div key={alert.id} className="flex flex-col items-start max-w-[92%] space-y-0.5">
                      <div className="bg-[#202c33] text-stone-100 p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow-sm border border-stone-800/60">
                        {/* Kind tag */}
                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-stone-700/60 text-[10px] font-bold">
                          <span className="uppercase text-amber-400 tracking-wider">
                            {alert.kind.replace('_', ' ')}
                          </span>
                          <span className="text-stone-400 text-[9px] uppercase">
                            {alert.channel}
                          </span>
                        </div>

                        <p className="text-stone-200 font-sans">{alert.message}</p>

                        <div className="flex items-center justify-end space-x-1 mt-1.5 text-[10px] text-stone-400">
                          <span>
                            {new Date(alert.ts).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Footer / Action Bar */}
              <div className="bg-[#1f2c34] p-2.5 flex items-center justify-between gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={sendingTest}
                  className="flex-1 py-2 px-3 rounded-xl bg-agri-600 hover:bg-agri-500 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {sendingTest
                      ? 'Sending...'
                      : phoneLang === 'hi'
                      ? 'परीक्षण संदेश भेजें'
                      : 'Send Test Alert'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
