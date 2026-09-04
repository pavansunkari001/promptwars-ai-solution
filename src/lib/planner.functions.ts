import { createServerFn } from "@tanstack/react-start";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

export const PlanRequestSchema = z.object({
  subject: z.string().min(1).max(120),
  topics: z.string().min(1).max(2000),
  examDate: z.string().min(1).max(30),
  hoursPerDay: z.number().min(0.5).max(16),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

export type PlanRequest = z.infer<typeof PlanRequestSchema>;

const TaskSchema = z.object({
  time: z.string(),
  title: z.string(),
  kind: z.enum(["learn", "practice", "revise", "break", "test"]),
});

const DaySchema = z.object({
  date: z.string(),
  label: z.string(),
  focus: z.string(),
  tasks: z.array(TaskSchema),
});

const PlanSchema = z.object({
  summary: z.string(),
  tips: z.array(z.string()),
  days: z.array(DaySchema),
});

export type StudyPlan = z.infer<typeof PlanSchema>;

export const generateStudyPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanRequestSchema.parse(input))
  .handler(async ({ data }): Promise<StudyPlan> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this app.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const today = new Date().toISOString().slice(0, 10);

    const prompt = [
      `Today is ${today}. Build a realistic day-by-day study plan.`,
      `Subject: ${data.subject}`,
      `Topics / syllabus: ${data.topics}`,
      `Exam date: ${data.examDate}`,
      `Available study time: ${data.hoursPerDay} hours per day`,
      `Current level: ${data.level}`,
      "",
      "Rules:",
      "- Cover every day from today up to and including the exam date, at most 14 days (if the range is longer, group the early period sensibly but still return at most 14 day entries).",
      "- Total task time per day must not exceed the available hours; include one short break per 2 hours.",
      "- Order topics from fundamentals to advanced, and reserve the last 20% of days for revision and a mock test.",
      "- date is YYYY-MM-DD, label is a short human label like 'Day 1 - Mon 8 Sep'.",
      "- time is a duration like '45 min' or '1 h 30 min'.",
      "- focus is one short sentence. summary is 2 sentences. Give 3 to 5 short tips.",
    ].join("\n");

    try {
      const result = streamText({
        model: gateway("google/gemini-3.7-flash"),
        output: Output.object({ schema: PlanSchema }),
        prompt,
      });
      const output = await result.output;
      return {
        summary: output.summary,
        tips: output.tips.slice(0, 5),
        days: output.days.slice(0, 14),
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The AI returned an unexpected answer. Please try again.");
      }
      const message = error instanceof Error ? error.message : "";
      if (message.includes("429")) {
        throw new Error("Too many requests right now. Wait a moment and try again.");
      }
      if (message.includes("402")) {
        throw new Error("AI credits are exhausted. Please top up to keep generating plans.");
      }
      throw new Error("Could not generate a plan right now. Please try again.");
    }
  });
