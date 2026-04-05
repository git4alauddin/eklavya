import { graphData } from "../../graphData";
import { mathSubtopicPacks } from "../math/sub-topics";
import { physicsSubtopicPacks } from "../physics/sub-topics";
import type { TopicNode, TopicSubtopicPack } from "../../types";

export const subtopicPacks: TopicSubtopicPack[] = [
  ...mathSubtopicPacks,
  ...physicsSubtopicPacks,
];

export const validateSubtopicPacks = (
  packs: TopicSubtopicPack[],
  topicIndex = new Map<string, TopicNode>(graphData.topics.map((topic) => [topic.id, topic])),
): void => {
  const seenPackTopics = new Set<string>();

  for (const pack of packs) {
    const topic = topicIndex.get(pack.topicId);
    if (!topic) {
      throw new Error(`Subtopic pack references unknown topic '${pack.topicId}'`);
    }
    if (pack.subject !== topic.subject) {
      throw new Error(
        `Subtopic pack '${pack.topicId}' subject '${pack.subject}' does not match topic subject '${topic.subject}'`,
      );
    }
    if (seenPackTopics.has(pack.topicId)) {
      throw new Error(`Duplicate subtopic pack for topic '${pack.topicId}'`);
    }
    seenPackTopics.add(pack.topicId);

    if (pack.subtopics.length === 0) {
      throw new Error(`Subtopic pack '${pack.topicId}' must contain at least one subtopic`);
    }

    const subtopicIds = new Set<string>();
    for (const subtopic of pack.subtopics) {
      if (!subtopic.id.trim()) {
        throw new Error(`Subtopic in '${pack.topicId}' has empty id`);
      }
      if (subtopicIds.has(subtopic.id)) {
        throw new Error(`Duplicate subtopic id '${subtopic.id}' in '${pack.topicId}'`);
      }
      subtopicIds.add(subtopic.id);

      for (const prereqId of subtopic.prerequisiteSubtopicIds) {
        if (!prereqId.trim()) {
          throw new Error(`Subtopic '${subtopic.id}' has empty prerequisite id`);
        }
      }

      if (subtopic.estimatedMinutes <= 0) {
        throw new Error(`Subtopic '${subtopic.id}' has invalid estimatedMinutes`);
      }
    }

    for (const subtopic of pack.subtopics) {
      for (const prereqId of subtopic.prerequisiteSubtopicIds) {
        if (!subtopicIds.has(prereqId)) {
          throw new Error(
            `Subtopic '${subtopic.id}' references unknown prerequisite '${prereqId}' in '${pack.topicId}'`,
          );
        }
      }
    }
  }
};

validateSubtopicPacks(subtopicPacks);
