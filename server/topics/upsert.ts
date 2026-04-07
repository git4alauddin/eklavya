import { promises as fs } from "node:fs";
import path from "node:path";
import type { TopicNode } from "../../src/types";
import { toSafeBaseName, toSafeExportName } from "../content/upsert";

type Subject = "math" | "physics" | "chemistry";

const topicsArrayName = (subject: Subject): string => `${subject}Topics`;

export const writeTopicsFile = async (
  repoRoot: string,
  subject: Subject,
  fileBaseName: string,
  exportName: string,
  topics: TopicNode[],
): Promise<string> => {
  const filePath = path.join(repoRoot, "src", "data", subject, "topics", `${fileBaseName}.ts`);
  const fileSource = [
    'import type { TopicNode } from "../../../types";',
    "",
    `export const ${exportName}: TopicNode[] = ${JSON.stringify(topics, null, 2)};`,
    "",
  ].join("\n");

  await fs.writeFile(filePath, fileSource, "utf8");
  return filePath;
};

export const upsertTopicsIndex = async (
  repoRoot: string,
  subject: Subject,
  fileBaseName: string,
  exportName: string,
): Promise<string> => {
  const indexPath = path.join(repoRoot, "src", "data", subject, "topics", "index.ts");
  const arrayName = topicsArrayName(subject);

  let current = "";
  try {
    current = await fs.readFile(indexPath, "utf8");
  } catch {
    current = `export const ${arrayName} = [];\n`;
  }

  const importLine = `import { ${exportName} } from "./${fileBaseName}";`;
  if (!current.includes(importLine)) {
    current = `${importLine}\n${current}`;
  }

  const arrayRegex = new RegExp(`export const ${arrayName} = \\[([\\s\\S]*?)\\];`);
  const match = current.match(arrayRegex);

  if (!match) {
    current = `${current.trimEnd()}\n\nexport const ${arrayName} = [${exportName}];\n`;
  } else {
    const existing = match[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!existing.includes(exportName)) existing.push(exportName);
    current = current.replace(arrayRegex, `export const ${arrayName} = [${existing.join(", ")}];`);
  }

  await fs.writeFile(indexPath, current, "utf8");
  return indexPath;
};

export const prepareTopicFileNames = (topicFileHint: { fileName?: string; exportName?: string }) => {
  const fileBaseName = toSafeBaseName(topicFileHint.fileName ?? "generatedTopics");
  const exportName = toSafeExportName(topicFileHint.exportName ?? `${fileBaseName}Topics`);
  return { fileBaseName, exportName };
};
