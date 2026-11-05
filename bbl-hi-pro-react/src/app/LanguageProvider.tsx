import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createTranslator, type Translator } from '../i18n/translate';
import { localeFor, type Lang } from '../utils/format';
import { prefersReducedMotion, readStoredLang, writeStoredLang } from '../utils/storage';

interface LanguageValue {
  lang: Lang;
  locale: string;
  t: Translator;
  setLang: (next: Lang) => void;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'th' ? 'th' : 'en';
  }, [lang]);

  // Short fade on the body while the language changes, as in the prototype.
  const setLang = useCallback((next: Lang) => {
    if (next === lang) return;
    const reduce = prefersReducedMotion();
    document.body.classList.add('lang-out');
    window.setTimeout(() => {
      setLangState(next);
      writeStoredLang(next);
      document.body.classList.remove('lang-out');
    }, reduce ? 0 : 180);
  }, [lang]);

  const value = useMemo<LanguageValue>(() => ({
    lang,
    locale: localeFor(lang),
    t: createTranslator(lang),
    setLang,
  }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLang must be used inside LanguageProvider');
  return value;
}
