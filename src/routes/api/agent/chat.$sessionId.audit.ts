import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  findChatOwnerId,
  getChatForAdmin,
  getChatWithMessages,
} from '@/modules/chats/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

type Ctx = { request: Request; params: { sessionId: string } };

/** Owner/admin-only execution identity. Prompt and message bodies stay out. */
export async function GET({ request, params }: Ctx) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized', { status: 401 });

  const ownerId = await findChatOwnerId(params.sessionId);
  if (!ownerId) return respErr('Chat not found', { status: 404 });

  const isOwner = ownerId === session.user.id;
  if (!isOwner && !(await hasPermission(session.user.id, 'admin.*'))) {
    return respErr('Chat not found', { status: 404 });
  }

  const detail = isOwner
    ? await getChatWithMessages(params.sessionId, session.user.id)
    : await getChatForAdmin(params.sessionId);
  if (!detail) return respErr('Chat not found', { status: 404 });

  return respData(
    {
      chatId: detail.chat.id,
      messages: detail.messages.flatMap((message) =>
        message.metadata
          ? [{ messageId: message.id, role: message.role, ...message.metadata }]
          : []
      ),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

export const Route = createFileRoute('/api/agent/chat/$sessionId/audit')({
  server: { handlers: { GET } },
});
