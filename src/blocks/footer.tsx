import { LifeBuoy } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import {
  SiteFooter,
  type FooterColumn,
  type FooterSocial,
} from '@/components/site-footer';

export function Footer() {
  const columns: FooterColumn[] = [
    {
      title: m['landing.footer.products'](),
      links: [
        { label: m['landing.nav.create'](), href: '/chat' },
        { label: m['landing.nav.tools'](), href: '/tools' },
        {
          label: m['landing.footer.ai_image_generator'](),
          href: '/tools/ai-image-generator',
        },
        { label: m['landing.footer.gallery'](), href: '/library' },
      ],
    },
    {
      title: m['landing.footer.features'](),
      links: [
        { label: m['landing.nav.features'](), href: '/#features' },
        { label: m['landing.nav.gallery'](), href: '/#gallery' },
        { label: m['landing.footer.use_cases'](), href: '/#use-cases' },
        {
          label: m['landing.footer.how_it_works'](),
          href: '/#how-it-works',
        },
      ],
    },
    {
      title: m['landing.footer.resources'](),
      links: [
        { label: m['landing.nav.pricing'](), href: '/pricing' },
        { label: m['landing.footer.blog'](), href: '/blog' },
        {
          label: m['landing.footer.support'](),
          href: '/settings/tickets',
        },
      ],
    },
    {
      title: m['landing.footer.legal'](),
      links: [
        { label: m['landing.footer.privacy'](), href: '/privacy-policy' },
        { label: m['landing.footer.terms'](), href: '/terms-of-service' },
      ],
    },
  ];

  const socials: FooterSocial[] = [
    {
      icon: LifeBuoy,
      href: '/settings/tickets',
      label: m['settings.tickets.title'](),
    },
  ];

  return (
    <SiteFooter
      tagline={m['landing.footer.tagline']()}
      columns={columns}
      socials={socials}
      showBuiltWithShipAny={false}
    />
  );
}
