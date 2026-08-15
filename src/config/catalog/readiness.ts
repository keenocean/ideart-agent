import type { DeploymentReadiness } from './types';

export type DeploymentCapabilityProbe = {
  providerConfigured: boolean;
  modelRouteAvailable: boolean;
  storageConfigured: boolean;
};

// This projection is safe to serialize to the browser: it contains no
// provider ids, routes, credentials, bucket names, or internal configuration.
export function deriveDeploymentReadiness(
  probe: DeploymentCapabilityProbe
): DeploymentReadiness {
  if (!probe.providerConfigured) {
    return { executable: false, reason: 'provider-unconfigured' };
  }
  if (!probe.modelRouteAvailable) {
    return { executable: false, reason: 'model-route-unavailable' };
  }
  if (!probe.storageConfigured) {
    return { executable: false, reason: 'storage-unconfigured' };
  }
  return { executable: true };
}
