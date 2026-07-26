import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Paperclip,
  Plus,
  X,
} from 'lucide-react';

import { imageFilesFromClipboard, type PendingAttachment } from '@/lib/agent';
import { type AgentComposerSettings } from '@/lib/agent-settings';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { ComposerControls } from '@/components/agent/composer-controls';
import { ComposerSettings } from '@/components/agent/composer-settings';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * The prompt input shared by the launcher (landing hero + /chat) and the
 * chat session page: image thumbnails, "+" menu for local uploads, paste-to-
 * upload, model settings and submit. The owner keeps the state — this only
 * renders it.
 */
export function ChatComposer({
  value,
  onValueChange,
  onSubmit,
  placeholder,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  settings,
  onSettingsChange,
  disabled = false,
  submitDisabled = false,
  size = 'lg',
  toolbarExtra,
  textareaRef,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  attachments: PendingAttachment[];
  onAddFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  settings: AgentComposerSettings;
  onSettingsChange: (settings: AgentComposerSettings) => void;
  disabled?: boolean;
  submitDisabled?: boolean;
  /** `lg` on the start screens, `sm` for the follow-up box in a session. */
  size?: 'sm' | 'lg';
  /** Rendered next to the "+" menu (e.g. the selected example category). */
  toolbarExtra?: ReactNode;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  // Removing an attachment while zoomed shouldn't leave a dangling index.
  const zoomed = zoomIndex !== null && !!attachments[zoomIndex];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn(
        'border-border bg-card rounded-3xl border shadow-sm transition-shadow focus-within:shadow-md',
        className
      )}
    >
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {attachments.map((item, index) => (
            <div
              key={item.id}
              className="border-border bg-background relative size-16 overflow-hidden rounded-md border"
              title={item.error || item.name}
            >
              <button
                type="button"
                onClick={() => setZoomIndex(index)}
                className="block size-full cursor-zoom-in"
                aria-label={m['agent.composer.zoom_image']()}
              >
                <img
                  src={item.preview}
                  alt={item.name}
                  className={cn(
                    'size-full object-cover',
                    item.status === 'error' && 'opacity-50'
                  )}
                />
              </button>
              {item.status === 'uploading' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
                  <Loader2 className="size-4 animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemoveAttachment(item.id)}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label={m['landing.hero.remove_image']()}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {zoomed && (
        <AttachmentLightbox
          attachments={attachments}
          index={zoomIndex!}
          onIndexChange={setZoomIndex}
          onClose={() => setZoomIndex(null)}
        />
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onPaste={(e) => {
          const images = imageFilesFromClipboard(e.clipboardData);
          if (images.length === 0) return;
          e.preventDefault();
          onAddFiles(images);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        rows={size === 'lg' ? 3 : 2}
        disabled={disabled}
        className={cn(
          'text-foreground placeholder:text-muted-foreground w-full resize-none rounded-3xl bg-transparent px-4 pt-4 pb-2 leading-relaxed focus:outline-none',
          size === 'lg' ? 'min-h-[92px] text-sm' : 'min-h-[64px] text-sm'
        )}
      />

      {/* Wraps on narrow screens: "+" + category chip + model + settings +
          submit is wider than a 390px viewport. */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={disabled}
                  aria-label={m['agent.home.attach']()}
                  className="text-muted-foreground size-8 rounded-full"
                />
              }
            >
              <Plus className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Paperclip className="size-4" />
                {m['landing.hero.upload_local']()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              onAddFiles(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = '';
            }}
          />
          {toolbarExtra}
        </div>
        {/* ml-auto keeps this group right-aligned after the row wraps. */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ComposerControls
            settings={settings}
            onChange={onSettingsChange}
            disabled={disabled}
          />
          <ComposerSettings
            settings={settings}
            onChange={onSettingsChange}
            disabled={disabled}
          />
          <Button
            type="submit"
            size="icon"
            aria-label={m['agent.home.submit']()}
            disabled={disabled || submitDisabled}
            className="size-8 rounded-full"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Full-screen viewer for the composer's attachments: click a thumbnail to
 * zoom, arrow keys or the side buttons to move between them, Esc or a click
 * on the backdrop to close. Self-contained rather than reusing the chat's
 * preview pane, because the composer also runs on the landing page, outside
 * the agent layout that provides it.
 */
function AttachmentLightbox({
  attachments,
  index,
  onIndexChange,
  onClose,
}: {
  attachments: PendingAttachment[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const total = attachments.length;
  const current = attachments[index];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (total < 2) return;
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + total) % total);
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % total);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, total, onIndexChange, onClose]);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={m['agent.composer.close_zoom']()}
        className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange((index - 1 + total) % total);
            }}
            aria-label={m['agent.composer.previous_image']()}
            className="absolute left-4 flex size-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onIndexChange((index + 1) % total);
            }}
            aria-label={m['agent.composer.next_image']()}
            className="absolute right-4 flex size-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight className="size-5" />
          </button>
          <span className="absolute bottom-6 rounded-md bg-white/10 px-2.5 py-1 text-xs text-white">
            {index + 1} / {total}
          </span>
        </>
      )}

      {/* Clicks on the image itself shouldn't dismiss the viewer. */}
      <img
        src={current.preview}
        alt={current.name}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
