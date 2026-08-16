import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Search, Sparkles, Star } from 'lucide-react';

import {
  classifyAgentPromptSkill,
  filterAgentPromptSkills,
  normalizeAgentPromptSkills,
  type AgentSkillCategoryFilter,
  type AgentSkillResponseItem,
} from '@/lib/agent-skills';
import { apiGet } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { useSavedAgentSkills } from '@/hooks/use-saved-agent-skills';
import { useAgentHeader } from '@/components/agent/agent-header-context';
import { SkillCard } from '@/components/agent/skill-card';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/(agent)/skills/')({
  component: SkillsPage,
});

const categories: AgentSkillCategoryFilter[] = [
  'all',
  'ugc',
  'video',
  'static',
  'product',
  'other',
];

function categoryLabel(category: AgentSkillCategoryFilter): string {
  switch (category) {
    case 'all':
      return m['agent.skills.category_all']();
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

function SkillsPage() {
  const { setContent: setHeaderContent } = useAgentHeader();
  const { saved, savedNames, toggle } = useSavedAgentSkills();
  const [view, setView] = useState<'all' | 'saved'>('all');
  const [category, setCategory] = useState<AgentSkillCategoryFilter>('all');
  const [query, setQuery] = useState('');

  const skillsQuery = useQuery({
    queryKey: ['agent-skills'],
    queryFn: () =>
      apiGet<{ items: AgentSkillResponseItem[] }>('/api/agent/skills'),
    staleTime: 5 * 60 * 1000,
  });
  const skills = useMemo(
    () => normalizeAgentPromptSkills(skillsQuery.data?.items ?? []),
    [skillsQuery.data?.items]
  );
  const filtered = useMemo(() => {
    const matches = filterAgentPromptSkills(skills, { category, query });
    return view === 'saved'
      ? matches.filter((skill) => saved.has(skill.name))
      : matches;
  }, [category, query, saved, skills, view]);
  const defaultView =
    view === 'all' && category === 'all' && query.trim().length === 0;
  const featured = defaultView ? filtered.slice(0, 3) : [];
  const catalog = defaultView ? filtered.slice(3) : filtered;

  useEffect(() => {
    setHeaderContent({ title: m['agent.skills.breadcrumb']() });
    return () => setHeaderContent({});
  }, [setHeaderContent]);

  function resetFilters() {
    setView('all');
    setCategory('all');
    setQuery('');
  }

  return (
    <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto">
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <header className="max-w-2xl">
          <div className="border-border bg-muted/45 text-muted-foreground mb-4 inline-flex size-10 items-center justify-center rounded-xl border">
            <Sparkles aria-hidden="true" className="size-5" />
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            {m['agent.skills.title']()}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6 sm:text-base">
            {m['agent.skills.description']()}
          </p>
        </header>

        <div className="border-border mt-8 flex items-center gap-6 border-b">
          <ViewTab
            active={view === 'all'}
            count={skills.length}
            onClick={() => setView('all')}
          >
            {m['agent.skills.all']()}
          </ViewTab>
          <ViewTab
            active={view === 'saved'}
            count={savedNames.length}
            onClick={() => setView('saved')}
          >
            <Star aria-hidden="true" className="size-3.5" />
            {m['agent.skills.saved']()}
          </ViewTab>
        </div>

        <div className="mt-4 flex min-w-0 items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <label className="border-border bg-muted/35 focus-within:border-ring flex h-9 w-64 shrink-0 items-center gap-2 rounded-full border px-3 transition-colors">
            <Search
              aria-hidden="true"
              className="text-muted-foreground size-4 shrink-0"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={m['agent.skills.search_placeholder']()}
              className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={cn(
                'border-border h-9 shrink-0 rounded-full border px-3.5 text-xs font-medium transition-colors',
                category === item
                  ? 'bg-foreground text-background border-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {categoryLabel(item)}
            </button>
          ))}
        </div>

        {skillsQuery.isLoading ? (
          <SkillsState title={m['agent.skills.loading']()} />
        ) : skillsQuery.isError ? (
          <SkillsState
            title={m['agent.skills.load_failed']()}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => skillsQuery.refetch()}
              >
                {m['agent.skills.retry']()}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <SkillsState
            title={m['agent.skills.empty_title']()}
            description={m['agent.skills.empty_description']()}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                {m['agent.skills.clear_filters']()}
              </Button>
            }
          />
        ) : (
          <div className="mt-8 space-y-10">
            {featured.length > 0 && (
              <SkillGroup
                title={m['agent.skills.featured']()}
                skills={featured}
                saved={saved}
                onToggleSaved={toggle}
                featured
              />
            )}
            {catalog.length > 0 && (
              <SkillGroup
                title={
                  defaultView
                    ? m['agent.skills.explore']()
                    : m['agent.skills.results']({ count: catalog.length })
                }
                skills={catalog}
                saved={saved}
                onToggleSaved={toggle}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ViewTab({
  active,
  count,
  children,
  onClick,
}: {
  active: boolean;
  count: number;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative flex h-11 items-center gap-1.5 text-sm transition-colors',
        active
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
      <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">
        {count}
      </span>
      {active && (
        <span className="bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-full" />
      )}
    </button>
  );
}

function SkillGroup({
  title,
  skills,
  saved,
  featured = false,
  onToggleSaved,
}: {
  title: string;
  skills: ReturnType<typeof normalizeAgentPromptSkills>;
  saved: ReadonlySet<string>;
  featured?: boolean;
  onToggleSaved: (name: string) => void;
}) {
  return (
    <section>
      <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        {title}
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => {
          const skillCategory = classifyAgentPromptSkill(skill);
          return (
            <SkillCard
              key={skill.name}
              skill={skill}
              categoryLabel={categoryLabel(skillCategory)}
              saved={saved.has(skill.name)}
              saveLabel={m['agent.skills.save']()}
              unsaveLabel={m['agent.skills.unsave']()}
              viewLabel={m['agent.skills.view']()}
              featured={featured}
              onToggleSaved={() => onToggleSaved(skill.name)}
            />
          );
        })}
      </div>
    </section>
  );
}

function SkillsState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-border bg-muted/20 mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
      <Sparkles aria-hidden="true" className="text-muted-foreground size-6" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-md text-sm leading-6">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
