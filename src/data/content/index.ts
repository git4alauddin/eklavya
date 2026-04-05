import { graphData } from "../../graphData";
import type { LearningQuest } from "../../types";
import { class4HalvesQuest } from "./class4HalvesQuest";

export const learningQuests: LearningQuest[] = [class4HalvesQuest];

export const validateLearningQuests = (
  quests: LearningQuest[],
  allowedTopicIds = new Set(graphData.topics.map((topic) => topic.id)),
): void => {
  const seenQuestIds = new Set<string>();

  for (const quest of quests) {
    if (!quest.id.trim()) {
      throw new Error("Quest id cannot be empty");
    }
    if (seenQuestIds.has(quest.id)) {
      throw new Error(`Duplicate quest id '${quest.id}'`);
    }
    seenQuestIds.add(quest.id);

    if (!allowedTopicIds.has(quest.topicId)) {
      throw new Error(`Quest '${quest.id}' references unknown topic '${quest.topicId}'`);
    }
    if (quest.steps.length === 0) {
      throw new Error(`Quest '${quest.id}' must contain at least one step`);
    }

    const stepIds = new Set<string>();
    for (const step of quest.steps) {
      if (!step.id.trim()) {
        throw new Error(`Quest '${quest.id}' has step with empty id`);
      }
      if (stepIds.has(step.id)) {
        throw new Error(`Quest '${quest.id}' has duplicate step id '${step.id}'`);
      }
      stepIds.add(step.id);
    }

    if (!stepIds.has(quest.masteryCheckpointStepId)) {
      throw new Error(
        `Quest '${quest.id}' mastery checkpoint step '${quest.masteryCheckpointStepId}' not found`,
      );
    }
  }
};

validateLearningQuests(learningQuests);
