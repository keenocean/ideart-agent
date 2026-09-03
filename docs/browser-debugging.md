# Debugging in a real browser on the dev server

This server is not headless. TigerVNC runs an XFCE desktop with Google Chrome
on it, so pages can be driven and screenshotted in a real browser — useful for
checking rendered layout, responsive breakpoints, light/dark theme, lazy-loaded
media, and console/network errors that SSR output alone will not show.

Environment-specific: this describes the machine, not the product. Nothing here
ships or is required to build.

## Connect

| What         | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| Display      | `:1` (TigerVNC `tigervncserver@:1.service`, XFCE, 1728×1056)      |
| VNC          | port 5901, **localhost only** — tunnel over SSH to view it        |
| Chrome       | `/usr/bin/google-chrome`                                          |
| Playwright   | global at `/usr/lib/node_modules/playwright`, no bundled browsers |
| Also present | `xdotool`, `wmctrl`, `imagemagick`, `scrot`, `xclip`, `sqlite3`   |

Non-interactive shells inherit no `DISPLAY`, so every command needs both:

```bash
export DISPLAY=:1 XAUTHORITY=/home/ubuntu/.Xauthority
```

Without them Chrome falls back to headless and X tools fail with
`Can't open display`.

## Drive Chrome from Playwright

Playwright was installed with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, so it drives
the system Chrome through `channel: 'chrome'` rather than a bundled Chromium.
Import it by absolute path — it is global, not a dependency of this project.

```js
import { chromium } from '/usr/lib/node_modules/playwright/index.mjs';

const browser = await chromium.launch({
  channel: 'chrome',
  headless: false, // real window on :1
  args: ['--no-sandbox', '--disable-gpu', '--window-position=0,0'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => console.log(`[${m.type()}]`, m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on(
  'response',
  (r) => r.status() >= 400 && console.log('[http]', r.status(), r.url())
);
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
```

Run `pnpm dev` first — these snippets assume the app is up on port 3000.
Put throwaway scripts in the scratchpad, not in the repo.

Whole-desktop capture, when you want the browser chrome and window manager too:

```bash
xfce4-screenshooter -f -s desktop.png
```

## Three gotchas that cost real time

**Headed screenshots need `--disable-gpu`.** Without it `page.screenshot()`
fails with `Protocol error (Page.captureScreenshot): Unable to capture
screenshot`, while navigation and `page.evaluate()` keep working — so the
failure looks unrelated to rendering.

**`fullPage: true` does not trigger lazy loading.** It captures the whole
document without scrolling, so `loading="lazy"` images never enter the viewport
and stay at `src=null`. Scroll first, then shoot:

```js
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 250));
  }
  window.scrollTo(0, 0);
});
await page.waitForLoadState('networkidle');
```

**Some "broken" images are correct.** Blocks render responsive variants inside
`sm:hidden` / `hidden sm:flex lg:hidden` wrappers. At desktop width those are
`display:none` and never get a `src`, so a naive broken-image count reports
them. Check the computed style of an ancestor before treating one as a bug:

```js
await page.evaluate(() =>
  [...document.images]
    .filter((i) => i.naturalWidth === 0)
    .map((i) => ({ alt: i.alt, w: i.getBoundingClientRect().width }))
);
```

A zero-width entry is a hidden breakpoint variant, not a missing asset.

## What this is good for

- **Responsive and theme sweeps** — re-shoot the same route at several viewports,
  and with `page.emulateMedia({ colorScheme: 'dark' })`, instead of eyeballing
  Tailwind classes. `/launch-audit` leans on this.
- **SEO verification** — the landing-page rules require the H1, headings, and
  metadata to be in the server HTML. `curl` proves what SSR emitted; the browser
  proves what the user actually sees after hydration. Check both.
- **Locale checks** — visit `/` and `/zh` and compare; Paraglide resolves the
  locale server-side, so a wrong prefix shows up in the rendered page, not in
  the message JSON.
- **Console and network errors** — the listeners above surface hydration
  mismatches and 4xx API calls that never appear in the terminal.

## Comparing local against production

Screenshot both at the same viewport and diff. Expect differences in any
animated or randomized region — an autoplaying hero or a rotating testimonial
will never match frame-for-frame, so compare structure, not pixel totals:

```bash
compare -metric AE local.png live.png diff.png   # ImageMagick; prints differing pixels
convert shot.png -crop 1440x1800 +repage -resize 800x part-%d.png   # split a tall page
```

## Printing a page to PDF

Same browser, when a route is meant to be printed or exported. Print with the
same options the app's own PDF path uses, then verify the artifact rather than
the on-screen layout — print line-breaking moves content across sheets in ways
a viewport measurement does not predict:

```bash
pdfinfo out.pdf | grep Pages     # sheet count
pdffonts out.pdf                  # which faces actually embedded
pdftotext -f 7 -l 7 out.pdf -     # what landed on a given sheet
```

`preferCSSPageSize: true` makes Chrome take the whole page box from the CSS
`@page` rule, so `margin` in the PDF options has no effect — change the margins
in the stylesheet instead.
