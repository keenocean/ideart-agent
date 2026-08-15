import { m } from '@/paraglide/messages.js';
import { CatalogFinalCta } from '@/components/catalog/catalog-marketing-sections';

export function HomeCTA() {
  return (
    <CatalogFinalCta
      wide
      title={m['landing.cta.title']()}
      description={m['landing.cta.subtitle']()}
      primaryLabel={m['landing.cta.primary']()}
      secondaryLabel={m['landing.cta.secondary']()}
      primaryHref="#generator"
      secondaryHref="/pricing"
    />
  );
}
