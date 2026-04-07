import { promises as fs } from "node:fs";
import path from "node:path";
import type { LearningGeneratePayload } from "./schemas";

const extractSection = (content: string, heading: string, nextHeading: string): string => {
  const start = content.indexOf(heading);
  if (start < 0) throw new Error(`Missing section '${heading}' in prompt file`);
  const from = start + heading.length;
  const end = content.indexOf(nextHeading, from);
  if (end < 0) throw new Error(`Missing section '${nextHeading}' in prompt file`);
  return content.slice(from, end).trim();
};

const fillTemplate = (template: string, vars: Record<string, string>): string => {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
};

export const buildLearningPromptFromContract = async (payload: LearningGeneratePayload) => {
  const promptPath = path.join(process.cwd(), "docs", "prompts", "quest-content.md");
  const contract = await fs.readFile(promptPath, "utf8");

  const systemPrompt = extractSection(contract, "## System Prompt", "## User Prompt Template");
  const userTemplate = extractSection(contract, "## User Prompt Template", "## Manual checklist before saving");

  const prompt = fillTemplate(userTemplate, {
    subject: payload.subject,
    topicId: payload.topicId,
    topicTitle: payload.topicTitle,
    mathTopic: payload.mathTopic,
    gradeBand: payload.gradeBand,
    description: payload.description,
    nextUnlockTopicIdsJsonArray: JSON.stringify(payload.nextUnlockTopicIds),
  });

  return { systemPrompt, prompt };
};
