"use client";

import React, { useCallback, useRef } from "react";

interface SplitterProps {
  direction: "horizontal" | "vertical";
  childIndex: number;
  onDrag: (childIndex: number, pixelDelta: number) => void;
}

export const Splitter = React.memo(function Splitter({
  direction,
  childIndex,
  onDrag,
}: SplitterProps) {
  const startPosRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startPos =
        direction === "horizontal" ? e.clientX : e.clientY;
      startPosRef.current = startPos;

      // Set body cursor and disable text selection
      document.body.style.cursor =
        direction === "horizontal" ? "ew-resize" : "ns-resize";
      document.body.style.userSelect = "none";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
          const currentPos =
            direction === "horizontal"
              ? moveEvent.clientX
              : moveEvent.clientY;
          const delta = currentPos - startPosRef.current;
          startPosRef.current = currentPos;
          onDrag(childIndex, delta);
        });
      };

      const handlePointerUp = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [direction, childIndex, onDrag]
  );

  return (
    <div
      className={`dock-splitter dock-splitter--${direction}`}
      onPointerDown={handlePointerDown}
    />
  );
});
