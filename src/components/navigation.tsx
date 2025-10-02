'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navStyle = {
    background: '#2d72d2',
    padding: '12px 0 8px 0',
    textAlign: 'center' as const,
    marginBottom: '32px'
  };

  const linkStyle = {
    color: '#fff',
    margin: '0 18px',
    textDecoration: 'none',
    fontWeight: 'bold' as const,
    fontSize: '14px'
  };

  const activeLinkStyle = {
    ...linkStyle,
    textDecoration: 'underline'
  };

  return (
    <nav style={navStyle}>
      <Link
        href="/"
        style={pathname === '/' ? activeLinkStyle : linkStyle}
      >
        Home
      </Link>
      <Link
        href="/dashboard"
        style={pathname.startsWith('/dashboard') ? activeLinkStyle : linkStyle}
      >
        Rentals
      </Link>
      <Link
        href="/calendar"
        style={pathname.startsWith('/calendar') ? activeLinkStyle : linkStyle}
      >
        Calendar
      </Link>
      <Link
        href="/users"
        style={pathname.startsWith('/users') ? activeLinkStyle : linkStyle}
      >
        Users
      </Link>
      <Link
        href="/vapi-testing"
        style={pathname.startsWith('/vapi-testing') ? activeLinkStyle : linkStyle}
      >
        VAPI Testing
      </Link>
      <Link
        href="/api-endpoints"
        style={pathname.startsWith('/api-endpoints') ? activeLinkStyle : linkStyle}
      >
        API Docs
      </Link>
    </nav>
  );
}
