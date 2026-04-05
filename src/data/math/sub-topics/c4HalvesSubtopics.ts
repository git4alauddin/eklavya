import type { TopicSubtopicPack } from "../../../types";

export const c4HalvesSubtopicPack: TopicSubtopicPack = {
  subject: "math",
  topicId: "c4_09_halves_and_quarters",
  version: 1,
  generatedAt: "2026-04-06",
  source: "manual",
  reviewStatus: "approved",
  subtopics: [
    {
      id: "equal_sharing_basics",
      name: "Equal Sharing Basics",
      learningGoal: "Identify fair equal sharing in everyday objects.",
      prerequisiteSubtopicIds: [],
      difficulty: "easy",
      estimatedMinutes: 8,
      misconceptions: ["Any split is fair even if pieces are not equal."],
      examples: [
        "Split one roti into 2 equal pieces.",
        "Share one apple equally between two friends.",
      ],
      checkpoints: [
        {
          id: "eq_1",
          question: "Two equal pieces from one whole each represent what idea?",
          answerType: "short",
          expectedAnswer: "equal parts",
        },
      ],
    },
    {
      id: "half_as_fraction",
      name: "Half as 1/2",
      learningGoal: "Understand half as one of two equal parts.",
      prerequisiteSubtopicIds: ["equal_sharing_basics"],
      difficulty: "easy",
      estimatedMinutes: 10,
      misconceptions: ["1/2 means one piece out of any two pieces, even if unequal."],
      examples: [
        "One chocolate broken into 2 equal bars, take one bar.",
        "A circle cut into two equal semicircles.",
      ],
      checkpoints: [
        {
          id: "half_1",
          question: "One of two equal parts is represented by?",
          answerType: "short",
          expectedAnswer: "1/2",
        },
      ],
    },
    {
      id: "quarter_as_fraction",
      name: "Quarter as 1/4",
      learningGoal: "Understand quarter as one of four equal parts.",
      prerequisiteSubtopicIds: ["equal_sharing_basics"],
      difficulty: "medium",
      estimatedMinutes: 10,
      misconceptions: ["Quarter means one of any four pieces, equal or unequal."],
      examples: [
        "One pizza sliced into 4 equal slices, take one.",
        "A square folded into 4 equal small squares.",
      ],
      checkpoints: [
        {
          id: "quarter_1",
          question: "One out of four equal parts is written as?",
          answerType: "short",
          expectedAnswer: "1/4",
        },
      ],
    },
    {
      id: "visual_fraction_identification",
      name: "Visual Fraction Identification",
      learningGoal: "Identify 1/2 and 1/4 from shaded diagrams.",
      prerequisiteSubtopicIds: ["half_as_fraction", "quarter_as_fraction"],
      difficulty: "medium",
      estimatedMinutes: 12,
      misconceptions: [
        "Shaded area count alone is enough without checking equal partitions.",
      ],
      examples: [
        "Circle split into 4 equal sectors with one shaded.",
        "Rectangle split into 2 equal parts with one shaded.",
      ],
      checkpoints: [
        {
          id: "visual_1",
          question: "A figure with 4 equal sections and 1 shaded represents?",
          answerType: "short",
          expectedAnswer: "1/4",
        },
      ],
    },
  ],
  coverageMap: {
    missingCoreConcepts: [],
    overlapWarnings: [],
  },
};

