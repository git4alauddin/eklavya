import type { TopicSubtopicPack } from "../../../types";

export const class6MotionSubtopicPack: TopicSubtopicPack = {
  subject: "physics",
  topicId: "phy_c6_01_motion_and_measurement_of_distances",
  version: 1,
  generatedAt: "2026-04-06",
  source: "manual",
  reviewStatus: "approved",
  subtopics: [
    {
      id: "motion_position_change",
      name: "Motion as Change in Position",
      learningGoal: "Recognize motion by observing change in position.",
      prerequisiteSubtopicIds: [],
      difficulty: "easy",
      estimatedMinutes: 8,
      misconceptions: ["If something is moving slowly, it is not in motion."],
      examples: [
        "A bus moving from school gate to market.",
        "A ball rolling from one side of room to another.",
      ],
      checkpoints: [
        {
          id: "mot_1",
          question: "When do we say an object is in motion?",
          answerType: "short",
          expectedAnswer: "when its position changes",
        },
      ],
    },
    {
      id: "distance_units",
      name: "Standard Units of Distance",
      learningGoal: "Choose suitable units like metre and kilometre for measurement.",
      prerequisiteSubtopicIds: ["motion_position_change"],
      difficulty: "easy",
      estimatedMinutes: 10,
      misconceptions: ["Any unit can be used for any distance without context."],
      examples: [
        "Classroom length in metres.",
        "City distance in kilometres.",
      ],
      checkpoints: [
        {
          id: "mot_2",
          question: "Which unit is suitable for city-to-city distance?",
          answerType: "short",
          expectedAnswer: "kilometre",
        },
      ],
    },
    {
      id: "types_of_motion",
      name: "Types of Motion",
      learningGoal: "Differentiate rectilinear, circular, and periodic motion.",
      prerequisiteSubtopicIds: ["motion_position_change", "distance_units"],
      difficulty: "medium",
      estimatedMinutes: 12,
      misconceptions: ["All repeated motion is circular motion."],
      examples: [
        "Hands of a clock show periodic motion.",
        "Stone tied to a string moving in circle shows circular motion.",
      ],
      checkpoints: [
        {
          id: "mot_3",
          question: "Clock pendulum is an example of which motion type?",
          answerType: "short",
          expectedAnswer: "periodic motion",
        },
      ],
    },
  ],
  coverageMap: {
    missingCoreConcepts: [],
    overlapWarnings: [],
  },
};
