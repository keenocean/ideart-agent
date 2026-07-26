import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ImageIcon } from 'lucide-react';

import { useRouter } from '@/core/i18n/navigation';
import { labelForGeneratedModel } from '@/lib/agent-settings';
import { apiGet } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { useAgentHeader } from '@/components/agent/agent-header-context';
import { usePreviewPane } from '@/components/agent/preview-pane-context';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/(agent)/library')({
  component: LibraryPage,
});

interface LibraryImage {
  id: string;
  src: string;
  name: string;
  alt: string;
  chatId: string;
  chatTitle: string;
  createdAt: string;
  model?: string;
}

interface LibraryData {
  images?: LibraryImage[];
  nextCursor?: string;
}

function LibraryPage() {
  const router = useRouter();
  const { setContent: setHeaderContent } = useAgentHeader();
  const { setOpen, clearImage, setImages } = usePreviewPane();
  const libraryQuery = useInfiniteQuery({
    queryKey: ['agent-library'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      apiGet<LibraryData>(
        pageParam
          ? `/api/agent/library?cursor=${encodeURIComponent(pageParam)}`
          : '/api/agent/library'
      ),
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
  });

  const images = useMemo(
    () => libraryQuery.data?.pages.flatMap((page) => page?.images ?? []) ?? [],
    [libraryQuery.data]
  );

  useEffect(() => {
    setHeaderContent({ title: m['agent.library.title']() });
    return () => setHeaderContent({});
  }, [setHeaderContent]);

  useEffect(() => {
    setOpen(false);
    clearImage();
    return () => {
      setImages([]);
      clearImage();
      setOpen(false);
    };
  }, [clearImage, setImages, setOpen]);

  useEffect(() => {
    setImages(
      images.map((image) => ({
        src: image.src,
        alt: image.alt,
        name: image.name,
      }))
    );
  }, [images, setImages]);

  function openImage(image: LibraryImage) {
    const params = new URLSearchParams({
      preview: image.src,
      previewName: image.name,
      previewAlt: image.alt,
    });
    router.push(`/chat/${image.chatId}?${params.toString()}`);
  }

  return (
    <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto px-4 py-6">
      <div className="mx-auto w-full max-w-6xl">
        {libraryQuery.isLoading ? (
          <LibraryState text={m['agent.library.loading']()} />
        ) : images.length === 0 ? (
          <LibraryState
            text={m['agent.library.empty']()}
            muted={m['agent.library.empty_description']()}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => openImage(image)}
                className="group border-border bg-card hover:border-primary/50 min-w-0 overflow-hidden rounded-lg border text-left transition-colors"
              >
                <div className="bg-muted aspect-square overflow-hidden">
                  <LibraryImageThumb
                    src={image.src}
                    alt={image.alt || image.name}
                    className="size-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <div className="min-w-0 px-3 py-2">
                  <p className="text-muted-foreground truncate text-xs">
                    {image.chatTitle}
                  </p>
                  {image.model && (
                    <p className="text-muted-foreground/70 mt-0.5 truncate text-[11px]">
                      {labelForGeneratedModel(image.model)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {libraryQuery.hasNextPage && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => libraryQuery.fetchNextPage()}
              disabled={libraryQuery.isFetchingNextPage}
            >
              {libraryQuery.isFetchingNextPage
                ? m['agent.library.loading']()
                : m['agent.library.load_more']()}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryState({ text, muted }: { text: string; muted?: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="border-border bg-muted/40 flex size-12 items-center justify-center rounded-lg border">
        <ImageIcon className="text-muted-foreground size-5" />
      </div>
      <p className="mt-3 text-sm font-medium">{text}</p>
      {muted && <p className="text-muted-foreground mt-1 text-xs">{muted}</p>}
    </div>
  );
}

function LibraryImageThumb({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return <img src={src} alt={alt} className={className} />;
}
