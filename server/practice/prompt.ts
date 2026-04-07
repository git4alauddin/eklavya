import type { PracticeRequestPayload } from "./schemas";

export const buildPracticePrompt = (payload: PracticeRequestPayload): string =>
  [
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
