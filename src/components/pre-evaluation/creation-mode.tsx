"use client"

import { useState } from "react"
import { usePreEvalStore } from "@/lib/store/pre-evaluation-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  History,
  PlusCircle,
  ArrowLeft,
  Calendar,
  Star,
  Sparkles,
  Clock,
  Target,
  CheckCircle2,
  Eye,
  ArrowRight,
  FileText,
  ListChecks,
  Layers,
  Users,
} from "lucide-react"
import {
  MOCK_HISTORY,
  CO_DEFINITIONS,
  type HistoricalAssignment,
  type COStrength,
} from "@/lib/store/pre-evaluation-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const strengthClasses: Record<COStrength, string> = {
  Strong: "border-[color:var(--status-success)]/30 text-[color:var(--status-success)]/80 bg-[color:var(--status-success)]/[0.04]",
  Moderate: "border-[color:var(--status-warning)]/30 text-[color:var(--status-warning)]/80 bg-[color:var(--status-warning)]/[0.04]",
  Weak: "border-muted-foreground/20 text-muted-foreground/60 bg-muted/20",
}

export function CreationMode() {
  const { creationMode, selectedCourse, setCreationMode, selectedHistoryId, selectHistory, nextStep, prevStep } = usePreEvalStore()
  const [previewId, setPreviewId] = useState<string | null>(null)

  const handleModeSelect = (mode: "history" | "scratch" | "suggestions") => {
    setCreationMode(mode)
    if (mode === "scratch" || mode === "suggestions") {
      nextStep()
    }
  }

  const handleHistorySelect = (id: string) => {
    selectHistory(id)
    nextStep()
  }

  const similarHistory = selectedCourse
    ? MOCK_HISTORY.filter(h => h.course === selectedCourse)
    : MOCK_HISTORY
  const similarCount = similarHistory.length
  const lastUsed = similarHistory[0]?.lastUsed ?? "recently"

  const displayed = similarHistory.length > 0 ? similarHistory : MOCK_HISTORY
  const bestMatches = displayed.filter(h => h.bestMatch).slice(0, 3)
  const rest = displayed.filter(h => !bestMatches.includes(h))
  const previewed = previewId ? MOCK_HISTORY.find(h => h.id === previewId) ?? null : null

  const showHistoryList = creationMode === "history" && !selectedHistoryId

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => creationMode ? setCreationMode(null) : prevStep()} className="gap-2 px-3 text-muted-foreground hover:text-foreground group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="eyebrow">{creationMode ? "Back" : "Back to courses"}</span>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-4xl font-semibold tracking-tight secondary-text">
          {showHistoryList ? "Pick an assignment to adapt" : "How would you like to start?"}
        </h1>
        <p className="eyebrow text-base text-muted-foreground font-medium opacity-70 border-b border-border/10 pb-6">
          {showHistoryList
            ? `${displayed.length} past assignments for ${selectedCourse ?? "this course"} — we'll copy the structure and rubric so you can tweak.`
            : "Pick a starting point — we'll adapt the rest with you."}
        </p>
      </div>

      {!showHistoryList ? (
        <div className="grid gap-5 md:grid-cols-3">
          {/* Option 1 — History */}
          <Card
            className="group cursor-pointer hover:border-primary/40 transition-all border border-border/40 bg-card p-4 flex flex-col shadow-none"
            onClick={() => handleModeSelect("history")}
          >
            <CardHeader className="pb-2">
              <div className="mb-4">
                <div className="p-3 w-fit rounded-full bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <History className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight">Use an existing assignment</CardTitle>
              <CardDescription className="text-sm font-medium leading-relaxed mt-3 opacity-70">
                We&apos;ll show relevant assignments you can adapt — fastest way to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-6 px-0">
              <div className="flex flex-col gap-2 pt-4 border-t border-border/10">
                <div className="eyebrow flex items-center gap-2 text-muted-foreground opacity-60">
                  <Sparkles className="h-3 w-3 text-primary/60" />
                  <span>{similarCount} similar assignments available</span>
                </div>
                <div className="eyebrow flex items-center gap-2 text-muted-foreground opacity-40">
                  <Clock className="h-3 w-3" />
                  <span>Last used {lastUsed}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Option 2 — Suggestions (RECOMMENDED) */}
          <Card
            className="group relative cursor-pointer transition-all border-2 border-primary/30 bg-primary/[0.02] p-4 flex flex-col shadow-none hover:border-primary/60 hover:bg-primary/[0.04] overflow-hidden"
            onClick={() => handleModeSelect("suggestions")}
          >
            <div className="absolute top-4 right-4 z-10">
              <Badge className="eyebrow bg-primary text-primary-foreground border-0 rounded-full px-2 py-0.5 gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                Recommended
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <div className="mb-4">
                <div className="p-3 w-fit rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight">Start with suggestions</CardTitle>
              <CardDescription className="text-sm font-medium leading-relaxed mt-3 opacity-80">
                We&apos;ll suggest the best assignment formats for this course — based on outcomes and past usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-6 px-0">
              <div className="flex flex-col gap-2 pt-4 border-t border-primary/10">
                <div className="eyebrow flex items-center gap-2 text-primary/70">
                  <Users className="h-3 w-3" />
                  <span>Most instructors choose this</span>
                </div>
                <div className="eyebrow flex items-center gap-2 text-muted-foreground opacity-50">
                  <span className="h-1 w-1 rounded-full bg-primary/60" />
                  <span>Tailored to your course outcomes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Option 3 — Scratch */}
          <Card
            className="group cursor-pointer hover:border-primary/40 transition-all border border-border/40 bg-card p-4 flex flex-col shadow-none"
            onClick={() => handleModeSelect("scratch")}
          >
            <CardHeader className="pb-2">
              <div className="mb-4">
                <div className="p-3 w-fit rounded-full bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <PlusCircle className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight">Create from scratch</CardTitle>
              <CardDescription className="text-sm font-medium leading-relaxed mt-3 opacity-70">
                We&apos;ll guide you step-by-step as you build — full control over every detail.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-6 px-0">
              <div className="flex flex-col gap-2 pt-4 border-t border-border/10">
                <div className="eyebrow flex items-center gap-2 text-muted-foreground opacity-60">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span>Guided structure &amp; rubric</span>
                </div>
                <div className="eyebrow flex items-center gap-2 text-muted-foreground opacity-40">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span>Best for brand-new topics</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
          {/* Best Matches */}
          {bestMatches.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h2 className="eyebrow text-primary/80">
                  Best matches · Top {bestMatches.length}
                </h2>
                <span className="eyebrow text-muted-foreground opacity-40">
                  ranked by CO alignment &amp; past performance
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {bestMatches.map(hist => (
                  <HistoryCard
                    key={hist.id}
                    hist={hist}
                    emphasis
                    onUse={() => handleHistorySelect(hist.id)}
                    onPreview={() => setPreviewId(hist.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All past assignments */}
          {rest.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                <h2 className="eyebrow text-muted-foreground opacity-60">
                  {bestMatches.length > 0 ? "Other past assignments" : "All past assignments"}
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rest.map(hist => (
                  <HistoryCard
                    key={hist.id}
                    hist={hist}
                    onUse={() => handleHistorySelect(hist.id)}
                    onPreview={() => setPreviewId(hist.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Fallback */}
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border/40 bg-card/10 px-6 py-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-tight">Can&apos;t find a good match?</p>
              <p className="text-xs text-muted-foreground opacity-60 font-medium">
                Skip the library and start a fresh assignment — we&apos;ll guide you step-by-step.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleModeSelect("scratch")}
              className="eyebrow gap-2"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Create from scratch
            </Button>
          </div>
        </div>
      )}

      {/* Preview sheet */}
      <Sheet open={!!previewed} onOpenChange={(open) => { if (!open) setPreviewId(null) }}>
        <SheetContent side="right" className="w-full data-[side=right]:sm:max-w-lg p-0 overflow-y-auto">
          {previewed && (
            <>
              <SheetHeader className="p-6 border-b border-border/10 bg-card/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="eyebrow border-border/40">
                    {previewed.type}
                  </Badge>
                  <Badge variant="outline" className="eyebrow border-border/40">
                    {previewed.semester}
                  </Badge>
                  <span className="eyebrow text-muted-foreground opacity-50 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {previewed.lastUsed}
                  </span>
                </div>
                <SheetTitle className="text-xl font-semibold tracking-tight mt-2">
                  {previewed.title}
                </SheetTitle>
                <SheetDescription className="eyebrow opacity-60">
                  {previewed.course}
                </SheetDescription>
              </SheetHeader>

              <div className="p-6 space-y-6">
                {previewed.whyThisFits && (
                  <div className="rounded-lg border border-primary/20 bg-primary/[0.03] px-4 py-3 space-y-1">
                    <div className="eyebrow flex items-center gap-1.5 text-primary/70">
                      <Sparkles className="h-3 w-3" /> Why this fits
                    </div>
                    <p className="text-sm font-medium leading-relaxed opacity-80">{previewed.whyThisFits}</p>
                  </div>
                )}

                {previewed.instructionsPreview && (
                  <div className="space-y-2">
                    <div className="eyebrow flex items-center gap-1.5 text-muted-foreground opacity-60">
                      <FileText className="h-3 w-3" /> Instructions
                    </div>
                    <p className="text-sm leading-relaxed opacity-80">{previewed.instructionsPreview}</p>
                  </div>
                )}

                {previewed.sampleQuestions && previewed.sampleQuestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="eyebrow flex items-center gap-1.5 text-muted-foreground opacity-60">
                      <ListChecks className="h-3 w-3" /> Sample questions
                    </div>
                    <ul className="space-y-1.5">
                      {previewed.sampleQuestions.map((q, i) => (
                        <li key={i} className="text-sm leading-relaxed opacity-80 flex gap-2">
                          <span className="text-xs font-semibold text-muted-foreground opacity-50 mt-1">{String(i + 1).padStart(2, "0")}</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewed.rubricSummary && previewed.rubricSummary.length > 0 && (
                  <div className="space-y-2">
                    <div className="eyebrow flex items-center gap-1.5 text-muted-foreground opacity-60">
                      <Target className="h-3 w-3" /> Rubric summary
                    </div>
                    <ul className="space-y-1.5">
                      {previewed.rubricSummary.map((r, i) => (
                        <li key={i} className="text-sm leading-relaxed opacity-80 flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-[color:var(--status-success)]/70 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewed.coAlignment && (
                  <div className="space-y-2">
                    <div className="eyebrow flex items-center gap-1.5 text-muted-foreground opacity-60">
                      <Target className="h-3 w-3" /> Outcome alignment
                    </div>
                    <TooltipProvider delay={100}>
                      <div className="flex gap-1.5 flex-wrap">
                        {previewed.coAlignment.map(a => (
                          <Tooltip key={a.co}>
                            <TooltipTrigger className="cursor-help">
                              <Badge variant="outline" className={`eyebrow rounded-md ${strengthClasses[a.strength]}`}>
                                {a.co} · {a.strength}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-foreground border-none p-2 rounded-lg max-w-[200px]">
                              <p className="text-xs font-bold text-primary-foreground leading-snug">{CO_DEFINITIONS[a.co] ?? a.co}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 border-t border-border/20 bg-background/95 backdrop-blur p-4 flex items-center justify-between gap-3">
                <div className="eyebrow text-muted-foreground opacity-60">
                  We&apos;ll duplicate &amp; take you to editing
                </div>
                <Button
                  onClick={() => { handleHistorySelect(previewed.id); setPreviewId(null) }}
                  className="eyebrow gap-2"
                  size="sm"
                >
                  Use this
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function HistoryCard({
  hist,
  emphasis,
  onUse,
  onPreview,
}: {
  hist: HistoricalAssignment
  emphasis?: boolean
  onUse: () => void
  onPreview: () => void
}) {
  return (
    <Card
      className={`group relative overflow-hidden transition-all shadow-none flex flex-col ${
        emphasis
          ? "border-2 border-primary/25 bg-primary/[0.02] hover:border-primary/50"
          : "border border-border/30 bg-card/20 hover:border-primary/30"
      }`}
    >
      {emphasis && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="eyebrow bg-primary text-primary-foreground border-0 rounded-full px-2 py-0.5 gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            Best match
          </Badge>
        </div>
      )}

      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="eyebrow bg-muted/10 border-border/40 px-2 py-0.5">
            {hist.type}
          </Badge>
          <span className="eyebrow text-muted-foreground opacity-40 flex items-center gap-1.5">
            <Calendar className="size-3" />
            {hist.lastUsed}
          </span>
          <span className="eyebrow text-muted-foreground opacity-40 flex items-center gap-1.5">
            <Star className="size-3 text-[color:var(--status-warning)]/60" />
            {hist.avgScore}% avg
          </span>
        </div>
        <CardTitle className="mt-3 text-lg font-semibold tracking-tight line-clamp-2">
          {hist.title}
        </CardTitle>
        <CardDescription className="eyebrow opacity-60 mt-1">
          {hist.course} <span className="opacity-40">·</span> {hist.semester}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-4 flex-1 flex flex-col">
        {/* CO alignment */}
        {hist.coAlignment && hist.coAlignment.length > 0 && (
          <div className="space-y-1.5">
            <div className="eyebrow flex items-center gap-1.5 text-muted-foreground opacity-50">
              <Target className="h-3 w-3" /> Outcome alignment
            </div>
            <TooltipProvider delay={100}>
              <div className="flex gap-1.5 flex-wrap">
                {hist.coAlignment.map(a => (
                  <Tooltip key={a.co}>
                    <TooltipTrigger className="cursor-help">
                      <Badge
                        variant="outline"
                        className={`eyebrow rounded-md ${strengthClasses[a.strength]}`}
                      >
                        {a.co} · {a.strength}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-foreground border-none p-2 rounded-lg max-w-[200px]">
                      <p className="text-xs font-bold text-primary-foreground leading-snug">{CO_DEFINITIONS[a.co] ?? a.co}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        )}

        {/* Why this fits */}
        {hist.whyThisFits && (
          <div className="rounded-md border border-border/20 bg-muted/5 px-3 py-2">
            <div className="eyebrow flex items-center gap-1.5 text-primary/70 mb-1">
              <Sparkles className="h-3 w-3" /> Why this fits
            </div>
            <p className="text-xs leading-relaxed opacity-70 font-medium">{hist.whyThisFits}</p>
          </div>
        )}

        {/* Completeness */}
        {hist.completeness && (
          <div className="flex items-center gap-4 pt-2">
            <CompletenessPill ok={hist.completeness.questions > 0} label={`${hist.completeness.questions} Questions`} />
            <CompletenessPill ok={hist.completeness.deliverables > 0} label={`${hist.completeness.deliverables} Deliverables`} />
            <CompletenessPill ok={hist.completeness.hasRubric} label="Rubric" />
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-4 border-t border-border/10 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onPreview() }}
            className="eyebrow gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onUse() }}
            className="eyebrow gap-1.5"
          >
            Use this
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CompletenessPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`eyebrow flex items-center gap-1.5 ${ok ? "text-[color:var(--status-success)]/70" : "text-muted-foreground/40"}`}>
      <CheckCircle2 className={`h-3 w-3 ${ok ? "" : "opacity-30"}`} />
      <span>{label}</span>
    </div>
  )
}
