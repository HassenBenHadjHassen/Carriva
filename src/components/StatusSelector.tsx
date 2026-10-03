"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

export const STATUSES = [
  { value: "Draft",     label: "Draft",       color: "bg-secondary text-secondary-foreground" },
  { value: "Applied",  label: "Applied",      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "Interview",label: "Interview",    color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  { value: "Offer",    label: "Offer",        color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { value: "Rejected", label: "Rejected",     color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  { value: "Archived", label: "Archived",     color: "bg-muted text-muted-foreground" },
] as const

export type AppStatus = typeof STATUSES[number]["value"]

interface Props {
  applicationId: string
  initialStatus: string
}

export function StatusSelector({ applicationId, initialStatus }: Props) {
  const [status, setStatus] = useState<AppStatus>(initialStatus as AppStatus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const current = STATUSES.find(s => s.value === status) ?? STATUSES[0]

  async function changeStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as AppStatus
    if (next === status) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setStatus(next)
    } catch {
      setError("Could not update status")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="relative inline-flex items-center">
        {saving ? (
          <div className="absolute left-3 flex h-full items-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </div>
        ) : (
          <div className="absolute left-3 h-2 w-2 rounded-full bg-current opacity-70 pointer-events-none" />
        )}
        <select
          value={status}
          onChange={changeStatus}
          disabled={saving}
          className={`appearance-none pl-7 pr-8 py-1.5 text-sm font-semibold rounded-md border-0 focus:ring-2 focus:ring-ring outline-none transition-colors cursor-pointer ${current.color}`}
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value} className="bg-background text-foreground">
              {s.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 flex h-full items-center opacity-60">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

