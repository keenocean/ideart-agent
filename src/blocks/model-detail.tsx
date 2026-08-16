import { useMemo, useRef } from 'react';

import { generationPresetFor } from '@/config/catalog/generation';
import { modelCatalog } from '@/config/catalog/models';
import type {
  DeploymentReadiness,
  ModelDefinition,
} from '@/config/catalog/types';
import {
  AGENT_IMAGE_ASPECT_RATIOS,
  imageModelOptionFor,
  modelOptionFor,
} from '@/lib/agent-settings';
import { m } from '@/paraglide/messages.js';
import { useGenerationEntry } from '@/hooks/use-generation-entry';
import { GenerationWorkbench } from '@/components/agent/generation-workbench';
import {
  CatalogDetailShell,
  type CatalogDetailRelatedItem,
} from '@/components/catalog/catalog-detail-shell';
import {
  CatalogFeatureGrid,
  CatalogLimitations,
  CatalogMediaCarousel,
  CatalogSteps,
} from '@/components/catalog/catalog-marketing-sections';
import { CatalogMediaFeatureList } from '@/components/catalog/catalog-media-feature-list';
import {
  CatalogModelComparison,
  type CatalogModelComparisonRow,
} from '@/components/catalog/catalog-model-comparison';
import {
  CatalogModelSpecs,
  type CatalogModelSpec,
} from '@/components/catalog/catalog-model-specs';
import type { ModelDetailPageData } from '@/content/models/listing';

function availabilityLabel(availability: ModelDetailPageData['availability']) {
  switch (availability) {
    case 'live':
      return m['models.availability.live']();
    case 'beta':
      return m['models.availability.beta']();
    case 'coming-soon':
      return m['models.availability.coming_soon']();
  }
}

function specValues(
  definition: ModelDefinition,
  labels: ModelDetailPageData['content']['specs']['labels']
): string[] {
  if (definition.modality === 'image') {
    const option = imageModelOptionFor(definition.runtimeModelKey)!;
    return [
      labels.image,
      labels.notApplicable,
      '1K, 2K, 4K',
      AGENT_IMAGE_ASPECT_RATIOS.join(', '),
      labels.notApplicable,
      String(option.maxImages),
    ];
  }
  const option = modelOptionFor(definition.runtimeModelKey)!;
  return [
    labels.video,
    `${option.durationMin}–${option.durationMax}s`,
    option.resolutions.join(', '),
    option.aspectRatios.join(', '),
    option.audio ? labels.enabled : labels.disabled,
    String(option.maxImages),
  ];
}

function specLabels(labels: ModelDetailPageData['content']['specs']['labels']) {
  return [
    labels.modality,
    labels.duration,
    labels.resolutions,
    labels.aspectRatios,
    labels.audio,
    labels.referenceImages,
  ];
}

export function ModelDetail({
  page,
  readiness,
}: {
  page: ModelDetailPageData;
  readiness: DeploymentReadiness;
}) {
  const definition = modelCatalog.find(
    (entry) => entry.entityId === page.entityId
  );
  if (!definition)
    throw new Error(`Model definition missing: ${page.entityId}`);
  const preset = useMemo(() => generationPresetFor(definition), [definition]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const entry = useGenerationEntry({
    entryContext: {
      kind: 'model',
      entityId: page.entityId,
      locale: page.locale,
    },
    preset,
  });
  const related: CatalogDetailRelatedItem[] = page.related.map((item) => ({
    ...item,
    actionLabel: m['models.directory.view_model'](),
  }));
  const comparisonDefinitions = [
    definition,
    ...page.content.comparison.relatedModelIds.flatMap((entityId) => {
      const model = modelCatalog.find((entry) => entry.entityId === entityId);
      return model && model.modality === definition.modality ? [model] : [];
    }),
  ];
  const labels = specLabels(page.content.specs.labels);
  const comparisonValues = comparisonDefinitions.map((model) =>
    specValues(model, page.content.specs.labels)
  );
  const specs: CatalogModelSpec[] = labels.map((label, index) => ({
    label,
    value: comparisonValues[0]![index]!,
  }));
  const comparisonRows: CatalogModelComparisonRow[] = labels.map(
    (label, index) => ({
      label,
      values: comparisonValues.map((values) => values[index]!),
    })
  );
  const comparisonNames = comparisonDefinitions.map((model) =>
    model.modality === 'image'
      ? imageModelOptionFor(model.runtimeModelKey)!.label
      : modelOptionFor(model.runtimeModelKey)!.label
  );

  function usePrompt(prompt: string) {
    entry.setValue(prompt);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  return (
    <CatalogDetailShell
      directoryTitle={page.content.directory.title}
      directoryHref="/models"
      hero={page.content.hero}
      availabilityLabel={availabilityLabel(page.availability)}
      breadcrumbHomeLabel={m['models.breadcrumb.home']()}
      breadcrumbDirectoryLabel={m['models.breadcrumb.models']()}
      relatedTitle={m['models.related.title']()}
      relatedItems={related}
      faq={page.content.faq}
      cta={page.content.cta}
      workbench={
        <section aria-labelledby="model-workbench-title">
          <h2 id="model-workbench-title" className="sr-only">
            {page.content.workbench.title}
          </h2>
          <p className="sr-only">{page.content.workbench.description}</p>
          <GenerationWorkbench
            textareaRef={textareaRef}
            presentation="tool"
            inputModeLabels={{
              prompt: m['models.workbench.prompt'](),
              reference: m['models.workbench.reference'](),
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
        </section>
      }
    >
      <CatalogModelSpecs
        title={page.content.specs.title}
        description={page.content.specs.description}
        items={specs}
      />
      <CatalogFeatureGrid {...page.content.capabilities} />
      <CatalogSteps {...page.content.workflows} />
      <CatalogMediaCarousel
        title={page.content.examples.title}
        description={`${page.content.examples.description} ${page.content.examples.disclosure}`}
        items={page.content.examples.items}
        labels={page.content.examples.labels}
        onUsePrompt={(item) => usePrompt(item.prompt)}
      />
      <CatalogFeatureGrid {...page.content.promptGuide} />
      <CatalogMediaFeatureList
        title={page.content.useCases.title}
        description={page.content.useCases.description}
        variant="banded"
        items={page.content.useCases.items.map((item, index) => ({
          ...item,
          mediaPosition:
            item.mediaPosition ?? (index % 2 === 0 ? 'right' : 'left'),
        }))}
      />
      <CatalogModelComparison
        title={page.content.comparison.title}
        description={page.content.comparison.description}
        modelLabel={page.content.comparison.modelLabel}
        models={comparisonNames}
        rows={comparisonRows}
      />
      <CatalogLimitations {...page.content.limitations} />
    </CatalogDetailShell>
  );
}
