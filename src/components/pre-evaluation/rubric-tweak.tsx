"use client"

import { usePreEvalStore, CO_DEFINITIONS } from "@/lib/store/pre-evaluation-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import {
  Plus,
  Check,
  ArrowLeft,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ChevronDown
} from "lucide-react"
import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function RubricTweak() {
  const { rubric, updateRubric, addCriterion, nextStep, prevStep } = usePreEvalStore()
  const [healthScore, setHealthScore] = useState(0)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    const score = rubric.length >= 3 ? 96 : 82;
    const timer = setTimeout(() => setHealthScore(score), 500)
    return () => clearTimeout(timer)
  }, [rubric])

  const updateLevelDescription = (critId: string, levelLabel: string, newDesc: string) => {
    const newRubric = rubric.map(crit => {
      if (crit.id === critId) {
        return {
          ...crit,
          version: "v1.1 (Modified)",
          levels: crit.levels.map(lvl => lvl.label === levelLabel ? { ...lvl, description: newDesc } : lvl)
        }
      }
      return crit
    })
    updateRubric(newRubric)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-6 px-4">
        {/* Header - Flat & Lean */}
        <div className="flex items-center justify-between border-b border-border/10 pb-6 sticky top-0 z-50 bg-background/80 backdrop-blur-md -mx-4 px-4 pt-4 shadow-none">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-0">
              <h1 className="text-2xl font-semibold tracking-tight secondary-text">Grading Rubric</h1>
              <p className="eyebrow font-semibold text-muted-foreground/40">Define your grade levels</p>
            </div>
          </div>


        </div>

        {/* Quick Insights Bar - Top Aligned */}
        <Card className="border border-border/20 bg-background/50 backdrop-blur-md rounded-xl overflow-hidden shadow-none">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 border-r border-border/10 pr-6">
                <div className="space-y-1">
                  <p className="eyebrow text-muted-foreground opacity-50">Readiness</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold text-primary tracking-tight">{healthScore}%</span>
                    <Progress value={healthScore} className="h-1 w-24 rounded-full bg-muted/20 shadow-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 border-r border-border/10 pr-6">
                <Tooltip>
                  <TooltipTrigger className="flex gap-2 items-center cursor-help group">
                    <div className="h-6 w-6 rounded-md bg-[color:var(--status-success)]/10 flex items-center justify-center shrink-0 border border-[color:var(--status-success)]/20 group-hover:bg-[color:var(--status-success)] group-hover:text-primary-foreground transition-all">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <p className="eyebrow text-foreground">Learning goals linked</p>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-foreground border-none p-2"><p className="text-xs font-bold text-primary-foreground">All criteria are linked to your course's learning goals</p></TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger className="flex gap-2 items-center cursor-help group">
                    <div className="h-6 w-6 rounded-md bg-[color:var(--status-success)]/10 flex items-center justify-center shrink-0 border border-[color:var(--status-success)]/20 group-hover:bg-[color:var(--status-success)] group-hover:text-primary-foreground transition-all">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <p className="eyebrow text-foreground">Grade levels defined</p>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-foreground border-none p-2"><p className="text-xs font-bold text-primary-foreground">AI will use these descriptions to assist with grading</p></TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-3 bg-primary/[0.02] px-3 py-1.5 rounded-lg border border-primary/10 transition-all">
                <FileSpreadsheet className="h-4 w-4 text-primary/40" />
                <p className="eyebrow text-primary/60">AI grading support active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Matrix Area - Full Width */}
        <div className="space-y-6 shadow-none">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                   <Layers className="h-4 w-4" />
                 </div>
                 <h3 className="eyebrow secondary-text opacity-50">
                   Grading criteria
                 </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addCriterion}
              >
                <Plus className="h-3.5 w-3.5" />
                New criterion
              </Button>
           </div>

          <Card className="border border-border/30 overflow-hidden rounded-xl bg-card shadow-none">
            {/*
              Sticky first column relies on the DS Table primitive's own
              <div className="overflow-x-auto"> wrapper as the scrolling
              ancestor. No extra outer overflow wrapper here.
            */}
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-muted/[0.01] border-b border-border/10 hover:bg-muted/[0.01]">
                  <TableHead className="eyebrow p-6 text-left text-muted-foreground/30 border-r border-border/10 w-96 bg-background/30 sticky left-0 z-10 backdrop-blur-md whitespace-normal">Criteria</TableHead>
                  {["Exemplary", "Proficient", "Developing", "Beginning"].map((level, i) => (
                    <TableHead key={level} className="p-4 text-center border-r border-border/10 min-w-[200px] whitespace-normal h-auto">
                      <div className="space-y-0.5">
                        <span className={`eyebrow ${i === 0 ? 'text-primary' : 'text-muted-foreground/50'}`}>{level}</span>
                        <span className="block text-xs font-semibold text-muted-foreground/30 tracking-tight">Grade: {i === 0 ? '100' : i === 1 ? '75' : i === 2 ? '50' : '25'}%</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubric.map((crit) => (
                  <TableRow key={crit.id} className="border-b border-border/10 hover:bg-primary/[0.01] group">
                    <TableCell className="p-6 border-r border-border/10 bg-muted/[0.01] align-top space-y-3 sticky left-0 z-10 backdrop-blur-sm w-96 whitespace-normal">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <Textarea
                            value={crit.name}
                            className="font-semibold text-xs text-foreground tracking-tight leading-tight border border-border/40 p-3 h-auto min-h-[60px] bg-background/50 focus-visible:ring-primary/20 shadow-none rounded-lg resize-none"
                            placeholder="Enter criterion name..."
                            onChange={(e) => {
                              updateRubric(rubric.map(c => c.id === crit.id ? { ...c, name: e.target.value } : c))
                            }}
                          />
                          <div className="flex items-center justify-between">
                            <Tooltip>
                              <TooltipTrigger className="text-xs font-semibold tracking-widest border-border/20 text-muted-foreground/60 bg-background/30 py-0 px-2 rounded-full h-4 shadow-none cursor-help">
                                <Badge variant="outline" className="border-none p-0 h-auto">
                                  {crit.linkedCO}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[200px] text-xs font-bold bg-foreground border-none p-3 rounded-lg shadow-none">
                                <p className="eyebrow text-primary mb-1">Linked learning goal</p>
                                <p className="text-primary-foreground/80">{CO_DEFINITIONS[crit.linkedCO] || "Standard institutional goal"}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Button variant="ghost" size="icon-xs" onClick={() => setExpandedRow(expandedRow === crit.id ? null : crit.id)}>
                              {expandedRow === crit.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {crit.levels.map((lvl) => (
                      <TableCell key={lvl.label} className="p-4 border-r border-border/10 align-top whitespace-normal">
                        <Textarea
                          className="text-xs font-medium leading-relaxed bg-background/40 border border-border/60 focus-visible:ring-1 focus-visible:ring-primary/10 p-3 min-h-[140px] resize-none hover:bg-background/50 rounded-lg transition-all shadow-none placeholder:opacity-10"
                          value={lvl.description}
                          onChange={(e) => updateLevelDescription(crit.id, lvl.label, e.target.value)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="flex justify-end pt-10 shadow-none">
          <Button
            size="lg"
            onClick={nextStep}
          >
            Check calibration →
          </Button>
        </div>
      </div>
  )
}
