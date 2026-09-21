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
  deferUntilVisible = false,
}: {
  asset: CatalogMediaAsset;
  className?: string;
  fit?: 'cover' | 'contain';
  priority?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  /**
   * Below-fold image: keep it out of the initial network queue.
   *
   * The URL is still in the server-rendered markup. An earlier version
   * attached `src` only once an IntersectionObserver fired, which kept the
   * bytes off the critical path but also hid every below-fold image from
   * crawlers — on /image-to-video four of five `<img>` tags reached Google
   * with no `src` at all. Native `loading="lazy"` with a low fetch priority
   * gives the same deferral while the image stays visible in the HTML.
   */
  deferUntilVisible?: boolean;
}) {
  const mediaClassName = cn(
    'block size-full',
    fit === 'cover' ? 'object-cover' : 'object-contain',
    className
  );

  if (asset.kind === 'image') {
    const eager = priority && !deferUntilVisible;
    return (
      <img
        src={asset.url}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        decoding={eager ? 'sync' : 'async'}
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
