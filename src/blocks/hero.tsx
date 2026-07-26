import { PromptLauncher } from '@/components/agent/prompt-launcher';

export function Hero() {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden px-4 py-16 sm:py-20">
      {/* Soft brand-tinted radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.9_0.06_287.38_/_0.5),transparent_70%)]"
      />

      <PromptLauncher className="mx-auto max-w-3xl" />
    </section>
  );
}
