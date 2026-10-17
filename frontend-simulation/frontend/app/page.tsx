'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import {
  getField,
  getReadings,
  getAlerts,
  getClaims,
  getEvents,
  getFullReportUrl,
} from '@/lib/api';
import { Field, Reading, Alert, ClaimRec, EventRec } from '@/lib/types';
import {
  Sprout,
  Droplets,
  Thermometer,
  CloudRain,
  Wind,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  PhoneCall,
  Download,
  Activity,
  Sliders,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [field, setField] = useState<Field | null>(null);
  const [latestReading, setLatestReading] = useState<Reading | null>(null);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [latestClaim, setLatestClaim] = useState<ClaimRec | null>(null);
  const [latestEvent, setLatestEvent] = useState<EventRec | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      try {
        const [fieldData, readingsData, alertsData, claimsData, eventsData] =
          await Promise.allSettled([
            getField(1),
            getReadings(1, 1),
            getAlerts(1),
            getClaims(1),
            getEvents(1),
          ]);

        if (!mounted) return;

        if (fieldData.status === 'fulfilled') setField(fieldData.value);
        if (readingsData.status === 'fulfilled' && readingsData.value.length > 0) {
          setLatestReading(readingsData.value[0]);
        }
        if (alertsData.status === 'fulfilled' && alertsData.value.length > 0) {
          setLatestAlert(alertsData.value[0]);
        }
        if (claimsData.status === 'fulfilled' && claimsData.value.length > 0) {
          setLatestClaim(claimsData.value[0]);
        }
        if (eventsData.status === 'fulfilled' && eventsData.value.length > 0) {
          setLatestEvent(eventsData.value[0]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-agri-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-600 font-medium animate-pulse">
          {language === 'hi' ? 'डैशबोर्ड लोड हो रहा है...' : 'Loading field dashboard...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Hero Welcome */}
      <div className="relative overflow-hidden bg-gradient-to-r from-agri-900 via-agri-850 to-agri-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-agri-950/10 border border-agri-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-agri-700/60 text-agri-200 border border-agri-600/50 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{language === 'hi' ? 'सक्रिय निगरानी इकाई' : 'Active Field Monitoring'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {field?.name || 'North Plot'} - {field?.crop || 'Tomato'}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-agri-100 font-medium">
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-agri-300" />
                <span>
                  {field?.farmer.village}, {field?.farmer.district}, {field?.farmer.state}
                </span>
              </span>
              <span>•</span>
              <span>
                {t.farmer}: <strong className="text-white">{field?.farmer.name}</strong>
              </span>
              <span>•</span>
              <span>
                {t.area}: <strong className="text-white">{field?.area_ha} Ha</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/fields/1"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-agri-900 font-bold text-sm hover:bg-agri-50 transition-colors shadow-md"
            >
              <Activity className="w-4 h-4 text-agri-700" />
              <span>{t.viewFieldDetails}</span>
            </Link>
            <Link
              href="/claims/1"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-agri-700/80 hover:bg-agri-600 text-white font-bold text-sm border border-agri-500/50 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4 text-agri-200" />
              <span>{t.claims}</span>
            </Link>
            <Link
              href="/simulate"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm transition-colors shadow-md"
            >
              <Sliders className="w-4 h-4" />
              <span>{t.demoConsole}</span>
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-96 h-96 bg-agri-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Sensor Tiles Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-agri-700" />
            <h2 className="text-xl font-bold text-stone-900">{t.liveSensorsSummary}</h2>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {t.photoTimestamp}: {formatDate(latestReading?.ts)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* Soil Moisture */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm hover:border-agri-400 transition-colors">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold">{t.soilMoisture}</span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              {latestReading?.soil_moisture_pct?.toFixed(1) ?? '—'}
              <span className="text-sm font-normal text-stone-500 ml-0.5">%</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              {latestReading && latestReading.soil_moisture_pct >= 40 && latestReading.soil_moisture_pct <= 70
                ? t.optimal
                : t.warning}
            </div>
          </div>

          {/* Soil Temp */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm hover:border-agri-400 transition-colors">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold">{t.soilTemp}</span>
              <Thermometer className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              {latestReading?.soil_temp_c?.toFixed(1) ?? '—'}
              <span className="text-sm font-normal text-stone-500 ml-0.5">°C</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              {t.normal}
            </div>
          </div>

          {/* Air Temp */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm hover:border-agri-400 transition-colors">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold">{t.airTemp}</span>
              <Thermometer className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              {latestReading?.air_temp_c?.toFixed(1) ?? '—'}
              <span className="text-sm font-normal text-stone-500 ml-0.5">°C</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full inline-block">
              {t.normal}
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm hover:border-agri-400 transition-colors">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold">{t.humidity}</span>
              <Wind className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              {latestReading?.humidity_pct?.toFixed(1) ?? '—'}
              <span className="text-sm font-normal text-stone-500 ml-0.5">%</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full inline-block">
              {t.normal}
            </div>
          </div>

          {/* Rainfall */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm hover:border-agri-400 transition-colors">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold">{t.rainfall}</span>
              <CloudRain className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              {latestReading?.rainfall_mm?.toFixed(1) ?? '0.0'}
              <span className="text-sm font-normal text-stone-500 ml-0.5">mm</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full inline-block">
              {latestReading && latestReading.rainfall_mm > 5 ? t.warning : t.normal}
            </div>
          </div>

          {/* Soil EC */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm hover:border-agri-400 transition-colors">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold">{t.soilEc}</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              {latestReading?.soil_ec_ds_m?.toFixed(2) ?? '—'}
              <span className="text-xs font-normal text-stone-500 ml-0.5">dS/m</span>
            </div>
            <div
              className={`mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                latestReading && latestReading.soil_ec_ds_m > 2.0
                  ? 'text-red-700 bg-red-100'
                  : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              {latestReading && latestReading.soil_ec_ds_m > 2.0 ? t.warning : t.optimal}
            </div>
          </div>

          {/* Soil pH */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm hover:border-agri-400 transition-colors">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold">{t.soilPh}</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              {latestReading?.soil_ph?.toFixed(1) ?? '—'}
            </div>
            <div className="mt-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              {t.optimal} (6.5)
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Grid: Latest Alert & Claim Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Alert Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{t.latestAlertTitle}</h3>
                  <p className="text-xs text-stone-500">{formatDate(latestAlert?.ts)}</p>
                </div>
              </div>
              {latestAlert && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {latestAlert.channel} • {latestAlert.status}
                </span>
              )}
            </div>

            {latestAlert ? (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-stone-800 text-sm leading-relaxed font-medium">
                {latestAlert.message}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 text-sm">
                {t.noAlerts}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-stone-500">
              {language === 'hi' ? 'अलर्ट सीधे किसान के व्हाट्सएप पर भेजे जाते हैं' : 'Alerts dispatched via WhatsApp / SMS'}
            </span>
            <Link
              href="/simulate"
              className="text-agri-700 hover:text-agri-800 font-bold inline-flex items-center space-x-1"
            >
              <span>{language === 'hi' ? 'अलर्ट इनबॉक्स देखें' : 'View Inbox'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Latest Claim Summary Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-agri-100 text-agri-800 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-agri-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{t.latestClaimTitle}</h3>
                  <p className="text-xs text-stone-500">
                    {latestClaim ? `${t.photoRole}: ${latestClaim.peril.toUpperCase()}` : t.noActiveClaims}
                  </p>
                </div>
              </div>

              {latestClaim && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    latestClaim.confidence_label === 'High'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {latestClaim.confidence_label} {t.confidenceLevel}
                </span>
              )}
            </div>

            {latestClaim ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-stone-500 font-medium">{t.claimEstimateTitle}</span>
                    <div className="text-xl font-black text-agri-900">
                      {latestClaim.claim_low !== null && latestClaim.claim_high !== null ? (
                        <>₹{latestClaim.claim_low.toLocaleString()} - ₹{latestClaim.claim_high.toLocaleString()}</>
                      ) : (
                        <span className="text-stone-600 text-sm">{t.areaBasedClaim}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-stone-500 font-medium">{t.reportingDeadline}</span>
                    <div className="text-sm font-bold text-stone-800 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{formatDate(latestClaim.deadline_ts || undefined)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <span>
                    {t.helpline}: <strong>{latestClaim.report_channel.helpline}</strong>
                  </span>
                  <span>
                    {language === 'hi' ? 'नीति:' : 'Policy:'} <strong>DEMO-2026-0001</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 text-sm">
                {t.noActiveClaims}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between gap-3">
            {latestClaim ? (
              <>
                <Link
                  href={`/claims/${latestClaim.id}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-agri-800 hover:text-agri-950"
                >
                  <span>{t.viewClaimDetails}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href={getFullReportUrl(latestClaim.report_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadPdf}</span>
                </a>
              </>
            ) : (
              <Link
                href="/simulate"
                className="text-xs font-bold text-agri-700 hover:text-agri-800 inline-flex items-center space-x-1"
              >
                <span>{language === 'hi' ? 'आपदा परिदृश्य चलाएं' : 'Simulate an event in demo'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-stone-900">{t.quickLinks}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/fields/1/evidence"
            className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-agri-500 hover:shadow-md transition-all space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 group-hover:text-agri-800 text-base">
              {t.evidence}
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              {language === 'hi'
                ? 'क्रिप्टोग्राफिक SHA-256 हैश चेन द्वारा सुरक्षित तस्वीरों का सत्यापन व ऑडिट ट्रेल।'
                : 'Inspect tamper-proof cryptographic hash-chained field photo captures and verify block continuity.'}
            </p>
          </Link>

          <Link
            href="/market"
            className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-agri-500 hover:shadow-md transition-all space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 group-hover:text-amber-800 text-base">
              {t.market}
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              {language === 'hi'
                ? 'लाइव मंडी भाव, परिवहन भाड़ा घटाकर शुद्ध प्राप्ति एवं प्रमाणिक जैविक साक्ष्य स्कोर।'
                : 'Mandi pricing intelligence, road freight net calculation, and evidence-backed organic score.'}
            </p>
          </Link>

          <Link
            href="/simulate"
            className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-500 hover:shadow-md transition-all space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 group-hover:text-amber-900 text-base">
              {t.demoConsole}
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              {language === 'hi'
                ? 'ओलावृष्टि, बाढ़, सूखा, पाला एवं उर्वरक स्पाइक परिदृश्यों का सीधा टेस्ट एवं मोबाइल व्यू।'
                : 'Execute disaster simulations (hail, flood, drought, frost, fertilizer spike) with live farmer alerts.'}
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
