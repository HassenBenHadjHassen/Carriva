import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UploadForm } from "@/components/UploadForm"
import { FileText, CheckCircle2 } from "lucide-react"

export default async function ProfilePage() {
  const user = await requireUser()

  const profile = await prisma.careerProfile.findFirst({
    where: { userId: user.id },
    orderBy: { version: 'desc' },
    include: {
      experiences: true,
      educations: true,
    }
  })

  const userSkills = await prisma.userSkill.findMany({
    where: { userId: user.id },
    include: { skill: true }
  })

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Career Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your foundational career information.</p>
      </div>

      {!profile ? (
        <Card className="border-dashed flex flex-col items-center justify-center p-8 text-center bg-muted/10 max-w-2xl mx-auto">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No profile found</h2>
          <p className="text-muted-foreground mb-8">
            Upload your existing CV to generate your master career profile. This will be used as the factual basis for all your tailored applications.
          </p>
          <div className="w-full text-left">
            <UploadForm onProfileCreated={() => {}} />
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Profile Active (v{profile.version})
              </CardTitle>
              <CardDescription>
                We have extracted {profile.experiences.length} experiences, {profile.educations.length} education entries, and {userSkills.length} skills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg mb-4">Extracted Skills</h3>
              <div className="flex flex-wrap gap-2">
                {userSkills.slice(0, 30).map((us) => (
                  <Badge key={us.id} variant="secondary">
                    {us.skill.normalizedName}
                  </Badge>
                ))}
                {userSkills.length > 30 && (
                  <Badge variant="outline">+{userSkills.length - 30} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
