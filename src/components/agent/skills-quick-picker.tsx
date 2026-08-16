import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, Loader2, Search, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  classifyAgentPromptSkill,
  filterAgentPromptSkills,
  getAgentSkillPreviewMetadata,
  normalizeAgentPromptSkills,
  type AgentPromptSkill,
  type AgentSkillResponseItem,
} from '@/lib/agent-skills';
import { apiGet } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { SkillCategoryIcon } from '@/components/agent/skill-card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import styles from './skills-quick-picker.module.css';

export function SkillsQuickPicker({
  skillName,
  onSkillNameChange,
}: {
  skillName?: string;
  onSkillNameChange: (skillName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [previewName, setPreviewName] = useState<string | null>(null);
  const skillsQuery = useQuery({
    queryKey: ['agent-skills'],
    queryFn: () =>
      apiGet<{ items: AgentSkillResponseItem[] }>('/api/agent/skills'),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const skills = useMemo(
    () => normalizeAgentPromptSkills(skillsQuery.data?.items ?? []),
    [skillsQuery.data?.items]
  );
  const visibleSkills = useMemo(
    () => filterAgentPromptSkills(skills, { category: 'all', query }),
    [query, skills]
  );
  const activeSkill =
    visibleSkills.find((skill) => skill.name === previewName) ??
    visibleSkills.find((skill) => skill.name === skillName) ??
    visibleSkills[0] ??
    null;

  function applySkill(skill: AgentPromptSkill) {
    onSkillNameChange(skill.name);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={m['agent.quick_actions.skills']()}
            aria-pressed={Boolean(skillName)}
            className={cn(
              'border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
              (open || skillName) &&
                'border-primary/30 bg-primary/10 text-foreground'
            )}
          />
        }
      >
        <Sparkles aria-hidden="true" className="size-4" />
        {m['agent.quick_actions.skills']()}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={10}
        style={{
          width: 'min(64rem, calc(100vw - 1.5rem))',
          height: 'min(28rem, var(--available-height))',
        }}
        className="border-border bg-popover gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl"
      >
        <div
          className={cn(
            styles.layout,
            'grid size-full min-h-0 min-w-0 overflow-hidden'
          )}
        >
          <section
            className={cn(
              styles.listPane,
              'border-border flex min-h-0 min-w-0 flex-col'
            )}
          >
            <div className="flex shrink-0 items-center gap-2.5 p-3">
              <label className="bg-muted focus-within:ring-primary flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3.5 focus-within:ring-2">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground size-5 shrink-0"
                />
                <span className="sr-only">
                  {m['agent.skills.search_placeholder']()}
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={m['agent.skills.search_placeholder']()}
                  className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <Link
                href="/skills"
                onClick={() => setOpen(false)}
                className="bg-primary/10 text-primary hover:bg-primary/5 focus-visible:ring-primary flex h-10 shrink-0 items-center rounded-xl px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {m['agent.skills.browse_all']()}
              </Link>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {skillsQuery.isLoading ? (
                <PickerState
                  icon={<Loader2 className="size-5 animate-spin" />}
                  label={m['agent.skills.loading']()}
                />
              ) : skillsQuery.isError ? (
                <PickerState
                  label={m['agent.skills.load_failed']()}
                  action={m['agent.skills.retry']()}
                  onAction={() => void skillsQuery.refetch()}
                />
              ) : visibleSkills.length === 0 ? (
                <PickerState label={m['agent.skills.empty_title']()} />
              ) : (
                <div role="listbox" aria-label={m['agent.skills.title']()}>
                  {visibleSkills.map((skill) => {
                    const category = classifyAgentPromptSkill(skill);
                    const selected = activeSkill?.name === skill.name;
                    return (
                      <button
                        key={skill.name}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setPreviewName(skill.name)}
                        onFocus={() => setPreviewName(skill.name)}
                        onClick={() => setPreviewName(skill.name)}
                        onDoubleClick={() => applySkill(skill)}
                        className={cn(
                          'focus-visible:ring-primary flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                          selected
                            ? 'bg-muted text-foreground'
                            : 'hover:bg-muted/70'
                        )}
                      >
                        <span className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                          <SkillCategoryIcon
                            category={category}
                            className="size-5"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-foreground block truncate text-sm font-medium sm:text-base">
                            {skill.label}
                          </span>
                          <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                            {skill.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <SkillPreview
            skill={activeSkill}
            onViewDetails={() => setOpen(false)}
            onApply={applySkill}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SkillPreview({
  skill,
  onViewDetails,
  onApply,
}: {
  skill: AgentPromptSkill | null;
  onViewDetails: () => void;
  onApply: (skill: AgentPromptSkill) => void;
}) {
  if (!skill) {
    return (
      <aside className="border-border bg-muted/20 text-muted-foreground hidden items-center justify-center p-6 text-sm md:flex">
        {m['agent.skills.empty_title']()}
      </aside>
    );
  }

  const category = classifyAgentPromptSkill(skill);
  const metadata = getAgentSkillPreviewMetadata(skill);

  return (
    <aside
      className={cn(
        styles.preview,
        'border-border bg-muted/20 min-h-0 border-t md:flex'
      )}
    >
      <div className="hidden min-h-0 flex-1 overflow-y-auto p-5 md:block">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <SkillCategoryIcon category={category} className="size-5" />
          </span>
          <h3 className="text-foreground min-w-0 truncate text-lg font-medium">
            {skill.label}
          </h3>
        </div>
        <p className="text-muted-foreground mt-4 line-clamp-4 text-sm leading-6">
          {skill.description}
        </p>
        <Link
          href={`/skills/${skill.name}`}
          onClick={onViewDetails}
          className="text-primary mt-2 inline-flex text-sm font-medium hover:underline"
        >
          {m['agent.skills.view_details']()}
        </Link>

        <MetadataTags
          className="mt-5"
          label={m['agent.skills.best_for']()}
          tags={metadata.bestFor}
        />
        <MetadataTags
          className="mt-5"
          label={m['agent.skills.style']()}
          tags={metadata.style}
        />
      </div>

      <div className="border-border shrink-0 border-t p-3 md:p-5">
        <p className="text-muted-foreground hidden text-xs font-medium md:block">
          {m['agent.skills.slash_command']()}
        </p>
        <div className="border-border bg-background mt-2 flex h-12 items-center gap-3 rounded-xl border px-3">
          <span className="min-w-0 flex-1">
            <span className="text-foreground block truncate text-sm font-medium md:hidden">
              {skill.label}
            </span>
            <code className="text-muted-foreground block truncate text-xs md:text-sm">
              /{skill.name}
            </code>
          </span>
          <button
            type="button"
            onClick={() => onApply(skill)}
            aria-label={`${m['agent.skills.use']()}: ${skill.label}`}
            title={m['agent.skills.use']()}
            className="bg-primary text-primary-foreground focus-visible:ring-primary flex size-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:outline-none"
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MetadataTags({
  label,
  tags,
  className,
}: {
  label: string;
  tags: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-primary/10 text-primary rounded-md px-2 py-1 font-mono text-[11px] leading-none"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function PickerState({
  icon,
  label,
  action,
  onAction,
}: {
  icon?: React.ReactNode;
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-muted-foreground flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center text-sm">
      {icon}
      <p>{label}</p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-primary font-medium hover:underline"
        >
          {action}
        </button>
      )}
    </div>
  );
}
