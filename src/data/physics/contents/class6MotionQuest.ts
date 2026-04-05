import type { LearningQuest } from "../../../types";

export const class6MotionQuest: LearningQuest = {
  id: "quest_phy_c6_motion_intro",
  subject: "physics",
  topicId: "phy_c6_01_motion_and_measurement_of_distances",
  hook: "A sports teacher marks a 100 m track. How do we measure and compare movement fairly?",
  learningGoals: [
    "Understand motion as change in position",
    "Measure distance using common units",
    "Differentiate straight, circular, and periodic motion",
  ],
  estimatedMinutes: 10,
  steps: [
    {
      id: "phy_s1_story",
      type: "story",
      title: "Race Day Setup",
      prompt: "Two runners take different paths. Which path helps compare their movement better?",
      hints: ["Measurement needs a clear path and common unit."],
    },
    {
      id: "phy_s2_concept",
      type: "concept",
      title: "Distance and Motion",
      prompt: "Distance tells how much ground is covered. Motion describes movement over time.",
    },
    {
      id: "phy_s3_single_choice",
      type: "single-choice",
      title: "Choose Motion Type",
      prompt: "A child on a merry-go-round shows which motion?",
      choices: [
        { id: "c1", label: "Rectilinear motion", feedback: "This is straight-line motion." },
        { id: "c2", label: "Circular motion", correct: true, feedback: "Correct. The path is circular." },
        { id: "c3", label: "Random motion", feedback: "Not random; it repeats on a circle." },
      ],
      points: 20,
    },
    {
      id: "phy_s4_checkpoint",
      type: "checkpoint",
      title: "Quick Mastery Check",
      prompt: "Which unit is most suitable to measure classroom length?",
      choices: [
        { id: "c1", label: "kilometre", feedback: "Too large for classroom scale." },
        { id: "c2", label: "metre", correct: true, feedback: "Correct unit for room length." },
        { id: "c3", label: "milligram", feedback: "That measures mass, not length." },
      ],
      points: 30,
    },
    {
      id: "phy_s5_reward",
      type: "reward",
      title: "Quest Complete",
      prompt: "You can now classify motion and choose suitable distance units.",
    },
  ],
  masteryCheckpointStepId: "phy_s4_checkpoint",
  reward: {
    id: "badge_motion_starter",
    label: "Motion Starter",
    description: "Completed your first physics motion quest.",
  },
  nextUnlockTopicIds: ["phy_c7_04_motion_and_time"],
};
