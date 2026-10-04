"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { Logo } from "../ui/Logo"
import { authClient } from "../../lib/auth-client"

export function Navbar() {
  const { data: session } = authClient.useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center px-4">
        <Link href="/" className="flex items-center text-foreground transition-opacity hover:opacity-90">
          <Logo className="h-7 w-auto" />
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Can put navigation links here if needed */}
          </div>
          <nav className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
