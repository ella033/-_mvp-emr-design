/**
 * Step 4: TC 스키마 JSON 생성
 *
 * graph.json을 기반으로 테스트 케이스 스키마를 자동 생성한다.
 * confidence: high(코드에서 명확히 확인) / medium(추론 포함) / low(도메인 지식 필요)
 *
 * Usage: npx tsx scripts/generate-tc.ts
 */

import * as fs from "fs";
import * as path from "path";

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

interface TCStep {
  step: number;
  page: string;
  action: string;
  target_component: string;
  input?: string;
}

interface TCAssertion {
  component: string;
  expected: string;
}

interface TCSchema {
  tc_id: string;
  type: "unit" | "e2e_flow";
  title: string;
  confidence: "high" | "medium" | "low";
  assumption: string;
  preconditions: string[];
  flow: TCStep[];
  assertions: TCAssertion[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getNodeById(graph: ComponentGraph, id: string): GraphNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}

function getEdgesFrom(graph: ComponentGraph, sourceId: string): GraphEdge[] {
  return graph.edges.filter((e) => e.source === sourceId);
}

function getEdgesTo(graph: ComponentGraph, targetId: string): GraphEdge[] {
  return graph.edges.filter((e) => e.target === targetId);
}

function getChildren(graph: ComponentGraph, parentId: string): GraphNode[] {
  const childEdges = graph.edges.filter(
    (e) => e.source === parentId && e.label === "has"
  );
  return childEdges
    .map((e) => getNodeById(graph, e.target))
    .filter((n): n is GraphNode => n !== undefined);
}

let tcCounter = 0;
function nextTcId(prefix: string): string {
  tcCounter++;
  return `TC-${prefix}-${String(tcCounter).padStart(3, "0")}`;
}

// ─── TC Generators ──────────────────────────────────────────────────────────

function generatePageNavigationTCs(graph: ComponentGraph): TCSchema[] {
  const tcs: TCSchema[] = [];

  // Find all navigation edges
  const navEdges = graph.edges.filter((e) => e.label === "navigates");

  for (const edge of navEdges) {
    const sourceNode = getNodeById(graph, edge.source);
    const targetNode = getNodeById(graph, edge.target);
    if (!sourceNode || !targetNode) continue;

    // Find the page containing the source
    let sourcePage = sourceNode;
    if (sourceNode.type !== "page") {
      const parentEdge = graph.edges.find(
        (e) => e.target === sourceNode.id && e.label === "has"
      );
      if (parentEdge) {
        const parent = getNodeById(graph, parentEdge.source);
        if (parent) sourcePage = parent;
      }
    }

    tcs.push({
      tc_id: nextTcId("NAV"),
      type: "e2e_flow",
      title: `Navigate from ${sourcePage.label} to ${targetNode.label}`,
      confidence: "high",
      assumption: "",
      preconditions: [`User is on ${sourcePage.label} page`, "User is authenticated"],
      flow: [
        {
          step: 1,
          page: sourcePage.label,
          action: "click",
          target_component: sourceNode.dataTestId ?? sourceNode.id,
        },
        {
          step: 2,
          page: targetNode.label,
          action: "verify_navigation",
          target_component: targetNode.id,
        },
      ],
      assertions: [
        {
          component: "url",
          expected: `URL should contain "${targetNode.label}"`,
        },
        {
          component: targetNode.id,
          expected: "Page should be visible and loaded",
        },
      ],
    });
  }

  return tcs;
}

function generateModalOpenTCs(graph: ComponentGraph): TCSchema[] {
  const tcs: TCSchema[] = [];

  // Find all "opens" edges
  const openEdges = graph.edges.filter((e) => e.label === "opens");

  for (const edge of openEdges) {
    const trigger = getNodeById(graph, edge.source);
    const modal = getNodeById(graph, edge.target);
    if (!trigger || !modal) continue;

    // Find parent page
    let parentPage: GraphNode | undefined;
    const parentEdge = graph.edges.find(
      (e) => e.target === trigger.id && e.label === "has"
    );
    if (parentEdge) {
      parentPage = getNodeById(graph, parentEdge.source);
    }

    tcs.push({
      tc_id: nextTcId("MOD"),
      type: "unit",
      title: `Open modal "${modal.label}" via ${trigger.label}`,
      confidence: "high",
      assumption: "",
      preconditions: [
        parentPage ? `User is on ${parentPage.label}` : "User is on the relevant page",
        "User is authenticated",
      ],
      flow: [
        {
          step: 1,
          page: parentPage?.label ?? "current",
          action: "click",
          target_component: trigger.dataTestId ?? trigger.id,
        },
        {
          step: 2,
          page: parentPage?.label ?? "current",
          action: "verify_visible",
          target_component: modal.id,
        },
      ],
      assertions: [
        {
          component: modal.id,
          expected: "Modal should be visible",
        },
        {
          component: modal.id,
          expected: `Modal title should contain "${modal.label}"`,
        },
      ],
    });
  }

  return tcs;
}

function generateFormInputTCs(graph: ComponentGraph): TCSchema[] {
  const tcs: TCSchema[] = [];

  // Find pages/components with inputs
  const pages = graph.nodes.filter((n) => n.type === "page");

  for (const page of pages) {
    const children = getChildren(graph, page.id);
    const inputs = children.filter((c) => c.type === "input");
    const buttons = children.filter((c) => c.type === "button");

    if (inputs.length === 0) continue;

    // Generate form fill + submit TC
    const submitButton = buttons.find(
      (b) =>
        b.label.toLowerCase().includes("submit") ||
        b.label.toLowerCase().includes("save") ||
        b.label.toLowerCase().includes("확인") ||
        b.label.toLowerCase().includes("저장") ||
        b.label.toLowerCase().includes("등록")
    );

    const flow: TCStep[] = inputs.map((input, i) => ({
      step: i + 1,
      page: page.label,
      action: input.inputType === "checkbox" || input.inputType === "switch" ? "check" : "fill",
      target_component: input.dataTestId ?? input.id,
      input: input.inputType === "checkbox" ? "true" : `test-${input.inputType ?? "text"}-value`,
    }));

    if (submitButton) {
      flow.push({
        step: flow.length + 1,
        page: page.label,
        action: "click",
        target_component: submitButton.dataTestId ?? submitButton.id,
      });
    }

    // Determine confidence based on whether we have a submit button
    const confidence: TCSchema["confidence"] = submitButton ? "medium" : "low";
    const assumption = submitButton
      ? "Form submission triggers API call. Expected response needs manual verification."
      : "No clear submit button found. Form interaction pattern needs manual review.";

    tcs.push({
      tc_id: nextTcId("FRM"),
      type: inputs.length > 2 ? "e2e_flow" : "unit",
      title: `Fill form on ${page.label} (${inputs.length} inputs)`,
      confidence,
      assumption,
      preconditions: [`User is on ${page.label}`, "User is authenticated"],
      flow,
      assertions: inputs.map((input) => ({
        component: input.dataTestId ?? input.id,
        expected: `Input should accept ${input.inputType ?? "text"} value`,
      })),
    });
  }

  return tcs;
}

function generateButtonClickTCs(graph: ComponentGraph): TCSchema[] {
  const tcs: TCSchema[] = [];

  // For buttons that don't navigate or open modals, generate basic click TCs
  const navSources = new Set(
    graph.edges.filter((e) => e.label === "navigates").map((e) => e.source)
  );
  const openSources = new Set(
    graph.edges.filter((e) => e.label === "opens").map((e) => e.source)
  );

  const standaloneButtons = graph.nodes.filter(
    (n) => n.type === "button" && !navSources.has(n.id) && !openSources.has(n.id)
  );

  for (const button of standaloneButtons) {
    // Find parent
    const parentEdge = graph.edges.find(
      (e) => e.target === button.id && e.label === "has"
    );
    const parent = parentEdge ? getNodeById(graph, parentEdge.source) : undefined;

    tcs.push({
      tc_id: nextTcId("BTN"),
      type: "unit",
      title: `Click "${button.label}" on ${parent?.label ?? "unknown"}`,
      confidence: "low",
      assumption:
        "Button click effect is not determinable from static analysis. Requires runtime or domain knowledge to verify expected behavior.",
      preconditions: [
        parent ? `User is on ${parent.label}` : "User is on the relevant page",
        "User is authenticated",
      ],
      flow: [
        {
          step: 1,
          page: parent?.label ?? "current",
          action: "click",
          target_component: button.dataTestId ?? button.id,
        },
      ],
      assertions: [
        {
          component: button.dataTestId ?? button.id,
          expected: "Button should be clickable and produce expected effect",
        },
      ],
    });
  }

  return tcs;
}

function generatePageLoadTCs(graph: ComponentGraph): TCSchema[] {
  const tcs: TCSchema[] = [];
  const pages = graph.nodes.filter((n) => n.type === "page");

  for (const page of pages) {
    const children = getChildren(graph, page.id);

    tcs.push({
      tc_id: nextTcId("PG"),
      type: "unit",
      title: `Page load: ${page.label}`,
      confidence: "high",
      assumption: "",
      preconditions: ["User is authenticated", "Backend API is running"],
      flow: [
        {
          step: 1,
          page: page.label,
          action: "navigate",
          target_component: page.id,
        },
        {
          step: 2,
          page: page.label,
          action: "wait_for_load",
          target_component: page.id,
        },
      ],
      assertions: [
        {
          component: "url",
          expected: `URL should match "${page.label}"`,
        },
        {
          component: page.id,
          expected: `Page should render without errors. Expected ${children.length} child components.`,
        },
      ],
    });
  }

  return tcs;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const graphPath = path.resolve(__dirname, "../output/graph.json");
  const outputPath = path.resolve(__dirname, "../output/tc-schema.json");

  if (!fs.existsSync(graphPath)) {
    console.error("❌ graph.json not found. Run extract-graph.ts first.");
    process.exit(1);
  }

  const graph: ComponentGraph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));
  console.log(`\n📊 Loaded graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

  // Generate TCs
  const allTCs: TCSchema[] = [
    ...generatePageLoadTCs(graph),
    ...generatePageNavigationTCs(graph),
    ...generateModalOpenTCs(graph),
    ...generateFormInputTCs(graph),
    ...generateButtonClickTCs(graph),
  ];

  // Stats
  const byConfidence = {
    high: allTCs.filter((tc) => tc.confidence === "high").length,
    medium: allTCs.filter((tc) => tc.confidence === "medium").length,
    low: allTCs.filter((tc) => tc.confidence === "low").length,
  };

  const byType = {
    unit: allTCs.filter((tc) => tc.type === "unit").length,
    e2e_flow: allTCs.filter((tc) => tc.type === "e2e_flow").length,
  };

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(allTCs, null, 2), "utf-8");

  console.log("\n" + "─".repeat(60));
  console.log(`  📋 Total TCs: ${allTCs.length}`);
  console.log(`  ── By Confidence ──`);
  console.log(`    🟢 high:   ${byConfidence.high} (auto-convertible)`);
  console.log(`    🟡 medium: ${byConfidence.medium} (needs review)`);
  console.log(`    🔴 low:    ${byConfidence.low} (needs manual input)`);
  console.log(`  ── By Type ──`);
  console.log(`    unit:     ${byType.unit}`);
  console.log(`    e2e_flow: ${byType.e2e_flow}`);
  console.log("─".repeat(60));
  console.log(`\n✅ TC schema written to: ${outputPath}\n`);
}

main().catch(console.error);
