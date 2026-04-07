import path from "node:path";
import { parseJsonFromModel } from "../llm/json";
import { generateWithProvider } from "../llm/provider";
import type { LlmProvider } from "../llm/types";
import { buildTopicsPromptFromContract } from "./prompt";
import {
  manualTopicsIngestSchema,
  topicsGenerateResponseSchema,
  topicsGenerateSchema,
  type ManualTopicsIngestPayload,
  type TopicsGeneratePayload,
} from "./schemas";
import { prepareTopicFileNames, upsertTopicsIndex, writeTopicsFile } from "./upsert";

export const parseTopicsGeneratePayload = (body: unknown) => topicsGenerateSchema.safeParse(body);
export const parseManualTopicsIngestPayload = (body: unknown) => manualTopicsIngestSchema.safeParse(body);

export const generateTopics = async (
  payload: TopicsGeneratePayload,
  defaultProvider: LlmProvider,
): Promise<{ topics: ReturnType<typeof topicsGenerateResponseSchema.parse>["topics"] }> => {
  const providerForRequest = payload.llmProvider ?? defaultProvider;
  const { systemPrompt, prompt } = await buildTopicsPromptFromContract(payload);

  const raw = await generateWithProvider(prompt, systemPrompt, {
    provider: providerForRequest,
    ollamaProfile: payload.llmProfile,
  });

  const json = parseJsonFromModel(raw);
  const validated = topicsGenerateResponseSchema.parse(json);

  const normalized = validated.topics.map((topic) => ({
    ...topic,
    source: topic.source ?? "ncert",
  }));

  for (const topic of normalized) {
    if (topic.subject !== payload.subject) {
      throw new Error(`Generated topic '${topic.id}' subject '${topic.subject}' does not match requested subject '${payload.subject}'`);
    }
    if (topic.gradeBand !== payload.gradeBand) {
      throw new Error(`Generated topic '${topic.id}' gradeBand '${topic.gradeBand}' does not match requested gradeBand '${payload.gradeBand}'`);
    }
  }

  return { topics: normalized };
};

export const manualIngestTopics = async (
  payload: ManualTopicsIngestPayload,
): Promise<{
  ok: true;
  written: { topicsFile: string; indexFile: string };
  exportName: string;
  fileBaseName: string;
  topicCount: number;
}> => {
  for (const topic of payload.topics) {
    if (topic.subject !== payload.subject) {
      throw new Error(`Topic '${topic.id}' subject '${topic.subject}' does not match payload.subject '${payload.subject}'`);
    }
    if (topic.gradeBand !== payload.gradeBand) {
      throw new Error(`Topic '${topic.id}' gradeBand '${topic.gradeBand}' does not match payload.gradeBand '${payload.gradeBand}'`);
    }
  }

  const repoRoot = process.cwd();
  const { fileBaseName, exportName } = prepareTopicFileNames(payload);

  const topicsFilePath = await writeTopicsFile(repoRoot, payload.subject, fileBaseName, exportName, payload.topics);
  const indexPath = await upsertTopicsIndex(repoRoot, payload.subject, fileBaseName, exportName);

  return {
    ok: true,
    written: {
      topicsFile: path.relative(repoRoot, topicsFilePath),
      indexFile: path.relative(repoRoot, indexPath),
    },
    exportName,
    fileBaseName,
    topicCount: payload.topics.length,
  };
};
