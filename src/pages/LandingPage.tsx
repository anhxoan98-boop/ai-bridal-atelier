import { ButtonLink } from '@/components/ui/Button'

export function LandingPage() {
  return (
    <section className="relative overflow-hidden">
      {/* soft atmospheric backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 35%, rgba(233,223,207,0.65) 0%, rgba(250,247,242,0) 70%), radial-gradient(40% 35% at 85% 80%, rgba(246,232,228,0.6) 0%, rgba(250,247,242,0) 70%)',
        }}
      />
      <Silhouette />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem-6rem)] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="eyebrow animate-fade-up">Couture · Reimagined</p>
        <h1
          className="mt-6 animate-fade-up text-[2.6rem] leading-[1] tracking-[0.14em] uppercase sm:text-7xl sm:tracking-[0.16em]"
          style={{ animationDelay: '80ms' }}
        >
          AI Bridal
          <br />
          Atelier
        </h1>
        <div className="my-8 hairline animate-fade-up" style={{ animationDelay: '160ms' }} />
        <p
          className="max-w-md animate-fade-up font-display text-2xl italic leading-snug text-ink-soft sm:text-3xl"
          style={{ animationDelay: '220ms' }}
        >
          Create your dream wedding dress with AI.
        </p>

        <div
          className="mt-12 flex w-full max-w-sm animate-fade-up flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
          style={{ animationDelay: '320ms' }}
        >
          <ButtonLink to="/design" size="lg">
            Start Designing
          </ButtonLink>
          <ButtonLink to="/designs" size="lg" variant="secondary">
            My Designs
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

/** A single, fine-line gown drawing — decorative only. */
function Silhouette() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 400"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.13]"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
    >
      <path d="M100 30c-6 0-10 5-10 11 0 4 2 8 5 10l-3 4c-8 2-13 8-14 16l-2 30c-1 6 3 10 3 10l3 14-50 230c-2 8 3 12 12 13 30 3 82 3 112 0 9-1 14-5 12-13l-50-230 3-14s4-4 3-10l-2-30c-1-8-6-14-14-16l-3-4c3-2 5-6 5-10 0-6-4-11-10-11z" />
      <path d="M79 115c14 6 28 6 42 0" />
      <path d="M77 129c-14 80-34 160-51 228M123 129c14 80 34 160 51 228" opacity="0.6" />
      <path d="M100 129v240" opacity="0.35" />
    </svg>
  )
}
