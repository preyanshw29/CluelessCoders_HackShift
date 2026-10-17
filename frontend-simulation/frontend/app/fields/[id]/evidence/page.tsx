'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { getImages, verifyChain, uploadImage, getFullImageUrl } from '@/lib/api';
import { ImageRec, ChainVerifyResult } from '@/lib/types';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  Camera,
  Calendar,
  MapPin,
  Hash,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';

export default function EvidenceVaultPage() {
  const params = useParams();
  const fieldId = Number(params?.id || 1);
  const { t, language } = useLanguage();

  const [images, setImages] = useState<ImageRec[]>([]);
  const [verification, setVerification] = useState<ChainVerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ImageRec['role']>('routine');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  async function loadEvidence() {
    try {
      const [imgs, verify] = await Promise.all([
        getImages(fieldId),
        verifyChain(fieldId),
      ]);
      setImages(imgs);
      setVerification(verify);
    } catch (e) {
      console.error('Failed to load evidence:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvidence();
  }, [fieldId]);

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const truncateHash = (h?: string) => {
    if (!h) return '—';
    if (h.length <= 16) return h;
    return `${h.slice(0, 8)}...${h.slice(-8)}`;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadMessage(language === 'hi' ? 'कृपया एक फोटो चुनें' : 'Please select an image file');
      return;
    }

    try {
      setUploading(true);
      setUploadMessage(null);
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('role', selectedRole);
      fd.append('lat', '21.2514');
      fd.append('lon', '81.6296');

      await uploadImage(fieldId, fd);
      setSelectedFile(null);
      setUploadMessage(
        language === 'hi'
          ? 'तस्वीर सफलतापूर्वक हैश श्रृंखला में दर्ज की गई!'
          : 'Image successfully ingested into hash chain!'
      );
      await loadEvidence();
    } catch (err: any) {
      setUploadMessage(`Upload error: ${err.message || 'Failed'}`);
    } finally {
      setUploading(false);
    }
  };

  const getRoleBadge = (role: ImageRec['role']) => {
    switch (role) {
      case 'baseline':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: t.roleBaseline,
        };
      case 'before':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          label: t.roleBefore,
        };
      case 'after':
        return {
          bg: 'bg-red-100 text-red-900 border-red-300',
          label: t.roleAfter,
        };
      case 'routine':
      default:
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          label: t.roleRoutine,
        };
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/fields/${fieldId}`}
            className="inline-flex items-center space-x-1 text-xs font-bold text-agri-700 hover:text-agri-900 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.viewFieldDetails}</span>
          </Link>
          <h1 className="text-3xl font-black text-stone-900 flex items-center space-x-3">
            <ShieldCheck className="w-8 h-8 text-agri-700" />
            <span>{t.evidenceTitle}</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">{t.evidenceSubtitle}</p>
        </div>
      </div>

      {/* Verification Status Card */}
      <div
        className={`p-6 rounded-3xl border shadow-sm transition-all ${
          verification?.valid
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white border-emerald-300'
            : 'bg-gradient-to-br from-red-500/10 via-red-50/50 to-white border-red-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-2xl text-white font-bold shrink-0 ${
                verification?.valid ? 'bg-emerald-600 shadow-md shadow-emerald-600/20' : 'bg-red-600'
              }`}
            >
              {verification?.valid ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <ShieldAlert className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t.chainStatus}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    verification?.valid ? 'bg-emerald-200 text-emerald-950' : 'bg-red-200 text-red-950'
                  }`}
                >
                  {verification?.valid ? 'IMMUTABLE' : 'TAMPER DETECTED'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                {verification?.valid ? t.chainVerified : t.chainBroken}
              </h2>
              {verification && !verification.valid && (
                <p className="text-xs text-red-700 font-bold">
                  Broken at Block Image #{verification.broken_at_image_id}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-stone-200/80 pt-4 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-stone-500 font-medium">{t.totalImages}</span>
              <div className="text-xl font-black text-stone-900 mt-0.5">
                {verification?.length ?? images.length}
              </div>
            </div>
            <div>
              <span className="text-stone-500 font-medium">{t.headHash}</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="font-mono text-stone-800 text-[11px] font-bold">
                  {truncateHash(verification?.head_hash)}
                </span>
                {verification?.head_hash && (
                  <button
                    type="button"
                    onClick={() => handleCopy(verification.head_hash)}
                    className="p-1 rounded hover:bg-stone-200 text-stone-500"
                    title="Copy full SHA-256 hash"
                  >
                    {copiedHash === verification.head_hash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-agri-100 text-agri-800 flex items-center justify-center font-bold">
            <Camera className="w-5 h-5 text-agri-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">{t.uploadPhotoTitle}</h3>
            <p className="text-xs text-stone-500">
              {language === 'hi'
                ? 'प्रत्येक अपलोड के साथ SHA-256 हैश व मेटाडेटा पिछली तस्वीर से लिंक होकर नया ब्लॉक बनाता है।'
                : 'Each upload hashes the image bytes and chains to the previous block SHA-256 hash.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">{t.selectRole}</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as ImageRec['role'])}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
              >
                <option value="routine">{t.roleRoutine}</option>
                <option value="baseline">{t.roleBaseline}</option>
                <option value="before">{t.roleBefore}</option>
                <option value="after">{t.roleAfter}</option>
              </select>
            </div>

            {/* File Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">{t.fileLabel}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-agri-100 file:text-agri-800 hover:file:bg-agri-200"
              />
            </div>
          </div>

          {uploadMessage && (
            <div className="p-3 rounded-xl bg-agri-50 border border-agri-200 text-xs font-semibold text-agri-900">
              {uploadMessage}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? t.uploading : t.uploadButton}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Vertical Image Timeline */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-stone-900 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-agri-700" />
          <span>{t.timelineTitle}</span>
        </h3>

        {images.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center text-stone-500 text-sm">
            {t.noImagesYet}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-agri-300">
            {images.map((img, idx) => {
              const roleInfo = getRoleBadge(img.role);
              const isFirst = idx === 0;
              const isLast = idx === images.length - 1;

              return (
                <div
                  key={img.id}
                  className="relative bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Connector Node Dot */}
                  <div className="absolute -left-6 sm:-left-8 top-6 -translate-x-1/2 w-5 h-5 rounded-full bg-agri-600 border-4 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-bold" />

                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Image Thumbnail / Visual Representation */}
                    <div className="w-full lg:w-56 h-44 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative shrink-0 flex items-center justify-center">
                      {img.url ? (
                        <img
                          src={getFullImageUrl(img.url)}
                          alt={`${img.role} capture`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Render fallback placeholder SVG
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-t from-stone-900/60 via-transparent to-transparent pointer-events-none">
                        <ImageIcon className="w-8 h-8 text-white/70 mb-1" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Block #{img.id} • {img.role}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Hashes */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${roleInfo.bg}`}
                          >
                            {img.role}
                          </span>
                          <span className="text-xs font-bold text-stone-500">
                            Block ID: #{img.id}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 font-medium">
                          {new Date(img.ts).toUTCString()}
                        </span>
                      </div>

                      {/* GPS & Location */}
                      <div className="flex items-center space-x-1 text-xs text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {t.photoGps}: {img.lat?.toFixed(4) ?? '21.2514'}° N,{' '}
                          {img.lon?.toFixed(4) ?? '81.6296'}° E
                        </span>
                      </div>

                      {/* Cryptographic Hashes Block */}
                      <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-1.5 text-xs font-mono">
                        {/* Image SHA-256 */}
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 text-[11px] font-sans font-semibold">
                            {t.photoSha}:
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-stone-800">{truncateHash(img.sha256)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(img.sha256)}
                              className="p-0.5 hover:text-agri-700"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Prev Hash */}
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 text-[11px] font-sans font-semibold">
                            {t.photoPrev}:
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-stone-600">{truncateHash(img.prev_hash)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(img.prev_hash)}
                              className="p-0.5 hover:text-agri-700"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Chain Hash */}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                          <span className="text-agri-900 text-[11px] font-sans font-bold">
                            {t.photoChain}:
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-agri-900 font-bold">
                              {truncateHash(img.chain_hash)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(img.chain_hash)}
                              className="p-0.5 hover:text-agri-700"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3 text-agri-800" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
