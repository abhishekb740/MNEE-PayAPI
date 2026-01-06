import { config } from '@repo/config'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Bot, Server, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useAuthDialog } from '@/components/auth/auth-dialog'
import { Layout } from '@/components/layout'
import { HeroSection } from '@/components/marketing/hero-section'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: HomePage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
})

function HomePage() {
  const { howItWorks, audiences, cta } = config.marketing
  const { redirect } = Route.useSearch()
  const { openDialog } = useAuthDialog()
  const { isAuthenticated, isLoading } = useAuth()

  // Auto-open auth dialog when redirected from protected route
  useEffect(() => {
    if (redirect && !isAuthenticated && !isLoading) {
      openDialog()
    }
  }, [redirect, isAuthenticated, isLoading, openDialog])

  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection />

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Your AI agent handles everything autonomously
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {step.step}
                </div>
                <h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Audience Paths */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">
              What Brings You Here?
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Agent Builders */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                  <Bot className="size-7 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">{audiences.agents.title}</CardTitle>
                <CardDescription className="text-base">
                  {audiences.agents.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full gap-2">
                  <Link to="/docs/agents">
                    {audiences.agents.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* API Providers */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900">
                  <Server className="size-7 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">{audiences.providers.title}</CardTitle>
                <CardDescription className="text-base">
                  {audiences.providers.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/docs/providers">
                    {audiences.providers.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">{cta.title}</h2>
            <p className="mb-8 text-lg text-muted-foreground">{cta.subtitle}</p>
            <Button asChild size="lg" className="gap-2 px-8">
              <Link to={cta.primaryHref}>
                {cta.primaryAction}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  )
}
