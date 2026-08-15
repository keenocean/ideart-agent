# Marketing reference behavior inventory

## Shared behaviors

- Public header collapses to a menu button on mobile.
- Internal section navigation uses stable anchors and scroll offsets.
- Hover motion is limited to small media scaling and card elevation; keyboard focus uses a visible ring.
- Reduced-motion users must not receive forced autoplay or animated scrolling.
- Example media opens an accessible full-screen preview with next/previous navigation and Escape-to-close behavior.
- Prompt reuse fills the real generation composer and returns focus to it.
- “Use as reference” is optional. It is rendered only when the page controller can authorize that media through the existing chat-media receipt flow.

## Image-reference behaviors

- Four quick-start cards fill the prompt; the gallery dialog exposes the prompt and a prompt-reuse action.
- Gallery items keep their natural aspect ratios and are distributed into balanced lanes rather than cropped into a uniform grid.
- Use-case rows alternate media left/right at `md` and above. Mobile ordering is media then copy for every row.
- FAQ uses native expandable disclosure behavior.

## Video-reference behaviors

- Background hero clips are muted, looping, and cross-faded. Below-the-fold clips are not eagerly downloaded.
- Showcase and use-case video previews play only near the viewport and pause when they leave it.
- Video showcase uses CSS columns with break-inside avoidance: 4 columns desktop, 3 tablet, 2 mobile, 8px gaps.
- The visible showcase is height-clipped and ends with a gradient fade plus a single expansion action.
- Inspiration cards form a horizontal, mandatory-snap rail. Cards are 85vw up to 960px and support pointer/touch scrolling.
- The video preview panel shows position, master download, media title, prompt, optional reference-media metadata, “Use this prompt,” and an optional “Use video as reference” action.

## Product constraints

- Decorative or example media must come from the immutable UGCMind R2 registry.
- Video assets require a registry poster and range-capable public delivery.
- Reference-page assets, brand marks, color values, copy, pricing, and unsupported capabilities are not copied.
- The current tool remains disabled when provider readiness says it is unavailable, and remains `noindex` until the release contract is satisfied.
