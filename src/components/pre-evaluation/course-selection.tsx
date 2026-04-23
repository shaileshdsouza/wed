"use client"

import { usePreEvalStore, MOCK_DRAFTS } from "@/lib/store/pre-evaluation-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, ArrowRight, ChevronDown, Sparkles, Plus } from "lucide-react"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"

const STEP_LABELS: Record<number, string> = {
  2: "Starting point",
  3: "Assignment details",
  4: "Grading rubric",
  5: "Preview & publish",
}

export const MOCK_COURSES = [
  {
    id: "cs201",
    name: "Software Engineering",
    code: "CS201",
    dept: "Computer Science",
    semester: "SEM 6",
    credits: 4,
    assignmentCount: 3,
    lastAssignment: "2 days ago",
    status: "Active" as const,
  },
  {
    id: "cs305",
    name: "Database Management",
    code: "CS305",
    dept: "Information Tech",
    semester: "SEM 4",
    credits: 3,
    assignmentCount: 5,
    lastAssignment: "1 week ago",
    status: "Active" as const,
  },
  {
    id: "cs402",
    name: "Artificial Intelligence",
    code: "CS402",
    dept: "Computer Science",
    semester: "SEM 8",
    credits: 4,
    assignmentCount: 2,
    lastAssignment: "3 weeks ago",
    status: "Active" as const,
  },
]

export function CourseSelection() {
  const { setCourse, nextStep, resumeDraft } = usePreEvalStore()
  const hasDrafts = MOCK_DRAFTS.length > 0

  const handleSelect = (courseName: string) => {
    setCourse(courseName)
    nextStep()
  }

  return (
    <TooltipProvider delay={100}>
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20 pt-6 px-4">
        {/* Compact institutional context chips */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="group">
              Department: Computer science
              <ChevronDown className="h-3 w-3 opacity-40 group-hover:opacity-80" />
            </Button>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight secondary-text">Set up your assignment</h1>
            <p className="text-base text-muted-foreground font-medium opacity-70">Select a course to begin</p>
            <div className="flex items-center gap-2 pt-1">
              <Sparkles className="h-3.5 w-3.5 text-primary opacity-50" />
              <p className="text-xs text-muted-foreground opacity-60 font-medium">
                We&apos;ll help you structure, evaluate, and validate your assignment as you go.
              </p>
            </div>
          </div>
        </div>

        {/* Drafts — promoted to primary when they exist */}
        {hasDrafts && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary opacity-70" />
              <h2 className="eyebrow text-primary/80">Continue where you left off</h2>
            </div>
            <div className="flex flex-col gap-3">
              {MOCK_DRAFTS.map((draft) => (
                <div
                  key={draft.id}
                  className="group flex items-center justify-between px-6 py-5 rounded-xl border border-border/30 bg-card hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer"
                  onClick={() => resumeDraft(draft)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 shrink-0">
                      <BookOpen className="h-4 w-4 text-primary opacity-70" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold tracking-tight truncate">{draft.title}</p>
                      <div className="eyebrow flex items-center gap-2 text-muted-foreground opacity-60">
                        <span>{draft.course}</span>
                        <span className="opacity-40">•</span>
                        <span>{draft.semester}</span>
                        <span className="opacity-40">•</span>
                        <span>Edited {draft.lastEdited}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <Badge variant="outline" className="eyebrow border-[color:var(--status-warning)]/20 text-[color:var(--status-warning)]/70 bg-[color:var(--status-warning)]/[0.04] rounded-md hidden md:inline-flex">
                      At {STEP_LABELS[draft.step]}
                    </Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                    >
                      Continue editing
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course cards — secondary when drafts exist, primary otherwise */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
            <h2 className="eyebrow text-muted-foreground opacity-60">
              {hasDrafts ? "Or start a new assignment" : "Choose a course"}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_COURSES.map((course) => (
              <Card
                key={course.id}
                className="group relative overflow-hidden cursor-pointer hover:border-primary/20 transition-all border-border/20 bg-card rounded-xl p-2 flex flex-col shadow-none"
                onClick={() => handleSelect(course.name)}
              >
                <div className="absolute top-6 right-6 z-10 flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[color:var(--status-success)]/5 border border-[color:var(--status-success)]/10">
                    <div className="h-1 w-1 rounded-full bg-[color:var(--status-success)]/70" />
                    <span className="eyebrow text-[color:var(--status-success)]/70">{course.status}</span>
                  </div>
                </div>

                <CardHeader className="pb-6 pt-8 px-6">
                  <div className="p-3 w-fit rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 border border-primary/10">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-6 text-xl font-semibold tracking-tight">{course.name}</CardTitle>
                  <CardDescription className="eyebrow flex items-center gap-2 text-xs opacity-80 mt-1">
                    {course.code} <span className="opacity-40">•</span> {course.semester}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-8 flex-1 flex flex-col justify-end">
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/10">
                    <div className="space-y-1">
                      <span className="eyebrow text-muted-foreground opacity-30">Assignments</span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span>{course.assignmentCount} Created</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="eyebrow text-muted-foreground opacity-30">Last Created</span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Clock className="h-3 w-3 opacity-50" />
                        <span>{course.lastAssignment}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
