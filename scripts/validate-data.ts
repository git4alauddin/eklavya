import { graphData } from "../src/graphData";
import { validateGraph } from "../src/graphEngine";
import { learningQuests, validateLearningQuests } from "../src/data/contents";
import { subtopicPacks, validateSubtopicPacks } from "../src/data/sub-topics";

try {
  validateGraph(graphData);
  validateLearningQuests(learningQuests);
  validateSubtopicPacks(subtopicPacks);
  console.log(
    `Graph validation passed: ${graphData.topics.length} topics, ${graphData.edges.length} edges.`,
  );
  console.log(`Content validation passed: ${learningQuests.length} learning quest(s).`);
  console.log(`Subtopic validation passed: ${subtopicPacks.length} subtopic pack(s).`);
} catch (error) {
  console.error("Validation failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}

