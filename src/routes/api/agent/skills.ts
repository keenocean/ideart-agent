import { createFileRoute } from '@tanstack/react-router';

import {
  listPromptSkills,
  SkillRegistryUnavailableError,
} from '@/modules/agent/skills';
import { respData, respErr } from '@/lib/resp';

async function GET() {
  try {
    return respData({ items: await listPromptSkills() });
  } catch (error) {
    console.error('Failed to list agent skills', error);
    return respErr(
      error instanceof SkillRegistryUnavailableError
        ? 'Skill registry unavailable'
        : 'Invalid skill release',
      { status: 503 }
    );
  }
}

export const Route = createFileRoute('/api/agent/skills')({
  server: { handlers: { GET } },
});
