"use client";

import React, { useRef, useCallback } from "react";
import type { BoxNode, LayoutNode } from "../types";
import { PanelNodeComponent } from "./PanelNode";
import { Splitter } from "./Splitter";
import { useDockStore } from "./DockWorkspace";

interface BoxNodeProps {
  node: BoxNode;
}

export const BoxNodeComponent = React.memo(function BoxNodeComponent({
  node,
}: BoxNodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const resizeSplit = useDockStore((s) => s.resizeSplit);

  const handleSplitterDrag = useCallback(
    (childIndex: number, pixelDelta: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const totalSize =
        node.mode === "horizontal" ? rect.width : rect.height;
      resizeSplit(node.id, childIndex, pixelDelta, totalSize);
    },
    [node.id, node.mode, resizeSplit]
  );

  return (
    <div
      ref={containerRef}
      className="dock-box"
      data-mode={node.mode}
      data-box-id={node.id}
    >
      {node.children.map((child, index) => (
        <React.Fragment key={child.id}>
          <div
            className="dock-box-child"
            style={{ flex: node.sizes[index] ?? 1 }}
          >
            <LayoutNodeRenderer node={child} />
          </div>
          {index < node.children.length - 1 && (
            <Splitter
              direction={node.mode}
              childIndex={index}
              onDrag={handleSplitterDrag}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

// ===== Internal Node Renderer =====

const LayoutNodeRenderer = React.memo(function LayoutNodeRenderer({
  node,
}: {
  node: LayoutNode;
}) {
  if (node.type === "box") {
    return <BoxNodeComponent node={node} />;
  }
  return <PanelNodeComponent node={node} />;
});
