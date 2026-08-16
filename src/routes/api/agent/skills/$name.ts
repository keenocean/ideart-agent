import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  getPromptSkill,
  SkillRegistryUnavailableError,
} from '@/modules/agent/skills';
import { respData, respErr } from '@/lib/resp';

export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { name: string };
}) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized', { status: 401 });

  try {
    const skill = await getPromptSkill(params.name);
    if (!skill) return respErr('Skill not found', { status: 404 });
    return respData({
      name: skill.name,
      title: skill.title,
      summary: skill.summary,
      instructions: skill.instructions,
      referencePaths: Object.keys(skill.references).sort(),
    });
  } catch (error) {
    console.error('Failed to load agent skill', error);
    return respErr(
      error instanceof SkillRegistryUnavailableError
        ? 'Skill registry unavailable'
        : 'Invalid skill release',
      { status: 503 }
    );
  }
}

export const Route = createFileRoute('/api/agent/skills/$name')({
  server: { handlers: { GET } },
});
