# AI Study Planner

## Problem Statement

Students usually know *what* they have to study and *when* the exam is, but not *how* to spread the
syllabus across the days they have left. "Study for the exam" is not an actionable task, so planning
gets postponed and revision gets squeezed into the last night.

## Solution

A single-page app. The student enters the subject, the list of topics, the exam date, how many hours
a day they can realistically study, and their current level. The app returns a day-by-day schedule:
each day has a focus, timed tasks (learn / practice / revise / break / mock test), and a progress
bar. Tasks can be ticked off, and the ticks survive a page refresh.

## AI Usage

AI does the part that is genuinely hard to automate with rules: reading a free-form topic list,
judging what depends on what, estimating how long each topic takes for the student's stated level,
and packing that into the hours actually available before the exam date — leaving room for revision
and a mock test. The model returns a strict JSON schedule, which the UI renders directly.

## Features

- Study plan form: subject, topics, exam date, hours per day, current level.
- AI-generated day-by-day plan with per-day focus, timed tasks, and task types.
- Tick-off progress with a per-day progress bar, saved in the browser.

## Technology Stack

- React 19 (TanStack Start, TypeScript, Tailwind CSS)
- Server functions (TypeScript) as the backend layer — same request/response role as a Flask route
- Lovable AI Gateway (`google/gemini-3.7-flash`) for plan generation
- No database — progress is stored in the browser

### Note on Flask

The original brief specified Python Flask. This project runs on a JavaScript server runtime, so the
backend route is written in TypeScript instead. The flow is identical:

```text
React  →  POST { subject, topics, examDate, hoursPerDay, level }
       →  server handler builds the prompt
       →  AI API
       →  JSON schedule
       →  React renders day cards
```

Porting to Flask means moving `src/lib/planner.functions.ts` into a `POST /api/plan` route.

## How to Run

```bash
npm install
npm run dev
```

The app runs on http://localhost:8080. The AI key is read server-side from the `LOVABLE_API_KEY`
environment variable and is never sent to the browser.

## Project Structure

```text
src/
  routes/
    __root.tsx              # HTML shell, fonts, global providers
    index.tsx               # the whole planner page (form + plan view)
  lib/
    planner.functions.ts    # backend: validates input, builds prompt, calls AI, returns JSON
    ai-gateway.server.ts    # AI client setup (server-only)
  styles.css                # design system: colors, fonts, card + gradient tokens
```

## Demo

1. Open the app.
2. Subject: `Organic Chemistry`.
3. Topics: `Nomenclature, isomerism, reaction mechanisms, aldehydes and ketones, amines`.
4. Exam date: pick a date about 10 days out.
5. Hours per day: `3`. Level: `beginner`.
6. Press **Generate study plan**. A loading message appears, then the day cards.
7. Tick a few tasks and refresh the page — the ticks are still there.
