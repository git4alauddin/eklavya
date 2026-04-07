import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { graphData } from "../src/graphData";
import { buildPracticePrompt } from "./practice/prompt";
import { practiceRequestSchema, practiceResponseSchema } from "./practice/schemas";
import { buildLearningPromptFromContract } from "./learning/prompt";
import { learningGenerateSchema, learningQuestSchema, manualQuestIngestSchema } from "./learning/schemas";

dotenv.config({ path: "server/.env" });
dotenv.config();

const topicsSourceScopeSchema = z.object({
  subject: z.enum(["math", "physics", "chemistry"]),
  grades: z.string().min(1),
  board: z.string().min(1),
  source: z.string().url(),
  includeChapterContext: z.boolean(),
});

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const u = new URL(origin);
        const hostOk = u.hostname === "localhost" || u.hostname === "127.0.0.1";
        if (hostOk) return callback(null, true);
      } catch {
        // fall through
      }
      callback(new Error("CORS origin not allowed"));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "2mb" }));

const port = Number(process.env.PORT ?? 3001);
type LlmProvider = "openrouter" | "ollama";
const llmProvider: LlmProvider = String(process.env.LLM_PROVIDER ?? "openrouter").toLowerCase() === "openrouter" ? "openrouter" : "ollama";

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const siteUrl = process.env.OPENROUTER_SITE_URL ?? "http://localhost:5173";
const appName = process.env.OPENROUTER_APP_NAME ?? "eklavya-practice";

const ollamaEndpoint = process.env.OLLAMA_ENDPOINT ?? "http://127.0.0.1:11434/api/chat";
const ollamaProfile = String(process.env.OLLAMA_MODEL_PROFILE ?? "fast").toLowerCase();
const ollamaModelFast = process.env.OLLAMA_MODEL_FAST ?? "qwen2.5:3b-instruct";
const ollamaModelQuality = process.env.OLLAMA_MODEL_QUALITY ?? "qwen2.5:7b-instruct";
const ollamaModelOverride = process.env.OLLAMA_MODEL?.trim();

const selectedOllamaModel = (): string => {
  if (ollamaModelOverride) return ollamaModelOverride;
  if (ollamaProfile === "quality") return ollamaModelQuality;
  return ollamaModelFast;
};

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

type OllamaResponse = {
  message?: {
    content?: string;
  };
  response?: string;
  error?: string;
};

type GenerateOptions = {
  ollamaProfile?: "fast" | "quality";
  provider?: "ollama" | "openrouter";
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

const generateWithOllama = async (
  prompt: string,
  systemPrompt = "Return strictly valid JSON only. No markdown.",
  options: GenerateOptions = {},
): Promise<string> => {
  const modelForCall =
    ollamaModelOverride
      ? ollamaModelOverride
      : options.ollamaProfile === "quality"
        ? ollamaModelQuality
        : options.ollamaProfile === "fast"
          ? ollamaModelFast
          : selectedOllamaModel();

  const response = await fetch(ollamaEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelForCall,
      stream: false,
      options: {
        temperature: 0.4,
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = (await response.json()) as OllamaResponse;
  if (!response.ok) {
    throw new Error(data?.error ?? `Ollama request failed with status ${response.status}`);
  }

  const content = (data?.message?.content ?? data?.response ?? "").trim();
  if (!content) throw new Error("Ollama returned empty response text");
  return content;
};

const generateWithProvider = async (
  prompt: string,
  systemPrompt = "Return strictly valid JSON only. No markdown.",
  options: GenerateOptions = {},
): Promise<string> => {
  const providerForCall = options.provider ?? llmProvider;

  if (providerForCall === "ollama") {
    return generateWithOllama(prompt, systemPrompt, options);
  }

  if (providerForCall === "openrouter") {
    return generateWithOpenRouter(prompt, systemPrompt);
  }

  throw new Error(`Unsupported LLM provider '${providerForCall}'`);
};

const parseGradeBands = (grades: string): string[] => {
  const compact = grades.replace(/\s+/g, "").toUpperCase();
  const range = compact.match(/^G(\d+)-G(\d+)$/);
  if (range) {
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      const out: string[] = [];
      for (let g = start; g <= end; g += 1) out.push(`G${g}`);
      return out;
    }
  }

  return compact
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("G") ? item : `G${item}`));
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

const isLlmConfigured = (): boolean => {
  if (llmProvider === "ollama") return true;
  if (llmProvider === "openrouter") return Boolean(apiKey);
  return false;
};

const activeModel = (): string => {
  if (llmProvider === "ollama") return selectedOllamaModel();
  return model;
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, provider: llmProvider, model: activeModel(), llmConfigured: isLlmConfigured() });
});

app.post("/api/topics/source-scope", (req, res) => {
  const parsed = topicsSourceScopeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const gradeBands = parseGradeBands(payload.grades);

  const matched = graphData.topics
    .filter((topic) => topic.subject === payload.subject)
    .filter((topic) => gradeBands.length === 0 || gradeBands.includes(topic.gradeBand));

  const sample = matched.slice(0, 8).map((topic) => ({
    id: topic.id,
    title: topic.title,
    gradeBand: topic.gradeBand,
    mathTopic: topic.mathTopic,
  }));

  return res.json({
    normalizedScope: {
      subject: payload.subject,
      board: payload.board,
      source: payload.source,
      includeChapterContext: payload.includeChapterContext,
      gradeBands,
    },
    stats: {
      matchedTopicCount: matched.length,
      sampleCount: sample.length,
    },
    sample,
  });
});

app.post("/api/practice", async (req, res) => {
  const parsed = practiceRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  if (!isLlmConfigured()) {
    return res.status(500).json({ error: "LLM provider is not configured on backend" });
  }

  const payload = parsed.data;
  const providerForRequest = payload.llmProvider ?? llmProvider;
  if (providerForRequest === "openrouter" && !apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured on backend" });
  }

  const prompt = buildPracticePrompt(payload);

  try {
    const text = await generateWithProvider(prompt, "Return strictly valid JSON only. No markdown.", {
      provider: providerForRequest,
      ollamaProfile: payload.llmProfile,
    });
    const json = parseJson(text);
    const validated = practiceResponseSchema.parse(json);
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

  if (!isLlmConfigured()) {
    return res.status(500).json({ error: "LLM provider is not configured on backend" });
  }

  try {
    const { systemPrompt, prompt } = await buildLearningPromptFromContract(parsed.data);
    const raw = await generateWithProvider(prompt, systemPrompt);
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






