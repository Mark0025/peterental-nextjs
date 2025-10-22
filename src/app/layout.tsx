import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/navigation"
import { Providers } from "./providers"
import { ClerkProvider } from "@clerk/nextjs"
import ProtectedRoute from "@/components/auth/protected-route"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "PeteRental - Voice AI Property Management",
  description: "Rental property management with VAPI voice AI integration",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Providers>
            <ProtectedRoute>
              <Navigation />
              <main>{children}</main>
            </ProtectedRoute>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
