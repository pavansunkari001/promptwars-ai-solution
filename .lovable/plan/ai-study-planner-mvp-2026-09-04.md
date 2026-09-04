# AI Study Planner — MVP

## Problem
Students have a syllabus, an exam date, and limited hours per day, but no realistic plan. They procrastinate because "study for the exam" is not an actionable task list.

## Solution
One page. The student enters subject/topics, exam date, and hours available per day. The app asks an AI model to produce a day-by-day study schedule with topics, time blocks, and a revision pass. The plan is shown as clean daily cards, and each task can be ticked off.

## One important note on the stack
The brief asks for Python Flask. This environment runs React with a built-in JavaScript server layer — Python cannot run here. The architecture is identical (React → POST → server route → build prompt → AI API → JSON → React), just written in TypeScript instead of Flask. If the hackathon requires Flask specifically, the same server code maps 1:1 to a Flask route and I can hand you that file to drop into a `backend/` folder.

## Architecture

```text
React page (form + plan view)
        |  POST { subject, topics, examDate, hoursPerDay, level }
        v
Server function  ->  builds prompt  ->  AI model (Lovable AI)
        |  returns strict JSON schedule
        v
React renders day cards + checkboxes
```

## Features (only these)
1. Study plan form — subject, topics, exam date, hours/day, current level.
2. AI-generated day-by-day plan — each day has date, topics, timed tasks, and a short focus note.
3. Progress ticking — check off tasks; progress bar per day. Stored in the browser so nothing is lost on refresh.

No accounts, no database, no export, no multi-plan history in the MVP.

## Technical details
- Route: rewrite `src/routes/index.tsx` as the planner page.
- Server: `src/lib/planner.functions.ts` with a `createServerFn` POST handler; input validated with Zod; prompt built server-side; model `google/gemini-3.7-flash` via the Lovable AI gateway with a strict JSON response shape; gateway errors (rate limit, credits) surfaced as readable messages.
- Client state: `useState` for the form, TanStack Query mutation for the request, loading and error states, `localStorage` for checked tasks.
- Secrets: the AI key stays server-side only, never in the page.
- Design system in `src/styles.css`: focused, warm study aesthetic — deep ink background, amber accent, generous cards, no purple gradients.
- README.md at project root filled in with problem, solution, AI usage, features, stack, how to run, structure, demo steps.

## Testing
Call the server function directly with sample input and confirm valid JSON, then drive the page in a browser to verify submit → loading → plan render → checkbox persistence.
