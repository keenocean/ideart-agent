# Validated Failures

Use these cases as regression guards before tool calls.

## VF-1: Lost Style Reference

Failure: user supplied URL or image reference, but the storyboard prompt described the style in text without passing the resolved asset id.
Fix: resolve the URL or uploaded image to an asset id and include it in `image_urls` when style or subject preservation depends on it.

## VF-2: Tiny Interface Text

Failure: phone or dashboard mockups contain realistic small UI labels.
Fix: treat the screen as a poster surface: one large headline, one hero visual, one brand mark.

## VF-3: Same Scene Six Times

Failure: six panels repeat one set with minor pose or lighting changes.
Fix: keep the subject/material/style lock, but force six different micro-environments and at least three framing scales.

## VF-4: Generic Tech Electricity

Failure: tech or energy briefs collapse into cyan lightning, circuit boards, and black voids.
Fix: derive brand-specific material identity before choosing effects.

## VF-5: Product Without Product

Failure: Product Reel generated a substitute product when no product image was attached.
Fix: stop and ask for the actual product image.

## VF-14: Invented Text Strings

Failure: explicit copy beats were expanded with invented labels, dates, locations, or category descriptors.
Fix: render exactly the user-provided text count. Use motion, framing, material, and transitions for richness instead of extra text.

## MDCM Anti-patterns: Stage B Text-Only Shortcut

Failure: after the user picks or references a Stage A moodboard frame, Stage B is generated from prose only.
Fix: pass the selected moodboard asset id in `image_urls` and state that the storyboard is a foundation expansion of that visual world.
