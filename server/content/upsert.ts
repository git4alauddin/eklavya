import { promises as fs } from "node:fs";
import path from "node:path";

type Subject = "math" | "physics" | "chemistry";

export const toSafeBaseName = (name: string): string =>
  name
    .trim()
    .replace(/\.ts$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "generatedQuest";

export const toSafeExportName = (name: string): string => {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const prefixed = /^[a-zA-Z_]/.test(cleaned) ? cleaned : `quest_${cleaned}`;
  return prefixed || "generatedQuest";
};

export const upsertContentsIndex = async (
  repoRoot: string,
  subject: Subject,
  fileBaseName: string,
  exportName: string,
): Promise<string> => {
  const indexPath = path.join(repoRoot, "src", "data", subject, "contents", "index.ts");
  const arrayName = `${subject}LearningQuests`;

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
  const arrayMatch = current.match(arrayRegex);
  if (!arrayMatch) {
    current = `${current.trimEnd()}\n\nexport const ${arrayName} = [${exportName}];\n`;
  } else {
    const existing = arrayMatch[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!existing.includes(exportName)) existing.push(exportName);
    current = current.replace(arrayRegex, `export const ${arrayName} = [${existing.join(", ")}];`);
  }

  await fs.writeFile(indexPath, current, "utf8");
  return indexPath;
};

export const writeLearningQuestFile = async (
  repoRoot: string,
  subject: Subject,
  fileBaseName: string,
  exportName: string,
  quest: unknown,
): Promise<string> => {
  const questFilePath = path.join(repoRoot, "src", "data", subject, "contents", `${fileBaseName}.ts`);
  const questFileSource = [
    'import type { LearningQuest } from "../../../types";',
    "",
    `export const ${exportName}: LearningQuest = ${JSON.stringify(quest, null, 2)};`,
    "",
  ].join("\n");

  await fs.writeFile(questFilePath, questFileSource, "utf8");
  return questFilePath;
};
