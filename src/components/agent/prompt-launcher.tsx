import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import {
  newAgentSessionId,
  newAttachmentId,
  uploadChatImage,
  type PendingAttachment,
} from '@/lib/agent';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { useComposerSettings } from '@/hooks/use-composer-settings';
import { ChatComposer } from '@/components/agent/chat-composer';
import {
  promptCategories,
  type PromptExample,
} from '@/components/agent/prompt-examples';

const VISIBLE_CATEGORIES = 5;
const DEFAULT_CATEGORY = 'style';
// Attachments added by an example carry this id prefix so switching examples
// can swap them out without touching the user's own uploads.
const EXAMPLE_PREFIX = 'example:';

/**
 * The "start a new chat" surface: headline, prompt composer (local upload +
 * paste, image thumbnails) and one-click example prompts. Shared by the
 * landing hero and the /chat home page — both mint a session id and hand the
 * first turn (prompt, model settings, uploaded images) to /chat/$sessionId
 * through sessionStorage.
 */
export function PromptLauncher({ className }: { className?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [composerSettings, setComposerSettings] = useComposerSettings();
  // Start on the first category so the examples are visible right away.
  const [categoryKey, setCategoryKey] = useState<string | null>(
    DEFAULT_CATEGORY
  );
  const [submitting, setSubmitting] = useState(false);

  // Only the first few categories are offered up front — the rest stay in
  // prompt-examples.ts, ready to surface by bumping this number.
  const categories = promptCategories().slice(0, VISIBLE_CATEGORIES);
  const category = categories.find((item) => item.key === categoryKey) ?? null;
  const uploading = attachments.some((item) => item.status === 'uploading');
  const hasUploaded = attachments.some((item) => item.status === 'uploaded');

  function fillPrompt(prompt: string) {
    setValue(prompt);
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    // Put the caret at the end so the user can keep typing right away.
    requestAnimationFrame(() => {
      el.setSelectionRange(prompt.length, prompt.length);
    });
  }

  /**
   * Picking an example drops in its prompt and, for the ones that ship a
   * sample, the "before" picture it was made from — it's already a public URL,
   * so it counts as uploaded without a round trip. Switching examples swaps
   * that sample out; images the user brought themselves are left alone.
   */
  function applyExample(example: PromptExample) {
    fillPrompt(example.prompt);
    setAttachments((prev) => {
      const own = prev.filter((item) => !item.id.startsWith(EXAMPLE_PREFIX));
      // A try-on case ships two: the person and the garment.
      const sources =
        example.sourceImages ??
        (example.sourceImage ? [example.sourceImage] : []);
      if (sources.length === 0 || own.length > 0) return own;
      return sources.map((src, index) => ({
        id: `${EXAMPLE_PREFIX}${example.key}-${index}`,
        name: example.title,
        preview: src,
        url: src,
        status: 'uploaded' as const,
      }));
    });
  }

  // Uploads need a session — the API rejects anonymous requests, so say why
  // instead of letting every thumbnail fail.
  async function addFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith('image/'));
    if (images.length === 0) return;
    if (!session?.user) {
      toast.error(m['landing.hero.sign_in_to_upload']());
      return;
    }

    const created = images.map((file) => ({
      id: newAttachmentId(),
      name: file.name || 'image',
      preview: URL.createObjectURL(file),
      status: 'uploading' as const,
      file,
    }));

    setAttachments((prev) => [
      ...prev,
      ...created.map(({ file: _file, ...item }) => item),
    ]);

    await Promise.all(
      created.map(async (item) => {
        try {
          const url = await uploadChatImage(item.file);
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === item.id ? { ...att, url, status: 'uploaded' } : att
            )
          );
        } catch (err) {
          const error = (err as Error).message || 'Upload failed';
          toast.error(error);
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === item.id ? { ...att, status: 'error', error } : att
            )
          );
        }
      })
    );
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.preview.startsWith('blob:'))
        URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== id);
    });
  }

  function handleSubmit() {
    const prompt = value.trim();
    if ((!prompt && !hasUploaded) || uploading || submitting) return;
    setSubmitting(true);
    const sessionId = newAgentSessionId();
    // Hand the first turn off to the chat page via sessionStorage so it can
    // auto-send when it mounts. Avoids URL-encoding long prompts. Only
    // uploaded attachments survive the hop — the blob previews don't.
    try {
      sessionStorage.setItem(
        `agent:initial-turn:${sessionId}`,
        JSON.stringify({
          prompt,
          settings: composerSettings,
          attachments: attachments
            .filter((item) => item.status === 'uploaded' && item.url)
            .map((item) => ({ ...item, preview: item.url })),
        })
      );
    } catch {
      // sessionStorage unavailable — chat page will start blank.
    }
    router.push(`/chat/${sessionId}`);
  }

  return (
    <div className={cn('w-full', className)}>
      <h1 className="text-foreground text-center font-serif text-3xl font-normal tracking-[-0.01em] sm:text-4xl">
        {m['landing.hero.headline_1']()}
      </h1>

      <ChatComposer
        className="mt-10"
        textareaRef={textareaRef}
        value={value}
        onValueChange={setValue}
        onSubmit={handleSubmit}
        placeholder={m['agent.home.placeholder']()}
        attachments={attachments}
        onAddFiles={(files) => void addFiles(files)}
        onRemoveAttachment={removeAttachment}
        settings={composerSettings}
        onSettingsChange={setComposerSettings}
        disabled={submitting}
        submitDisabled={(!value.trim() && !hasUploaded) || uploading}
        toolbarExtra={
          category && (
            <span className="border-primary/30 bg-primary/10 text-primary inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs">
              <category.icon className="size-3.5" />
              <span className="max-w-[10rem] truncate">{category.title}</span>
              <button
                type="button"
                onClick={() => setCategoryKey(null)}
                aria-label={m['landing.examples.clear']()}
                className="hover:text-primary/70"
              >
                <X className="size-3" />
              </button>
            </span>
          )
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {categories.map((item) => {
          const active = item.key === categoryKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setCategoryKey(active ? null : item.key)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
              )}
            >
              <item.icon className="size-3.5" />
              {item.title}
            </button>
          );
        })}
      </div>

      {category && (
        <div className="mt-6">
          <p className="text-muted-foreground mb-3 text-sm font-medium">
            {m['landing.examples.recommended']()}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {category.examples.map((example) => (
              <button
                key={example.key}
                type="button"
                onClick={() => applyExample(example)}
                title={example.prompt}
                className="group text-left"
              >
                <span
                  className={cn(
                    'border-border block aspect-square w-full overflow-hidden rounded-md border bg-gradient-to-br transition-shadow group-hover:shadow-md',
                    !example.image && example.swatch
                  )}
                >
                  {example.image && (
                    <img
                      src={example.image}
                      alt={example.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                </span>
                <span className="text-muted-foreground group-hover:text-foreground mt-2 block truncate text-sm transition-colors">
                  {example.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
