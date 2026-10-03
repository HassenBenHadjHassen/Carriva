import Link from "next/link"
import { Button } from "../components/ui/button"
import { Briefcase } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="rounded-full bg-primary/10 p-4 mb-6">
        <Briefcase className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">404</h1>
      <h2 className="text-xl font-semibold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}
