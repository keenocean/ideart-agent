import { useRef, useState } from 'react';
import {
  FileVideo2,
  GraduationCap,
  ImageIcon,
  Play,
  Search,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import {
  isLocalChatMediaUrl,
  publishChatMediaSources,
  type PendingAttachment,
} from '@/lib/agent';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { useGenerationEntry } from '@/hooks/use-generation-entry';
import { GenerationWorkbench } from '@/components/agent/generation-workbench';
import {
  promptCategories,
  type PromptExample,
} from '@/components/agent/prompt-examples';
import { VideoPreviewDialog } from '@/components/video-preview-dialog';
import { ViewportVideo } from '@/components/viewport-video';

// Attachments added by an example carry this id prefix so switching examples
// can swap them out without touching the user's own uploads.
const EXAMPLE_PREFIX = 'example:';

// Alternating real frame shapes makes the examples read as a film-wall,
// rather than a rigid thumbnail grid. The order matches video-lite's gallery.
const EXAMPLE_ASPECT_RATIOS = [
  '16 / 10',
  '4 / 5',
  '3 / 4',
  '16 / 9',
  '1 / 1',
  '2 / 3',
  '3 / 2',
  '9 / 16',
  '5 / 4',
  '4 / 3',
  '3 / 5',
] as const;

/**
 * The "start a new chat" surface: headline, prompt composer (local upload +
 * paste, image thumbnails) and one-click example prompts. Shared by the
 * landing hero and the /chat home page — both mint a session id and hand the
 * first turn (prompt, model settings, uploaded images) to /chat/$sessionId
 * through sessionStorage.
 */
export function PromptLauncher({
  className,
  workbenchClassName,
  textareaClassName,
  showHeading = true,
  showExamples = true,
  showQuickActions = true,
}: {
  className?: string;
  workbenchClassName?: string;
  textareaClassName?: string;
  showHeading?: boolean;
  showExamples?: boolean;
  showQuickActions?: boolean;
}) {
  const { data: session } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const entry = useGenerationEntry({
    entryContext: { kind: 'home' },
    persistSettingsOnChange: true,
  });
  const {
    value,
    setValue,
    attachments,
    setAttachments,
    settings: composerSettings,
    setSettings: setComposerSettings,
    skillName,
    setSkillName,
    submitting,
    uploading,
    hasUploaded,
    ensureSessionId,
    addFiles,
    addLibraryMedia,
    removeAttachment,
    submit,
  } = entry;
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const examples = promptCategories()[0]?.examples ?? [];
  const preview =
    previewIndex === null ? null : (examples[previewIndex] ?? null);

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
   * sample, the "before" picture it was made from. Matching lite, choosing an
   * example replaces the current reference mode instead of mixing unrelated
   * user material into the example.
   */
  async function applyExample(example: PromptExample) {
    fillPrompt(example.prompt);
    const sources =
      example.sourceImages ??
      (example.sourceImage ? [example.sourceImage] : []);
    if (sources.length === 0) {
      setAttachments((prev) => {
        prev.forEach((item) => {
          if (item.preview.startsWith('blob:')) {
            URL.revokeObjectURL(item.preview);
          }
        });
        return [];
      });
      return;
    }
    if (
      sources.some((source) => isLocalChatMediaUrl(source)) &&
      !session?.user
    ) {
      setAttachments((prev) => {
        prev.forEach((item) => {
          if (item.preview.startsWith('blob:')) {
            URL.revokeObjectURL(item.preview);
          }
        });
        return [];
      });
      toast.error(m['landing.hero.sign_in_to_upload']());
      return;
    }

    const created: PendingAttachment[] = sources.map((src, index) => ({
      id: `${EXAMPLE_PREFIX}${example.key}-${index}`,
      name: example.title,
      kind: 'image',
      preview: src,
      status: 'uploading',
    }));
    setAttachments((prev) => {
      prev.forEach((item) => {
        if (item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      });
      return created;
    });

    try {
      const uploaded = await publishChatMediaSources(
        sources.map((src) => ({ src, name: example.title })),
        ensureSessionId()
      );
      setAttachments((current) =>
        current.map((item) => {
          const index = created.findIndex(
            (createdItem) => createdItem.id === item.id
          );
          return index >= 0 && uploaded[index]
            ? {
                ...item,
                url: uploaded[index].url,
                receipt: uploaded[index].receipt,
                status: 'uploaded',
              }
            : item;
        })
      );
    } catch (error) {
      const message = (error as Error).message || 'Upload failed';
      toast.error(message);
      const ids = new Set(
        created
          .filter((item) => item.status === 'uploading')
          .map((item) => item.id)
      );
      setAttachments((current) =>
        current.map((item) =>
          ids.has(item.id) ? { ...item, status: 'error', error: message } : item
        )
      );
    }
  }

  function navigatePreview(offset: number) {
    setPreviewIndex((current) => {
      if (current === null || examples.length === 0) return null;
      return (current + offset + examples.length) % examples.length;
    });
  }

  function usePreviewPrompt() {
    if (!preview) return;
    const example = preview;
    setPreviewIndex(null);
    requestAnimationFrame(() => {
      void applyExample(example);
      textareaRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  async function usePreviewAsReference() {
    const video = preview?.video;
    if (!preview || !video) return;
    if (isLocalChatMediaUrl(video) && !session?.user) {
      toast.error(m['landing.hero.sign_in_to_upload']());
      return;
    }
    const example = preview;
    const id = `${EXAMPLE_PREFIX}${example.key}-video`;
    const name = video.split('/').pop() || example.title;
    setPreviewIndex(null);
    fillPrompt(example.prompt);
    setAttachments((prev) => {
      const next: PendingAttachment = {
        id,
        name,
        kind: 'video',
        preview: video,
        status: 'uploading',
      };
      return prev.some((item) => item.id === id)
        ? prev.map((item) => (item.id === id ? next : item))
        : [...prev, next];
    });

    try {
      const [uploaded] = await publishChatMediaSources(
        [{ src: video, name }],
        ensureSessionId()
      );
      if (!uploaded) throw new Error('Upload failed');
      setAttachments((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                url: uploaded.url,
                receipt: uploaded.receipt,
                status: 'uploaded',
              }
            : item
        )
      );
    } catch (error) {
      const message = (error as Error).message || 'Upload failed';
      toast.error(message);
      setAttachments((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: 'error', error: message } : item
        )
      );
    }

    textareaRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'center',
    });
  }

  return (
    <div className={cn('w-full', className)}>
      {showHeading && (
        <h1 className="text-foreground mx-auto max-w-3xl text-center font-serif text-3xl font-normal tracking-[-0.01em] sm:text-4xl">
          {m['agent.home.headline']()}
        </h1>
      )}

      <GenerationWorkbench
        className={cn(
          'mx-auto max-w-3xl',
          showHeading && 'mt-10',
          workbenchClassName
        )}
        textareaRef={textareaRef}
        textareaClassName={textareaClassName}
        value={value}
        onValueChange={setValue}
        onSubmit={submit}
        placeholder={m['agent.home.placeholder']()}
        attachments={attachments}
        onAddFiles={(files) => void addFiles(files)}
        onAddLibraryMedia={(media) => void addLibraryMedia(media)}
        onRemoveAttachment={removeAttachment}
        settings={composerSettings}
        onSettingsChange={setComposerSettings}
        skillName={skillName}
        onSkillNameChange={setSkillName}
        disabled={submitting}
        submitDisabled={(!value.trim() && !hasUploaded) || uploading}
      />

      {showQuickActions && (
        <nav
          aria-label={m['agent.quick_actions.label']()}
          className="mx-auto mt-5 flex max-w-full items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Link
            href="/skills"
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Sparkles aria-hidden="true" className="size-4" />
            {m['agent.quick_actions.skills']()}
          </Link>
          <QuickAction
            icon={Play}
            label={m['agent.quick_actions.video_ads']()}
            onClick={() => {
              setComposerSettings({ ...composerSettings, mediaMode: 'video' });
              textareaRef.current?.focus();
            }}
          />
          <QuickAction
            icon={ImageIcon}
            label={m['agent.quick_actions.image_ads']()}
            onClick={() => {
              setComposerSettings({ ...composerSettings, mediaMode: 'image' });
              textareaRef.current?.focus();
            }}
          />
          <QuickAction
            icon={Search}
            label={m['agent.quick_actions.competitor_research']()}
            onClick={() =>
              fillPrompt(m['agent.quick_actions.competitor_prompt']())
            }
          />
          <QuickAction
            icon={GraduationCap}
            label={m['agent.quick_actions.watch_tutorial']()}
            onClick={() => {
              if (examples.length > 0) setPreviewIndex(0);
            }}
          />
        </nav>
      )}

      {showExamples && (
        <section className="mx-auto mt-14 max-w-3xl">
          <h2 className="text-foreground text-sm font-medium">
            {m['landing.examples.recommended']()}
          </h2>
          <div className="mt-4 columns-2 gap-2 sm:columns-3 lg:columns-4">
            {examples.map((example, index) => {
              return (
                <button
                  key={example.key}
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  title={example.prompt}
                  aria-label={example.title}
                  className="border-border bg-muted group focus-visible:ring-primary relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-lg border text-left focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                  style={{
                    aspectRatio:
                      EXAMPLE_ASPECT_RATIOS[
                        index % EXAMPLE_ASPECT_RATIOS.length
                      ],
                  }}
                >
                  {example.video && (
                    <ViewportVideo
                      src={example.video}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                    />
                  )}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/5 opacity-20 transition-opacity group-hover:opacity-70" />
                  <span className="pointer-events-none absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover:scale-105 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Play className="ml-0.5 size-3.5 fill-current" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pt-8 pb-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {example.title}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {(showExamples || showQuickActions) && (
        <VideoPreviewDialog
          open={preview !== null}
          item={
            preview?.video
              ? {
                  src: preview.video,
                  title: preview.title,
                  prompt: preview.prompt,
                }
              : null
          }
          index={previewIndex ?? -1}
          total={examples.length}
          labels={{
            video: m['showcase.dialog.video'](),
            prompt: m['showcase.dialog.prompt'](),
            download: m['showcase.dialog.download'](),
            previous: m['showcase.dialog.previous'](),
            next: m['showcase.dialog.next'](),
            close: m['showcase.dialog.close'](),
          }}
          downloadHref={preview?.video ?? '#'}
          onClose={() => setPreviewIndex(null)}
          onNavigate={navigatePreview}
          actions={
            preview ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <button
                  type="button"
                  onClick={usePreviewPrompt}
                  className="bg-primary text-primary-foreground focus-visible:ring-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <WandSparkles className="size-4" />
                  {m['showcase.dialog.use_prompt']()}
                </button>
                <button
                  type="button"
                  onClick={usePreviewAsReference}
                  className="focus-visible:ring-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <FileVideo2 className="size-4" />
                  {m['showcase.dialog.use_reference']()}
                </button>
              </div>
            ) : null
          }
        />
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}
