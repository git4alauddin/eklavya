import { Router } from "express";
import { parsePracticePayload, generatePracticeResponse } from "../practice/service";
import { getDefaultProvider, isProviderConfigured } from "../llm/provider";

export const practiceRouter = Router();

practiceRouter.post("/", async (req, res) => {
  const parsed = parsePracticePayload(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const defaultProvider = getDefaultProvider();
  const providerForRequest = parsed.data.llmProvider ?? defaultProvider;
  if (!isProviderConfigured(providerForRequest)) {
    return res.status(500).json({ error: `${providerForRequest.toUpperCase()} is not configured on backend` });
  }

  try {
    const validated = await generatePracticeResponse(parsed.data, defaultProvider);
    return res.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    return res.status(502).json({ error: "LLM generation failed", message });
  }
});
