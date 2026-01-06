import { config } from '@repo/config'
import { Link } from '@tanstack/react-router'
import { Play, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  const { hero } = config.marketing

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />

      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h1 className="mb-6 font-bold text-5xl tracking-tight sm:text-6xl lg:text-7xl">
            {hero.headline}
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {hero.subheadline}
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-xl text-xl text-muted-foreground">{hero.description}</p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="gap-2 text-base px-8">
              <Link to="/demo">
                <Play className="size-4" />
                Watch Demo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 text-base px-8">
              <Link to="/docs">
                <BookOpen className="size-4" />
                Read Docs
              </Link>
            </Button>
          </div>

          {/* Trust Signal */}
          <p className="mt-8 text-sm text-muted-foreground">{hero.trustSignal}</p>
        </div>
      </div>
    </section>
  )
}
