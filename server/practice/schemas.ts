import { z } from "zod";

export const practiceRequestSchema = z.object({
  mode: z.literal("practice").optional(),
  topicId: z.string().min(1),
  subject: z.enum(["math", "physics", "chemistry"]),
  gradeBand: z.string().min(1),
  mathTopic: z.string().min(1),
  title: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  targetCount: z.number().int().min(1).max(20).default(6),
  learnerId: z.string().optional(),
  schemaVersion: z.number().optional(),
  llmProfile: z.enum(["fast", "quality"]).optional(),
  llmProvider: z.enum(["ollama", "openrouter"]).optional(),
});

const practiceQuestionSchema = z
  .object({
    id: z.string().min(1),
    topicId: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard"]),
    type: z.enum(["single-choice", "multi-choice", "short"]),
    prompt: z.string().min(1),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1),
        }),
      )
      .optional(),
    correctOptionIds: z.array(z.string().min(1)).optional(),
    correctText: z.string().optional(),
    explanation: z.string().min(1),
    skillTag: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    const isChoice = value.type === "single-choice" || value.type === "multi-choice";
    if (isChoice) {
      if (!value.options || value.options.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choice questions must include at least 2 options" });
      }
      if (!value.correctOptionIds || value.correctOptionIds.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choice questions must include correctOptionIds" });
      }
      if (value.type === "single-choice" && value.correctOptionIds && value.correctOptionIds.length !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Single-choice must have exactly one correct option" });
      }
    }
    if (value.type === "short" && !value.correctText) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Short questions must include correctText" });
    }
  });

export const practiceResponseSchema = z.object({
  questions: z.array(practiceQuestionSchema).min(1),
});

export type PracticeRequestPayload = z.infer<typeof practiceRequestSchema>;
