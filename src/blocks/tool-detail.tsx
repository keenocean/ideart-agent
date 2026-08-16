import { useMemo, useRef } from 'react';

import { generationPresetFor } from '@/config/catalog/generation';
import { toolCatalog } from '@/config/catalog/tools';
import type {
  DeploymentReadiness,
  MarketingImageAsset,
} from '@/config/catalog/types';
import { m } from '@/paraglide/messages.js';
import { useGenerationEntry } from '@/hooks/use-generation-entry';
import { ToolDetailTemplate } from '@/blocks/tool-detail-variants';
import { GenerationWorkbench } from '@/components/agent/generation-workbench';
import type { ToolDetailRelatedItem } from '@/components/catalog/tool-detail-shell';
import type { ToolDetailPageData } from '@/content/tools/listing';
import type { ToolMediaReference } from '@/content/tools/types';

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

function showcaseImage(
  media: ToolMediaReference
): MarketingImageAsset & { alt: string } {
  if (media.kind !== 'image') {
    throw new Error(`Showcase media must be an image: ${media.id}`);
  }
  return media;
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
  const workflowHrefs = new Map(
    page.showcaseRoutes.workflows.map((item) => [item.entityId, item.href])
  );
  const modelHrefs = new Map(
    page.showcaseRoutes.models.map((item) => [item.entityId, item.href])
  );
  const showcase = {
    workflows: {
      ...page.content.showcase.workflows,
      items: page.content.showcase.workflows.items.flatMap((item) => {
        const href = workflowHrefs.get(item.entityId);
        return href
          ? [
              {
                ...item,
                href,
                media: [
                  showcaseImage(item.media[0]),
                  showcaseImage(item.media[1]),
                ] as const,
              },
            ]
          : [];
      }),
    },
    models: {
      ...page.content.showcase.models,
      items: page.content.showcase.models.items.flatMap(
        ({ media, ...item }) => {
          const href = modelHrefs.get(item.entityId);
          return href ? [{ ...item, href, media: showcaseImage(media) }] : [];
        }
      ),
    },
  };
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
    <ToolDetailTemplate
      archetype={definition.archetype}
      content={page.content}
      showcase={showcase}
      availabilityLabel={availabilityLabel(page.availability)}
      breadcrumbHomeLabel={m['tools.breadcrumb.home']()}
      breadcrumbToolsLabel={m['tools.breadcrumb.tools']()}
      relatedTitle={m['tools.related.title']()}
      relatedItems={related}
      onUsePrompt={(prompt) => {
        entry.setValue(prompt);
        focusWorkbench(prompt);
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
            inputPolicy={entry.inputPolicy}
            videoOperation={
              preset.target.mediaMode === 'video'
                ? preset.target.operation
                : undefined
            }
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
        </section>
      }
    />
  );
}
