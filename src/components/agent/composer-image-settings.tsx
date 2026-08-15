import { Check, ChevronDown, ImageIcon } from 'lucide-react';

import {
  AGENT_IMAGE_ASPECT_RATIOS,
  AGENT_IMAGE_MODEL_OPTIONS,
  AGENT_IMAGE_QUALITIES,
  AGENT_IMAGE_RESOLUTIONS,
  imageModelOptionFor,
  settingsForImageModel,
  type AgentComposerSettings,
} from '@/lib/agent-settings';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function RatioGlyph({ ratio }: { ratio: string }) {
  const [width, height] = ratio.split(':').map(Number);
  const scale = 18 / Math.max(width, height);
  return (
    <span className="flex h-[18px] items-center justify-center">
      <span
        className="block rounded-[3px] border-[1.5px] border-current"
        style={{ width: width * scale, height: height * scale }}
      />
    </span>
  );
}

function qualityLabel(quality: string) {
  if (quality === 'low') return m['agent.composer.quality_low']();
  if (quality === 'high') return m['agent.composer.quality_high']();
  return m['agent.composer.quality_medium']();
}

export function ComposerImageModel({
  settings,
  onChange,
  disabled,
}: {
  settings: AgentComposerSettings;
  onChange: (settings: AgentComposerSettings) => void;
  disabled?: boolean;
}) {
  const selected = imageModelOptionFor(settings.imageModelOption)!;
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
        <ImageIcon className="size-3.5 shrink-0" />
        <span className="truncate">{selected.label}</span>
        <ChevronDown className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {AGENT_IMAGE_MODEL_OPTIONS.map((model) => (
          <DropdownMenuItem
            key={model.value}
            onClick={() =>
              onChange(settingsForImageModel(settings, model.value))
            }
            className="items-center gap-2.5"
          >
            <ImageIcon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {model.label}
            </span>
            {settings.imageModelOption === model.value && (
              <Check className="size-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ComposerImageSettings({
  settings,
  onChange,
  disabled,
  compact = false,
}: {
  settings: AgentComposerSettings;
  onChange: (settings: AgentComposerSettings) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  function update(patch: Partial<AgentComposerSettings>) {
    onChange({ ...settings, ...patch });
  }

  const aspectLabel =
    settings.imageAspectRatio === 'auto'
      ? m['agent.composer.auto']()
      : settings.imageAspectRatio;
  const settingsSummary = `${settings.imageResolution} · ${qualityLabel(
    settings.imageQuality
  )} · ${aspectLabel}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label={compact ? settingsSummary : undefined}
            title={compact ? settingsSummary : undefined}
            className="bg-muted/70 text-foreground hover:bg-muted h-9 gap-1.5 rounded-md px-3 text-xs"
          />
        }
      >
        <span className={cn('truncate', compact && 'hidden sm:inline')}>
          {settingsSummary}
        </span>
        {compact && <span className="sm:hidden">{aspectLabel}</span>}
        <ChevronDown className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[340px] p-3">
        <p className="mb-2 text-xs font-medium">
          {m['agent.composer.resolution']()}
        </p>
        <div className="bg-muted flex rounded-md p-0.5">
          {AGENT_IMAGE_RESOLUTIONS.map((resolution) => (
            <button
              key={resolution}
              type="button"
              onClick={() => update({ imageResolution: resolution })}
              className={cn(
                'flex-1 rounded-[5px] py-1.5 text-xs transition-colors',
                settings.imageResolution === resolution
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {resolution}
            </button>
          ))}
        </div>

        <p className="mt-4 mb-2 text-xs font-medium">
          {m['agent.composer.quality']()}
        </p>
        <div className="bg-muted flex rounded-md p-0.5">
          {AGENT_IMAGE_QUALITIES.map((quality) => (
            <button
              key={quality}
              type="button"
              onClick={() => update({ imageQuality: quality })}
              className={cn(
                'flex-1 rounded-[5px] py-1.5 text-xs transition-colors',
                settings.imageQuality === quality
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {qualityLabel(quality)}
            </button>
          ))}
        </div>

        <p className="mt-4 mb-2 text-xs font-medium">
          {m['agent.composer.aspect_ratio']()}
        </p>
        <div className="grid max-h-52 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
          {AGENT_IMAGE_ASPECT_RATIOS.map((ratio) => {
            const active = settings.imageAspectRatio === ratio;
            return (
              <button
                key={ratio}
                type="button"
                onClick={() => update({ imageAspectRatio: ratio })}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-md border text-[11px] transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {ratio === 'auto' ? (
                  <span className="text-xs">{m['agent.composer.auto']()}</span>
                ) : (
                  <>
                    <RatioGlyph ratio={ratio} />
                    <span>{ratio}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
