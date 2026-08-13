import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { cancelGenerationsForSession } from '@/modules/agent/tools';
import {
  acquireTurnLease,
  getActiveTurnLease,
  releaseTurnLease,
  requestTurnCancellation,
} from '@/modules/agent/turn-lease';
import { cancelPendingToolCalls, findChat } from '@/modules/chats/service';
import { isAgentSessionId } from '@/lib/agent';
import { respData, respErr } from '@/lib/resp';

type Ctx = { request: Request; params: { sessionId: string } };

export async function POST({ request, params }: Ctx) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized');
  if (!isAgentSessionId(params.sessionId)) {
    return respErr('invalid sessionId');
  }

  const ownedChat = await findChat(params.sessionId, session.user.id);
  if (!ownedChat) return respErr('Chat not found');

  const activeLease = await getActiveTurnLease(params.sessionId);
  const ownedActiveLease =
    activeLease?.userId === session.user.id ? activeLease : undefined;

  if (activeLease && !ownedActiveLease) return respErr('Chat not found');

  let turnId: string | undefined;
  let cleanupLeaseOwner:
    | { chatId: string; userId: string; turnId: string }
    | undefined;
  if (ownedActiveLease) {
    const requested = await requestTurnCancellation({
      chatId: params.sessionId,
      userId: session.user.id,
      turnId: ownedActiveLease.turnId,
    });
    if (!requested) {
      // The lease changed between the primary read and the compare-and-set.
      // Do not let Stop from an old Turn affect its successor.
      return respData({ canceled: 0, upstreamCanceled: 0, toolCalls: 0 });
    }
    turnId = ownedActiveLease.turnId;
  } else {
    cleanupLeaseOwner = {
      chatId: params.sessionId,
      userId: session.user.id,
      turnId: `stop-${crypto.randomUUID()}`,
    };
    if (!(await acquireTurnLease(cleanupLeaseOwner))) {
      return respData({ canceled: 0, upstreamCanceled: 0, toolCalls: 0 });
    }
  }

  try {
    const [tasks, toolCalls] = await Promise.all([
      cancelGenerationsForSession({
        userId: session.user.id,
        sessionId: params.sessionId,
        ...(turnId ? { turnId } : {}),
      }),
      cancelPendingToolCalls(params.sessionId, session.user.id, turnId),
    ]);

    return respData({ ...tasks, toolCalls });
  } finally {
    if (cleanupLeaseOwner) {
      await releaseTurnLease(cleanupLeaseOwner).catch((error) => {
        console.error('[agent stop] failed to release cleanup lease', error);
      });
    }
  }
}

export const Route = createFileRoute('/api/agent/chat/$sessionId/stop')({
  server: { handlers: { POST } },
});
