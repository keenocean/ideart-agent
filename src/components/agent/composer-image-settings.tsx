import { ChevronDown, ImageIcon } from 'lucide-react';

import {
  AGENT_IMAGE_ASPECT_RATIOS,
  AGENT_IMAGE_QUALITIES,
  AGENT_IMAGE_RESOLUTIONS,
  type AgentComposerSettings,
} from '@/lib/agent-settings';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
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

export function ComposerImageModel() {
  return (
    <div className="bg-muted/70 text-foreground flex h-9 max-w-[160px] items-center gap-1.5 rounded-md px-3 text-xs">
      <ImageIcon className="size-3.5 shrink-0" />
      <span className="truncate">GPT Image 2</span>
    </div>
  );
}

export function ComposerImageSettings({
  settings,
  onChange,
  disabled,
}: {
  settings: AgentComposerSettings;
  onChange: (settings: AgentComposerSettings) => void;
  disabled?: boolean;
}) {
  function update(patch: Partial<AgentComposerSettings>) {
    onChange({ ...settings, ...patch });
  }

  const aspectLabel =
    settings.imageAspectRatio === 'auto'
      ? m['agent.composer.auto']()
      : settings.imageAspectRatio;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="bg-muted/70 text-foreground hover:bg-muted h-9 gap-1.5 rounded-md px-3 text-xs"
          />
        }
      >
        <span className="truncate">
          {settings.imageResolution} · {qualityLabel(settings.imageQuality)} ·{' '}
          {aspectLabel}
        </span>
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
