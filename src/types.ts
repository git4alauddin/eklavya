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
