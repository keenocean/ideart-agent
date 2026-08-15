import { useState } from 'react';
import { FileUp, Play, WandSparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  CatalogMedia,
  type CatalogMediaAsset,
} from '@/components/catalog/catalog-media';
import {
  CatalogMediaPreviewDialog,
  type CatalogMediaPreviewLabels,
} from '@/components/catalog/catalog-media-preview-dialog';

export type CatalogGalleryItem = {
  id: string;
  title: string;
  description?: string;
  prompt: string;
  media: CatalogMediaAsset;
};

export type CatalogGalleryLabels = CatalogMediaPreviewLabels & {
  usePrompt: string;
  useAsReference?: string;
  expand?: string;
};

export function masonryColumnClass(
  itemCount: number,
  variant: 'image' | 'dense'
): string {
  if (itemCount <= 1) return 'columns-1';
  if (variant === 'dense') {
    if (itemCount === 2) return 'columns-2';
    if (itemCount === 3) return 'columns-2 sm:columns-3';
    return 'columns-2 sm:columns-3 lg:columns-4';
  }
  if (itemCount === 2) return 'columns-1 sm:columns-2';
  return 'columns-1 sm:columns-2 lg:columns-3';
}

/** Greedy natural-height balancing for the image reference's explicit lanes. */
export function distributeMasonryIndexes(
  items: readonly CatalogGalleryItem[],
  requestedLaneCount: number
): number[][] {
  if (items.length === 0) return [];
  const laneCount = Math.max(1, Math.min(requestedLaneCount, items.length));
  const lanes = Array.from({ length: laneCount }, () => [] as number[]);
  if (items.length === laneCount) {
    items.forEach((_item, index) => lanes[index]!.push(index));
    return lanes;
  }
  const heights = Array.from({ length: laneCount }, () => 0);
  const ranked = items
    .map((item, index) => ({
      index,
      relativeHeight: item.media.height / item.media.width,
    }))
    .sort((a, b) => b.relativeHeight - a.relativeHeight || a.index - b.index);

  for (const item of ranked) {
    let targetLane = 0;
    for (let lane = 1; lane < laneCount; lane += 1) {
      if (heights[lane]! < heights[targetLane]!) targetLane = lane;
    }
    lanes[targetLane]!.push(item.index);
    heights[targetLane]! += item.relativeHeight;
  }

  return lanes;
}

export function CatalogMasonryGallery({
  items,
  labels,
  variant = 'image',
  collapsedHeight,
  onUsePrompt,
  onUseAsReference,
}: {
  items: readonly CatalogGalleryItem[];
  labels: CatalogGalleryLabels;
  variant?: 'image' | 'dense';
  collapsedHeight?: number;
  onUsePrompt?: (item: CatalogGalleryItem) => void;
  onUseAsReference?: (item: CatalogGalleryItem) => void | Promise<void>;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const preview = previewIndex === null ? null : (items[previewIndex] ?? null);
  const isCollapsed = Boolean(collapsedHeight && !expanded);
  const tabletLanes = distributeMasonryIndexes(items, 2);
  const desktopLanes = distributeMasonryIndexes(items, 3);

  function navigatePreview(offset: number) {
    setPreviewIndex((current) => {
      if (current === null || items.length === 0) return null;
      return (current + offset + items.length) % items.length;
    });
  }

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden',
          variant === 'dense' && 'rounded-3xl'
        )}
        style={isCollapsed ? { maxHeight: collapsedHeight } : undefined}
      >
        {variant === 'dense' ? (
          <div
            className={cn(masonryColumnClass(items.length, variant), 'gap-2')}
          >
            {items.map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                variant={variant}
                onOpen={() => setPreviewIndex(index)}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:hidden">
              {items.map((item, index) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  variant={variant}
                  onOpen={() => setPreviewIndex(index)}
                />
              ))}
            </div>
            <div className="hidden gap-4 sm:flex lg:hidden">
              {tabletLanes.map((lane, laneIndex) => (
                <div key={laneIndex} className="flex flex-1 flex-col gap-4">
                  {lane.map((index) => (
                    <GalleryCard
                      key={items[index]!.id}
                      item={items[index]!}
                      variant={variant}
                      onOpen={() => setPreviewIndex(index)}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="hidden gap-4 lg:flex">
              {desktopLanes.map((lane, laneIndex) => (
                <div key={laneIndex} className="flex flex-1 flex-col gap-4">
                  {lane.map((index) => (
                    <GalleryCard
                      key={items[index]!.id}
                      item={items[index]!}
                      variant={variant}
                      onOpen={() => setPreviewIndex(index)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {isCollapsed && (
          <div className="from-background via-background/80 to-background absolute inset-x-0 bottom-0 flex h-64 items-end justify-center bg-gradient-to-b from-transparent pb-8">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="border-border bg-background hover:bg-muted focus-visible:ring-ring rounded-full border px-5 py-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {labels.expand}
            </button>
          </div>
        )}
      </div>

      <CatalogMediaPreviewDialog
        open={preview !== null}
        item={preview}
        index={previewIndex ?? -1}
        total={items.length}
        labels={labels}
        onClose={() => setPreviewIndex(null)}
        onNavigate={navigatePreview}
        actions={
          preview && (onUsePrompt || onUseAsReference) ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {onUsePrompt && (
                <button
                  type="button"
                  onClick={() => {
                    const selected = preview;
                    setPreviewIndex(null);
                    onUsePrompt(selected);
                  }}
                  className="bg-primary text-primary-foreground focus-visible:ring-ring flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <WandSparkles aria-hidden="true" className="size-4" />
                  {labels.usePrompt}
                </button>
              )}
              {onUseAsReference && labels.useAsReference && (
                <button
                  type="button"
                  onClick={() => {
                    const selected = preview;
                    setPreviewIndex(null);
                    void onUseAsReference(selected);
                  }}
                  className="border-border bg-background hover:bg-muted focus-visible:ring-ring flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <FileUp aria-hidden="true" className="size-4" />
                  {labels.useAsReference}
                </button>
              )}
            </div>
          ) : null
        }
      />
    </>
  );
}

function GalleryCard({
  item,
  variant,
  onOpen,
}: {
  item: CatalogGalleryItem;
  variant: 'image' | 'dense';
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={item.title}
      className={cn(
        'group border-border bg-card focus-visible:ring-ring relative block w-full break-inside-avoid overflow-hidden border text-left focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
        variant === 'dense' ? 'mb-2 rounded-2xl' : 'rounded-2xl'
      )}
    >
      <span
        className="bg-muted block w-full overflow-hidden"
        style={{ aspectRatio: `${item.media.width} / ${item.media.height}` }}
      >
        <CatalogMedia
          asset={item.media}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none"
        />
      </span>
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
      {item.media.kind === 'video' && (
        <span className="pointer-events-none absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Play aria-hidden="true" className="ml-0.5 size-4 fill-current" />
        </span>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-4 pt-10 pb-4 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        {item.title}
      </span>
    </button>
  );
}
