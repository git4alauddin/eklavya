import path from "node:path";
import { parseJsonFromModel } from "../llm/json";
import { generateWithProvider } from "../llm/provider";
import type { LlmProvider } from "../llm/types";
import { toSafeBaseName, toSafeExportName, upsertContentsIndex, writeLearningQuestFile } from "../content/upsert";
import { buildLearningPromptFromContract } from "./prompt";
import { learningGenerateSchema, learningQuestSchema, manualQuestIngestSchema } from "./schemas";

export const parseLearningGeneratePayload = (body: unknown) => learningGenerateSchema.safeParse(body);
export const parseManualLearningIngestPayload = (body: unknown) => manualQuestIngestSchema.safeParse(body);

export const generateLearningQuest = async (
  payload: ReturnType<typeof learningGenerateSchema.parse>,
  defaultProvider: LlmProvider,
): Promise<{ quest: ReturnType<typeof learningQuestSchema.parse> }> => {
  const { systemPrompt, prompt } = await buildLearningPromptFromContract(payload);
  const raw = await generateWithProvider(prompt, systemPrompt, { provider: defaultProvider });
  const json = parseJsonFromModel(raw);
  const quest = learningQuestSchema.parse(json);

  if (quest.subject !== payload.subject || quest.topicId !== payload.topicId) {
    throw new Error("Generated quest subject/topicId does not match request payload");
  }

  const stepIds = new Set(quest.steps.map((step) => step.id));
  if (!stepIds.has(quest.masteryCheckpointStepId)) {
    throw new Error(`masteryCheckpointStepId '${quest.masteryCheckpointStepId}' not found in generated steps`);
  }

  return { quest };
};

export const manualIngestLearningQuest = async (
  payload: ReturnType<typeof manualQuestIngestSchema.parse>,
): Promise<{
  ok: true;
  written: { questFile: string; indexFile: string };
  exportName: string;
  fileBaseName: string;
}> => {
  const quest = payload.quest;

  if (quest.subject !== payload.subject) {
    throw new Error("payload.subject must match quest.subject");
  }
  if (quest.topicId !== payload.topicId) {
    throw new Error("payload.topicId must match quest.topicId");
  }

  const stepIds = new Set(quest.steps.map((step) => step.id));
  if (!stepIds.has(quest.masteryCheckpointStepId)) {
    throw new Error(`masteryCheckpointStepId '${quest.masteryCheckpointStepId}' not found in steps`);
  }

  const repoRoot = process.cwd();
  const fileBaseName = toSafeBaseName(payload.fileName ?? `${payload.topicId}Quest`);
  const exportName = toSafeExportName(payload.exportName ?? `quest_${payload.topicId}`);

  const questFilePath = await writeLearningQuestFile(repoRoot, payload.subject, fileBaseName, exportName, quest);
  const indexPath = await upsertContentsIndex(repoRoot, payload.subject, fileBaseName, exportName);

  return {
    ok: true,
    written: {
      questFile: path.relative(repoRoot, questFilePath),
      indexFile: path.relative(repoRoot, indexPath),
    },
    exportName,
    fileBaseName,
  };
};
