import { Router } from "express";
import { getActiveModel, getDefaultProvider, isProviderConfigured } from "../llm/provider";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const provider = getDefaultProvider();
  res.json({
    ok: true,
    provider,
    model: getActiveModel(provider),
    llmConfigured: isProviderConfigured(provider),
  });
});
