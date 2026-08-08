import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n, {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  dirFor,
  type LanguageCode,
} from "./config";
import { supabase } from "@/integrations/supabase/client";

type LanguageContextValue = {
  language: LanguageCode;
  dir: "rtl" | "ltr";
  setLanguage: (next: LanguageCode) => void;
  languages: typeof SUPPORTED_LANGUAGES;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isSupported(value: string | null | undefined): value is LanguageCode {
  return !!value && SUPPORTED_LANGUAGES.some((item) => item.code === value);
}

function applyDocumentLanguage(code: LanguageCode) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = code;
  document.documentElement.dir = dirFor(code);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  // Restore the stored preference (localStorage first, then the user profile).
  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const initial: LanguageCode = isSupported(stored) ? stored : DEFAULT_LANGUAGE;
    setLanguageState(initial);
    void i18n.changeLanguage(initial);
    applyDocumentLanguage(initial);

    let cancelled = false;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", auth.user.id)
        .maybeSingle();
      const remote = profile?.language;
      if (cancelled || !isSupported(remote) || remote === initial) return;
      // Only adopt the profile value when nothing was stored locally.
      if (isSupported(stored)) return;
      setLanguageState(remote);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, remote);
      void i18n.changeLanguage(remote);
      applyDocumentLanguage(remote);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    void i18n.changeLanguage(next);
    applyDocumentLanguage(next);
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      await supabase.from("profiles").update({ language: next }).eq("id", auth.user.id);
    })();
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, dir: dirFor(language), setLanguage, languages: SUPPORTED_LANGUAGES }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return context;
}

/** Convenience wrapper so components get both `t` and the active direction. */
export function useI18n() {
  const { t } = useTranslation();
  const { language, dir, setLanguage } = useLanguage();
  return { t, language, dir, setLanguage };
}