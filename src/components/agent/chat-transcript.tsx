import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  ImageIcon,
  Loader2,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wand2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import {
  splitAttachedImages,
  type Message,
  type ToolCall,
  type ToolGroupMessage,
} from '@/lib/agent-chat';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { usePreviewPane } from '@/components/agent/preview-pane-context';

/**
 * The chat transcript — message bubbles, tool activity rows and generated
 * images. Shared by the live session page and the admin-only /share view, so
 * both render a conversation identically.
 */
export interface InlineImage {
  alt: string;
  src: string;
}

function splitDataImages(
  s: string
): Array<
  { type: 'text'; text: string } | { type: 'image'; alt: string; src: string }
> {
  const out: Array<
    { type: 'text'; text: string } | { type: 'image'; alt: string; src: string }
  > = [];
  const headerRe =
    /!\[([^\]]*?)\]\s*\(\s*<?\s*(data:image\/[a-z0-9.+-]+;base64,)/gi;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = headerRe.exec(s)) !== null) {
    const alt = match[1];
    const dataPrefix = match[2];
    let cursor = match.index + match[0].length;
    while (cursor < s.length && /[A-Za-z0-9+/=\s]/.test(s[cursor])) cursor++;
    const rawBody = s.slice(match.index + match[0].length, cursor);
    const body = rawBody.replace(/\s+/g, '');
    if (!body) continue;
    const src = dataPrefix + body;
    let after = cursor;
    while (after < s.length && /[\s>]/.test(s[after])) after++;
    if (s[after] === ')') after++;
    if (match.index > lastIdx) {
      out.push({ type: 'text', text: s.slice(lastIdx, match.index) });
    }
    out.push({ type: 'image', alt, src });
    lastIdx = after;
    headerRe.lastIndex = after;
  }
  if (lastIdx < s.length) out.push({ type: 'text', text: s.slice(lastIdx) });
  return out;
}

// Image extensions our renderer treats as displayable.
const IMAGE_EXT_RE = /\.(?:png|jpe?g|gif|webp|svg)\b/i;

// Extract image file references from a tool-result payload. The
// generate_image tool returns `{"files":["/workspace/img_xxx.png"], ...}`
// as JSON; the agent's text reply may not re-embed the file as `![](...)`,
// so the chat would otherwise show no picture. We scan the raw result for
// `/workspace/<name>.<ext>` and the already-rewritten
// `/api/imgany/files/<name>.<ext>` form, dedupe, and surface them as
// attached images on the next agent bubble.
function extractToolResultFiles(
  result: string,
  sessionId: string
): InlineImage[] {
  const seen = new Set<string>();
  const imgs: InlineImage[] = [];

  try {
    const payload = JSON.parse(result);
    let foundJsonFiles = false;
    if (Array.isArray(payload?.files)) {
      for (const file of payload.files) {
        if (typeof file !== 'string' || !isDisplayableImageUrl(file)) continue;
        const src = normalizeAgentFileUrl(file, sessionId);
        if (seen.has(src)) continue;
        seen.add(src);
        imgs.push({ alt: file.split('/').pop() || '', src });
        foundJsonFiles = true;
      }
    }
    if (foundJsonFiles) return imgs;

    if (Array.isArray(payload?.workspace_files)) {
      for (const file of payload.workspace_files) {
        if (typeof file !== 'string' || !isDisplayableImageUrl(file)) continue;
        const src = normalizeAgentFileUrl(file, sessionId);
        if (seen.has(src)) continue;
        seen.add(src);
        imgs.push({ alt: file.split('/').pop() || '', src });
      }
      if (imgs.length > 0) return imgs;
    }
  } catch {
    // Fall back to regex scanning below.
  }

  const re =
    /(?:\/workspace\/|\/api\/imgany\/files\/(?:sessions\/[^/\s]+\/)?)([^\s"'<>)\\]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(result)) !== null) {
    const rel = match[1];
    if (!IMAGE_EXT_RE.test(rel)) continue;
    const src = agentFileUrl(`sessions/${sessionId}/${rel}`);
    if (seen.has(src)) continue;
    seen.add(src);
    imgs.push({ alt: rel.split('/').pop() || '', src });
  }
  return imgs;
}

function isDisplayableImageUrl(url: string) {
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('/workspace/')) return true;
  if (url.startsWith('/api/imgany/')) return true;
  if (/^https?:\/\//i.test(url)) return IMAGE_EXT_RE.test(url);
  return IMAGE_EXT_RE.test(url);
}

// react-markdown's defaultUrlTransform drops `data:` URLs. Allow image
// data URLs through so any markdown image we didn't already extract via
// splitDataImages can still render.
function agentUrlTransform(url: string, key: string): string {
  if (key === 'src' && url.startsWith('data:image/')) return url;
  return defaultUrlTransform(url);
}

/**
 * Images in a conversation: what the user uploaded, plus what the tools
 * produced — the latter belong on the *next* agent reply so they read as part
 * of the assistant's answer.
 * `surfacedSrcs` lets that bubble suppress duplicate inline copies the model
 * may have re-embedded; `previewImages` feeds the preview pane.
 */
export function useTranscriptImages(messages: Message[], sessionId: string) {
  return useMemo(() => {
    const attached = new Map<string, InlineImage[]>();
    const surfaced = new Set<string>();
    const preview = new Map<string, InlineImage>();
    let pending: InlineImage[] = [];
    for (const msg of messages) {
      // What the user sent counts too — the strip in the preview pane is the
      // whole conversation's images in the order they appeared.
      if (msg.role === 'user') {
        for (const src of splitAttachedImages(msg.content).images) {
          if (!preview.has(src)) preview.set(src, { alt: '', src });
        }
        continue;
      }
      if (msg.role === 'tool-group') {
        for (const tc of msg.tools) {
          if (!tc.result) continue;
          for (const p of splitDataImages(tc.result)) {
            if (p.type === 'image') pending.push({ alt: p.alt, src: p.src });
          }
          for (const img of extractToolResultFiles(tc.result, sessionId)) {
            pending.push(img);
          }
        }
        continue;
      }
      if (msg.role === 'agent' && pending.length > 0) {
        attached.set(msg.id, pending);
        for (const img of pending) {
          const src = versionAgentFileUrl(img.src, sessionId);
          surfaced.add(src);
          preview.set(src, { ...img, src });
        }
        pending = [];
      }
    }
    return {
      attachedImages: attached,
      surfacedSrcs: surfaced,
      previewImages: Array.from(preview.values()).map((img) => ({
        ...img,
        alt: img.alt || imageNameFromUrl(img.src),
      })),
    };
  }, [messages, sessionId]);
}

export function ChatTranscript({
  messages,
  streaming,
  sessionId,
  attachedImages,
  surfacedSrcs,
}: {
  messages: Message[];
  streaming?: boolean;
  sessionId: string;
  attachedImages: Map<string, InlineImage[]>;
  surfacedSrcs: Set<string>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-3">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center pt-10 text-center">
          <p className="text-muted-foreground text-sm">
            {m['agent.chat.empty']()}
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBlock
            key={msg.id}
            message={msg}
            attachedImages={attachedImages.get(msg.id)}
            surfacedSrcs={surfacedSrcs}
            sessionId={sessionId}
          />
        ))
      )}
      {streaming && (
        <p className="text-muted-foreground text-xs">
          {m['agent.chat.thinking']()}
        </p>
      )}
    </div>
  );
}

function MessageBlock({
  message,
  attachedImages,
  surfacedSrcs,
  sessionId,
}: {
  message: Message;
  attachedImages?: InlineImage[];
  surfacedSrcs: Set<string>;
  sessionId: string;
}) {
  if (message.role === 'user') return <UserBubble content={message.content} />;
  if (message.role === 'tool-group') {
    return (
      <ToolGroupBlock
        msg={message}
        surfacedSrcs={surfacedSrcs}
        sessionId={sessionId}
      />
    );
  }
  return (
    <AgentBubble
      content={message.content}
      attachedImages={attachedImages}
      surfacedSrcs={surfacedSrcs}
      sessionId={sessionId}
    />
  );
}

function UserBubble({ content }: { content: string }) {
  const { openImage } = usePreviewPane();
  const { text, images } = useMemo(
    () => splitAttachedImages(content),
    [content]
  );
  return (
    <div className="flex min-w-0 flex-col items-end gap-1.5 overflow-hidden">
      {images.length > 0 && (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => openImage({ src, alt: `image ${i + 1}` })}
              className="border-border bg-background overflow-hidden rounded-md border"
            >
              <img
                src={src}
                alt={`image ${i + 1}`}
                loading="lazy"
                className="max-h-40 w-auto max-w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
      {text && (
        <div className="bg-accent text-accent-foreground max-w-[85%] min-w-0 overflow-hidden rounded-lg rounded-br-sm px-3 py-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  );
}

function AgentBubble({
  content,
  attachedImages,
  surfacedSrcs,
  sessionId,
}: {
  content: string;
  attachedImages?: InlineImage[];
  surfacedSrcs: Set<string>;
  sessionId: string;
}) {
  const hasAttached = !!attachedImages && attachedImages.length > 0;
  const withVersion = useCallback(
    (src: string) => versionAgentFileUrl(src, sessionId),
    [sessionId]
  );
  if (!content && !hasAttached) return null;
  return (
    <div className="flex min-w-0 justify-start overflow-hidden">
      <div className="max-w-full min-w-0 flex-1 overflow-hidden">
        {hasAttached && (
          <div className="mb-2 flex min-w-0 flex-wrap gap-2 overflow-hidden">
            {attachedImages!.map((img, i) => (
              <AgentImage
                key={i}
                src={withVersion(img.src)}
                alt={img.alt}
                loading="lazy"
                className="border-border max-h-60 w-auto max-w-full rounded-md border object-contain"
              />
            ))}
          </div>
        )}
        {content && (
          <MarkdownContent
            content={content}
            suppressInlineImages={hasAttached}
            surfacedSrcs={surfacedSrcs}
            sessionId={sessionId}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Turn a raw tool call into the one-line "activity" summary shown in the
 * transcript: an icon plus a human sentence ("Ran npm test", "Read logo.png").
 * Unknown tools fall back to the tool name and a flattened argument list.
 */
function toolPresentation(
  tc: ToolCall,
  running: boolean
): { icon: LucideIcon; label: string } {
  const args = (() => {
    try {
      const parsed = JSON.parse(tc.arguments);
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  })();
  const str = (...keys: string[]) => {
    for (const key of keys) {
      const value = args[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };
  const name = tc.name.toLowerCase();

  // Image tools are the slow ones, so their label tracks progress instead of
  // claiming the work is already done.
  if (name.includes('generate_image'))
    return {
      icon: Sparkles,
      label: running
        ? m['agent.chat.tool_generating_image']()
        : m['agent.chat.tool_generated_image'](),
    };
  if (name.includes('edit_image'))
    return {
      icon: Wand2,
      label: running
        ? m['agent.chat.tool_editing_image']()
        : m['agent.chat.tool_edited_image'](),
    };
  if (name.includes('bash') || name.includes('shell') || name.includes('exec'))
    return {
      icon: Terminal,
      label: m['agent.chat.tool_ran']({
        target: str('command', 'cmd', 'script') || tc.name,
      }),
    };
  if (name.includes('glob') || name.includes('grep') || name.includes('search'))
    return {
      icon: Search,
      label: m['agent.chat.tool_searched']({
        target: str('pattern', 'query', 'q', 'path') || tc.name,
      }),
    };
  if (name.includes('write') || name.includes('edit') || name.includes('patch'))
    return {
      icon: PenLine,
      label: m['agent.chat.tool_wrote']({
        target: str('path', 'file_path', 'filename') || tc.name,
      }),
    };
  if (name.includes('read') || name.includes('view') || name.includes('cat'))
    return {
      icon: FileText,
      label: m['agent.chat.tool_read']({
        target: str('path', 'file_path', 'filename') || tc.name,
      }),
    };
  if (name.includes('list') || name.includes('ls'))
    return {
      icon: FolderOpen,
      label: m['agent.chat.tool_listed']({
        target: str('path', 'dir', 'directory') || '.',
      }),
    };
  if (name.includes('image') || name.includes('photo'))
    return { icon: ImageIcon, label: tc.name };

  const rest = Object.values(args)
    .filter((v) => typeof v === 'string' || typeof v === 'number')
    .join(', ');
  return { icon: Wrench, label: rest ? `${tc.name} · ${rest}` : tc.name };
}

/**
 * Tool activity renders as quiet one-line rows in the transcript flow (no
 * card), each expandable to its raw input/output.
 */
function ToolGroupBlock({
  msg,
  surfacedSrcs,
  sessionId,
}: {
  msg: ToolGroupMessage;
  surfacedSrcs: Set<string>;
  sessionId: string;
}) {
  const [expandedTool, setExpandedTool] = useState<Record<string, boolean>>({});

  function toggleTool(id: string) {
    setExpandedTool((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex min-w-0 justify-start overflow-hidden">
      <div className="w-full min-w-0 space-y-1.5 overflow-hidden">
        {msg.content && (
          <div className="min-w-0 overflow-hidden">
            <MarkdownContent
              content={msg.content}
              surfacedSrcs={surfacedSrcs}
              sessionId={sessionId}
            />
          </div>
        )}

        {msg.tools.map((tc) => {
          const isExpanded = !!expandedTool[tc.id];
          const running = tc.result === undefined;
          const { icon: Icon, label } = toolPresentation(tc, running);
          return (
            <div key={tc.id} className="min-w-0">
              <button
                type="button"
                onClick={() => toggleTool(tc.id)}
                className="text-muted-foreground hover:text-foreground group flex w-full items-center gap-2 py-0.5 text-left text-sm"
              >
                {running ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                ) : (
                  <Icon className="size-4 shrink-0 opacity-70" />
                )}
                <span className="truncate">{label}</span>
                {tc.metadata?.sandbox && (
                  <span
                    title={m['agent.chat.sandbox_hint']()}
                    className="shrink-0 text-emerald-600 dark:text-emerald-400"
                  >
                    <ShieldCheck className="size-3.5" />
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
                )}
              </button>

              {isExpanded && (
                <div className="border-border mt-1 mb-2 ml-2 space-y-2 border-l pl-4">
                  <div>
                    <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                      {m['agent.chat.input']()}
                    </p>
                    <pre className="bg-muted/50 max-h-40 overflow-x-hidden rounded-lg p-2 font-mono text-xs break-all whitespace-pre-wrap">
                      {(() => {
                        try {
                          return JSON.stringify(
                            JSON.parse(tc.arguments),
                            null,
                            2
                          );
                        } catch {
                          return tc.arguments;
                        }
                      })()}
                    </pre>
                  </div>
                  {tc.result != null ? (
                    <div>
                      <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                        {m['agent.chat.output']()}
                      </p>
                      <pre className="bg-muted/50 max-h-60 overflow-x-hidden rounded-lg p-2 font-mono text-xs break-all whitespace-pre-wrap">
                        {tc.result.length > 2000
                          ? tc.result.slice(0, 2000) + '…'
                          : tc.result}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground/70 text-xs italic">
                      {m['agent.chat.executing']()}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarkdownContent({
  content,
  suppressInlineImages = false,
  surfacedSrcs,
  sessionId,
}: {
  content: string;
  suppressInlineImages?: boolean;
  surfacedSrcs?: Set<string>;
  sessionId: string;
}) {
  // Pull `data:image` markdown out before passing to ReactMarkdown — long
  // base64 bodies and stray newlines around `]/(` regularly trip up the
  // parser, and we already render them as native <img>.
  const parts = useMemo(() => splitDataImages(content), [content]);
  const rewriteUrl = useCallback(
    (url: string) => {
      const rewritten = (() => {
        if (!url.startsWith('/workspace/')) return url;
        const name = url.replace(/^\/workspace\//, '');
        return agentFileUrl(`sessions/${sessionId}/${name}`);
      })();
      return versionAgentFileUrl(rewritten, sessionId);
    },
    [sessionId]
  );

  return (
    <div className="text-foreground min-w-0 space-y-3 overflow-hidden text-sm leading-relaxed break-words [&_p]:m-0 [&_p+p]:mt-3">
      {parts.map((p, i) => {
        if (p.type === 'image') {
          const src = rewriteUrl(p.src);
          if (suppressInlineImages) return null;
          if (surfacedSrcs?.has(src)) return null;
          return (
            <AgentImage
              key={i}
              src={src}
              alt={p.alt}
              loading="lazy"
              className="border-border my-2 max-h-60 w-auto max-w-full rounded-md border object-contain"
            />
          );
        }
        if (!p.text) return null;
        return (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            urlTransform={(url, key) => agentUrlTransform(rewriteUrl(url), key)}
            components={{
              img: ({ src, alt }) => {
                const url = rewriteUrl(src as string);
                // Already surfaced as an attached image on this bubble
                // (or a sibling) — don't render a duplicate inline.
                if (surfacedSrcs?.has(url)) return null;
                if (suppressInlineImages) return null;
                return (
                  <AgentImage
                    src={url}
                    alt={alt || ''}
                    loading="lazy"
                    className={cn(
                      'border-border my-2 max-h-60 w-auto max-w-full rounded-md border object-contain'
                    )}
                  />
                );
              },
              a: ({ href, children }) => (
                <a
                  href={href as string}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]">
                  {children}
                </code>
              ),
            }}
          >
            {p.text}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}

function AgentImage({
  src,
  alt,
  className,
  loading,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const { openImage } = usePreviewPane();
  const shouldProxy = src.startsWith('/api/imgany/');

  useEffect(() => {
    if (!shouldProxy) return;
    let active = true;
    let nextObjectUrl: string | null = null;
    setObjectUrl(null);
    setFailed(false);

    fetch(src, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Image request failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [shouldProxy, src]);

  if (shouldProxy && !objectUrl) {
    return (
      <div
        className={cn(
          'border-border bg-background/60 text-muted-foreground flex min-h-24 max-w-full items-center justify-center rounded-md border px-3 py-2 text-xs',
          className
        )}
      >
        {failed ? alt || 'Image failed to load' : alt || 'Loading image'}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        openImage({
          src,
          alt,
          name: imageNameFromUrl(src) || alt,
        })
      }
      className="group relative block max-w-full cursor-zoom-in overflow-hidden rounded-md text-left"
      title={m['agent.preview.open_image']()}
    >
      <img
        src={objectUrl ?? src}
        alt={alt}
        loading={loading}
        className={className}
      />
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
        {m['agent.preview.open_image']()}
      </span>
    </button>
  );
}

export function imageNameFromUrl(src: string) {
  try {
    const url = new URL(src, window.location.origin);
    const path = url.searchParams.get('path') || url.pathname;
    return decodeURIComponent(path.split('/').filter(Boolean).pop() || '');
  } catch {
    return (
      src
        .split('/')
        .filter(Boolean)
        .pop()
        ?.replace(/[?#].*$/, '') || ''
    );
  }
}

export function versionAgentFileUrl(src: string, sessionId: string) {
  const fileUrl = normalizeAgentFileUrl(src, sessionId);
  if (!fileUrl.startsWith('/api/imgany/file?')) return fileUrl;
  const sep = fileUrl.includes('?') ? '&' : '?';
  return `${fileUrl}${sep}v=${encodeURIComponent(sessionId)}`;
}

export function stripUrlParam(src: string, key: string) {
  try {
    const url = new URL(src, 'https://pixagent.local');
    url.searchParams.delete(key);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return src.startsWith('http') ? url.toString() : path;
  } catch {
    return src;
  }
}

function normalizeAgentFileUrl(src: string, sessionId: string) {
  if (src.startsWith('/workspace/')) {
    return agentFileUrl(
      `sessions/${sessionId}/${src.replace(/^\/workspace\//, '')}`
    );
  }
  if (src.startsWith('/api/imgany/files/')) {
    const rawPath = src
      .slice('/api/imgany/files/'.length)
      .replace(/[?#].*$/, '');
    const path = rawPath.startsWith('sessions/')
      ? rawPath
      : `sessions/${sessionId}/${rawPath}`;
    return agentFileUrl(path);
  }
  return src;
}

function agentFileUrl(path: string) {
  return `/api/imgany/file?path=${encodeURIComponent(path)}`;
}
