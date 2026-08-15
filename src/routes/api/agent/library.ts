import { createFileRoute } from '@tanstack/react-router';

import { createAgentMediaReceipt } from '@/core/agent/media-receipt';
import { getAuth } from '@/core/auth';
import { collectAllowedMediaAttachments } from '@/modules/agent/history';
import {
  getChatWithMessages,
  listGeneratedImages,
} from '@/modules/chats/service';
import { isAgentSessionId } from '@/lib/agent';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized');

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get('limit'));
  const page = await listGeneratedImages(session.user.id, {
    limit:
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
  });

  return respData({
    nextCursor: page.nextCursor,
    images: page.items.map((image) => ({
      id: image.id,
      src: image.src,
      name: image.name,
      alt: image.alt,
      mediaType: image.mediaType,
      chatId: image.chatId,
      sourceMessageId: image.sourceMessageId,
      chatTitle: image.chatTitle,
      createdAt: image.createdAt.toISOString(),
      model: image.model,
    })),
  });
}

export async function POST({ request }: { request: Request }) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return respErr('Unauthorized');

  let body: {
    targetChatId?: unknown;
    sourceChatId?: unknown;
    sourceMessageId?: unknown;
    mediaType?: unknown;
    url?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return respErr('Invalid JSON', { status: 400 });
  }

  if (
    !isAgentSessionId(String(body.targetChatId ?? '')) ||
    !isAgentSessionId(String(body.sourceChatId ?? '')) ||
    typeof body.sourceMessageId !== 'string' ||
    (body.mediaType !== 'image' && body.mediaType !== 'video') ||
    typeof body.url !== 'string' ||
    !/^https?:\/\//i.test(body.url)
  ) {
    return respErr('Invalid library media source', { status: 400 });
  }

  const chat = await getChatWithMessages(
    String(body.sourceChatId),
    session.user.id
  );
  if (!chat) return respErr('Library media not found', { status: 404 });
  const source = chat.messages.find(
    (message) => message.id === body.sourceMessageId
  );
  if (!source || !sourceMessageHasFile(source.parts, body.url)) {
    return respErr('Library media not found', { status: 404 });
  }
  const allowed = collectAllowedMediaAttachments(chat.messages).some(
    (media) => media.mediaType === body.mediaType && media.url === body.url
  );
  if (!allowed) return respErr('Library media not found', { status: 404 });

  try {
    return respData({
      url: body.url,
      mediaType: body.mediaType,
      receipt: await createAgentMediaReceipt({
        userId: session.user.id,
        chatId: String(body.targetChatId),
        mediaType: body.mediaType,
        url: body.url,
      }),
    });
  } catch (error) {
    console.error('library media receipt failed:', error);
    return respErr('Library media could not be authorized', { status: 503 });
  }
}

function sourceMessageHasFile(
  parts: { type: string; result?: string }[],
  url: string
) {
  for (const part of parts) {
    if (part.type !== 'tool_call' || !part.result) continue;
    try {
      const payload = JSON.parse(part.result) as { files?: unknown };
      if (Array.isArray(payload.files) && payload.files.includes(url)) {
        return true;
      }
    } catch {
      // Ignore malformed legacy tool results.
    }
  }
  return false;
}

export const Route = createFileRoute('/api/agent/library')({
  server: { handlers: { GET, POST } },
});
