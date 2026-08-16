import { m } from '@/paraglide/messages.js';

/**
 * Compatibility escape hatch for labels whose keys are genuinely unknowable
 * until runtime. Client routes and components must not import this helper:
 * doing so retains the complete Paraglide message namespace and defeats
 * tree-shaking. Prefer static message-function maps for every finite key set.
 *
 * @deprecated Requires an explicit, bundle-reviewed exception before use.
 */
export function tDynamic(key: string): string {
  const fn = (m as Record<string, unknown>)[key];
  return typeof fn === 'function' ? (fn as () => string)() : key;
}
