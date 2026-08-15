import { createContext, useContext, type ReactNode } from 'react';

export type LocaleSwitchPolicy = {
  /** Locales that can keep the user on the current content route. */
  availableLocales: readonly string[];
  /** Locale-free route used when the current content has no translation. */
  fallbackHref: string;
};

const LocaleSwitchContext = createContext<LocaleSwitchPolicy | undefined>(
  undefined
);

export function getLocaleSwitchDestination(
  locale: string,
  policy?: LocaleSwitchPolicy
): string | undefined {
  if (!policy || policy.availableLocales.includes(locale)) return undefined;
  return policy.fallbackHref;
}

export function LocaleSwitchProvider({
  availableLocales,
  fallbackHref,
  children,
}: LocaleSwitchPolicy & { children: ReactNode }) {
  return (
    <LocaleSwitchContext.Provider value={{ availableLocales, fallbackHref }}>
      {children}
    </LocaleSwitchContext.Provider>
  );
}

export function useLocaleSwitchPolicy(): LocaleSwitchPolicy | undefined {
  return useContext(LocaleSwitchContext);
}
