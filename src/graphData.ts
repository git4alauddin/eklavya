import { chemistryGraph } from "./data/chemistry/graph";
import { mathGraph } from "./data/math/graph";
import { physicsGraph } from "./data/physics/graph";
import { validateGraph } from "./graphEngine";
import type { LearnerMastery, LearningGraph, Subject } from "./types";

export const graphDataBySubject: Record<Subject, LearningGraph> = {
  math: mathGraph,
  physics: physicsGraph,
  chemistry: chemistryGraph,
};

const subjectGraphs = Object.values(graphDataBySubject);
const topics = subjectGraphs.flatMap((graph) => graph.topics);
const edges = subjectGraphs.flatMap((graph) => graph.edges);

export const graphData: LearningGraph = {
  topics,
  edges,
};

// Fail fast during development if dataset shape or dependencies are invalid.
validateGraph(graphData);

const defaultMasteryByGrade = (gradeBand: string): number => {
  if (gradeBand === "G4") return 0.8;
  if (gradeBand === "G5") return 0.62;
  if (gradeBand === "G6") return 0.34;
  if (gradeBand === "G7") return 0.14;
  if (gradeBand === "G8") return 0.08;
  return 0.3;
};

export const starterMastery: LearnerMastery = Object.fromEntries(
  topics.map((topic) => [topic.id, defaultMasteryByGrade(topic.gradeBand)]),
);
