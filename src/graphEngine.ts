import type {
  DependencyEdge,
  LearnerMastery,
  LearningGraph,
  Roadmap,
  Suggestion,
  TopicNode,
} from "./types";

type TopicIndex = Map<string, TopicNode>;
type IncomingIndex = Map<string, DependencyEdge[]>;
type OutgoingIndex = Map<string, DependencyEdge[]>;

// Normalized mastery check used across readiness/roadmap logic.
const mastered = (score: number | undefined, minMastery: number): boolean =>
  (score ?? 0) >= minMastery;

// Build fast lookup indexes for topics and prerequisite directions.
const buildIndexes = (
  graph: LearningGraph,
): {
  topicIndex: TopicIndex;
  incomingIndex: IncomingIndex;
  outgoingIndex: OutgoingIndex;
} => {
  const topicIndex: TopicIndex = new Map(graph.topics.map((topic) => [topic.id, topic]));
  const incomingIndex: IncomingIndex = new Map();
  const outgoingIndex: OutgoingIndex = new Map();

  for (const edge of graph.edges) {
    if (!topicIndex.has(edge.from) || !topicIndex.has(edge.to)) {
      throw new Error(`Invalid edge ${edge.from} -> ${edge.to}: unknown topic id`);
    }
    const incoming = incomingIndex.get(edge.to) ?? [];
    incoming.push(edge);
    incomingIndex.set(edge.to, incoming);

    const outgoing = outgoingIndex.get(edge.from) ?? [];
    outgoing.push(edge);
    outgoingIndex.set(edge.from, outgoing);
  }

  return { topicIndex, incomingIndex, outgoingIndex };
};

// Global graph sanity check: verifies references and rejects cycles.
export const validateGraph = (graph: LearningGraph): void => {
  const seenIds = new Set<string>();
  for (const topic of graph.topics) {
    if (!topic.id.trim()) {
      throw new Error("Topic id cannot be empty");
    }
    if (seenIds.has(topic.id)) {
      throw new Error(`Duplicate topic id '${topic.id}'`);
    }
    seenIds.add(topic.id);
    if (!topic.subject.trim()) {
      throw new Error(`Topic '${topic.id}' has empty subject`);
    }
    if (!topic.title.trim()) {
      throw new Error(`Topic '${topic.id}' has empty title`);
    }
    if (!topic.mathTopic.trim()) {
      throw new Error(`Topic '${topic.id}' has empty mathTopic`);
    }
    if (!topic.gradeBand.trim()) {
      throw new Error(`Topic '${topic.id}' has empty gradeBand`);
    }
  }

  const { topicIndex, outgoingIndex } = buildIndexes(graph);
  const seenEdges = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.from === edge.to) {
      throw new Error(`Self-loop detected at '${edge.from}'`);
    }
    if (edge.minMastery < 0 || edge.minMastery > 1) {
      throw new Error(
        `Invalid minMastery for edge '${edge.from}' -> '${edge.to}': ${edge.minMastery}`,
      );
    }
    const edgeKey = `${edge.from}|${edge.to}|${edge.type}`;
    if (seenEdges.has(edgeKey)) {
      throw new Error(`Duplicate edge '${edge.from}' -> '${edge.to}' (${edge.type})`);
    }
    seenEdges.add(edgeKey);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (id: string): void => {
    if (visiting.has(id)) {
      throw new Error(`Cycle detected at '${id}'`);
    }
    if (visited.has(id)) {
      return;
    }
    visiting.add(id);
    for (const edge of outgoingIndex.get(id) ?? []) {
      if (!topicIndex.has(edge.to)) {
        throw new Error(`Unknown topic '${edge.to}'`);
      }
      dfs(edge.to);
    }
    visiting.delete(id);
    visited.add(id);
  };

  for (const topic of graph.topics) {
    dfs(topic.id);
  }
};

// Collect all transitive prerequisite edges upstream of a target topic.
const collectAncestors = (
  targetId: string,
  incomingIndex: IncomingIndex,
): DependencyEdge[] => {
  const result: DependencyEdge[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): void => {
    if (visiting.has(node)) {
      throw new Error(`Cycle detected in graph at topic '${node}'`);
    }
    if (visited.has(node)) {
      return;
    }

    visiting.add(node);
    const incoming = incomingIndex.get(node) ?? [];

    for (const edge of incoming) {
      result.push(edge);
      dfs(edge.from);
    }

    visiting.delete(node);
    visited.add(node);
  };

  dfs(targetId);
  return result;
};

// Readiness for one topic based on unmet hard vs soft direct prerequisites.
export const isReady = (
  graph: LearningGraph,
  learnerMastery: LearnerMastery,
  topicId: string,
): { ready: boolean; unmetHard: string[]; unmetSoft: string[] } => {
  const { topicIndex, incomingIndex } = buildIndexes(graph);

  if (!topicIndex.has(topicId)) {
    throw new Error(`Unknown topic id '${topicId}'`);
  }

  const unmetHard: string[] = [];
  const unmetSoft: string[] = [];

  for (const edge of incomingIndex.get(topicId) ?? []) {
    const ok = mastered(learnerMastery[edge.from], edge.minMastery);
    if (ok) {
      continue;
    }
    if (edge.type === "hard") {
      unmetHard.push(edge.from);
    } else {
      unmetSoft.push(edge.from);
    }
  }

  return { ready: unmetHard.length === 0, unmetHard, unmetSoft };
};

// Topological ordering of a subgraph (throws if a cycle is detected).
const topologicalOrder = (nodes: Set<string>, edges: DependencyEdge[]): string[] => {
  const inDegree = new Map<string, number>([...nodes].map((n) => [n, 0]));
  const children = new Map<string, string[]>();

  for (const edge of edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) {
      continue;
    }
    children.set(edge.from, [...(children.get(edge.from) ?? []), edge.to]);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  const queue = [...nodes].filter((n) => (inDegree.get(n) ?? 0) === 0);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      break;
    }
    ordered.push(node);
    for (const child of children.get(node) ?? []) {
      const nextInDegree = (inDegree.get(child) ?? 0) - 1;
      inDegree.set(child, nextInDegree);
      if (nextInDegree === 0) {
        queue.push(child);
      }
    }
  }

  if (ordered.length !== nodes.size) {
    throw new Error("Cycle detected while building roadmap order");
  }

  return ordered;
};

// Convert topological order into learnable step layers.
const buildLayers = (ordered: string[], edges: DependencyEdge[]): string[][] => {
  const level = new Map<string, number>();
  const parents = new Map<string, string[]>();

  for (const edge of edges) {
    parents.set(edge.to, [...(parents.get(edge.to) ?? []), edge.from]);
  }

  for (const topicId of ordered) {
    const parentLevels = (parents.get(topicId) ?? []).map((p) => level.get(p) ?? 0);
    const topicLevel = parentLevels.length > 0 ? Math.max(...parentLevels) + 1 : 0;
    level.set(topicId, topicLevel);
  }

  const layers: string[][] = [];
  for (const topicId of ordered) {
    const l = level.get(topicId) ?? 0;
    if (!layers[l]) {
      layers[l] = [];
    }
    layers[l].push(topicId);
  }

  return layers.filter(Boolean);
};

// Build a target roadmap: unmet prerequisites grouped into ordered layers.
export const getRoadmap = (
  graph: LearningGraph,
  learnerMastery: LearnerMastery,
  targetId: string,
): Roadmap => {
  const { topicIndex, incomingIndex } = buildIndexes(graph);
  if (!topicIndex.has(targetId)) {
    throw new Error(`Unknown target topic '${targetId}'`);
  }

  const ancestorEdges = collectAncestors(targetId, incomingIndex);
  const ancestorNodeIds = new Set<string>(ancestorEdges.map((edge) => edge.from));

  const unmetHard = new Set<string>();
  const unmetSoft = new Set<string>();

  for (const edge of ancestorEdges) {
    if (mastered(learnerMastery[edge.from], edge.minMastery)) {
      continue;
    }
    if (edge.type === "hard") {
      unmetHard.add(edge.from);
    } else {
      unmetSoft.add(edge.from);
    }
  }

  const toLearn = new Set<string>();
  for (const id of ancestorNodeIds) {
    const score = learnerMastery[id] ?? 0;
    const minThreshold = Math.max(
      ...ancestorEdges.filter((edge) => edge.from === id).map((edge) => edge.minMastery),
    );
    if (score < minThreshold) {
      toLearn.add(id);
    }
  }

  const relevantEdges = graph.edges.filter(
    (edge) => toLearn.has(edge.from) && toLearn.has(edge.to),
  );
  const ordered = topologicalOrder(toLearn, relevantEdges);
  const layers = buildLayers(ordered, relevantEdges);
  const readiness = isReady(graph, learnerMastery, targetId);

  return {
    targetId,
    readyNow: readiness.ready,
    unmetHard: [...unmetHard],
    unmetSoft: [...unmetSoft],
    layers,
  };
};

// Rank next-best topics to study for a target based on unlock impact and mastery gap.
export const getNextSuggestions = (
  graph: LearningGraph,
  learnerMastery: LearnerMastery,
  targetId: string,
  limit = 3,
): Suggestion[] => {
  const { incomingIndex, outgoingIndex } = buildIndexes(graph);
  const roadmap = getRoadmap(graph, learnerMastery, targetId);
  const needed = new Set<string>([...roadmap.unmetHard, ...roadmap.unmetSoft]);
  const targetLayers = new Map<string, number>();
  roadmap.layers.forEach((layer, idx) => {
    layer.forEach((topicId) => targetLayers.set(topicId, idx));
  });

  const readyCandidates = [...needed].filter((topicId) => {
    for (const edge of incomingIndex.get(topicId) ?? []) {
      const prereqNeeded = needed.has(edge.from);
      if (!prereqNeeded) {
        continue;
      }
      const ok = mastered(learnerMastery[edge.from], edge.minMastery);
      if (!ok && edge.type === "hard") {
        return false;
      }
    }
    return true;
  });

  const scored = readyCandidates.map((topicId) => {
    const unlockedChildren = (outgoingIndex.get(topicId) ?? []).filter((edge) =>
      needed.has(edge.to),
    ).length;
    const lowMasteryGap = 1 - (learnerMastery[topicId] ?? 0);
    const layerDistance = targetLayers.get(topicId) ?? 0;
    const urgencyBoost = 1 / (layerDistance + 1);
    const score = unlockedChildren * 2.5 + lowMasteryGap + urgencyBoost;
    const reason = `unlocks ${unlockedChildren} next topic(s), mastery gap ${Math.round(
      lowMasteryGap * 100,
    )}%`;
    return { topicId, score, reason };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
};


