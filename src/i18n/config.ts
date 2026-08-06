import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { ar } from "./locales/ar";

export const SUPPORTED_LANGUAGES = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
export const DEFAULT_LANGUAGE: LanguageCode = "ar";
export const LANGUAGE_STORAGE_KEY = "easyclaim-language";

export function dirFor(code: string): "rtl" | "ltr" {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.dir ?? "ltr";
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;