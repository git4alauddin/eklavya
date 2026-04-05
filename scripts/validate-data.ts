import { graphData } from "../src/graphData";
import { validateGraph } from "../src/graphEngine";

try {
  validateGraph(graphData);
  console.log(
    `Graph validation passed: ${graphData.topics.length} topics, ${graphData.edges.length} edges.`,
  );
} catch (error) {
  console.error("Graph validation failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}
