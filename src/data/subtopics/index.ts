import { graphData } from "../../graphData";
import type { TopicSubtopicPack } from "../../types";
import { c4HalvesSubtopicPack } from "./c4HalvesSubtopics";

export const subtopicPacks: TopicSubtopicPack[] = [c4HalvesSubtopicPack];

export const validateSubtopicPacks = (
  packs: TopicSubtopicPack[],
  topicIdSet = new Set(graphData.topics.map((topic) => topic.id)),
): void => {
  const seenPackTopics = new Set<string>();

  for (const pack of packs) {
    if (!topicIdSet.has(pack.topicId)) {
      throw new Error(`Subtopic pack references unknown topic '${pack.topicId}'`);
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
