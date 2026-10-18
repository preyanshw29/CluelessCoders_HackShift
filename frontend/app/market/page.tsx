'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  getPrices,
  getBestMandi,
  getTrustScore,
  getInputs,
  addInput,
} from '@/lib/api';
import {
  MarketPrices,
  BestMandi,
  TrustScore,
  InputLog,
} from '@/lib/types';
import {
  TrendingUp,
  Truck,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  MapPin,
  Scale,
  Award,
  Leaf,
} from 'lucide-react';

export default function MarketAndOrganicPage() {
  const { t, language } = useLanguage();

  const [prices, setPrices] = useState<MarketPrices | null>(null);
  const [bestMandi, setBestMandi] = useState<BestMandi | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [inputs, setInputs] = useState<InputLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [inputType, setInputType] = useState('compost');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  async function loadData() {
    try {
      const [p, b, s, i] = await Promise.all([
        getPrices('Tomato', 'Chhattisgarh'),
        getBestMandi(1, 10),
        getTrustScore(1),
        getInputs(1),
      ]);
      setPrices(p);
      setBestMandi(b);
      setTrustScore(s);
      setInputs(i);
    } catch (e) {
      console.error('Failed to load market data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormFeedback(language === 'hi' ? 'कृपया विवरण दर्ज करें' : 'Please enter a description');
      return;
    }

    try {
      setSubmitting(true);
      setFormFeedback(null);
      await addInput(1, { input_type: inputType, description: description.trim() });
      setDescription('');
      setFormFeedback(
        language === 'hi'
          ? 'प्रविष्टि सफलतापूर्वक दर्ज की गई!'
          : 'Farm input logged successfully!'
      );
      // Reload inputs & trust score
      const [updatedScore, updatedInputs] = await Promise.all([
        getTrustScore(1),
        getInputs(1),
      ]);
      setTrustScore(updatedScore);
      setInputs(updatedInputs);
    } catch (err: any) {
      setFormFeedback(`Error: ${err.message || 'Failed to submit'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-agri-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-600 font-medium animate-pulse">{t.refreshingNow}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-agri-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-agri-500 text-white">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Agmarknet & Net Realization Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t.marketTitle}</h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">{t.marketSubtitle}</p>
        </div>
      </div>

      {/* Best Mandi After Transport Optimization Card */}
      {bestMandi && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-stone-900">{t.bestMandiCardTitle}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-200 text-amber-950">
                    {t.bestMandiBadge}: {bestMandi.best}
                  </span>
                </div>
                <p className="text-xs text-stone-500">{t.bestMandiSub}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold text-stone-500">
                {language === 'hi' ? 'परिकलित मात्रा:' : 'Simulated Load:'}
              </span>
              <div className="text-lg font-black text-stone-900">{bestMandi.quantity_q} Quintals</div>
            </div>
          </div>

          {/* Mandi Options Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{t.market}</th>
                  <th className="py-3 px-3">{t.district}</th>
                  <th className="py-3 px-3">{t.distance}</th>
                  <th className="py-3 px-3">{t.modalPrice}</th>
                  <th className="py-3 px-3">{t.freightCost}</th>
                  <th className="py-3 px-4 font-bold text-stone-900">{t.netRealization}</th>
                  <th className="py-3 px-4 text-right font-bold text-stone-900">
                    {t.netTotalEstimated}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bestMandi.options.map((opt) => {
                  const isBest = opt.market === bestMandi.best;
                  return (
                    <tr
                      key={opt.market}
                      className={
                        isBest
                          ? 'bg-amber-50/70 font-bold text-amber-950'
                          : 'hover:bg-stone-50 text-stone-700'
                      }
                    >
                      <td className="py-3 px-4 flex items-center space-x-2">
                        <span>{opt.market}</span>
                        {isBest && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-black">
                            BEST
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-500">{opt.district}</td>
                      <td className="py-3 px-3">{opt.distance_km.toFixed(1)} km</td>
                      <td className="py-3 px-3">₹{opt.modal_price.toLocaleString()}</td>
                      <td className="py-3 px-3 text-red-600">
                        -₹{opt.transport_cost_per_qtl.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-black text-stone-900 text-sm">
                        ₹{opt.net_price_per_qtl.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-agri-900 text-sm">
                        ₹{opt.net_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Transport Assumptions & Indicative Organic Premium Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 space-y-1">
              <span className="font-bold text-stone-800 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-stone-500" />
                <span>{t.bestMandiSub}</span>
              </span>
              <p className="leading-relaxed">{bestMandi.assumptions.note}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-agri-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <span className="font-bold text-emerald-900 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.organicPremiumTitle}</span>
              </span>
              <div className="text-base font-black text-emerald-900">
                +{bestMandi.organic_premium.low_pct}% to +{bestMandi.organic_premium.high_pct}% Premium
              </div>
              <p className="text-[11px] text-emerald-800 leading-snug">
                {bestMandi.organic_premium.note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Mandi Prices Table Card */}
      {prices && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-stone-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-agri-700" />
                <span>
                  {t.mandiPricesTitle} ({prices.commodity})
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                {prices.source === 'agmarknet'
                  ? t.mandiSourceAgmarknet
                  : t.mandiSourceFallback}{' '}
                • As of: {formatDate(prices.as_of)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{t.market}</th>
                  <th className="py-3 px-3">{t.district}</th>
                  <th className="py-3 px-3">{t.arrivalDate}</th>
                  <th className="py-3 px-3">{t.minPrice}</th>
                  <th className="py-3 px-3">{t.maxPrice}</th>
                  <th className="py-3 px-4 font-bold text-stone-900">{t.modalPrice}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {prices.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 text-stone-700">
                    <td className="py-3 px-4 font-bold text-stone-900">{row.market}</td>
                    <td className="py-3 px-3 text-stone-500">{row.district}</td>
                    <td className="py-3 px-3">{row.arrival_date}</td>
                    <td className="py-3 px-3">₹{row.min_price}</td>
                    <td className="py-3 px-3">₹{row.max_price}</td>
                    <td className="py-3 px-4 font-black text-agri-900 text-sm">₹{row.modal_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Organic Trust Score & Field Evidence Record */}
      {trustScore && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Leaf className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">{t.organicTrustTitle}</h3>
                <p className="text-xs text-stone-500">
                  Automated telemetry index based on log continuity, photo chain & EC anomalies
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-xs font-semibold text-stone-400">Rating:</span>
                <div
                  className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                    trustScore.label === 'Strong'
                      ? 'bg-emerald-100 text-emerald-900'
                      : trustScore.label === 'Moderate'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-red-100 text-red-900'
                  }`}
                >
                  {trustScore.label === 'Strong'
                    ? t.scoreLabelStrong
                    : trustScore.label === 'Moderate'
                    ? t.scoreLabelModerate
                    : t.scoreLabelWeak}
                </div>
              </div>

              {/* Gauge Score Number */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-agri-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
                <span className="text-2xl font-black">{trustScore.score}</span>
              </div>
            </div>
          </div>

          {/* Component Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex justify-between text-xs font-bold text-stone-700">
                <span>{t.completenessScore}</span>
                <span className="font-mono text-stone-900">
                  {trustScore.components.log_completeness}/40
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${(trustScore.components.log_completeness / 40) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex justify-between text-xs font-bold text-stone-700">
                <span>{t.continuityScore}</span>
                <span className="font-mono text-stone-900">
                  {trustScore.components.photo_continuity}/30
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${(trustScore.components.photo_continuity / 30) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex justify-between text-xs font-bold text-stone-700">
                <span>{t.anomalyFreeScore}</span>
                <span className="font-mono text-stone-900">
                  {trustScore.components.anomaly_free}/30
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${(trustScore.components.anomaly_free / 30) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Flags List (Anomalies or Chemical Spikes) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-stone-900">{t.detectedFlagsTitle}</h4>
            {trustScore.flags.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.noFlags}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {trustScore.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start space-x-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="font-bold uppercase tracking-wider">{flag.type}</strong>
                        <span className="text-[11px] text-amber-800">{formatDate(flag.ts)}</span>
                      </div>
                      <p className="text-stone-700">{flag.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statutory Organic Disclaimer */}
          <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-600 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-bold text-stone-800">{t.organicDisclaimer}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Input Log Form & Recent Inputs History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 pb-2 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-agri-100 text-agri-800 flex items-center justify-center font-bold">
            <PlusCircle className="w-5 h-5 text-agri-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">{t.logInputTitle}</h3>
            <p className="text-xs text-stone-500">
              Record organic composts or chemical applications. Chemical inputs will adjust the trust score.
            </p>
          </div>
        </div>

        <form onSubmit={handleInputSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">{t.inputTypeLabel}</label>
              <select
                value={inputType}
                onChange={(e) => setInputType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
              >
                <option value="compost">{t.inputTypeLabel}: Compost</option>
                <option value="vermicompost">Vermicompost</option>
                <option value="neem_spray">Neem Spray (Organic)</option>
                <option value="other">Other Organic Brew / Bio-fertilizer</option>
                <option value="urea">Urea (Chemical Fertilizer)</option>
                <option value="dap">DAP (Chemical Fertilizer)</option>
                <option value="pesticide">Chemical Pesticide</option>
                <option value="herbicide">Chemical Herbicide</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-stone-700">{t.inputDescLabel}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.inputDescPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:ring-2 focus:ring-agri-500 focus:outline-none"
              />
            </div>
          </div>

          {formFeedback && (
            <div className="p-3 rounded-xl bg-agri-50 border border-agri-200 text-xs font-semibold text-agri-900">
              {formFeedback}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? t.submitting : t.submitInput}</span>
            </button>
          </div>
        </form>

        {/* Recent Inputs History */}
        <div className="space-y-3 pt-4 border-t border-stone-100">
          <h4 className="text-sm font-bold text-stone-900">{t.inputHistoryTitle}</h4>
          <div className="space-y-2">
            {inputs.map((inp) => (
              <div
                key={inp.id}
                className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs gap-4"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${
                      inp.is_chemical
                        ? 'bg-red-100 text-red-900 border border-red-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {inp.is_chemical ? t.chemicalType : t.organicType}
                  </span>
                  <div>
                    <strong className="text-stone-900 capitalize">{inp.input_type.replace('_', ' ')}: </strong>
                    <span className="text-stone-700">{inp.description}</span>
                  </div>
                </div>
                <span className="text-stone-400 shrink-0">{formatDate(inp.ts)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
