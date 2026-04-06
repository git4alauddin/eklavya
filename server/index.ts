import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

dotenv.config({ path: "server/.env" });
dotenv.config();

const requestSchema = z.object({
  mode: z.literal("practice").optional(),
  topicId: z.string().min(1),
  subject: z.enum(["math", "physics", "chemistry"]),
  gradeBand: z.string().min(1),
  mathTopic: z.string().min(1),
  title: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  targetCount: z.number().int().min(1).max(20).default(6),
  learnerId: z.string().optional(),
  schemaVersion: z.number().optional(),
});

const questionSchema = z
  .object({
    id: z.string().min(1),
    topicId: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard"]),
    type: z.enum(["single-choice", "multi-choice", "short"]),
    prompt: z.string().min(1),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1),
        }),
      )
      .optional(),
    correctOptionIds: z.array(z.string().min(1)).optional(),
    correctText: z.string().optional(),
    explanation: z.string().min(1),
    skillTag: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    const isChoice = value.type === "single-choice" || value.type === "multi-choice";
    if (isChoice) {
      if (!value.options || value.options.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choice questions must include at least 2 options" });
      }
      if (!value.correctOptionIds || value.correctOptionIds.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choice questions must include correctOptionIds" });
      }
      if (value.type === "single-choice" && value.correctOptionIds && value.correctOptionIds.length !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Single-choice must have exactly one correct option" });
      }
    }
    if (value.type === "short" && !value.correctText) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Short questions must include correctText" });
    }
  });

const responseSchema = z.object({
  questions: z.array(questionSchema).min(1),
});

const learningStepSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["story", "concept", "single-choice", "multi-choice", "match", "reorder", "checkpoint", "reward"]),
    title: z.string().min(1),
    prompt: z.string().min(1),
  })
  .passthrough();

const learningQuestSchema = z
  .object({
    id: z.string().min(1),
    subject: z.enum(["math", "physics", "chemistry"]),
    topicId: z.string().min(1),
    hook: z.string().min(1),
    learningGoals: z.array(z.string().min(1)).min(1),
    estimatedMinutes: z.number().int().min(1).max(60),
    steps: z.array(learningStepSchema).min(1),
    masteryCheckpointStepId: z.string().min(1),
    reward: z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      description: z.string().min(1),
    }),
    nextUnlockTopicIds: z.array(z.string().min(1)),
  })
  .passthrough();

const manualQuestIngestSchema = z.object({
  subject: z.enum(["math", "physics", "chemistry"]),
  topicId: z.string().min(1),
  fileName: z.string().min(1).optional(),
  exportName: z.string().min(1).optional(),
  quest: learningQuestSchema,
});

const learningGenerateSchema = z.object({
  subject: z.enum(["math", "physics", "chemistry"]),
  topicId: z.string().min(1),
  topicTitle: z.string().min(1),
  mathTopic: z.string().min(1),
  gradeBand: z.string().min(1),
  description: z.string().min(1),
  nextUnlockTopicIds: z.array(z.string().min(1)).default([]),
});

const app = express();
app.use(cors({ origin: ["http://localhost:5173"], credentials: false }));
app.use(express.json({ limit: "2mb" }));

const port = Number(process.env.PORT ?? 3001);
const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const siteUrl = process.env.OPENROUTER_SITE_URL ?? "http://localhost:5173";
const appName = process.env.OPENROUTER_APP_NAME ?? "eklavya-practice";

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error("Unable to parse JSON from model response");
  }
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const generateWithOpenRouter = async (
  prompt: string,
  systemPrompt = "Return strictly valid JSON only. No markdown.",
): Promise<string> => {
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured on backend");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl,
      "X-Title": appName,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = (await response.json()) as OpenRouterResponse;
  if (!response.ok) {
    throw new Error(data?.error?.message ?? `OpenRouter request failed with status ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenRouter returned empty response text");
  return content;
};

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

const buildLearningPromptFromContract = async (payload: z.infer<typeof learningGenerateSchema>) => {
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
const toSafeBaseName = (name: string): string =>
  name
    .trim()
    .replace(/\.ts$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "generatedQuest";

const toSafeExportName = (name: string): string => {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const prefixed = /^[a-zA-Z_]/.test(cleaned) ? cleaned : `quest_${cleaned}`;
  return prefixed || "generatedQuest";
};

const upsertContentsIndex = async (
  repoRoot: string,
  subject: "math" | "physics" | "chemistry",
  fileBaseName: string,
  exportName: string,
): Promise<string> => {
  const indexPath = path.join(repoRoot, "src", "data", subject, "contents", "index.ts");
  const arrayName = `${subject}LearningQuests`;

  let current = "";
  try {
    current = await fs.readFile(indexPath, "utf8");
  } catch {
    current = `export const ${arrayName} = [];\n`;
  }

  const importLine = `import { ${exportName} } from "./${fileBaseName}";`;
  if (!current.includes(importLine)) {
    current = `${importLine}\n${current}`;
  }

  const arrayRegex = new RegExp(`export const ${arrayName} = \\[([\\s\\S]*?)\\];`);
  const arrayMatch = current.match(arrayRegex);
  if (!arrayMatch) {
    current = `${current.trimEnd()}\n\nexport const ${arrayName} = [${exportName}];\n`;
  } else {
    const existing = arrayMatch[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!existing.includes(exportName)) existing.push(exportName);
    current = current.replace(arrayRegex, `export const ${arrayName} = [${existing.join(", ")}];`);
  }

  await fs.writeFile(indexPath, current, "utf8");
  return indexPath;
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, provider: "openrouter", model, llmConfigured: Boolean(apiKey) });
});

app.post("/api/practice", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured on backend" });
  }

  const payload = parsed.data;
  const prompt = [
    "You are generating school practice questions.",
    "Return strictly valid JSON only.",
    "Schema:",
    '{"questions":[{"id":"...","topicId":"...","difficulty":"easy|medium|hard","type":"single-choice|multi-choice|short","prompt":"...","options":[{"id":"a","text":"..."}],"correctOptionIds":["a"],"correctText":"...","explanation":"...","skillTag":"..."}]}',
    "Rules:",
    `- Topic id must be '${payload.topicId}' for every question.`,
    `- Difficulty must be '${payload.difficulty}' for every question.`,
    `- Subject: '${payload.subject}', grade band: '${payload.gradeBand}'.`,
    `- Topic title: '${payload.title}', concept tag: '${payload.mathTopic}'.`,
    `- Generate exactly ${payload.targetCount} questions.`,
    "- For single-choice and multi-choice include options + correctOptionIds.",
    "- For short include correctText.",
    "- Keep language clear for school students and explanations concise.",
    "- Avoid markdown or extra commentary.",
  ].join("\n");

  try {
    const text = await generateWithOpenRouter(prompt);
    const json = parseJson(text);
    const validated = responseSchema.parse(json);
    return res.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    return res.status(502).json({ error: "LLM generation failed", message });
  }
});

app.post("/api/learning/generate", async (req, res) => {
  const parsed = learningGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured on backend" });
  }

  try {
    const { systemPrompt, prompt } = await buildLearningPromptFromContract(parsed.data);
    const raw = await generateWithOpenRouter(prompt, systemPrompt);
    const json = parseJson(raw);
    const quest = learningQuestSchema.parse(json);

    if (quest.subject !== parsed.data.subject || quest.topicId !== parsed.data.topicId) {
      return res.status(502).json({
        error: "LLM output mismatch",
        message: "Generated quest subject/topicId does not match request payload",
      });
    }

    const stepIds = new Set(quest.steps.map((step) => step.id));
    if (!stepIds.has(quest.masteryCheckpointStepId)) {
      return res.status(502).json({
        error: "LLM output invalid",
        message: `masteryCheckpointStepId '${quest.masteryCheckpointStepId}' not found in generated steps`,
      });
    }

    return res.json({ quest });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    return res.status(502).json({ error: "Learning generation failed", message });
  }
});
app.post("/api/learning/manual-ingest", async (req, res) => {
  const parsed = manualQuestIngestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const quest = payload.quest;

  if (quest.subject !== payload.subject) {
    return res.status(400).json({ error: "Subject mismatch", message: "payload.subject must match quest.subject" });
  }
  if (quest.topicId !== payload.topicId) {
    return res.status(400).json({ error: "Topic mismatch", message: "payload.topicId must match quest.topicId" });
  }

  const stepIds = new Set(quest.steps.map((step) => step.id));
  if (!stepIds.has(quest.masteryCheckpointStepId)) {
    return res.status(400).json({
      error: "Invalid checkpoint",
      message: `masteryCheckpointStepId '${quest.masteryCheckpointStepId}' not found in steps`,
    });
  }

  try {
    const repoRoot = process.cwd();
    const fileBaseName = toSafeBaseName(payload.fileName ?? `${payload.topicId}Quest`);
    const exportName = toSafeExportName(payload.exportName ?? `quest_${payload.topicId}`);
    const questFilePath = path.join(repoRoot, "src", "data", payload.subject, "contents", `${fileBaseName}.ts`);

    const questFileSource = [
      'import type { LearningQuest } from "../../../types";',
      "",
      `export const ${exportName}: LearningQuest = ${JSON.stringify(quest, null, 2)};`,
      "",
    ].join("\n");

    await fs.writeFile(questFilePath, questFileSource, "utf8");
    const indexPath = await upsertContentsIndex(repoRoot, payload.subject, fileBaseName, exportName);

    return res.json({
      ok: true,
      written: {
        questFile: path.relative(repoRoot, questFilePath),
        indexFile: path.relative(repoRoot, indexPath),
      },
      exportName,
      fileBaseName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingest error";
    return res.status(500).json({ error: "Manual ingest failed", message });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Practice API running on http://localhost:${port}`);
});

