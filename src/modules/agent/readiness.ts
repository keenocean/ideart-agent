import { deriveDeploymentReadiness } from '@/config/catalog/readiness';
import { catalog } from '@/config/catalog/registry';
import type {
  CatalogDefinition,
  DeploymentReadiness,
} from '@/config/catalog/types';
import { getAllConfigs } from '@/modules/config/service';
import { isStorageConfigured } from '@/modules/storage/service';
import {
  AGENT_MODEL_OPTIONS,
  DEFAULT_IMAGE_MODEL,
  imageModelOptionFor,
  modelOptionFor,
  videoOperationSupported,
} from '@/lib/agent-settings';

import {
  hasConfiguredImageProvider,
  pickImageProvider,
} from './image-provider';
import { isAgentConfigured } from './service';
import { pickVideoProvider } from './tools';

/**
 * Server-only deployment snapshot for a semantic tool entry. It returns
 * public booleans/reasons only; provider ids, routes, and credentials stay on
 * the server. Video tools probe their Catalog operation instead of assuming
 * every public tool is an image generator.
 */
export async function getToolDeploymentReadiness(
  entityId: string
): Promise<DeploymentReadiness> {
  const definition = (catalog as readonly CatalogDefinition[]).find(
    (entry) => entry.kind === 'tool' && entry.entityId === entityId
  );
  if (
    !definition ||
    definition.kind !== 'tool' ||
    definition.publication === 'hidden'
  ) {
    return { executable: false, reason: 'model-route-unavailable' };
  }

  const [configs, agentConfigured, storageConfigured] = await Promise.all([
    getAllConfigs(),
    isAgentConfigured(),
    isStorageConfigured(),
  ]);
  let providerConfigured: boolean;
  let modelRouteAvailable: boolean;
  if (definition.execution.mediaMode === 'image') {
    providerConfigured = agentConfigured && hasConfiguredImageProvider(configs);
    modelRouteAvailable =
      Boolean(imageModelOptionFor(DEFAULT_IMAGE_MODEL)) &&
      pickImageProvider(configs, DEFAULT_IMAGE_MODEL, 'generate') !== null;
  } else {
    const operation = definition.execution.videoOperation;
    providerConfigured =
      agentConfigured &&
      Boolean(
        configs.evolink_api_key ||
        (configs.grouter_api_key && configs.grouter_base_url) ||
        configs.fal_api_key ||
        configs.replicate_api_token
      );
    modelRouteAvailable = AGENT_MODEL_OPTIONS.some(
      (option) =>
        videoOperationSupported(option.value, operation) &&
        pickVideoProvider(
          configs,
          option.value,
          operation,
          option.defaultResolution
        ) !== null
    );
  }

  return deriveDeploymentReadiness({
    providerConfigured,
    modelRouteAvailable,
    storageConfigured,
  });
}

/** Server-only readiness for a Catalog model page's locked workbench. */
export async function getModelDeploymentReadiness(
  entityId: string
): Promise<DeploymentReadiness> {
  const definition = (catalog as readonly CatalogDefinition[]).find(
    (entry) => entry.kind === 'model' && entry.entityId === entityId
  );
  if (
    !definition ||
    definition.kind !== 'model' ||
    definition.publication === 'hidden'
  ) {
    return { executable: false, reason: 'model-route-unavailable' };
  }

  const [configs, agentConfigured, storageConfigured] = await Promise.all([
    getAllConfigs(),
    isAgentConfigured(),
    isStorageConfigured(),
  ]);
  if (definition.modality === 'image') {
    const option = imageModelOptionFor(definition.runtimeModelKey);
    return deriveDeploymentReadiness({
      providerConfigured:
        agentConfigured && hasConfiguredImageProvider(configs),
      modelRouteAvailable:
        Boolean(option) &&
        pickImageProvider(configs, definition.runtimeModelKey, 'generate') !==
          null,
      storageConfigured,
    });
  }

  const option = modelOptionFor(definition.runtimeModelKey);
  const providerConfigured =
    agentConfigured &&
    Boolean(
      configs.evolink_api_key ||
      (configs.grouter_api_key && configs.grouter_base_url) ||
      configs.fal_api_key ||
      configs.replicate_api_token
    );
  const generateRoute = option
    ? pickVideoProvider(
        configs,
        definition.runtimeModelKey,
        'generate',
        option.defaultResolution
      )
    : null;
  const animateRoute =
    option && videoOperationSupported(definition.runtimeModelKey, 'animate')
      ? pickVideoProvider(
          configs,
          definition.runtimeModelKey,
          'animate',
          option.defaultResolution
        )
      : generateRoute;
  return deriveDeploymentReadiness({
    providerConfigured,
    modelRouteAvailable: Boolean(option && generateRoute && animateRoute),
    storageConfigured,
  });
}
