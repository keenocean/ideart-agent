// Locale display names for the language switcher UI.
// Locales themselves are defined in project.inlang/settings.json and
// exposed at runtime via @/paraglide/runtime.js (locales, baseLocale).
import { locales } from '@/paraglide/runtime.js';

export type AppLocale = (typeof locales)[number];

export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && locales.includes(value as AppLocale);
}

const configuredLocaleNames = {
  en: 'English',
  zh: '中文',
} satisfies Record<AppLocale, string>;

export const localeNames: Record<string, string> = configuredLocaleNames;

export const openGraphLocales = {
  en: 'en_US',
  zh: 'zh_CN',
} satisfies Record<AppLocale, string>;
