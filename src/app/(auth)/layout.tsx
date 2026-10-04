import Link from "next/link"
import { Button } from "../../components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Logo } from "../../components/ui/Logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </Link>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="mb-3 transition-opacity hover:opacity-90">
            <Logo className="h-9 w-auto" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Carriva</h1>
          <p className="text-sm text-muted-foreground">
            Sign in or create an account to continue.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
