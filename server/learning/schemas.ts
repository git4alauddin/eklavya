import { z } from "zod";

export const learningStepSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["story", "concept", "single-choice", "multi-choice", "match", "reorder", "checkpoint", "reward"]),
    title: z.string().min(1),
    prompt: z.string().min(1),
  })
  .passthrough();

export const learningQuestSchema = z
  .object({
    id: z.string().min(1),
    subject: z.enum(["math", "physics", "chemistry"]),
    topicId: z.string().min(1),
    hook: z.string().min(1),
    learningGoals: z.array(z.string().min(1)).min(1),
    estimatedMinutes: z.number().int().min(1).max(60),
    steps: z.array(learningStepSchema).min(1),
    masteryCheckpointStepId: z.string().min(1),
    reward: z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      description: z.string().min(1),
    }),
    nextUnlockTopicIds: z.array(z.string().min(1)),
  })
  .passthrough();

export const manualQuestIngestSchema = z.object({
  subject: z.enum(["math", "physics", "chemistry"]),
  topicId: z.string().min(1),
  fileName: z.string().min(1).optional(),
  exportName: z.string().min(1).optional(),
  quest: learningQuestSchema,
});

export const learningGenerateSchema = z.object({
  subject: z.enum(["math", "physics", "chemistry"]),
  topicId: z.string().min(1),
  topicTitle: z.string().min(1),
  mathTopic: z.string().min(1),
  gradeBand: z.string().min(1),
  description: z.string().min(1),
  nextUnlockTopicIds: z.array(z.string().min(1)).default([]),
});

export type LearningGeneratePayload = z.infer<typeof learningGenerateSchema>;
