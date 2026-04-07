import { z } from "zod";
import { graphData } from "../../src/graphData";

export const topicsSourceScopeSchema = z.object({
  subject: z.enum(["math", "physics", "chemistry"]),
  grades: z.string().min(1),
  board: z.string().min(1),
  source: z.string().url(),
  includeChapterContext: z.boolean(),
});

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

export const buildTopicsSourceScope = (payload: z.infer<typeof topicsSourceScopeSchema>) => {
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

  return {
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
  };
};
