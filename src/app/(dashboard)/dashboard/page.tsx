import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DiscardApplicationButton } from "@/components/DiscardApplicationButton"
import { FileText, Plus, Clock, Briefcase } from "lucide-react"

export default async function DashboardPage() {
  const user = await requireUser()

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: {
      job: true,
      profile: true,
      generatedResumes: true,
    },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-1">Manage your tailored CVs and cover letters.</p>
        </div>
        <Link href="/dashboard/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-muted/10">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No applications yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Tailor your CV to your next job in a few simple steps. We extract your experience and generate factually accurate documents.
          </p>
          <Link href="/dashboard/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Application
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card key={app.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={app.status === 'completed' ? 'default' : 'secondary'} className={app.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                    {app.status === 'completed' ? 'Completed' : 'Draft'}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(app.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="-mt-1 -mr-2">
                    <DiscardApplicationButton applicationId={app.id} />
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-1" title={app.job?.title || "Untitled Role"}>
                  {app.job?.title || "Untitled Role"}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 line-clamp-1" title={app.job?.company || "Unknown Company"}>
                  <Briefcase className="h-3 w-3" />
                  {app.job?.company || "Unknown Company"}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 border-t text-sm flex items-center justify-between">
                <span className="text-muted-foreground">
                  {app.generatedResumes.length > 0 ? "CV Ready" : "In Progress"}
                </span>
                <Link href={`/dashboard/applications/${app.id}`} className="text-primary font-medium hover:underline">
                  View Details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
