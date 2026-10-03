"use client"

import { useState } from "react"
import { UploadForm } from "./UploadForm"
import { JobAnalysisForm } from "./JobAnalysisForm"
import { SkillConfirmation } from "./SkillConfirmation"
import { DocumentGenerator } from "./DocumentGenerator"
import { JobAnalysisType } from "../ai/schemas"
import { CheckCircle2, ChevronRight, FileText } from "lucide-react"

interface DashboardFlowProps {
  initialProfileId?: string
}

export function DashboardFlow({ initialProfileId }: DashboardFlowProps) {
  const [profileId, setProfileId] = useState<string | null>(initialProfileId || null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<JobAnalysisType | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const steps = [
    { num: 1, title: "Career Profile", active: true, completed: !!profileId },
    { num: 2, title: "Job Analysis", active: !!profileId, completed: !!analysis },
    { num: 3, title: "Verify Skills", active: !!analysis, completed: isConfirmed },
    { num: 4, title: "Tailored Application", active: isConfirmed, completed: false },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Application</h1>
        <p className="text-muted-foreground mt-2">
          Tailor your CV and cover letter for a specific job posting in 4 steps.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="hidden sm:flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors ${
              step.completed ? "bg-primary border-primary text-primary-foreground" :
              step.active ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground/50 bg-muted/20"
            }`}>
              {step.completed ? <CheckCircle2 className="w-5 h-5" /> : step.num}
            </div>
            <span className={`ml-3 text-sm font-medium ${step.active || step.completed ? "text-foreground" : "text-muted-foreground/50"}`}>
              {step.title}
            </span>
            {idx < steps.length - 1 && (
              <ChevronRight className="w-5 h-5 mx-4 text-muted-foreground/30" />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-12">
        {/* Step 1: Profile Creation / CV Upload */}
        <section className={`transition-opacity duration-300 ${!profileId ? "opacity-100" : "opacity-60 hover:opacity-100"}`}>
          <div className="flex items-center gap-2 mb-4 sm:hidden">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
            <h2 className="text-lg font-semibold">Career Profile</h2>
          </div>
          <UploadForm onProfileCreated={setProfileId} />
        </section>

        {/* Step 2: Job Description Analysis */}
        {profileId && (
          <section className={`transition-opacity duration-300 ${!analysis ? "opacity-100" : "opacity-60 hover:opacity-100"}`}>
            <div className="flex items-center gap-2 mb-4 sm:hidden">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
              <h2 className="text-lg font-semibold">Job Analysis</h2>
            </div>
            <JobAnalysisForm 
              profileId={profileId} 
              onAnalysisComplete={(id, result) => {
                setApplicationId(id)
                setAnalysis(result)
              }} 
            />
          </section>
        )}

        {/* Step 3: Skill Confirmation */}
        {applicationId && analysis && (
          <section className={`transition-opacity duration-300 ${!isConfirmed ? "opacity-100" : "opacity-60 hover:opacity-100"}`}>
            <div className="flex items-center gap-2 mb-4 sm:hidden">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
              <h2 className="text-lg font-semibold">Verify Skills</h2>
            </div>
            <SkillConfirmation 
              applicationId={applicationId}
              analysis={analysis}
              onConfirmed={() => setIsConfirmed(true)}
              isConfirmed={isConfirmed}
            />
          </section>
        )}

        {/* Step 4: Generation and Download */}
        {applicationId && isConfirmed && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4 sm:hidden">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</div>
              <h2 className="text-lg font-semibold">Tailored Application</h2>
            </div>
            <DocumentGenerator 
              applicationId={applicationId}
              disabled={false}
            />
          </section>
        )}
      </div>
    </div>
  )
}
