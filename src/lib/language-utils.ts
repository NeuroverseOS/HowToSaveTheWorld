// Language detection and utilities for NeuroVerse OS

export interface LanguageOption {
  code: string;
  name: string;
  native: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageOption> = {
  en: { code: "en", name: "English", native: "English" },
  de: { code: "de", name: "German", native: "Deutsch" },
  es: { code: "es", name: "Spanish", native: "Español" },
  fr: { code: "fr", name: "French", native: "Français" },
  it: { code: "it", name: "Italian", native: "Italiano" },
  pt: { code: "pt", name: "Portuguese", native: "Português" },
  ja: { code: "ja", name: "Japanese", native: "日本語" },
  ko: { code: "ko", name: "Korean", native: "한국어" },
  zh: { code: "zh", name: "Chinese", native: "简体中文" },
  ar: { code: "ar", name: "Arabic", native: "العربية" },
};

export function detectBrowserLanguage(): string {
  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LANGUAGES[browserLang] ? browserLang : 'en';
}

export function detectDeviceLanguage(): string {
  const deviceLang = navigator.languages?.[0]?.split('-')[0] || detectBrowserLanguage();
  return SUPPORTED_LANGUAGES[deviceLang] ? deviceLang : 'en';
}

export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code]?.name || "English";
}

export function getLanguageNativeName(code: string): string {
  return SUPPORTED_LANGUAGES[code]?.native || "English";
}

export function getLanguageConfirmationMessage(code: string, name: string): string {
  const messages: Record<string, string> = {
    en: "The NeuroVerse adapts to your language.\nAll missions, diagnostics, and analysis will now be delivered in English.",
    de: "Das NeuroVerse passt sich deiner Sprache an.\nAlle Missionen, Analysen und Diagnosen werden ab jetzt auf Deutsch durchgeführt.",
    es: "El NeuroVerse se adapta a tu idioma.\nTodas las misiones y diagnósticos ahora se realizarán en español.",
    fr: "Le NeuroVerse s'adapte à ta langue.\nToutes les missions et tous les diagnostics seront désormais en français.",
    it: "Il NeuroVerse si adatta alla tua lingua.\nTutte le missioni e le analisi saranno ora in italiano.",
    pt: "O NeuroVerse adapta-se ao teu idioma.\nTodas as missões e análises serão agora em português.",
    ja: "NeuroVerseはあなたの言語に適応します。\nすべてのミッション、分析、診断は日本語で行われます。",
    ko: "NeuroVerse가 귀하의 언어에 적응합니다.\n모든 임무, 분석 및 진단이 이제 한국어로 진행됩니다.",
    zh: "NeuroVerse 适应你的语言。\n所有任务、分析和诊断现在都将以简体中文进行。",
    ar: "يتكيف NeuroVerse مع لغتك.\nسيتم الآن تقديم جميع المهام والتحليلات والتشخيصات باللغة العربية.",
  };
  
  return messages[code] || messages.en;
}
