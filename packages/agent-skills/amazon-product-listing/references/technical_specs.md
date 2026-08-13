# Reconstructed Technical Specs

This file is a reconstructed functional reference inferred from `SKILL.md` and public Amazon image guidance. It is not an original creative platform side file.

## Generation Specs Locked By Skill

| Deliverable       | Aspect ratio | Resolution | Model           |
| ----------------- | -----------: | ---------: | --------------- |
| Main image        |        `1:1` |       `2K` | `nano-banana-2` |
| Infographic       |        `1:1` |       `2K` | `gpt-image-2`   |
| Multi-angle       |        `1:1` |       `2K` | `nano-banana-2` |
| Detail shot       |        `1:1` |       `2K` | `nano-banana-2` |
| Lifestyle         |        `1:1` |       `2K` | `nano-banana-2` |
| What's in the box |        `1:1` |       `2K` | `nano-banana-2` |
| A+ module 1       |       `21:9` |       `2K` | `gpt-image-2`   |
| A+ modules 2-6    |        `3:2` |       `2K` | `gpt-image-2`   |
| A+ module 7       |       `21:9` |       `2K` | `gpt-image-2`   |

## Delivery Notes

- Use stable output IDs: `main:final`, `secondary:infographic`, `secondary:multi-angle`, `secondary:detail`, `secondary:lifestyle`, `secondary:whats-in-box`, `aplus:1-hero` through `aplus:7-endorsement`.
- Do not specify pixel width/height in generation calls. The skill contract is aspect ratio plus `2K`.
- For export outside the generation runtime, prefer JPEG or PNG. Keep a square crop for all listing-gallery images.
- Keep text inside safe margins for mobile thumbnails and marketplace cropping.

## QA

- Open and inspect main image first before using it downstream.
- If main product identity is wrong, regenerate the main image and every dependent downstream image.
- If only copy or layout is wrong on one secondary/A+ image, regenerate only that image.
