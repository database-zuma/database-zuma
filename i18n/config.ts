export type Locale = (typeof locales)[number];

export const locales = ["en", "id"] as const;
export const defaultLocale: Locale = "id";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};
