import { deriveDeploymentReadiness } from '@/config/catalog/readiness';
import { catalog } from '@/config/catalog/registry';
import type {
  CatalogDefinition,
  DeploymentReadiness,
} from '@/config/catalog/types';
import { getAllConfigs } from '@/modules/config/service';
import { isStorageConfigured } from '@/modules/storage/service';
import { DEFAULT_IMAGE_MODEL, imageModelOptionFor } from '@/lib/agent-settings';

import {
  hasConfiguredImageProvider,
  pickImageProvider,
} from './image-provider';
import { isAgentConfigured } from './service';

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
