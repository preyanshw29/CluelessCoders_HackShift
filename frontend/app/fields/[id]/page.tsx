'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { getField, getReadings, getEvents } from '@/lib/api';
import { Field, Reading, EventRec } from '@/lib/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
  Bar,
  ComposedChart,
  Legend,
} from 'recharts';
import {
  Activity,
  Droplets,
  Thermometer,
  CloudRain,
  Wind,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  MapPin,
} from 'lucide-react';

export default function FieldTelemetryPage() {
  const params = useParams();
  const fieldId = Number(params?.id || 1);
  const { t, language } = useLanguage();

  const [field, setField] = useState<Field | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [latestEvent, setLatestEvent] = useState<EventRec | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial data & start 5-second polling interval
  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const [fieldRes, readingsRes, eventsRes] = await Promise.allSettled([
          getField(fieldId),
          getReadings(fieldId, 36),
          getEvents(fieldId),
        ]);

        if (!mounted) return;

        if (fieldRes.status === 'fulfilled') setField(fieldRes.value);
        if (readingsRes.status === 'fulfilled') {
          // Newest first from API -> reverse for chronological chart
          setReadings([...readingsRes.value].reverse());
        }
        if (eventsRes.status === 'fulfilled' && eventsRes.value.length > 0) {
          setLatestEvent(eventsRes.value[0]);
        }
      } catch (e) {
        console.error('Failed to load field data:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitial();

    // 5-second polling per contract requirement
    const intervalId = setInterval(async () => {
      try {
        setIsRefreshing(true);
        const updated = await getReadings(fieldId, 36);
        if (mounted && updated.length > 0) {
          setReadings([...updated].reverse());
        }
      } catch (err) {
        console.warn('Poll error:', err);
      } finally {
        if (mounted) setIsRefreshing(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [fieldId]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const chartData = readings.map((r) => {
    const timeStr = r.ts
      ? new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    return {
      time: timeStr,
      moisture: Number(r.soil_moisture_pct?.toFixed(1) || 0),
      soilTemp: Number(r.soil_temp_c?.toFixed(1) || 0),
      airTemp: Number(r.air_temp_c?.toFixed(1) || 0),
      humidity: Number(r.humidity_pct?.toFixed(1) || 0),
      rainfall: Number(r.rainfall_mm?.toFixed(1) || 0),
      ec: Number(r.soil_ec_ds_m?.toFixed(2) || 0),
      ph: Number(r.soil_ph?.toFixed(1) || 0),
    };
  });

  const latest = readings.length > 0 ? readings[readings.length - 1] : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-agri-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-600 font-medium animate-pulse">{t.refreshingNow}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section with live badge & evidence link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
              {field?.name || `Field #${fieldId}`} {t.sensors}
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span
                className={`w-2 h-2 rounded-full bg-emerald-600 ${
                  isRefreshing ? 'animate-ping' : ''
                }`}
              />
              <span>{t.livePollingBadge}</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium">
            {field?.crop} • {field?.area_ha} Ha • {field?.farmer.village}, {field?.farmer.district}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/fields/${fieldId}/evidence`}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.evidence}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Latest Event Banner (if event detected) */}
      {latestEvent && (
        <div
          className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            latestEvent.status === 'anomaly'
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-red-50/90 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`p-2.5 rounded-xl text-white font-bold shrink-0 ${
                latestEvent.status === 'anomaly' ? 'bg-amber-600' : 'bg-red-600'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">
                  {t.recentEventAlert}: {latestEvent.peril.toUpperCase()}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/80 border border-current">
                  {latestEvent.status}
                </span>
              </div>
              <p className="text-xs text-stone-700 mt-1">
                {t.photoTimestamp}: {formatDate(latestEvent.ts)} • {t.eventCanopyLoss}:{' '}
                <strong>{latestEvent.canopy_loss_pct?.toFixed(1)}%</strong> • {t.eventConfidence}:{' '}
                <strong>
                  {latestEvent.confidence_label} ({(latestEvent.confidence * 100).toFixed(0)}%)
                </strong>
              </p>
            </div>
          </div>

          <Link
            href={`/claims/1`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors shrink-0 shadow-sm"
          >
            <span>{t.viewClaimDetails}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Sensor Tiles Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-500 font-semibold">{t.soilMoisture}</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {latest?.soil_moisture_pct?.toFixed(1) ?? '—'}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-500 font-semibold">{t.soilTemp}</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {latest?.soil_temp_c?.toFixed(1) ?? '—'}°C
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-500 font-semibold">{t.airTemp}</span>
          <div className="text-2xl font-black text-red-600 mt-1">
            {latest?.air_temp_c?.toFixed(1) ?? '—'}°C
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-500 font-semibold">{t.humidity}</span>
          <div className="text-2xl font-black text-cyan-600 mt-1">
            {latest?.humidity_pct?.toFixed(1) ?? '—'}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-500 font-semibold">{t.rainfall}</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {latest?.rainfall_mm?.toFixed(1) ?? '0.0'} mm
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-500 font-semibold">{t.soilEc}</span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {latest?.soil_ec_ds_m?.toFixed(2) ?? '—'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-500 font-semibold">{t.soilPh}</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {latest?.soil_ph?.toFixed(1) ?? '—'}
          </div>
        </div>
      </div>

      {/* Chart 1: Soil Moisture & Rainfall */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              {t.chartsMoistureRain}
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-medium">Last 36 Readings</span>
        </div>

        {isMounted && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f2" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis
                  yAxisId="left"
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#2563eb' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="mm"
                  domain={[0, 30]}
                  tick={{ fontSize: 11, fill: '#4f46e5' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="moisture"
                  name={`${t.soilMoisture} (%)`}
                  stroke="#2563eb"
                  fill="#93c5fd"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
                <Bar
                  yAxisId="right"
                  dataKey="rainfall"
                  name={`${t.rainfall} (mm)`}
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: Temperature & Humidity */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-red-500" />
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              {t.chartsTempHumidity}
            </h3>
          </div>
        </div>

        {isMounted && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f2" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis
                  yAxisId="temp"
                  unit="°C"
                  domain={[0, 50]}
                  tick={{ fontSize: 11, fill: '#ef4444' }}
                />
                <YAxis
                  yAxisId="hum"
                  orientation="right"
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#06b6d4' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="airTemp"
                  name={`${t.airTemp} (°C)`}
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="soilTemp"
                  name={`${t.soilTemp} (°C)`}
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  yAxisId="hum"
                  type="monotone"
                  dataKey="humidity"
                  name={`${t.humidity} (%)`}
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 3: Soil EC & pH */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-base sm:text-lg font-bold text-stone-900">{t.chartsEcPh}</h3>
          </div>
        </div>

        {isMounted && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f2" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis
                  yAxisId="ec"
                  unit=" dS/m"
                  domain={[0, 4]}
                  tick={{ fontSize: 11, fill: '#f59e0b' }}
                />
                <YAxis
                  yAxisId="ph"
                  orientation="right"
                  domain={[4, 9]}
                  tick={{ fontSize: 11, fill: '#10b981' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  yAxisId="ec"
                  type="monotone"
                  dataKey="ec"
                  name={`${t.soilEc} (dS/m)`}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
                <Line
                  yAxisId="ph"
                  type="monotone"
                  dataKey="ph"
                  name={`${t.soilPh}`}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
