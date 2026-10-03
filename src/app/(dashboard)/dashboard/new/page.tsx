import { DashboardFlow } from "@/components/DashboardFlow"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function NewApplicationPage() {
  const user = await requireUser()

  const latestProfile = await prisma.careerProfile.findFirst({
    where: { userId: user.id },
    orderBy: { version: 'desc' }
  })

  return (
    <div className="w-full h-full flex justify-center">
      <DashboardFlow initialProfileId={latestProfile?.id} />
    </div>
  )
}
