import { Router } from "express";
import {
  parseLearningGeneratePayload,
  parseManualLearningIngestPayload,
  generateLearningQuest,
  manualIngestLearningQuest,
} from "../learning/service";
import { getDefaultProvider, isProviderConfigured } from "../llm/provider";

export const learningRouter = Router();

learningRouter.post("/generate", async (req, res) => {
  const parsed = parseLearningGeneratePayload(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const provider = getDefaultProvider();
  if (!isProviderConfigured(provider)) {
    return res.status(500).json({ error: "LLM provider is not configured on backend" });
  }

  try {
    const result = await generateLearningQuest(parsed.data, provider);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";

    if (message.includes("subject/topicId") || message.includes("masteryCheckpointStepId")) {
      return res.status(502).json({ error: "LLM output invalid", message });
    }

    return res.status(502).json({ error: "Learning generation failed", message });
  }
});

learningRouter.post("/manual-ingest", async (req, res) => {
  const parsed = parseManualLearningIngestPayload(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const result = await manualIngestLearningQuest(parsed.data);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingest error";

    if (message.includes("must match") || message.includes("masteryCheckpointStepId")) {
      return res.status(400).json({ error: "Invalid ingest payload", message });
    }

    return res.status(500).json({ error: "Manual ingest failed", message });
  }
});
