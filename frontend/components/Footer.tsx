'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { Sprout, ShieldAlert, Sliders } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-agri-600 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{t.brandName}</span>
            </div>
            <p className="text-sm text-stone-400 max-w-md leading-relaxed">
              Autonomous farm field telemetry and cryptographic visual evidence unit. Automates crop
              insurance claim dossiers under PMFBY guidelines and provides market realization intelligence.
            </p>
            <div className="flex items-center space-x-2 text-xs text-stone-400 pt-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SHA-256 Hash Chain Integrity • Open-Meteo Verified • Agmarknet Connected</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t.dashboard}
                </Link>
              </li>
              <li>
                <Link href="/fields/1" className="hover:text-white transition-colors">
                  {t.sensors}
                </Link>
              </li>
              <li>
                <Link href="/fields/1/evidence" className="hover:text-white transition-colors">
                  {t.evidence}
                </Link>
              </li>
              <li>
                <Link href="/claims/1" className="hover:text-white transition-colors">
                  {t.claims}
                </Link>
              </li>
              <li>
                <Link href="/market" className="hover:text-white transition-colors">
                  {t.market}
                </Link>
              </li>
            </ul>
          </div>

          {/* Demo & Simulator */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-3">
              Hackathon Demo
            </h4>
            <p className="text-xs text-stone-400 mb-3">
              Access the demo simulator to test hail, flood, drought, frost, and fertilizer spike scenarios.
            </p>
            <Link
              href="/simulate"
              className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>{t.demoConsole}</span>
            </Link>
          </div>
        </div>

        {/* Disclaimer row */}
        <div className="border-t border-stone-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© 2026 FasalSakshi Project. Built for farmers and insurance transparency.</p>
          <p className="text-center sm:text-right">
            Estimates and automated indicators only. Final settlement is made by authorized PMFBY insurers.
          </p>
        </div>
      </div>
    </footer>
  );
}
