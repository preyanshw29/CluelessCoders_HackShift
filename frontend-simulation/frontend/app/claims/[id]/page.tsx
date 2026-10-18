'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { getClaim, getEvent, getImages, getFullReportUrl, getFullImageUrl } from '@/lib/api';
import { ClaimRec, EventRec, ImageRec } from '@/lib/types';
import {
  FileText,
  ShieldCheck,
  Clock,
  PhoneCall,
  Download,
  AlertTriangle,
  CheckCircle2,
  CloudSun,
  Activity,
  Image as ImageIcon,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';

export default function ClaimHeroPage() {
  const params = useParams();
  const claimId = Number(params?.id || 1);
  const { t, language } = useLanguage();

  const [claim, setClaim] = useState<ClaimRec | null>(null);
  const [event, setEvent] = useState<EventRec | null>(null);
  const [beforeImage, setBeforeImage] = useState<ImageRec | null>(null);
  const [afterImage, setAfterImage] = useState<ImageRec | null>(null);
  const [loading, setLoading] = useState(true);

  // Live countdown state
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    let mounted = true;

    async function loadClaimData() {
      try {
        const claimData = await getClaim(claimId);
        if (!mounted) return;
        setClaim(claimData);

        let eventData: EventRec | null = null;
        if (claimData.event_id) {
          eventData = await getEvent(claimData.event_id);
          if (mounted) setEvent(eventData);
        }

        const allImages = await getImages(claimData.field_id);
        if (mounted && allImages.length > 0) {
          let before = eventData?.before_image_id
            ? allImages.find((img) => img.id === eventData.before_image_id)
            : null;
          let after = eventData?.after_image_id
            ? allImages.find((img) => img.id === eventData.after_image_id)
            : null;

          if (!before) {
            const befores = allImages.filter((img) => img.role === 'before');
            before = befores[befores.length - 1] || allImages[0];
          }
          if (!after) {
            const afters = allImages.filter((img) => img.role === 'after');
            after = afters[afters.length - 1] || allImages[allImages.length - 1];
          }

          setBeforeImage(before);
          setAfterImage(after);
        }
      } catch (err) {
        console.error('Failed to load claim:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadClaimData();
    return () => {
      mounted = false;
    };
  }, [claimId]);

  // Real-time countdown timer tick
  useEffect(() => {
    if (!claim?.deadline_ts) return;

    function updateCountdown() {
      const deadline = new Date(claim!.deadline_ts!).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, expired: false });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [claim?.deadline_ts]);

  const formatDate = (isoString?: string | null) => {
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
        <p className="text-stone-600 font-medium animate-pulse">{t.refreshingNow}</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Claim dossier not found</h2>
        <Link href="/" className="inline-block text-sm font-bold text-agri-700">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Values from event or claim with fallbacks conforming to Part A12
  const weatherScore = event ? event.weather_score : 1.0;
  const visualScore = event ? event.visual_score : 0.85;
  const sensorScore = event ? event.sensor_score : 0.80;
  const confidenceVal = claim.confidence || (event ? event.confidence : 0.78);
  const confidenceLabel = claim.confidence_label || (event ? event.confidence_label : 'High');
  const canopyLoss = event ? event.canopy_loss_pct : 42.5;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-stone-500">
        <Link href="/" className="hover:text-agri-800">
          {t.dashboard}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/fields/${claim.field_id}`} className="hover:text-agri-800">
          {t.field} #{claim.field_id}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-stone-900">Claim #{claim.id}</span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-br from-agri-900 via-agri-850 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-agri-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-agri-500 text-white shadow-sm">
                {claim.peril.toUpperCase()} PERIL
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  claim.claimability === 'individual'
                    ? 'bg-emerald-400 text-stone-950'
                    : claim.claimability === 'area_based'
                    ? 'bg-blue-400 text-stone-950'
                    : 'bg-stone-500 text-white'
                }`}
              >
                {claim.claimability === 'individual'
                  ? t.individualClaim
                  : claim.claimability === 'area_based'
                  ? t.areaBasedClaim
                  : t.notCoveredClaim}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {t.claimDossierTitle} #{claim.id}
            </h1>
            <p className="text-xs sm:text-sm text-agri-100 max-w-2xl">{t.claimHeroSubtitle}</p>
          </div>

          {/* Action button */}
          <div className="flex sm:flex-col gap-3 shrink-0">
            <a
              href={getFullReportUrl(claim.report_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white text-agri-950 font-black text-sm hover:bg-agri-50 transition-all shadow-lg hover:shadow-xl group"
            >
              <Download className="w-4 h-4 text-agri-800 group-hover:scale-110 transition-transform" />
              <span>{t.downloadPdfButton}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Stats Banner: Estimated Range & Live Deadline Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Claim Range Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {t.claimEstimateTitle}
              </span>
              <span className="text-[11px] font-semibold text-agri-700 bg-agri-50 px-2 py-0.5 rounded-full border border-agri-200">
                PMFBY Standard
              </span>
            </div>

            {claim.claimability === 'individual' && claim.claim_low !== null && claim.claim_high !== null ? (
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-agri-900 tracking-tight">
                  ₹{claim.claim_low.toLocaleString()} - ₹{claim.claim_high.toLocaleString()}
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  {t.claimEstimateSub} (Deductible: 10%, Sum Insured: ₹1,20,000)
                </p>
              </div>
            ) : claim.claimability === 'area_based' ? (
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-blue-900">
                  {t.areaBasedClaim}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {claim.note ||
                    'Widespread loss assessed on area basis via Crop Cutting Experiments (CCE). Individual claim calculation not applicable.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xl font-bold text-stone-700">{t.notCoveredClaim}</div>
                <p className="text-xs text-stone-500">{claim.note}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 mt-4 flex items-center space-x-2 text-xs text-stone-500">
            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="leading-snug">{claim.note}</span>
          </div>
        </div>

        {/* Live Countdown Deadline Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white rounded-3xl p-6 sm:p-7 border border-amber-300 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                {t.reportingDeadline}
              </span>
              <span className="flex items-center space-x-1 text-xs font-bold text-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>72h Rule</span>
              </span>
            </div>

            {timeLeft.expired ? (
              <div className="text-2xl font-black text-red-600">{t.deadlinePassed}</div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl sm:text-4xl font-black text-stone-900 font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}:
                    {String(timeLeft.minutes).padStart(2, '0')}:
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    {t.deadlineRemaining}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  {language === 'hi' ? 'अंतिम तिथि:' : 'Must report before:'}{' '}
                  <strong>{formatDate(claim.deadline_ts)}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-amber-200/60 mt-4 flex items-center justify-between text-xs">
            <span className="text-stone-600">
              {t.helpline}: <strong>{claim.report_channel.helpline}</strong>
            </span>
            <a
              href={`tel:${claim.report_channel.helpline}`}
              className="inline-flex items-center space-x-1 font-bold text-amber-900 hover:text-amber-950"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'कॉल करें' : 'Call Helpline'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Triple Corroboration Breakdown Bars */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-stone-900">{t.confidenceScoreTitle}</h3>
            <p className="text-xs text-stone-500">
              {language === 'hi'
                ? 'मौसम सूचकांक (40%), दृष्टिगोचर कैनोपी परिवर्तन (40%), एवं सेंसर डेटा (20%) का संयुक्त भारित स्कोर।'
                : 'Weighted algorithmic consensus: 40% Weather trigger, 40% Visual loss, 20% Sensor telemetry.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-200">
            <span className="text-xs text-stone-500 font-bold uppercase">{t.confidenceLevel}:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                confidenceLabel === 'High'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {confidenceLabel} ({(confidenceVal * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* 3 Labelled Progress Bars */}
        <div className="space-y-5">
          {/* Bar 1: Weather evidence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1.5 text-stone-800">
                <CloudSun className="w-4 h-4 text-indigo-600" />
                <span>{t.weatherEvidence} (Weight 40%)</span>
              </span>
              <span className="font-mono text-stone-900">{(weatherScore * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, weatherScore * 100)}%` }}
              />
            </div>
          </div>

          {/* Bar 2: Visual change */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1.5 text-stone-800">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>{t.visualLoss} (Weight 40%)</span>
              </span>
              <span className="font-mono text-stone-900">{(visualScore * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, visualScore * 100)}%` }}
              />
            </div>
          </div>

          {/* Bar 3: Sensor corroboration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1.5 text-stone-800">
                <Activity className="w-4 h-4 text-amber-600" />
                <span>{t.sensorCorroboration} (Weight 20%)</span>
              </span>
              <span className="font-mono text-stone-900">{(sensorScore * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, sensorScore * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Before & After Visual Comparison Side-by-Side */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-stone-900">{t.damageComparisonTitle}</h3>
            <p className="text-xs text-stone-500">
              Fixed-angle canopy comparison evaluated by MobileNet / HSV vegetation index
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-red-100 text-red-900 border border-red-200 text-xs font-black inline-flex items-center space-x-1.5 self-start sm:self-auto">
            <span>{t.canopyLossComputed}:</span>
            <span className="text-sm font-black">{canopyLoss.toFixed(1)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-800">
                {t.baselineImage}
              </span>
              <span className="text-stone-500">{formatDate(beforeImage?.ts)}</span>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
              {beforeImage?.url ? (
                <img
                  src={getFullImageUrl(beforeImage.url)}
                  alt="Pre-disaster crop baseline"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent p-4 text-white">
                <span className="mt-auto font-bold text-xs uppercase tracking-wider bg-emerald-700/80 px-2 py-0.5 rounded">
                  Healthy Vegetative Canopy (71.2% Green)
                </span>
              </div>
            </div>
          </div>

          {/* After Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-900 border border-red-200">
                {t.postDisasterImage}
              </span>
              <span className="text-stone-500">{formatDate(afterImage?.ts)}</span>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
              {afterImage?.url ? (
                <img
                  src={getFullImageUrl(afterImage.url)}
                  alt="Post-disaster crop evidence"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-red-950/80 via-transparent to-transparent p-4 text-white">
                <span className="mt-auto font-bold text-xs uppercase tracking-wider bg-red-700/80 px-2 py-0.5 rounded">
                  {claim?.peril === 'flood'
                    ? (language === 'hi' ? 'जलमग्नता और जड़ गलन' : 'Inundation & Submergence')
                    : claim?.peril === 'drought'
                    ? (language === 'hi' ? 'नमी ह्रास और पत्तियां सूखना' : 'Moisture Depletion & Scorching')
                    : claim?.peril === 'frost'
                    ? (language === 'hi' ? 'शीत परिगलन और मुरझाव' : 'Freeze Necrosis & Wilt')
                    : (language === 'hi' ? 'पत्तियों और तने का कटना' : 'Defoliation & Tearing')}{' '}
                  ({canopyLoss.toFixed(1)}% {language === 'hi' ? 'नुकसान' : 'Loss'})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Where to Report & Contact Guide */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
          <PhoneCall className="w-5 h-5 text-agri-700" />
          <span>{t.whereToReportTitle}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">{t.helpline}</span>
            <div className="text-xl font-black text-agri-900">
              {claim.report_channel.helpline}
            </div>
            <p className="text-[11px] text-stone-500">Toll-free 24x7 Kisan Helpline</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">{t.reportChannel}</span>
            <div className="text-sm font-bold text-stone-900 leading-snug">
              {claim.report_channel.channel}
            </div>
            <p className="text-[11px] text-stone-500">Authorized Claim Submission Portals</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">{t.reportInstructions}</span>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              {claim.report_channel.note}
            </p>
          </div>
        </div>
      </div>

      {/* Regulatory & Insurer Disclaimer */}
      <div className="p-5 rounded-2xl bg-stone-100 border border-stone-200/90 text-stone-600 text-xs leading-relaxed flex items-start space-x-3">
        <Info className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-800 font-bold">{t.disclaimerTitle}:</strong>{' '}
          {t.insurerDisclaimer}
        </div>
      </div>
    </div>
  );
}
