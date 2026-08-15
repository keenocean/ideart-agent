import { Check, ChevronDown, Globe, Languages } from 'lucide-react';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center transition-colors outline-none',
          variant === 'icon'
            ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground size-8 justify-center rounded-md'
            : 'h-9 gap-2 rounded-full border px-4 text-sm',
          className
        )}
      >
        {variant === 'icon' ? (
          <>
            <Languages className="size-4" />
            <span className="sr-only">Switch language</span>
          </>
        ) : (
          <>
            <Globe className="size-4" />
            <span>{localeNames[locale] || locale}</span>
            <ChevronDown className="size-4 opacity-70" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleSwitch(loc)}
            className="flex items-center justify-between gap-2"
          >
            {localeNames[loc] || loc}
            {loc === locale && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
