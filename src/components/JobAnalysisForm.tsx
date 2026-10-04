"use client"

import { useState } from "react"
import { JobAnalysisType } from "../ai/schemas"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Loader2, Zap } from "lucide-react"

interface JobAnalysisFormProps {
  profileId: string | null
  onAnalysisComplete?: (applicationId: string, analysis: JobAnalysisType) => void
}

export function JobAnalysisForm({ profileId, onAnalysisComplete }: JobAnalysisFormProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{ job: { title: string; company: string; }; analysis: JobAnalysisType } | null>(null)
  const [error, setError] = useState("")

  async function handleAnalyze() {
    if (!profileId) {
      setError("Please upload your CV first to create a profile.")
      return
    }
    if (!jobDescription.trim()) {
      setError("Please paste a job description.")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, jobDescription })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze job")
      }

      setResult(data)
      if (onAnalysisComplete) {
        onAnalysisComplete(data.applicationId, data.analysis)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Target Job Description</CardTitle>
        <CardDescription>
          Paste the description of the role you are applying for. We will analyze the requirements against your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          className="min-h-[160px] resize-y"
          placeholder="e.g. Senior Frontend Engineer at Acme Corp... (Paste the full job description here)"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={isAnalyzing}
        />
        
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        {!profileId && (
          <p className="text-sm text-muted-foreground">You must upload your CV before analyzing a job.</p>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 border-t px-6 py-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Analysis takes approximately 5-10 seconds.
        </p>
        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || !profileId || !jobDescription.trim()}
          className="w-full sm:w-auto"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing the role...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Analyze Match
            </>
          )}
        </Button>
      </CardFooter>
      
      {result && (
        <div className="border-t">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Extracted Role</h3>
              <p className="text-lg font-semibold">{result.job.title} <span className="text-muted-foreground font-normal">at</span> {result.job.company}</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 rounded-lg border bg-card p-4">
                <h3 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-600"></span>
                  Matched Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.matched.length === 0 && <span className="text-xs text-muted-foreground">None identified</span>}
                  {result.analysis.matched.map(skill => (
                    <Badge key={skill} variant="outline" className="bg-green-50 text-green-700 border-green-200">{skill}</Badge>
                  ))}
                </div>
                
                {(result.analysis.meetsEducation !== undefined || result.analysis.meetsExperience !== undefined) && (
                  <div className="mt-4 pt-4 border-t border-green-100 flex flex-col gap-2">
                    {result.analysis.meetsEducation === true && (
                      <span className="text-xs font-medium text-green-700 flex items-center gap-1">✓ Meets Education</span>
                    )}
                    {result.analysis.meetsExperience === true && (
                      <span className="text-xs font-medium text-green-700 flex items-center gap-1">✓ Meets Experience</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-lg border bg-card p-4">
                <h3 className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                  Inferred from Experience
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.inferred?.length === 0 && <span className="text-xs text-muted-foreground">None identified</span>}
                  {result.analysis.inferred?.map(skill => (
                    <Badge key={skill} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-card p-4">
                <h3 className="text-sm font-semibold text-yellow-600 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-yellow-600"></span>
                  Requires Confirmation
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.unknown.length === 0 && <span className="text-xs text-muted-foreground">None identified</span>}
                  {result.analysis.unknown.map(skill => (
                    <Badge key={skill} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-card p-4">
                <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-600"></span>
                  Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.missing.length === 0 && <span className="text-xs text-muted-foreground">None identified</span>}
                  {result.analysis.missing.map(skill => (
                    <Badge key={skill} variant="outline" className="bg-red-50 text-red-700 border-red-200">{skill}</Badge>
                  ))}
                </div>

                {(result.analysis.meetsEducation === false || result.analysis.meetsExperience === false) && (
                  <div className="mt-4 pt-4 border-t border-red-100 flex flex-col gap-2">
                    {result.analysis.meetsEducation === false && (
                      <span className="text-xs font-medium text-red-700 flex items-center gap-1">✕ Missing Education</span>
                    )}
                    {result.analysis.meetsExperience === false && (
                      <span className="text-xs font-medium text-red-700 flex items-center gap-1">✕ Missing Experience</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      )}
    </Card>
  )
}
