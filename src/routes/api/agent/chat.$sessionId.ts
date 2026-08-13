import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  assistantLongRunningToolNames,
  completeInterruptedMediaCalls,
} from '@/modules/agent/history';
import { getActiveTurnLease } from '@/modules/agent/turn-lease';
import { getActiveTasksForSession } from '@/modules/ai-tasks/service';
import {
  deleteChat,
  getChatWithMessages,
  renameChat,
} from '@/modules/chats/service';
import { respData, respErr, respOk } from '@/lib/resp';

type Ctx = { request: Request; params: { sessionId: string } };

async function requireUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET({ request, params }: Ctx) {
  const user = await requireUser(request);
  if (!user) return respErr('Unauthorized');

  const [detail, activeTasks, activeLease] = await Promise.all([
    getChatWithMessages(params.sessionId, user.id),
    getActiveTasksForSession({
      userId: user.id,
      sessionId: params.sessionId,
    }),
    getActiveTurnLease(params.sessionId),
  ]);
  const hasActiveRun =
    activeTasks.length > 0 || activeLease?.userId === user.id;
  if (!detail) {
    // Fresh session that hasn't been persisted yet — let the UI start blank.
    return respData({
      chat: null,
      messages: [],
      run: { active: hasActiveRun },
    });
  }

  const longRunningTools = assistantLongRunningToolNames(detail.messages);

  return respData({
    chat: {
      id: detail.chat.id,
      title: detail.chat.title,
      updatedAt: detail.chat.updatedAt.toISOString(),
    },
    messages: detail.messages.map((m, index) => ({
      id: m.id,
      role: m.role,
      parts: completeInterruptedMediaCalls(
        m.parts,
        hasActiveRun,
        longRunningTools.get(index)
      ),
      createdAt: m.createdAt.toISOString(),
    })),
    run: { active: hasActiveRun },
  });
}

async function PATCH({ request, params }: Ctx) {
  const user = await requireUser(request);
  if (!user) return respErr('Unauthorized');

  let body: { title?: string };
  try {
    body = (await request.json()) as { title?: string };
  } catch {
    return respErr('Invalid JSON');
  }
  const title = (body?.title ?? '').trim();
  if (!title) return respErr('title is required');

  await renameChat(params.sessionId, user.id, title);
  return respOk();
}

async function DELETE({ request, params }: Ctx) {
  const user = await requireUser(request);
  if (!user) return respErr('Unauthorized');

  await deleteChat(params.sessionId, user.id);
  return respOk();
}

export const Route = createFileRoute('/api/agent/chat/$sessionId')({
  server: { handlers: { GET, PATCH, DELETE } },
});
