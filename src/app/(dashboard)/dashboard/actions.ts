"use server"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function deleteApplication(applicationId: string, shouldRedirect: boolean = false) {
  const user = await requireUser()
  
  await prisma.application.delete({
    where: {
      id: applicationId,
      userId: user.id
    }
  })

  revalidatePath("/dashboard")
  
  if (shouldRedirect) {
    redirect("/dashboard")
  }
}
