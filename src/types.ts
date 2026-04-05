export type PrerequisiteType = "hard" | "soft";

export type TopicNode = {
  id: string;
  title: string;
  mathTopic: string;
  gradeBand: string;
  description: string;
  source?: "site-card" | "derived" | "ncert";
};

export type DependencyEdge = {
  from: string;
  to: string;
  type: PrerequisiteType;
  minMastery: number;
};

export type LearningGraph = {
  topics: TopicNode[];
  edges: DependencyEdge[];
};

export type LearnerMastery = Record<string, number>;

export type Roadmap = {
  targetId: string;
  readyNow: boolean;
  unmetHard: string[];
  unmetSoft: string[];
  layers: string[][];
};

export type Suggestion = {
  topicId: string;
  score: number;
  reason: string;
};

export type ContentStepType =
  | "story"
  | "concept"
  | "single-choice"
  | "multi-choice"
  | "match"
  | "reorder"
  | "checkpoint"
  | "reward";

export type StepChoice = {
  id: string;
  label: string;
  correct?: boolean;
  feedback?: string;
};

export type ContentStep = {
  id: string;
  type: ContentStepType;
  title: string;
  prompt: string;
  choices?: StepChoice[];
  expectedOrder?: string[];
  hints?: string[];
  points?: number;
};

export type RewardBadge = {
  id: string;
  label: string;
  description: string;
};

export type LearningQuest = {
  id: string;
  topicId: string;
  hook: string;
  learningGoals: string[];
  estimatedMinutes: number;
  steps: ContentStep[];
  masteryCheckpointStepId: string;
  reward: RewardBadge;
  nextUnlockTopicIds: string[];
};
