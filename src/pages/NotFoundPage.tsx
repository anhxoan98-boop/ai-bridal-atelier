import { ButtonLink } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl uppercase tracking-[0.08em]">Page not found</h1>
      <div className="my-6 hairline" />
      <ButtonLink to="/">Return home</ButtonLink>
    </section>
  )
}
