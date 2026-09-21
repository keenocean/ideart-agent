import {
  normalizeMarketingPublicDomain,
  R2Provider,
  StorageManager,
} from '@/core/storage';
import { getAllConfigs, type ConfigMap } from '@/modules/config/service';

/**
 * Storage config is DB-driven (like auth/payment/email): values come from the
 * admin "Storage" settings, merged over env via getAllConfigs(). Keys mirror the
 * original ShipAny Two (`r2_*`).
 */
function isConfigured(configs: ConfigMap): boolean {
  return Boolean(
    configs.r2_access_key && configs.r2_secret_key && configs.r2_bucket_name
  );
}

function buildManager(
  configs: ConfigMap,
  publicDomain = configs.r2_domain
): StorageManager {
  const manager = new StorageManager();
  manager.addProvider(
    new R2Provider({
      accountId: configs.r2_account_id || '',
      accessKeyId: configs.r2_access_key as string,
      secretAccessKey: configs.r2_secret_key as string,
      bucket: configs.r2_bucket_name as string,
      uploadPath: configs.r2_upload_path,
      region: 'auto',
      endpoint: configs.r2_endpoint, // optional custom endpoint
      publicDomain,
    }),
    true
  );
  return manager;
}

export async function isStorageConfigured(): Promise<boolean> {
  return isConfigured(await getAllConfigs());
}

/**
 * Returns a configured StorageManager, or null when storage is not configured
 * (caller should fall back to local/inline handling).
 */
export async function getStorage(): Promise<StorageManager | null> {
  const configs = await getAllConfigs();
  if (!isConfigured(configs)) return null;
  return buildManager(configs);
}

/**
 * Credentials reach this process from three independent places, and a miss in
 * one says nothing about the others. An empty local config table is the normal
 * state of a fresh clone; it is NOT evidence that the project has no R2. Say so
 * in the error, because the failure mode this replaced was a caller checking
 * `.env` plus the local database, finding neither, and concluding the bucket
 * did not exist while published objects were sitting in it.
 */
function missingMarketingStorageMessage(
  configs: ConfigMap,
  extra: readonly string[] = []
): string {
  const required = ['r2_access_key', 'r2_secret_key', 'r2_bucket_name'];
  const missing = [...required.filter((key) => !configs[key]), ...extra];
  return [
    `R2 is not configured for marketing asset publication. Missing: ${missing.join(', ')}.`,
    'These resolve as { ...envConfigs, ...dbConfigs } \u2014 database wins, env is the fallback. Provide them from any one of:',
    '  1. env (what CLI scripts use, since they have no admin session): R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET_NAME, plus R2_ACCOUNT_ID or R2_ENDPOINT, and R2_DOMAIN for public URLs.',
    '     Also check R2_UPLOAD_PATH: the provider prefixes every key with it and defaults to "uploads", while published marketing objects sit directly under "marketing/". Publishing with the default writes to a different prefix than the existing assets.',
    '  2. the admin panel at /admin/settings \u2192 Storage, which writes the same r2_* keys into the config table.',
    '  3. for one-off object operations against a bucket you can already reach, the authenticated Cloudflare CLI: `wrangler r2 object get|put <bucket>/<key> --remote`.',
    'An empty local config table does not mean the project has no R2 bucket \u2014 production credentials live outside this checkout. Check `wrangler r2 bucket list` before concluding anything is unconfigured.',
  ].join('\n');
}

export async function getMarketingStorage(): Promise<{
  storage: StorageManager;
  publicDomain: string;
}> {
  const configs = await getAllConfigs();
  if (!isConfigured(configs)) {
    throw new Error(missingMarketingStorageMessage(configs));
  }
  if (!configs.r2_account_id && !configs.r2_endpoint) {
    throw new Error(
      missingMarketingStorageMessage(configs, [
        'r2_account_id or r2_endpoint (one is required to reach the bucket)',
      ])
    );
  }
  const publicDomain = normalizeMarketingPublicDomain(
    configs.r2_domain?.trim() || ''
  );
  return { storage: buildManager(configs, publicDomain), publicDomain };
}
