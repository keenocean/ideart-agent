import { ChevronDown, Globe, Languages } from 'lucide-react';

import {
  getLocaleSwitchDestination,
  useLocaleSwitchPolicy,
} from '@/core/i18n/locale-switch';
import { localeNames, type AppLocale } from '@/config/locale';
import { cn } from '@/lib/utils';
import {
  getLocale,
  locales,
  localizeHref,
  setLocale,
} from '@/paraglide/runtime.js';

export function LocaleSelector({
  variant = 'icon',
  className,
}: {
  variant?: 'icon' | 'pill';
  className?: string;
}) {
  const locale = getLocale();
  const switchPolicy = useLocaleSwitchPolicy();

  function handleSwitch(newLocale: string) {
    if (newLocale === locale) return;

    const destination = getLocaleSwitchDestination(newLocale, switchPolicy);
    if (!destination) {
      // Writes the locale cookie and reloads on the localized current URL.
      setLocale(newLocale as AppLocale);
      return;
    }

    // A content detail without this translation falls back to the target
    // locale's directory instead of manufacturing a known 404.
    const href = localizeHref(destination, { locale: newLocale as AppLocale });
    const update = setLocale(newLocale as AppLocale, { reload: false });
    void Promise.resolve(update).then(() => window.location.assign(href));
  }

  return (
    <label
      className={cn(
        'relative inline-flex items-center transition-colors',
        variant === 'icon'
          ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground size-8 justify-center rounded-md'
          : 'border-border h-9 gap-2 rounded-full border px-4 text-sm',
        className
      )}
    >
      {variant === 'icon' ? (
        <Languages aria-hidden="true" className="size-4" />
      ) : (
        <>
          <Globe aria-hidden="true" className="size-4" />
          <span>{localeNames[locale] || locale}</span>
          <ChevronDown aria-hidden="true" className="size-4 opacity-70" />
        </>
      )}
      <span className="sr-only">Switch language</span>
      <select
        aria-label="Switch language"
        value={locale}
        onChange={(event) => handleSwitch(event.target.value)}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc] || loc}
          </option>
        ))}
      </select>
    </label>
  );
}
