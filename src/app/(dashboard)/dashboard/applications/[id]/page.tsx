import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Briefcase, FileText, CheckCircle2 } from "lucide-react"
import { DocumentGenerator } from "@/components/DocumentGenerator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { DiscardApplicationButton } from "@/components/DiscardApplicationButton"

export default async function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id: appId } = await params

  const application = await prisma.application.findUnique({
    where: { id: appId, userId: user.id },
    include: {
      job: true,
      profile: true,
      generatedResumes: true,
      generatedCoverLetters: true,
    }
  })

  if (!application) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div>
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{application.job?.title || "Untitled Role"}</h1>
            <p className="text-xl text-muted-foreground mt-1">{application.job?.company || "Unknown Company"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${application.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-secondary text-secondary-foreground'}`}>
              {application.status === 'completed' ? 'Completed' : 'Draft'}
            </span>
            <DiscardApplicationButton applicationId={application.id} shouldRedirect={true} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <DocumentGenerator 
            applicationId={application.id} 
            disabled={false} 
            initialHasCV={application.generatedResumes.length > 0} 
            initialHasCoverLetter={application.generatedCoverLetters.length > 0}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">{application.job?.description || "No job description provided."}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium leading-none mb-1">Target Role</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{application.job?.title}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium leading-none mb-1">Source Profile</p>
                  <p className="text-sm text-muted-foreground">Version {application.profile?.version}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium leading-none mb-1">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {application.status === 'completed' ? 'Ready to apply' : 'Incomplete'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
