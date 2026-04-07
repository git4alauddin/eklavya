export type LlmProvider = "openrouter" | "ollama";

export type GenerateOptions = {
  provider?: LlmProvider;
  ollamaProfile?: "fast" | "quality";
};
