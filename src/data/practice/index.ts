import { graphData } from "../../graphData";
import { chemistryPracticePacks } from "../chemistry/practice";
import { mathPracticePacks } from "../math/practice";
import { physicsPracticePacks } from "../physics/practice";
import type { PracticePack, PracticeQuestion, TopicNode } from "../../types";

export const practicePacks: PracticePack[] = [
  ...mathPracticePacks,
  ...physicsPracticePacks,
  ...chemistryPracticePacks,
];

const validateQuestionByType = (pack: PracticePack, question: PracticeQuestion): void => {
  const usesChoiceOptions =
    question.type === "single-choice" || question.type === "multi-choice";

  if (usesChoiceOptions) {
    if (!question.options || question.options.length < 2) {
      throw new Error(
        `Practice question '${question.id}' in '${pack.topicId}' must provide at least 2 options`,
      );
    }
    if (!question.correctOptionIds || question.correctOptionIds.length === 0) {
      throw new Error(
        `Practice question '${question.id}' in '${pack.topicId}' must provide correctOptionIds`,
      );
    }

    const optionIds = new Set(question.options.map((option) => option.id));
    for (const correctId of question.correctOptionIds) {
      if (!optionIds.has(correctId)) {
        throw new Error(
          `Practice question '${question.id}' in '${pack.topicId}' has unknown correct option '${correctId}'`,
        );
      }
    }

    if (question.type === "single-choice" && question.correctOptionIds.length !== 1) {
      throw new Error(
        `Practice question '${question.id}' in '${pack.topicId}' must have exactly one correct option for single-choice`,
      );
    }
  }

  if (question.type === "short" && !question.correctText?.trim()) {
    throw new Error(
      `Practice question '${question.id}' in '${pack.topicId}' must provide correctText for short answers`,
    );
  }
};

export const validatePracticePacks = (
  packs: PracticePack[],
  topicIndex = new Map<string, TopicNode>(graphData.topics.map((topic) => [topic.id, topic])),
): void => {
  const seenPackTopics = new Set<string>();

  for (const pack of packs) {
    const topic = topicIndex.get(pack.topicId);
    if (!topic) {
      throw new Error(`Practice pack references unknown topic '${pack.topicId}'`);
    }
    if (pack.subject !== topic.subject) {
      throw new Error(
        `Practice pack '${pack.topicId}' subject '${pack.subject}' does not match topic subject '${topic.subject}'`,
      );
    }
    if (seenPackTopics.has(pack.topicId)) {
      throw new Error(`Duplicate practice pack for topic '${pack.topicId}'`);
    }
    seenPackTopics.add(pack.topicId);

    if (pack.questions.length === 0) {
      throw new Error(`Practice pack '${pack.topicId}' must contain at least one question`);
    }

    const seenQuestionIds = new Set<string>();
    for (const question of pack.questions) {
      if (!question.id.trim()) {
        throw new Error(`Practice question in '${pack.topicId}' has empty id`);
      }
      if (seenQuestionIds.has(question.id)) {
        throw new Error(`Duplicate practice question id '${question.id}' in '${pack.topicId}'`);
      }
      seenQuestionIds.add(question.id);

      if (question.topicId !== pack.topicId) {
        throw new Error(
          `Practice question '${question.id}' topicId '${question.topicId}' does not match pack topic '${pack.topicId}'`,
        );
      }
      if (!question.prompt.trim()) {
        throw new Error(`Practice question '${question.id}' in '${pack.topicId}' has empty prompt`);
      }
      if (!question.explanation.trim()) {
        throw new Error(
          `Practice question '${question.id}' in '${pack.topicId}' has empty explanation`,
        );
      }
      if (!question.skillTag.trim()) {
        throw new Error(`Practice question '${question.id}' in '${pack.topicId}' has empty skillTag`);
      }

      validateQuestionByType(pack, question);
    }
  }
};

validatePracticePacks(practicePacks);
