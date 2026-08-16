import { deriveDeploymentReadiness } from '@/config/catalog/readiness';
import { catalog } from '@/config/catalog/registry';
import type {
  CatalogDefinition,
  DeploymentReadiness,
} from '@/config/catalog/types';
import { getAllConfigs } from '@/modules/config/service';
import { isStorageConfigured } from '@/modules/storage/service';
import {
  DEFAULT_IMAGE_MODEL,
  imageModelOptionFor,
  modelOptionFor,
} from '@/lib/agent-settings';

import {
  hasConfiguredImageProvider,
  pickImageProvider,
} from './image-provider';
import { isAgentConfigured } from './service';
import { pickVideoProvider } from './tools';

/**
 * Server-only deployment snapshot for the first image-tool slice. It returns
 * public booleans/reasons only; provider ids, routes, and credentials stay on
 * the server.
 */
export async function getImageToolDeploymentReadiness(
  entityId: string
): Promise<DeploymentReadiness> {
  const definition = (catalog as readonly CatalogDefinition[]).find(
    (entry) => entry.kind === 'tool' && entry.entityId === entityId
  );
  if (
    !definition ||
    definition.kind !== 'tool' ||
    definition.publication === 'hidden' ||
    definition.execution.mediaMode !== 'image'
  ) {
    return { executable: false, reason: 'model-route-unavailable' };
  }

  const [configs, agentConfigured, storageConfigured] = await Promise.all([
    getAllConfigs(),
    isAgentConfigured(),
    isStorageConfigured(),
  ]);
  const providerConfigured =
    agentConfigured && hasConfiguredImageProvider(configs);
  const modelRouteAvailable =
    Boolean(imageModelOptionFor(DEFAULT_IMAGE_MODEL)) &&
    pickImageProvider(configs, DEFAULT_IMAGE_MODEL, 'generate') !== null;

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
  const animateRoute = option?.maxImages
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
