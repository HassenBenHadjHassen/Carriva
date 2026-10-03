"use client"

import { useState } from "react"
import { deleteApplication } from "@/app/(dashboard)/dashboard/actions"
import { Button } from "./ui/button"
import { Trash2, Loader2 } from "lucide-react"

interface DiscardApplicationButtonProps {
  applicationId: string
  shouldRedirect?: boolean
}

export function DiscardApplicationButton({ applicationId, shouldRedirect = false }: DiscardApplicationButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDiscard() {
    if (!confirm("Are you sure you want to discard this application?")) return
    setIsDeleting(true)
    try {
      await deleteApplication(applicationId, shouldRedirect)
    } catch (e) {
      // If it's a redirect, NEXT_REDIRECT error will be thrown, which is expected
      if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) {
        throw e
      }
      console.error(e)
      setIsDeleting(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleDiscard}
      disabled={isDeleting}
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="sr-only">Discard</span>
    </Button>
  )
}
