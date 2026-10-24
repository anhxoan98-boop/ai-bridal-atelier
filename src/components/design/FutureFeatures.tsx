/**
 * Honest placeholders for upcoming steps. They are intentionally not
 * clickable: nothing is generated until the real services exist.
 * Service contracts: imageGenerationService.makeItReal / createVideo.
 */
const FEATURES = [
  {
    title: 'Make it real',
    text: 'Turn your approved design into a photorealistic bridal image. Your design stays the source of truth.',
  },
  {
    title: 'Create AI video',
    text: 'See your dress in motion, created from your approved final design images.',
  },
]

export function FutureFeatures() {
  return (
    <section aria-labelledby="coming-next" className="mt-16 border-t border-line pt-10">
      <p id="coming-next" className="eyebrow text-center">
        Coming next
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="border border-line bg-white/50 p-6" aria-disabled="true">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl uppercase tracking-[0.08em]">{f.title}</h3>
              <span className="shrink-0 border border-line px-2 py-1 text-[9.5px] uppercase tracking-[0.18em] text-muted">
                Not available yet
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
