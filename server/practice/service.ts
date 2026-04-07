import { parseJsonFromModel } from "../llm/json";
import { generateWithProvider, isProviderConfigured } from "../llm/provider";
import type { LlmProvider } from "../llm/types";
import { buildPracticePromptFromContract } from "./prompt";
import { practiceRequestSchema, practiceResponseSchema, type PracticeRequestPayload } from "./schemas";

export const parsePracticePayload = (body: unknown) => practiceRequestSchema.safeParse(body);

export const ensurePracticeProviderConfigured = (provider: LlmProvider): boolean => isProviderConfigured(provider);

export const generatePracticeResponse = async (
  payload: PracticeRequestPayload,
  defaultProvider: LlmProvider,
): Promise<ReturnType<typeof practiceResponseSchema.parse>> => {
  const providerForRequest = payload.llmProvider ?? defaultProvider;
  const { systemPrompt, prompt } = await buildPracticePromptFromContract(payload);
  const text = await generateWithProvider(prompt, systemPrompt, {
    provider: providerForRequest,
    ollamaProfile: payload.llmProfile,
  });
  const json = parseJsonFromModel(text);
  return practiceResponseSchema.parse(json);
};
