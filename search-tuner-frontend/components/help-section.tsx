"use client"

import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

interface HelpStep {
  step: number
  title: string
  description: string
}

interface HelpFeature {
  title: string
  description: string
}

interface HelpSectionProps {
  steps: HelpStep[]
  features?: HelpFeature[]
}

export function HelpSection({ steps, features }: HelpSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="h-4 w-4 shrink-0" />
        <span>사용 방법</span>
        {open ? (
          <ChevronDown className="h-4 w-4 ml-auto" />
        ) : (
          <ChevronRight className="h-4 w-4 ml-auto" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {features && features.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                이 페이지에서 확인할 수 있는 것
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {features.map((f, i) => (
                  <div key={i} className="rounded-md border border-border bg-background px-3 py-2">
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              사용 순서
            </p>
            <ol className="space-y-3">
              {steps.map((s) => (
                <li key={s.step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {s.step}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
