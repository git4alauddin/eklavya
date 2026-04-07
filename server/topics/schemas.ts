import { z } from "zod";

const subjectSchema = z.enum(["math", "physics", "chemistry"]);

export const topicNodeSchema = z.object({
  id: z.string().min(1),
  subject: subjectSchema,
  title: z.string().min(1),
  mathTopic: z.string().min(1),
  gradeBand: z.string().min(1),
  description: z.string().min(1),
  source: z.enum(["site-card", "derived", "ncert"]).optional(),
});

export const topicsGenerateSchema = z.object({
  subject: subjectSchema,
  gradeBand: z.string().min(1),
  board: z.string().min(1),
  sourceUrl: z.string().url(),
  chapterContext: z.string().optional(),
  targetCount: z.number().int().min(1).max(60).default(12),
  llmProfile: z.enum(["fast", "quality"]).optional(),
  llmProvider: z.enum(["ollama", "openrouter"]).optional(),
});

export const topicsGenerateResponseSchema = z.object({
  topics: z.array(topicNodeSchema).min(1),
});

export const manualTopicsIngestSchema = z.object({
  subject: subjectSchema,
  gradeBand: z.string().min(1),
  fileName: z.string().optional(),
  exportName: z.string().optional(),
  topics: z.array(topicNodeSchema).min(1),
});

export type TopicsGeneratePayload = z.infer<typeof topicsGenerateSchema>;
export type ManualTopicsIngestPayload = z.infer<typeof manualTopicsIngestSchema>;
