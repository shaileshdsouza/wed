"use client"

import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { usePreEvalStore, MOCK_HISTORY } from "@/lib/store/pre-evaluation-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Check,
  Zap,
  Info,
  BookOpen,
  FileText,
  PenLine,
  Calendar,
  Users,
  RotateCcw,
  Upload,
  ShieldCheck,
} from "lucide-react"

type CalibrationState = "pre_calibrated" | "review_recommended" | "calibration_needed" | "limited"
type Phase = "status" | "form" | "summary"
type MultipleApproaches = "yes" | "no" | "partial"

interface GuidanceForm {
  strongAnswer: string
  excellentVsAverage: string
  penalties: string
  multipleApproaches: MultipleApproaches | null
}

const STATUS_CONFIG: Record<
  CalibrationState,
  { badge: string; badgeClass: string; dotClass: string; title: string; explanation: string; details: string[] }
> = {
  pre_calibrated: {
    badge: "Reused calibration",
    badgeClass: "border-[color:var(--status-success)]/20 text-[color:var(--status-success)]/80 bg-[color:var(--status-success)]/[0.05]",
    dotClass: "bg-[color:var(--status-success)]",
    title: "Calibration will be reused from the selected assignment",
    explanation:
      "You selected an earlier assignment to reuse calibration from. We'll carry forward its evaluation guidance and past learnings to help you review this version faster.",
    details: [
      "Assignment structure matches a prior evaluated version",
      "Rubric criteria and weights are substantially unchanged",
      "Sufficient prior reviewed evaluations exist",
    ],
  },
  review_recommended: {
    badge: "Review recommended",
    badgeClass: "border-[color:var(--status-warning)]/20 text-[color:var(--status-warning)]/80 bg-[color:var(--status-warning)]/[0.05]",
    dotClass: "bg-[color:var(--status-warning)]",
    title: "Calibration review recommended",
    explanation: "We found changes that may slightly affect how responses are judged.",
    details: [
      "1 rubric criterion was reworded",
      "Task instructions changed slightly",
      "Prior calibration is still partially usable",
    ],
  },
  calibration_needed: {
    badge: "Action required",
    badgeClass: "border-[color:var(--status-warning)]/20 text-[color:var(--status-warning)]/80 bg-[color:var(--status-warning)]/[0.05]",
    dotClass: "bg-[color:var(--status-warning)]",
    title: "This assignment needs evaluation guidance",
    explanation: "Before publishing, define how this assignment should be evaluated.",
    details: [
      "No prior evaluation history found for this assignment",
      "New rubric criteria have been created from scratch",
      "Assignment type and scope are new to the system",
    ],
  },
  limited: {
    badge: "Limited calibration",
    badgeClass: "border-[color:var(--status-warning)]/20 text-[color:var(--status-warning)]/80 bg-[color:var(--status-warning)]/[0.05]",
    dotClass: "bg-[color:var(--status-warning)]",
    title: "Calibration is incomplete",
    explanation:
      "This assignment can proceed, but evaluation reliability may be lower until more guidance is provided.",
    details: [
      "Guidance was provided but lacks sufficient detail",
      "Ambiguity detected in one or more criteria",
      "System confidence is too low to distinguish grade levels reliably",
    ],
  },
}

const MOCK_CHANGES = [
  {
    item: '"Code quality" criterion wording updated',
    impact: "May affect how strong and average responses are distinguished",
  },
  {
    item: "Submission instructions revised",
    impact: "Students may interpret task scope differently",
  },
]

const NUDGES: Partial<Record<CalibrationState, string[]>> = {
  calibration_needed: [
    "For assignments like this, instructors usually clarify whether evidence quality or writing clarity matters more.",
    "Open-ended assignments are easier to evaluate when you define what distinguishes average from excellent.",
    "Consider specifying whether alternate valid interpretations should receive full credit.",
  ],
  review_recommended: [
    "You updated criterion wording, but no new guidance exists for it yet.",
    "Your instructions now emphasize analysis more strongly than the previously calibrated version.",
    "This rubric now appears slightly more open-ended than the prior calibrated version.",
  ],
  limited: [
    '"Quality" may be too broad — define whether this means structure, depth, accuracy, or originality.',
    "Your guidance explains what a good answer includes, but not what should be penalized.",
    "You have not yet described how acceptable and excellent responses differ.",
  ],
}

const LIMITED_ISSUES = [
  "Guidance does not explain how excellent answers differ from average ones",
  "Penalty conditions are unclear or missing",
  'The rubric mentions "clarity," but the guidance does not define what it means here',
  "The assignment appears open-ended but the guidance implies exact answer matching",
]

const AMBIGUITY_FLAGS = [
  '"Code quality" may combine multiple dimensions such as readability and efficiency.',
  '"Strong argument" is not yet clearly defined in the context of this assignment.',
]

const LEARNINGS_GOOD = [
  {
    observation: "Students answered correctly in multiple valid formats",
    howHelps: "Avoids penalizing correct answers that differ in format — allow flexibility where the rubric supports equivalent reasoning",
  },
  {
    observation: "Clearer evidence expectations improved scoring consistency",
    howHelps: "Apply the same evidence framing to this version's rubric before evaluating",
  },
]

const LEARNINGS_WATCHOUT = [
  {
    observation: "Criterion 2 caused more instructor overrides than other criteria",
    howHelps: "Review this criterion before continuing to prevent repeat overrides",
  },
  {
    observation: "Most instructor overrides from last term happened under 'Critical Analysis'",
    howHelps: "Confirm that this criterion's expectations haven't shifted in the current rubric",
  },
]

const REUSE_INPUTS = [
  "Instructor-reviewed evaluations from the selected assignment",
  "Rubric structure carried forward from the selected assignment",
  "Recurring instructor override patterns recorded",
  "Accepted answer variation patterns from prior evaluations",
]

const CALIBRATION_NEEDED_WHY_REQUIRED = [
  "New assignment",
  "No reusable calibration found",
  "Rubric needs clarification",
]

const CALIBRATION_NEEDED_SYSTEM_KNOWS = [
  "Current rubric",
  "Similar past assignments",
]

const CALIBRATION_NEEDED_YOULL_DEFINE = [
  "Strong answer",
  "Average vs excellent",
  "Penalties",
  "Valid answer flexibility",
]

const SOURCE_META: Record<string, { publishedOn: string; reviewedCount: number; overrideCount: number }> = {
  "hist-1": { publishedOn: "14 Nov 2024", reviewedCount: 46, overrideCount: 18 },
  "hist-2": { publishedOn: "12 Mar 2024", reviewedCount: 32, overrideCount: 5 },
  "hist-3": { publishedOn: "8 Oct 2023", reviewedCount: 38, overrideCount: 12 },
}

export function CalibrationCheck() {
  const {
    prevStep,
    nextStep,
    creationMode,
    selectedHistoryId,
    rubric,
    setCalibrationConfirmed,
    setCalibrationStatus,
  } = usePreEvalStore()

  const initialCalState = useMemo((): CalibrationState => {
    if (creationMode === "history" && selectedHistoryId) {
      const h = MOCK_HISTORY.find((x) => x.id === selectedHistoryId)
      return h && h.avgScore >= 80 ? "pre_calibrated" : "review_recommended"
    }
    return "calibration_needed"
  }, [creationMode, selectedHistoryId])

  const [calState, setCalState] = useState<CalibrationState>(initialCalState)
  const [phase, setPhase] = useState<Phase>("status")
  const [cameFromForm, setCameFromForm] = useState(false)
  const [guidance, setGuidance] = useState<GuidanceForm>({
    strongAnswer: "",
    excellentVsAverage: "",
    penalties: "",
    multipleApproaches: null,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  useEffect(() => {
    if (!isAnalyzing) return
    let p = 0
    const t = setInterval(() => {
      p += 25
      setAnalyzeProgress(p)
      if (p >= 100) {
        clearInterval(t)
        setIsAnalyzing(false)
        const isGood =
          guidance.strongAnswer.length >= 40 &&
          guidance.excellentVsAverage.length >= 40 &&
          guidance.penalties.length >= 30 &&
          guidance.multipleApproaches !== null
        if (isGood) {
          setCameFromForm(true)
          setPhase("summary")
        } else {
          setCalState("limited")
          setPhase("status")
        }
      }
    }, 350)
    return () => clearInterval(t)
  }, [isAnalyzing, guidance])

  const handleGoToForm = () => {
    setCameFromForm(false)
    setPhase("form")
  }

  const handleProceedWithExisting = () => {
    setCameFromForm(false)
    setPhase("summary")
  }

  const handleGenerateSummary = () => {
    setIsAnalyzing(true)
    setAnalyzeProgress(0)
  }

  const handleConfirm = () => {
    setConfirming(true)
    setCalibrationConfirmed(true)
    setCalibrationStatus(calState === "limited" ? "needs_attention" : "good")
    setTimeout(() => nextStep(), 1200)
  }

  const isFormValid =
    guidance.strongAnswer.trim().length > 0 &&
    guidance.excellentVsAverage.trim().length > 0 &&
    guidance.penalties.trim().length > 0 &&
    guidance.multipleApproaches !== null

  const config = STATUS_CONFIG[calState]
  const nudges = NUDGES[calState] ?? []

  const sourcesConfig =
    calState === "pre_calibrated"
      ? [
          { label: "Previous reviewed evaluations", active: true },
          { label: "Current rubric structure", active: true },
          { label: "Similar past assignments", active: true },
        ]
      : calState === "review_recommended"
      ? [
          { label: "Previous reviewed evaluations", active: true },
          { label: "Current rubric structure", active: true },
          { label: "Instructor answer guidance", active: false },
          { label: "Similar past assignments", active: true },
        ]
      : calState === "limited"
      ? [
          { label: "Current rubric structure", active: true },
          { label: "Partial instructor guidance", active: true },
        ]
      : [
          { label: "Current rubric structure", active: true },
          { label: "Similar past assignments from your history", active: true },
        ]

  const confidence =
    calState === "pre_calibrated"
      ? { label: "High confidence", colorClass: "text-[color:var(--status-success)]" }
      : calState === "review_recommended"
      ? { label: "Moderate confidence", colorClass: "text-[color:var(--status-warning)]" }
      : calState === "limited"
      ? { label: "Low confidence", colorClass: "text-[color:var(--status-warning)]" }
      : { label: "Moderate confidence", colorClass: "text-primary" }

  const sourceHistory = selectedHistoryId ? MOCK_HISTORY.find((x) => x.id === selectedHistoryId) : null
  const sourceMeta = selectedHistoryId ? SOURCE_META[selectedHistoryId] : null

  const calRubric = rubric.length > 0
    ? rubric
    : [{ id: "1", name: "Technical Accuracy" }, { id: "2", name: "Code Organization" }, { id: "3", name: "Reasoning & Justification" }]

  const readinessRequired = [
    { id: "strong", ok: guidance.strongAnswer.trim().length > 10, label: "Strong answer defined", hint: "Describe what a strong submission demonstrates." },
    { id: "excellent", ok: guidance.excellentVsAverage.trim().length > 10, label: "Average vs excellent defined", hint: "Define what makes a response stand out." },
    { id: "penalties", ok: guidance.penalties.trim().length > 10, label: "Penalties defined", hint: "List errors or weak patterns." },
    { id: "approaches", ok: guidance.multipleApproaches !== null, label: "Answer flexibility selected", hint: "Choose whether multiple valid approaches are acceptable." },
  ]
  const readinessOptional = [
    { id: "rubric", ok: true, label: "Rubric criteria available" },
    { id: "materials", ok: uploadedFiles.length > 0, label: "Reference materials added" },
  ]
  const readinessScore = Math.round(readinessRequired.filter((c) => c.ok).length / readinessRequired.length * 100)

  const qualityWarnings: string[] = []
  if (guidance.strongAnswer.trim().length > 0 && guidance.strongAnswer.trim().length < 40)
    qualityWarnings.push("Strong answer guidance may be too brief")
  if (guidance.penalties.trim().length > 0 && guidance.penalties.trim().length < 30)
    qualityWarnings.push("Penalty description may be too vague")
  if (guidance.strongAnswer.trim().length > 10 && guidance.strongAnswer.trim() === guidance.excellentVsAverage.trim())
    qualityWarnings.push("Strong answer and excellent threshold appear identical")

  return (
    <div className="max-w-6xl mx-auto space-y-0 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/10 pb-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md -mx-4 px-4 pt-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 border border-border/20 shrink-0 shadow-none"
          onClick={phase === "status" ? prevStep : () => setPhase(cameFromForm ? "form" : "status")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground/90">Calibration</h1>
          <p className="eyebrow font-semibold text-muted-foreground/60">
            Evaluation readiness check
          </p>
        </div>
      </div>

      {/* ── PHASE: STATUS ── */}
      {phase === "status" && (
        <div className="max-w-3xl mx-auto space-y-4">

          {/* ── PRE-CALIBRATED: 3-card layout ── */}
          {calState === "pre_calibrated" && (
            <>
              {/* Card 1 — Reuse summary */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  {/* Badge + headline + copy */}
                  <div className="space-y-2.5">
                    <Badge
                      variant="outline"
                      className={`eyebrow rounded-full px-2.5 py-1 ${config.badgeClass}`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${config.dotClass}`} />
                      {config.badge}
                    </Badge>
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-foreground/90">{config.title}</h2>
                      <p className="text-sm text-muted-foreground/70 font-medium mt-1 leading-relaxed">{config.explanation}</p>
                    </div>
                  </div>

                  <Separator className="opacity-10" />

                  {/* Source assignment */}
                  <div className="space-y-2">
                    <p className="eyebrow text-muted-foreground/50">Selected source assignment</p>
                    {sourceHistory ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground/85">{sourceHistory.title}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="eyebrow flex items-center gap-1 text-muted-foreground/50">
                            <BookOpen className="h-3 w-3" />
                            {sourceHistory.semester} · {sourceHistory.course}
                          </span>
                          {sourceMeta && (
                            <>
                              <span className="text-muted-foreground/20 text-xs">·</span>
                              <span className="eyebrow flex items-center gap-1 text-muted-foreground/50">
                                <Calendar className="h-3 w-3" />
                                Published {sourceMeta.publishedOn}
                              </span>
                              <span className="text-muted-foreground/20 text-xs">·</span>
                              <span className="eyebrow flex items-center gap-1 text-muted-foreground/50">
                                <Users className="h-3 w-3" />
                                {sourceMeta.reviewedCount} reviewed
                              </span>
                              <span className="text-muted-foreground/20 text-xs">·</span>
                              <span className="eyebrow flex items-center gap-1 text-muted-foreground/50">
                                <RotateCcw className="h-3 w-3" />
                                {sourceMeta.overrideCount} overrides
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 font-medium">No source assignment selected</p>
                    )}
                  </div>

                  <Separator className="opacity-10" />

                  {/* Why this calibration is being reused */}
                  <div className="space-y-2.5">
                    <p className="eyebrow text-muted-foreground/50">Why this calibration is being reused</p>
                    <div className="space-y-2">
                      {REUSE_INPUTS.map((input, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-foreground/65 font-medium">
                          <Check className="h-3.5 w-3.5 text-[color:var(--status-success)]/60 mt-0.5 shrink-0" />
                          {input}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 — Learnings from the selected assignment */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <p className="eyebrow text-muted-foreground/60">
                    Learnings from {sourceHistory ? sourceHistory.title : "the selected assignment"}
                  </p>

                  {/* What worked well */}
                  <div className="rounded-lg bg-[color:var(--status-success)]/[0.04] border border-[color:var(--status-success)]/10 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--status-success)]/60 shrink-0" />
                      <p className="eyebrow text-[color:var(--status-success)]/70">What worked well</p>
                    </div>
                    <div className="space-y-3">
                      {LEARNINGS_GOOD.map((l, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-sm text-foreground/75 font-medium flex items-start gap-2">
                            <span className="mt-2 h-1 w-1 rounded-full bg-[color:var(--status-success)]/50 shrink-0" />
                            {l.observation}
                          </p>
                          <p className="eyebrow text-muted-foreground/50 pl-3">
                            How this helps now: {l.howHelps}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* What to watch for */}
                  <div className="rounded-lg bg-[color:var(--status-warning)]/[0.04] border border-[color:var(--status-warning)]/10 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--status-warning)]/60 shrink-0" />
                      <p className="eyebrow text-[color:var(--status-warning)]/70">What to watch for</p>
                    </div>
                    <div className="space-y-3">
                      {LEARNINGS_WATCHOUT.map((l, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-sm text-foreground/75 font-medium flex items-start gap-2">
                            <span className="mt-2 h-1 w-1 rounded-full bg-[color:var(--status-warning)]/50 shrink-0" />
                            {l.observation}
                          </p>
                          <p className="eyebrow text-muted-foreground/50 pl-3">
                            How this helps now: {l.howHelps}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 — Refine this calibration */}
              <Card className="border border-border/10 bg-card/10 rounded-xl backdrop-blur-sm shadow-none">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary/40" />
                    <p className="eyebrow text-muted-foreground/50">Refine this calibration for the current assignment</p>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { icon: PenLine, label: "Add assignment-specific guidance" },
                      { icon: FileText, label: "Upload answer key or sample paper" },
                      { icon: RotateCcw, label: "Edit reused evaluation expectations" },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        onClick={handleGoToForm}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/10 bg-transparent hover:bg-muted/20 hover:border-border/25 transition-all text-left group"
                      >
                        <Icon className="h-3.5 w-3.5 text-primary/40 group-hover:text-primary/60 transition-colors shrink-0" />
                        <span className="text-sm font-medium text-muted-foreground/60 group-hover:text-foreground/70 transition-colors">{label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="eyebrow text-muted-foreground/50 hover:text-muted-foreground shadow-none"
                  onClick={handleGoToForm}
                >
                  Review or refine calibration
                </Button>
                <Button
                  size="lg"
                  className="h-11 px-8 font-semibold tracking-tight rounded-xl shadow-none bg-primary hover:bg-primary/90"
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? "Confirming..." : "Continue with reused calibration →"}
                </Button>
              </div>
            </>
          )}

          {/* ── CALIBRATION NEEDED: single-card layout ── */}
          {calState === "calibration_needed" && (
            <>
              {/* Single card — status, why required, system knows, you'll define */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  {/* Badge + headline + copy */}
                  <div className="space-y-2.5">
                    <Badge
                      variant="outline"
                      className={`eyebrow rounded-full px-2.5 py-1 ${config.badgeClass}`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${config.dotClass}`} />
                      {config.badge}
                    </Badge>
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-foreground/90">{config.title}</h2>
                      <p className="text-sm text-foreground/60 font-medium mt-1 leading-relaxed">{config.explanation}</p>
                    </div>
                  </div>

                  <Separator className="opacity-10" />

                  {/* Why calibration is required */}
                  <div className="space-y-2">
                    <p className="eyebrow text-muted-foreground/50">Why calibration is required</p>
                    <div className="space-y-1.5">
                      {CALIBRATION_NEEDED_WHY_REQUIRED.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground/65 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--status-warning)]/50 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="opacity-10" />

                  {/* System already has */}
                  <div className="space-y-2">
                    <p className="eyebrow text-muted-foreground/50">System already has</p>
                    <div className="space-y-1.5">
                      {CALIBRATION_NEEDED_SYSTEM_KNOWS.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground/65 font-medium">
                          <Check className="h-3.5 w-3.5 text-[color:var(--status-success)]/60 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="opacity-10" />

                  {/* You'll define */}
                  <div className="space-y-2">
                    <p className="eyebrow text-muted-foreground/50">You'll define</p>
                    <div className="space-y-1.5">
                      {CALIBRATION_NEEDED_YOULL_DEFINE.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground/65 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--status-warning)]/40 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="eyebrow text-muted-foreground/50 hover:text-muted-foreground shadow-none"
                  onClick={prevStep}
                >
                  ← Back
                </Button>
                <div className="flex flex-col items-end gap-1">
                  <Button
                    size="lg"
                    className="h-11 px-8 font-semibold tracking-tight rounded-xl shadow-none bg-primary hover:bg-primary/90"
                    onClick={handleGoToForm}
                  >
                    Start calibration →
                  </Button>
                  <p className="eyebrow text-muted-foreground/35">Takes about 2–3 minutes</p>
                </div>
              </div>
            </>
          )}

          {/* ── REVIEW RECOMMENDED + LIMITED ── */}
          {(calState === "review_recommended" || calState === "limited") && (
            <>
              {/* Block 1: Status header */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <Badge
                      variant="outline"
                      className={`eyebrow rounded-full px-2.5 py-1 ${config.badgeClass}`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${config.dotClass}`} />
                      {config.badge}
                    </Badge>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">{config.title}</h2>
                      <p className="text-sm text-muted-foreground/70 font-medium mt-1">{config.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Block 2: What we're using */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none">
                <CardContent className="p-6 space-y-3">
                  <p className="eyebrow text-muted-foreground/40">What calibration is based on</p>
                  <div className="flex flex-wrap gap-2">
                    {sourcesConfig.map((src) => (
                      <div
                        key={src.label}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                          src.active
                            ? "border-primary/20 bg-primary/5 text-primary/70"
                            : "border-border/20 bg-muted/10 text-muted-foreground/30 line-through"
                        }`}
                      >
                        {src.active ? <Check className="h-2.5 w-2.5 shrink-0" /> : <span className="opacity-30">—</span>}
                        {src.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {calState === "review_recommended" && (
                <div className="space-y-4">
                  <Card className="border border-[color:var(--status-warning)]/10 bg-[color:var(--status-warning)]/[0.03] rounded-xl shadow-none">
                    <CardContent className="p-6 space-y-4">
                      <p className="eyebrow text-[color:var(--status-warning)]/60">Detected changes</p>
                      <div className="space-y-3">
                        {MOCK_CHANGES.map((c, i) => (
                          <div key={i} className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground/80">{c.item}</p>
                            <p className="text-xs text-muted-foreground/50 font-medium">{c.impact}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/30 rounded-xl bg-card shadow-none">
                    <CardContent className="p-6 space-y-1">
                      <p className="eyebrow text-muted-foreground/40">Recommended action</p>
                      <p className="text-sm text-muted-foreground/70 font-medium">
                        Review or update answer guidance for the changed areas.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {calState === "limited" && (
                <Card className="border border-[color:var(--status-warning)]/10 bg-[color:var(--status-warning)]/[0.03] rounded-xl shadow-none">
                  <CardContent className="p-6 space-y-3">
                    <p className="eyebrow text-[color:var(--status-warning)]/60">Issues detected</p>
                    <div className="space-y-2">
                      {LIMITED_ISSUES.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground/70 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 text-[color:var(--status-warning)]/50 mt-0.5 shrink-0" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {nudges.length > 0 && (
                <Card className="border border-border/10 bg-card/10 rounded-xl backdrop-blur-sm shadow-none">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary/40" />
                      <p className="eyebrow text-muted-foreground/40">Guidance suggestions</p>
                    </div>
                    <div className="space-y-2">
                      {nudges.map((n, i) => (
                        <p key={i} className="text-xs text-muted-foreground/60 font-medium leading-relaxed flex items-start gap-2">
                          <span className="mt-1 h-1 w-1 rounded-full bg-primary/30 shrink-0" />
                          {n}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA row */}
              <div className="flex items-center justify-between pt-4">
                {calState === "review_recommended" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="eyebrow text-muted-foreground/40 hover:text-muted-foreground shadow-none"
                      onClick={handleProceedWithExisting}
                    >
                      Proceed with existing calibration
                    </Button>
                    <Button
                      size="lg"
                      className="h-12 px-10 font-semibold tracking-tight rounded-xl shadow-none bg-primary hover:bg-primary/90"
                      onClick={handleGoToForm}
                    >
                      Review and update →
                    </Button>
                  </>
                )}
                {calState === "limited" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="eyebrow text-muted-foreground/40 hover:text-muted-foreground shadow-none"
                      onClick={handleConfirm}
                      disabled={confirming}
                    >
                      {confirming ? "Confirming..." : "Proceed with caution"}
                    </Button>
                    <Button
                      size="lg"
                      className="h-12 px-10 font-semibold tracking-tight rounded-xl shadow-none bg-primary hover:bg-primary/90"
                      onClick={handleGoToForm}
                    >
                      Improve guidance →
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PHASE: FORM ── */}
      {phase === "form" && (
        <div className="space-y-5">
          <div className="max-w-3xl mx-auto space-y-1 pb-1">
            <h2 className="text-xl font-semibold tracking-tight">Define how this assignment should be evaluated</h2>
            <p className="text-sm text-muted-foreground/60 font-medium">Your guidance helps the system support consistent grading.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

            {/* LEFT — cards */}
            <div className="space-y-4">

              {/* Card 1 — Rubric context */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <div className="px-5 py-3 border-b border-border/10 bg-muted/[0.04]">
                  <p className="eyebrow text-muted-foreground/60">Rubric criteria for this assignment</p>
                </div>
                <CardContent className="p-6 space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    {calRubric.map((crit) => (
                      <span key={crit.id} className="eyebrow px-2.5 py-1 rounded-full border border-border/20 bg-card/30 text-foreground/55">
                        {crit.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground/40">Use these criteria to guide calibration.</p>
                </CardContent>
              </Card>

              {/* Card 2 — Reference materials */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <div className="px-5 py-3 border-b border-border/10 bg-muted/[0.04] flex items-center justify-between">
                  <p className="eyebrow text-muted-foreground/60">
                    Reference materials <span className="text-muted-foreground/30">(optional)</span>
                  </p>
                  <button className="eyebrow flex items-center gap-1 text-primary/50 hover:text-primary/70 transition-colors">
                    <Sparkles className="h-3 w-3" />
                    Suggest draft
                  </button>
                </div>
                <CardContent className="p-6 space-y-3">
                  <label className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-lg border border-dashed border-border/25 bg-muted/5 hover:bg-muted/15 hover:border-border/40 transition-all cursor-pointer">
                    <Upload className="h-3.5 w-3.5 text-muted-foreground/35" />
                    <span className="text-sm text-muted-foreground/55 font-medium text-center">Upload answer keys, sample responses, or marking notes</span>
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        if (e.target.files) setUploadedFiles((prev) => [...prev, ...Array.from(e.target.files!)])
                      }}
                    />
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Answer key", "Sample response", "Marking notes", "Common mistakes"].map((tag) => (
                      <span key={tag} className="eyebrow px-2.5 py-1 rounded-full border border-border/15 bg-card/20 text-muted-foreground/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((f, i) => (
                        <span key={i} className="eyebrow flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/20 bg-card/30 text-foreground/60">
                          <FileText className="h-3 w-3" />
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="eyebrow text-muted-foreground/35">Uploaded materials help draft and validate guidance. They do not replace your final review.</p>
                </CardContent>
              </Card>

              {/* Card 3 — Strong answer */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <div className="px-5 py-3 border-b border-border/10 bg-muted/[0.04] flex items-center gap-2">
                  <p className="eyebrow text-foreground/70">What should a strong answer include?</p>
                  <span className="eyebrow text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded-full">Required</span>
                  {guidance.strongAnswer.trim().length > 10 && (
                    <div className="ml-auto h-4 w-4 rounded-full bg-[color:var(--status-success)]/10 border border-[color:var(--status-success)]/20 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-[color:var(--status-success)]/80" />
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground/45">Key qualities, evidence, or structure expected.</p>
                  <Textarea
                    placeholder="Describe what a strong submission demonstrates..."
                    className="min-h-[72px] text-sm border-border/30 bg-card/30 focus-visible:ring-primary/20 resize-none rounded-lg shadow-none placeholder:text-muted-foreground/20"
                    value={guidance.strongAnswer}
                    onChange={(e) => setGuidance((g) => ({ ...g, strongAnswer: e.target.value }))}
                  />
                </CardContent>
              </Card>

              {/* Card 4 — Average vs excellent */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <div className="px-5 py-3 border-b border-border/10 bg-muted/[0.04] flex items-center gap-2">
                  <p className="eyebrow text-foreground/70">What separates average from excellent?</p>
                  <span className="eyebrow text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded-full">Required</span>
                  {guidance.excellentVsAverage.trim().length > 10 && (
                    <div className="ml-auto h-4 w-4 rounded-full bg-[color:var(--status-success)]/10 border border-[color:var(--status-success)]/20 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-[color:var(--status-success)]/80" />
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground/45">Define what makes a response stand out.</p>
                  <Textarea
                    placeholder="Describe what distinguishes an excellent answer from an acceptable one..."
                    className="min-h-[72px] text-sm border-border/30 bg-card/30 focus-visible:ring-primary/20 resize-none rounded-lg shadow-none placeholder:text-muted-foreground/20"
                    value={guidance.excellentVsAverage}
                    onChange={(e) => setGuidance((g) => ({ ...g, excellentVsAverage: e.target.value }))}
                  />
                </CardContent>
              </Card>

              {/* Card 5 — Penalties */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <div className="px-5 py-3 border-b border-border/10 bg-muted/[0.04] flex items-center gap-2">
                  <p className="eyebrow text-foreground/70">What should be penalized?</p>
                  <span className="eyebrow text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded-full">Required</span>
                  {guidance.penalties.trim().length > 10 && (
                    <div className="ml-auto h-4 w-4 rounded-full bg-[color:var(--status-success)]/10 border border-[color:var(--status-success)]/20 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-[color:var(--status-success)]/80" />
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground/45">List errors, missing elements, or weak patterns.</p>
                  <Textarea
                    placeholder="Describe what reduces the score..."
                    className="min-h-[72px] text-sm border-border/30 bg-card/30 focus-visible:ring-primary/20 resize-none rounded-lg shadow-none placeholder:text-muted-foreground/20"
                    value={guidance.penalties}
                    onChange={(e) => setGuidance((g) => ({ ...g, penalties: e.target.value }))}
                  />
                </CardContent>
              </Card>

              {/* Card 6 — Multiple valid approaches */}
              <Card className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                <div className="px-5 py-3 border-b border-border/10 bg-muted/[0.04] flex items-center gap-2">
                  <p className="eyebrow text-foreground/70">Are multiple valid answer approaches acceptable?</p>
                  <span className="eyebrow text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded-full">Required</span>
                  {guidance.multipleApproaches !== null && (
                    <div className="ml-auto h-4 w-4 rounded-full bg-[color:var(--status-success)]/10 border border-[color:var(--status-success)]/20 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-[color:var(--status-success)]/80" />
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground/45">This helps the system score alternate but valid answers fairly.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { value: "yes" as const, label: "Yes", sub: "Multiple valid approaches" },
                        { value: "no" as const, label: "No", sub: "Fixed expected elements" },
                        { value: "partial" as const, label: "Partially", sub: "Some flexibility allowed" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setGuidance((g) => ({ ...g, multipleApproaches: opt.value }))}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                          guidance.multipleApproaches === opt.value
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/20 bg-card/20 hover:border-border/40"
                        )}
                      >
                        <span className="text-sm font-semibold tracking-tight">{opt.label}</span>
                        <span className="text-xs font-medium text-muted-foreground/50 mt-0.5">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {isAnalyzing && (
                <Card className="border border-primary/10 bg-primary/[0.03] rounded-xl shadow-none">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-primary/50 animate-pulse" />
                      <p className="eyebrow text-primary/60">Analysing alignment...</p>
                    </div>
                    <Progress value={analyzeProgress} className="h-1 bg-primary/10 shadow-none" />
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" className="eyebrow text-muted-foreground/40 shadow-none" onClick={() => setPhase("status")}>
                  ← Back
                </Button>
                <div className="flex flex-col items-end gap-1">
                  <Button
                    size="lg"
                    className="h-11 px-8 font-semibold tracking-tight rounded-xl shadow-none bg-primary hover:bg-primary/90 disabled:opacity-40"
                    onClick={handleGenerateSummary}
                    disabled={!isFormValid || isAnalyzing}
                  >
                    Review system interpretation →
                  </Button>
                  {!isFormValid && (
                    <p className="eyebrow text-muted-foreground/35">Complete all required guidance to continue.</p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — Calibration readiness panel */}
            <div className="space-y-5">
              <Card className="border border-border/20 bg-primary/[0.01] sticky top-[90px] rounded-xl backdrop-blur-sm shadow-none overflow-hidden">
                <div className="px-5 py-4 border-b border-border/10 bg-muted/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="eyebrow text-primary/80 leading-tight">Calibration readiness</p>
                        <p className="eyebrow text-muted-foreground opacity-40 leading-tight">{readinessRequired.filter((c) => c.ok).length} / 4 complete</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-2xl font-semibold tracking-tight leading-none",
                      readinessScore === 100 ? "text-[color:var(--status-success)]" : readinessScore >= 50 ? "text-[color:var(--status-warning)]" : "text-muted-foreground/40"
                    )}>
                      {readinessScore}%
                    </span>
                  </div>
                </div>
                <CardContent className="px-5 pt-5 pb-6 space-y-4">

                  {/* Required checks */}
                  <div className="space-y-2.5">
                    {readinessRequired.map((c) => (
                      <div key={c.id} className="space-y-0.5">
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            "mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 border",
                            c.ok
                              ? "bg-[color:var(--status-success)]/10 border-[color:var(--status-success)]/20 text-[color:var(--status-success)]/80"
                              : "bg-muted/10 border-border/20 text-muted-foreground/30"
                          )}>
                            {c.ok ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-muted-foreground/30 block" />}
                          </div>
                          <p className={cn("text-xs font-bold leading-tight", c.ok ? "text-foreground/70" : "text-foreground/50")}>
                            {c.label}
                          </p>
                        </div>
                        {!c.ok && (
                          <p className="text-xs font-medium text-muted-foreground/45 leading-relaxed pl-6">{c.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Optional checks */}
                  <div className="space-y-2 pt-1 border-t border-border/10">
                    {readinessOptional.map((c) => (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <div className={cn(
                          "mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 border",
                          c.ok
                            ? "bg-[color:var(--status-success)]/10 border-[color:var(--status-success)]/20 text-[color:var(--status-success)]/80"
                            : "bg-muted/10 border-border/20 text-muted-foreground/25"
                        )}>
                          {c.ok ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-muted-foreground/20 block" />}
                        </div>
                        <p className={cn("text-xs font-medium leading-tight", c.ok ? "text-foreground/60" : "text-muted-foreground/40")}>
                          {c.label}
                          {!c.ok && <span className="text-muted-foreground/30"> (optional)</span>}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Quality warnings */}
                  {qualityWarnings.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-border/10">
                      <p className="eyebrow text-[color:var(--status-warning)]/60">Quality checks</p>
                      {qualityWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-[color:var(--status-warning)]/50 mt-0.5 shrink-0" />
                          <p className="text-xs font-medium text-muted-foreground/60 leading-tight">{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      )}

      {/* ── PHASE: SUMMARY ── */}
      {phase === "summary" && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Calibration summary</h2>
            <p className="text-sm text-muted-foreground/60 font-medium">
              Here is how the system will interpret this assignment during evaluation.
            </p>
          </div>

          <Card className="border border-border/30 rounded-xl bg-card shadow-none">
            <CardContent className="p-6 space-y-5">
              <p className="eyebrow text-muted-foreground/40">How this assignment will be interpreted</p>
              <div className="space-y-4">
                {[
                  {
                    label: "Strong responses should include",
                    text: "Clear problem framing, well-structured implementation, appropriate use of patterns, and evidence of systematic testing.",
                  },
                  {
                    label: "Excellent responses go beyond average by",
                    text: "Demonstrating original thinking, handling edge cases explicitly, and justifying design decisions with reasoning.",
                  },
                  {
                    label: "Scores should be reduced when",
                    text: "Documentation is missing, errors are unhandled, test coverage is incomplete, or logic is copied without understanding.",
                  },
                  {
                    label: "Multiple valid response structures",
                    text:
                      guidance.multipleApproaches === "yes"
                        ? "Are allowed — multiple valid approaches will be accepted."
                        : guidance.multipleApproaches === "no"
                        ? "Are not allowed — core elements are fixed."
                        : "Partially allowed — some flexibility with fixed core elements.",
                  },
                ].map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="eyebrow text-muted-foreground/40">{item.label}</p>
                    <p className="text-sm font-medium text-foreground/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/30 rounded-xl bg-card shadow-none">
            <CardContent className="p-6 space-y-3">
              <p className="eyebrow text-muted-foreground/40">Rubric alignment</p>
              <div className="space-y-0">
                {(rubric.length > 0 ? rubric : [{ id: "1", name: "Technical Accuracy" }, { id: "2", name: "Code Organization" }]).map(
                  (crit, i) => {
                    const status = i === 1 ? "partially_ambiguous" : "aligned"
                    return (
                      <div key={crit.id} className="flex items-center justify-between py-2.5 border-b border-border/5 last:border-0">
                        <span className="text-sm font-bold text-foreground/70">{crit.name}</span>
                        <Badge
                          variant="outline"
                          className={`eyebrow rounded-full ${
                            status === "aligned"
                              ? "border-[color:var(--status-success)]/20 text-[color:var(--status-success)]/70 bg-[color:var(--status-success)]/5"
                              : "border-[color:var(--status-warning)]/20 text-[color:var(--status-warning)]/70 bg-[color:var(--status-warning)]/5"
                          }`}
                        >
                          {status === "aligned" ? "Aligned" : "Partially ambiguous"}
                        </Badge>
                      </div>
                    )
                  }
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[color:var(--status-warning)]/10 bg-[color:var(--status-warning)]/[0.02] rounded-xl shadow-none">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--status-warning)]/50" />
                <p className="eyebrow text-[color:var(--status-warning)]/50">Ambiguity flags</p>
              </div>
              <div className="space-y-2">
                {AMBIGUITY_FLAGS.map((f, i) => (
                  <p key={i} className="text-xs text-muted-foreground/60 font-medium flex items-start gap-2">
                    <span className="mt-1 h-1 w-1 rounded-full bg-[color:var(--status-warning)]/40 shrink-0" />
                    {f}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2.5 px-1">
            <Info className="h-3.5 w-3.5 text-muted-foreground/30" />
            <p className="eyebrow text-muted-foreground/40">
              Confidence: <span className={confidence.colorClass}>{confidence.label}</span>
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="eyebrow text-muted-foreground/40 shadow-none"
              onClick={() => (cameFromForm ? setPhase("form") : setPhase("status"))}
            >
              ← {cameFromForm ? "Edit guidance" : "Back"}
            </Button>
            <Button
              size="lg"
              className="h-12 px-10 font-semibold tracking-tight rounded-xl shadow-none bg-primary hover:bg-primary/90 disabled:opacity-50"
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? "Confirming..." : "Confirm calibration →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
