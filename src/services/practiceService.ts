import { graphData } from "../graphData";
import type { PracticeDifficulty, PracticePack, PracticeQuestion, Subject, TopicNode } from "../types";
import { practicePacks, validatePracticePacks } from "../data/practice";

type PracticeFetchSource = "local-only" | "local+cache" | "local+llm" | "llm-only" | "cache-only";

export type PracticePipeline = "local-cache" | "llm-fast" | "llm-quality" | "openrouter";
export type PracticeServedBy = "local" | "cache" | "ollama" | "openrouter";

type GetPracticeQuestionsInput = {
  topicId: string;
  difficulty: PracticeDifficulty;
  targetCount?: number;
  learnerId?: string;
  preferredSkillTags?: string[];
};

export type PracticeSession = {
  topic: TopicNode;
  questions: PracticeQuestion[];
  source: PracticeFetchSource;
  servedBy: PracticeServedBy;
  fetchedAt: string;
  latencyMs?: number;
};

type LlmRequest = {
  topic: TopicNode;
  difficulty: PracticeDifficulty;
  targetCount: number;
  learnerId?: string;
  preferredSkillTags?: string[];
  llmProfile?: "fast" | "quality";
  llmProvider?: "ollama" | "openrouter";
};

const DEFAULT_TARGET_COUNT = 6;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const cachePrefix = "eklavya.practice";
const pipelinePrefKey = "eklavya.practice.pipeline";

const isBrowser = (): boolean => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizePipelinePreference = (value: string | null | undefined): PracticePipeline | null => {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "local-cache") return "local-cache";
  if (normalized === "llm-fast") return "llm-fast";
  if (normalized === "llm-quality") return "llm-quality";
  if (normalized === "openrouter") return "openrouter";
  return null;
};

const defaultPipelineFromEnv = (): PracticePipeline => {
  const flag = String(import.meta.env.VITE_ENABLE_PRACTICE_LLM ?? "").toLowerCase();
  return flag === "false" ? "local-cache" : "llm-fast";
};

export const getPracticePipelinePreference = (): PracticePipeline => {
  if (!isBrowser()) return defaultPipelineFromEnv();
  return normalizePipelinePreference(window.localStorage.getItem(pipelinePrefKey)) ?? defaultPipelineFromEnv();
};

export const setPracticePipelinePreference = (pipeline: PracticePipeline): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(pipelinePrefKey, pipeline);
};

const cacheKey = (topicId: string, difficulty: PracticeDifficulty, learnerId?: string): string =>
  `${cachePrefix}.${topicId}.${difficulty}.${learnerId ?? "anon"}`;

const makeSeed = (topicId: string, difficulty: PracticeDifficulty, learnerId?: string): string =>
  `${topicId}::${difficulty}::${learnerId ?? "anon"}`;

const shuffleDeterministic = <T>(items: T[], seedKey: string): T[] => {
  const arr = [...items];
  let seed = 0;
  for (let i = 0; i < seedKey.length; i += 1) {
    seed = (seed * 31 + seedKey.charCodeAt(i)) >>> 0;
  }
  for (let i = arr.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const dedupeQuestions = (questions: PracticeQuestion[]): PracticeQuestion[] => {
  const seen = new Set<string>();
  const out: PracticeQuestion[] = [];
  for (const q of questions) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
};

const prioritizeBySkills = (
  questions: PracticeQuestion[],
  preferredSkillTags: string[] | undefined,
  seedKey: string,
): PracticeQuestion[] => {
  if (!preferredSkillTags || preferredSkillTags.length === 0) {
    return shuffleDeterministic(questions, seedKey);
  }

  const preferred = new Set(preferredSkillTags.map((item) => item.trim().toLowerCase()).filter(Boolean));
  if (preferred.size === 0) {
    return shuffleDeterministic(questions, seedKey);
  }

  const matching = questions.filter((q) => preferred.has(q.skillTag.trim().toLowerCase()));
  const others = questions.filter((q) => !preferred.has(q.skillTag.trim().toLowerCase()));

  return [
    ...shuffleDeterministic(matching, `${seedKey}::preferred`),
    ...shuffleDeterministic(others, `${seedKey}::others`),
  ];
};

const getTopic = (topicId: string): TopicNode => {
  const topic = graphData.topics.find((t) => t.id === topicId);
  if (!topic) {
    throw new Error(`Unknown topic '${topicId}'`);
  }
  return topic;
};

const getLocalQuestions = (
  topicId: string,
  difficulty: PracticeDifficulty,
  targetCount: number,
  learnerId?: string,
  preferredSkillTags?: string[],
): PracticeQuestion[] => {
  const pack = practicePacks.find((p) => p.topicId === topicId);
  if (!pack) return [];

  const sameDifficulty = pack.questions.filter((q) => q.difficulty === difficulty);
  const fallbackOther = pack.questions.filter((q) => q.difficulty !== difficulty);

  const ordered = [
    ...prioritizeBySkills(sameDifficulty, preferredSkillTags, makeSeed(topicId, difficulty, learnerId)),
    ...prioritizeBySkills(fallbackOther, preferredSkillTags, makeSeed(topicId, "easy", learnerId)),
  ];
  return ordered.slice(0, targetCount);
};

type CachedSession = {
  createdAt: number;
  questions: PracticeQuestion[];
};

const readCachedQuestions = (
  topicId: string,
  difficulty: PracticeDifficulty,
  learnerId?: string,
): PracticeQuestion[] => {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(cacheKey(topicId, difficulty, learnerId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CachedSession;
    if (!parsed?.createdAt || !Array.isArray(parsed.questions)) return [];
    const expired = Date.now() - parsed.createdAt > CACHE_TTL_MS;
    if (expired) {
      window.localStorage.removeItem(cacheKey(topicId, difficulty, learnerId));
      return [];
    }
    return parsed.questions;
  } catch {
    return [];
  }
};

const writeCachedQuestions = (
  topicId: string,
  difficulty: PracticeDifficulty,
  questions: PracticeQuestion[],
  learnerId?: string,
): void => {
  if (!isBrowser() || questions.length === 0) return;
  const payload: CachedSession = { createdAt: Date.now(), questions };
  window.localStorage.setItem(cacheKey(topicId, difficulty, learnerId), JSON.stringify(payload));
};

const shouldUseLlm = (): boolean => {
  const pipeline = getPracticePipelinePreference();
  return pipeline !== "local-cache";
};

const normalizeLlmPack = (
  topic: TopicNode,
  difficulty: PracticeDifficulty,
  questions: PracticeQuestion[],
): PracticePack => ({
  subject: topic.subject,
  topicId: topic.id,
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  source: "llm-draft",
  questions: questions.map((q, index) => ({
    ...q,
    id: `llm_${topic.id}_${difficulty}_${index + 1}_${((q.id ?? "q").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_")) || "q"}`,
    topicId: topic.id,
    difficulty: q.difficulty ?? difficulty,
  })),
});

const fetchLlmQuestions = async ({
  topic,
  difficulty,
  targetCount,
  learnerId,
  preferredSkillTags,
  llmProfile,
  llmProvider,
}: LlmRequest): Promise<PracticeQuestion[]> => {
  if (!shouldUseLlm()) {
    throw new Error("LLM is explicitly disabled by config");
  }

  const endpoint = import.meta.env.VITE_PRACTICE_LLM_ENDPOINT;
  if (!endpoint) {
    throw new Error("LLM endpoint is not configured");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "practice",
      topicId: topic.id,
      subject: topic.subject,
      gradeBand: topic.gradeBand,
      mathTopic: topic.mathTopic,
      title: topic.title,
      difficulty,
      targetCount,
      learnerId: learnerId ?? "anon",
      schemaVersion: 1,
      preferredSkillTags: preferredSkillTags ?? [],
      llmProfile,
      llmProvider,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM generation failed with status ${response.status}`);
  }

  const json = (await response.json()) as { questions?: PracticeQuestion[] } | PracticePack;
  const questions = Array.isArray((json as PracticePack).questions)
    ? (json as PracticePack).questions
    : Array.isArray((json as { questions?: PracticeQuestion[] }).questions)
      ? (json as { questions?: PracticeQuestion[] }).questions ?? []
      : [];

  if (questions.length === 0) {
    throw new Error("LLM returned empty question set");
  }

  const pack = normalizeLlmPack(topic, difficulty, questions);
  validatePracticePacks([pack]);
  return pack.questions;
};

export const getPracticeQuestions = async ({
  topicId,
  difficulty,
  targetCount = DEFAULT_TARGET_COUNT,
  learnerId,
  preferredSkillTags,
}: GetPracticeQuestionsInput): Promise<PracticeSession> => {
  const startedAt = Date.now();
  const startedPerf = typeof performance !== "undefined" ? performance.now() : startedAt;
  const topic = getTopic(topicId);
  const local = getLocalQuestions(topicId, difficulty, targetCount, learnerId, preferredSkillTags);

  const cached = readCachedQuestions(topicId, difficulty, learnerId);
  const cachedQuestions = dedupeQuestions(cached).filter((q) => q.topicId === topicId);

  const localFallback = dedupeQuestions([...local, ...cachedQuestions]).slice(0, targetCount);
  const selectedPipeline = getPracticePipelinePreference();
  const llmProfile = selectedPipeline === "llm-quality" ? "quality" : "fast";
  const llmProvider = selectedPipeline === "openrouter" ? "openrouter" : "ollama";

  try {
    const llmQuestions = await fetchLlmQuestions({
      topic,
      difficulty,
      targetCount,
      learnerId,
      preferredSkillTags,
      llmProfile,
      llmProvider,
    });
    writeCachedQuestions(topicId, difficulty, llmQuestions, learnerId);

    const merged = prioritizeBySkills(
      dedupeQuestions([...llmQuestions, ...localFallback]),
      preferredSkillTags,
      makeSeed(topicId, difficulty, learnerId),
    ).slice(0, targetCount);

    return {
      topic,
      questions: merged,
      source: localFallback.length > 0 ? "local+llm" : "llm-only",
      servedBy: llmProvider,
      fetchedAt: new Date().toISOString(),
      latencyMs: Math.max(0, Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - startedPerf)),
    };
  } catch {
    if (localFallback.length > 0) {
      return {
        topic,
        questions: localFallback,
        source: cachedQuestions.length > 0 ? "local+cache" : "local-only",
        servedBy: local.length > 0 ? "local" : "cache",
        fetchedAt: new Date().toISOString(),
        latencyMs: Math.max(0, Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - startedPerf)),
      };
    }

    return {
      topic,
      questions: cachedQuestions.slice(0, targetCount),
      source: "cache-only",
      servedBy: "cache",
      fetchedAt: new Date().toISOString(),
      latencyMs: Math.max(0, Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - startedPerf)),
    };
  }
};

export const clearPracticeCache = (topicId?: string): void => {
  if (!isBrowser()) return;
  const keys = Object.keys(window.localStorage);
  for (const key of keys) {
    if (!key.startsWith(cachePrefix)) continue;
    if (topicId && !key.includes(`.${topicId}.`)) continue;
    window.localStorage.removeItem(key);
  }
};

export const getSubjectPracticeCoverage = (subject: Subject): { topicCount: number; packCount: number } => {
  const topicCount = graphData.topics.filter((topic) => topic.subject === subject).length;
  const packCount = practicePacks.filter((pack) => pack.subject === subject).length;
  return { topicCount, packCount };
};









