# Marketing tool-page reference topology

This document records the structural evidence used to rebuild the public tool page. It is a layout reference, not a content or branding source. UGCMind copy, product truth, routes, theme tokens, and R2 assets remain authoritative.

## Image-generator reference

Desktop viewport: `1440 × 900`. The page uses a 57px public header and seven main sections.

| Order | Section                | Desktop geometry                                        | Responsive behavior                                                                 |
| ----- | ---------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1     | Generator hero         | 768px inner width; 64px vertical padding                | 358px inner width at 390px; quick starts are 4/4/2 columns at desktop/tablet/mobile |
| 2     | Tool/model exploration | 1152px inner width; 4 columns                           | 2 columns at 768px and 1 column at 390px                                            |
| 3     | Example showcase       | 1152px inner width; 3 balanced vertical lanes; 16px gap | 2 lanes at 768px; 1 lane at 390px                                                   |
| 4     | Feature grid           | 1024px inner width; 3 columns; 24px gap                 | 2 columns at 768px; 1 column at 390px                                               |
| 5     | Use cases              | 1152px inner width; two 548px columns; 56px gap         | two columns at 768px; one column at 390px; media remains first on mobile            |
| 6     | FAQ                    | 1024px inner width                                      | single accordion/list column                                                        |
| 7     | Final CTA              | 1024px bordered card inside 64px section padding        | width follows viewport with 16px gutters                                            |

Desktop section padding is consistently `64px 16px`. Headings use the serif display face and normal weight; tool/model exploration headings are left aligned while gallery and editorial sections are centered. The reference uses 30px section headings and 36px hero/CTA headings; UGCMind keeps its own font and semantic color tokens.

## Video-lite reference

Desktop viewport: `1440 × 900`. The page has ten main sections. These sections provide reusable patterns for future video tool pages even when the current image page does not render all of them.

| Order | Section                  | Desktop geometry                                                        | Responsive behavior                                               |
| ----- | ------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1     | Immersive generator hero | 100svh with layered looping background media                            | full-height mobile hero; composer stays above lower preview rail  |
| 2     | Media explainer          | 1280px card; `0.78fr / 1.22fr`; 28px radius                             | single column below 640px; copy precedes media                    |
| 3     | Four-step guide          | 1232px grid; four 296px cards; 16px gap                                 | 2 columns at tablet and 1 column on mobile                        |
| 4     | Video showcase           | 1280px clipped viewport; CSS columns `4/3/2`; 8px gap                   | fixed 760/680/580px visible window with bottom fade and CTA       |
| 5     | Feature matrix           | 1280px grid; 3 columns; 1px separators                                  | 2 columns at tablet and 1 column on mobile                        |
| 6     | Alternating use cases    | three full-width bands; 1280px inner grid; two 560px columns; 112px gap | one column on mobile; media first; alternating background surface |
| 7     | Inspiration rail         | edge-to-edge horizontal snap rail; 20px gap; 960px cards                | 85vw cards with touch scrolling                                   |
| 8     | Pricing                  | existing product pricing surface                                        | not part of this tool-page implementation                         |
| 9     | FAQ                      | 1280px two-column numbered list                                         | one column on mobile                                              |
| 10    | Final CTA                | 1280px bordered card, 28px radius                                       | fluid card with 16px outer gutters                                |

The inspiration section itself uses 112px vertical padding on desktop and 80px on mobile. Its 1024px heading container precedes a 24px-padded rail; cards are `85vw` up to 960px, with 44px edge navigation buttons. At 390px the card is 331.5px wide, its media is 185.34px high, and its fixed-minimum copy body brings the card to approximately 347px.

Reference captures live under `docs/design-references/`. Desktop captures are full-page; the image mobile/tablet captures are first-screen evidence because the source page exceeds the browser capture height limit. DOM measurements cover the full responsive page.
