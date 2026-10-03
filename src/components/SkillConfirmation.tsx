"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card"
import { Button } from "./ui/button"
import { Loader2, CheckCircle2 } from "lucide-react"

interface SkillConfirmationProps {
  applicationId: string
  analysis: { matched: string[]; missing: string[]; unknown: string[] }
  onConfirmed: () => void
  isConfirmed: boolean
}

type SkillState = "confirmed" | "rejected" | "unknown"
type SkillResponse = { state: SkillState; context?: string }

export function SkillConfirmation({ applicationId, analysis, onConfirmed, isConfirmed }: SkillConfirmationProps) {
  const [responses, setResponses] = useState<Record<string, SkillResponse>>(() => {
    const init: Record<string, SkillResponse> = {}
    analysis.matched.forEach(s => (init[s] = { state: "confirmed" }))
    return init
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const allSkills = [...analysis.missing, ...analysis.unknown]

  function setSkillState(skill: string, state: SkillState) {
    if (isConfirmed) return
    setResponses(prev => ({ ...prev, [skill]: { ...prev[skill], state } }))
  }

  function setSkillContext(skill: string, context: string) {
    if (isConfirmed) return
    setResponses(prev => ({ ...prev, [skill]: { ...prev[skill], context } }))
  }

  async function handleConfirm() {
    setIsSubmitting(true)
    setError("")

    for (const skill of allSkills) {
      if (!responses[skill]) {
        setResponses(prev => ({ ...prev, [skill]: { state: "unknown" } }))
      }
    }

    try {
      const res = await fetch("/api/confirm-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          skillResponses: responses,
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm skills")
      }

      onConfirmed()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSkillBlock = (skill: string, type: "missing" | "unknown") => {
    const response = responses[skill] || { state: undefined }
    const label = type === "missing" ? "Missing Requirement" : "Needs Clarification"
    const labelColor = type === "missing" ? "text-red-600 bg-red-50 border-red-200" : "text-yellow-600 bg-yellow-50 border-yellow-200"

    return (
      <div key={skill} className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${labelColor}`}>
            {label}
          </span>
          <p className="mt-3 text-base">
            Do you have experience with <strong className="font-semibold text-foreground">{skill}</strong>?
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={response.state === "confirmed" ? "default" : "outline"}
            onClick={() => setSkillState(skill, "confirmed")}
            disabled={isConfirmed || isSubmitting}
            className={response.state === "confirmed" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            Yes, I have this
          </Button>
          <Button
            type="button"
            variant={response.state === "rejected" ? "default" : "outline"}
            onClick={() => setSkillState(skill, "rejected")}
            disabled={isConfirmed || isSubmitting}
            className={response.state === "rejected" ? "bg-slate-800 hover:bg-slate-900 text-white" : ""}
          >
            No, I do not
          </Button>
          <Button
            type="button"
            variant={response.state === "unknown" ? "secondary" : "outline"}
            onClick={() => setSkillState(skill, "unknown")}
            disabled={isConfirmed || isSubmitting}
          >
            Not sure
          </Button>
        </div>

        {response.state === "confirmed" && (
          <div className="pt-2 border-t mt-4 space-y-3">
            <p className="text-sm font-medium">Where did you use it?</p>
            <div className="flex flex-wrap gap-2">
              {["Professional", "Freelance", "Personal Project", "Education"].map(ctx => (
                <button
                  key={ctx}
                  type="button"
                  onClick={() => setSkillContext(skill, ctx)}
                  disabled={isConfirmed || isSubmitting}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    response.context === ctx
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {ctx}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const isAllAnswered = allSkills.every(skill => responses[skill]?.state !== undefined)

  if (isConfirmed) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-green-900">Skills Confirmed</h3>
            <p className="text-sm text-green-700 mt-1">We will accurately tailor your application using this verified information.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review Experience</CardTitle>
        <CardDescription>
          Verify the required skills for this job. We only include what you explicitly confirm to ensure factual accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysis.unknown.map(skill => renderSkillBlock(skill, "unknown"))}
        {analysis.missing.map(skill => renderSkillBlock(skill, "missing"))}

        {analysis.unknown.length === 0 && analysis.missing.length === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <span className="font-medium">Perfect match!</span> No additional skills require clarification.
          </div>
        )}

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="bg-muted/20 border-t px-6 py-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {!isAllAnswered ? "Please answer all questions to proceed." : "Ready to generate your application."}
        </p>
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || !isAllAnswered}
          className="w-full sm:w-auto"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm & Save
        </Button>
      </CardFooter>
    </Card>
  )
}
