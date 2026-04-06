export type PrerequisiteType = "hard" | "soft";
export type Subject = "math" | "physics" | "chemistry";

export type TopicNode = {
  id: string;
  subject: Subject;
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
  subject: Subject;
  topicId: string;
  hook: string;
  learningGoals: string[];
  estimatedMinutes: number;
  steps: ContentStep[];
  masteryCheckpointStepId: string;
  reward: RewardBadge;
  nextUnlockTopicIds: string[];
};

export type SubtopicDifficulty = "easy" | "medium" | "hard";

export type SubtopicCheckpoint = {
  id: string;
  question: string;
  answerType: "single-choice" | "multi-choice" | "short";
  expectedAnswer: string;
};

export type TopicSubtopic = {
  id: string;
  name: string;
  learningGoal: string;
  prerequisiteSubtopicIds: string[];
  difficulty: SubtopicDifficulty;
  estimatedMinutes: number;
  misconceptions: string[];
  examples: string[];
  checkpoints: SubtopicCheckpoint[];
};

export type TopicSubtopicPack = {
  subject: Subject;
  topicId: string;
  version: number;
  generatedAt: string;
  source: "llm-draft" | "manual";
  reviewStatus: "draft" | "approved";
  subtopics: TopicSubtopic[];
  coverageMap: {
    missingCoreConcepts: string[];
    overlapWarnings: string[];
  };
};

export type PracticeDifficulty = "easy" | "medium" | "hard";

export type PracticeQuestionType = "single-choice" | "multi-choice" | "short";

export type PracticeOption = {
  id: string;
  text: string;
};

export type PracticeQuestion = {
  id: string;
  topicId: string;
  difficulty: PracticeDifficulty;
  type: PracticeQuestionType;
  prompt: string;
  options?: PracticeOption[];
  correctOptionIds?: string[];
  correctText?: string;
  explanation: string;
  skillTag: string;
};

export type PracticePack = {
  subject: Subject;
  topicId: string;
  version: number;
  generatedAt: string;
  source: "llm-draft" | "manual";
  questions: PracticeQuestion[];
};

export type TopicSnapshotPack = {
  subject: Subject;
  topicId: string;
  version: number;
  generatedAt: string;
  source: "llm-draft" | "manual";
  quickSummary: string;
  keyFacts: string[];
  revisePrompts: string[];
  commonMistakes: string[];
};
