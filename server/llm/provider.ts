import type { GenerateOptions, LlmProvider } from "./types";

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

const normalizeProvider = (value: string | undefined): LlmProvider =>
  String(value ?? "openrouter").toLowerCase() === "openrouter" ? "openrouter" : "ollama";

export const getDefaultProvider = (): LlmProvider => normalizeProvider(process.env.LLM_PROVIDER);

const getOpenRouterConfig = () => ({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  siteUrl: process.env.OPENROUTER_SITE_URL ?? "http://localhost:5173",
  appName: process.env.OPENROUTER_APP_NAME ?? "eklavya-practice",
});

const getOllamaConfig = () => ({
  endpoint: process.env.OLLAMA_ENDPOINT ?? "http://127.0.0.1:11434/api/chat",
  profile: String(process.env.OLLAMA_MODEL_PROFILE ?? "fast").toLowerCase(),
  modelFast: process.env.OLLAMA_MODEL_FAST ?? "qwen2.5:3b-instruct",
  modelQuality: process.env.OLLAMA_MODEL_QUALITY ?? "qwen2.5:7b-instruct",
  modelOverride: process.env.OLLAMA_MODEL?.trim(),
});

const selectedOllamaModel = (options: GenerateOptions = {}): string => {
  const cfg = getOllamaConfig();
  if (cfg.modelOverride) return cfg.modelOverride;
  if (options.ollamaProfile === "quality") return cfg.modelQuality;
  if (options.ollamaProfile === "fast") return cfg.modelFast;
  if (cfg.profile === "quality") return cfg.modelQuality;
  return cfg.modelFast;
};

export const isProviderConfigured = (provider: LlmProvider): boolean => {
  if (provider === "ollama") return true;
  return Boolean(getOpenRouterConfig().apiKey);
};

export const getActiveModel = (provider: LlmProvider, options: GenerateOptions = {}): string => {
  if (provider === "ollama") return selectedOllamaModel(options);
  return getOpenRouterConfig().model;
};

const generateWithOpenRouter = async (
  prompt: string,
  systemPrompt = "Return strictly valid JSON only. No markdown.",
): Promise<string> => {
  const cfg = getOpenRouterConfig();
  if (!cfg.apiKey) throw new Error("OPENROUTER_API_KEY is not configured on backend");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": cfg.siteUrl,
      "X-Title": cfg.appName,
    },
    body: JSON.stringify({
      model: cfg.model,
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
  const cfg = getOllamaConfig();
  const response = await fetch(cfg.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedOllamaModel(options),
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

export const generateWithProvider = async (
  prompt: string,
  systemPrompt = "Return strictly valid JSON only. No markdown.",
  options: GenerateOptions = {},
): Promise<string> => {
  const providerForCall = options.provider ?? getDefaultProvider();
  if (providerForCall === "ollama") {
    return generateWithOllama(prompt, systemPrompt, options);
  }
  return generateWithOpenRouter(prompt, systemPrompt);
};
