import { Router } from "express";
import { getDefaultProvider, isProviderConfigured } from "../llm/provider";
import {
  generateTopics,
  manualIngestTopics,
  parseManualTopicsIngestPayload,
  parseTopicsGeneratePayload,
} from "../topics/service";
import { buildTopicsSourceScope, topicsSourceScopeSchema } from "../topics/sourceScope";

export const topicsRouter = Router();

topicsRouter.post("/source-scope", (req, res) => {
  const parsed = topicsSourceScopeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  return res.json(buildTopicsSourceScope(parsed.data));
});

topicsRouter.post("/generate", async (req, res) => {
  const parsed = parseTopicsGeneratePayload(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const provider = parsed.data.llmProvider ?? getDefaultProvider();
  if (!isProviderConfigured(provider)) {
    return res.status(500).json({ error: `${provider.toUpperCase()} is not configured on backend` });
  }

  try {
    const result = await generateTopics(parsed.data, getDefaultProvider());
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    if (message.includes("does not match")) {
      return res.status(502).json({ error: "LLM output invalid", message });
    }
    return res.status(502).json({ error: "Topics generation failed", message });
  }
});

topicsRouter.post("/manual-ingest", async (req, res) => {
  const parsed = parseManualTopicsIngestPayload(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const result = await manualIngestTopics(parsed.data);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingest error";
    if (message.includes("does not match")) {
      return res.status(400).json({ error: "Invalid ingest payload", message });
    }
    return res.status(500).json({ error: "Manual ingest failed", message });
  }
});
