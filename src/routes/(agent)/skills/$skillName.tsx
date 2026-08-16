import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  FileText,
  Sparkles,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import {
  classifyAgentPromptSkill,
  type AgentPromptSkill,
  type AgentSkillCategory,
  type AgentSkillDetailResponseItem,
} from '@/lib/agent-skills';
import { apiGet } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { useGenerationEntry } from '@/hooks/use-generation-entry';
import { useSavedAgentSkills } from '@/hooks/use-saved-agent-skills';
import { useAgentHeader } from '@/components/agent/agent-header-context';
import { SkillCategoryBadge, SkillCover } from '@/components/agent/skill-card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/(agent)/skills/$skillName')({
  component: SkillDetailPage,
});

function categoryLabel(category: AgentSkillCategory): string {
  switch (category) {
    case 'ugc':
      return m['agent.skills.category_ugc']();
    case 'video':
      return m['agent.skills.category_video']();
    case 'static':
      return m['agent.skills.category_static']();
    case 'product':
      return m['agent.skills.category_product']();
    case 'other':
      return m['agent.skills.category_other']();
  }
}

function SkillDetailPage() {
  const { skillName } = Route.useParams();
  const { setContent: setHeaderContent } = useAgentHeader();
  const { saved, toggle } = useSavedAgentSkills();
  const entry = useGenerationEntry({
    entryContext: { kind: 'home' },
    persistSettingsOnChange: true,
  });
  const skillQuery = useQuery({
    queryKey: ['agent-skill', skillName],
    queryFn: () =>
      apiGet<AgentSkillDetailResponseItem>(
        `/api/agent/skills/${encodeURIComponent(skillName)}`
      ),
    staleTime: 5 * 60 * 1000,
  });
  const detail = skillQuery.data;
  const skill = useMemo<AgentPromptSkill | null>(
    () =>
      detail
        ? {
            name: detail.name,
            label: detail.title,
            description: detail.summary,
          }
        : null,
    [detail]
  );
  const category = skill ? classifyAgentPromptSkill(skill) : 'other';
  const tags = useMemo(() => skillTags(detail?.name), [detail?.name]);

  useEffect(() => {
    setHeaderContent({
      title: detail?.title ?? m['agent.skills.breadcrumb'](),
    });
    return () => setHeaderContent({});
  }, [detail?.title, setHeaderContent]);

  async function copyInstructions() {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(detail.instructions);
      toast.success(m['agent.skills.copied']());
    } catch {
      toast.error(m['agent.skills.copy_failed']());
    }
  }

  if (skillQuery.isLoading) {
    return <DetailState title={m['agent.skills.loading_detail']()} />;
  }

  if (!detail || !skill) {
    return (
      <DetailState
        title={m['agent.skills.not_found_title']()}
        description={m['agent.skills.not_found_description']()}
      />
    );
  }

  const isSaved = saved.has(skill.name);

  return (
    <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
      <main className="border-border bg-card mx-auto min-h-full w-full max-w-7xl overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border flex items-center gap-3 border-b px-4 py-3 sm:px-5">
          <Link
            href="/skills"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-full transition-colors"
            aria-label={m['agent.skills.back']()}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">
              {m['agent.skills.breadcrumb']()}
            </p>
            <p className="truncate text-sm font-medium">{detail.title}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => toggle(skill.name)}
              aria-label={
                isSaved ? m['agent.skills.unsave']() : m['agent.skills.save']()
              }
              className="size-8 rounded-full"
            >
              <Star
                className={cn(
                  'size-4',
                  isSaved && 'fill-current text-amber-500'
                )}
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void copyInstructions()}
              aria-label={m['agent.skills.copy']()}
              className="size-8 rounded-full"
            >
              <Copy aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid min-h-[calc(100dvh-8.5rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.85fr)]">
          <section className="border-border bg-muted/20 flex min-h-[34rem] items-center justify-center overflow-hidden border-b p-6 sm:p-10 lg:min-h-0 lg:border-r lg:border-b-0">
            <SkillCover
              skill={skill}
              className="flex aspect-[9/14] h-auto max-h-[min(68dvh,46rem)] w-full max-w-sm flex-col rounded-[2rem] border border-white/15 p-5 shadow-2xl shadow-black/30"
            >
              <div className="relative z-10 flex items-center justify-between">
                <SkillCategoryBadge
                  category={category}
                  label={categoryLabel(category)}
                />
                <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-black/10 text-white/80 backdrop-blur-md">
                  <Sparkles aria-hidden="true" className="size-4" />
                </span>
              </div>
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
                <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md">
                  <Sparkles aria-hidden="true" className="size-6" />
                </span>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-balance text-white sm:text-4xl">
                  {detail.title}
                </h1>
                <p className="mt-4 line-clamp-4 max-w-xs text-sm leading-6 text-white/72">
                  {detail.summary}
                </p>
              </div>
              <div className="relative z-10 flex items-center justify-between text-[10px] font-medium tracking-[0.14em] text-white/60 uppercase">
                <span>Ideart</span>
                <span>Skill</span>
              </div>
            </SkillCover>
          </section>

          <section className="flex min-h-0 flex-col p-5 sm:p-7 lg:max-h-[calc(100dvh-8.5rem)]">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="flex flex-wrap items-center gap-2">
                <SkillCategoryBadge
                  category={category}
                  label={categoryLabel(category)}
                  className="border-border bg-muted text-foreground"
                />
                <span className="text-primary inline-flex items-center gap-1 text-xs font-medium">
                  <Check aria-hidden="true" className="size-3.5" />
                  {m['agent.skills.ready']()}
                </span>
              </div>
              <h2 className="text-foreground mt-5 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                {detail.title}
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {detail.summary}
              </p>

              <div className="mt-6">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">
                  {m['agent.skills.best_for']()}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary rounded-md px-2 py-1 font-mono text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-border mt-7 overflow-hidden rounded-xl border">
                <div className="border-border bg-muted/35 flex h-10 items-center gap-2 border-b px-3">
                  <FileText
                    aria-hidden="true"
                    className="text-muted-foreground size-3.5"
                  />
                  <span className="text-muted-foreground font-mono text-xs">
                    SKILL.md
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyInstructions()}
                    className="text-muted-foreground hover:text-foreground ml-auto text-xs transition-colors"
                  >
                    {m['agent.skills.copy']()}
                  </button>
                </div>
                <pre className="bg-background/70 max-h-72 overflow-auto p-4 font-mono text-xs leading-5 whitespace-pre-wrap">
                  {detail.instructions}
                </pre>
              </div>

              {detail.referencePaths.length > 0 && (
                <p className="text-muted-foreground mt-3 text-xs">
                  {m['agent.skills.references']({
                    count: detail.referencePaths.length,
                  })}
                </p>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                entry.submit({ skillName: skill.name });
              }}
              className="border-border bg-background mt-5 shrink-0 rounded-2xl border p-3 shadow-sm"
            >
              <label className="sr-only" htmlFor="skill-prompt">
                {m['agent.skills.create_placeholder']()}
              </label>
              <div className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary mt-0.5 shrink-0 rounded-full px-2.5 py-1 font-mono text-xs">
                  /{skill.name}
                </span>
                <textarea
                  id="skill-prompt"
                  value={entry.value}
                  onChange={(event) => entry.setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      entry.submit({ skillName: skill.name });
                    }
                  }}
                  rows={2}
                  placeholder={m['agent.skills.create_placeholder']()}
                  className="placeholder:text-muted-foreground min-h-14 min-w-0 flex-1 resize-none bg-transparent text-sm leading-6 outline-none"
                />
              </div>
              <div className="mt-2 flex items-center justify-between pl-1">
                <span className="text-muted-foreground text-xs">
                  {m['agent.skills.create_hint']()}
                </span>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!entry.value.trim() || entry.submitting}
                  aria-label={m['agent.skills.create']()}
                  className="size-9 rounded-full"
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function skillTags(name: string | undefined): string[] {
  if (!name) return [];
  const ignored = new Set(['skill', 'ads', 'with', 'from', 'into']);
  return name
    .split('-')
    .filter((part) => part.length > 2 && !ignored.has(part))
    .slice(0, 5)
    .map((part) => part.replace(/^./, (letter) => letter.toUpperCase()));
}

function DetailState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center p-6 text-center">
      <div>
        <Sparkles
          aria-hidden="true"
          className="text-muted-foreground mx-auto size-7"
        />
        <h1 className="mt-3 text-base font-medium">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
        <Link
          href="/skills"
          className="border-border hover:bg-muted mt-5 inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {m['agent.skills.back']()}
        </Link>
      </div>
    </div>
  );
}
