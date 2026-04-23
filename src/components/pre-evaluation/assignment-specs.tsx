"use client"

import { usePreEvalStore, MOCK_HISTORY, type AssignmentType, type BloomLevel, type Block, type Question, type DeliverableItem, type ResourceItem } from "@/lib/store/pre-evaluation-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  FolderKanban,
  Palette,
  FileText,
  Mic2,
  Code2,
  Check,
  HelpCircle,
  Trash2,
  X,
  Star,
  Wand2,
  Info,
  Sparkles,
  FileCheck2,
  Link2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  Lightbulb,
  Download,
  GripVertical,
} from "lucide-react"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { cn } from "@/lib/utils"

type TypeTemplate = {
  type: AssignmentType
  label: string
  icon: any
  color: string
  bestFor: string[]
  structure: string[]
  evaluation: string[]
}

const TYPE_TEMPLATES: TypeTemplate[] = [
  {
    type: "Project",
    label: "Project",
    icon: FolderKanban,
    color: "text-[color:var(--status-info)]",
    bestFor: ["Applying concepts", "Integrative work"],
    structure: ["Brief / scenario", "3–5 tasks", "Deliverables", "Submission format"],
    evaluation: ["Criteria-based rubric", "Depth & reasoning"],
  },
  {
    type: "Design",
    label: "Design / Figma",
    icon: Palette,
    color: "text-[color:var(--category-2)]",
    bestFor: ["Visual reasoning", "UX / UI craft"],
    structure: ["Design brief", "Artboards", "Process artifacts"],
    evaluation: ["Rubric on process + outcome"],
  },
  {
    type: "Lab Record",
    label: "Lab Record",
    icon: Code2,
    color: "text-[color:var(--status-warning)]",
    bestFor: ["Procedural mastery", "Hands-on skill"],
    structure: ["Objective", "Procedure", "Observations", "Conclusion"],
    evaluation: ["Checklist + rubric", "Execution accuracy"],
  },
  {
    type: "Essay",
    label: "Writing / Essay",
    icon: FileText,
    color: "text-[color:var(--category-2)]",
    bestFor: ["Analytical thinking", "Argumentation"],
    structure: ["Prompt", "Length target", "Reference guidance"],
    evaluation: ["Rubric on reasoning & clarity"],
  },
  {
    type: "Viva",
    label: "Viva / Oral",
    icon: Mic2,
    color: "text-[color:var(--status-warning)]",
    bestFor: ["Conceptual depth", "Oral reasoning"],
    structure: ["Question bank", "Probing follow-ups", "Score sheet"],
    evaluation: ["Rubric per question", "Depth & clarity"],
  },
]

export function AssignmentSpecs() {
  const {
    assignment,
    selectedCourse,
    updateAssignment,
    addBlock,
    removeBlock,
    updateBlock,
    reorderBlock,
    addQuestion,
    updateQuestion,
    removeQuestion,
    addDeliverableItem,
    updateDeliverableItem,
    removeDeliverableItem,
    addResourceItem,
    updateResourceItem,
    removeResourceItem,
    nextStep,
    prevStep,
    addAudit
  } = usePreEvalStore()

  const recommendedType = useMemo<AssignmentType>(() => {
    if (!selectedCourse) return "Project"
    const counts: Record<string, number> = {}
    for (const h of MOCK_HISTORY) {
      if (h.course === selectedCourse && h.type) {
        counts[h.type] = (counts[h.type] || 0) + 1
      }
    }
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return (ranked[0]?.[0] as AssignmentType) ?? "Project"
  }, [selectedCourse])

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggleCollapsed = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const handleTypeSelect = (type: AssignmentType) => {
    updateAssignment({ type })
    addAudit({ action: "Assignment type set to " + type, details: `Format confirmed. Institutional templates loaded.`, type: "user" })
  }

  const questionsBlocks = assignment.blocks.filter(b => b.type === "questions") as Extract<Block, { type: "questions" }>[]
  const instructionsBlocks = assignment.blocks.filter(b => b.type === "instructions") as Extract<Block, { type: "instructions" }>[]
  const deliverablesBlocks = assignment.blocks.filter(b => b.type === "deliverables") as Extract<Block, { type: "deliverables" }>[]
  const resourcesBlocks = assignment.blocks.filter(b => b.type === "resources") as Extract<Block, { type: "resources" }>[]

  const allQuestions = questionsBlocks.flatMap(b => b.questions)
  const totalWeight = allQuestions.reduce((s, q) => s + Number(q.weight || 0), 0)

  const hasInstructionsBody = instructionsBlocks.some(b => b.body.trim().length >= 30)
  const hasThreePlusQuestions = allQuestions.length >= 3
  const allQuestionsHaveText = allQuestions.length > 0 && allQuestions.every(q => q.text.trim().length > 0)
  const weightsSumCorrect = totalWeight === 100
  const hasDeliverables = deliverablesBlocks.some(b => b.items.length > 0 && b.items.every(i => i.name.trim()))

  const bloomMix = useMemo(() => {
    let lower = 0, higher = 0
    for (const q of allQuestions) {
      if (q.bloomLevel === "L1: Remember" || q.bloomLevel === "L2: Understand") lower++
      else higher++
    }
    return { lower, higher, mixed: lower > 0 && higher > 0 }
  }, [allQuestions])

  const healthChecks = [
    { id: "instructions", ok: hasInstructionsBody, label: hasInstructionsBody ? "Instructions complete" : "Instructions need detail", hint: hasInstructionsBody ? undefined : "Describe what students should do — aim for 2–3 sentences." },
    { id: "questions-count", ok: hasThreePlusQuestions, label: hasThreePlusQuestions ? `${allQuestions.length} questions added` : "Add more questions", hint: hasThreePlusQuestions ? undefined : `Add at least 3 questions for better evaluation (you have ${allQuestions.length}).` },
    { id: "questions-text", ok: allQuestionsHaveText, label: allQuestionsHaveText ? "All questions written" : "Some questions are empty", hint: allQuestionsHaveText ? undefined : "Fill in the question prompts above." },
    { id: "weights", ok: weightsSumCorrect, label: weightsSumCorrect ? "Weights total 100%" : `Weights total ${totalWeight}% — should be 100%`, hint: weightsSumCorrect ? undefined : "Adjust question weightage so the total equals 100%." },
    { id: "deliverables", ok: hasDeliverables, label: hasDeliverables ? "Deliverables defined" : "Deliverables unclear", hint: hasDeliverables ? undefined : "Add at least one deliverable so students know what to submit." },
    { id: "bloom", ok: bloomMix.mixed || allQuestions.length < 3, label: bloomMix.mixed ? "Balanced difficulty mix" : (allQuestions.length < 3 ? "Difficulty mix — pending" : "Difficulty skewed"), hint: bloomMix.mixed || allQuestions.length < 3 ? undefined : "Mix recall-level questions with higher-order thinking." },
  ]

  const readyScore = Math.round(healthChecks.filter(c => c.ok).length / healthChecks.length * 100)
  const canProceed = !!assignment.title && hasInstructionsBody && allQuestionsHaveText && weightsSumCorrect && hasDeliverables

  const handleAIRewrite = (blockId: string, mode: "clarity" | "simplify") => {
    const block = instructionsBlocks.find(b => b.id === blockId)
    if (!block || !block.body.trim()) return
    const prefix = mode === "clarity" ? "Clear instructions: " : "In simple terms: "
    updateBlock(blockId, { body: prefix + block.body.replace(/^(Clear instructions: |In simple terms: )/, "") })
    addAudit({ action: "AI rewrite applied", details: `Applied ${mode} rewrite to instructions block.`, type: "ai" })
  }

  const handleImportFromPast = (blockId: string) => {
    const best = MOCK_HISTORY.find(h => h.course === selectedCourse && h.sampleQuestions?.length) ?? MOCK_HISTORY.find(h => h.sampleQuestions?.length)
    if (!best?.sampleQuestions) return
    const block = questionsBlocks.find(b => b.id === blockId)
    if (!block) return
    const base = block.questions.filter(q => q.text.trim().length > 0)
    const imported: Question[] = best.sampleQuestions.map((text, i) => ({
      id: `q-imp-${Date.now()}-${i}`,
      text,
      bloomLevel: "L2: Understand",
      bloomSuggested: "L2: Understand",
      weight: 0,
    }))
    const all = [...base, ...imported]
    const even = Math.floor(100 / all.length)
    const remainder = 100 - even * all.length
    const redistributed = all.map((q, i) => ({ ...q, weight: even + (i === 0 ? remainder : 0) }))
    updateBlock(blockId, { questions: redistributed })
    addAudit({ action: "Imported questions", details: `Pulled ${imported.length} questions from "${best.title}".`, type: "user" })
  }

  const handleAddSuggested = (blockId: string) => {
    const block = questionsBlocks.find(b => b.id === blockId)
    if (!block) return
    const suggestions = [
      "Explain the core trade-off between the two approaches covered in the lectures.",
      "Apply the concept to a concrete scenario and justify your design choices.",
      "Analyse the provided example and identify two improvements you would make.",
    ]
    const next = suggestions[block.questions.length % suggestions.length]
    addQuestion(blockId)
    setTimeout(() => {
      const latest = usePreEvalStore.getState().assignment.blocks.find(b => b.id === blockId)
      if (latest && latest.type === "questions") {
        const lastQ = latest.questions[latest.questions.length - 1]
        if (lastQ) updateQuestion(blockId, lastQ.id, { text: next })
      }
    }, 0)
  }

  if (!assignment.type) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={prevStep}>
            <ArrowLeft className="h-4 w-4" />
            Back to strategy
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight secondary-text">Choose an assignment type</h1>
          <p className="text-base text-muted-foreground font-medium opacity-70">
            Each type is a guided starting template — we&apos;ll pre-fill the structure and rubric so you can adapt it.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TYPE_TEMPLATES.map((t) => {
            const isRecommended = t.type === recommendedType
            return (
              <Card
                key={t.type}
                className={cn(
                  "group relative cursor-pointer transition-all flex flex-col shadow-none overflow-hidden",
                  isRecommended
                    ? "border-2 border-primary/30 bg-primary/[0.02] hover:border-primary/60 hover:bg-primary/[0.04]"
                    : "border border-border/40 bg-card hover:border-primary/30"
                )}
                onClick={() => handleTypeSelect(t.type)}
              >
                {isRecommended && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="eyebrow bg-primary text-primary-foreground border-0 rounded-full px-2 py-0.5 gap-1">
                      <Star className="h-2.5 w-2.5" />
                      Commonly used
                    </Badge>
                  </div>
                )}

                <CardContent className="px-5 pt-5 pb-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 w-fit rounded-lg bg-muted/30 border border-border/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <t.icon className={cn("h-5 w-5", t.color, "group-hover:text-inherit")} />
                    </div>
                    <h3 className="text-lg tracking-tight font-semibold pt-1">{t.label}</h3>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border/10">
                    <TypeRow title="Best for" items={t.bestFor} />
                    <TypeRow title="Structure" items={t.structure} />
                    <TypeRow title="Evaluation" items={t.evaluation} />
                  </div>
                </CardContent>

                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Card>
            );
          })}
        </div>

        {/* Custom type — configurable guardrails */}
        <Card
          className="group cursor-pointer transition-all border border-dashed border-border/40 bg-card/10 hover:border-primary/40 hover:bg-card/20 shadow-none"
          onClick={() => handleTypeSelect("Specialized")}
        >
          <CardContent className="px-6 py-5 flex items-center gap-5">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shrink-0">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight">Create your own type</h3>
                <Badge variant="outline" className="eyebrow border-border/40 opacity-70">Configurable</Badge>
              </div>
              <p className="text-xs text-muted-foreground opacity-70 font-medium leading-relaxed">
                Define your own structure blocks and evaluation approach — still wired into the rubric &amp; calibration flow, so nothing breaks.
              </p>
            </div>
            <Plus className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </CardContent>
        </Card>

        {/* Non-binding helper */}
        <div className="flex items-center gap-2 pt-2 text-muted-foreground/60">
          <Info className="h-3.5 w-3.5 opacity-60" />
          <p className="text-xs font-medium opacity-70">
            You can modify the structure and evaluation later — this just sets your starting template.
          </p>
        </div>
      </div>
    )
  }

  const blockIndex = (id: string) => assignment.blocks.findIndex(b => b.id === id)
  const isFirst = (id: string) => blockIndex(id) === 0
  const isLast = (id: string) => blockIndex(id) === assignment.blocks.length - 1

  const presentTypes = new Set(assignment.blocks.map(b => b.type))
  const allAddableTypes: { type: "instructions" | "questions" | "deliverables" | "resources"; label: string }[] = [
    { type: "instructions", label: "Instructions" },
    { type: "questions", label: "Questions / Tasks" },
    { type: "deliverables", label: "Deliverables" },
    { type: "resources", label: "Resources" },
  ]
  const availableToAdd = allAddableTypes.filter(x => !presentTypes.has(x.type))

  return (
    <TooltipProvider delay={150}>
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
        <div className="flex items-center justify-between border-b border-border/40 pb-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md -mx-4 px-4 pt-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => updateAssignment({ type: null })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight secondary-text">Assignment Details</h1>
                <Badge variant="outline" className="eyebrow bg-primary/5 text-primary border-primary/20 px-2 h-5 text-center">{assignment.type}</Badge>
              </div>
              <p className="text-muted-foreground text-xs font-semibold opacity-50 tracking-wider">Build it block by block — structure only, grading comes next</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
             <div className="text-right space-y-1">
                <p className="eyebrow text-muted-foreground opacity-50">Late Submissions</p>
                <Select value={assignment.latePolicy} onValueChange={(val) => updateAssignment({ latePolicy: val ?? undefined })}>
                  <SelectTrigger className="font-bold text-xs h-10 bg-background/50 border-2 border-border/40 rounded-lg px-4 hover:bg-muted/20 shadow-none transition-colors w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent sideOffset={8} className="z-[105] w-full min-w-[240px] border-border/20 rounded-xl p-1 overflow-hidden shadow-none">
                     <SelectItem value="no-late" className="py-3 font-bold rounded-lg text-xs">No late submissions</SelectItem>
                     <SelectItem value="grace-24" className="py-3 font-bold rounded-lg text-xs">24-hour grace period</SelectItem>
                     <SelectItem value="daily-10" className="py-3 font-bold rounded-lg text-xs">10% deducted per late day</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="text-right space-y-1">
                <p className="eyebrow text-muted-foreground opacity-50">Deadline</p>
                <DateTimePicker
                  date={assignment.deadline}
                  setDate={(d) => updateAssignment({ deadline: d })}
                />
             </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-5">
            <Card className="border border-border/30 rounded-xl bg-card shadow-none">
              <CardContent className="pt-6 pb-6 px-6 space-y-4">
                <div className="space-y-2">
                  <Label className="eyebrow text-muted-foreground opacity-50">Assignment title</Label>
                  <Input
                    placeholder="Give your assignment a name — e.g. MVC Architecture Implementation"
                    className="text-lg font-semibold h-11 border border-border/60 bg-muted/10 px-4 focus-visible:ring-primary/10 rounded-lg placeholder:opacity-30 tracking-tight"
                    value={assignment.title}
                    onChange={(e) => updateAssignment({ title: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {assignment.blocks.map((block) => {
              const isCollapsed = !!collapsed[block.id]
              const canRemove = block.type === "resources"
              const commonHeader = (
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border/10 bg-muted/[0.04]">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <BlockIcon type={block.type} />
                  <Input
                    value={block.title}
                    onChange={(e) => updateBlock(block.id, { title: e.target.value } as Partial<Block>)}
                    className="eyebrow h-7 bg-transparent border-none text-foreground/80 px-0 focus-visible:ring-0 flex-1"
                  />
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => reorderBlock(block.id, "up")}
                      disabled={isFirst(block.id)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => reorderBlock(block.id, "down")}
                      disabled={isLast(block.id)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleCollapsed(block.id)}
                    >
                      {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </Button>
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeBlock(block.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )

              return (
                <Card key={block.id} className="border border-border/30 rounded-xl bg-card shadow-none overflow-hidden">
                  {commonHeader}
                  {!isCollapsed && (
                    <CardContent className="p-6 space-y-4">
                      {block.type === "instructions" && (
                        <InstructionsEditor
                          block={block}
                          onChange={(body) => updateBlock(block.id, { body } as Partial<Block>)}
                          onAIRewrite={(mode) => handleAIRewrite(block.id, mode)}
                        />
                      )}
                      {block.type === "questions" && (
                        <QuestionsEditor
                          block={block}
                          onUpdate={(qId, data) => updateQuestion(block.id, qId, data)}
                          onAdd={() => addQuestion(block.id)}
                          onRemove={(qId) => removeQuestion(block.id, qId)}
                          onImport={() => handleImportFromPast(block.id)}
                          onSuggest={() => handleAddSuggested(block.id)}
                        />
                      )}
                      {block.type === "deliverables" && (
                        <DeliverablesEditor
                          items={block.items}
                          onUpdate={(itemId, data) => updateDeliverableItem(block.id, itemId, data)}
                          onAdd={() => addDeliverableItem(block.id)}
                          onRemove={(itemId) => removeDeliverableItem(block.id, itemId)}
                        />
                      )}
                      {block.type === "resources" && (
                        <ResourcesEditor
                          items={block.items}
                          onUpdate={(itemId, data) => updateResourceItem(block.id, itemId, data)}
                          onAdd={() => addResourceItem(block.id)}
                          onRemove={(itemId) => removeResourceItem(block.id, itemId)}
                        />
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}

            {availableToAdd.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="eyebrow text-muted-foreground opacity-40">Add block</span>
                {availableToAdd.map((opt) => (
                  <Button
                    key={opt.type}
                    variant="outline"
                    size="sm"
                    className="border-dashed"
                    onClick={() => addBlock(opt.type)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 pt-2 text-muted-foreground/60">
              <Info className="h-3.5 w-3.5 opacity-60 mt-0.5 shrink-0" />
              <p className="text-xs font-medium opacity-70 leading-relaxed">
                Set the structure here. Rubrics and evaluation criteria come on the next step — no need to define them yet.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <Card className="border border-border/20 bg-primary/[0.01] sticky top-[90px] rounded-xl backdrop-blur-sm shadow-none overflow-hidden">
              <div className="px-5 py-4 border-b border-border/10 bg-muted/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="eyebrow text-primary/80 leading-tight">Assignment Health</p>
                      <p className="eyebrow text-muted-foreground opacity-40 leading-tight">{readyScore}% ready</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-2xl font-semibold tracking-tight leading-none",
                    readyScore === 100 ? "text-[color:var(--status-success)]" : readyScore >= 60 ? "text-[color:var(--status-warning)]" : "text-muted-foreground/40"
                  )}>
                    {readyScore}%
                  </span>
                </div>
              </div>
              <CardContent className="px-5 pt-5 pb-6 space-y-3">
                {healthChecks.map((c) => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-start gap-2.5">
                      <div className={cn(
                        "mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 border",
                        c.ok
                          ? "bg-[color:var(--status-success)]/10 border-[color:var(--status-success)]/20 text-[color:var(--status-success)]/80"
                          : "bg-[color:var(--status-warning)]/10 border-[color:var(--status-warning)]/20 text-[color:var(--status-warning)]/80"
                      )}>
                        {c.ok ? <Check className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                      </div>
                      <p className={cn(
                        "text-xs font-bold leading-tight",
                        c.ok ? "text-foreground/70" : "text-foreground/90"
                      )}>{c.label}</p>
                    </div>
                    {c.hint && (
                      <p className="text-xs font-medium text-muted-foreground/70 leading-relaxed pl-6">{c.hint}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            size="lg"
            disabled={!canProceed}
            onClick={nextStep}
          >
            Set grading criteria →
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

function TypeRow({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <span className="eyebrow text-muted-foreground opacity-50">{title}</span>
      <p className="text-xs font-medium opacity-75 leading-relaxed">{items.join(" · ")}</p>
    </div>
  )
}

function BlockIcon({ type }: { type: Block["type"] }) {
  const common = "h-4 w-4"
  if (type === "instructions") return <FileText className={cn(common, "text-[color:var(--status-info)] opacity-70")} />
  if (type === "questions") return <FileCheck2 className={cn(common, "text-primary opacity-80")} />
  if (type === "deliverables") return <BookOpen className={cn(common, "text-[color:var(--status-success)] opacity-70")} />
  return <Link2 className={cn(common, "text-[color:var(--status-warning)] opacity-70")} />
}

function InstructionsEditor({
  block,
  onChange,
  onAIRewrite,
}: {
  block: Extract<Block, { type: "instructions" }>
  onChange: (body: string) => void
  onAIRewrite: (mode: "clarity" | "simplify") => void
}) {
  const hasBody = block.body.trim().length > 0
  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Describe what students should do, the context of the assignment, and any constraints or ground rules."
        className="min-h-[140px] text-sm leading-relaxed font-medium bg-muted/5 border border-border/40 px-4 py-3 focus-visible:ring-primary/10 rounded-lg resize-y"
        value={block.body}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground/60">
          <Sparkles className="h-3 w-3 text-primary opacity-70" />
          <span className="text-xs font-semibold opacity-80">AI assist</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAIRewrite("clarity")}
            disabled={!hasBody}
          >
            <Wand2 className="h-3 w-3 mr-1" />
            Improve clarity
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAIRewrite("simplify")}
            disabled={!hasBody}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            Simplify language
          </Button>
        </div>
      </div>
    </div>
  )
}

function QuestionsEditor({
  block,
  onUpdate,
  onAdd,
  onRemove,
  onImport,
  onSuggest,
}: {
  block: Extract<Block, { type: "questions" }>
  onUpdate: (qId: string, data: Partial<Question>) => void
  onAdd: () => void
  onRemove: (qId: string) => void
  onImport: () => void
  onSuggest: () => void
}) {
  const total = block.questions.reduce((s, q) => s + Number(q.weight || 0), 0)
  const needsMore = block.questions.length < 3
  const weightOff = total !== 100

  return (
    <div className="space-y-4">
      {needsMore && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[color:var(--status-warning)]/[0.04] border border-[color:var(--status-warning)]/15">
          <Info className="h-3 w-3 text-[color:var(--status-warning)]/80 shrink-0" />
          <p className="text-xs font-semibold text-[color:var(--status-warning)]/80 leading-tight">
            Add at least 3 questions for better evaluation.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {block.questions.map((q, idx) => (
          <QuestionRow
            key={q.id}
            index={idx + 1}
            question={q}
            onUpdate={(data) => onUpdate(q.id, data)}
            onRemove={() => onRemove(q.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={onAdd}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add question
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onImport}
          >
            <Download className="h-3 w-3 mr-1" />
            Import from past assignment
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSuggest}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Add suggested question
          </Button>
        </div>
        <div className="eyebrow flex items-center gap-1.5">
          <span className="text-muted-foreground/50">Total</span>
          <span className={cn(
            "tabular-nums",
            weightOff ? "text-[color:var(--status-warning)]" : "text-[color:var(--status-success)]"
          )}>{total}%</span>
        </div>
      </div>
    </div>
  )
}

const BLOOM_OPTIONS: { value: BloomLevel; label: string }[] = [
  { value: "L1: Remember", label: "L1 · Remember" },
  { value: "L2: Understand", label: "L2 · Understand" },
  { value: "L3: Apply", label: "L3 · Apply" },
  { value: "L4: Analyze", label: "L4 · Analyze" },
  { value: "L5: Evaluate", label: "L5 · Evaluate" },
  { value: "L6: Create", label: "L6 · Create" },
]

function QuestionRow({
  index,
  question,
  onUpdate,
  onRemove,
}: {
  index: number
  question: Question
  onUpdate: (data: Partial<Question>) => void
  onRemove: () => void
}) {
  const suggestionMatches = question.bloomLevel === question.bloomSuggested
  const suggestedLabel = BLOOM_OPTIONS.find(b => b.value === question.bloomSuggested)?.label ?? question.bloomSuggested

  return (
    <div className="group relative rounded-lg border border-border/30 bg-background/40 hover:border-primary/20 transition-all">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="eyebrow text-muted-foreground/60">Question {index}</span>
        <div className="flex items-center gap-2">
          <div className="eyebrow flex items-center gap-1 text-muted-foreground/50">
            <span>Weight</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={question.weight}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "")
                onUpdate({ weight: Math.min(100, Number(val) || 0) })
              }}
              className="h-7 w-14 text-right pr-2 font-semibold text-xs bg-muted/10 border border-border/40 rounded-md focus-visible:ring-primary/10"
            />
            <span className="text-muted-foreground/40">%</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <Textarea
          placeholder="Write the question prompt — e.g. Decompose the provided monolith into three bounded contexts and justify each boundary."
          className="min-h-[70px] text-sm font-medium bg-transparent border border-border/30 px-3 py-2 focus-visible:ring-primary/10 rounded-md resize-y placeholder:opacity-30"
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Label className="eyebrow text-muted-foreground/50">Bloom&apos;s level</Label>
            <Tooltip>
              <TooltipTrigger className="text-muted-foreground/40 hover:text-primary">
                <HelpCircle className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent className="bg-foreground border-none p-2 rounded-lg shadow-none max-w-[220px]">
                <p className="text-xs font-bold text-primary-foreground leading-relaxed">Cognitive depth for this question. We auto-suggest based on the verbs in the prompt — change it if the suggestion feels off.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={question.bloomLevel} onValueChange={(val) => { if (val) onUpdate({ bloomLevel: val as BloomLevel }) }}>
            <SelectTrigger className="h-7 w-40 font-bold text-xs bg-muted/10 border border-border/40 text-primary rounded-md px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent sideOffset={5} className="z-[105] border border-border/20 rounded-xl p-1 shadow-none">
              {BLOOM_OPTIONS.map(L => (
                <SelectItem key={L.value} value={L.value} className="text-xs font-bold py-1.5 rounded-md">
                  {L.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {question.text.trim().length > 0 && !suggestionMatches && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-dashed"
              onClick={() => onUpdate({ bloomLevel: question.bloomSuggested })}
            >
              <Sparkles className="h-3 w-3" />
              AI suggests {suggestedLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function DeliverablesEditor({
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: DeliverableItem[]
  onUpdate: (itemId: string, data: Partial<DeliverableItem>) => void
  onAdd: () => void
  onRemove: (itemId: string) => void
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[color:var(--status-warning)]/[0.04] border border-[color:var(--status-warning)]/15">
          <AlertTriangle className="h-3 w-3 text-[color:var(--status-warning)]/80 shrink-0" />
          <p className="text-xs font-semibold text-[color:var(--status-warning)]/80 leading-tight">
            Add at least one deliverable so students know what to submit.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className="group grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-start rounded-lg border border-border/30 bg-background/40 px-3 py-2.5 hover:border-primary/20 transition-all">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="eyebrow text-muted-foreground/60 shrink-0">#{idx + 1}</span>
                  <Input
                    placeholder="Deliverable name — e.g. Design document, Source code, Test report"
                    value={item.name}
                    onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                    className="h-8 font-bold text-xs bg-transparent border border-border/30 rounded-md px-2 focus-visible:ring-primary/10"
                  />
                </div>
                <Input
                  placeholder="Short description (optional)"
                  value={item.description}
                  onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                  className="h-7 text-xs font-medium bg-transparent border border-border/20 rounded-md px-2 focus-visible:ring-primary/10 placeholder:opacity-30 ml-6"
                />
              </div>
              <Select value={item.format} onValueChange={(val) => { if (val) onUpdate(item.id, { format: val }) }}>
                <SelectTrigger className="h-8 w-32 text-xs font-bold bg-muted/10 border border-border/40 rounded-md px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent sideOffset={5} className="z-[105] border border-border/20 rounded-xl p-1 shadow-none">
                  <SelectItem value="PDF" className="text-xs font-bold py-1.5 rounded-md">PDF</SelectItem>
                  <SelectItem value="Word Doc" className="text-xs font-bold py-1.5 rounded-md">Word Doc</SelectItem>
                  <SelectItem value="Slides" className="text-xs font-bold py-1.5 rounded-md">Slides</SelectItem>
                  <SelectItem value="Code repo" className="text-xs font-bold py-1.5 rounded-md">Code repo</SelectItem>
                  <SelectItem value="Figma link" className="text-xs font-bold py-1.5 rounded-md">Figma link</SelectItem>
                  <SelectItem value="Video" className="text-xs font-bold py-1.5 rounded-md">Video</SelectItem>
                  <SelectItem value="Other" className="text-xs font-bold py-1.5 rounded-md">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(item.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="border-dashed"
        onClick={onAdd}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add deliverable
      </Button>
    </div>
  )
}

function ResourcesEditor({
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: ResourceItem[]
  onUpdate: (itemId: string, data: Partial<ResourceItem>) => void
  onAdd: () => void
  onRemove: (itemId: string) => void
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-xs font-medium text-muted-foreground/60 leading-relaxed">
          Optional — share textbook chapters, references, starter files, or anything else students should read before starting.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="group grid grid-cols-[1fr_1fr_auto] gap-2 items-center rounded-lg border border-border/30 bg-background/40 px-3 py-2 hover:border-primary/20 transition-all">
              <Input
                placeholder="Resource name"
                value={item.name}
                onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                className="h-8 font-bold text-xs bg-transparent border border-border/30 rounded-md px-2 focus-visible:ring-primary/10"
              />
              <Input
                placeholder="Link (optional)"
                value={item.link}
                onChange={(e) => onUpdate(item.id, { link: e.target.value })}
                className="h-8 text-xs font-medium bg-transparent border border-border/30 rounded-md px-2 focus-visible:ring-primary/10 placeholder:opacity-30"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(item.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="border-dashed"
        onClick={onAdd}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add resource
      </Button>
    </div>
  )
}
