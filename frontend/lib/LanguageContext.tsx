'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, translations } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'hi',
  setLanguage: () => {},
  t: translations.hi,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('hi');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fasalsakshi_lang') as Language | null;
      if (saved === 'en' || saved === 'hi') {
        setLanguageState(saved);
      }
    } catch (e) {
      // Ignore localStorage access issues
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('fasalsakshi_lang', lang);
    } catch (e) {
      // Ignore localStorage access issues
    }
  };

  const t = translations[language] || translations.hi;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
