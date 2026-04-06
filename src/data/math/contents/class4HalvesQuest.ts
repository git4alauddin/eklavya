import type { LearningQuest } from "../../../types";

export const class4HalvesQuest: LearningQuest = {
  id: "quest_c4_halves_intro",
  subject: "math",
  topicId: "c4_09_halves_and_quarters",
  hook: "A picnic group has 4 rotis and 8 kids. Can everyone get a fair share?",
  learningGoals: [
    "Understand half and quarter as equal parts",
    "Connect sharing stories to fraction symbols",
    "Identify correct fraction from a visual split",
  ],
  estimatedMinutes: 8,
  steps: [
    {
      id: "s1_story",
      type: "story",
      title: "Picnic Sharing",
      prompt: "Two friends split one roti equally. What part does each get?",
      hints: ["Equal share means same size pieces."],
      adaptiveHints: {
        firstTry: "Equal share means same size pieces.",
        secondTry: "Check that both pieces are exactly equal before naming the fraction.",
        recap: "When 1 whole is split into 2 equal pieces, each piece is one-half (1/2).",
      },
    },
    {
      id: "s2_concept",
      type: "concept",
      title: "Half Means 1 out of 2",
      prompt: "When one whole is split into 2 equal parts, one part is called one-half (1/2).",
    },
    {
      id: "s3_single_choice",
      type: "single-choice",
      title: "Choose The Correct Fraction",
      prompt:
        "A circle is split into 4 equal parts and one part is shaded. Which fraction is shaded?",
      choices: [
        { id: "c1", label: "1/2", feedback: "Check total equal parts." },
        { id: "c2", label: "1/4", correct: true, feedback: "Correct. 1 out of 4." },
        { id: "c3", label: "2/4", feedback: "That would mean two parts shaded." },
      ],
      adaptiveHints: {
        firstTry: "Count total equal parts first, then count shaded parts.",
        secondTry: "Total parts = denominator, shaded parts = numerator.",
        recap: "For 1 shaded out of 4 equal parts, the fraction is 1/4.",
      },
      points: 20,
    },
    {
      id: "s4_checkpoint",
      type: "checkpoint",
      title: "Quick Mastery Check",
      prompt: "If 1 chocolate is shared equally among 4 children, each gets what fraction?",
      choices: [
        { id: "c1", label: "1/2", feedback: "Too large for 4 children." },
        { id: "c2", label: "1/3", feedback: "That is for 3 equal shares." },
        { id: "c3", label: "1/4", correct: true, feedback: "Exactly." },
      ],
      adaptiveHints: {
        firstTry: "Think: 1 whole shared equally among 4 children means 4 equal parts.",
        secondTry: "Denominator is total children sharing equally: 4.",
        recap: "Equal sharing among 4 gives each child 1/4.",
      },
      points: 30,
    },
    {
      id: "s5_reward",
      type: "reward",
      title: "Quest Complete",
      prompt: "You can now recognize half and quarter in sharing stories.",
    },
  ],
  masteryCheckpointStepId: "s4_checkpoint",
  reward: {
    id: "badge_fraction_starter",
    label: "Fraction Starter",
    description: "Completed your first fair-sharing fraction quest.",
  },
  nextUnlockTopicIds: ["c5_04_parts_and_wholes"],
};



