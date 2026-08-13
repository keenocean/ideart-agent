import { createFileRoute } from '@tanstack/react-router';

import { validateAgentPromptOverride } from '@/core/agent/prompt-config';
import { getAuth } from '@/core/auth';
import {
  getAdminConfigs,
  getConfigLatest,
  saveConfigs,
} from '@/modules/config/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr, respOk } from '@/lib/resp';

const noStore = {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  },
};

const AGENT_SYSTEM_PROMPT_KEY = 'agent_system_prompt';

export async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });

    const isAdmin = await hasPermission(session.user.id, 'admin.settings.read');
    if (!isAdmin) return respErr('Forbidden', { status: 403 });

    // Masked + protected-keys-stripped view — never send raw configs to a client.
    const configs = await getAdminConfigs();
    configs[AGENT_SYSTEM_PROMPT_KEY] =
      (await getConfigLatest(AGENT_SYSTEM_PROMPT_KEY)) ?? '';
    return respData(configs, noStore);
  } catch (error: any) {
    return respErr(error.message || 'Internal error', { status: 500 });
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });

    const isAdmin = await hasPermission(
      session.user.id,
      'admin.settings.write'
    );
    if (!isAdmin) return respErr('Forbidden', { status: 403 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return respErr('Invalid JSON', { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return respErr('Invalid body', { status: 400 });
    }
    const entries = Object.entries(body as Record<string, unknown>);
    if (entries.some(([, value]) => typeof value !== 'string')) {
      return respErr('Every config value must be a string', { status: 400 });
    }
    const configs = Object.fromEntries(entries) as Record<string, string>;
    if (AGENT_SYSTEM_PROMPT_KEY in configs) {
      try {
        validateAgentPromptOverride(configs[AGENT_SYSTEM_PROMPT_KEY]);
      } catch (error: any) {
        return respErr(error.message || 'Invalid Agent System Prompt', {
          status: 400,
        });
      }
    }

    await saveConfigs(configs);
    return respOk(noStore);
  } catch (error: any) {
    return respErr(error.message || 'Internal error', { status: 500 });
  }
}

export const Route = createFileRoute('/api/admin/config')({
  server: {
    handlers: { GET, POST },
  },
});
