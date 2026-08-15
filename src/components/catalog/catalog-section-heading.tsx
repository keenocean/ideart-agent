import { cn } from '@/lib/utils';

export function CatalogSectionHeading({
  title,
  description,
  align = 'center',
  size = 'compact',
  className,
}: {
  title: string;
  description?: string;
  align?: 'left' | 'center';
  size?: 'compact' | 'editorial';
  className?: string;
}) {
  return (
    <header
      className={cn(
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      <h2
        className={cn(
          'text-foreground font-serif font-normal tracking-[-0.02em] text-balance',
          size === 'editorial'
            ? 'text-4xl leading-[1.08] sm:text-5xl lg:text-[3.5rem]'
            : 'text-2xl leading-tight sm:text-3xl'
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'text-muted-foreground mt-3 text-sm leading-relaxed',
            align === 'center' && 'mx-auto max-w-2xl'
          )}
        >
          {description}
        </p>
      )}
    </header>
  );
}
