import { useEffect, useRef, useState } from 'react';

/**
 * Loads and plays a muted looping preview only while it is near the viewport.
 * This keeps the masonry gallery lively without downloading every clip at once.
 */
export function ViewportVideo({
  src,
  poster,
  className,
  controls = false,
  autoPlay = true,
  loop = true,
  muted = true,
  ariaLabel,
}: {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  ariaLabel?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          if (
            autoPlay &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ) {
            void video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { rootMargin: '240px', threshold: 0.01 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;
    video.load();
    if (
      autoPlay &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      void video.play().catch(() => {});
    }
  }, [autoPlay, shouldLoad, src]);

  return (
    <video
      ref={videoRef}
      src={shouldLoad ? src : undefined}
      poster={poster}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline
      preload="none"
      aria-label={ariaLabel}
      className={className}
    />
  );
}
