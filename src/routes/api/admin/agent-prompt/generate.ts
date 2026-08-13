import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import {
  AgentPromptGenerationError,
  generateAgentSystemPrompt,
} from '@/modules/agent/prompt-generator';
import { hasPermission } from '@/modules/rbac/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

const inputSchema = z
  .object({
    targetRole: z.string().trim().min(1).max(160),
    primaryObjective: z.string().trim().min(1).max(1000),
    targetAudience: z.string().trim().max(500).optional(),
    domainExpertise: z.string().trim().max(1000).optional(),
    communicationStyle: z.string().trim().max(500).optional(),
    additionalRequirements: z.string().trim().max(2000).optional(),
  })
  .strict();

const noStore = {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  },
};

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

    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 5_000,
      keyPrefix: 'admin-agent-prompt',
      extraKey: session.user.id,
    });
    if (limited) return limited;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return respErr('Invalid JSON', { status: 400 });
    }

    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return respErr(issue?.message || 'Invalid prompt requirements', {
        status: 400,
      });
    }

    const generated = await generateAgentSystemPrompt(parsed.data);
    return respData(generated, noStore);
  } catch (error) {
    if (error instanceof AgentPromptGenerationError) {
      return respErr(error.message, { status: error.status });
    }
    console.error('[agent prompt] generation failed', error);
    return respErr('Prompt generation failed. Please try again.', {
      status: 500,
    });
  }
}

export const Route = createFileRoute('/api/admin/agent-prompt/generate')({
  server: {
    handlers: { POST },
  },
});
