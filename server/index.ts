import dotenv from "dotenv";
import cors from "cors";
import express from "express";
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

const app = express();
app.use(cors({ origin: ["http://localhost:5173"], credentials: false }));
app.use(express.json({ limit: "1mb" }));

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

const generateWithOpenRouter = async (prompt: string): Promise<string> => {
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
        { role: "system", content: "Return strictly valid JSON only. No markdown." },
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

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Practice API running on http://localhost:${port}`);
});
