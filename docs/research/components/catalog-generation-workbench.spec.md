# Catalog Generation Workbench Specification

## Overview

- **Target files:** `src/components/agent/chat-composer.tsx`, `src/blocks/tool-detail.tsx`
- **Reference screenshots:**
  - `docs/design-references/image-generator.shipany.site/desktop-1440.png`
  - `docs/design-references/image-generator.shipany.site/mobile-390.png`
- **Local comparison screenshots:**
  - `docs/design-references/ai-image-generator-local-desktop-1440-light.png`
  - `docs/design-references/ai-image-generator-local-mobile-390-zh.png`
- **Interaction model:** click-driven mode actions plus the existing keyboard, upload,
  settings, persistence, and submit behavior.

## Product Boundary

- Reuse the existing `useGenerationEntry → GenerationWorkbench → ChatComposer`
  controller path. Do not create a second prompt state or submit path.
- The prompt-mode action focuses the real textarea.
- The reference-mode action opens the existing file input. It is not a decorative
  tab. Once an attachment exists, the reference action receives the active state.
- Provider/model/storage readiness remains visible. When the generation path is not
  executable, users may still draft a prompt and adjust legal settings, while Enter
  and the submit button remain blocked by `submitDisabled`.
- Existing page locks, server policy reconstruction, uploads, library reuse, settings
  persistence, and chat handoff remain authoritative.

## DOM Structure

1. Tool workbench landmark with a screen-reader heading and description.
2. The existing Composer form, using the reusable `tool` presentation:
   - compact mode-action strip;
   - existing attachment previews;
   - existing textarea;
   - existing upload, skill, model, output settings, and submit toolbar;
   - existing library picker dialog.
3. Compact status/default-settings footer outside the form.
4. Existing quick-start grid, owned by the page component.

## Computed Reference Styles

### Width and Shell

- Desktop max width: `768px` (`max-w-3xl`).
- Mode strip: `768 × 41px`, `padding: 8px 8px 0`, `gap: 4px`, top radius
  `24px`, one-pixel theme border, muted half-opacity background.
- Composer body: `768 × 147.75px`, bottom radius `24px`, one-pixel theme border,
  no top border, card background, small shadow.
- Combined target height before attachments: approximately `189px`.
- The local outer padded card is removed so the Composer can occupy the full 768px
  content width.

### Mode Actions

- Height: `32px`.
- Padding: `8px 12px`.
- Gap: `6px` between icon and label.
- Font: `12px / 16px`, active weight `500`.
- Radius: `10px 10px 0 0`.
- Active action uses the card surface and foreground token; inactive action uses
  muted foreground with a foreground hover state.

### Textarea

- Minimum height: `92px`.
- Padding: `16px 16px 8px`.
- Font: `14px`, relaxed line height (reference computed `22.75px`).
- Transparent background, no visible border, no resize handle.

### Toolbar

- Height before responsive wrapping: `48px`.
- Padding: `0 12px 12px`.
- `8px` group gap.
- Existing controls remain actual buttons/dropdowns; locked controls stay disabled.
- In the tool presentation, the redundant locked media-mode selector is omitted
  because the mode-action strip already communicates the page mode.
- On mobile, the Skill selector remains available as a labeled icon button and the
  image-settings trigger shows the current aspect ratio; opening either control still
  exposes the complete existing menu.

### Status Footer

- Compact inline text at `12px` with the existing success/warning semantic colors.
- Save-default action remains a real button and uses the existing persistence method.
- The footer may wrap on mobile and must not widen the page.

## States and Behaviors

### Prompt action

- **Trigger:** click the prompt action.
- **Result:** focus the existing textarea and place the caret without changing prompt
  state or settings.
- **Active state:** no attachments.

### Reference action

- **Trigger:** click the reference action.
- **Result:** invoke the existing hidden file input. Uploaded media continues through
  `entry.addFiles` and server-side attachment policy validation.
- **Active state:** one or more attachments are present.

### Unavailable runtime

- Textarea and legal settings remain editable.
- Submit button and Enter submission remain disabled through `submitDisabled`.
- The exact readiness reason stays visible beneath the form.

### Keyboard and upload behavior

- Enter submits only when executable; Shift+Enter inserts a newline.
- Paste-to-upload, local upload, library reuse, attachment removal, model/settings
  menus, and save-default behavior remain unchanged.

## Responsive Behavior

- **Desktop (1440px):** centered 768px shell; one-row toolbar where controls fit.
- **Tablet (768px):** full available content width with the same stacked mode strip and
  body shell.
- **Mobile (390px):** 16px page gutters, approximately 358px shell; toolbar controls
  wrap without horizontal overflow; status/default footer stacks when necessary.
- Existing `sm` wrapping behavior remains the breakpoint authority.

## Visual Token Rule

Copy geometry and interaction hierarchy only. Background, foreground, primary,
muted, border, success, and warning colors must continue to come from UGCMind theme
tokens and must work in light and dark modes.

## Verification

- TypeScript, formatter, targeted tests, full tests, and production build pass.
- At 1440px and 390px, the shell has no extra outer card and no horizontal overflow.
- Prompt action focuses the textarea; reference action reaches the real file input.
- When runtime is unavailable, typing works but submit remains disabled.
- When a prompt is selected from quick starts or the gallery, it still populates and
  focuses this textarea.
