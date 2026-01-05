/**
 * Shared configuration for the entire application
 * Used by both web and API workers
 */

export const config = {
  appName: 'mnee-marketplace', // Used for deployment/routing (no spaces)
  displayName: 'PayAPI', // Used for UI display
  tagline: 'APIs Your AI Agents Can Pay For',
  description:
    'Your agent discovers data, pays automatically, gets results. No subscriptions. No manual billing. Just autonomous AI commerce.',

  // SEO & Open Graph
  seo: {
    title: 'PayAPI - APIs Your AI Agents Can Pay For',
    description:
      'Let your AI agents autonomously discover, pay for, and consume APIs. No subscriptions, no manual billing. Micropayments on Ethereum.',
    url: 'https://your-domain.com',
    ogImage: 'https://your-domain.com/og-image.png',
  },

  // Development tools configuration
  devtools: {
    enabled: false,
  },

  // Navigation links (web only - public routes)
  nav: [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Demo', href: '/demo' },
    { label: 'Docs', href: '/docs' },
    { label: 'Dashboard', href: '/dashboard' },
  ],

  // Footer links (web only)
  footer: {
    links: [
      { label: 'Marketplace', href: '/marketplace' },
      {
        label: 'MNEE Token',
        href: 'https://etherscan.io/token/0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF',
      },
    ],
  },

  // Social links (optional)
  social: {
    github: 'https://github.com/yourusername/mnee-marketplace',
    twitter: '',
  },

  // Marketing content
  marketing: {
    hero: {
      headline: 'APIs Your AI Agents',
      subheadline: 'Can Pay For',
      description:
        'Your agent discovers data, pays automatically, gets results. No subscriptions. No manual billing.',
      trustSignal: 'Micropayments powered by blockchain',
    },

    // How it works steps
    howItWorks: [
      {
        step: 1,
        title: 'Agent Discovers',
        description: 'Your AI agent queries available APIs and their prices',
      },
      {
        step: 2,
        title: 'Agent Decides',
        description: 'It evaluates options and chooses the best data source',
      },
      {
        step: 3,
        title: 'Agent Pays',
        description: 'Sends a micropayment automatically via blockchain',
      },
      {
        step: 4,
        title: 'Agent Gets Data',
        description: 'Receives the data and continues its task',
      },
    ],

    // Two audience paths
    audiences: {
      agents: {
        title: "I'm building AI agents",
        description: 'Get an API key and let your agents pay for data autonomously',
        cta: 'Start Building',
        href: '/docs/agents',
      },
      providers: {
        title: 'I want to sell my API',
        description: 'List your API and earn 80% of every call. Get paid instantly.',
        cta: 'Become a Provider',
        href: '/docs/providers',
      },
    },

    cta: {
      title: 'See It In Action',
      subtitle: 'Watch an AI agent autonomously discover, pay for, and consume an API.',
      primaryAction: 'Watch Demo',
      primaryHref: '/demo',
    },
  },
} as const

export type Config = typeof config
