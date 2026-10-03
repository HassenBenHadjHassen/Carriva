"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card"
import { Button } from "./ui/button"
import { Loader2, Download, FileText, Mail } from "lucide-react"

interface DocumentGeneratorProps {
  applicationId: string
  disabled: boolean
}

export function DocumentGenerator({ applicationId, disabled }: DocumentGeneratorProps) {
  const [isGeneratingCV, setIsGeneratingCV] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [cvResult, setCvResult] = useState<{ id: string } | null>(null)
  const [coverLetterResult, setCoverLetterResult] = useState<{ id: string } | null>(null)
  const [error, setError] = useState("")

  async function generateDocument(type: "cv" | "cover-letter") {
    const isCV = type === "cv"
    if (isCV) setIsGeneratingCV(true)
    else setIsGeneratingCoverLetter(true)
    
    setError("")

    try {
      const res = await fetch(`/api/generate-${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || `Failed to generate ${type}`)
      }

      if (isCV) setCvResult(data.document)
      else setCoverLetterResult(data.document)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (isCV) setIsGeneratingCV(false)
      else setIsGeneratingCoverLetter(false)
    }
  }

  function handleDownloadPDF() {
    window.open(`/api/download-pdf?applicationId=${applicationId}`, "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generate Application</CardTitle>
        <CardDescription>
          Create a factually accurate, beautifully formatted CV and cover letter tailored specifically to this role.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* CV Generator */}
          <div className={`rounded-xl border p-6 flex flex-col items-center justify-center text-center space-y-4 transition-colors ${cvResult ? "bg-green-50/50 border-green-200" : "bg-card"}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${cvResult ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Tailored CV</h3>
              <p className="text-sm text-muted-foreground mt-1">Highlights your most relevant experience.</p>
            </div>
            
            {!cvResult ? (
              <Button
                onClick={() => generateDocument("cv")}
                disabled={disabled || isGeneratingCV}
                variant="outline"
                className="w-full mt-2"
              >
                {isGeneratingCV ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Tailoring CV...</>
                ) : (
                  "Generate CV"
                )}
              </Button>
            ) : (
              <div className="w-full mt-2 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                Generated Successfully
              </div>
            )}
          </div>

          {/* Cover Letter Generator */}
          <div className={`rounded-xl border p-6 flex flex-col items-center justify-center text-center space-y-4 transition-colors ${coverLetterResult ? "bg-green-50/50 border-green-200" : "bg-card"}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${coverLetterResult ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Cover Letter</h3>
              <p className="text-sm text-muted-foreground mt-1">A professional introduction aligned with the role.</p>
            </div>
            
            {!coverLetterResult ? (
              <Button
                onClick={() => generateDocument("cover-letter")}
                disabled={disabled || isGeneratingCoverLetter}
                variant="outline"
                className="w-full mt-2"
              >
                {isGeneratingCoverLetter ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Writing Letter...</>
                ) : (
                  "Generate Cover Letter"
                )}
              </Button>
            ) : (
              <div className="w-full mt-2 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                Generated Successfully
              </div>
            )}
          </div>
        </div>
        
        {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
      </CardContent>
      
      {(cvResult || coverLetterResult) && (
        <CardFooter className="bg-muted/20 border-t px-6 py-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Documents are ready for review and export.
          </p>
          <Button onClick={handleDownloadPDF} className="w-full sm:w-auto" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
