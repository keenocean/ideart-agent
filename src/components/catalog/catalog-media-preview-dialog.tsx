import type { ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImageIcon,
  Video,
  X,
} from 'lucide-react';

import type { CatalogMediaAsset } from '@/components/catalog/catalog-media';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

export type CatalogMediaPreviewItem = {
  id: string;
  title: string;
  description?: string;
  prompt: string;
  media: CatalogMediaAsset;
};

export type CatalogMediaPreviewLabels = {
  image: string;
  video: string;
  prompt: string;
  download: string;
  previous: string;
  next: string;
  close: string;
};

export function CatalogMediaPreviewDialog({
  open,
  item,
  index,
  total,
  labels,
  onClose,
  onNavigate,
  actions,
}: {
  open: boolean;
  item: CatalogMediaPreviewItem | null;
  index: number;
  total: number;
  labels: CatalogMediaPreviewLabels;
  onClose: () => void;
  onNavigate: (offset: number) => void;
  actions?: ReactNode;
}) {
  const canNavigate = index >= 0 && total > 1;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            onNavigate(-1);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            onNavigate(1);
          }
        }}
        className="bg-background text-foreground inset-0 top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none p-0 ring-0 sm:max-w-none"
      >
        {item && (
          <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_23rem] lg:grid-rows-1">
            <div className="bg-muted/55 relative flex min-h-[52dvh] items-center justify-center overflow-hidden">
              <div className="bg-primary/8 absolute inset-0 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />

              <button
                type="button"
                onClick={onClose}
                aria-label={labels.close}
                className="border-border bg-background/80 text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-4 right-4 z-30 flex size-10 items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
              >
                <X aria-hidden="true" className="size-4" />
              </button>

              {item.media.kind === 'image' ? (
                <img
                  src={item.media.url}
                  alt={item.media.alt}
                  width={item.media.width}
                  height={item.media.height}
                  decoding="async"
                  className="relative z-10 max-h-[calc(52dvh-4rem)] max-w-[calc(100%-5rem)] object-contain shadow-2xl lg:max-h-[calc(100dvh-3rem)] lg:max-w-[calc(100%-8rem)]"
                />
              ) : (
                <video
                  key={item.media.url}
                  src={item.media.url}
                  poster={item.media.poster.url}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  aria-label={item.media.alt}
                  className="relative z-10 max-h-[calc(52dvh-4rem)] max-w-[calc(100%-5rem)] bg-black shadow-2xl lg:max-h-[calc(100dvh-3rem)] lg:max-w-[calc(100%-8rem)]"
                />
              )}

              {canNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate(-1)}
                    aria-label={labels.previous}
                    className="border-border bg-background/80 text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute left-3 z-20 flex size-10 items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:outline-none sm:left-5"
                  >
                    <ChevronLeft aria-hidden="true" className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate(1)}
                    aria-label={labels.next}
                    className="border-border bg-background/80 text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute right-3 z-20 flex size-10 items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:outline-none sm:right-5"
                  >
                    <ChevronRight aria-hidden="true" className="size-5" />
                  </button>
                  <span className="border-border bg-background/80 text-muted-foreground absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border px-3 py-1 text-[11px] font-medium backdrop-blur-md">
                    {index + 1} / {total}
                  </span>
                </>
              )}
            </div>

            <aside className="border-border bg-card relative z-20 flex max-h-[48dvh] min-h-0 flex-col overflow-hidden border-t lg:m-3 lg:ml-0 lg:max-h-none lg:rounded-[1.25rem] lg:border">
              <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
                <a
                  href={item.media.url}
                  download
                  className="border-border bg-background hover:bg-muted focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Download aria-hidden="true" className="size-3.5" />
                  {labels.download}
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={labels.close}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring hidden size-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none lg:flex"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                <DialogTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase">
                  {item.media.kind === 'image' ? (
                    <ImageIcon aria-hidden="true" className="size-3.5" />
                  ) : (
                    <Video aria-hidden="true" className="size-3.5" />
                  )}
                  {item.media.kind === 'image' ? labels.image : labels.video}
                </DialogTitle>
                <p className="mt-2 text-sm leading-relaxed font-medium">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.description}
                  </p>
                )}

                <div className="mt-7">
                  <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
                    {labels.prompt}
                  </p>
                  <DialogDescription className="text-foreground mt-2 text-sm leading-6">
                    {item.prompt}
                  </DialogDescription>
                </div>
              </div>

              {actions && (
                <div className="border-border border-t p-4">{actions}</div>
              )}
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
