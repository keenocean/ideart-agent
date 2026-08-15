import type { MarketingAsset } from '@/config/catalog/types';
import { cn } from '@/lib/utils';
import { ViewportVideo } from '@/components/viewport-video';

export type CatalogMediaAsset = MarketingAsset & {
  alt: string;
};

export function CatalogMedia({
  asset,
  className,
  fit = 'cover',
  priority = false,
  controls = false,
  autoPlay = true,
}: {
  asset: CatalogMediaAsset;
  className?: string;
  fit?: 'cover' | 'contain';
  priority?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
}) {
  const mediaClassName = cn(
    'block size-full',
    fit === 'cover' ? 'object-cover' : 'object-contain',
    className
  );

  if (asset.kind === 'image') {
    return (
      <img
        src={asset.url}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={mediaClassName}
      />
    );
  }

  return (
    <ViewportVideo
      src={asset.url}
      poster={asset.poster.url}
      controls={controls}
      autoPlay={autoPlay}
      ariaLabel={asset.alt}
      className={mediaClassName}
    />
  );
}
