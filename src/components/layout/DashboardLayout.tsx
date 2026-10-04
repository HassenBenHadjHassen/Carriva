"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Briefcase, Settings, LogOut, Loader2, Home } from "lucide-react"
import { cn } from "../../lib/utils"
import { authClient } from "../../lib/auth-client"
import { Logo } from "../ui/Logo"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Applications", href: "/dashboard/applications", icon: Briefcase },
    { name: "Career Profile", href: "/dashboard/profile", icon: FileText },
  ]

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/"
        },
      },
    })
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    // Ideally this shouldn't render because of middleware or route protection,
    // but we can fallback to redirecting
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center text-foreground transition-opacity hover:opacity-90">
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
            <button
              onClick={handleSignOut}
              className="mt-3 flex items-center gap-2 text-xs text-destructive hover:underline"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex flex-col md:hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center text-foreground transition-opacity hover:opacity-90">
            <Logo className="h-6 w-auto" />
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "transition-colors",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col p-4 md:p-8 lg:p-12 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
