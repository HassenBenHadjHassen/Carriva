"use client"

import { useState } from "react"
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"

interface UploadFormProps {
  onProfileCreated?: (profileId: string) => void
}

export function UploadForm({ onProfileCreated }: UploadFormProps = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setMessage("Reading your CV...")
    setSuccess(false)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload-cv", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload CV")
      }

      setSuccess(true)
      setMessage("CV successfully extracted.")
      if (onProfileCreated) {
        onProfileCreated(data.profileId)
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setIsUploading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-green-900">Career Profile Ready</h3>
            <p className="text-sm text-green-700 mt-1">We have extracted your professional experience.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload your CV</CardTitle>
        <CardDescription>
          Provide your existing CV to serve as the factual foundation for your tailored applications. We support PDF and TXT formats.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label
          className={`flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed transition-colors ${
            isUploading ? "border-primary/50 bg-primary/5 cursor-wait" : "border-muted-foreground/25 bg-muted/20 hover:bg-muted/50 hover:border-primary/50 cursor-pointer"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <FileText className="w-10 h-10 mb-3 text-primary animate-pulse" />
            ) : (
              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
            )}
            <p className="mb-2 text-sm font-medium">
              {isUploading ? "Processing..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isUploading ? "Extracting career information securely" : "PDF or TXT (Max 10MB)"}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
        
        {message && !success && (
          <div className={`mt-4 text-sm font-medium ${message.includes("failed") || message.includes("Error") ? "text-destructive" : "text-primary"}`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
