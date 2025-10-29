'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
// TODO: Uncomment when implementing RBAC: import { useUser as useClerkUser } from '@clerk/nextjs'
import { useUser } from '@/lib/hooks/use-user'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Calendar, CheckCircle2, XCircle } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  matchExact?: boolean
  badge?: string
  color?: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', matchExact: true },
  { href: '/dashboard', label: 'Dashboard', color: 'bg-blue-600' },
  { href: '/calendar/events', label: 'Calendar', color: 'bg-green-600' },
  { href: '/rentals', label: 'Rentals', color: 'bg-purple-600' },
  { href: '/agent-builder', label: 'Agents', color: 'bg-indigo-600' },
  { href: '/users', label: 'Profile', color: 'bg-teal-600' },
]

const adminNavItems: NavItem[] = [
  { href: '/admin/testing', label: 'Admin Testing', color: 'bg-red-600', badge: 'ADMIN' },
]

export default function Navigation() {
  const pathname = usePathname()
  // const { user: clerkUser } = useClerkUser() // TODO: Use when implementing proper RBAC
  const { calendarConnected, isLoading: isUserLoading } = useUser()
  const { user } = useCurrentUser()

  // Check if user is admin (TODO: Get from backend user data via /users/me endpoint)
  // Temporary: Check if email includes 'mark@'
  const isAdmin = user?.email?.includes('mark@') || false

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
          {/* Main Navigation */}
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

          {/* Admin Navigation */}
          {isAdmin && adminNavItems.map((item) => {
            const active = isActive(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-200',
                  'hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white',
                  'border-2 border-red-400',
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
        <div className="flex items-center gap-3">
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
            {/* User Status Indicators */}
            <div className="flex items-center gap-3">
              {/* Calendar Status */}
              {!isUserLoading && (
                <Link
                  href="/users"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                    calendarConnected
                      ? "bg-green-500/20 text-white hover:bg-green-500/30"
                      : "bg-yellow-500/20 text-white hover:bg-yellow-500/30"
                  )}
                  title={calendarConnected ? "Calendar connected" : "Connect your calendar"}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {calendarConnected ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      <span className="hidden sm:inline">Connect</span>
                    </>
                  )}
                </Link>
              )}

              {/* Admin Badge */}
              {isAdmin && (
                <div className="rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-gray-900">
                  ADMIN
                </div>
              )}

              {/* User Button */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-2 ring-white/30",
                    userButtonPopoverCard: "bg-white shadow-lg border border-gray-200",
                    userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-100",
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}
