import { useMemo } from 'react';
import { CircleAlert, CircleCheck, Save } from 'lucide-react';
import { toast } from 'sonner';

import { generationPresetFor } from '@/config/catalog/generation';
import { toolCatalog } from '@/config/catalog/tools';
import type { DeploymentReadiness } from '@/config/catalog/types';
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
  const ReadyIcon = readiness.executable ? CircleCheck : CircleAlert;

  return (
    <ToolDetailPage
      content={page.content}
      availabilityLabel={availabilityLabel(page.availability)}
      breadcrumbHomeLabel={m['tools.breadcrumb.home']()}
      breadcrumbToolsLabel={m['tools.breadcrumb.tools']()}
      relatedTitle={m['tools.related.title']()}
      relatedItems={related}
      workbench={
        <section
          aria-labelledby="tool-workbench-title"
          className="border-border bg-card mx-auto max-w-4xl rounded-[2rem] border p-4 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="tool-workbench-title" className="text-xl font-semibold">
                {page.content.workbench.title}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                {page.content.workbench.description}
              </p>
            </div>
            <span
              className={cn(
                'flex shrink-0 items-start gap-2 rounded-xl px-3 py-2 text-xs leading-5 sm:max-w-64',
                readiness.executable
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
              )}
            >
              <ReadyIcon
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              {readinessDescription(readiness)}
            </span>
          </div>

          <GenerationWorkbench
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
            disabled={!readiness.executable}
            submitDisabled={entry.uploading || entry.submitting}
            size="lg"
          />

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
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
