import { graphData } from "../../graphData";
import { chemistryTopicSnapshots } from "../chemistry/snapshots";
import { mathTopicSnapshots } from "../math/snapshots";
import { physicsTopicSnapshots } from "../physics/snapshots";
import type { TopicNode, TopicSnapshotPack } from "../../types";

export const topicSnapshots: TopicSnapshotPack[] = [
  ...mathTopicSnapshots,
  ...physicsTopicSnapshots,
  ...chemistryTopicSnapshots,
];

export const validateTopicSnapshots = (
  snapshots: TopicSnapshotPack[],
  topicIndex = new Map<string, TopicNode>(graphData.topics.map((topic) => [topic.id, topic])),
): void => {
  const seen = new Set<string>();

  for (const snapshot of snapshots) {
    const topic = topicIndex.get(snapshot.topicId);
    if (!topic) {
      throw new Error(`Snapshot references unknown topic '${snapshot.topicId}'`);
    }

    if (snapshot.subject !== topic.subject) {
      throw new Error(
        `Snapshot '${snapshot.topicId}' subject '${snapshot.subject}' does not match topic subject '${topic.subject}'`,
      );
    }

    if (seen.has(snapshot.topicId)) {
      throw new Error(`Duplicate snapshot for topic '${snapshot.topicId}'`);
    }
    seen.add(snapshot.topicId);

    if (!snapshot.quickSummary.trim()) {
      throw new Error(`Snapshot '${snapshot.topicId}' must provide quickSummary`);
    }
    if (snapshot.keyFacts.length === 0) {
      throw new Error(`Snapshot '${snapshot.topicId}' must provide at least one key fact`);
    }

    for (const fact of snapshot.keyFacts) {
      if (!fact.trim()) {
        throw new Error(`Snapshot '${snapshot.topicId}' has an empty key fact`);
      }
    }
  }
};

validateTopicSnapshots(topicSnapshots);
