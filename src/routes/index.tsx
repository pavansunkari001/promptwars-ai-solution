import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, CalendarDays, Loader2, Sparkles, AlertCircle } from "lucide-react";

import { generateStudyPlan, type StudyPlan } from "@/lib/planner.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Study Planner — Day-by-day plan for your next exam" },
      {
        name: "description",
        content:
          "Enter your subject, topics, exam date and daily study hours, and get an AI-built day-by-day study schedule you can tick off as you go.",
      },
      { property: "og:title", content: "AI Study Planner — Day-by-day plan for your next exam" },
      {
        property: "og:description",
        content:
          "Turn a syllabus and an exam date into a realistic daily study schedule with revision and a mock test.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "study-planner-progress";
const PLAN_KEY = "study-planner-plan";
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

const KIND_STYLES: Record<string, string> = {
  learn: "bg-primary/15 text-primary",
  practice: "bg-accent/15 text-accent",
  revise: "bg-secondary text-secondary-foreground",
  test: "bg-destructive/15 text-destructive",
  break: "bg-muted text-muted-foreground",
};

function Index() {
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("3");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("beginner");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [savedPlan, setSavedPlan] = useState<StudyPlan | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
      const rawPlan = localStorage.getItem(PLAN_KEY);
      if (rawPlan) setSavedPlan(JSON.parse(rawPlan) as StudyPlan);
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  const toggleTask = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const createPlan = useServerFn(generateStudyPlan);
  const mutation = useMutation<StudyPlan, Error>({
    mutationFn: () =>
      createPlan({
        data: {
          subject: subject.trim(),
          topics: topics.trim(),
          examDate,
          hoursPerDay: Number(hoursPerDay),
          level,
        },
      }),
    onSuccess: (data) => {
      setDone({});
      setSavedPlan(data);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(PLAN_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    },
  });


  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const plan = mutation.data ?? savedPlan;
  const canSubmit = subject.trim() && topics.trim() && examDate && !mutation.isPending;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 md:py-20">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Sparkles className="size-3.5 text-primary" /> AI Study Planner
        </span>
        <h1 className="mt-5 text-4xl font-bold text-balance md:text-6xl">
          Turn a syllabus into a <span className="text-gradient-warm">day-by-day plan</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Tell it what you're studying, when the exam is, and how many hours you actually have. You
          get a realistic schedule you can tick off.
        </p>
      </header>

      <form onSubmit={onSubmit} className="surface-card mt-10 grid gap-5 p-6 md:grid-cols-2 md:p-8">
        <div className="grid gap-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Organic Chemistry"
            maxLength={120}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="examDate">Exam date</Label>
          <Input
            id="examDate"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="topics">Topics to cover</Label>
          <Textarea
            id="topics"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="Nomenclature, isomerism, reaction mechanisms, aldehydes and ketones, amines..."
            className="min-h-28"
            maxLength={2000}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="hours">Hours you can study per day</Label>
          <Input
            id="hours"
            type="number"
            min={0.5}
            max={16}
            step={0.5}
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Where you are now</Label>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <Button
                key={l}
                type="button"
                variant={level === l ? "default" : "outline"}
                size="sm"
                className="flex-1 capitalize"
                onClick={() => setLevel(l)}
              >
                {l}
              </Button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Building your plan…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Generate study plan
              </>
            )}
          </Button>
        </div>
      </form>

      {mutation.isError && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>{mutation.error.message}</p>
        </div>
      )}

      {mutation.isPending && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Reading your topics and spreading them across the days left…
        </p>
      )}

      {plan && !mutation.isPending && (
        <section className="mt-12">
          <div className="surface-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="size-5 text-primary" /> Your plan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
            {plan.tips.length > 0 && (
              <ul className="mt-4 grid gap-2 text-sm">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 grid gap-4">
            {plan.days.map((day, dayIndex) => {
              const total = day.tasks.length;
              const completed = day.tasks.filter((_, i) => done[`${dayIndex}-${i}`]).length;
              const pct = total ? Math.round((completed / total) * 100) : 0;

              return (
                <article key={dayIndex} className="surface-card p-5 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-bold">
                        <CalendarDays className="size-4 text-primary" />
                        {day.label}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{day.focus}</p>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {completed}/{total} done
                    </span>
                  </div>

                  <Progress value={pct} className="mt-4 h-1.5" />

                  <ul className="mt-4 grid gap-2">
                    {day.tasks.map((task, i) => {
                      const id = `${dayIndex}-${i}`;
                      const checked = Boolean(done[id]);
                      return (
                        <li
                          key={id}
                          className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2.5"
                        >
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={() => toggleTask(id)}
                          />
                          <label
                            htmlFor={id}
                            className={`flex-1 cursor-pointer text-sm ${checked ? "text-muted-foreground line-through" : ""}`}
                          >
                            {task.title}
                          </label>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${KIND_STYLES[task.kind] ?? KIND_STYLES["learn"]}`}
                          >
                            {task.kind}
                          </span>
                          <span className="w-20 text-right text-xs text-muted-foreground">
                            {task.time}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
