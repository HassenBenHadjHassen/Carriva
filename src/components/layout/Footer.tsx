import Link from "next/link"
import { Briefcase } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-12 md:py-16">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row md:items-start">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Briefcase className="h-5 w-5 text-primary" />
            <span>Carriva</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Precision CV tailoring for modern professionals.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Product</h4>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
              Sign Up
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Legal</h4>
            <span className="text-sm text-muted-foreground">Privacy Policy</span>
            <span className="text-sm text-muted-foreground">Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-12 max-w-6xl px-4 text-center text-sm text-muted-foreground md:text-left">
        &copy; {new Date().getFullYear()} Carriva. Built for efficiency.
      </div>
    </footer>
  )
}
