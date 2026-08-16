import { m } from '@/paraglide/messages.js';
import { SiteHeader } from '@/components/site-header';

export function Header() {
  const navLinks = [
    { href: '/#features', label: m['landing.nav.features']() },
    { href: '/#gallery', label: m['landing.nav.gallery']() },
    { href: '/tools', label: m['landing.nav.tools']() },
    { href: '/models', label: m['landing.nav.models']() },
    { href: '/chat', label: m['landing.nav.create']() },
    { href: '/pricing', label: m['landing.nav.pricing']() },
  ];

  return <SiteHeader navLinks={navLinks} />;
}
