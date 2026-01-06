import { config } from '@repo/config'
import { Link } from '@tanstack/react-router'
import { BookOpen, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  const { cta } = config.marketing

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/5 via-background to-background" />

      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Heading */}
          <h2 className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl">{cta.title}</h2>
          <p className="mb-8 text-lg text-muted-foreground">{cta.subtitle}</p>

          {/* Primary CTA */}
          <div className="mb-6 flex justify-center">
            <Button asChild size="lg">
              <Link to="/dashboard/agents">{cta.primaryAction}</Link>
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {cta.secondaryActions.map((action) => (
              <Button asChild key={action.label} size="lg" variant="outline">
                <Link to={action.href as '/docs' | '/demo'}>
                  {action.label === 'View Docs' && <BookOpen className="mr-2 size-4" />}
                  {action.label === 'Try Demo' && <Play className="mr-2 size-4" />}
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
