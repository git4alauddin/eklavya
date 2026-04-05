import { describe, expect, it } from "vitest";
import {
  getNextSuggestions,
  getRoadmap,
  isReady,
  validateGraph,
} from "./graphEngine";
import type { LearningGraph, LearnerMastery } from "./types";

const baseGraph: LearningGraph = {
  topics: [
    { id: "a", subject: "math", title: "A", mathTopic: "A Topic", gradeBand: "G4", description: "A" },
    { id: "b", subject: "math", title: "B", mathTopic: "B Topic", gradeBand: "G4", description: "B" },
    { id: "c", subject: "math", title: "C", mathTopic: "C Topic", gradeBand: "G4", description: "C" },
    { id: "d", subject: "math", title: "D", mathTopic: "D Topic", gradeBand: "G4", description: "D" },
  ],
  edges: [
    { from: "a", to: "c", type: "hard", minMastery: 0.7 },
    { from: "b", to: "c", type: "soft", minMastery: 0.6 },
    { from: "c", to: "d", type: "hard", minMastery: 0.75 },
  ],
};

describe("validateGraph", () => {
  it("accepts valid acyclic graphs", () => {
    expect(() => validateGraph(baseGraph)).not.toThrow();
  });

  it("rejects cyclic graphs", () => {
    const cyclic: LearningGraph = {
      ...baseGraph,
      edges: [...baseGraph.edges, { from: "d", to: "a", type: "hard", minMastery: 0.5 }],
    };
    expect(() => validateGraph(cyclic)).toThrow(/Cycle detected/);
  });
});

describe("isReady", () => {
  it("marks unmet hard and soft prerequisites separately", () => {
    const mastery: LearnerMastery = { a: 0.65, b: 0.5, c: 0, d: 0 };
    const readiness = isReady(baseGraph, mastery, "c");
    expect(readiness.ready).toBe(false);
    expect(readiness.unmetHard).toEqual(["a"]);
    expect(readiness.unmetSoft).toEqual(["b"]);
  });
});

describe("roadmap and suggestions", () => {
  it("builds roadmap and ranks next suggestions", () => {
    const mastery: LearnerMastery = { a: 0.4, b: 0.85, c: 0.2, d: 0 };
    const roadmap = getRoadmap(baseGraph, mastery, "d");
    expect(roadmap.targetId).toBe("d");
    expect(roadmap.readyNow).toBe(false);
    expect(roadmap.unmetHard).toContain("a");
    expect(roadmap.unmetHard).toContain("c");

    const suggestions = getNextSuggestions(baseGraph, mastery, "d", 2);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].topicId).toBe("a");
  });
});

