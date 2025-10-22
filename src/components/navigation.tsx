'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

interface NavItem {
  href: string
  label: string
  matchExact?: boolean
  badge?: string
  color?: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', matchExact: true },
  { href: '/dashboard', label: 'Properties', color: 'bg-blue-600' },
  { href: '/appointments', label: 'Appointments', color: 'bg-purple-600' },
  { href: '/agent-builder', label: 'Agent Builder', color: 'bg-indigo-600', badge: 'NEW' },
  { href: '/users', label: 'Users', color: 'bg-green-600' },
  { href: '/vapi-agent', label: 'Voice AI', color: 'bg-pink-600' },
  { href: '/test-suite', label: 'Test Suite', color: 'bg-orange-600' },
  { href: '/debug-clerk', label: 'Debug Clerk', color: 'bg-red-600' },
]

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (item: NavItem): boolean => {
    if (item.matchExact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <nav
      className="mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-4 shadow-lg"
      aria-label="Main navigation"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4">
        {/* Navigation Links */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {navItems.map((item) => {
            const active = isActive(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-200',
                  'hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white',
                  active && 'bg-white/30 scale-105 shadow-lg'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-gray-900">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Authentication Section */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="rounded-lg bg-white/20 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-600 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-white shadow-lg border border-gray-200",
                  userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-100",
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}
