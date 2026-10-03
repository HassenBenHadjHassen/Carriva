"use client"

import Link from "next/link"
import { Briefcase } from "lucide-react"
import { Button } from "../ui/button"
import { authClient } from "../../lib/auth-client"

export function Navbar() {
  const { data: session } = authClient.useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Briefcase className="h-5 w-5 text-primary" />
          <span>Carriva</span>
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
