import { useMemo, useRef } from 'react';
import { CircleAlert, CircleCheck, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
  getMarketingAsset,
  getMarketingImageAsset,
} from '@/config/catalog/assets';
import { generationPresetFor } from '@/config/catalog/generation';
import { toolCatalog } from '@/config/catalog/tools';
import type { DeploymentReadiness } from '@/config/catalog/types';
import {
  isImageModelOptionValue,
  settingsForImageModel,
} from '@/lib/agent-settings';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { useGenerationEntry } from '@/hooks/use-generation-entry';
import { GenerationWorkbench } from '@/components/agent/generation-workbench';
import {
  ToolDetailPage,
  type ToolDetailRelatedItem,
} from '@/components/catalog/tool-detail-page';
import { Button } from '@/components/ui/button';
import type { ToolDetailPageData } from '@/content/tools/listing';

function availabilityLabel(availability: ToolDetailPageData['availability']) {
  switch (availability) {
    case 'live':
      return m['tools.availability.live']();
    case 'beta':
      return m['tools.availability.beta']();
    case 'coming-soon':
      return m['tools.availability.coming_soon']();
  }
}

function readinessDescription(readiness: DeploymentReadiness): string {
  if (readiness.executable) return m['tools.workbench.ready']();
  switch (readiness.reason) {
    case 'provider-unconfigured':
      return m['tools.workbench.provider_unconfigured']();
    case 'model-route-unavailable':
      return m['tools.workbench.model_unavailable']();
    case 'storage-unconfigured':
      return m['tools.workbench.storage_unconfigured']();
    default:
      return m['tools.workbench.unavailable']();
  }
}

export function ToolDetail({
  page,
  readiness,
}: {
  page: ToolDetailPageData;
  readiness: DeploymentReadiness;
}) {
  const definition = toolCatalog.find(
    (entry) => entry.entityId === page.entityId
  );
  if (!definition) {
    throw new Error(`Tool definition missing: ${page.entityId}`);
  }
  const preset = useMemo(() => generationPresetFor(definition), [definition]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const entry = useGenerationEntry({
    entryContext: {
      kind: 'tool',
      entityId: page.entityId,
      locale: page.locale,
    },
    preset,
  });
  const related: ToolDetailRelatedItem[] = page.related.map((item) => ({
    ...item,
    actionLabel: m['tools.directory.view_tool'](),
  }));
  const resolveShowcaseImage = (media: {
    assetId: Parameters<typeof getMarketingImageAsset>[0];
    alt: string;
  }) => ({ ...getMarketingImageAsset(media.assetId), alt: media.alt });
  const content = {
    ...page.content,
    examples: {
      ...page.content.examples,
      items: page.content.examples.items.map(({ media, ...item }) => ({
        ...item,
        media: {
          ...getMarketingAsset(media.assetId),
          alt: media.alt,
        },
      })),
    },
    showcase: {
      workflows: {
        ...page.content.showcase.workflows,
        items: page.content.showcase.workflows.items.map((item) => ({
          ...item,
          media: [
            resolveShowcaseImage(item.media[0]),
            resolveShowcaseImage(item.media[1]),
          ] as const,
        })),
      },
      models: {
        ...page.content.showcase.models,
        items: page.content.showcase.models.items.map(({ media, ...item }) => ({
          ...item,
          media: resolveShowcaseImage(media),
        })),
      },
    },
  };
  const ReadyIcon = readiness.executable ? CircleCheck : CircleAlert;

  function focusWorkbench(value: string) {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(value.length, value.length);
      textarea.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'center',
      });
    });
  }

  return (
    <ToolDetailPage
      content={content}
      availabilityLabel={availabilityLabel(page.availability)}
      breadcrumbHomeLabel={m['tools.breadcrumb.home']()}
      breadcrumbToolsLabel={m['tools.breadcrumb.tools']()}
      relatedTitle={m['tools.related.title']()}
      relatedItems={related}
      onUsePrompt={(prompt) => {
        entry.setValue(prompt);
        focusWorkbench(prompt);
      }}
      onSelectModel={(modelKey) => {
        if (!isImageModelOptionValue(modelKey)) return;
        entry.setSettings(settingsForImageModel(entry.settings, modelKey));
        focusWorkbench(entry.value);
      }}
      workbench={
        <section aria-labelledby="tool-workbench-title" className="mx-auto">
          <h2 id="tool-workbench-title" className="sr-only">
            {page.content.workbench.title}
          </h2>
          <p className="sr-only">{page.content.workbench.description}</p>

          <GenerationWorkbench
            textareaRef={textareaRef}
            presentation="tool"
            inputModeLabels={{
              prompt: m['tools.workbench.text_prompt'](),
              reference: m['tools.workbench.reference_image'](),
            }}
            locks={preset.locks}
            value={entry.value}
            onValueChange={entry.setValue}
            onSubmit={entry.submit}
            placeholder={page.content.workbench.placeholder}
            attachments={entry.attachments}
            onAddFiles={(files) => void entry.addFiles(files)}
            onAddLibraryMedia={(media) => void entry.addLibraryMedia(media)}
            onRemoveAttachment={entry.removeAttachment}
            settings={entry.settings}
            onSettingsChange={entry.setSettings}
            skillName={entry.skillName}
            onSkillNameChange={entry.setSkillName}
            submitDisabled={
              !readiness.executable || entry.uploading || entry.submitting
            }
            size="lg"
          />

          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span
              className={cn(
                'flex min-w-0 items-start gap-2 px-1 text-xs leading-5',
                readiness.executable
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-800 dark:text-amber-300'
              )}
            >
              <ReadyIcon
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              {readinessDescription(readiness)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 gap-2 self-end px-2 text-xs sm:self-auto"
              onClick={() => {
                entry.saveSettingsAsDefault();
                toast.success(m['tools.workbench.default_saved']());
              }}
            >
              <Save aria-hidden="true" className="size-4" />
              {m['tools.workbench.save_default']()}
            </Button>
          </div>
        </section>
      }
    />
  );
}
