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
      title: m['landing.footer.features'](),
      links: [
        { label: m['landing.nav.create'](), href: '/chat' },
        { label: m['landing.footer.gallery'](), href: '/library' },
      ],
    },
    {
      title: m['landing.footer.products'](),
      links: [
        { label: m['landing.nav.create'](), href: '/chat' },
        { label: m['landing.footer.gallery'](), href: '/library' },
      ],
    },
    {
      title: m['landing.footer.resources'](),
      links: [{ label: m['landing.footer.blog'](), href: '/blog' }],
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
    />
  );
}
