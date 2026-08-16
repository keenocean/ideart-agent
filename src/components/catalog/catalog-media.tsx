import { useEffect, useRef, useState } from 'react';

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
  /** Keep below-fold image URLs out of SSR and the initial network queue. */
  deferUntilVisible?: boolean;
}) {
  const mediaClassName = cn(
    'block size-full',
    fit === 'cover' ? 'object-cover' : 'object-contain',
    className
  );

  if (asset.kind === 'image') {
    if (deferUntilVisible && !priority) {
      return <DeferredCatalogImage asset={asset} className={mediaClassName} />;
    }
    return (
      <img
        src={asset.url}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        decoding={priority ? 'sync' : 'async'}
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

function DeferredCatalogImage({
  asset,
  className,
}: {
  asset: Extract<CatalogMediaAsset, { kind: 'image' }>;
  className: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: '240px', threshold: 0.01 }
    );
    observer.observe(image);
    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imageRef}
      src={shouldLoad ? asset.url : undefined}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      loading="lazy"
      fetchPriority="low"
      decoding="async"
      className={className}
    />
  );
}
