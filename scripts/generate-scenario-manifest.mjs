import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const scenariosRoot = path.join(repoRoot, "react-frontend", "src", "tests", "e2e", "scenarios");
const outputPath = path.join(
  repoRoot,
  "nextemr-admin",
  "src",
  "app",
  "(dashboard)",
  "test",
  "qa",
  "_lib",
  "generated",
  "react-frontend-scenarios.generated.json"
);

async function main() {
  const files = await listScenarioFiles(scenariosRoot);
  const scenarios = [];

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const metadata = parseScenarioFile(filePath, source);
    if (metadata) scenarios.push(metadata);
  }

  scenarios.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile) || a.name.localeCompare(b.name));

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), scenarios }, null, 2)}\n`,
    "utf8"
  );

  process.stdout.write(`Wrote ${scenarios.length} scenarios to ${path.relative(repoRoot, outputPath)}\n`);
}

async function listScenarioFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listScenarioFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".spec.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseScenarioFile(filePath, source) {
  const describeMatch = source.match(/test\.describe(?:\.serial)?\(\s*"([^"]+)"/);
  const tags = extractTags(source);
  const relativePath = path.relative(scenariosRoot, filePath);
  const sourceFile = path.basename(filePath);
  const suite = relativePath.split(path.sep)[0] ?? "unknown";

  if (!tags.scenario) return null;
  if (!describeMatch) {
    throw new Error(`Could not find test.describe title in ${relativePath}`);
  }

  return {
    id: tags.scenario,
    name: describeMatch[1].trim(),
    suite,
    project: suite,
    layer: tags.layer ?? suite,
    sourceProject: "react-frontend",
    sourceFile,
    relativePath: toPosix(relativePath),
    entry: `src/tests/e2e/scenarios/${toPosix(relativePath)}`,
    description: [tags.precondition, tags.actions, tags.assertions]
      .filter(Boolean)
      .join(" / "),
    precondition: tags.precondition ?? "",
    actions: tags.actions ?? "",
    assertions: tags.assertions ?? "",
    steps: extractTestTitles(source),
  };
}

function extractTags(source) {
  const tags = {};
  const tagRegex = /^\s*\*\s*@([a-z-]+)\s+(.+)$/gm;

  for (const match of source.matchAll(tagRegex)) {
    tags[match[1]] = match[2].trim();
  }

  return tags;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function extractTestTitles(source) {
  const titles = [];
  const testRegex = /test\(\s*"([^"]+)"/g;

  for (const match of source.matchAll(testRegex)) {
    titles.push(match[1].trim());
  }

  return titles;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
