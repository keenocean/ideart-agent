import { Film, type LucideIcon } from 'lucide-react';

import { m } from '@/paraglide/messages.js';

export interface PromptExample {
  key: string;
  title: string;
  prompt: string;
  /** Generated example clip copied from shipany-video-lite. */
  video?: string;
  /** Optional generated opening frame for image-to-video examples. */
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

const SWATCHES = [
  'from-amber-200 via-orange-200 to-rose-200',
  'from-orange-200 via-amber-100 to-yellow-200',
  'from-stone-300 via-amber-200 to-orange-200',
  'from-rose-200 via-orange-200 to-amber-200',
];

/** Same generated showcase and ordering as shipany-video-lite. */
const SHOWCASE = [
  {
    key: 'monster_bakery',
    slug: 'monster-bakery',
    video: '/videos/showcase/generated/monster-bakery.mp4',
    sourceImage: '/images/showcase/generated/monster-bakery.png',
  },
  {
    key: 'web_acrobat',
    slug: 'web-acrobat',
    video: '/videos/showcase/generated/web-acrobat.mp4',
  },
  {
    key: 'paper_dragon',
    slug: 'paper-dragon',
    video: '/videos/showcase/generated/paper-dragon.mp4',
  },
  {
    key: 'glacier_titan',
    slug: 'glacier-titan',
    video: '/videos/showcase/generated/glacier-titan.mp4',
  },
  {
    key: 'airglide',
    slug: 'airglide',
    video: '/videos/showcase/generated/airglide-remake.mp4',
  },
  {
    key: 'poppies',
    slug: 'poppies',
    video: '/videos/showcase/generated/desert-poppies-remake.mp4',
  },
  {
    key: 'monster_commuter',
    slug: 'monster-commuter',
    video: '/videos/showcase/generated/monster-commuter.mp4',
    sourceImage: '/images/showcase/generated/monster-commuter.png',
  },
  {
    key: 'dragon',
    slug: 'new-york-dragon',
    video: '/videos/showcase/generated/new-york-dragon-remake.mp4',
  },
  {
    key: 'koi_train',
    slug: 'koi-train',
    video: '/videos/showcase/generated/porcelain-koi-train.mp4',
    sourceImage: '/images/showcase/generated/porcelain-koi-train.png',
  },
  {
    key: 'conservatory',
    slug: 'conservatory',
    video: '/videos/showcase/generated/night-conservatory.mp4',
    sourceImage: '/images/showcase/generated/night-conservatory.png',
  },
  {
    key: 'rain_market',
    slug: 'rain-market',
    video: '/videos/showcase/generated/rain-puddle-market.mp4',
  },
  {
    key: 'orb',
    slug: 'london-orb',
    video: '/videos/showcase/generated/london-orb-remake.mp4',
  },
  {
    key: 'tidal',
    slug: 'tidal-library',
    video: '/videos/showcase/generated/tidal-library.mp4',
  },
  {
    key: 'laundromat',
    slug: 'laundromat',
    video: '/videos/showcase/generated/sailcloth-laundromat.mp4',
  },
  {
    key: 'ship',
    slug: 'storm-ship',
    video: '/videos/showcase/generated/storm-ship-remake.mp4',
  },
  {
    key: 'asteroids',
    slug: 'asteroids',
    video: '/videos/showcase/generated/asteroids-remake.mp4',
  },
  {
    key: 'woman',
    slug: 'woman',
    video: '/videos/showcase/woman.mp4',
  },
] as const;

type ShowcaseKey = (typeof SHOWCASE)[number]['key'];

const SHOWCASE_MESSAGES: Record<
  ShowcaseKey,
  { title: () => string; prompt: () => string }
> = {
  monster_bakery: {
    title: m['video.clone.prompts.monster_bakery'],
    prompt: m['video.clone.prompts.monster_bakery_text'],
  },
  web_acrobat: {
    title: m['video.clone.prompts.web_acrobat'],
    prompt: m['video.clone.prompts.web_acrobat_text'],
  },
  paper_dragon: {
    title: m['video.clone.prompts.paper_dragon'],
    prompt: m['video.clone.prompts.paper_dragon_text'],
  },
  glacier_titan: {
    title: m['video.clone.prompts.glacier_titan'],
    prompt: m['video.clone.prompts.glacier_titan_text'],
  },
  airglide: {
    title: m['video.clone.prompts.airglide'],
    prompt: m['video.clone.prompts.airglide_text'],
  },
  poppies: {
    title: m['video.clone.prompts.poppies'],
    prompt: m['video.clone.prompts.poppies_text'],
  },
  monster_commuter: {
    title: m['video.clone.prompts.monster_commuter'],
    prompt: m['video.clone.prompts.monster_commuter_text'],
  },
  dragon: {
    title: m['video.clone.prompts.dragon'],
    prompt: m['video.clone.prompts.dragon_text'],
  },
  koi_train: {
    title: m['video.clone.prompts.koi_train'],
    prompt: m['video.clone.prompts.koi_train_text'],
  },
  conservatory: {
    title: m['video.clone.prompts.conservatory'],
    prompt: m['video.clone.prompts.conservatory_text'],
  },
  rain_market: {
    title: m['video.clone.prompts.rain_market'],
    prompt: m['video.clone.prompts.rain_market_text'],
  },
  orb: {
    title: m['video.clone.prompts.orb'],
    prompt: m['video.clone.prompts.orb_text'],
  },
  tidal: {
    title: m['video.clone.prompts.tidal'],
    prompt: m['video.clone.prompts.tidal_text'],
  },
  laundromat: {
    title: m['video.clone.prompts.laundromat'],
    prompt: m['video.clone.prompts.laundromat_text'],
  },
  ship: {
    title: m['video.clone.prompts.ship'],
    prompt: m['video.clone.prompts.ship_text'],
  },
  asteroids: {
    title: m['video.clone.prompts.asteroids'],
    prompt: m['video.clone.prompts.asteroids_text'],
  },
  woman: {
    title: m['video.clone.prompts.woman'],
    prompt: m['video.clone.prompts.woman_text'],
  },
};

/** Reads translations at render time, matching the rest of the Agent UI. */
export function promptCategories(): PromptCategory[] {
  return [
    {
      key: 'showcase',
      icon: Film,
      title: m['video.clone.prompts.eyebrow'](),
      examples: SHOWCASE.map((item, index) => {
        const messages = SHOWCASE_MESSAGES[item.key];
        return {
          key: item.slug,
          title: messages.title(),
          prompt: messages.prompt(),
          video: item.video,
          sourceImage: 'sourceImage' in item ? item.sourceImage : undefined,
          swatch: SWATCHES[index % SWATCHES.length],
        };
      }),
    },
  ];
}
