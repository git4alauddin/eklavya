import { graphData } from "../src/graphData";
import { validateGraph } from "../src/graphEngine";
import { learningQuests, validateLearningQuests } from "../src/data/contents";
import { practicePacks, validatePracticePacks } from "../src/data/practice";
import { subtopicPacks, validateSubtopicPacks } from "../src/data/sub-topics";
import { topicSnapshots, validateTopicSnapshots } from "../src/data/snapshots";

try {
  validateGraph(graphData);
  validateLearningQuests(learningQuests);
  validatePracticePacks(practicePacks);
  validateSubtopicPacks(subtopicPacks);
  validateTopicSnapshots(topicSnapshots);
  console.log(
    `Graph validation passed: ${graphData.topics.length} topics, ${graphData.edges.length} edges.`,
  );
  console.log(`Content validation passed: ${learningQuests.length} learning quest(s).`);
  console.log(`Practice validation passed: ${practicePacks.length} practice pack(s).`);
  console.log(`Subtopic validation passed: ${subtopicPacks.length} subtopic pack(s).`);
  console.log(`Snapshot validation passed: ${topicSnapshots.length} snapshot pack(s).`);
} catch (error) {
  console.error("Validation failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}
