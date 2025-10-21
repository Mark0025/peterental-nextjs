// Site configuration

export const siteConfig = {
  name: "PeteRental",
  description: "Rental property management with VAPI voice AI integration",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://peterental-nextjs.vercel.app",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  links: {
    github: "https://github.com/markcarpenter/peterental-nextjs",
    backend: "https://peterental-vapi-github-newer.onrender.com",
    backendDocs: "https://peterental-vapi-github-newer.onrender.com/docs",
  },
  features: {
    multiUser: true, // Enable multi-user support
    vapiIntegration: true, // VAPI voice AI
    calendarIntegration: true, // Microsoft Calendar
    rentalSearch: true, // Rental property search
  },
} as const

export type SiteConfig = typeof siteConfig

