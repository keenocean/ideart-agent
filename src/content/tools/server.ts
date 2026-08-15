import { createServerFn } from '@tanstack/react-start';

export const getImageToolReadinessFn = createServerFn()
  .inputValidator((data: { entityId: string }) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.entityId)) {
      throw new Error('Invalid tool entity id');
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { getImageToolDeploymentReadiness } =
      await import('@/modules/agent/readiness');
    return getImageToolDeploymentReadiness(data.entityId);
  });
