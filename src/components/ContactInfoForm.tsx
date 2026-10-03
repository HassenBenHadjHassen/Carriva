"use client"

import { useState } from "react"
import { User, Mail, Phone, Globe, GitBranch, Link2, MapPin, Pencil, Check, X, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

interface ContactField {
  key: keyof ContactData
  label: string
  icon: React.ReactNode
  placeholder: string
  type?: string
}

interface ContactData {
  name: string
  phone: string
  website: string
  github: string
  linkedin: string
  location: string
}

const FIELDS: ContactField[] = [
  { key: "name",     label: "Full Name",      icon: <User       className="h-4 w-4" />, placeholder: "Hassen Ben Hadj Hassen" },
  { key: "phone",    label: "Phone",          icon: <Phone      className="h-4 w-4" />, placeholder: "+33 7 51 06 04 00",        type: "tel" },
  { key: "website",  label: "Website",        icon: <Globe      className="h-4 w-4" />, placeholder: "https://yoursite.com",     type: "url" },
  { key: "github",   label: "GitHub",         icon: <GitBranch  className="h-4 w-4" />, placeholder: "https://github.com/you",  type: "url" },
  { key: "linkedin", label: "LinkedIn",       icon: <Link2      className="h-4 w-4" />, placeholder: "https://linkedin.com/in/you", type: "url" },
  { key: "location", label: "Location",       icon: <MapPin     className="h-4 w-4" />, placeholder: "Paris, France" },
]

interface Props {
  initialData: Partial<ContactData>
}

export function ContactInfoForm({ initialData }: Props) {
  const [data, setData] = useState<ContactData>({
    name:     initialData.name     ?? "",
    phone:    initialData.phone    ?? "",
    website:  initialData.website  ?? "",
    github:   initialData.github   ?? "",
    linkedin: initialData.linkedin ?? "",
    location: initialData.location ?? "",
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState<ContactData>(data)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState("")

  function startEdit() {
    setDraft({ ...data })
    setEditing(true)
    setError("")
  }

  function cancelEdit() {
    setEditing(false)
    setError("")
  }

  async function save() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/update-contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to save")
      }
      setData({ ...draft })
      setEditing(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const isEmpty = FIELDS.every(f => !data[f.key])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
          <CardDescription>
            This information is used to populate your CV header and cover letter.
          </CardDescription>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEdit} className="shrink-0">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    {f.icon}
                    {f.label}
                  </label>
                  <Input
                    type={f.type ?? "text"}
                    value={draft[f.key]}
                    onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="h-9"
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-6 text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No contact info yet.</p>
            <p className="text-xs mt-1">Upload a CV to auto-extract it, or click <strong>Edit</strong> to enter it manually.</p>
          </div>
        ) : (
          <dl className="grid gap-2 sm:grid-cols-2">
            {FIELDS.map(f => {
              const val = data[f.key]
              if (!val) return null
              const isLink = f.type === "url"
              return (
                <div key={f.key} className="flex items-center gap-2.5 min-w-0">
                  <span className="text-muted-foreground shrink-0">{f.icon}</span>
                  {isLink ? (
                    <a
                      href={val.startsWith("http") ? val : `https://${val}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm truncate text-primary hover:underline underline-offset-2"
                    >
                      {val.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="text-sm truncate">{val}</span>
                  )}
                </div>
              )
            })}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
