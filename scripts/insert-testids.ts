/**
 * Step 1: data-testid 자동 삽입
 *
 * Button, Input, Select, Dialog(Modal) 태그에 data-testid가 없으면
 * "{파일명}-{태그명}-{순번}" 형식으로 자동 삽입한다.
 *
 * Usage: npx tsx scripts/insert-testids.ts [--dry-run]
 */

import { Project, SyntaxKind, JsxOpeningElement, JsxSelfClosingElement } from "ts-morph";
import * as path from "path";

const TARGET_TAGS = new Set([
  "Button",
  "Input",
  "Select",
  "Dialog",
  "DialogTrigger",
  "DialogContent",
  "AlertDialog",
  "AlertDialogTrigger",
  "AlertDialogContent",
  "AlertDialogAction",
  "AlertDialogCancel",
  "Textarea",
  "Checkbox",
  "RadioGroup",
  "Switch",
  "Sheet",
  "SheetTrigger",
  "SheetContent",
]);

interface InsertResult {
  file: string;
  inserted: number;
  skipped: number;
}

const dryRun = process.argv.includes("--dry-run");

function getTagName(node: JsxOpeningElement | JsxSelfClosingElement): string | null {
  const tagNameNode = node.getTagNameNode();
  const text = tagNameNode.getText();
  // Only target known component names (PascalCase)
  if (TARGET_TAGS.has(text)) return text;
  return null;
}

function hasTestId(node: JsxOpeningElement | JsxSelfClosingElement): boolean {
  return node.getAttributes().some((attr) => {
    if (attr.getKind() === SyntaxKind.JsxAttribute) {
      const name = attr.getChildAtIndex(0)?.getText();
      return name === "data-testid";
    }
    return false;
  });
}

function toKebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function processFile(filePath: string, sourceFile: ReturnType<Project["addSourceFileAtPath"]>): InsertResult {
  const baseName = path.basename(filePath, path.extname(filePath));
  const tagCounters: Record<string, number> = {};
  let inserted = 0;
  let skipped = 0;

  // Collect all JSX elements (opening + self-closing)
  const jsxOpenings = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
  const jsxSelfClosings = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  const allElements = [...jsxOpenings, ...jsxSelfClosings];

  for (const element of allElements) {
    const tagName = getTagName(element);
    if (!tagName) continue;

    if (hasTestId(element)) {
      skipped++;
      continue;
    }

    // Increment counter for this tag type
    const key = tagName;
    tagCounters[key] = (tagCounters[key] ?? 0) + 1;
    const index = tagCounters[key];

    const testId = `${baseName}-${toKebab(tagName)}-${index}`;

    // Insert data-testid attribute
    const attrs = element.getAttributes();
    if (attrs.length > 0) {
      // Insert after last attribute
      const lastAttr = attrs[attrs.length - 1];
      lastAttr.replaceWithText(`${lastAttr.getText()} data-testid="${testId}"`);
    } else {
      // No attributes, add to the tag
      const tagText = element.getText();
      const tagNameText = element.getTagNameNode().getText();

      if (element.getKind() === SyntaxKind.JsxSelfClosingElement) {
        // <Button /> -> <Button data-testid="..." />
        const newText = tagText.replace(
          new RegExp(`^(<${tagNameText})`),
          `$1 data-testid="${testId}"`
        );
        element.replaceWithText(newText);
      } else {
        // <Button> -> <Button data-testid="...">
        const newText = tagText.replace(
          new RegExp(`^(<${tagNameText})`),
          `$1 data-testid="${testId}"`
        );
        element.replaceWithText(newText);
      }
    }

    inserted++;
  }

  return { file: filePath, inserted, skipped };
}

async function main() {
  const srcDir = path.resolve(__dirname, "../src");

  console.log(`\n🔍 Scanning: ${srcDir}`);
  console.log(`📋 Target tags: ${[...TARGET_TAGS].join(", ")}`);
  console.log(`🏷️  Mode: ${dryRun ? "DRY RUN (no changes)" : "WRITE"}\n`);

  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, "../tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  // Add all tsx files under src/
  project.addSourceFilesAtPaths(`${srcDir}/**/*.tsx`);

  const sourceFiles = project.getSourceFiles();
  console.log(`📂 Found ${sourceFiles.length} .tsx files\n`);

  const results: InsertResult[] = [];
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    // Skip UI component definitions themselves (they define the components)
    if (filePath.includes("/components/ui/")) continue;

    const result = processFile(filePath, sourceFile);
    if (result.inserted > 0 || result.skipped > 0) {
      results.push(result);
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
    }
  }

  if (!dryRun) {
    await project.save();
  }

  // Print results
  console.log("─".repeat(60));
  for (const r of results) {
    if (r.inserted > 0) {
      const rel = path.relative(srcDir, r.file);
      console.log(`  ✅ ${rel}: +${r.inserted} testids (${r.skipped} skipped)`);
    }
  }
  console.log("─".repeat(60));
  console.log(`\n📊 Total: ${totalInserted} inserted, ${totalSkipped} already had testid`);
  console.log(`📂 Files modified: ${results.filter((r) => r.inserted > 0).length}`);

  if (dryRun) {
    console.log("\n⚠️  Dry run - no files were modified. Remove --dry-run to apply changes.\n");
  } else {
    console.log("\n✅ Done! All data-testid attributes inserted.\n");
  }
}

main().catch(console.error);
