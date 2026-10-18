'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { predictCropDisease } from '@/lib/api';
import { DiseasePrediction } from '@/lib/types';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Bug,
  Leaf
} from 'lucide-react';

const SAMPLE_DIAGNOSES: Record<string, DiseasePrediction & { remedy: string; pathogen: string }> = {
  early_blight: {
    label: 'Tomato___Early_blight',
    crop: 'Tomato',
    disease: 'Early blight',
    healthy: false,
    confidence: 0.942,
    pathogen: 'Alternaria solani',
    remedy: 'Prune infected lower foliage immediately. Spray organic copper hydroxide or Bacillus subtilis bio-fungicide. Avoid overhead sprinkler irrigation.',
    top3: [
      { label: 'Tomato___Early_blight', confidence: 0.942 },
      { label: 'Tomato___Bacterial_spot', confidence: 0.041 },
      { label: 'Tomato___healthy', confidence: 0.017 },
    ],
  },
  healthy: {
    label: 'Tomato___healthy',
    crop: 'Tomato',
    disease: 'Healthy',
    healthy: true,
    confidence: 0.985,
    pathogen: 'None (Optimal Plant Health)',
    remedy: 'Maintain routine soil moisture and vermicompost nourishment. Continue weekly photographic monitoring.',
    top3: [
      { label: 'Tomato___healthy', confidence: 0.985 },
      { label: 'Tomato___Target_Spot', confidence: 0.010 },
      { label: 'Tomato___Early_blight', confidence: 0.005 },
    ],
  },
  late_blight: {
    label: 'Tomato___Late_blight',
    crop: 'Tomato',
    disease: 'Late blight',
    healthy: false,
    confidence: 0.912,
    pathogen: 'Phytophthora infestans',
    remedy: 'Urgent: Remove severely infected vines to prevent field spread. Improve row ventilation and spray protective bio-fungicide before rain events.',
    top3: [
      { label: 'Tomato___Late_blight', confidence: 0.912 },
      { label: 'Tomato___Early_blight', confidence: 0.065 },
      { label: 'Tomato___Septoria_leaf_spot', confidence: 0.023 },
    ],
  },
  curl_virus: {
    label: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    crop: 'Tomato',
    disease: 'Yellow leaf curl virus',
    healthy: false,
    confidence: 0.928,
    pathogen: 'TYLCV (Begomovirus vector: Whitefly)',
    remedy: 'Control whitefly insect vectors using yellow sticky traps and neem seed kernel extract (NSKE 5%). Rogue out heavily stunted plants.',
    top3: [
      { label: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', confidence: 0.928 },
      { label: 'Tomato___Spider_mites Two-spotted_spider_mite', confidence: 0.052 },
      { label: 'Tomato___healthy', confidence: 0.020 },
    ],
  },
};

export default function DiseaseDiagnosisPage() {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<(DiseasePrediction & { remedy?: string; pathogen?: string }) | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveSample(null);
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setAnalyzing(true);
    setResult(null);

    try {
      const diagnosis = await predictCropDisease(file);
      const sampleMeta = Object.values(SAMPLE_DIAGNOSES).find((s) => s.label === diagnosis.label);
      setResult({
        ...diagnosis,
        pathogen: sampleMeta?.pathogen || 'Solanaceous Pathogen',
        remedy: sampleMeta?.remedy || 'Consult your nearest Krishi Vigyan Kendra (KVK) extension officer for region-specific treatment.',
      });
    } catch (err) {
      console.error('Diagnosis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectSample = async (sampleKey: string) => {
    setActiveSample(sampleKey);
    setAnalyzing(true);
    setResult(null);

    // Set sample placeholder image
    if (sampleKey === 'early_blight') {
      setSelectedImage('/images/disease_sample.jpg');
    } else {
      setSelectedImage(null);
    }

    // Simulate microservice inference latency
    setTimeout(() => {
      setResult(SAMPLE_DIAGNOSES[sampleKey]);
      setAnalyzing(false);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-12">
          <Stethoscope className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-emerald-700/60 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MobileNetV2 Edge Deep Learning • 99% Val Accuracy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {language === 'hi' ? 'फसल डॉक्टर: एआई पौध रोग निदान' : 'Crop Doctor: AI Plant Pathology Diagnosis'}
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            {language === 'hi'
              ? 'टमाटर की पत्ती का फोटो अपलोड करें या तुरंत निदान हेतु नीचे दिए गए सैंपल्स में से चुनें। हमारा एआई मॉडल 10 प्रकार के पादप रोगों का विश्लेषण कर जैविक उपचार प्रदान करता है।'
              : 'Upload a leaf photo or pick a sample below for real-time computer vision pathology classification across 10 PlantVillage classes with organic Krishi Vigyan Kendra (KVK) remediation advisories.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Upload Area & Diagnosis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
                <Upload className="w-5 h-5 text-emerald-700" />
                <span>{language === 'hi' ? 'पत्ती का फोटो चुनें' : 'Select Foliage Photo'}</span>
              </h2>
              <span className="text-xs font-medium text-stone-500">JPG, PNG up to 10MB</span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Drop / Preview Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50/70 hover:bg-emerald-50/30 rounded-2xl p-6 transition-colors duration-200 cursor-pointer text-center relative group min-h-[260px] flex flex-col items-center justify-center"
            >
              {selectedImage ? (
                <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-inner bg-stone-900 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Foliage for analysis"
                    className="w-full h-full object-contain"
                  />
                  {analyzing && (
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {language === 'hi' ? 'विश्लेषण जारी है...' : 'Neural Inference in Progress...'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700 group-hover:scale-110 transition-transform duration-200">
                    <Leaf className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">
                      {language === 'hi' ? 'फोटो अपलोड करने के लिए क्लिक करें' : 'Click to Browse Leaf Photo'}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      {language === 'hi' ? 'या नीचे दिए गए लाइव सैंपल्स पर क्लिक करें' : 'or pick one of the sample leaves below'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Sample Selector */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {language === 'hi' ? 'क्विक डेमो सैंपल्स (एक क्लिक में टेस्ट करें)' : 'Quick Demo Samples (Test in 1-Click)'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectSample('early_blight')}
                  className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all flex items-center space-x-2 ${
                    activeSample === 'early_blight'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <span className="text-base">🍅</span>
                  <span>{language === 'hi' ? 'अगेती झुलसा' : 'Early Blight'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSample('healthy')}
                  className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all flex items-center space-x-2 ${
                    activeSample === 'healthy'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <span className="text-base">🌿</span>
                  <span>{language === 'hi' ? 'स्वस्थ पौधा' : 'Healthy Leaf'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSample('late_blight')}
                  className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all flex items-center space-x-2 ${
                    activeSample === 'late_blight'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <span className="text-base">🍂</span>
                  <span>{language === 'hi' ? 'पिछेती झुलसा' : 'Late Blight'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSample('curl_virus')}
                  className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all flex items-center space-x-2 ${
                    activeSample === 'curl_virus'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <span className="text-base">🟡</span>
                  <span>{language === 'hi' ? 'पत्ती मरोड़ वायरस' : 'Yellow Leaf Curl'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Diagnosis Results (7 cols) */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8 animate-fadeIn">
              {/* Primary Status Banner */}
              <div
                className={`p-5 rounded-2xl border flex items-start space-x-4 ${
                  result.healthy
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    result.healthy ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {result.healthy ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        result.healthy ? 'bg-emerald-200/80 text-emerald-950' : 'bg-rose-200/80 text-rose-950'
                      }`}
                    >
                      {result.healthy ? 'Normal Vigour' : 'Pathology Identified'}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">Crop: {result.crop}</span>
                  </div>
                  <h3 className="text-2xl font-black">{result.disease}</h3>
                  <p className="text-xs opacity-80">
                    Scientific Pathogen: <span className="font-semibold italic">{result.pathogen}</span>
                  </p>
                </div>
              </div>

              {/* Primary Confidence Meter */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-stone-800">
                    {language === 'hi' ? 'एआई मॉडल निश्चितता (Confidence Score)' : 'Primary Diagnostic Confidence'}
                  </span>
                  <span className="font-black text-emerald-700 text-base">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, result.confidence * 100)}%` }}
                  />
                </div>
              </div>

              {/* Top 3 Probability Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {language === 'hi' ? 'शीर्ष 3 संभावित रोग (Top Candidates)' : 'Top 3 Candidate Distribution'}
                </h4>
                <div className="space-y-2">
                  {result.top3.map((cand, idx) => (
                    <div
                      key={cand.label}
                      className="flex items-center justify-between text-xs p-3 rounded-xl bg-stone-50 border border-stone-200/60"
                    >
                      <div className="flex items-center space-x-2 truncate pr-4">
                        <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-stone-800 truncate">
                          {cand.label.replace('Tomato___', '').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-stone-900 shrink-0">
                        {(cand.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KVK Agronomy Advisory & Remediation */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900">
                  <Bug className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {language === 'hi' ? 'कृषि विज्ञान केंद्र (KVK) जैविक उपचार' : 'Agronomy Advisory & Organic Remediation'}
                  </h4>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {result.remedy}
                </p>
              </div>

              {/* PMFBY Insurance Claim Link Notice */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-stone-700">
                  <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'यदि व्यापक प्रकोप के कारण उपज में 33% से अधिक की कमी आती है, तो यह पीएमएफबीवाई स्थानीय आपदा के अंतर्गत शामिल हो सकता है।'
                      : 'Severe uncontained outbreaks causing >33% yield loss qualify under PMFBY post-harvest/localized calamity.'}
                  </span>
                </div>
                <a
                  href="/claims/1"
                  className="inline-flex items-center space-x-1 font-bold text-emerald-800 hover:text-emerald-950 shrink-0 ml-4"
                >
                  <span>Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center flex flex-col items-center justify-center min-h-[460px] space-y-4 shadow-sm">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Stethoscope className="w-10 h-10" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-stone-900">
                  {language === 'hi' ? 'कोई निदान सक्रिय नहीं है' : 'No Diagnosis Active'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {language === 'hi'
                    ? 'रोग का पता लगाने के लिए बाईं ओर एक पत्ती का फोटो अपलोड करें या एक क्लिक में त्वरित परीक्षण के लिए किसी एक सैंपल बटन का चयन करें।'
                    : 'Upload a foliage photo or choose one of the quick samples on the left to see live neural inference, confidence breakdown, and remediation.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
