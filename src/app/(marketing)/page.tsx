import Link from "next/link"
import { Button } from "../../components/ui/button"
import { ArrowRight, CheckCircle2, FileText, Zap, Shield } from "lucide-react"

export const metadata = {
  title: "Carriva - Precision CV Tailoring",
  description: "Generate factually accurate, targeted CVs and cover letters by matching your existing experience to job descriptions.",
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full px-4 py-24 md:py-32 lg:py-40 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Tailor your application to <br className="hidden sm:inline" />
            <span className="text-primary">the exact job description.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Carriva analyzes your existing CV and the target job description to highlight your most relevant experience. No fabricated qualifications. No generic AI templates. Just your career, presented perfectly.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto font-semibold gap-2">
                Start Tailoring <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full px-4 py-20 bg-background border-t">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Carriva works</h2>
            <p className="mt-4 text-muted-foreground">A focused workflow for professional applications.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Upload your CV</h3>
              <p className="text-muted-foreground text-sm">
                We extract your factual career history securely. You remain the source of truth.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Analyze the Job</h3>
              <p className="text-muted-foreground text-sm">
                Paste the target job description. We identify matching requirements and ask you to confirm uncertain skills.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Generate & Download</h3>
              <p className="text-muted-foreground text-sm">
                Review your tailored CV and cover letter, perfectly aligned with the role, ready to download as a clean PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Factuality */}
      <section className="w-full px-4 py-20 bg-muted/40 border-t">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">Built on factual accuracy.</h2>
          <p className="text-muted-foreground text-lg mb-8">
            AI should assist you, not misrepresent you. Carriva strictly refuses to invent experience or fabricate qualifications. Every tailored document is directly sourced from the information you provide and confirm.
          </p>
        </div>
      </section>
    </div>
  )
}
