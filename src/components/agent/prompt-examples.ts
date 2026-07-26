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
    image: '/imgs/examples/background-1-after.webp',
    sourceImage: '/imgs/examples/background-1-before.webp',
  },
  'background-2': {
    image: '/imgs/examples/background-2-after.webp',
    sourceImage: '/imgs/examples/background-2-before.webp',
  },
  'background-3': {
    image: '/imgs/examples/background-3-after.webp',
    sourceImage: '/imgs/examples/background-3-before.webp',
  },
  'background-4': {
    image: '/imgs/examples/background-4-after.webp',
    sourceImage: '/imgs/examples/background-4-before.webp',
  },
  // Logo and cover design are text-to-image, so most have no "before"; only
  // the moodboard case works from a reference picture.
  'logo-1': { image: '/imgs/examples/logo-1.webp' },
  'logo-2': { image: '/imgs/examples/logo-2.webp' },
  'logo-3': {
    image: '/imgs/examples/logo-3.webp',
    sourceImage: '/imgs/examples/logo-3-before.webp',
  },
  'logo-4': { image: '/imgs/examples/logo-4.webp' },
  'cover-1': { image: '/imgs/examples/cover-1.webp' },
  'cover-2': { image: '/imgs/examples/cover-2.webp' },
  'cover-3': { image: '/imgs/examples/cover-3.webp' },
  'cover-4': { image: '/imgs/examples/cover-4.webp' },
  'makeup-1': {
    image: '/imgs/examples/makeup-1-after.webp',
    // Two sources: the person and the garment — the composer attaches both.
    sourceImages: [
      '/imgs/examples/makeup-1-before.webp',
      '/imgs/examples/makeup-1-before-2.webp',
    ],
  },
  'makeup-2': {
    image: '/imgs/examples/makeup-2-after.webp',
    sourceImage: '/imgs/examples/makeup-2-before.webp',
  },
  'makeup-3': {
    image: '/imgs/examples/makeup-3-after.webp',
    sourceImage: '/imgs/examples/makeup-3-before.webp',
  },
  'makeup-4': {
    image: '/imgs/examples/makeup-4-after.webp',
    sourceImage: '/imgs/examples/makeup-4-before.webp',
  },
  // The style samples share two source portraits, both generated rather than
  // photographed: a template ships to other people's sites, so a recognisable
  // face in the demo becomes their problem too.
  'style-1': {
    image: '/imgs/examples/style-1-after.webp',
    sourceImage: '/imgs/examples/style-source-a.webp',
  },
  'style-2': {
    image: '/imgs/examples/style-2-after.webp',
    sourceImage: '/imgs/examples/style-source-b.webp',
  },
  'style-3': {
    image: '/imgs/examples/style-3-after.webp',
    sourceImage: '/imgs/examples/style-source-a.webp',
  },
  'style-4': {
    image: '/imgs/examples/style-4-after.webp',
    sourceImage: '/imgs/examples/style-source-b.webp',
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
