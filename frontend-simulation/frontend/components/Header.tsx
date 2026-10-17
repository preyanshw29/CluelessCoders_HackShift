'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Sprout,
  Activity,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  Sliders,
  Menu,
  X,
  Languages,
} from 'lucide-react';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.dashboard, icon: Activity },
    { href: '/fields/1', label: t.sensors, icon: Sprout },
    { href: '/fields/1/evidence', label: t.evidence, icon: ShieldCheck },
    { href: '/claims/1', label: t.claims, icon: FileSpreadsheet },
    { href: '/market', label: t.market, icon: TrendingUp },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-agri-200/80 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link
            href="/"
            className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-agri-500 rounded-lg p-1"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-agri-600 to-agri-800 flex items-center justify-center text-white shadow-md shadow-agri-600/20 group-hover:scale-105 transition-transform duration-200">
              <Sprout className="w-7 h-7 text-agri-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-agri-950 font-sans">
                  {t.brandName}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-agri-100 text-agri-800 rounded-full border border-agri-300">
                  PMFBY Ready
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-agri-700 text-white shadow-sm'
                      : 'text-stone-700 hover:text-agri-800 hover:bg-agri-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-agri-600'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls: Language toggle + Demo button + Mobile menu */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 shadow-inner">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-white text-agri-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === 'hi'
                    ? 'bg-agri-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="हिन्दी में बदलें"
              >
                हिन्दी
              </button>
            </div>

            {/* Simulation Demo Button */}
            <Link
              href="/simulate"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors shadow-sm"
              title="Open Demo & Scenario Simulator"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span>{t.demoConsole}</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-agri-50 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-agri-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold ${
                  active
                    ? 'bg-agri-700 text-white shadow-sm'
                    : 'text-stone-800 hover:bg-agri-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-agri-600'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <Link
            href="/simulate"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold bg-amber-50 text-amber-950 border border-amber-200"
          >
            <Sliders className="w-5 h-5 text-amber-700" />
            <span>{t.demoConsole} (Simulator)</span>
          </Link>
        </div>
      )}
    </header>
  );
}
