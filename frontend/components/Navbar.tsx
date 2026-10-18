"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";
import {
  Sprout,
  Activity,
  ShieldCheck,
  FileText,
  TrendingUp,
  Menu,
  X
} from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("dashboard"), icon: Sprout },
    { href: "/fields/1", label: t("telemetry"), icon: Activity },
    { href: "/fields/1/evidence", label: t("evidence"), icon: ShieldCheck },
    { href: "/claims/1", label: t("claims"), icon: FileText },
    { href: "/market", label: t("market"), icon: TrendingUp },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors">
                Fasalpramaaan
              </span>
              <span className="hidden md:block text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Verifiable Farm Evidence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-200/60"
                      : "text-gray-600 hover:text-emerald-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-emerald-600" : "text-gray-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  language === "en"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  language === "hi"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                हिन्दी
              </button>
            </div>

          </div>

          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="px-2 py-1 text-xs font-bold bg-gray-100 border border-gray-200 rounded text-gray-700"
            >
              {language === "en" ? "हिन्दी" : "EN"}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  active
                    ? "bg-emerald-50 text-emerald-800 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 text-emerald-600" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
