/**
 * Step 2: 컴포넌트 스키마 JSON 추출
 *
 * react-frontend/src 내 모든 tsx 파일에서
 * Page, Modal, Button, Input, Component 관계를 추출하여
 * graph.json으로 출력한다.
 *
 * Usage: npx tsx scripts/extract-graph.ts
 */

import { Project, SyntaxKind, SourceFile, Node } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: "page" | "modal" | "button" | "input" | "component";
  file: string;
  parent: string | null;
  inputType?: string;
  dataTestId?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: "opens" | "navigates" | "triggers" | "has" | "depends";
}

interface ComponentGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    generatedAt: string;
    sourceDir: string;
    totalFiles: number;
  };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MODAL_COMPONENTS = new Set([
  "Dialog",
  "AlertDialog",
  "Sheet",
  "MyPopup",
  "DialogContent",
  "AlertDialogContent",
  "SheetContent",
]);

const BUTTON_COMPONENTS = new Set([
  "Button",
  "AlertDialogAction",
  "AlertDialogCancel",
  "DialogClose",
]);

const INPUT_COMPONENTS = new Set([
  "Input",
  "Textarea",
  "Select",
  "Checkbox",
  "RadioGroup",
  "Switch",
  "InputNumber",
  "InputDate",
  "InputDateRange",
  "InputPassword",
  "RrnInput",
  "MultiSelect",
  "MultiSelectDropdown",
  "TextBox",
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

const nodeMap = new Map<string, GraphNode>();
const edges: GraphEdge[] = [];
const fileComponentMap = new Map<string, string>(); // filePath -> main component id

function toKebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function makeId(prefix: string, name: string): string {
  return `${prefix}:${toKebab(name)}`;
}

function addNode(node: GraphNode): void {
  if (!nodeMap.has(node.id)) {
    nodeMap.set(node.id, node);
  }
}

function addEdge(edge: GraphEdge): void {
  // Deduplicate
  const key = `${edge.source}->${edge.target}:${edge.label}`;
  if (!edges.some((e) => `${e.source}->${e.target}:${e.label}` === key)) {
    edges.push(edge);
  }
}

function getRelPath(filePath: string, srcDir: string): string {
  return path.relative(srcDir, filePath);
}

// ─── Extractors ─────────────────────────────────────────────────────────────

function isPageFile(filePath: string): boolean {
  return filePath.endsWith("/page.tsx") && filePath.includes("/app/");
}

function isLayoutFile(filePath: string): boolean {
  return filePath.endsWith("/layout.tsx") && filePath.includes("/app/");
}

function getPageRoute(filePath: string, srcDir: string): string {
  const rel = path.relative(path.join(srcDir, "app"), filePath);
  let route = "/" + path.dirname(rel).replace(/\\/g, "/");
  // Remove route groups like (dashboard), (demo)
  route = route.replace(/\/\([^)]+\)/g, "");
  if (route === "/.") route = "/";
  return route;
}

function getExportedComponentName(sourceFile: SourceFile): string | null {
  // Look for default export or named export
  const defaultExport = sourceFile.getDefaultExportSymbol();
  if (defaultExport) {
    return defaultExport.getName() === "default"
      ? sourceFile.getBaseName().replace(".tsx", "")
      : defaultExport.getName();
  }

  // Look for named exports (function components)
  for (const fn of sourceFile.getFunctions()) {
    if (fn.isExported()) return fn.getName() ?? null;
  }
  for (const varDecl of sourceFile.getVariableDeclarations()) {
    if (varDecl.isExported()) return varDecl.getName();
  }
  return null;
}

function extractImports(sourceFile: SourceFile, srcDir: string): Map<string, string> {
  const importMap = new Map<string, string>(); // importedName -> resolvedFilePath

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    // Only track local imports
    if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("@/")) continue;

    let resolvedPath: string;
    try {
      const resolved = importDecl.getModuleSpecifierSourceFile();
      if (!resolved) continue;
      resolvedPath = resolved.getFilePath();
    } catch {
      continue;
    }

    // Collect all imported names
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      importMap.set(defaultImport.getText(), resolvedPath);
    }
    for (const named of importDecl.getNamedImports()) {
      importMap.set(named.getName(), resolvedPath);
    }
  }

  return importMap;
}

function extractRouterNavigations(sourceFile: SourceFile): string[] {
  const routes: string[] = [];
  const text = sourceFile.getFullText();

  // Match router.push("...") and router.replace("...")
  const routerPushRegex = /router\.(push|replace)\(\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = routerPushRegex.exec(text)) !== null) {
    routes.push(match[2]);
  }

  // Match Link href="..."
  const linkHrefRegex = /<Link\s[^>]*href=["'`{](?:["'`])([^"'`}]+)["'`]/g;
  while ((match = linkHrefRegex.exec(text)) !== null) {
    routes.push(match[1]);
  }

  return routes;
}

// Check if a file/component is itself a modal wrapper (filename contains modal/popup/dialog)
function isModalFile(filePath: string): boolean {
  const name = path.basename(filePath, ".tsx").toLowerCase();
  return /modal|popup|dialog|sheet|drawer/.test(name);
}

function extractJsxElements(
  sourceFile: SourceFile,
  srcDir: string,
  parentId: string,
  filePath: string
): void {
  const baseName = path.basename(filePath, ".tsx");
  const relFile = getRelPath(filePath, srcDir);
  const counters: Record<string, number> = {};
  // If this file IS a modal component, all its children are "opens"
  const fileIsModal = isModalFile(filePath);

  function getCounter(tag: string): number {
    counters[tag] = (counters[tag] ?? 0) + 1;
    return counters[tag];
  }

  // Helper: check if a JSX element is nested inside a Modal component
  function isInsideModal(node: Node): boolean {
    let current = node.getParent();
    while (current) {
      if (Node.isJsxElement(current) || Node.isJsxSelfClosingElement(current)) {
        const opening = Node.isJsxElement(current) ? current.getOpeningElement() : current;
        const tag = opening.getTagNameNode().getText();
        if (MODAL_COMPONENTS.has(tag)) return true;
      }
      current = current.getParent();
    }
    return false;
  }

  // Helper: find the nearest parent Modal's node id
  function findParentModalId(node: Node): string | null {
    let current = node.getParent();
    while (current) {
      if (Node.isJsxElement(current) || Node.isJsxSelfClosingElement(current)) {
        const opening = Node.isJsxElement(current) ? current.getOpeningElement() : current;
        const tag = opening.getTagNameNode().getText();
        if (MODAL_COMPONENTS.has(tag)) {
          // Find matching modal node id in our nodeMap
          for (const [id, n] of nodeMap) {
            if (n.type === "modal" && n.file === relFile && id.includes(toKebab(tag))) {
              return id;
            }
          }
        }
      }
      current = current.getParent();
    }
    return null;
  }

  // Extract JSX opening + self-closing elements
  const allJsx = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  for (const el of allJsx) {
    const tagName = el.getTagNameNode().getText();

    // ── Buttons ──
    if (BUTTON_COMPONENTS.has(tagName)) {
      const idx = getCounter(tagName);
      const nodeId = makeId(parentId, `${tagName}-${idx}`);

      // Try to get button text
      let label = tagName;
      if (el.getKind() === SyntaxKind.JsxOpeningElement) {
        const parent = el.getParent();
        if (parent && Node.isJsxElement(parent)) {
          const children = parent.getJsxChildren();
          const textParts = children
            .filter(Node.isJsxText)
            .map((t) => t.getText().trim())
            .filter(Boolean);
          if (textParts.length > 0) label = textParts.join(" ");
        }
      }

      // Get data-testid if present
      const testIdAttr = el.getAttribute("data-testid");
      const testId = testIdAttr && Node.isJsxAttribute(testIdAttr)
        ? testIdAttr.getInitializer()?.getText().replace(/['"]/g, "")
        : undefined;

      // Determine if this button is inside a modal (JSX nesting or file-level modal)
      const insideModal = fileIsModal || isInsideModal(el);
      const modalParentId = !fileIsModal ? findParentModalId(el) : null;
      const effectiveParent = modalParentId ?? parentId;

      addNode({
        id: nodeId,
        label,
        type: "button",
        file: relFile,
        parent: effectiveParent,
        dataTestId: testId,
      });
      addEdge({
        source: effectiveParent,
        target: nodeId,
        label: insideModal ? "opens" : "has",
      });

      // Check onClick for triggers/navigates
      const onClickAttr = el.getAttribute("onClick");
      if (onClickAttr && Node.isJsxAttribute(onClickAttr)) {
        const init = onClickAttr.getInitializer();
        if (init) {
          const onClickText = init.getText();

          // Check for router.push/replace
          const routerMatch = onClickText.match(/router\.(push|replace)\(\s*["'`]([^"'`]+)["'`]/);
          if (routerMatch) {
            const targetRoute = routerMatch[2];
            const targetPageId = `page:${targetRoute === "/" ? "home" : targetRoute.replace(/^\//, "").replace(/\//g, "-")}`;
            addEdge({ source: nodeId, target: targetPageId, label: "navigates" });
          }

          // Check for setState that opens modal (set*Open, set*Visible, set*Show)
          const modalStateMatch = onClickText.match(/set\w*(Open|Visible|Show|Modal|Dialog|Sheet)\w*\(\s*true/i);
          if (modalStateMatch) {
            addEdge({ source: nodeId, target: `${parentId}:modal`, label: "opens" });
          }
        }
      }
    }

    // ── Inputs ──
    if (INPUT_COMPONENTS.has(tagName)) {
      const idx = getCounter(tagName);
      const nodeId = makeId(parentId, `${tagName}-${idx}`);

      // Get input type
      const typeAttr = el.getAttribute("type");
      const inputType = typeAttr && Node.isJsxAttribute(typeAttr)
        ? typeAttr.getInitializer()?.getText().replace(/['"]/g, "")
        : tagName === "Textarea" ? "textarea"
        : tagName === "Checkbox" ? "checkbox"
        : tagName === "Switch" ? "switch"
        : tagName === "Select" || tagName === "MultiSelect" ? "select"
        : "text";

      // Get label from multiple sources (priority order)
      function getStringAttr(attrName: string): string | undefined {
        const attr = el.getAttribute(attrName);
        if (attr && Node.isJsxAttribute(attr)) {
          const init = attr.getInitializer();
          if (!init) return undefined;
          const text = init.getText().replace(/^['"`]|['"`]$/g, "");
          // Skip dynamic expressions like {variable}
          if (text.startsWith("{") || text.includes("?")) return undefined;
          return text || undefined;
        }
        return undefined;
      }

      const labelAttr = getStringAttr("label");
      const nameAttr = getStringAttr("name");
      const ariaLabel = getStringAttr("aria-label");
      const placeholder = getStringAttr("placeholder");

      // Try to find adjacent <Label> sibling
      let siblingLabel: string | undefined;
      const parentNode = el.getParent();
      if (parentNode && (Node.isJsxElement(parentNode) || Node.isJsxFragment(parentNode))) {
        const siblings = parentNode.getJsxChildren();
        const elIndex = siblings.indexOf(el as any);
        // Check previous siblings for Label text
        for (let si = Math.max(0, elIndex - 3); si < elIndex; si++) {
          const sib = siblings[si];
          if (Node.isJsxElement(sib)) {
            const sibTag = sib.getOpeningElement().getTagNameNode().getText();
            if (sibTag === "Label" || sibTag === "label" || sibTag === "FormLabel") {
              const labelText = sib.getJsxChildren()
                .filter(Node.isJsxText)
                .map((t) => t.getText().trim())
                .filter(Boolean)
                .join(" ");
              if (labelText) siblingLabel = labelText;
            }
          }
        }
      }

      // Priority: label prop > name prop > aria-label > sibling Label > placeholder > tag name
      const inputLabel = labelAttr ?? nameAttr ?? ariaLabel ?? siblingLabel ?? placeholder ?? tagName;

      const testIdAttr = el.getAttribute("data-testid");
      const testId = testIdAttr && Node.isJsxAttribute(testIdAttr)
        ? testIdAttr.getInitializer()?.getText().replace(/['"]/g, "")
        : undefined;

      // Determine if this input is inside a modal (JSX nesting or file-level modal)
      const insideModal = fileIsModal || isInsideModal(el);
      const modalParentId = !fileIsModal ? findParentModalId(el) : null;
      const effectiveParent = modalParentId ?? parentId;

      addNode({
        id: nodeId,
        label: inputLabel,
        type: "input",
        file: relFile,
        parent: effectiveParent,
        inputType,
        dataTestId: testId,
      });
      addEdge({
        source: effectiveParent,
        target: nodeId,
        label: insideModal ? "opens" : "has",
      });
    }

    // ── Modals ──
    if (MODAL_COMPONENTS.has(tagName)) {
      const idx = getCounter(tagName);
      const nodeId = makeId(parentId, `${tagName}-${idx}`);

      // Try to find title
      let modalLabel = tagName;
      if (el.getKind() === SyntaxKind.JsxOpeningElement) {
        const parent = el.getParent();
        if (parent && Node.isJsxElement(parent)) {
          const text = parent.getFullText();
          const titleMatch = text.match(/<(?:Dialog|AlertDialog|Sheet)Title[^>]*>([^<]+)</);
          if (titleMatch) modalLabel = titleMatch[1].trim();
        }
      }

      // Check for title prop (MyPopup)
      const titleAttr = el.getAttribute("title");
      if (titleAttr && Node.isJsxAttribute(titleAttr)) {
        const val = titleAttr.getInitializer()?.getText().replace(/['"]/g, "");
        if (val) modalLabel = val;
      }

      addNode({
        id: nodeId,
        label: modalLabel,
        type: "modal",
        file: relFile,
        parent: parentId,
      });
      addEdge({ source: parentId, target: nodeId, label: "has" });
    }
  }
}

function processFile(sourceFile: SourceFile, srcDir: string): void {
  const filePath = sourceFile.getFilePath();
  const relFile = getRelPath(filePath, srcDir);
  const baseName = path.basename(filePath, ".tsx");

  // Skip UI component definitions
  if (filePath.includes("/components/ui/")) return;
  // Skip test files
  if (filePath.includes(".test.") || filePath.includes(".spec.")) return;

  const isPage = isPageFile(filePath);
  const componentName = getExportedComponentName(sourceFile) ?? baseName;

  // ── Create Node ──
  let nodeType: GraphNode["type"] = "component";
  let nodeId: string;
  let label: string;

  if (isPage) {
    const route = getPageRoute(filePath, srcDir);
    nodeId = `page:${route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-")}`;
    label = route;
    nodeType = "page";
  } else {
    nodeId = `component:${toKebab(componentName)}`;
    label = componentName;
    nodeType = "component";
  }

  addNode({
    id: nodeId,
    label,
    type: nodeType,
    file: relFile,
    parent: null,
  });

  fileComponentMap.set(filePath, nodeId);

  // ── Extract imports → depends/has edges ──
  const imports = extractImports(sourceFile, srcDir);
  for (const [importName, importPath] of imports) {
    // Skip node_modules
    if (!importPath.includes(srcDir)) continue;

    const importRel = getRelPath(importPath, srcDir);
    const importBaseName = path.basename(importPath, ".tsx");
    const importedId = fileComponentMap.get(importPath) ?? `component:${toKebab(importBaseName)}`;

    // If importing a component, add "has" edge
    if (importPath.endsWith(".tsx") && !importPath.includes("/ui/")) {
      addEdge({ source: nodeId, target: importedId, label: "has" });
    }
  }

  // ── Extract router navigations ──
  const navigations = extractRouterNavigations(sourceFile);
  for (const route of navigations) {
    // Skip dynamic routes and external URLs
    if (route.includes("${") || route.startsWith("http")) continue;

    const targetId = `page:${route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-")}`;
    addEdge({ source: nodeId, target: targetId, label: "navigates" });
  }

  // ── Extract JSX elements (buttons, inputs, modals) ──
  extractJsxElements(sourceFile, srcDir, nodeId, filePath);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const srcDir = path.resolve(__dirname, "../src");
  const outputPath = path.resolve(__dirname, "../output/graph.json");

  console.log(`\n🔍 Scanning: ${srcDir}`);

  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, "../tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  project.addSourceFilesAtPaths(`${srcDir}/**/*.tsx`);

  const sourceFiles = project.getSourceFiles();
  console.log(`📂 Found ${sourceFiles.length} .tsx files\n`);

  // First pass: register all files in fileComponentMap
  for (const sf of sourceFiles) {
    const fp = sf.getFilePath();
    if (fp.includes("/components/ui/")) continue;
    if (fp.includes(".test.") || fp.includes(".spec.")) continue;

    const bn = path.basename(fp, ".tsx");
    const cn = getExportedComponentName(sf) ?? bn;
    const isPage = isPageFile(fp);

    if (isPage) {
      const route = getPageRoute(fp, srcDir);
      const id = `page:${route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-")}`;
      fileComponentMap.set(fp, id);
    } else {
      fileComponentMap.set(fp, `component:${toKebab(cn)}`);
    }
  }

  // Second pass: full extraction
  for (const sf of sourceFiles) {
    processFile(sf, srcDir);
  }

  // Build graph
  const graph: ComponentGraph = {
    nodes: [...nodeMap.values()],
    edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceDir: srcDir,
      totalFiles: sourceFiles.length,
    },
  };

  // Write output
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2), "utf-8");

  console.log("─".repeat(60));
  console.log(`  📊 Nodes: ${graph.nodes.length}`);
  console.log(`    - Pages: ${graph.nodes.filter((n) => n.type === "page").length}`);
  console.log(`    - Components: ${graph.nodes.filter((n) => n.type === "component").length}`);
  console.log(`    - Buttons: ${graph.nodes.filter((n) => n.type === "button").length}`);
  console.log(`    - Inputs: ${graph.nodes.filter((n) => n.type === "input").length}`);
  console.log(`    - Modals: ${graph.nodes.filter((n) => n.type === "modal").length}`);
  console.log(`  🔗 Edges: ${graph.edges.length}`);
  console.log(`    - has: ${graph.edges.filter((e) => e.label === "has").length}`);
  console.log(`    - navigates: ${graph.edges.filter((e) => e.label === "navigates").length}`);
  console.log(`    - opens: ${graph.edges.filter((e) => e.label === "opens").length}`);
  console.log(`    - triggers: ${graph.edges.filter((e) => e.label === "triggers").length}`);
  console.log(`    - depends: ${graph.edges.filter((e) => e.label === "depends").length}`);
  console.log("─".repeat(60));
  console.log(`\n✅ Graph written to: ${outputPath}\n`);
}

main().catch(console.error);
