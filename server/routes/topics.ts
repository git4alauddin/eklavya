import { Router } from "express";
import { buildTopicsSourceScope, topicsSourceScopeSchema } from "../topics/sourceScope";

export const topicsRouter = Router();

topicsRouter.post("/source-scope", (req, res) => {
  const parsed = topicsSourceScopeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  return res.json(buildTopicsSourceScope(parsed.data));
});
