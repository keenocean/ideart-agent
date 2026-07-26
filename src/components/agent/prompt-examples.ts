import {
  Eraser,
  IdCard,
  LayoutTemplate,
  Palette,
  PenTool,
  ShoppingBag,
  Smile,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';

export interface PromptExample {
  key: string;
  title: string;
  prompt: string;
  /** Optional thumbnail; falls back to a gradient tile when absent. */
  image?: string;
  /** The "before" picture(s), attached to the composer when the example is
   *  picked, so the prompt has something to work on. A try-on case brings
   *  two: the person and the garment. */
  sourceImage?: string;
  sourceImages?: string[];
  swatch: string;
}

export interface PromptCategory {
  key: string;
  icon: LucideIcon;
  title: string;
  examples: PromptExample[];
}

// Gradient placeholders stand in until real sample thumbnails are dropped in
// (set `image` on an example to use a picture instead).
const SWATCHES = [
  'from-violet-200 via-indigo-200 to-sky-200',
  'from-rose-200 via-pink-200 to-orange-200',
  'from-amber-200 via-yellow-200 to-lime-200',
  'from-emerald-200 via-teal-200 to-cyan-200',
];

/**
 * Real before/after samples, keyed by example. `image` is the result shown in
 * the grid; `sourceImage` is the original it was made from. Examples without
 * an entry keep their gradient tile.
 */
const SAMPLES: Record<
  string,
  { image: string; sourceImage?: string; sourceImages?: string[] }
> = {
  'background-1': {
    image:
      'https://r2.imgany.ai/imgs/agent/sessions/s-1784988546557-yhpswr/img_1784989116777_0.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/5c0ccfc8d43976772c34c5c4da24f00c.png',
  },
  // Cover design is text-to-image, so these samples have no "before" picture.
  'background-2': {
    image:
      'https://r2.imgany.ai/imgs/agent/sessions/s-1784989520446-b7e85i/img_1784989625004_0.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/bd45d1884a2481721ee04061494c9a83.png',
  },
  'background-3': {
    image:
      'https://r2.imgany.ai/imgs/agent/sessions/s-1784989832154-t69ctg/img_1784989992575_0.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/dabb8b77c350e5f2b3a33d8d61626578.png',
  },
  // Logo design: only the moodboard case works from a reference picture.
  'logo-1': { image: '/imgs/examples/logo-1.webp' },
  'logo-2': { image: '/imgs/examples/logo-2.webp' },
  'logo-3': {
    image: '/imgs/examples/logo-3.webp',
    sourceImage: 'https://r2.imgany.ai/imgs/examples/logo-moodboard.jpg',
  },
  'logo-4': { image: '/imgs/examples/logo-4.webp' },
  'cover-1': { image: '/imgs/examples/cover-1.webp' },
  'cover-2': { image: '/imgs/examples/cover-2.webp' },
  'cover-3': { image: '/imgs/examples/cover-3.webp' },
  'cover-4': { image: '/imgs/examples/cover-4.webp' },
  'makeup-1': {
    image: 'https://r2.imgany.ai/imgs/examples/tryon-out-1784993287481.png',
    // Two sources: the person and the garment — the composer attaches both.
    sourceImages: [
      'https://r2.imgany.ai/imgs/examples/tryon-person-1784993287481.png',
      'https://r2.imgany.ai/imgs/examples/tryon-cloth-1784993287481.png',
    ],
  },
  'makeup-2': {
    image: 'https://r2.imgany.ai/imgs/examples/makeup-2-out-1784991619758.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/examples/makeup-2-src-1784991619758.png',
  },
  'makeup-3': {
    image: 'https://r2.imgany.ai/imgs/examples/makeup-3-out-1784991619758.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/examples/makeup-3-src-1784991619758.png',
  },
  'makeup-4': {
    image: 'https://r2.imgany.ai/imgs/examples/makeup-4-out-1784992187022.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/examples/makeup-4-src-1784992187022.png',
  },
  'background-4': {
    image:
      'https://r2.imgany.ai/imgs/agent/sessions/s-1784990356877-anjtq9/img_1784990509689_0.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/a15f8f8f3c29e4547d4f651651273fae.png',
  },
  'style-1': {
    image:
      'https://r2.imgany.ai/imgs/agent/sessions/s-1784984984126-52ojye/img_1784986043378_0.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/17840b4d7e3bc9c5ead1df611af53a5a.png',
  },
  'style-2': {
    image:
      'https://r2.imgany.ai/imgs/agent/sessions/s-1784970411172-qq4fpc/img_1784970569024_0.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/555b2fe0116d507a63267de9077cde81.png',
  },
  'style-3': {
    image:
      'https://r2.imgany.ai/imgs/agent/sessions/s-1784969153750-x9pszz/img_1784969313304_0.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/f708103f76a8e0cc21d93897247a8059.png',
  },
  'style-4': {
    image:
      'https://r2.imgany.ai/imgs/agent/sessions/s-1784968547088-8439rw/img_1784968706658_0.png',
    sourceImage:
      'https://r2.imgany.ai/imgs/98e58ff3b4930946ebbac0441f0e5bac.png',
  },
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  style: Palette,
  background: Eraser,
  makeup: Sparkles,
  cover: LayoutTemplate,
  logo: PenTool,
  portrait: IdCard,
  product: ShoppingBag,
  sticker: Smile,
};

const CATEGORY_KEYS = [
  'style',
  'background',
  'makeup',
  'cover',
  'logo',
  'portrait',
  'product',
  'sticker',
] as const;

const ITEMS_PER_CATEGORY = 4;

/**
 * The example browser's content: a handful of broad categories, each with a
 * few concrete scenarios whose prompt drops straight into the composer.
 * Reads i18n, so call it during render.
 */
export function promptCategories(): PromptCategory[] {
  return CATEGORY_KEYS.map((cat) => ({
    key: cat,
    icon: CATEGORY_ICONS[cat],
    title: tDynamic(`landing.examples.${cat}.title`),
    examples: Array.from({ length: ITEMS_PER_CATEGORY }, (_, i) => {
      const key = `${cat}-${i + 1}`;
      return {
        key,
        title: tDynamic(`landing.examples.${cat}.item_${i + 1}_title`),
        prompt: tDynamic(`landing.examples.${cat}.item_${i + 1}_prompt`),
        swatch: SWATCHES[i % SWATCHES.length],
        ...SAMPLES[key],
      };
    }),
  }));
}
