import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  Film,
  ImageIcon,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

import {
  AGENT_MEDIA_MODES,
  AGENT_MODEL_OPTIONS,
  labelForModelOption,
  settingsForModel,
  type AgentComposerSettings,
  type AgentMediaMode,
} from '@/lib/agent-settings';
import {
  normalizeAgentPromptSkills,
  type AgentPromptSkill,
  type AgentSkillResponseItem,
} from '@/lib/agent-skills';
import { apiGet } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { ModelLogo } from '@/components/agent/model-logos';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const modeIcons = {
  auto: WandSparkles,
  image: ImageIcon,
  video: Film,
} satisfies Record<AgentMediaMode, typeof Film>;

function modeLabel(mode: AgentMediaMode) {
  if (mode === 'image') return m['agent.composer.mode_image']();
  if (mode === 'video') return m['agent.composer.mode_video']();
  return m['agent.composer.mode_auto']();
}

export function ComposerModeSelector({
  settings,
  onChange,
  disabled,
}: {
  settings: AgentComposerSettings;
  onChange: (settings: AgentComposerSettings) => void;
  disabled?: boolean;
}) {
  const ActiveIcon = modeIcons[settings.mediaMode];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label={m['agent.composer.output_mode']()}
            className="h-8 gap-1.5 rounded-full px-2.5 text-xs"
          />
        }
      >
        <ActiveIcon className="size-3.5" />
        <span>{modeLabel(settings.mediaMode)}</span>
        <ChevronDown className="text-muted-foreground size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="text-muted-foreground px-2 py-1.5 text-xs">
          {m['agent.composer.output_mode']()}
        </div>
        {AGENT_MEDIA_MODES.map((mode) => {
          const Icon = modeIcons[mode];
          return (
            <DropdownMenuItem
              key={mode}
              onClick={() => onChange({ ...settings, mediaMode: mode })}
              className="items-center gap-2.5"
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 text-sm">{modeLabel(mode)}</span>
              {settings.mediaMode === mode && (
                <Check className="size-4 shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ComposerControls({
  settings,
  onChange,
  disabled,
}: {
  settings: AgentComposerSettings;
  onChange: (settings: AgentComposerSettings) => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="bg-muted/70 text-foreground hover:bg-muted h-9 max-w-[210px] gap-1.5 rounded-md px-3 text-xs"
          />
        }
      >
        <ModelLogo model={settings.modelOption} className="size-3.5 shrink-0" />
        <span className="truncate">
          {labelForModelOption(settings.modelOption)}
        </span>
        <ChevronDown className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="text-muted-foreground px-2 py-1.5 text-xs">
          {m['agent.composer.video_models']()}
        </div>
        {AGENT_MODEL_OPTIONS.map((model) => (
          <DropdownMenuItem
            key={model.value}
            onClick={() => onChange(settingsForModel(settings, model.value))}
            className="items-center gap-2.5"
          >
            <ModelLogo model={model.value} className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {model.label}
            </span>
            {settings.modelOption === model.value && (
              <Check className="size-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ComposerSkillSelect({
  skillName,
  onChange,
  disabled,
}: {
  skillName?: string;
  onChange: (skillName: string | undefined) => void;
  disabled?: boolean;
}) {
  const skillsQuery = useQuery({
    queryKey: ['agent-skills'],
    queryFn: () =>
      apiGet<{ items: AgentSkillResponseItem[] }>('/api/agent/skills'),
    staleTime: 5 * 60 * 1000,
  });
  const skills: AgentPromptSkill[] = normalizeAgentPromptSkills(
    skillsQuery.data?.items ?? []
  );
  const selected = skills.find((skill) => skill.name === skillName);

  useEffect(() => {
    if (!skillName || !skillsQuery.isSuccess) return;
    if (!selected) onChange(undefined);
  }, [skillName, selected, skillsQuery.isSuccess, onChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="bg-muted/70 text-foreground hover:bg-muted h-9 max-w-[180px] gap-1.5 rounded-md px-3 text-xs"
          />
        }
      >
        <Sparkles className="text-muted-foreground size-3.5 shrink-0" />
        <span className="truncate">
          {selected?.label ?? skillName ?? m['agent.composer.skill_none']()}
        </span>
        <ChevronDown className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[min(24rem,70dvh)] w-64 overflow-y-auto"
      >
        <div className="text-muted-foreground px-2 py-1.5 text-xs">
          {m['agent.composer.skills']()}
        </div>
        <DropdownMenuItem
          onClick={() => onChange(undefined)}
          className="items-center gap-2.5"
        >
          <span className="min-w-0 flex-1 truncate text-sm">
            {m['agent.composer.skill_none']()}
          </span>
          {!skillName && <Check className="size-4 shrink-0" />}
        </DropdownMenuItem>
        {skills.map((skill) => (
          <DropdownMenuItem
            key={skill.name}
            onClick={() => onChange(skill.name)}
            className="items-center gap-2.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{skill.label}</span>
              {skill.description && (
                <span className="text-muted-foreground block truncate text-xs">
                  {skill.description}
                </span>
              )}
            </span>
            {selected?.name === skill.name && (
              <Check className="size-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
