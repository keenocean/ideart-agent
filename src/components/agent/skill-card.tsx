import {
  Boxes,
  Film,
  ImageIcon,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  classifyAgentPromptSkill,
  skillCardTone,
  type AgentPromptSkill,
  type AgentSkillCategory,
} from '@/lib/agent-skills';
import { cn } from '@/lib/utils';

const COVER_TONES = [
  'linear-gradient(180deg, #2f0d68, #7138d8, #f0bfe2)',
  'linear-gradient(180deg, #10135d, #3438e8, #bfeaff)',
  'linear-gradient(180deg, #54240e, #bd642e, #ffe0a2)',
  'linear-gradient(180deg, #0f3e3a, #2d9f85, #c5eff2)',
  'linear-gradient(180deg, #182f57, #3679cf, #c9bff5)',
  'linear-gradient(180deg, #47205d, #8247a7, #f0c8de)',
] as const;

const categoryIcons = {
  ugc: UserRound,
  video: Film,
  static: ImageIcon,
  product: Boxes,
  other: Sparkles,
} satisfies Record<AgentSkillCategory, typeof Sparkles>;

export function SkillCover({
  skill,
  className,
  children,
}: {
  skill: AgentPromptSkill;
  className?: string;
  children?: React.ReactNode;
}) {
  const tone = COVER_TONES[skillCardTone(skill.name)];
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ backgroundImage: tone }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-35 mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.7) 0.7px, transparent 1px)',
          backgroundSize: '8px 8px',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.28),transparent_62%)]"
      />
      {children}
    </div>
  );
}

export function SkillCategoryBadge({
  category,
  label,
  className,
}: {
  category: AgentSkillCategory;
  label: string;
  className?: string;
}) {
  const Icon = categoryIcons[category];
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-2.5 text-[11px] font-medium text-white/90 backdrop-blur-md',
        className
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

export function SkillCard({
  skill,
  categoryLabel,
  saved,
  saveLabel,
  unsaveLabel,
  viewLabel,
  featured = false,
  onToggleSaved,
}: {
  skill: AgentPromptSkill;
  categoryLabel: string;
  saved: boolean;
  saveLabel: string;
  unsaveLabel: string;
  viewLabel: string;
  featured?: boolean;
  onToggleSaved: () => void;
}) {
  const category = classifyAgentPromptSkill(skill);

  return (
    <article className="group border-border bg-card focus-within:ring-primary relative isolate min-h-[220px] overflow-hidden rounded-xl border shadow-sm transition duration-200 focus-within:ring-2 hover:-translate-y-0.5 hover:shadow-lg">
      <SkillCover
        skill={skill}
        className="absolute inset-0 transition duration-300 group-hover:brightness-110"
      />
      <Link
        href={`/skills/${skill.name}`}
        aria-label={`${viewLabel}: ${skill.label}`}
        className="absolute inset-0 z-10 flex flex-col p-3 focus:outline-none"
      >
        <div className="flex items-start gap-2 pr-10">
          {featured && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 backdrop-blur-md">
              <Sparkles aria-hidden="true" className="size-3.5" />
            </span>
          )}
          <SkillCategoryBadge category={category} label={categoryLabel} />
        </div>
        <div className="flex flex-1 items-center justify-center px-8 py-7">
          <h3 className="line-clamp-2 text-center text-xl font-semibold tracking-[-0.02em] text-white drop-shadow-sm">
            {skill.label}
          </h3>
        </div>
        <div className="-mx-3 -mb-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pt-8 pb-4">
          <p className="line-clamp-2 text-xs leading-5 text-white/72 transition-colors group-hover:text-white/90">
            {skill.description}
          </p>
        </div>
      </Link>
      <button
        type="button"
        aria-label={saved ? unsaveLabel : saveLabel}
        title={saved ? unsaveLabel : saveLabel}
        onClick={onToggleSaved}
        className="focus-visible:ring-primary absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-black/15 text-white/75 backdrop-blur-md transition hover:bg-black/25 hover:text-white focus-visible:ring-2 focus-visible:outline-none"
      >
        <Star
          aria-hidden="true"
          className={cn('size-4', saved && 'fill-current text-amber-300')}
        />
      </button>
    </article>
  );
}
