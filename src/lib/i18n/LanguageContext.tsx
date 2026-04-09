'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import t, { Lang } from './translations';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: typeof t['pt']; // both langs have identical shape
}

const LanguageContext = createContext<LangCtx>({
  lang: 'pt',
  setLang: () => {},
  tr: t.pt,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt');

  // Hydrate from localStorage (only on client)
  useEffect(() => {
    const stored = localStorage.getItem('smart-editor-lang') as Lang | null;
    if (stored === 'en' || stored === 'pt') setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('smart-editor-lang', l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr: t[lang] as typeof t['pt'] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
